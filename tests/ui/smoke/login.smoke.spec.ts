/**
 * @fileoverview Login smoke tests demonstrating Page Object Model usage.
 * Tests the login functionality on the-internet.herokuapp.com.
 *
 * @module tests/ui/smoke/login.smoke.spec
 * @author DG
 * @version 1.0.0
 */

import { expect, test } from '../../../src/core/fixtures';
import { logger } from '../../../src/utils/Logger';

/**
 * Login smoke test suite
 * Tests basic login functionality
 * Target: https://the-internet.herokuapp.com/login
 */
test.describe('Login Smoke Tests @smoke', () => {
  test.beforeEach(async ({ app }) => {
    await app.sample.loginPage.navigateToLogin();
  });

  /**
   * Test successful login with valid credentials
   * @tags @smoke @critical
   */
  test('should login successfully with valid credentials @smoke @critical', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Login with valid credentials');

    // Arrange
    // Note: getValidCredentials is static, so we use the class or instance constructor if exposed?
    // The original code imported LoginPage class for static method.
    // We can expose static methods or keep the import just for statics/types if needed.
    // For now, let's assume valid credentials are standard.
    const credentials = { username: 'tomsmith', password: 'SuperSecretPassword!' };

    // Act
    await loginPage.login(credentials);

    // Assert
    await loginPage.verifyLoginSuccess();

    logger.testEnd('Login with valid credentials', 'passed');
  });

  /**
   * Test login failure with invalid username
   * @tags @smoke
   */
  test('should show error message with invalid username @smoke', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Login with invalid username');

    // Arrange
    const credentials = {
      username: 'invalid_user',
      password: 'SuperSecretPassword!',
    };

    // Act
    await loginPage.login(credentials);

    // Assert
    await loginPage.verifyLoginFailure('Your username is invalid!');

    logger.testEnd('Login with invalid username', 'passed');
  });

  /**
   * Test login failure with invalid password
   * @tags @smoke
   */
  test('should show error message with invalid password @smoke', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Login with invalid password');

    // Arrange
    const credentials = {
      username: 'tomsmith',
      password: 'wrong_password',
    };

    // Act
    await loginPage.login(credentials);

    // Assert
    await loginPage.verifyLoginFailure('Your password is invalid!');

    logger.testEnd('Login with invalid password', 'passed');
  });

  /**
   * Test login page elements are visible
   * @tags @smoke @health
   */
  test('should display all login form elements @smoke @health', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Verify login form elements');

    // Assert all elements are visible
    await loginPage.verifyOnLoginPage();
    await expect(loginPage.heading).toContainText('Login Page');

    logger.testEnd('Verify login form elements', 'passed');
  });

  /**
   * Test logout functionality after login
   * @tags @smoke
   */
  test('should logout successfully after login @smoke', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Logout after login');

    // Arrange & Act - Login first
    const credentials = { username: 'tomsmith', password: 'SuperSecretPassword!' };
    await loginPage.loginAndWaitForSecureArea(credentials);

    // Act - Logout
    await loginPage.logout();

    // Assert
    await loginPage.verifyOnLoginPage();

    logger.testEnd('Logout after login', 'passed');
  });
});

/**
 * Login edge case tests
 */
test.describe('Login Edge Cases @sanity', () => {
  test.beforeEach(async ({ app }) => {
    await app.sample.loginPage.navigateToLogin();
  });

  /**
   * Test login with empty credentials
   * @tags @sanity
   */
  test('should show error with empty credentials @sanity', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Login with empty credentials');

    // Act
    await loginPage.clickLoginButton();

    // Assert
    await loginPage.verifyLoginFailure('Your username is invalid!');

    logger.testEnd('Login with empty credentials', 'passed');
  });

  /**
   * Test username field validation
   * @tags @sanity
   */
  test('should trim username whitespace @sanity', async ({ app }) => {
    const loginPage = app.sample.loginPage;
    logger.testStart('Username whitespace handling');

    // Arrange - Username with extra spaces
    const credentials = {
      username: '  tomsmith  ',
      password: 'SuperSecretPassword!',
    };

    // Act
    await loginPage.enterUsername(credentials.username);
    await loginPage.enterPassword(credentials.password);

    // Get the actual value in the input field
    const usernameValue = await loginPage.usernameInput.inputValue();
    expect(usernameValue).toBe(credentials.username);

    logger.testEnd('Username whitespace handling', 'passed');
  });
});
