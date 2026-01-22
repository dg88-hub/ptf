/**
 * @fileoverview Schema Validator utility for API response validation.
 * Uses Ajv (Another JSON Validator) for fast JSON schema validation.
 *
 * @module utils/SchemaValidator
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * JSON Schema validation ensures API responses match expected contracts.
 * This catches breaking changes early and improves API test reliability.
 *
 * @example
 * ```typescript
 * import { schemaValidator, userSchema } from '../utils/SchemaValidator';
 *
 * // Validate API response
 * const response = await api.get('/users/1');
 * const isValid = schemaValidator.validate(userSchema, response.data);
 *
 * if (!isValid) {
 *   console.log('Validation errors:', schemaValidator.getErrors());
 * }
 * ```
 */

import Ajv from 'ajv';
import { logger } from './Logger';

/**
 * Ajv error object interface
 */
interface AjvError {
  instancePath?: string;
  message?: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

/**
 * Common schema definitions for reuse
 */
export interface UserSchema {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: T[];
}

/**
 * Schema Validator class using Ajv
 *
 * @example
 * ```typescript
 * const validator = new SchemaValidator();
 *
 * // Define a schema
 * const userSchema = {
 *   type: 'object',
 *   properties: {
 *     id: { type: 'number' },
 *     email: { type: 'string', format: 'email' },
 *     name: { type: 'string' }
 *   },
 *   required: ['id', 'email']
 * };
 *
 * // Validate data
 * const isValid = validator.validate(userSchema, responseData);
 * ```
 */
export class SchemaValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ajv: any;
  private lastErrors: AjvError[] | null = null;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true, // Report all errors, not just first
      verbose: true, // Include data in errors
    });
  }

  /**
   * Validate data against a JSON schema
   * @param schema - JSON schema object
   * @param data - Data to validate
   * @returns True if valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = validator.validate(userSchema, { id: 1, email: 'test@test.com' });
   * ```
   */
  validate(schema: object, data: unknown): boolean {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    this.lastErrors = (validate.errors as AjvError[]) || null;

    if (!valid) {
      logger.warn('[SchemaValidator] Validation failed', {
        errors: this.formatErrors(),
      });
    }

    return valid;
  }

  /**
   * Compile a schema for repeated validation
   * @param schema - JSON schema object
   * @returns Compiled validation function
   *
   * @example
   * ```typescript
   * const validateUser = validator.compile(userSchema);
   * const isValid1 = validateUser(user1);
   * const isValid2 = validateUser(user2);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compile(schema: object): (data: unknown) => boolean {
    return this.ajv.compile(schema) as (data: unknown) => boolean;
  }

  /**
   * Get the last validation errors
   * @returns Array of error objects or null
   */
  getErrors(): AjvError[] | null {
    return this.lastErrors;
  }

  /**
   * Get formatted error messages
   * @returns Array of human-readable error strings
   */
  formatErrors(): string[] {
    if (!this.lastErrors) {
      return [];
    }

    return this.lastErrors.map((error) => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message || 'validation error'}`;
    });
  }

  /**
   * Assert that data matches schema (throws on failure)
   * @param schema - JSON schema object
   * @param data - Data to validate
   * @throws Error if validation fails
   *
   * @example
   * ```typescript
   * // Will throw if invalid
   * validator.assertValid(userSchema, response.data);
   * ```
   */
  assertValid(schema: object, data: unknown): void {
    if (!this.validate(schema, data)) {
      const errors = this.formatErrors().join('; ');
      throw new Error(`Schema validation failed: ${errors}`);
    }
  }
}

// ============================================
// Pre-defined Schemas
// ============================================

/**
 * User schema for API testing
 */
export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    email: { type: 'string' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    avatar: { type: 'string' },
  },
  required: ['id', 'email'],
  additionalProperties: true,
} as const;

/**
 * Paginated response schema wrapper
 */
export const createPaginatedSchema = (itemSchema: object): object => ({
  type: 'object',
  properties: {
    page: { type: 'number' },
    per_page: { type: 'number' },
    total: { type: 'number' },
    total_pages: { type: 'number' },
    data: {
      type: 'array',
      items: itemSchema,
    },
  },
  required: ['page', 'data'],
  additionalProperties: true,
});

/**
 * Error response schema
 */
export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
  required: ['error'],
  additionalProperties: true,
} as const;

/**
 * Singleton schema validator instance
 */
export const schemaValidator = new SchemaValidator();

export default schemaValidator;
