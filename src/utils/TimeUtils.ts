import { addDays, format, subDays } from 'date-fns';

/**
 * Utility for Date/Time operations.
 * Wraps date-fns to provide standard formats for the framework.
 */
export class TimeUtils {
  /**
   * Get current date in 'yyyy-MM-dd' format (or custom)
   */
  static getCurrentDate(pattern: string = 'yyyy-MM-dd'): string {
    return format(new Date(), pattern);
  }

  /**
   * Get date relative to today (e.g. +5 days)
   */
  static getFutureDate(days: number, pattern: string = 'yyyy-MM-dd'): string {
    return format(addDays(new Date(), days), pattern);
  }

  /**
   * Get past date (e.g. -5 days)
   */
  static getPastDate(days: number, pattern: string = 'yyyy-MM-dd'): string {
    return format(subDays(new Date(), days), pattern);
  }

  /**
   * Get current timestamp as string (useful for unique names)
   */
  static getTimestamp(): string {
    return new Date().getTime().toString();
  }
}
