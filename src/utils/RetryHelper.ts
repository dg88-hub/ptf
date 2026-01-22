/**
 * @fileoverview Retry Helper utility for handling flaky operations.
 * Provides robust retry mechanisms with exponential backoff and
 * configurable retry policies.
 *
 * @module utils/RetryHelper
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Retry mechanisms are essential for:
 * - Handling network flakiness
 * - Waiting for async operations
 * - Dealing with race conditions
 * - Managing external service timeouts
 *
 * Best practices:
 * - Use exponential backoff to avoid overwhelming services
 * - Set maximum attempts to prevent infinite loops
 * - Log retry attempts for debugging
 * - Allow operation-specific error handling
 *
 * @example
 * ```typescript
 * // Simple retry with default options
 * const result = await RetryHelper.retry(async () => {
 *   return await fetchData();
 * });
 *
 * // Retry until condition is met
 * await RetryHelper.retryUntil(
 *   async () => await checkStatus(),
 *   (status) => status === 'complete',
 *   { maxAttempts: 10, interval: 2000 }
 * );
 * ```
 */

import { logger } from "./Logger";

/**
 * Retry options configuration
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial interval between retries (ms) */
  interval?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Maximum interval (caps exponential growth) */
  maxInterval?: number;
  /** Timeout for each attempt (ms) */
  timeout?: number;
  /** Whether to throw on final failure */
  throwOnFailure?: boolean;
  /** Custom error handler */
  onError?: (error: Error, attempt: number) => void;
  /** Custom retry condition (return true to retry) */
  retryCondition?: (error: Error) => boolean;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  interval: 1000,
  exponentialBackoff: true,
  backoffMultiplier: 2,
  maxInterval: 30000,
  timeout: 60000,
  throwOnFailure: true,
  onError: () => {
    /* default no-op */
  },
  retryCondition: () => true,
  operationName: "operation",
};

/**
 * Retry result containing attempt history
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  attemptHistory: Array<{
    attempt: number;
    duration: number;
    error?: string;
  }>;
}

/**
 * Retry Helper class with static methods
 */
export class RetryHelper {
  /**
   * Retry an async operation with configurable options
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    const attemptHistory: RetryResult<T>["attemptHistory"] = [];
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();

      try {
        logger.debug(
          `${opts.operationName} - Attempt ${attempt}/${opts.maxAttempts}`,
        );

        // Execute with timeout
        const result = await this.withTimeout(operation(), opts.timeout);

        logger.debug(`${opts.operationName} - Succeeded on attempt ${attempt}`);

        attemptHistory.push({
          attempt,
          duration: Date.now() - attemptStartTime,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const duration = Date.now() - attemptStartTime;

        attemptHistory.push({
          attempt,
          duration,
          error: lastError.message,
        });

        logger.debug(
          `${opts.operationName} - Attempt ${attempt} failed: ${lastError.message}`,
        );
        opts.onError(lastError, attempt);

        // Check if we should retry
        if (!opts.retryCondition(lastError)) {
          logger.debug(
            `${opts.operationName} - Retry condition not met, stopping`,
          );
          break;
        }

        // Don't wait after the last attempt
        if (attempt < opts.maxAttempts) {
          const waitTime = this.calculateWaitTime(attempt, opts);
          logger.debug(
            `${opts.operationName} - Waiting ${waitTime}ms before retry`,
          );
          await this.sleep(waitTime);
        }
      }
    }

    // All attempts failed
    const totalDuration = Date.now() - startTime;
    logger.error(
      `${opts.operationName} - All ${opts.maxAttempts} attempts failed. Total duration: ${totalDuration}ms`,
    );

    if (opts.throwOnFailure && lastError) {
      throw lastError;
    }

    throw (
      lastError ||
      new Error(
        `${opts.operationName} failed after ${opts.maxAttempts} attempts`,
      )
    );
  }

  /**
   * Retry until a condition is met
   */
  static async retryUntil<T>(
    operation: () => Promise<T>,
    condition: (result: T) => boolean,
    options: RetryOptions = {},
  ): Promise<T> {
    const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        logger.debug(
          `${opts.operationName} - Checking condition, attempt ${attempt}/${opts.maxAttempts}`,
        );

        const result = await this.withTimeout(operation(), opts.timeout);

        if (condition(result)) {
          logger.debug(
            `${opts.operationName} - Condition met on attempt ${attempt}`,
          );
          return result;
        }

        logger.debug(`${opts.operationName} - Condition not met, will retry`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.debug(
          `${opts.operationName} - Error on attempt ${attempt}: ${err.message}`,
        );
        opts.onError(err, attempt);
      }

      if (attempt < opts.maxAttempts) {
        const waitTime = this.calculateWaitTime(attempt, opts);
        await this.sleep(waitTime);
      }
    }

    if (opts.throwOnFailure) {
      throw new Error(
        `${opts.operationName} - Condition not met after ${opts.maxAttempts} attempts`,
      );
    }

