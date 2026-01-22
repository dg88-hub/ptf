/**
 * @fileoverview Zod schema validation for framework configuration
 * @module config/schema
 */

import { z } from 'zod';

/**
 * Database configuration schema
 */
const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.number().int().positive(),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Database username is required'),
  password: z.string().min(1, 'Database password is required'),
  ssl: z.boolean().optional().default(false),
});

/**
 * SFTP configuration schema
 */
const SftpConfigSchema = z.object({
  host: z.string().min(1, 'SFTP host is required'),
  port: z.number().int().positive().default(22),
  username: z.string().min(1, 'SFTP username is required'),
  password: z.string().optional(),
  privateKey: z.string().optional(),
});

/**
 * Email configuration schema
 */
const EmailConfigSchema = z.object({
  host: z.string().min(1, 'Email host is required'),
  port: z.number().int().positive(),
  secure: z.boolean().default(true),
  username: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Email password is required'),
  from: z.string().email('Invalid sender email format'),
});

/**
 * Application credentials schema
 */
const AppCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Environment configuration schema
 */
const EnvironmentConfigSchema = z.object({
  name: z.enum(['dev', 'staging', 'prod']),
  baseUrl: z.string().url('Invalid base URL format'),
  apiBaseUrl: z.string().url('Invalid API base URL format').optional(),
  timeout: z.number().int().positive().default(30000),
  headless: z.boolean().default(true),
});

/**
 * Complete framework configuration schema
 */
export const FrameworkConfigSchema = z.object({
  testEnv: z.enum(['dev', 'staging', 'prod']),
  environments: z.record(z.string(), EnvironmentConfigSchema),
  database: z.record(z.string(), DatabaseConfigSchema).optional(),
  sftp: SftpConfigSchema.optional(),
  email: EmailConfigSchema.optional(),
  credentials: z
    .object({
      sauce: AppCredentialsSchema.optional(),
      parabank: AppCredentialsSchema.optional(),
    })
    .optional(),
});

/**
 * Inferred TypeScript type from schema
 */
export type ValidatedFrameworkConfig = z.infer<typeof FrameworkConfigSchema>;

/**
 * Validate configuration object against schema
 *
 * @param config - Configuration object to validate
 * @returns Validated configuration
 * @throws ZodError if validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * try {
 *   const validConfig = validateConfig(config);
 *   console.log('Config is valid:', validConfig);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Config validation failed:', error.errors);
 *   }
 * }
 * ```
 */
export function validateConfig(config: unknown): ValidatedFrameworkConfig {
  return FrameworkConfigSchema.parse(config);
}

/**
 * Safely validate configuration with fallback
 *
 * @param config - Configuration object to validate
 * @returns Validation result with success flag
 *
 * @example
 * ```typescript
 * const result = safeValidateConfig(config);
 * if (result.success) {
 *   console.log('Valid config:', result.data);
 * } else {
 *   console.error('Invalid config:', result.error.errors);
 * }
 * ```
 */
export function safeValidateConfig(config: unknown) {
  return FrameworkConfigSchema.safeParse(config);
}
