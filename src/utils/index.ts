/**
 * @fileoverview Barrel export for all utility modules.
 *
 * Import utilities from this single entry point for cleaner imports.
 *
 * @module utils
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * // Instead of multiple imports:
 * // import { DataGenerator } from '../utils/DataGenerator';
 * // import { StringUtils } from '../utils/StringUtils';
 *
 * // Use single import:
 * import { DataGenerator, StringUtils, Logger } from '../utils';
 * ```
 */

// Data Generation
export { DataGenerator, dataGenerator } from './DataGenerator';
export { AddressFactory, OrderFactory, UserFactory } from './TestDataFactory';

// Domain-Specific Factories
export {
  ChartAccountFactory,
  InvoiceFactory,
  JournalEntryFactory,
  PaymentFactory,
  VendorFactory,
} from './ErpDataFactory';
export {
  ClaimFactory,
  CustomerFactory,
  PolicyFactory,
  PremiumCalculator,
  UnderwritingFactory,
} from './InsuranceDataFactory';

// String & Data Utilities
export { StringUtils } from './StringUtils';
export { TimeUtils } from './TimeUtils';

// File Handlers
export { CsvHandler } from './CsvHandler';
export { ExcelHandler } from './ExcelHandler';
export { default as SftpHandler } from './SftpClient';

// Form & UI Handlers
export { DatePickerHandler } from './DatePickerHandler';
export { FormHandler } from './FormHandler';
export { TableHandler } from './TableHandler';

// Testing Utilities
export { AccessibilityHelper } from './AccessibilityHelper';
export { PerformanceMetrics } from './PerformanceMetrics';
export { RetryHelper } from './RetryHelper';
export { SchemaValidator } from './SchemaValidator';

// Email
export { EmailValidator } from './EmailValidator';

// Logging
export { LogLevel, logger } from './Logger';

// Decorators
export { Step } from './decorators';
