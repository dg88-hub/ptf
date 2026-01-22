/**
 * @fileoverview ParaBank Login Page Object.
 * Handles authentication and user registration.
 *
 * @module pages/parabank/ParaBankLoginPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from "@playwright/test";
import { ParaBankBasePage } from "./ParaBankBasePage";

/**
 * Login credentials interface
 */
export interface ParaBankCredentials {
  username: string;
  password: string;
}

/**
 * Registration data interface
 */
export interface ParaBankRegistration {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * ParaBank Login Page Object
 */
export class ParaBankLoginPage extends ParaBankBasePage {
  // Login form elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotLoginLink: Locator;

  // Registration form elements
  readonly regFirstName: Locator;
  readonly regLastName: Locator;
  readonly regAddress: Locator;
  readonly regCity: Locator;
  readonly regState: Locator;
  readonly regZipCode: Locator;
  readonly regPhone: Locator;
  readonly regSsn: Locator;
  readonly regUsername: Locator;
  readonly regPassword: Locator;
  readonly regConfirmPassword: Locator;
  readonly regSubmitButton: Locator;

  // Error/Welcome messages
  readonly loginError: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Login form
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.registerLink = page.locator('a[href*="register"]');
    this.forgotLoginLink = page.locator('a[href*="lookup"]');

    // Registration form
    this.regFirstName = page.locator("#customer\\.firstName");
    this.regLastName = page.locator("#customer\\.lastName");
    this.regAddress = page.locator("#customer\\.address\\.street");
    this.regCity = page.locator("#customer\\.address\\.city");
    this.regState = page.locator("#customer\\.address\\.state");
    this.regZipCode = page.locator("#customer\\.address\\.zipCode");
    this.regPhone = page.locator("#customer\\.phoneNumber");
    this.regSsn = page.locator("#customer\\.ssn");
    this.regUsername = page.locator("#customer\\.username");
    this.regPassword = page.locator("#customer\\.password");
    this.regConfirmPassword = page.locator("#repeatedPassword");
    this.regSubmitButton = page.locator('input[value="Register"]');

    // Messages
    this.loginError = page.locator(".error");
    this.welcomeMessage = page.locator("#rightPanel h1.title");
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.navigate(`${this.baseUrl}/index.htm`);
    await this.waitForPageLoad();
  }

  /**
   * Login with credentials
   */
  async login(credentials: ParaBankCredentials): Promise<void> {
    await this.fill(this.usernameInput, credentials.username);
    await this.fill(this.passwordInput, credentials.password);
    await this.click(this.loginButton);
    await this.waitForPageLoad();
  }

  /**
   * Login and verify success
   */
  async loginAndVerify(credentials: ParaBankCredentials): Promise<void> {
    await this.login(credentials);
    await this.verifyLoginSuccess();
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess(): Promise<void> {
    await expect(this.nav.logOut).toBeVisible({ timeout: 10000 });
    await expect(this.welcomeMessage).toContainText("Accounts Overview");
  }

  /**
   * Verify login failed
   */
  async verifyLoginFailure(expectedError?: string): Promise<void> {
    await expect(this.loginError).toBeVisible();
    if (expectedError) {
      await expect(this.loginError).toContainText(expectedError);
    }
  }

  /**
   * Navigate to registration page
   */
  async navigateToRegistration(): Promise<void> {
    await this.click(this.registerLink);
    await this.page.waitForURL("**/register.htm**");
  }

  /**
   * Register a new user
   */
  async register(data: ParaBankRegistration): Promise<void> {
    await this.navigateToRegistration();

    await this.fill(this.regFirstName, data.firstName);
    await this.fill(this.regLastName, data.lastName);
    await this.fill(this.regAddress, data.address);
    await this.fill(this.regCity, data.city);
    await this.fill(this.regState, data.state);
    await this.fill(this.regZipCode, data.zipCode);
    await this.fill(this.regPhone, data.phone);
    await this.fill(this.regSsn, data.ssn);
    await this.fill(this.regUsername, data.username);
    await this.fill(this.regPassword, data.password);
    await this.fill(this.regConfirmPassword, data.confirmPassword);

    await this.click(this.regSubmitButton);
    await this.waitForPageLoad();
  }

  /**
   * Verify registration was successful
   */
  async verifyRegistrationSuccess(): Promise<void> {
    await expect(this.welcomeMessage).toContainText("Welcome");
  }

  /**
   * Get default test credentials
   * Note: These may need to be registered first
   */
  static getDefaultCredentials(): ParaBankCredentials {
    return {
      username: "john",
      password: "demo",
    };
  }

  /**
   * Generate unique registration data
   */
  static generateRegistrationData(): ParaBankRegistration {
    const timestamp = Date.now().toString().slice(-6);
    return {
      firstName: "Test",
      lastName: "User",
      address: "123 Test Street",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      phone: "555-555-5555",
      ssn: "123-45-6789",
      username: `testuser${timestamp}`,
      password: "TestPassword123",
      confirmPassword: "TestPassword123",
    };
  }
}
