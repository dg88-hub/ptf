/**
 * @fileoverview Test Data Provider for data-driven testing.
 * Loads test data from JSON, Excel, CSV, and environment configuration.
 * All URLs and test data are parameterized from external sources.
 *
 * @module core/TestDataProvider
 * @author DG
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { csvHandler } from '../utils/CsvHandler';
import { excelHandler } from '../utils/ExcelHandler';
import { logger } from '../utils/Logger';

/**
 * Test data configuration loaded from JSON
 */
export interface TestDataConfig {
  /** Test suite identifier */
  suiteId: string;
  /** Environment-specific URLs */
  urls?: Record<string, string>;
  /** User credentials */
  credentials?: Record<string, { username: string; password: string }>;
  /** API endpoints */
  endpoints?: Record<string, string>;
  /** Test-specific data */
  testData?: Record<string, unknown>;
}

/**
 * Data-driven test case structure
 */
export interface DataDrivenTestCase<T = Record<string, unknown>> {
  /** Test case name/description */
  name: string;
  /** Test data */
  data: T;
  /** Tags for filtering */
  tags?: string[];
  /** Expected result */
  expected?: unknown;
  /** Whether test should be skipped */
  skip?: boolean;
}

/**
 * Test Data Provider for data-driven testing.
 * Centralizes all test data loading and provides parameterized access.
 *
 * @example
 * ```typescript
 * const provider = new TestDataProvider('login-tests');
 *
 * // Get URL from config
 * const loginUrl = provider.getUrl('login');
 *
 * // Get credentials
 * const { username, password } = provider.getCredentials('admin');
 *
 * // Load test cases from Excel
 * const testCases = await provider.loadFromExcel<LoginTestData>('login-tests.xlsx');
 *
 * // Use in data-driven test
 * for (const testCase of testCases) {
 *   test(testCase.name, async () => {
 *     await page.goto(loginUrl);
 *     await page.fill('#username', testCase.data.username);
 *   });
 * }
 * ```
 */
export class TestDataProvider {
  private suiteId: string;
  private configData: TestDataConfig | null = null;
  private dataDir: string;

  /**
   * Creates a new TestDataProvider
   * @param suiteId - Test suite identifier (used to load suite-specific config)
   * @param dataDir - Directory containing test data files
   */
  constructor(suiteId: string, dataDir?: string) {
    this.suiteId = suiteId;
    this.dataDir = dataDir || path.resolve(__dirname, '../../test-data');
    this.loadConfig();
  }

