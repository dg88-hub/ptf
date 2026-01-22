/**
 * @fileoverview Branded type utilities for stronger type safety
 * @module types/branded
 */

/**
 * Branded type utility to create nominal types from primitives
 *
 * Branded types prevent accidental assignment between semantically different
 * but structurally identical types.
 *
 * @example
 * ```typescript
 * // Define branded types
 * type UserId = Brand<string, 'UserId'>;
 * type OrderId = Brand<string, 'OrderId'>;
 *
 * // Create instances
 * const userId: UserId = 'user_123' as UserId;
 * const orderId: OrderId = 'order_456' as OrderId;
 *
 * // Type error - prevents accidental misuse
 * const wrongId: UserId = orderId; // ❌ Error!
 * ```
 */
export type Brand<T, TBrand extends string> = T & { __brand: TBrand };

/**
 * User ID branded type
 * Ensures user IDs can't be accidentally mixed with other string IDs
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * Session ID branded type
 * Ensures session identifiers are type-safe
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * API Token branded type
 * Ensures auth tokens are handled with type safety
 */
export type ApiToken = Brand<string, 'ApiToken'>;

/**
 * Order ID branded type
 * Ensures order IDs can't be accidentally mixed with other identifiers
 */
export type OrderId = Brand<string, 'OrderId'>;

/**
 * Product ID branded type
 * Ensures product IDs are type-safe
 */
export type ProductId = Brand<string, 'ProductId'>;

/**
 * Email address branded type
 * Ensures email addresses are validated and type-safe
 */
export type EmailAddress = Brand<string, 'EmailAddress'>;

/**
 * URL branded type
 * Ensures URLs are validated and type-safe
 */
export type Url = Brand<string, 'Url'>;

/**
 * Timestamp branded type (milliseconds since epoch)
 * Ensures timestamps are explicitly typed
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Positive number branded type
 * Ensures a number is always positive
 */
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

/**
 * Non-empty string branded type
 * Ensures a string is never empty
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>;

/**
 * Type guard to check if a string is non-empty
 *
 * @param value - String to check
 * @returns True if string is non-empty
 *
 * @example
 * ```typescript
 * const input: string = getUserInput();
 * if (isNonEmptyString(input)) {
 *   const safe: NonEmptyString = input; // ✅ Type-safe
 * }
 * ```
 */
export function isNonEmptyString(value: string): value is NonEmptyString {
  return value.length > 0;
}

/**
 * Type guard to check if a number is positive
 *
 * @param value - Number to check
 * @returns True if number is positive
 *
 * @example
 * ```typescript
 * const count: number = getCount();
 * if (isPositiveNumber(count)) {
 *   const safe: PositiveNumber = count; // ✅ Type-safe
 * }
 * ```
 */
export function isPositiveNumber(value: number): value is PositiveNumber {
  return value > 0;
}

/**
 * Type guard to check if a string is a valid email
 *
 * @param value - String to check
 * @returns True if string is a valid email format
 *
 * @example
 * ```typescript
 * const email: string = 'user@example.com';
 * if (isEmailAddress(email)) {
 *   const safe: EmailAddress = email; // ✅ Type-safe
 * }
 * ```
 */
export function isEmailAddress(value: string): value is EmailAddress {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard to check if a string is a valid URL
 *
 * @param value - String to check
 * @returns True if string is a valid URL format
 *
 * @example
 * ```typescript
 * const link: string = 'https://example.com';
 * if (isUrl(link)) {
 *   const safe: Url = link; // ✅ Type-safe
 * }
 * ```
 */
export function isUrl(value: string): value is Url {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a branded UserId from a string
 *
 * @param id - User identifier
 * @returns Branded UserId
 */
export function createUserId(id: string): UserId {
  if (!id || id.trim().length === 0) {
    throw new Error('User ID cannot be empty');
  }
  return id as UserId;
}

/**
 * Create a branded SessionId from a string
 *
 * @param id - Session identifier
 * @returns Branded SessionId
 */
export function createSessionId(id: string): SessionId {
  if (!id || id.trim().length === 0) {
    throw new Error('Session ID cannot be empty');
  }
  return id as SessionId;
}

/**
 * Create a branded ApiToken from a string
 *
 * @param token - API token
 * @returns Branded ApiToken
 */
export function createApiToken(token: string): ApiToken {
  if (!token || token.trim().length === 0) {
    throw new Error('API token cannot be empty');
  }
  return token as ApiToken;
}

/**
 * Create a branded EmailAddress from a string
 *
 * @param email - Email address
 * @returns Branded EmailAddress
 * @throws Error if email format is invalid
 */
export function createEmailAddress(email: string): EmailAddress {
  if (!isEmailAddress(email)) {
    throw new Error(`Invalid email address: ${email}`);
  }
  return email;
}

/**
 * Create a branded Url from a string
 *
 * @param url - URL string
 * @returns Branded Url
 * @throws Error if URL format is invalid
 */
export function createUrl(url: string): Url {
  if (!isUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }
  return url;
}

/**
 * Create a branded Timestamp from milliseconds
 *
 * @param ms - Milliseconds since epoch
 * @returns Branded Timestamp
 */
export function createTimestamp(ms: number = Date.now()): Timestamp {
  return ms as Timestamp;
}

/**
 * Create a branded PositiveNumber
 *
 * @param value - Number to brand
 * @returns Branded PositiveNumber
 * @throws Error if number is not positive
 */
export function createPositiveNumber(value: number): PositiveNumber {
  if (!isPositiveNumber(value)) {
    throw new Error(`Value must be positive: ${value}`);
  }
  return value;
}
