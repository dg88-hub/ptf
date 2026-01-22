/**
 * @fileoverview Database client supporting PostgreSQL and Oracle databases.
 * Provides connection management and query execution with proper resource cleanup.
 *
 * EDUCATIONAL NOTE: Factory Pattern & Strategy Pattern
 * This module uses the Factory Pattern (`createDatabaseClient`) to instantiate the correct
 * database client based on configuration. The clients themselves share a common interface,
 * effectively implementing a Strategy Pattern where the execution detail (Postgres vs Oracle)
 * is abstracted away from the caller.
 *
 * @module database/DatabaseClient
 * @author DG
 * @version 1.1.0
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config, DatabaseConfig } from '../config';
import { logger } from '../utils/Logger';

/**
 * Custom Error class for Database operations.
 * Helps in identifying db-specific issues in try-catch blocks.
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Query result interface
 */
export interface DbQueryResult<T extends QueryResultRow = QueryResultRow> {
  /** Number of rows returned/affected */
  rowCount: number;
  /** Array of result rows */
  rows: T[];
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Database client options
 */
export interface DbClientOptions {
  /** Connection pool size */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Query timeout in milliseconds */
  queryTimeout?: number;
}

/**
 * PostgreSQL Database Client
 *
 * EDUCATIONAL NOTE: Connection Pooling
 * Instead of opening a new connection for every query (which is slow and expensive),
 * we use a 'Pool'. A Pool maintains a set of open connections that can be borrowed,
 * used, and returned. This significantly yields better performance for high-throughput applications.
 *
 * @example
 * ```typescript
 * const dbClient = new PostgresClient(config.postgresDb);
 * await dbClient.connect();
 *
 * // Execute query
 * const users = await dbClient.query<User>('SELECT * FROM users WHERE active = $1', [true]);
 *
 * // Execute with transaction
 * await dbClient.transaction(async (client) => {
 *   await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
 *   await client.query('INSERT INTO logs (action) VALUES ($1)', ['user_created']);
 * });
 *
 * await dbClient.disconnect();
 * ```
 */
export class PostgresClient {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private options: DbClientOptions;

  /**
   * Creates a new PostgreSQL client
   * @param dbConfig - Database configuration
   * @param options - Client options
   */
  constructor(dbConfig: DatabaseConfig, options: DbClientOptions = {}) {
    this.config = dbConfig;
    this.options = {
      poolSize: options.poolSize || 10,
      connectionTimeout: options.connectionTimeout || 30000,
      queryTimeout: options.queryTimeout || 60000,
    };
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    if (this.pool) {
      logger.warn('[PostgresClient] Already connected');
      return;
    }

    logger.info(
      `[PostgresClient] Connecting to PostgreSQL at ${this.config.host}:${this.config.port}`
    );

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.options.poolSize,
      connectionTimeoutMillis: this.options.connectionTimeout,
      idleTimeoutMillis: 30000,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      client.release();
      logger.info('[PostgresClient] Connected successfully');
    } catch (error) {
      throw new DatabaseError('Failed to connect to PostgreSQL', undefined, error as Error);
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      logger.warn('[PostgresClient] Not connected');
      return;
    }

    logger.info('[PostgresClient] Disconnecting');
    await this.pool.end();
    this.pool = null;
    logger.info('[PostgresClient] Disconnected');
  }

  /**
   * Execute a query
   * @param sql - SQL query
   * @param params - Query parameters
   * @returns Query result
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<DbQueryResult<T>> {
    if (!this.pool) {
      throw new DatabaseError('Database not connected. Call connect() first.');
    }

    logger.dbQuery(sql, params);
    const startTime = Date.now();

    try {
      const result: QueryResult<T> = await this.pool.query(sql, params);
      const executionTime = Date.now() - startTime;

      logger.debug(
        `[PostgresClient] Query completed in ${executionTime}ms, rows: ${result.rowCount}`
      );

      return {
        rowCount: result.rowCount || 0,
        rows: result.rows,
        executionTime,
      };
    } catch (error) {
      logger.error(`[PostgresClient] Query failed: ${(error as Error).message}`);
      throw new DatabaseError('Query execution failed', sql, error as Error);
    }
  }

  /**
   * Execute a query and return first row
   * @param sql - SQL query
   * @param params - Query parameters
   * @returns First row or null
   */
  async queryOne<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Execute multiple queries in a transaction
   *
   * EDUCATIONAL NOTE: Transactions
   * Transactions ensure "Atomic" operations. Either all queries succeed, or none of them do.
   * This is critical for data integrity (e.g., transferring money: deduct from A AND add to B).
   *
   * @param callback - Transaction callback
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new DatabaseError('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    logger.debug('[PostgresClient] Starting transaction');

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      logger.debug('[PostgresClient] Transaction committed');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`[PostgresClient] Transaction rolled back: ${(error as Error).message}`);
      throw new DatabaseError('Transaction failed', undefined, error as Error);
    } finally {
      client.release();
    }
  }

  /**
   * Check if database is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.pool !== null;
  }

  /**
   * Verify database connection with a simple query
   * @returns True if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Oracle Database Client (Placeholder)
 * Requires oracledb module and Oracle Instant Client
 *
 * @example
 * ```typescript
 * const oracleClient = new OracleClient(config.oracleDb);
 * await oracleClient.connect();
 * const results = await oracleClient.query('SELECT * FROM employees');
 * await oracleClient.disconnect();
 * ```
 */