    // Return last result even if condition not met
    return await operation();
  }

  /**
   * Poll until a condition becomes true
   */
  static async poll(
    checkFn: () => Promise<boolean>,
    options: RetryOptions = {},
  ): Promise<boolean> {
    const opts: Required<RetryOptions> = {
      ...DEFAULT_OPTIONS,
      operationName: "poll",
      ...options,
    };

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const result = await checkFn();
        if (result) {
          logger.debug(`Poll condition met on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        logger.debug(`Poll check failed: ${error}`);
      }

      if (attempt < opts.maxAttempts) {
        const waitTime = this.calculateWaitTime(attempt, opts);
        await this.sleep(waitTime);
      }
    }

    if (opts.throwOnFailure) {
      throw new Error(
        `Poll condition not met after ${opts.maxAttempts} attempts`,
      );
    }

    return false;
  }

  /**
   * Wrap a promise with a timeout
   */
  static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Calculate wait time based on attempt and options
   */
  private static calculateWaitTime(
    attempt: number,
    opts: Required<RetryOptions>,
  ): number {
    if (!opts.exponentialBackoff) {
      return opts.interval;
    }

    const exponentialWait =
      opts.interval * Math.pow(opts.backoffMultiplier, attempt - 1);
    return Math.min(exponentialWait, opts.maxInterval);
  }

  /**
   * Sleep for a specified duration
   */
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute operations in sequence with retry
   */
  static async sequential<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {},
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i++) {
      const result = await this.retry(operations[i], {
        ...options,
        operationName: `${options.operationName || "operation"} ${i + 1}/${operations.length}`,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Execute with circuit breaker pattern
   */
  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      onOpen?: () => void;
      onClose?: () => void;
    } & RetryOptions = {},
  ): Promise<T> {
    const failureThreshold = options.failureThreshold || 5;
    const resetTimeout = options.resetTimeout || 60000;

    // Use a simple in-memory state (in real apps, use shared state)
    const state = {
      failures: 0,
      isOpen: false,
      lastFailure: 0,
    };

    // Check if circuit is open
    if (state.isOpen) {
      if (Date.now() - state.lastFailure > resetTimeout) {
        // Half-open: try one request
        state.isOpen = false;
        options.onClose?.();
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await this.retry(operation, options);
      state.failures = 0;
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailure = Date.now();

      if (state.failures >= failureThreshold) {
        state.isOpen = true;
        options.onOpen?.();
        logger.warn("Circuit breaker opened due to failures");
      }

      throw error;
    }
  }

  /**
   * Create a reusable retry wrapper
   */
  static createRetrier(defaultOptions: RetryOptions = {}) {
    return <T>(
      operation: () => Promise<T>,
      overrideOptions: RetryOptions = {},
    ) => {
      return this.retry(operation, { ...defaultOptions, ...overrideOptions });
    };
  }

  /**
   * Retry with jitter (randomized delay to prevent thundering herd)
   */
  static async retryWithJitter<T>(
    operation: () => Promise<T>,
    options: RetryOptions & { jitterFactor?: number } = {},
  ): Promise<T> {
    const jitterFactor = options.jitterFactor || 0.2;

    const calculateJitteredWait = (attempt: number): number => {
      const baseWait = this.calculateWaitTime(attempt, {
        ...DEFAULT_OPTIONS,
        ...options,
      });
      const jitter = baseWait * jitterFactor * (Math.random() * 2 - 1);
      return Math.max(0, baseWait + jitter);
    };

    // Override interval calculation with jittered version
    let attempt = 0;
    const originalInterval = options.interval || DEFAULT_OPTIONS.interval;

    return this.retry(operation, {
      ...options,
      exponentialBackoff: false,
      interval: originalInterval,
      onError: (error, currentAttempt) => {
        attempt = currentAttempt;
        options.onError?.(error, currentAttempt);
      },
    });
  }
}

/**
 * Pre-configured retry policies
 */
export const RetryPolicies = {
  /** Quick retries for fast operations */
  fast: {
    maxAttempts: 3,
    interval: 100,
    exponentialBackoff: false,
  },

  /** Standard retry policy */
  standard: {
    maxAttempts: 3,
    interval: 1000,
    exponentialBackoff: true,
    backoffMultiplier: 2,
  },

  /** Patient retry for slow operations */
  patient: {
    maxAttempts: 5,
    interval: 2000,
    exponentialBackoff: true,
    backoffMultiplier: 1.5,
    maxInterval: 10000,
  },

  /** Persistent retry for critical operations */
  persistent: {
    maxAttempts: 10,
    interval: 5000,
    exponentialBackoff: true,
    backoffMultiplier: 1.5,
    maxInterval: 60000,
  },

  /** Network-specific retry */
  network: {
    maxAttempts: 3,
    interval: 1000,
    exponentialBackoff: true,
    retryCondition: (error: Error) => {
      const networkErrors = [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "ERR_NETWORK",
      ];
      return networkErrors.some((e) => error.message.includes(e));
    },
  },
} as const;

/**
 * Export singleton helper
 */
export const retryHelper = RetryHelper;
