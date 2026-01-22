/**
 * @fileoverview Unified Configuration Management for the Test Framework.
 *
 * This module provides centralized, typed access to all environment-specific settings
 * including base URLs, credentials, database connections, and infrastructure configs.
 *
 * @module config
 * @author DG
 * @version 2.0.0
 *
 * @example
 * ```typescript
 * import { config } from '../config';
 *
 * // Access environment settings
 * const baseUrl = config.baseUrl;
 * const timeout = config.timeout;
 *
 * // Access credentials
 * const sauceCreds = config.credentials.sauce;
 *
 * // Access database config (if configured)
 * const pgConfig = config.postgresDb;
 * ```
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// ============================================
// Type Definitions
// ============================================

/**
 * Supported test environments.
 * - `sit`: System Integration Testing
 * - `fat`: Functional Acceptance Testing
 * - `uat`: User Acceptance Testing
 */
export type Environment = 'sit' | 'fat' | 'uat';

/**
 * Supported database types.
 */
export type DatabaseType = 'postgresql' | 'oracle';

/**
 * Environment-specific configuration.
 */
export interface EnvironmentConfig {
  /** Environment identifier */
  name: Environment;
  /** Base URL for UI tests */
  baseUrl: string;
  /** Base URL for API tests */
  apiBaseUrl: string;
  /** Default action timeout (ms) */
  timeout: number;
  /** Run browsers in headless mode */
  headless: boolean;
}

/**
 * Database connection configuration.
 */
export interface DatabaseConfig {
  /** Database type */
  type: DatabaseType;
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Database name or service name */
  database: string;
  /** Username */
  user: string;
  /** Password */
  password: string;
  /** Connection pool size */
  poolSize?: number;
  /** Enable SSL */
  ssl?: boolean;
}

/**
 * SFTP connection configuration.
 */
export interface SftpConfig {
  /** SFTP host */
  host: string;
  /** SFTP port */
  port: number;
  /** Username */
  user: string;
  /** Password (if using password auth) */
  password?: string;
  /** Path to private key (if using key auth) */
  privateKeyPath?: string;
}

/**
 * Email/IMAP configuration.
 */
export interface EmailConfig {
  /** IMAP host */
  host: string;
  /** IMAP port */
  port: number;
  /** Username */
  user: string;
  /** Password */
  password: string;
  /** Use TLS */
  tls: boolean;
}

/**
 * Application credentials structure.
 */
export interface AppCredentials {
  username: string;
  password: string;
}

// ============================================
// Environment Configurations
// ============================================

const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  sit: {
    name: 'sit',
    baseUrl: process.env.SIT_BASE_URL || 'https://www.saucedemo.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in/api',
    timeout: 30000,
    headless: true,
  },
  fat: {
    name: 'fat',
    baseUrl: process.env.FAT_BASE_URL || 'https://www.saucedemo.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in/api',
    timeout: 45000,
    headless: true,
  },
  uat: {
    name: 'uat',
    baseUrl: process.env.UAT_BASE_URL || 'https://www.saucedemo.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://reqres.in/api',
    timeout: 60000,
    headless: true,
  },
};

// ============================================
// Config Class
// ============================================

/**
 * Unified Configuration Manager.
 *
 * Provides typed access to all framework configuration settings.
 * Use the exported `config` singleton instance.
 *
 * @example
 * ```typescript
 * import { config } from '../config';
 *
 * // Environment
 * console.log(config.testEnv);      // 'sit'
 * console.log(config.baseUrl);      // 'https://www.saucedemo.com'
 *
 * // Credentials
 * const { username, password } = config.credentials.sauce;
 *
 * // Paths
 * console.log(config.testDataPath); // '/path/to/test-data'
 * ```
 */
export class Config {
  // ----------------------------------------
  // Environment Properties
  // ----------------------------------------

  /**
   * Current test environment (sit, fat, uat).
   * Defaults to 'sit' if TEST_ENV is not set.
   */
  get testEnv(): Environment {
    const env = process.env.TEST_ENV?.toLowerCase() as Environment;
    return ['sit', 'fat', 'uat'].includes(env) ? env : 'sit';
  }

  /**
   * Full environment configuration object.
   */
  get environment(): EnvironmentConfig {
    return environmentConfigs[this.testEnv];
  }

  /**
   * Base URL for UI tests (environment-specific).
   */
  get baseUrl(): string {
    return this.environment.baseUrl;
  }

  /**
   * Base URL for API tests.
   */
  get apiBaseUrl(): string {
    return this.environment.apiBaseUrl;
  }

  /**
   * Default timeout in milliseconds (environment-specific).
   */
  get timeout(): number {
    return this.environment.timeout;
  }

  /**
   * Whether to run in headless mode (environment-specific).
   */
  get headless(): boolean {
    return this.environment.headless;
  }

