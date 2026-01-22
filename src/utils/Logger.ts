/**
 * @fileoverview Logging utility for the test framework.
 * Provides structured logging with multiple output destinations
 * and configurable log levels.
 *
 * @module utils/Logger
 * @author DG
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import winston from 'winston';

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Logger configuration interface
 */
interface LoggerConfig {
  level: LogLevel;
  logDir: string;
  consoleEnabled: boolean;
  fileEnabled: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  logDir: path.resolve(process.cwd(), 'logs'),
  consoleEnabled: true,
  fileEnabled: true,
};

/**
 * Custom log format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp as string}] ${level}: ${message as string}`;
  })
);

/**
 * Custom log format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.json()
);

/**
 * Create the logs directory if it doesn't exist
 */
function ensureLogDirectory(logDir: string): void {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Create and configure the Winston logger instance
 */
function createLogger(config: LoggerConfig = defaultConfig): winston.Logger {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.consoleEnabled) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: config.level,
      })
    );
  }

  // File transport
  if (config.fileEnabled) {
    ensureLogDirectory(config.logDir);

    // General log file
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDir, 'test-execution.log'),
        format: fileFormat,
        level: config.level,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Error-only log file
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDir, 'errors.log'),
        format: fileFormat,
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    transports,
    exitOnError: false,
  });
}

/**
 * Logger class providing test framework logging functionality
 *
 * @example
 * ```typescript
 * import { logger } from './utils/Logger';
 *
 * logger.info('Test started');
 * logger.debug('Debug information', { data: someData });
 * logger.error('Error occurred', error);
 * ```
 */
class Logger {
  private winstonLogger: winston.Logger;
  private testName: string = '';

  constructor(config?: Partial<LoggerConfig>) {
    const mergedConfig = { ...defaultConfig, ...config };
    this.winstonLogger = createLogger(mergedConfig);
  }

  /**
   * Set the current test name for contextual logging
   * @param testName - Name of the current test
   */
  setTestContext(testName: string): void {
    this.testName = testName;
  }

  /**
   * Clear the test context
   */
  clearTestContext(): void {
    this.testName = '';
  }

  /**
   * Format message with test context
   */
  private formatMessage(message: string): string {
    return this.testName ? `[${this.testName}] ${message}` : message;
  }

  /**
   * Log error level message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  error(message: string, meta?: unknown): void {
    this.winstonLogger.error(this.formatMessage(message), meta);
  }

  /**
   * Log warning level message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  warn(message: string, meta?: unknown): void {
    this.winstonLogger.warn(this.formatMessage(message), meta);
  }

  /**
   * Log info level message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  info(message: string, meta?: unknown): void {
    this.winstonLogger.info(this.formatMessage(message), meta);
  }

  /**
   * Log debug level message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  debug(message: string, meta?: unknown): void {
    this.winstonLogger.debug(this.formatMessage(message), meta);
  }

  /**
   * Log verbose level message
   * @param message - Log message
   * @param meta - Optional metadata
   */
  verbose(message: string, meta?: unknown): void {
    this.winstonLogger.verbose(this.formatMessage(message), meta);
  }

  /**
   * Log step information (useful for test steps)
   * @param stepNumber - Step number
   * @param description - Step description
   */
  step(stepNumber: number, description: string): void {
    this.info(`Step ${stepNumber}: ${description}`);
  }

  /**
   * Log test start
   * @param testName - Name of the test
   */
  testStart(testName: string): void {
    this.setTestContext(testName);
    this.info(`========== TEST STARTED: ${testName} ==========`);
  }

  /**
   * Log test end
   * @param testName - Name of the test
   * @param status - Test status (passed/failed)
   * @param duration - Test duration in milliseconds
   */
  testEnd(testName: string, status: 'passed' | 'failed', duration?: number): void {
    const durationStr = duration ? ` (${duration}ms)` : '';
    const statusStr = status === 'passed' ? '✓ PASSED' : '✗ FAILED';
    this.info(`========== TEST ${statusStr}: ${testName}${durationStr} ==========`);
    this.clearTestContext();
  }

  /**
   * Log API request
   * @param method - HTTP method
   * @param url - Request URL
   * @param payload - Request payload
   */
  apiRequest(method: string, url: string, payload?: unknown): void {
    this.debug(`API Request: ${method.toUpperCase()} ${url}`, payload);
  }

  /**
   * Log API response
   * @param status - Response status code
   * @param url - Request URL
   * @param body - Response body
   */
  apiResponse(status: number, url: string, body?: unknown): void {
    this.debug(`API Response: ${status} from ${url}`, body);
  }

  /**
   * Log database query
   * @param query - SQL query
   * @param params - Query parameters
   */
  dbQuery(query: string, params?: unknown[]): void {
    this.debug(`DB Query: ${query.substring(0, 100)}...`, { params });
  }

  /**
   * Log screenshot capture
   * @param path - Screenshot file path
   */
  screenshot(path: string): void {
    this.info(`Screenshot captured: ${path}`);
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

export default logger;
