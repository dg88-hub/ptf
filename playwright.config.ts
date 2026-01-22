import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

/**
 * Load environment variables from .env file
 * @see https://github.com/motdotla/dotenv
 */
dotenv.config();

/**
 * Get the test environment from environment variable
 * Defaults to 'sit' if not specified
 */
const TEST_ENV = process.env.TEST_ENV || 'sit';

/**
 * Base URLs for different environments
 */
const ENV_URLS: Record<string, string> = {
  sit: process.env.SIT_BASE_URL || 'https://the-internet.herokuapp.com',
  fat: process.env.FAT_BASE_URL || 'https://the-internet.herokuapp.com',
  uat: process.env.UAT_BASE_URL || 'https://the-internet.herokuapp.com',
};

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /**
   * Directory containing test files
   */
  testDir: './tests',

  /**
   * Pattern to match test files
   */
  testMatch: '**/*.spec.ts',

  /**
   * Run tests in files in parallel
   */
  fullyParallel: true,

  /**
   * Fail the build on CI if you accidentally left test.only in the source code
   */
  forbidOnly: !!process.env.CI,

  /**
   * Retry failed tests on CI
   * Local: 0 retries, CI: 2 retries
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Number of parallel workers
   * CI: 1 worker for stability, Local: 50% of CPU cores
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * Reporter configuration
   * Supports multiple output formats including Allure for rich reporting
   */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['dot'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // Allure reporter for rich test reports
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],

  /**
   * Shared settings for all projects
   * @see https://playwright.dev/docs/api/class-testoptions
   */
  /**
   * globalSetup: runs authentication once before all tests
   */
  globalSetup: require.resolve('./src/global-setup.ts'),

  /**
   * Shared settings for all projects
   */
  use: {
    // ... existing config ...
    baseURL: ENV_URLS[TEST_ENV],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Load signed-in state from global-setup
    storageState: 'test-results/storageState.json',

    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /**
   * Global timeout for each test
   */
  timeout: 60000,

  /**
   * Timeout for expect assertions
   */
  expect: {
    timeout: 10000,
  },

  /**
   * Output directory for test artifacts
   */
  outputDir: 'test-results/',

  /**
   * Browser project configurations
   */
  projects: [
    // ============================================
    // Desktop Browsers
    // ============================================
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // ============================================
    // Mobile Emulation
    // ============================================
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },

    // ============================================
    // Branded Browsers (Windows)
    // ============================================
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],

  /**
   * Global setup script
   * Runs once before all tests
   */
  // globalSetup: require.resolve('./src/config/global-setup.ts'),

  /**
   * Global teardown script
   * Runs once after all tests
   */
  // globalTeardown: require.resolve('./src/config/global-teardown.ts'),
});
