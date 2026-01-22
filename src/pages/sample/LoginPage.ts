/**
 * @fileoverview Login page object for authentication tests.
 * Demonstrates Page Object Model implementation with BasePage.
 *
 * @module pages/sample/LoginPage
 * @author DG
 * @version 1.0.0
 */

import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import { logger } from '../../utils/Logger';

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Login page object for the-internet.herokuapp.com/login
 *
 * @example
 * ```typescript
 * const loginPage = new LoginPage(page);
 * await loginPage.navigate();
 * await loginPage.login({ username: 'tomsmith', password: 'SuperSecretPassword!' });
 * await loginPage.verifyLoginSuccess();
 * ```
 */
export class LoginPage extends BasePage {
  // ============================================
  // Page Locators
  // ============================================

  /** Username input field */
  readonly usernameInput: Locator;

  /** Password input field */
  readonly passwordInput: Locator;

  /** Login button */
  readonly loginButton: Locator;

  /** Flash message container (success/error) */
  readonly flashMessage: Locator;

  /** Page heading */
  readonly heading: Locator;

  /** Secure area heading (after login) */
  readonly secureAreaHeading: Locator;

  /** Logout button */
  readonly logoutButton: Locator;

  /**
   * Creates a new LoginPage instance
   * @param page - Playwright Page instance
   */
  constructor(page: Page) {
    super(page, 'LoginPage');

    // Initialize locators
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.flashMessage = page.locator('#flash');
    this.heading = page.locator('h2');
    this.secureAreaHeading = page.locator('h2:has-text("Secure Area")');
    this.logoutButton = page.locator('a[href="/logout"]');
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to the login page
   */
  async navigateToLogin(): Promise<void> {
    logger.info('[LoginPage] Navigating to login page');
    await this.navigate('/login');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForVisible(this.usernameInput);
    await this.waitForVisible(this.passwordInput);
    await this.waitForVisible(this.loginButton);
  }

  // ============================================
  // Action Methods
  // ============================================

  /**
   * Enter username
   * @param username - Username to enter
   */
  async enterUsername(username: string): Promise<void> {
    logger.step(1, `Entering username: ${username}`);
    await this.fill(this.usernameInput, username);
  }

  /**
   * Enter password
   * @param password - Password to enter
   */
  async enterPassword(password: string): Promise<void> {
    logger.step(2, 'Entering password: ****');
    await this.fill(this.passwordInput, password);
  }

  /**
   * Click the login button
   */
  async clickLoginButton(): Promise<void> {
    logger.step(3, 'Clicking login button');
    await this.click(this.loginButton);
  }

  /**
   * Perform complete login flow
   * @param credentials - Login credentials
   */
  async login(credentials: LoginCredentials): Promise<void> {
    logger.info(`[LoginPage] Logging in as: ${credentials.username}`);
    await this.enterUsername(credentials.username);
    await this.enterPassword(credentials.password);
    await this.clickLoginButton();
    await this.waitForNavigation();
  }

  /**
   * Perform login and wait for secure area
   * @param credentials - Login credentials
   */
  async loginAndWaitForSecureArea(credentials: LoginCredentials): Promise<void> {
    await this.login(credentials);
    await this.waitForVisible(this.secureAreaHeading);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    logger.info('[LoginPage] Logging out');
    await this.click(this.logoutButton);
    await this.waitForVisible(this.loginButton);
  }

  // ============================================
  // Verification Methods
  // ============================================

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess(): Promise<void> {
    logger.info('[LoginPage] Verifying login success');
    await this.assertVisible(this.secureAreaHeading, 'Secure area heading should be visible');
    await this.assertVisible(this.logoutButton, 'Logout button should be visible');
    await this.assertUrl(/\/secure/);
  }

  /**
   * Verify login failed with error message
   * @param expectedMessage - Expected error message (partial match)
   */
  async verifyLoginFailure(expectedMessage?: string): Promise<void> {
    logger.info('[LoginPage] Verifying login failure');
    await this.assertVisible(this.flashMessage, 'Flash message should be visible');

    if (expectedMessage) {
      await this.assertContainsText(this.flashMessage, expectedMessage);
    }
  }

  /**
   * Verify we are on the login page
   */
  async verifyOnLoginPage(): Promise<void> {
    logger.info('[LoginPage] Verifying on login page');
    await this.assertVisible(this.usernameInput);
    await this.assertVisible(this.passwordInput);
    await this.assertVisible(this.loginButton);
    await this.assertUrl(/\/login/);
  }

  /**
   * Get the flash message text
   * @returns Flash message text
   */
  async getFlashMessageText(): Promise<string> {
    return await this.getText(this.flashMessage);
  }

  /**
   * Check if flash message contains success indicator
   * @returns True if success message
   */
  async isSuccessMessage(): Promise<boolean> {
    const messageText = await this.getFlashMessageText();
    return messageText.toLowerCase().includes('secure area');
  }

  /**
   * Check if flash message contains error indicator
   * @returns True if error message
   */
  async isErrorMessage(): Promise<boolean> {
    const messageText = await this.getFlashMessageText();
    return (
      messageText.toLowerCase().includes('invalid') ||
      messageText.toLowerCase().includes('error')
    );
  }

  // ============================================
  // Test Data Helpers
  // ============================================

  /**
   * Get valid login credentials for the demo site
   * @returns Valid credentials
   */
  static getValidCredentials(): LoginCredentials {
    return {
      username: 'tomsmith',
      password: 'SuperSecretPassword!',
    };
  }

  /**
   * Get invalid login credentials for testing failures
   * @returns Invalid credentials
   */
  static getInvalidCredentials(): LoginCredentials {
    return {
      username: 'invalid_user',
      password: 'wrong_password',
    };
  }
}

export default LoginPage;
