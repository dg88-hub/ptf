/**
 * @fileoverview Data-driven login tests demonstrating parameterization.
 * All URLs, credentials, and test data are loaded from external config files.
 * Shows how to share data between tests using TestContext.
 *
 * @module tests/ui/data-driven/login.data.spec
 * @author DG
 * @version 1.0.0
 */

import { expect, test } from '../../../src/core/fixtures';
import { testContext } from '../../../src/core/TestContext';
import { DataDrivenTestCase, TestDataProvider } from '../../../src/core/TestDataProvider';
import { LoginPage } from '../../../src/pages/sample/LoginPage';
import { logger } from '../../../src/utils/Logger';

/**
 * Login test data structure
 */
interface LoginTestData {
  username: string;
  password: string;
  expectedResult: 'success' | 'failure';
  expectedMessage: string;
}

/**
 * Data-driven login tests - All data comes from external files
 */
test.describe('Data-Driven Login Tests @data-driven', () => {
  let dataProvider: TestDataProvider;
  let loginPage: LoginPage;
  let testCases: DataDrivenTestCase<LoginTestData>[];

  test.beforeAll(async () => {
    // Load test configuration and data from external files
    dataProvider = new TestDataProvider('login-tests');
    testCases = dataProvider.loadFromJson<LoginTestData>('login-scenarios.json');

    logger.info(`Loaded ${testCases.length} test cases from external data`);
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // URL is loaded from config, not hardcoded
    const loginUrl = dataProvider.getUrl('login');
    await page.goto(loginUrl);
  });

  /**
   * Data-driven test: Valid login
   * Credentials come from config file
   */
  test('should login with credentials from config @data-driven @smoke', async ({ page }) => {
    logger.testStart('Login with config credentials');

    // Get credentials from config file (not hardcoded)
    const credentials = dataProvider.getCredentials('default');

    // Perform login
    await loginPage.login(credentials);

    // Get expected message from config
    const expectedMessage = dataProvider.getData<string>('expectedLoginSuccessMessage');

    // Verify success
    const successMessage = await page.locator('#flash').textContent();
    expect(successMessage).toContain(expectedMessage);

    // CAPTURE OUTPUT: Store the login result for use in other tests
    testContext.set(
      'lastLoginResult',
      {
        success: true,
        username: credentials.username,
        timestamp: new Date().toISOString(),
      },
      { testName: 'Login with config credentials' }
    );

    // Store session info that can be used by subsequent tests
    testContext.set('session.authenticated', true, { testName: 'Login with config credentials' });

    logger.testEnd('Login with config credentials', 'passed');
  });

  /**
   * Dynamic data-driven test: Run multiple scenarios from JSON
   */
  for (const scenario of [
    { name: 'valid login', expectedResult: 'success' },
    { name: 'invalid username', expectedResult: 'failure' },
  ]) {
    test(`Scenario: ${scenario.name} @data-driven`, async ({ page }) => {
      const testData = testCases.find((tc) => tc.data.expectedResult === scenario.expectedResult);

      expect(testData, `No test data found for scenario: ${scenario.name}`).toBeDefined();

      await loginPage.login({
        username: testData!.data.username,
        password: testData!.data.password,
      });

      const messageLocator = page.locator('#flash');
      await expect(messageLocator).toContainText(testData!.data.expectedMessage);
    });
  }

  /**
   * Test that uses output from a previous test
   */
  test('should verify session from previous login @data-driven', async () => {
    // RETRIEVE DATA: Get output from previous test
    const isAuthenticated = testContext.get<boolean>('session.authenticated');
    const lastLogin = testContext.get<{ success: boolean; username: string }>('lastLoginResult');

    logger.info(`Previous login result: ${JSON.stringify(lastLogin)}`);
    logger.info(`Session authenticated: ${isAuthenticated}`);

    // This demonstrates reading data captured from another test
    expect(lastLogin).toBeDefined();

    expect(lastLogin!.success).toBe(true);
    expect(lastLogin!.username).toBeDefined();
  });
});

/**
 * Cross-test data sharing example
 * Shows how to capture API response and use in UI test
 */
test.describe('Cross-Test Data Sharing @data-driven', () => {
  test.describe.configure({ mode: 'serial' });
  const scopedContext = testContext.scoped('userFlow');

  test('Step 1: Create user via API and capture ID @api', async ({ apiClient }) => {
    logger.testStart('Create user and capture output');

    const dataProvider = new TestDataProvider('api-tests');
    const endpoint = dataProvider.getEndpoint('users');

    const response = await apiClient.post(endpoint, {
      data: {
        name: 'Test User',
        job: 'Automation Engineer',
      },
    });

    expect(response.status).toBe(201);

    // CAPTURE: Store created user ID for use in subsequent tests
    const createdUser = response.data as { id: string; name: string };
    scopedContext.set('createdUserId', createdUser.id, { testName: 'Create user' });
    scopedContext.set('createdUserName', createdUser.name, { testName: 'Create user' });

    logger.info(`Captured user ID: ${createdUser.id}`);
    logger.testEnd('Create user and capture output', 'passed');
  });

  test('Step 2: Verify created user (uses captured ID) @api', async () => {
    logger.testStart('Verify created user');

    // RETRIEVE: Get the user ID captured from previous test
    const userId = scopedContext.get<string>('createdUserId');
    const userName = scopedContext.get<string>('createdUserName');

    logger.info(`Retrieved from context - ID: ${userId}, Name: ${userName}`);

    // Now use the captured data
    expect(userId).toBeDefined();

    // In a real scenario, you would fetch and verify the user
    logger.info(`Would verify user with ID: ${userId!}`);

    logger.testEnd('Verify created user', 'passed');
  });

  test('Step 3: Get all captured data by pattern', async () => {
    // Get all data stored under 'userFlow' namespace
    const allUserFlowData = scopedContext.getAll<string>();

    logger.info('All captured userFlow data:');
    allUserFlowData.forEach((value, key) => {
      logger.info(`  ${key}: ${value}`);
    });

    // You can also use patterns to get specific data
    const allUserIds = testContext.getByPattern<string>('*.createdUserId');
    logger.info(`Found ${allUserIds.size} user IDs across all namespaces`);
  });
});

/**
 * Example: Loading test data from Excel
 */
test.describe('Excel Data-Driven Tests @data-driven @excel', () => {
  test.fixme('should run tests from Excel data', async () => {
    const dataProvider = new TestDataProvider('login-tests');
    const testCases = await dataProvider.loadFromExcel<LoginTestData>('login-data.xlsx');

    for (const testCase of testCases) {
      logger.info(`Running: ${testCase.name}`);
      // Execute each test case from Excel
    }
  });
});