  // ----------------------------------------
  // Credentials
  // ----------------------------------------

  /**
   * Application credentials organized by application name.
   *
   * @example
   * ```typescript
   * const { username, password } = config.credentials.sauce;
   * const adminCreds = config.credentials.admin;
   * ```
   */
  get credentials(): Record<string, AppCredentials> {
    return {
      sauce: {
        username: process.env.SAUCE_USERNAME || 'standard_user',
        password: process.env.SAUCE_PASSWORD || 'secret_sauce',
      },
      admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      },
      parabank: {
        username: process.env.PARABANK_USERNAME || 'john',
        password: process.env.PARABANK_PASSWORD || 'demo',
      },
    };
  }

  // ----------------------------------------
  // Database Configurations
  // ----------------------------------------

  /**
   * PostgreSQL database configuration.
   * Returns undefined if PG_HOST is not set.
   */
  get postgresDb(): DatabaseConfig | undefined {
    if (!process.env.PG_HOST) {
      return undefined;
    }

    return {
      type: 'postgresql',
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || '5432', 10),
      database: process.env.PG_DATABASE || 'testdb',
      user: process.env.PG_USER || 'testuser',
      password: process.env.PG_PASSWORD || '',
      poolSize: parseInt(process.env.PG_POOL_SIZE || '10', 10),
      ssl: process.env.PG_SSL === 'true',
    };
  }

  /**
   * Oracle database configuration.
   * Returns undefined if ORACLE_HOST is not set.
   */
  get oracleDb(): DatabaseConfig | undefined {
    if (!process.env.ORACLE_HOST) {
      return undefined;
    }

    return {
      type: 'oracle',
      host: process.env.ORACLE_HOST,
      port: parseInt(process.env.ORACLE_PORT || '1521', 10),
      database: process.env.ORACLE_SERVICE_NAME || 'ORCL',
      user: process.env.ORACLE_USER || 'testuser',
      password: process.env.ORACLE_PASSWORD || '',
      poolSize: parseInt(process.env.ORACLE_POOL_SIZE || '10', 10),
    };
  }

  // ----------------------------------------
  // Infrastructure Configurations
  // ----------------------------------------

  /**
   * SFTP configuration.
   * Returns undefined if SFTP_HOST is not set.
   */
  get sftp(): SftpConfig | undefined {
    if (!process.env.SFTP_HOST) {
      return undefined;
    }

    return {
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT || '22', 10),
      user: process.env.SFTP_USER || '',
      password: process.env.SFTP_PASSWORD,
      privateKeyPath: process.env.SFTP_PRIVATE_KEY_PATH,
    };
  }

  /**
   * Email/IMAP configuration.
   * Returns undefined if IMAP_HOST is not set.
   */
  get email(): EmailConfig | undefined {
    if (!process.env.IMAP_HOST) {
      return undefined;
    }

    return {
      host: process.env.IMAP_HOST,
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      user: process.env.IMAP_USER || '',
      password: process.env.IMAP_PASSWORD || '',
      tls: process.env.IMAP_TLS !== 'false',
    };
  }

  // ----------------------------------------
  // Paths
  // ----------------------------------------

  /**
   * Path to the test-data directory.
   */
  get testDataPath(): string {
    return path.resolve(__dirname, '../../test-data');
  }

  /**
   * Path to the logs directory.
   */
  get logPath(): string {
    return path.resolve(__dirname, '../../logs');
  }

  /**
   * Logging level (debug, info, warn, error).
   */
  get logLevel(): string {
    return process.env.LOG_LEVEL || 'info';
  }
}

// ============================================
// Exports
// ============================================

/**
 * Configuration singleton instance.
 * Import this for all configuration access.
 *
 * @example
 * ```typescript
 * import { config } from '../config';
 * console.log(config.baseUrl);
 * ```
 */
export const config = new Config();

/**
 * Environment configurations map for direct access.
 * Prefer using `config.environment` in most cases.
 */
export { environmentConfigs };

/**
 * Default export for convenience.
 */
export default config;

// ============================================
// Legacy Compatibility (DEPRECATED)
// ============================================

/**
 * @deprecated Use `config` instead. Will be removed in v3.0.
 */
export const frameworkConfig = config;

/**
 * @deprecated Use `config.testEnv` instead. Will be removed in v3.0.
 */
export function getCurrentEnvironment(): Environment {
  return config.testEnv;
}

/**
 * @deprecated Use `config` directly instead. Will be removed in v3.0.
 */
export function getConfig(): Record<string, unknown> {
  return {
    environment: config.environment,
    postgresDb: config.postgresDb,
    oracleDb: config.oracleDb,
    sftp: config.sftp,
    email: config.email,
    logLevel: config.logLevel,
    testDataPath: config.testDataPath,
    logPath: config.logPath,
  };
}
