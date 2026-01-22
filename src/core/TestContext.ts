/**
 * @fileoverview Test Context for sharing data between tests.
 * Provides a centralized store for capturing and reusing test outputs
 * across different tests within a session.
 *
 * EDUCATIONAL NOTE: Singleton Pattern
 * This class uses the Singleton design pattern to ensure that only ONE instance of
 * TestContext exists throughout the application's lifecycle. This is crucial for
 * maintaining a consistent state (data store) that can be accessed from any file
 * or test without passing the object around.
 *
 * @module core/TestContext
 * @author DG
 * @version 1.1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/Logger';

/**
 * Test execution metadata
 */
export interface TestMetadata {
  /** Test name */
  testName: string;
  /** Timestamp when data was captured */
  timestamp: Date;
  /** Test file path */
  testFile?: string;
  /** Additional tags */
  tags?: string[];
}

/**
 * Stored test data with metadata
 */
export interface StoredData<T = unknown> {
  /** The actual data value */
  value: T;
  /** Metadata about when/where this was captured */
  metadata: TestMetadata;
}

/**
 * Test Context class for sharing data between tests.
 * Supports both in-memory storage (within a session) and
 * persistent storage (across sessions via JSON files).
 *
 * @example
 * ```typescript
 * // Get the singleton instance (Standard Way)
 * const context = TestContext.getInstance();
 *
 * // Or import the pre-instantiated export (Convenience Way)
 * import { testContext } from './core/TestContext';
 *
 * // Store data
 * testContext.set('user.id', '12345', { testName: 'Create User' });
 *
 * // Retrieve data with type safety
 * const userId = testContext.get<string>('user.id');
 * ```
 */
export class TestContext {
  private static instance: TestContext;
  private store: Map<string, StoredData> = new Map();
  private persistPath: string;

  /**
   * Private constructor prevents direct instantiation with `new TestContext()`.
   * This enforces the Singleton pattern.
   */
  private constructor() {
    this.persistPath = path.resolve(__dirname, '../../test-results/context.json');
    // Load existing data if context file exists
    this.loadPersistedData();
  }

  /**
   * Public static method to get the single instance of the class.
   * Lazily initializes the instance if it doesn't exist.
   *
   * @returns The singleton TestContext instance
   */
  static getInstance(): TestContext {
    if (!TestContext.instance) {
      TestContext.instance = new TestContext();
    }
    return TestContext.instance;
  }

  /**
   * Store a value with a key
   * @param key - Unique identifier (supports dot notation for namespacing)
   * @param value - Value to store
   * @param metadata - Optional metadata about the test storing the data
   */
  set<T>(key: string, value: T, metadata: Partial<TestMetadata> = {}): void {
    const fullMetadata: TestMetadata = {
      testName: metadata.testName || 'Unknown',
      timestamp: new Date(),
      testFile: metadata.testFile,
      tags: metadata.tags,
    };

    this.store.set(key, { value, metadata: fullMetadata });
    logger.debug(`[TestContext] Stored: ${key}`);
  }

  /**
   * Retrieve a value by key with type safety
   * @param key - Key to retrieve
   * @returns Stored value or undefined
   */
  get<T>(key: string): T | undefined {
    const data = this.store.get(key);
    if (data) {
      return data.value as T;
    }
    return undefined;
  }

  /**
   * Get full data object including metadata
   * @param key - Key to retrieve
   */
  getWithMetadata<T>(key: string): StoredData<T> | undefined {
    return this.store.get(key) as StoredData<T> | undefined;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Delete a stored item
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all stored data (Useful for cleanup between test suites)
   */
  clear(): void {
    this.store.clear();
    logger.info('[TestContext] Cleared all data');
  }

  /**
   * Get all keys that match a specific pattern/prefix
   * @param pattern - Regex string or simple prefix
   */
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  /**
   * Get all values that match a specific pattern
   * @param pattern - Regex string
   */
  getByPattern<T>(pattern: string): Map<string, T> {
    const keys = this.getKeysByPattern(pattern);
    const result = new Map<string, T>();
    keys.forEach((key) => {
      const data = this.get<T>(key);
      if (data !== undefined) {
        result.set(key, data);
      }
    });
    return result;
  }

  /**
   * Get all stored data, optionally filtered by prefix
   */
  getAll<T>(prefix: string = ''): Map<string, T> {
    const result = new Map<string, T>();
    this.store.forEach((data, key) => {
      if (key.startsWith(prefix)) {
        result.set(key, data.value as T);
      }
    });
    return result;
  }

  /**
   * Persist current context to a JSON file.
   *
   * ! WARNING: CONCURRENCY ISSUE !
   * This method writes to a single file. If multiple tests run in parallel (workers > 1),
   * they will overwrite each other's data (Race Condition).
   *
   * BEST PRACTICE: Only use this in 'globalSetup' or 'globalTeardown', or when running
   * tests sequentially (workers: 1).
   */
  persist(): void {
    if (process.env.CI && !process.env.ALLOW_CONTEXT_PERSISTENCE) {
      // On CI, we usually want to be careful with file I/O in parallel execution
    }

    const dir = path.dirname(this.persistPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data: Record<string, StoredData> = {};
    this.store.forEach((value, key) => {
      data[key] = value;
    });

    try {
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
      logger.info(`[TestContext] Persisted ${this.store.size} items to ${this.persistPath}`);
    } catch (error) {
      logger.error(`[TestContext] Failed to persist data: ${(error as Error).message}`);
    }
  }

  /**
   * Load persisted data from file into memory.
   */
  private loadPersistedData(): void {
    if (fs.existsSync(this.persistPath)) {
      try {
        const content = fs.readFileSync(this.persistPath, 'utf-8');
        const data = JSON.parse(content) as Record<string, StoredData>;
        Object.entries(data).forEach(([key, value]) => {
          this.store.set(key, value);
        });
        logger.info(`[TestContext] Loaded ${this.store.size} items from persisted storage`);
      } catch (error) {
        logger.warn(`[TestContext] Failed to load persisted data: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Create a namespaced context for a specific domain/feature.
   * This helps organize data and avoid key collisions.
   * @param namespace - e.g., 'user', 'billing'
   */
  scoped(namespace: string): ScopedTestContext {
    return new ScopedTestContext(this, namespace);
  }
}

/**
 * Helper class to manage data within a specific namespace.
 * Transforms keys from 'key' to 'namespace.key'.
 */
export class ScopedTestContext {
  constructor(
    private context: TestContext,
    private namespace: string
  ) {}

  private prefixKey(key: string): string {
    return `${this.namespace}.${key}`;
  }

  set<T>(key: string, value: T, metadata: Partial<TestMetadata> = {}): void {
    this.context.set(this.prefixKey(key), value, metadata);
  }

  get<T>(key: string): T | undefined {
    return this.context.get<T>(this.prefixKey(key));
  }

  getAll<T>(): Map<string, T> {
    return this.context.getAll<T>(this.namespace);
  }
}

/**
 * Export the singleton instance for easy import.
 */
export const testContext = TestContext.getInstance();
export default testContext;
