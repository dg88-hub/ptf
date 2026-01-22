/**
 * @fileoverview Date Picker Handler utility for date picker interactions.
 * Provides methods for selecting dates in various date picker implementations.
 *
 * @module utils/DatePickerHandler
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Date pickers are common in enterprise applications for:
 * - Transaction date selection
 * - Report date ranges
 * - Scheduling and appointments
 * - Filter criteria
 *
 * This utility handles multiple date picker types:
 * - Native HTML5 date inputs
 * - Custom calendar widgets
 * - Date range pickers
 *
 * @example
 * ```typescript
 * const datePicker = new DatePickerHandler(page, page.locator('.date-picker'));
 *
 * // Select a specific date
 * await datePicker.selectDate(new Date('2025-01-15'));
 *
 * // Select a date range
 * await datePicker.selectDateRange(
 *   new Date('2025-01-01'),
 *   new Date('2025-01-31')
 * );
 * ```
 */

import { Locator, Page } from "@playwright/test";
import { logger } from "./Logger";

/**
 * Date picker options
 */
export interface DatePickerOptions {
  /** Format for date display */
  format?: string;
  /** Selector for the calendar popup */
  calendarSelector?: string;
  /** Selector for day cells */
  dayCellSelector?: string;
  /** Selector for month navigation */
  monthNavSelector?: {
    prev: string;
    next: string;
  };
  /** Selector for year navigation */
  yearNavSelector?: {
    prev: string;
    next: string;
  };
  /** Selector for month/year display */
  headerSelector?: string;
  /** Whether picker uses native HTML5 input */
  isNative?: boolean;
  /** Timeout for operations */
  timeout?: number;
}

/**
 * Date Picker Handler class
 */
export class DatePickerHandler {
  private page: Page;
  private pickerLocator: Locator;
  private options: Required<DatePickerOptions>;

