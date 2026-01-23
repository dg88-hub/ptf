/**
 * @fileoverview File handling utility for upload, download, and file comparison operations
 * @module utils/FileHandler
 */

import { Page } from '@playwright/test';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './Logger';

/**
 * Options for file upload operations
 */
export interface FileUploadOptions {
  /** File input selector */
  selector: string;
  /** Path to file(s) to upload */
  filePath: string | string[];
  /** Timeout in milliseconds */
  timeout?: number;
  /** Validate file size before upload */
  maxSizeInMB?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
}

/**
 * Options for file download operations
 */
export interface FileDownloadOptions {
  /** Download trigger selector */
  trigger: string | (() => Promise<void>);
  /** Expected filename or pattern */
  expectedFileName?: string | RegExp;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Save path for downloaded file */
  savePath?: string;
  /** Verify file after download */
  verifyChecksum?: string;
}

/**
 * File comparison result
 */
export interface FileComparisonResult {
  /** Files are identical */
  areIdentical: boolean;
  /** File 1 checksum */
  file1Checksum: string;
  /** File 2 checksum */
  file2Checksum: string;
  /** File size comparison */
  sizesMatch: boolean;
  /** File 1 size in bytes */
  file1Size: number;
  /** File 2 size in bytes */
  file2Size: number;
}

/**
 * File Handler utility for managing file operations in tests
 *
 * @example
 * ```typescript
 * const fileHandler = new FileHandler(page);
 *
 * // Upload file
 * await fileHandler.uploadFile({
 *   selector: 'input[type="file"]',
 *   filePath: './test-data/sample.pdf',
 *   maxSizeInMB: 10,
 *   allowedExtensions: ['.pdf', '.docx']
 * });
 *
 * // Download file
 * const download = await fileHandler.downloadFile({
 *   trigger: 'button:has-text("Download")',
 *   expectedFileName: 'report.xlsx',
 *   savePath: './downloads'
 * });
 *
 * // Compare files
 * const result = await fileHandler.compareFiles('./file1.txt', './file2.txt');
 * ```
 */
export class FileHandler {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Upload file(s) to a file input
   *
   * @param options - Upload options
   * @throws Error if validation fails
   */
  async uploadFile(options: FileUploadOptions): Promise<void> {
    const { selector, filePath, timeout = 30000, maxSizeInMB, allowedExtensions } = options;

    logger.info(`[FileHandler] Uploading file(s) to ${selector}`);

    // Validate files before upload
    const files = Array.isArray(filePath) ? filePath : [filePath];

    for (const file of files) {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }

      // Check file extension
      if (allowedExtensions) {
        const ext = path.extname(file).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          throw new Error(
            `Invalid file extension ${ext}. Allowed: ${allowedExtensions.join(', ')}`
          );
        }
      }

