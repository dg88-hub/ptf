/**
 * @fileoverview Table Handler utility for data table interactions.
 * Provides methods for working with HTML tables including sorting,
 * filtering, pagination, and data extraction.
 *
 * @module utils/TableHandler
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Tables are common in enterprise applications for displaying:
 * - Transaction lists
 * - Invoice/Order details
 * - Account summaries
 * - Report data
 *
 * This utility handles common table operations:
 * - Finding rows by text content
 * - Sorting columns
 * - Extracting structured data
 * - Pagination navigation
 *
 * @example
 * ```typescript
 * const tableHandler = new TableHandler(page, page.locator('table.data-grid'));
 *
 * // Extract all table data
 * const data = await tableHandler.extractTableData();
 *
 * // Find a specific row
 * const row = await tableHandler.getRowByText('INV-001');
 *
 * // Sort by column
 * await tableHandler.sortByColumn('Amount');
 * ```
 */

import { Locator, Page, expect } from "@playwright/test";
import { logger } from "./Logger";

/**
 * Configuration options for TableHandler
 */
export interface TableHandlerOptions {
  /** Selector for header row */
  headerSelector?: string;
  /** Selector for body rows */
  bodyRowSelector?: string;
  /** Selector for cells within a row */
  cellSelector?: string;
  /** Whether table has sticky header */
  hasStickyHeader?: boolean;
  /** Timeout for operations */
  timeout?: number;
}

/**
 * Parsed table row data
 */
export interface TableRow {
  index: number;
  cells: string[];
  data: Record<string, string>;
  element: Locator;
}

/**
 * Sort direction
 */
export type SortDirection = "ascending" | "descending" | "none";

/**
 * Table Handler class for data table interactions
 */
export class TableHandler {
  private page: Page;
  private tableLocator: Locator;
  private options: Required<TableHandlerOptions>;
  private headers: string[] = [];

  constructor(
    page: Page,
    tableLocator: Locator,
    options: TableHandlerOptions = {},
  ) {
    this.page = page;
    this.tableLocator = tableLocator;
    this.options = {
      headerSelector: options.headerSelector || "thead tr",
      bodyRowSelector: options.bodyRowSelector || "tbody tr",
      cellSelector: options.cellSelector || "td",
      hasStickyHeader: options.hasStickyHeader || false,
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Wait for the table to be loaded and visible
   */
  async waitForTable(): Promise<void> {
    logger.debug("Waiting for table to load");
    await this.tableLocator.waitFor({
      state: "visible",
      timeout: this.options.timeout,
    });

    // Wait for at least one row or empty state
    const hasRows = await this.getRowCount();
    logger.debug(`Table loaded with ${hasRows} rows`);
  }

  /**
   * Get all column headers
   */
  async getHeaders(): Promise<string[]> {
    const headerRow = this.tableLocator
      .locator(this.options.headerSelector)
      .first();
    const headerCells = headerRow.locator("th, td");
    const count = await headerCells.count();

    this.headers = [];
    for (let i = 0; i < count; i++) {
      const text = await headerCells.nth(i).textContent();
      this.headers.push(text?.trim() || `Column${i}`);
    }

    return this.headers;
  }

  /**
   * Get the number of rows in the table
   */
  async getRowCount(): Promise<number> {
    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    return await rows.count();
  }

  /**
   * Get a row by index (0-based)
   */
  async getRowByIndex(index: number): Promise<TableRow> {
    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    const row = rows.nth(index);
    await row.waitFor({ state: "visible" });

    return this.parseRow(row, index);
  }

  /**
   * Find a row containing specific text
   */
  async getRowByText(text: string): Promise<TableRow | null> {
    logger.debug(`Finding row containing text: "${text}"`);
    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      if (rowText?.includes(text)) {
        return this.parseRow(row, i);
      }
    }

    logger.debug("Row not found");
    return null;
  }

  /**
   * Find all rows containing specific text
   */
  async getRowsByText(text: string): Promise<TableRow[]> {
    logger.debug(`Finding all rows containing text: "${text}"`);
    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    const count = await rows.count();
    const matchingRows: TableRow[] = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      if (rowText?.includes(text)) {
        matchingRows.push(await this.parseRow(row, i));
      }
    }

    logger.debug(`Found ${matchingRows.length} matching rows`);
    return matchingRows;
  }