  constructor(
    page: Page,
    pickerLocator: Locator,
    options: DatePickerOptions = {},
  ) {
    this.page = page;
    this.pickerLocator = pickerLocator;
    this.options = {
      format: options.format || "YYYY-MM-DD",
      calendarSelector:
        options.calendarSelector ||
        '.calendar, .datepicker-dropdown, [role="dialog"]',
      dayCellSelector:
        options.dayCellSelector || '.day, [role="gridcell"], td[data-date]',
      monthNavSelector: options.monthNavSelector || {
        prev: '.prev, [aria-label="Previous month"], .datepicker-prev',
        next: '.next, [aria-label="Next month"], .datepicker-next',
      },
      yearNavSelector: options.yearNavSelector || {
        prev: '.year-prev, [aria-label="Previous year"]',
        next: '.year-next, [aria-label="Next year"]',
      },
      headerSelector:
        options.headerSelector ||
        ".datepicker-title, .month-year, .calendar-header",
      isNative: options.isNative || false,
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Select a specific date
   */
  async selectDate(date: Date): Promise<void> {
    logger.debug(`Selecting date: ${date.toISOString().split("T")[0]}`);

    if (this.options.isNative) {
      await this.selectNativeDate(date);
    } else {
      await this.selectCalendarDate(date);
    }
  }

  /**
   * Select date on native HTML5 date input
   */
  private async selectNativeDate(date: Date): Promise<void> {
    const dateString = this.formatDate(date, "YYYY-MM-DD");
    await this.pickerLocator.fill(dateString);
  }

  /**
   * Select date on custom calendar picker
   */
  private async selectCalendarDate(date: Date): Promise<void> {
    // Open the calendar
    await this.pickerLocator.click();
    await this.waitForCalendar();

    // Navigate to the correct month/year
    await this.navigateToMonth(date);

    // Select the day
    await this.selectDay(date.getDate());
  }

  /**
   * Wait for calendar popup to appear
   */
  async waitForCalendar(): Promise<void> {
    const calendar = this.page.locator(this.options.calendarSelector);
    await calendar.waitFor({ state: "visible", timeout: this.options.timeout });
    logger.debug("Calendar is visible");
  }

  /**
   * Navigate to a specific month and year
   */
  async navigateToMonth(targetDate: Date): Promise<void> {
    const calendar = this.page.locator(this.options.calendarSelector);
    const headerText = calendar.locator(this.options.headerSelector);

    // Get current displayed month/year
    let currentDate = await this.getDisplayedDate();
    let attempts = 0;
    const maxAttempts = 24; // 2 years max navigation

    while (attempts < maxAttempts) {
      if (
        currentDate.getMonth() === targetDate.getMonth() &&
        currentDate.getFullYear() === targetDate.getFullYear()
      ) {
        break;
      }

      // Determine navigation direction
      if (targetDate < currentDate) {
        // Navigate backward
        const prevButton = calendar.locator(this.options.monthNavSelector.prev);
        await prevButton.click();
      } else {
        // Navigate forward
        const nextButton = calendar.locator(this.options.monthNavSelector.next);
        await nextButton.click();
      }

      // Wait for calendar to update
      await this.page.waitForTimeout(100);
      currentDate = await this.getDisplayedDate();
      attempts++;
    }

    logger.debug(
      `Navigated to ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`,
    );
  }

  /**
   * Get the currently displayed month/year from the calendar header
   */
  private async getDisplayedDate(): Promise<Date> {
    const calendar = this.page.locator(this.options.calendarSelector);
    const headerText = await calendar
      .locator(this.options.headerSelector)
      .textContent();

    if (!headerText) {
      return new Date();
    }

    // Parse various formats: "January 2025", "Jan 2025", "01/2025"
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const shortMonths = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    const text = headerText.toLowerCase().trim();
    let month = 0;
    let year = new Date().getFullYear();

    // Try to find month name
    for (let i = 0; i < monthNames.length; i++) {
      if (text.includes(monthNames[i]) || text.includes(shortMonths[i])) {
        month = i;
        break;
      }
    }

    // Extract year
    const yearMatch = text.match(/\d{4}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }

    return new Date(year, month, 1);
  }

  /**
   * Select a specific day in the current calendar view
   */
  private async selectDay(day: number): Promise<void> {
    const calendar = this.page.locator(this.options.calendarSelector);
    const daySelector = this.options.dayCellSelector;

    // Find the day cell - various strategies
    const dayCell = calendar
      .locator(
        `${daySelector}:text("${day}"):not(.disabled):not(.other-month),` +
          `${daySelector}[data-date$="-${String(day).padStart(2, "0")}"],` +
          `${daySelector}[data-day="${day}"]`,
      )
      .first();

    await dayCell.click();
    logger.debug(`Selected day: ${day}`);
  }

  /**
   * Select a date range (for range pickers)
   */
  async selectDateRange(startDate: Date, endDate: Date): Promise<void> {
    logger.debug(
      `Selecting date range: ${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`,
    );

    // Select start date
    await this.selectDate(startDate);

    // For range pickers, calendar should still be open for end date
    try {
      await this.page.waitForTimeout(200);
      await this.navigateToMonth(endDate);
      await this.selectDay(endDate.getDate());
    } catch {
      // If calendar closed, try clicking end date input
      const endInput = this.pickerLocator
        .locator('[class*="end"],' + ' [name*="end"],' + ' [data-type="end"]')
        .first();

      const hasEndInput = (await endInput.count()) > 0;
      if (hasEndInput) {
        await endInput.click();
        await this.waitForCalendar();
        await this.navigateToMonth(endDate);
        await this.selectDay(endDate.getDate());
      }
    }
  }

  /**
   * Get the currently selected date
   */
  async getSelectedDate(): Promise<Date | null> {
    const value = await this.pickerLocator.inputValue();
    if (!value) return null;

    // Try to parse the date
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  /**
   * Clear the date picker
   */
  async clear(): Promise<void> {
    await this.pickerLocator.clear();
    logger.debug("Date picker cleared");
  }

  /**
   * Check if a date is selectable (not disabled)
   */
  async isDateSelectable(date: Date): Promise<boolean> {
    await this.pickerLocator.click();
    await this.waitForCalendar();
    await this.navigateToMonth(date);

    const calendar = this.page.locator(this.options.calendarSelector);
    const day = date.getDate();
    const dayCell = calendar
      .locator(`${this.options.dayCellSelector}:text("${day}")`)
      .first();

    const isDisabled = await dayCell.evaluate(
      (el) =>
        el.classList.contains("disabled") ||
        el.getAttribute("aria-disabled") === "true" ||
        el.hasAttribute("disabled"),
    );

    // Close calendar
    await this.page.keyboard.press("Escape");

    return !isDisabled;
  }

  /**
   * Navigate to today
   */
  async goToToday(): Promise<void> {
    await this.selectDate(new Date());
  }

  /**
   * Select today's date
   */
  async selectToday(): Promise<void> {
    await this.pickerLocator.click();
    await this.waitForCalendar();

    const calendar = this.page.locator(this.options.calendarSelector);
    const todayButton = calendar.locator(
      '.today, [data-date="today"], button:text("Today")',
    );

    if ((await todayButton.count()) > 0) {
      await todayButton.click();
    } else {
      await this.selectDate(new Date());
    }
  }

  /**
   * Format a date according to the specified format
   */
  formatDate(date: Date, format: string = this.options.format): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("M", String(date.getMonth() + 1))
      .replace("D", String(date.getDate()));
  }

  /**
   * Parse a date string according to format
   */
  parseDate(dateString: string, format: string = this.options.format): Date {
    // Simple parsing for common formats
    const parts = dateString.match(/\d+/g);
    if (!parts) return new Date();

    let year: number, month: number, day: number;

    if (format.startsWith("YYYY")) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (format.startsWith("DD")) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    } else {
      // MM/DD/YYYY format
      month = parseInt(parts[0], 10) - 1;
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }

    return new Date(year, month, day);
  }

  /**
   * Set date by typing (for editable inputs)
   */
  async typeDate(date: Date, format?: string): Promise<void> {
    const dateString = this.formatDate(date, format);
    await this.pickerLocator.fill(dateString);
  }
}

/**
 * Export factory function
 */
export function createDatePickerHandler(
  page: Page,
  pickerLocator: Locator,
  options?: DatePickerOptions,
): DatePickerHandler {
  return new DatePickerHandler(page, pickerLocator, options);
}
