/**
 * @fileoverview Custom Playwright fixtures for dependency injection.
 * Extends the base Playwright test with custom fixtures for page objects,
 * API clients, and other test dependencies.
 *
 * @module core/fixtures
 * @author DG
 * @version 1.0.0
 */

import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import { Config, config } from '../config';
import { AppManager } from '../pages/AppManager';
import { ApplicationFactory } from '../pages/ApplicationFactory';
import { logger } from '../utils/Logger';
import { ScopedTestContext, TestContext, testContext } from './TestContext';
import { TestDataProvider } from './TestDataProvider';

/**
 * Custom test options that can be configured per test or globally
 */
export interface CustomTestOptions {
  /** Environment configuration */
  envConfig: Config;
}

/**
 * Custom fixtures available in tests
 */
export interface CustomFixtures {
  /** API client for making HTTP requests */
  apiClient: ApiClient;
  /** Application Manager (Facade) */
  app: AppManager;
  /** Test context for cross-test data sharing */
  testCtx: TestContext;
  /** Scoped context for current test file */
  scopedContext: ScopedTestContext;
  /** Test data provider */
  dataProvider: TestDataProvider;
}

/**
 * Extended test with custom fixtures
 *
 * @example
 * ```typescript
 * import { test, expect } from '../src/core/fixtures';
 *
 * test('example with fixtures', async ({ page, apiClient, loginPage }) => {
 *   await loginPage.navigate('/login');
 *   // ... test code
 * });
 * ```
 */
export const test = base.extend<CustomTestOptions & CustomFixtures>({
  /**
   * Environment configuration fixture
   * Provides access to the current environment settings
   */
  envConfig: [config, { option: true }],

  /**
   * API client fixture
   * Creates a new API client instance for each test
   */
  apiClient: async ({ request }, use) => {
    logger.debug('Creating API client fixture');
    const apiClient = new ApiClient(request, config.environment.apiBaseUrl);
    await use(apiClient);
    logger.debug('API client fixture cleanup');
  },

  /**
   * Application Manager fixture
   * Provides access to all page objects via the Facade pattern
   */
  app: async ({ page }, use) => {
    logger.debug('Creating AppManager fixture');
    const app = ApplicationFactory.createApp(page);
    await use(app);
  },

  /**
   * Test context fixture
   * Provides access to the global test context
   */
  testCtx: async ({}, use) => {
    await use(testContext);
  },

  /**
   * Scoped test context fixture
   * Provides a namespace-scoped context for the current test
   */
  scopedContext: async ({}, use, testInfo) => {
    // Create a namespace based on the test file name and test title
    const namespace = `${testInfo.titlePath[0]}-${testInfo.title}`.replace(/[^a-zA-Z0-9-]/g, '_');
    const scoped = testContext.scoped(namespace);
    await use(scoped);
  },

  /**
   * Test data provider fixture
   * Provides data loading capabilities based on test file name
   */
  dataProvider: async ({}, use, testInfo) => {
    // Use the test file name (without extension) as the default suite ID
    const fileName = testInfo.titlePath[0].split('/').pop()?.split('.')[0] || 'default';
    const provider = new TestDataProvider(fileName);
    await use(provider);
  },
});

/**
 * Re-export expect for convenience
 */
export { expect };

/**
 * Test annotations for categorizing tests
 */
export const annotations = {
  /**
   * Mark test as smoke test
   */
  smoke: { type: 'category', description: 'Smoke Test' },
  /**
   * Mark test as sanity test
   */
  sanity: { type: 'category', description: 'Sanity Test' },
  /**
   * Mark test as regression test
   */
  regression: { type: 'category', description: 'Regression Test' },
  /**
   * Mark test as health check
   */
  healthCheck: { type: 'category', description: 'Health Check' },
  /**
   * Mark test as API test
   */
  api: { type: 'category', description: 'API Test' },
  /**
   * Mark test as database test
   */
  database: { type: 'category', description: 'Database Test' },
  /**
   * Mark test as mobile test
   */
  mobile: { type: 'category', description: 'Mobile Test' },
};

/**
 * Test tags for filtering test execution
 * Usage: test('my test @smoke @critical', ...)
 */
export const tags = {
  SMOKE: '@smoke',
  SANITY: '@sanity',
  REGRESSION: '@regression',
  HEALTH: '@health',
  API: '@api',
  DB: '@db',
  MOBILE: '@mobile',
  CRITICAL: '@critical',
  FLAKY: '@flaky',
} as const;

export default test;