  /**
   * Find a row by a specific column value
   */
  async getRowByColumnValue(
    columnHeader: string,
    value: string,
  ): Promise<TableRow | null> {
    if (this.headers.length === 0) {
      await this.getHeaders();
    }

    const columnIndex = this.headers.findIndex(
      (h) => h.toLowerCase() === columnHeader.toLowerCase(),
    );

    if (columnIndex === -1) {
      logger.warn(`Column "${columnHeader}" not found in headers`);
      return null;
    }

    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator(this.options.cellSelector);
      const cellText = await cells.nth(columnIndex).textContent();

      if (cellText?.trim() === value) {
        return this.parseRow(row, i);
      }
    }

    return null;
  }

  /**
   * Parse a row element into a TableRow object
   */
  private async parseRow(
    rowElement: Locator,
    index: number,
  ): Promise<TableRow> {
    if (this.headers.length === 0) {
      await this.getHeaders();
    }

    const cells = rowElement.locator(this.options.cellSelector);
    const cellCount = await cells.count();
    const cellValues: string[] = [];
    const data: Record<string, string> = {};

    for (let i = 0; i < cellCount; i++) {
      const text = (await cells.nth(i).textContent())?.trim() || "";
      cellValues.push(text);
      if (this.headers[i]) {
        data[this.headers[i]] = text;
      }
    }

    return {
      index,
      cells: cellValues,
      data,
      element: rowElement,
    };
  }

  /**
   * Extract all table data as an array of objects
   */
  async extractTableData(): Promise<Record<string, string>[]> {
    logger.debug("Extracting all table data");
    await this.getHeaders();

    const rows = this.tableLocator.locator(this.options.bodyRowSelector);
    const count = await rows.count();
    const data: Record<string, string>[] = [];

    for (let i = 0; i < count; i++) {
      const row = await this.parseRow(rows.nth(i), i);
      data.push(row.data);
    }

    logger.debug(`Extracted ${data.length} rows of data`);
    return data;
  }

  /**
   * Sort table by column header click
   */
  async sortByColumn(
    columnHeader: string,
    direction?: SortDirection,
  ): Promise<void> {
    logger.debug(`Sorting by column: ${columnHeader}`);
    const headerRow = this.tableLocator
      .locator(this.options.headerSelector)
      .first();
    const headers = headerRow.locator("th, td");
    const count = await headers.count();

    for (let i = 0; i < count; i++) {
      const headerCell = headers.nth(i);
      const text = await headerCell.textContent();
      if (text?.trim().toLowerCase().includes(columnHeader.toLowerCase())) {
        // Click to sort
        await headerCell.click();

        // If direction specified, click again if needed
        if (direction === "descending") {
          const ariaSort = await headerCell.getAttribute("aria-sort");
          if (ariaSort !== "descending") {
            await headerCell.click();
          }
        }

        logger.debug(`Sorted by ${columnHeader}`);
        return;
      }
    }

    logger.warn(`Column "${columnHeader}" not found for sorting`);
  }

  /**
   * Click on a cell in a specific row and column
   */
  async clickCell(rowIndex: number, columnHeader: string): Promise<void> {
    if (this.headers.length === 0) {
      await this.getHeaders();
    }

    const columnIndex = this.headers.findIndex(
      (h) => h.toLowerCase() === columnHeader.toLowerCase(),
    );

    if (columnIndex === -1) {
      throw new Error(`Column "${columnHeader}" not found`);
    }

    const row = this.tableLocator
      .locator(this.options.bodyRowSelector)
      .nth(rowIndex);
    const cell = row.locator(this.options.cellSelector).nth(columnIndex);
    await cell.click();
  }

  /**
   * Click on a link/button within a row
   */
  async clickRowAction(
    rowIndex: number,
    actionSelector: string,
  ): Promise<void> {
    const row = this.tableLocator
      .locator(this.options.bodyRowSelector)
      .nth(rowIndex);
    const action = row.locator(actionSelector);
    await action.click();
  }

  /**
   * Check/uncheck a row checkbox
   */
  async selectRow(rowIndex: number, select: boolean = true): Promise<void> {
    const row = this.tableLocator
      .locator(this.options.bodyRowSelector)
      .nth(rowIndex);
    const checkbox = row.locator('input[type="checkbox"]').first();

    if (select) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  /**
   * Select all rows
   */
  async selectAllRows(): Promise<void> {
    const headerCheckbox = this.tableLocator
      .locator(this.options.headerSelector)
      .locator('input[type="checkbox"]')
      .first();
    await headerCheckbox.check();
  }

  /**
   * Assert table contains a specific row
   */
  async assertRowExists(text: string): Promise<void> {
    const row = await this.getRowByText(text);
    expect(
      row,
      `Expected table to contain row with text "${text}"`,
    ).not.toBeNull();
  }

  /**
   * Assert table row count
   */
  async assertRowCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getRowCount();
    expect(
      actualCount,
      `Expected ${expectedCount} rows but found ${actualCount}`,
    ).toBe(expectedCount);
  }

  /**
   * Assert table is empty
   */
  async assertEmpty(): Promise<void> {
    const count = await this.getRowCount();
    expect(count, "Expected table to be empty").toBe(0);
  }

  /**
   * Assert table is not empty
   */
  async assertNotEmpty(): Promise<void> {
    const count = await this.getRowCount();
    expect(count, "Expected table to have at least one row").toBeGreaterThan(0);
  }

  /**
   * Get cell value at specific row and column
   */
  async getCellValue(rowIndex: number, columnHeader: string): Promise<string> {
    if (this.headers.length === 0) {
      await this.getHeaders();
    }

    const columnIndex = this.headers.findIndex(
      (h) => h.toLowerCase() === columnHeader.toLowerCase(),
    );

    if (columnIndex === -1) {
      throw new Error(`Column "${columnHeader}" not found`);
    }

    const row = this.tableLocator
      .locator(this.options.bodyRowSelector)
      .nth(rowIndex);
    const cell = row.locator(this.options.cellSelector).nth(columnIndex);
    return (await cell.textContent())?.trim() || "";
  }

  /**
   * Filter table (for tables with built-in filter)
   */
  async filterTable(
    filterValue: string,
    filterInputSelector: string = 'input[type="search"]',
  ): Promise<void> {
    logger.debug(`Filtering table with value: "${filterValue}"`);
    const filterInput = this.page.locator(filterInputSelector);
    await filterInput.fill(filterValue);
    await filterInput.press("Enter");

    // Wait for filter to apply
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to next page (pagination)
   */
  async nextPage(
    nextButtonSelector: string = '[aria-label="Next page"], .pagination-next',
  ): Promise<void> {
    const nextButton = this.page.locator(nextButtonSelector);
    await nextButton.click();
    await this.waitForTable();
  }

  /**
   * Navigate to previous page (pagination)
   */
  async previousPage(
    prevButtonSelector: string = '[aria-label="Previous page"], .pagination-prev',
  ): Promise<void> {
    const prevButton = this.page.locator(prevButtonSelector);
    await prevButton.click();
    await this.waitForTable();
  }

  /**
   * Go to specific page
   */
  async goToPage(
    pageNumber: number,
    pageInputSelector: string = ".pagination input",
  ): Promise<void> {
    const pageInput = this.page.locator(pageInputSelector);
    await pageInput.fill(String(pageNumber));
    await pageInput.press("Enter");
    await this.waitForTable();
  }
}

/**
 * Export singleton factory
 */
export function createTableHandler(
  page: Page,
  tableLocator: Locator,
  options?: TableHandlerOptions,
): TableHandler {
  return new TableHandler(page, tableLocator, options);
}
