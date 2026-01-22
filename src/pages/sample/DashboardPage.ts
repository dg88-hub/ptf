/**
 * @fileoverview Dashboard page object for post-login tests.
 * Demonstrates Page Object Model with secure area interactions.
 *
 * @module pages/sample/DashboardPage
 * @author DG
 * @version 1.0.0
 */

import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage';
import { logger } from '../../utils/Logger';

/**
 * Dashboard/Secure Area page object for the-internet.herokuapp.com/secure
 *
 * @example
 * ```typescript
 * const dashboardPage = new DashboardPage(page);
 * await dashboardPage.navigate();
 * await dashboardPage.verifySecureAreaLoaded();
 * await dashboardPage.logout();
 * ```
 */
export class DashboardPage extends BasePage {
  // ============================================
  // Page Locators
  // ============================================

  /** Page heading */
  readonly heading: Locator;

  /** Secure area sub-heading */
  readonly subHeading: Locator;

  /** Logout button */
  readonly logoutButton: Locator;

  /** Flash message container */
  readonly flashMessage: Locator;

  /** Main content area */
  readonly content: Locator;

  /**
   * Creates a new DashboardPage instance
   * @param page - Playwright Page instance
   */
  constructor(page: Page) {
    super(page, 'DashboardPage');

    // Initialize locators
    this.heading = page.locator('h2');
    this.subHeading = page.locator('h4.subheader');
    this.logoutButton = page.locator('a.button[href="/logout"]');
    this.flashMessage = page.locator('#flash');
    this.content = page.locator('#content');
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to the secure area (requires authentication)
   */
  async navigateToSecureArea(): Promise<void> {
    logger.info('[DashboardPage] Navigating to secure area');
    await this.navigate('/secure');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForVisible(this.heading);
    await this.waitForVisible(this.logoutButton);
  }

  // ============================================
  // Action Methods
  // ============================================

  /**
   * Click the logout button
   */
  async clickLogout(): Promise<void> {
    logger.step(1, 'Clicking logout button');
    await this.click(this.logoutButton);
  }

  /**
   * Logout and wait for login page
   */
  async logout(): Promise<void> {
    logger.info('[DashboardPage] Logging out');
    await this.clickLogout();
    await this.waitForUrl(/\/login/);
  }

  // ============================================
  // Verification Methods
  // ============================================

  /**
   * Verify secure area is loaded successfully
   */
  async verifySecureAreaLoaded(): Promise<void> {
    logger.info('[DashboardPage] Verifying secure area loaded');
    await this.assertVisible(this.heading, 'Heading should be visible');
    await this.assertContainsText(this.heading, 'Secure Area');
    await this.assertVisible(this.logoutButton, 'Logout button should be visible');
    await this.assertUrl(/\/secure/);
  }

  /**
   * Verify welcome message is displayed
   */
  async verifyWelcomeMessage(): Promise<void> {
    logger.info('[DashboardPage] Verifying welcome message');
    await this.assertVisible(this.flashMessage);
    await this.assertContainsText(this.flashMessage, 'You logged into a secure area!');
  }

  /**
   * Verify user is not authenticated (should redirect)
   */
  async verifyNotAuthenticated(): Promise<void> {
    logger.info('[DashboardPage] Verifying not authenticated');
    // When not logged in, accessing /secure should show some indication
    // The demo site may redirect or show a message
    const currentUrl = this.getCurrentUrl();
    expect(currentUrl).not.toContain('/secure');
  }

  /**
   * Get the heading text
   * @returns Heading text
   */
  async getHeadingText(): Promise<string> {
    return await this.getText(this.heading);
  }

  /**
   * Get the sub-heading text
   * @returns Sub-heading text
   */
  async getSubHeadingText(): Promise<string> {
    return await this.getText(this.subHeading);
  }

  /**
   * Get the flash message text
   * @returns Flash message text
   */
  async getFlashMessageText(): Promise<string> {
    return await this.getText(this.flashMessage);
  }

  /**
   * Check if logout button is visible
   * @returns True if visible
   */
  async isLogoutButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.logoutButton);
  }
}

// Import expect for assertions
import { expect } from '@playwright/test';

export default DashboardPage;
