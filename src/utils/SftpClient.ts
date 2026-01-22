/**
 * @fileoverview SFTP client for file transfer operations.
 * Provides methods for uploading, downloading, and managing files on SFTP servers.
 *
 * @module utils/SftpClient
 * @author DG
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { config, SftpConfig } from '../config';
import { logger } from './Logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SftpClient = require('ssh2-sftp-client');

/**
 * File information interface
 */
export interface FileInfo {
  name: string;
  size: number;
  modifyTime: Date;
  accessTime: Date;
  type: 'd' | '-' | 'l'; // directory, file, link
  isDirectory: boolean;
}

/**
 * SFTP connection options
 */
export interface SftpConnectionOptions {
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry attempts on connection failure */
  retries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * SFTP Client wrapper for file transfer operations
 *
 * @example
 * ```typescript
 * const sftp = new SftpHandler(config.sftp);
 * await sftp.connect();
 *
 * // Upload file
 * await sftp.uploadFile('./local/file.txt', '/remote/path/file.txt');
 *
 * // Download file
 * await sftp.downloadFile('/remote/file.txt', './local/downloaded.txt');
 *
 * // List directory
 * const files = await sftp.listDirectory('/remote/path');
 *
 * await sftp.disconnect();
 * ```
 */
export class SftpHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private sftpConfig: SftpConfig;
  private isConnected: boolean = false;

  /**
   * Creates a new SFTP handler
   * @param sftpConfig - SFTP configuration
   */
  constructor(sftpConfig: SftpConfig) {
    this.client = new SftpClient();
    this.sftpConfig = sftpConfig;
  }

  /**
   * Connect to the SFTP server
   * @param options - Connection options
   */
  async connect(options: SftpConnectionOptions = {}): Promise<void> {
    if (this.isConnected) {
      logger.warn('[SftpHandler] Already connected');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectionConfig: any = {
      host: this.sftpConfig.host,
      port: this.sftpConfig.port,
      username: this.sftpConfig.user,
      readyTimeout: options.timeout || 30000,
      retries: options.retries || 3,
      retry_factor: 2,
      retry_minTimeout: options.retryDelay || 2000,
    };

    // Use password or private key authentication
    if (this.sftpConfig.password) {
      connectionConfig.password = this.sftpConfig.password;
    } else if (this.sftpConfig.privateKeyPath) {
      connectionConfig.privateKey = fs.readFileSync(this.sftpConfig.privateKeyPath);
    }

    logger.info(`[SftpHandler] Connecting to ${this.sftpConfig.host}:${this.sftpConfig.port}`);

    try {
      await this.client.connect(connectionConfig);
      this.isConnected = true;
      logger.info('[SftpHandler] Connected successfully');
    } catch (error) {
      logger.error(`[SftpHandler] Connection failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Disconnect from the SFTP server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.warn('[SftpHandler] Not connected');
      return;
    }

    logger.info('[SftpHandler] Disconnecting');
    await this.client.end();
    this.isConnected = false;
    logger.info('[SftpHandler] Disconnected');
  }

  /**
   * Upload a file to the SFTP server
   * @param localPath - Local file path
   * @param remotePath - Remote destination path
   */
  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    this.ensureConnected();

    const absoluteLocalPath = path.resolve(localPath);
    logger.info(`[SftpHandler] Uploading: ${absoluteLocalPath} -> ${remotePath}`);

    if (!fs.existsSync(absoluteLocalPath)) {
      throw new Error(`Local file not found: ${absoluteLocalPath}`);
    }

    await this.client.put(absoluteLocalPath, remotePath);
    logger.info('[SftpHandler] Upload complete');
  }

  /**
   * Download a file from the SFTP server
   * @param remotePath - Remote file path
   * @param localPath - Local destination path
   */
  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    this.ensureConnected();

    const absoluteLocalPath = path.resolve(localPath);
    logger.info(`[SftpHandler] Downloading: ${remotePath} -> ${absoluteLocalPath}`);

    // Ensure local directory exists
    const dir = path.dirname(absoluteLocalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.client.get(remotePath, absoluteLocalPath);
    logger.info('[SftpHandler] Download complete');
  }

  /**
   * List files in a remote directory
   * @param remotePath - Remote directory path
   * @returns Array of file information
   */
  async listDirectory(remotePath: string): Promise<FileInfo[]> {
    this.ensureConnected();

    logger.debug(`[SftpHandler] Listing directory: ${remotePath}`);
    const listing = await this.client.list(remotePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return listing.map((item: any) => ({
      name: item.name,
      size: item.size,
      modifyTime: new Date(item.modifyTime),
      accessTime: new Date(item.accessTime),
      type: item.type as 'd' | '-' | 'l',
      isDirectory: item.type === 'd',
    }));
  }

  /**
   * Check if a remote file or directory exists
   * @param remotePath - Remote path to check
   * @returns True if exists
   */
  async exists(remotePath: string): Promise<boolean> {
    this.ensureConnected();

    try {
      await this.client.stat(remotePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a remote directory
   * @param remotePath - Remote directory path
   * @param recursive - Create parent directories if needed
   */
  async createDirectory(remotePath: string, recursive: boolean = true): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Creating directory: ${remotePath}`);
    await this.client.mkdir(remotePath, recursive);
  }

  /**
   * Delete a remote file
   * @param remotePath - Remote file path
   */
  async deleteFile(remotePath: string): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Deleting file: ${remotePath}`);
    await this.client.delete(remotePath);
  }

  /**
   * Delete a remote directory
   * @param remotePath - Remote directory path
   */
  async deleteDirectory(remotePath: string): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Deleting directory: ${remotePath}`);
    await this.client.rmdir(remotePath, true);
  }

  /**
   * Rename/move a remote file or directory
   * @param oldPath - Current path
   * @param newPath - New path
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Renaming: ${oldPath} -> ${newPath}`);
    await this.client.rename(oldPath, newPath);
  }

  /**
   * Get file size
   * @param remotePath - Remote file path
   * @returns File size in bytes
   */
  async getFileSize(remotePath: string): Promise<number> {
    this.ensureConnected();

    const stats = await this.client.stat(remotePath);
    return stats.size;
  }

  /**
   * Upload multiple files
   * @param files - Array of [localPath, remotePath] tuples
   */
  async uploadMultiple(files: Array<[string, string]>): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Uploading ${files.length} files`);

    for (const [localPath, remotePath] of files) {
      await this.uploadFile(localPath, remotePath);
    }
  }

  /**
   * Download multiple files
   * @param files - Array of [remotePath, localPath] tuples
   */
  async downloadMultiple(files: Array<[string, string]>): Promise<void> {
    this.ensureConnected();

    logger.info(`[SftpHandler] Downloading ${files.length} files`);

    for (const [remotePath, localPath] of files) {
      await this.downloadFile(remotePath, localPath);
    }
  }

  /**
   * Ensure the client is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('SFTP not connected. Call connect() first.');
    }
  }
}

/**
 * Create SFTP handler from config
 * @returns SFTP handler instance or null if not configured
 */
export function createSftpHandler(): SftpHandler | null {
  if (!config.sftp) {
    logger.warn('[SftpHandler] SFTP not configured');
    return null;
  }
  return new SftpHandler(config.sftp);
}

export default SftpHandler;
