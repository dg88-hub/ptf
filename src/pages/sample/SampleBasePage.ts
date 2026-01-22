/**
 * @fileoverview Sample Application Base Page Object.
 *
 * Provides common functionality for all Sample application page objects.
 * This base class ensures consistency with other application domains
 * (ParaBank, SauceDemo) in the framework.
 *
 * @module pages/sample/SampleBasePage
 * @author DG
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * export class MyPage extends SampleBasePage {
 *   constructor(page: Page) {
 *     super(page, 'MyPage');
 *   }
 * }
 * ```
 */

import { Locator, Page } from '@playwright/test';
import { config } from '../../config';
import { BasePage } from '../../core/BasePage';

/**
 * Base page for Sample application pages.
 *
 * Extend this class for all page objects in the Sample application domain.
 * Provides common navigation, headers, and utility methods.
 */
export class SampleBasePage extends BasePage {
  /** Base URL for the Sample application */
  readonly appBaseUrl: string;

  // Common header elements
  readonly headerLogo: Locator;
  readonly navigationMenu: Locator;

  // Common footer elements
  readonly footer: Locator;

  // Common message elements
  readonly errorMessageLocator: Locator;
  readonly successMessageLocator: Locator;

  constructor(page: Page, pageName: string = 'SampleBasePage') {
    super(page, pageName);

    // Use config for dynamic URL
    this.appBaseUrl = config.baseUrl;

    // Header elements (customize per application)
    this.headerLogo = page.locator('header .logo, [data-testid="logo"]');
    this.navigationMenu = page.locator('nav, .navigation, [data-testid="nav"]');

    // Footer
    this.footer = page.locator('footer, [data-testid="footer"]');

    // Common message containers
    this.errorMessageLocator = page.locator('.error, .error-message, [data-testid="error"]');
    this.successMessageLocator = page.locator(
      '.success, .success-message, [data-testid="success"]'
    );
  }

  /**
   * Navigate to the application home page.
   */
  async navigateToHome(): Promise<void> {
    await this.navigate(this.appBaseUrl);
  }

  /**
   * Check if an error message is displayed.
   */
  async hasErrorVisible(): Promise<boolean> {
    return await this.errorMessageLocator.isVisible();
  }

  /**
   * Get the error message text.
   */
  async getErrorText(): Promise<string> {
    if (await this.hasErrorVisible()) {
      return (await this.errorMessageLocator.textContent()) || '';
    }
    return '';
  }

  /**
   * Check if a success message is displayed.
   */
  async hasSuccessVisible(): Promise<boolean> {
    return await this.successMessageLocator.isVisible();
  }

  /**
   * Get the success message text.
   */
  async getSuccessText(): Promise<string> {
    if (await this.hasSuccessVisible()) {
      return (await this.successMessageLocator.first().textContent()) || '';
    }
    return '';
  }

  /**
   * Wait for page to fully load.
   */
  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('load');
  }
}
