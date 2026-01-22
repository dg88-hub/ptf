/**
 * @fileoverview Excel file handler for data-driven testing.
 * Provides methods to read and write Excel files for test data management.
 *
 * @module utils/ExcelHandler
 * @author DG
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { logger } from './Logger';

/**
 * Excel read options
 */
export interface ExcelReadOptions {
  /** Sheet name or index (default: 0) */
  sheet?: string | number;
  /** Whether first row contains headers (default: true) */
  hasHeaders?: boolean;
  /** Range to read (e.g., 'A1:D10') */
  range?: string;
}

/**
 * Excel write options
 */
export interface ExcelWriteOptions {
  /** Sheet name (default: 'Sheet1') */
  sheetName?: string;
  /** Whether to include headers (default: true) */
  includeHeaders?: boolean;
  /** Whether to append to existing file (default: false) */
  append?: boolean;
}

/**
 * Excel Handler class for reading and writing Excel files
 *
 * @example
 * ```typescript
 * const excelHandler = new ExcelHandler();
 *
 * // Read Excel file
 * const data = excelHandler.readFile<UserData>('test-data/users.xlsx');
 *
 * // Write data to Excel
 * excelHandler.writeFile('output/results.xlsx', resultData, { sheetName: 'Results' });
 *
 * // Get specific sheet
 * const sheet2Data = excelHandler.readFile<TestCase>('tests.xlsx', { sheet: 'TestCases' });
 * ```
 */
export class ExcelHandler {
  /**
   * Read data from an Excel file
   * @param filePath - Path to the Excel file
   * @param options - Read options
   * @returns Array of objects representing rows
   */
  readFile<T = Record<string, unknown>>(filePath: string, options: ExcelReadOptions = {}): T[] {
    const absolutePath = path.resolve(filePath);
    logger.info(`[ExcelHandler] Reading Excel file: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Excel file not found: ${absolutePath}`);
    }

    const workbook = XLSX.readFile(absolutePath);

    // Determine which sheet to read
    let sheetName: string;
    if (typeof options.sheet === 'number') {
      sheetName = workbook.SheetNames[options.sheet];
    } else if (typeof options.sheet === 'string') {
      sheetName = options.sheet;
    } else {
      sheetName = workbook.SheetNames[0];
    }

    if (!workbook.Sheets[sheetName]) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file`);
    }

    const worksheet = workbook.Sheets[sheetName];

    // Parse options
    const parseOptions: XLSX.Sheet2JSONOpts = {
      header: options.hasHeaders === false ? 1 : undefined,
      range: options.range,
      defval: null,
    };

    const data = XLSX.utils.sheet_to_json<T>(worksheet, parseOptions);
    logger.debug(`[ExcelHandler] Read ${data.length} rows from sheet "${sheetName}"`);

    return data;
  }

  /**
   * Write data to an Excel file
   * @param filePath - Path for the output file
   * @param data - Array of objects to write
   * @param options - Write options
   */
  writeFile<T extends Record<string, unknown>>(
    filePath: string,
    data: T[],
    options: ExcelWriteOptions = {}
  ): void {
    const absolutePath = path.resolve(filePath);
    const sheetName = options.sheetName || 'Sheet1';

    logger.info(`[ExcelHandler] Writing ${data.length} rows to: ${absolutePath}`);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let workbook: XLSX.WorkBook;

    if (options.append && fs.existsSync(absolutePath)) {
      // Append to existing file
      workbook = XLSX.readFile(absolutePath);
    } else {
      // Create new workbook
      workbook = XLSX.utils.book_new();
    }

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: options.includeHeaders === false ? undefined : Object.keys(data[0] || {}),
    });

    // Add or replace sheet
    if (workbook.SheetNames.includes(sheetName)) {
      workbook.Sheets[sheetName] = worksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Write file
    XLSX.writeFile(workbook, absolutePath);
    logger.info(`[ExcelHandler] File written successfully`);
  }

  /**
   * Get list of sheet names in an Excel file
   * @param filePath - Path to the Excel file
   * @returns Array of sheet names
   */
  getSheetNames(filePath: string): string[] {
    const absolutePath = path.resolve(filePath);
    const workbook = XLSX.readFile(absolutePath);
    return workbook.SheetNames;
  }

  /**
   * Read a specific cell value
   * @param filePath - Path to the Excel file
   * @param cellAddress - Cell address (e.g., 'A1')
   * @param sheetName - Sheet name (default: first sheet)
   * @returns Cell value
   */
  readCell(filePath: string, cellAddress: string, sheetName?: string): unknown {
    const absolutePath = path.resolve(filePath);
    const workbook = XLSX.readFile(absolutePath);
    const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
    const cell = sheet[cellAddress];
    return cell ? cell.v : null;
  }

  /**
   * Read data as a 2D array (rows and columns)
   * @param filePath - Path to the Excel file
   * @param options - Read options
   * @returns 2D array of values
   */
  readAsArray(filePath: string, options: ExcelReadOptions = {}): unknown[][] {
    const absolutePath = path.resolve(filePath);
    const workbook = XLSX.readFile(absolutePath);

    let sheetName: string;
    if (typeof options.sheet === 'number') {
      sheetName = workbook.SheetNames[options.sheet];
    } else if (typeof options.sheet === 'string') {
      sheetName = options.sheet;
    } else {
      sheetName = workbook.SheetNames[0];
    }

    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, range: options.range });
  }

  /**
   * Convert Excel data to test case format for data-driven testing
   * @param filePath - Path to the Excel file
   * @param options - Read options
   * @returns Array of test case tuples [testName, testData]
   */
  toTestCases<T = Record<string, unknown>>(
    filePath: string,
    testNameColumn: string = 'testName',
    options: ExcelReadOptions = {}
  ): Array<[string, T]> {
    const data = this.readFile<T & { [key: string]: string }>(filePath, options);

    return data.map((row, index) => {
      const testName = row[testNameColumn] || `Test Case ${index + 1}`;
      return [testName, row];
    });
  }
}

/**
 * Singleton Excel handler instance
 */
export const excelHandler = new ExcelHandler();

export default excelHandler;
