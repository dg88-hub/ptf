/**
 * @fileoverview Barrel export for core framework modules.
 *
 * @module core
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { BasePage, TestContext, test, expect } from '../core';
 * ```
 */

// Page Object Base
export { BasePage } from './BasePage';

// Test Context & Data
export { ScopedTestContext, TestContext } from './TestContext';
export { TestDataProvider } from './TestDataProvider';

// Fixtures (re-export from fixtures.ts)
export { expect, test } from './fixtures';
export type { CustomFixtures } from './fixtures';
