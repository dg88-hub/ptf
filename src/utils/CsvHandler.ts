/**
 * @fileoverview CSV file handler for test data management.
 * Provides methods to read and write CSV files for data-driven testing.
 *
 * @module utils/CsvHandler
 * @author DG
 * @version 1.0.0
 */

import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './Logger';

/**
 * CSV read options
 */
export interface CsvReadOptions {
  /** Delimiter character (default: ',') */
  delimiter?: string;
  /** Whether first row contains headers (default: true) */
  hasHeaders?: boolean;
  /** Custom header names (if no headers in file) */
  headers?: string[];
  /** Skip empty lines (default: true) */
  skipEmpty?: boolean;
}

/**
 * CSV write options
 */
export interface CsvWriteOptions {
  /** Delimiter character (default: ',') */
  delimiter?: string;
  /** Whether to include headers (default: true) */
  includeHeaders?: boolean;
  /** Whether to append to existing file (default: false) */
  append?: boolean;
  /** Custom header configuration */
  headers?: Array<{ id: string; title: string }>;
}

/**
 * CSV Handler class for reading and writing CSV files
 *
 * @example
 * ```typescript
 * const csvHandler = new CsvHandler();
 *
 * // Read CSV file
 * const data = await csvHandler.readFile<UserData>('test-data/users.csv');
 *
 * // Write data to CSV
 * await csvHandler.writeFile('output/results.csv', resultData);
 *
 * // Read with custom delimiter
 * const tsvData = await csvHandler.readFile('data.tsv', { delimiter: '\t' });
 * ```
 */
export class CsvHandler {
  /**
   * Read data from a CSV file
   * @param filePath - Path to the CSV file
   * @param options - Read options
   * @returns Promise resolving to array of objects
   */
  async readFile<T = Record<string, unknown>>(
    filePath: string,
    options: CsvReadOptions = {}
  ): Promise<T[]> {
    const absolutePath = path.resolve(filePath);
    logger.info(`[CsvHandler] Reading CSV file: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`CSV file not found: ${absolutePath}`);
    }

    return new Promise((resolve, reject) => {
      const results: T[] = [];

      const parserOptions: csvParser.Options = {
        separator: options.delimiter || ',',
        skipLines: 0,
        headers: options.hasHeaders === false ? options.headers : undefined,
      };

      fs.createReadStream(absolutePath)
        .pipe(csvParser(parserOptions))
        .on('data', (data: T) => {
          results.push(data);
        })
        .on('end', () => {
          logger.debug(`[CsvHandler] Read ${results.length} rows`);
          resolve(results);
        })
        .on('error', (error) => {
          logger.error(`[CsvHandler] Error reading file: ${error.message}`);
          reject(error);
        });
    });
  }

  /**
   * Read CSV file synchronously (for simple cases)
   * @param filePath - Path to the CSV file
   * @param options - Read options
   * @returns Array of objects
   */
  readFileSync<T = Record<string, unknown>>(
    filePath: string,
    options: CsvReadOptions = {}
  ): T[] {
    const absolutePath = path.resolve(filePath);
    logger.info(`[CsvHandler] Reading CSV file (sync): ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`CSV file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    const delimiter = options.delimiter || ',';

    if (lines.length === 0) {
      return [];
    }

    let headers: string[];
    let dataStartIndex: number;

    if (options.hasHeaders !== false) {
      headers = this.parseCsvLine(lines[0], delimiter);
      dataStartIndex = 1;
    } else {
      headers = options.headers || lines[0].split(delimiter).map((_, i) => `column${i}`);
      dataStartIndex = 0;
    }

    const results: T[] = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i], delimiter);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      results.push(row as T);
    }

    logger.debug(`[CsvHandler] Read ${results.length} rows`);
    return results;
  }

  /**
   * Write data to a CSV file
   * @param filePath - Path for the output file
   * @param data - Array of objects to write
   * @param options - Write options
   */
  async writeFile<T extends Record<string, unknown>>(
    filePath: string,
    data: T[],
    options: CsvWriteOptions = {}
  ): Promise<void> {
    const absolutePath = path.resolve(filePath);
    logger.info(`[CsvHandler] Writing ${data.length} rows to: ${absolutePath}`);

    if (data.length === 0) {
      logger.warn('[CsvHandler] No data to write');
      return;
    }

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Determine headers
    const headers = options.headers || Object.keys(data[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const csvWriter = createObjectCsvWriter({
      path: absolutePath,
      header: headers,
      append: options.append || false,
      fieldDelimiter: options.delimiter || ',',
    });

    await csvWriter.writeRecords(data);
    logger.info('[CsvHandler] File written successfully');
  }

  /**
   * Append data to an existing CSV file
   * @param filePath - Path to the CSV file
   * @param data - Array of objects to append
   */
  async appendToFile<T extends Record<string, unknown>>(
    filePath: string,
    data: T[]
  ): Promise<void> {
    await this.writeFile(filePath, data, { append: true });
  }

  /**
   * Convert CSV data to test case format for data-driven testing
   * @param filePath - Path to the CSV file
   * @param testNameColumn - Column containing test names
   * @param options - Read options
   * @returns Array of test case tuples
   */
  async toTestCases<T = Record<string, unknown>>(
    filePath: string,
    testNameColumn: string = 'testName',
    options: CsvReadOptions = {}
  ): Promise<Array<[string, T]>> {
    const data = await this.readFile<T & { [key: string]: string }>(filePath, options);

    return data.map((row, index) => {
      const testName = row[testNameColumn] || `Test Case ${index + 1}`;
      return [testName, row];
    });
  }

  /**
   * Parse a single CSV line handling quoted values
   * @param line - CSV line
   * @param delimiter - Field delimiter
   * @returns Array of field values
   */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

/**
 * Singleton CSV handler instance
 */
export const csvHandler = new CsvHandler();

export default csvHandler;