  /**
   * Load suite configuration from JSON file
   */
  private loadConfig(): void {
    const configPath = path.join(this.dataDir, 'config', `${this.suiteId}.json`);

    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        this.configData = JSON.parse(content);
        logger.debug(`[TestDataProvider] Loaded config for suite: ${this.suiteId}`);
      } catch (error) {
        logger.warn(`[TestDataProvider] Failed to load config: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Get URL by key, with environment-specific override support
   * @param key - URL key (e.g., 'login', 'dashboard', 'api')
   * @returns URL string
   */
  getUrl(key: string): string {
    // Priority: 1. Suite config, 2. Environment config, 3. Default
    if (this.configData?.urls?.[key]) {
      return this.configData.urls[key];
    }

    // Check environment-specific URLs from main config
    const envUrls: Record<string, string> = {
      base: config.environment.baseUrl,
      api: config.environment.apiBaseUrl,
      login: `${config.environment.baseUrl}/login`,
      dashboard: `${config.environment.baseUrl}/secure`,
    };

    if (envUrls[key]) {
      return envUrls[key];
    }

    // Return base URL + key as path
    return `${config.environment.baseUrl}/${key}`;
  }

  /**
   * Get credentials by role/type
   * @param role - Role identifier (e.g., 'admin', 'user', 'readonly')
   * @returns Credentials object
   */
  getCredentials(role: string = 'default'): { username: string; password: string } {
    // From suite config
    if (this.configData?.credentials?.[role]) {
      return this.configData.credentials[role];
    }

    // Default credentials from env or hardcoded defaults
    const defaults: Record<string, { username: string; password: string }> = {
      default: {
        username: process.env.TEST_USERNAME || 'tomsmith',
        password: process.env.TEST_PASSWORD || 'SuperSecretPassword!',
      },
      admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      },
    };

    return defaults[role] || defaults.default;
  }

  /**
   * Get API endpoint by key
   * @param key - Endpoint key
   * @returns Full endpoint URL
   */
  getEndpoint(key: string): string {
    if (this.configData?.endpoints?.[key]) {
      return `${config.environment.apiBaseUrl}${this.configData.endpoints[key]}`;
    }
    return `${config.environment.apiBaseUrl}/${key}`;
  }

  /**
   * Get test-specific data by key
   * @param key - Data key
   * @returns Test data value
   */
  getData<T>(key: string): T | undefined {
    return this.configData?.testData?.[key] as T | undefined;
  }

  /**
   * Load test cases from JSON file
   * @param filename - JSON file name (relative to data dir)
   * @returns Array of test cases
   */
  loadFromJson<T>(filename: string): DataDrivenTestCase<T>[] {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      logger.warn(`[TestDataProvider] JSON file not found: ${filePath}`);
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle both array format and object with testCases property
      const testCases = Array.isArray(data) ? data : data.testCases || [];

      logger.info(`[TestDataProvider] Loaded ${testCases.length} test cases from ${filename}`);
      return testCases;
    } catch (error) {
      logger.error(`[TestDataProvider] Failed to load JSON: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Load test cases from Excel file
   * @param filename - Excel file name (relative to data dir)
   * @param sheetName - Sheet name (optional)
   * @returns Array of test cases
   */
  async loadFromExcel<T>(filename: string, sheetName?: string): Promise<DataDrivenTestCase<T>[]> {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      logger.warn(`[TestDataProvider] Excel file not found: ${filePath}`);
      return [];
    }

    try {
      const rows = excelHandler.readFile<T & { testName?: string; name?: string }>(
        filePath,
        sheetName ? { sheet: sheetName } : undefined
      );

      const testCases: DataDrivenTestCase<T>[] = rows.map((row, index) => ({
        name: row.testName || row.name || `Test Case ${index + 1}`,
        data: row,
        skip: false,
      }));

      logger.info(`[TestDataProvider] Loaded ${testCases.length} test cases from ${filename}`);
      return testCases;
    } catch (error) {
      logger.error(`[TestDataProvider] Failed to load Excel: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Load test cases from CSV file
   * @param filename - CSV file name (relative to data dir)
   * @returns Array of test cases
   */
  async loadFromCsv<T>(filename: string): Promise<DataDrivenTestCase<T>[]> {
    const filePath = path.join(this.dataDir, filename);

    if (!fs.existsSync(filePath)) {
      logger.warn(`[TestDataProvider] CSV file not found: ${filePath}`);
      return [];
    }

    try {
      const rows = await csvHandler.readFile<T & { testName?: string; name?: string }>(filePath);

      const testCases: DataDrivenTestCase<T>[] = rows.map((row, index) => ({
        name: row.testName || row.name || `Test Case ${index + 1}`,
        data: row,
        skip: false,
      }));

      logger.info(`[TestDataProvider] Loaded ${testCases.length} test cases from ${filename}`);
      return testCases;
    } catch (error) {
      logger.error(`[TestDataProvider] Failed to load CSV: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get all test data as Playwright test.describe.each compatible format
   * @param testCases - Array of test cases
   * @returns Array of [name, data] tuples
   */
  static toPlaywrightData<T>(testCases: DataDrivenTestCase<T>[]): Array<[string, T]> {
    return testCases.filter((tc) => !tc.skip).map((tc) => [tc.name, tc.data]);
  }
}

/**
 * Factory function to create a test data provider
 */
export function createTestDataProvider(suiteId: string): TestDataProvider {
  return new TestDataProvider(suiteId);
}

export default TestDataProvider;