      // Check file size
      if (maxSizeInMB) {
        const stats = fs.statSync(file);
        const sizeInMB = stats.size / (1024 * 1024);
        if (sizeInMB > maxSizeInMB) {
          throw new Error(`File size ${sizeInMB.toFixed(2)}MB exceeds maximum ${maxSizeInMB}MB`);
        }
      }
    }

    // Perform upload
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath, { timeout });

    logger.info(`[FileHandler] Successfully uploaded ${files.length} file(s)`);
  }

  /**
   * Download file and optionally verify it
   *
   * @param options - Download options
   * @returns Download object
   */
  async downloadFile(options: FileDownloadOptions): Promise<import('@playwright/test').Download> {
    const { trigger, expectedFileName, timeout = 30000, savePath, verifyChecksum } = options;

    logger.info('[FileHandler] Initiating file download');

    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout });

    // Trigger download
    if (typeof trigger === 'string') {
      await this.page.click(trigger);
    } else {
      await trigger();
    }

    const download = await downloadPromise;

    // Verify filename if specified
    const suggestedFilename = download.suggestedFilename();
    if (expectedFileName) {
      if (expectedFileName instanceof RegExp) {
        if (!expectedFileName.test(suggestedFilename)) {
          throw new Error(
            `Downloaded filename "${suggestedFilename}" does not match pattern ${expectedFileName}`
          );
        }
      } else if (suggestedFilename !== expectedFileName) {
        throw new Error(
          `Downloaded filename "${suggestedFilename}" does not match expected "${expectedFileName}"`
        );
      }
    }

    logger.info(`[FileHandler] Downloaded file: ${suggestedFilename}`);

    // Save file if path is specified
    if (savePath) {
      const fullPath = path.join(savePath, suggestedFilename);
      await download.saveAs(fullPath);
      logger.info(`[FileHandler] Saved to: ${fullPath}`);

      // Verify checksum if provided
      if (verifyChecksum) {
        const actualChecksum = await this.calculateChecksum(fullPath);
        if (actualChecksum !== verifyChecksum) {
          throw new Error(
            `Checksum mismatch. Expected: ${verifyChecksum}, Actual: ${actualChecksum}`
          );
        }
        logger.info('[FileHandler] Checksum verified successfully');
      }
    }

    return download;
  }

  /**
   * Compare two files for equality
   *
   * @param filePath1 - First file path
   * @param filePath2 - Second file path
   * @returns Comparison result
   */
  async compareFiles(filePath1: string, filePath2: string): Promise<FileComparisonResult> {
    logger.info(`[FileHandler] Comparing files: ${filePath1} vs ${filePath2}`);

    if (!fs.existsSync(filePath1)) {
      throw new Error(`File not found: ${filePath1}`);
    }
    if (!fs.existsSync(filePath2)) {
      throw new Error(`File not found: ${filePath2}`);
    }

    // Get file sizes
    const stats1 = fs.statSync(filePath1);
    const stats2 = fs.statSync(filePath2);
    const sizesMatch = stats1.size === stats2.size;

    // Calculate checksums
    const checksum1 = await this.calculateChecksum(filePath1);
    const checksum2 = await this.calculateChecksum(filePath2);
    const areIdentical = checksum1 === checksum2;

    const result: FileComparisonResult = {
      areIdentical,
      file1Checksum: checksum1,
      file2Checksum: checksum2,
      sizesMatch,
      file1Size: stats1.size,
      file2Size: stats2.size,
    };

    logger.info(`[FileHandler] Comparison complete. Identical: ${areIdentical}`);

    return result;
  }

  /**
   * Calculate SHA256 checksum of a file
   *
   * @param filePath - File path
   * @returns Checksum hex string
   */
  async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Wait for file to exist in directory
   *
   * @param directory - Directory to watch
   * @param filename - Expected filename or pattern
   * @param timeout - Timeout in milliseconds
   * @returns Full path to file
   */
  async waitForFile(
    directory: string,
    filename: string | RegExp,
    timeout = 30000
  ): Promise<string> {
    logger.info(`[FileHandler] Waiting for file in ${directory}`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!fs.existsSync(directory)) {
        await this.delay(500);
        continue;
      }

      const files = fs.readdirSync(directory);

      for (const file of files) {
        const matches = filename instanceof RegExp ? filename.test(file) : file === filename;

        if (matches) {
          const fullPath = path.join(directory, file);
          logger.info(`[FileHandler] Found file: ${fullPath}`);
          return fullPath;
        }
      }

      await this.delay(500);
    }

    throw new Error(`File not found in ${directory} after ${timeout}ms timeout`);
  }

  /**
   * Delete file if it exists
   *
   * @param filePath - File path to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[FileHandler] Deleted file: ${filePath}`);
    }
  }

  /**
   * Ensure directory exists, create if not
   *
   * @param directory - Directory path
   */
  ensureDirectory(directory: string): void {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      logger.info(`[FileHandler] Created directory: ${directory}`);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
