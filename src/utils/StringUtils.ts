/**
 * @fileoverview Pure String Manipulation Utilities.
 *
 * This module provides string transformation and validation utilities.
 * For generating test data (random strings, emails, etc.), use `DataGenerator` instead.
 *
 * @module utils/StringUtils
 * @author DG
 * @version 2.0.0
 *
 * @example
 * ```typescript
 * import { StringUtils } from '../utils/StringUtils';
 *
 * // Sanitize user input
 * const clean = StringUtils.sanitize('Hello! @World#');  // 'Hello World'
 *
 * // Truncate long text
 * const short = StringUtils.truncate('Long text here', 10);  // 'Long te...'
 *
 * // Convert to different cases
 * const camel = StringUtils.toCamelCase('hello-world');  // 'helloWorld'
 * const snake = StringUtils.toSnakeCase('helloWorld');   // 'hello_world'
 * ```
 */

/**
 * Pure string manipulation utilities.
 *
 * For data generation (emails, passwords, etc.), use `DataGenerator`.
 */
export class StringUtils {
  // ============================================
  // Sanitization
  // ============================================

  /**
   * Remove special characters from a string, keeping only alphanumeric and spaces.
   *
   * @param input - The string to sanitize
   * @returns Sanitized string
   *
   * @example
   * ```typescript
   * StringUtils.sanitize('Hello! @World#');  // 'Hello World'
   * StringUtils.sanitize('Test123$%^');      // 'Test123'
   * ```
   */
  static sanitize(input: string): string {
    return input.replace(/[^a-zA-Z0-9 ]/g, '');
  }

  /**
   * Remove all whitespace from a string.
   *
   * @param input - The string to process
   * @returns String without whitespace
   */
  static removeWhitespace(input: string): string {
    return input.replace(/\s/g, '');
  }

  /**
   * Normalize whitespace (collapse multiple spaces into single space).
   *
   * @param input - The string to normalize
   * @returns String with normalized whitespace
   */
  static normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  // ============================================
  // Truncation
  // ============================================

  /**
   * Truncate a string to a maximum length, adding ellipsis if truncated.
   *
   * @param input - The string to truncate
   * @param maxLength - Maximum length (including ellipsis)
   * @param suffix - Suffix to add when truncated (default: '...')
   * @returns Truncated string
   *
   * @example
   * ```typescript
   * StringUtils.truncate('Hello World', 8);        // 'Hello...'
   * StringUtils.truncate('Short', 10);             // 'Short'
   * StringUtils.truncate('Hello World', 8, '…');   // 'Hello W…'
   * ```
   */
  static truncate(input: string, maxLength: number, suffix: string = '...'): string {
    if (input.length <= maxLength) {
      return input;
    }
    return input.substring(0, maxLength - suffix.length) + suffix;
  }

  // ============================================
  // Case Conversion
  // ============================================

  /**
   * Convert string to camelCase.
   *
   * @param input - The string to convert (kebab-case, snake_case, or space-separated)
   * @returns camelCase string
   *
   * @example
   * ```typescript
   * StringUtils.toCamelCase('hello-world');   // 'helloWorld'
   * StringUtils.toCamelCase('hello_world');   // 'helloWorld'
   * StringUtils.toCamelCase('Hello World');   // 'helloWorld'
   * ```
   */
  static toCamelCase(input: string): string {
    return input.toLowerCase().replace(/[-_\s](.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * Convert string to snake_case.
   *
   * @param input - The string to convert
   * @returns snake_case string
   *
   * @example
   * ```typescript
   * StringUtils.toSnakeCase('helloWorld');    // 'hello_world'
   * StringUtils.toSnakeCase('HelloWorld');    // 'hello_world'
   * StringUtils.toSnakeCase('hello-world');   // 'hello_world'
   * ```
   */
  static toSnakeCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]/g, '_')
      .toLowerCase();
  }

  /**
   * Convert string to kebab-case.
   *
   * @param input - The string to convert
   * @returns kebab-case string
   *
   * @example
   * ```typescript
   * StringUtils.toKebabCase('helloWorld');    // 'hello-world'
   * StringUtils.toKebabCase('HelloWorld');    // 'hello-world'
   * StringUtils.toKebabCase('hello_world');   // 'hello-world'
   * ```
   */
  static toKebabCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]/g, '-')
      .toLowerCase();
  }

  /**
   * Convert string to Title Case.
   *
   * @param input - The string to convert
   * @returns Title Case string
   *
   * @example
   * ```typescript
   * StringUtils.toTitleCase('hello world');   // 'Hello World'
   * StringUtils.toTitleCase('HELLO WORLD');   // 'Hello World'
   * ```
   */
  static toTitleCase(input: string): string {
    return input.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Check if a string is empty or contains only whitespace.
   *
   * @param input - The string to check
   * @returns True if empty or whitespace-only
   */
  static isEmpty(input: string | null | undefined): boolean {
    return !input || input.trim().length === 0;
  }

  /**
   * Check if a string is a valid email format.
   *
   * @param input - The string to check
   * @returns True if valid email format
   */
  static isValidEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  /**
   * Check if a string contains only numeric characters.
   *
   * @param input - The string to check
   * @returns True if numeric only
   */
  static isNumeric(input: string): boolean {
    return /^\d+$/.test(input);
  }

  // ============================================
  // Extraction
  // ============================================

  /**
   * Extract all numbers from a string.
   *
   * @param input - The string to extract from
   * @returns Array of numbers found
   *
   * @example
   * ```typescript
   * StringUtils.extractNumbers('Price: $123.45');  // [123, 45]
   * StringUtils.extractNumbers('Item 1, Item 2');  // [1, 2]
   * ```
   */
  static extractNumbers(input: string): number[] {
    const matches = input.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  }

  /**
   * Extract the first number from a string.
   *
   * @param input - The string to extract from
   * @returns First number found or null
   */
  static extractFirstNumber(input: string): number | null {
    const match = input.match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  // ============================================
  // Legacy Compatibility (DEPRECATED)
  // ============================================

  /**
   * @deprecated Use `DataGenerator.randomString()` instead. Will be removed in v3.0.
   */
  static generateRandomString(length: number): string {
    console.warn(
      'StringUtils.generateRandomString is deprecated. Use DataGenerator.randomString() instead.'
    );
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * @deprecated Use `DataGenerator.generateEmail()` instead. Will be removed in v3.0.
   */
  static generateRandomEmail(domain: string = 'example.com'): string {
    console.warn(
      'StringUtils.generateRandomEmail is deprecated. Use DataGenerator.generateEmail() instead.'
    );
    const user = this.generateRandomString(8);
    return `${user}@${domain}`;
  }
}
