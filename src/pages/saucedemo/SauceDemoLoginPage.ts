/**
 * @fileoverview SauceDemo Login Page Object.
 * Handles authentication with various user types.
 *
 * @module pages/saucedemo/SauceDemoLoginPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from "@playwright/test";
import { SauceDemoBasePage } from "./SauceDemoBasePage";

/**
 * SauceDemo user types for testing different scenarios
 */
export type SauceDemoUserType =
  | "standard"
  | "locked_out"
  | "problem"
  | "performance_glitch"
  | "error"
  | "visual";

/**
 * User credentials interface
 */
export interface SauceDemoCredentials {
  username: string;
  password: string;
}

/**
 * SauceDemo Login Page Object
 */
export class SauceDemoLoginPage extends SauceDemoBasePage {
  // Login form elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorButton: Locator;

  // Credentials info
  readonly credentialsInfo: Locator;

  constructor(page: Page) {
    super(page);

    // Login form
    this.usernameInput = page.locator("#user-name");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.locator("#login-button");
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorButton = page.locator(".error-button");

    // Info
    this.credentialsInfo = page.locator(".login_credentials_wrap");
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.navigate(this.baseUrl);
    await this.usernameInput.waitFor({ state: "visible" });
  }

  /**
   * Login with credentials
   */
  async login(credentials: SauceDemoCredentials): Promise<void> {
    await this.fill(this.usernameInput, credentials.username);
    await this.fill(this.passwordInput, credentials.password);
    await this.click(this.loginButton);
  }

  /**
   * Login with a specific user type
   */
  async loginAs(userType: SauceDemoUserType): Promise<void> {
    const credentials = SauceDemoLoginPage.getCredentials(userType);
    await this.login(credentials);
  }

  /**
   * Login and verify success
   */
  async loginAndVerify(credentials: SauceDemoCredentials): Promise<void> {
    await this.login(credentials);
    await this.verifyLoginSuccess();
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory.html/);
    await expect(this.menuButton).toBeVisible();
  }

  /**
   * Verify login failed
   */
  async verifyLoginFailure(expectedError?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedError) {
      await expect(this.errorMessage).toContainText(expectedError);
    }
  }

  /**
   * Clear error message
   */
  async clearError(): Promise<void> {
    if (await this.errorButton.isVisible()) {
      await this.click(this.errorButton);
    }
  }

  /**
   * Get credentials for a specific user type
   */
  static getCredentials(userType: SauceDemoUserType): SauceDemoCredentials {
    const password = "secret_sauce";
    const usernames: Record<SauceDemoUserType, string> = {
      standard: "standard_user",
      locked_out: "locked_out_user",
      problem: "problem_user",
      performance_glitch: "performance_glitch_user",
      error: "error_user",
      visual: "visual_user",
    };

    return {
      username: usernames[userType],
      password,
    };
  }

  /**
   * Get default (standard) credentials
   */
  static getDefaultCredentials(): SauceDemoCredentials {
    return SauceDemoLoginPage.getCredentials("standard");
  }
}