export class OracleClient {
  private connection: unknown = null;
  private config: DatabaseConfig;
  private options: DbClientOptions;

  /**
   * Creates a new Oracle client
   * @param dbConfig - Database configuration
   * @param options - Client options
   */
  constructor(dbConfig: DatabaseConfig, options: DbClientOptions = {}) {
    this.config = dbConfig;
    this.options = {
      poolSize: options.poolSize || 10,
      connectionTimeout: options.connectionTimeout || 30000,
      queryTimeout: options.queryTimeout || 60000,
    };
  }

  /**
   * Connect to Oracle database
   * @remarks Requires oracledb module and Oracle Instant Client to be installed
   */
  async connect(): Promise<void> {
    logger.info(`[OracleClient] Connecting to Oracle at ${this.config.host}:${this.config.port}`);

    try {
      // Dynamic import to avoid errors if oracledb is not installed
      const oracledb = await import('oracledb');

      const connectionString = `${this.config.host}:${this.config.port}/${this.config.database}`;

      this.connection = await oracledb.default.getConnection({
        user: this.config.user,
        password: this.config.password,
        connectionString,
      });

      logger.info('[OracleClient] Connected successfully');
    } catch (error) {
      logger.error(`[OracleClient] Connection failed: ${(error as Error).message}`);
      throw new DatabaseError(
        'Oracle connection failed. Ensure oracledb module is installed and Oracle Instant Client is configured.',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Disconnect from Oracle database
   */
  async disconnect(): Promise<void> {
    if (!this.connection) {
      logger.warn('[OracleClient] Not connected');
      return;
    }

    logger.info('[OracleClient] Disconnecting');
    try {
      await (this.connection as { close: () => Promise<void> }).close();
      this.connection = null;
      logger.info('[OracleClient] Disconnected');
    } catch (error) {
      logger.error(`[OracleClient] Disconnect failed: ${(error as Error).message}`);
      throw new DatabaseError('Oracle disconnect failed', undefined, error as Error);
    }
  }

  /**
   * Execute a query
   * @param sql - SQL query
   * @param params - Query parameters (bind variables)
   * @returns Query result
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<DbQueryResult<T>> {
    if (!this.connection) {
      throw new DatabaseError('Database not connected. Call connect() first.');
    }

    logger.dbQuery(sql, params);
    const startTime = Date.now();

    try {
      const result = await (
        this.connection as {
          execute: (
            sql: string,
            params: unknown[],
            options: Record<string, unknown>
          ) => Promise<{
            rows: T[];
            rowsAffected?: number;
          }>;
        }
      ).execute(sql, params, { outFormat: 2 }); // outFormat: 2 = OBJECT

      const executionTime = Date.now() - startTime;

      logger.debug(`[OracleClient] Query completed in ${executionTime}ms`);

      return {
        rowCount: result.rowsAffected || result.rows?.length || 0,
        rows: result.rows || [],
        executionTime,
      };
    } catch (error) {
      logger.error(`[OracleClient] Query failed: ${(error as Error).message}`);
      throw new DatabaseError('Query execution failed', sql, error as Error);
    }
  }

  /**
   * Execute a query and return first row
   * @param sql - SQL query
   * @param params - Query parameters
   * @returns First row or null
   */
  async queryOne<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Check if database is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Verify database connection
   * @returns True if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1 FROM DUAL');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create appropriate database client
 * @param type - Database type
 * @returns Database client instance
 */
export function createDatabaseClient(type: 'postgresql' | 'oracle'): PostgresClient | OracleClient {
  if (type === 'postgresql') {
    if (!config.postgresDb) {
      throw new Error('PostgreSQL configuration not found');
    }
    return new PostgresClient(config.postgresDb);
  } else if (type === 'oracle') {
    if (!config.oracleDb) {
      throw new Error('Oracle configuration not found');
    }
    return new OracleClient(config.oracleDb);
  }
  throw new Error(`Unsupported database type: ${type as string}`);
}

export default { PostgresClient, OracleClient, createDatabaseClient, DatabaseError };
