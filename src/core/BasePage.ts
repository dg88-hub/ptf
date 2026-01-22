/**
 * @fileoverview Base page class providing common functionality for all page objects.
 * Implements the Page Object Model (POM) pattern with built-in logging,
 * error handling, and reusable action methods.
 *
 * @module core/BasePage
 * @author DG
 * @version 1.0.0
 */

import { Locator, Page, expect } from '@playwright/test';
import { config } from '../config';
import { logger } from '../utils/Logger';

/**
 * Abstract base class for all page objects.
 * Provides common UI interaction methods and page-level utilities.
 *
 * @abstract
 * @example
 * ```typescript
 * class LoginPage extends BasePage {
 *   readonly usernameInput = this.page.locator('#username');
 *   readonly passwordInput = this.page.locator('#password');
 *
 *   async login(username: string, password: string): Promise<void> {
 *     await this.fill(this.usernameInput, username);
 *     await this.fill(this.passwordInput, password);
 *     await this.click(this.page.locator('#login-button'));
 *   }
 * }
 * ```
 */
export abstract class BasePage {
  /**
   * Playwright page instance
   */
  readonly page: Page;

  /**
   * Page name for logging purposes
   */
  protected readonly pageName: string;

  /**
   * Default timeout for page actions in milliseconds
   */
  protected readonly defaultTimeout: number;

  /**
   * Creates a new BasePage instance
   * @param page - Playwright Page instance
   * @param pageName - Name of the page for logging
   */
  constructor(page: Page, pageName: string = 'BasePage') {
    this.page = page;
    this.pageName = pageName;
    this.defaultTimeout = config.environment.timeout;
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to a URL
   * @param url - URL to navigate to (absolute or relative to baseURL)
   * @param options - Navigation options
   */
  async navigate(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    logger.info(`[${this.pageName}] Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'domcontentloaded',
      timeout: this.defaultTimeout,
    });
  }

  /**
   * Get the current page URL
   * @returns Current URL string
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get the page title
   * @returns Page title string
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    logger.info(`[${this.pageName}] Reloading page`);
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /**
   * Navigate back in browser history
   */
  async goBack(): Promise<void> {
    logger.info(`[${this.pageName}] Navigating back`);
    await this.page.goBack();
  }

  /**
   * Navigate forward in browser history
   */
  async goForward(): Promise<void> {
    logger.info(`[${this.pageName}] Navigating forward`);
    await this.page.goForward();
  }

  // ============================================
  // Element Interaction Methods
  // ============================================

  /**
   * Click on an element
   * @param locator - Element locator
   * @param options - Click options
   */
  async click(locator: Locator, options?: { force?: boolean; timeout?: number }): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Clicking on: ${description}`);
    await locator.click({
      force: options?.force,
      timeout: options?.timeout || this.defaultTimeout,
    });
  }

  /**
   * Double click on an element
   * @param locator - Element locator
   */
  async doubleClick(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Double clicking on: ${description}`);
    await locator.dblclick({ timeout: this.defaultTimeout });
  }

  /**
   * Right click on an element
   * @param locator - Element locator
   */
  async rightClick(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Right clicking on: ${description}`);
    await locator.click({ button: 'right', timeout: this.defaultTimeout });
  }

  /**
   * Fill an input field
   * @param locator - Input element locator
   * @param text - Text to fill
   * @param options - Fill options
   */
  async fill(locator: Locator, text: string, options?: { clear?: boolean }): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Filling "${description}" with: ${text.substring(0, 20)}...`);

    if (options?.clear) {
      await locator.clear();
    }
    await locator.fill(text, { timeout: this.defaultTimeout });
  }

  /**
   * Type text character by character (useful for autocomplete fields)
   * @param locator - Input element locator
   * @param text - Text to type
   * @param delay - Delay between keystrokes in milliseconds
   */
  async type(locator: Locator, text: string, delay: number = 50): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Typing in "${description}": ${text.substring(0, 20)}...`);
    await locator.pressSequentially(text, { delay });
  }

  /**
   * Clear an input field
   * @param locator - Input element locator
   */
  async clear(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Clearing: ${description}`);
    await locator.clear();
  }

  /**
   * Select option from dropdown
   * @param locator - Select element locator
   * @param option - Option to select (value, label, or index)
   */
  async selectOption(
    locator: Locator,
    option: string | { value?: string; label?: string; index?: number }
  ): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Selecting option in "${description}": ${JSON.stringify(option)}`);
    await locator.selectOption(option);
  }

  /**
   * Check a checkbox or radio button
   * @param locator - Checkbox/radio element locator
   */
  async check(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Checking: ${description}`);
    await locator.check({ timeout: this.defaultTimeout });
  }

  /**
   * Uncheck a checkbox
   * @param locator - Checkbox element locator
   */
  async uncheck(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Unchecking: ${description}`);
    await locator.uncheck({ timeout: this.defaultTimeout });
  }

  /**
   * Hover over an element
   * @param locator - Element locator
   */
  async hover(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Hovering over: ${description}`);
    await locator.hover({ timeout: this.defaultTimeout });
  }

  /**
   * Focus on an element
   * @param locator - Element locator
   */
  async focus(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Focusing on: ${description}`);
    await locator.focus();
  }

  /**
   * Press a keyboard key
   * @param key - Key to press (e.g., 'Enter', 'Tab', 'Escape')
   */
  async pressKey(key: string): Promise<void> {
    logger.debug(`[${this.pageName}] Pressing key: ${key}`);
    await this.page.keyboard.press(key);
  }

  /**
   * Upload a file to an input element
   * @param locator - File input locator
   * @param filePath - Path to the file to upload
   */
  async uploadFile(locator: Locator, filePath: string | string[]): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.info(`[${this.pageName}] Uploading file to: ${description}`);
    await locator.setInputFiles(filePath);
  }

  // ============================================
  // Element State Methods
  // ============================================

  /**
   * Get text content of an element
   * @param locator - Element locator
   * @returns Text content
   */
  async getText(locator: Locator): Promise<string> {
    const text = await locator.textContent();
    return text?.trim() || '';
  }

  /**
   * Get inner text of an element
   * @param locator - Element locator
   * @returns Inner text
   */
  async getInnerText(locator: Locator): Promise<string> {
    return await locator.innerText();
  }

  /**
   * Get attribute value of an element
   * @param locator - Element locator
   * @param attributeName - Name of the attribute
   * @returns Attribute value or null
   */
  async getAttribute(locator: Locator, attributeName: string): Promise<string | null> {
    return await locator.getAttribute(attributeName);
  }

  /**
   * Get input value
   * @param locator - Input element locator
   * @returns Input value
   */
  async getInputValue(locator: Locator): Promise<string> {
    return await locator.inputValue();
  }

  /**
   * Check if element is visible
   * @param locator - Element locator
   * @returns True if visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Check if element is enabled
   * @param locator - Element locator
   * @returns True if enabled
   */
  async isEnabled(locator: Locator): Promise<boolean> {
    return await locator.isEnabled();
  }

  /**
   * Check if checkbox/radio is checked
   * @param locator - Checkbox/radio element locator
   * @returns True if checked
   */
  async isChecked(locator: Locator): Promise<boolean> {
    return await locator.isChecked();
  }

  /**
   * Get count of matching elements
   * @param locator - Element locator
   * @returns Number of matching elements
   */
  async getCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  // ============================================
  // Wait Methods
  // ============================================

  /**
   * Wait for element to be visible
   * @param locator - Element locator
   * @param timeout - Timeout in milliseconds
   */
  async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Waiting for visible: ${description}`);
    await locator.waitFor({ state: 'visible', timeout: timeout || this.defaultTimeout });
  }

  /**
   * Wait for element to be hidden
   * @param locator - Element locator
   * @param timeout - Timeout in milliseconds
   */
  async waitForHidden(locator: Locator, timeout?: number): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Waiting for hidden: ${description}`);
    await locator.waitFor({ state: 'hidden', timeout: timeout || this.defaultTimeout });
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    logger.debug(`[${this.pageName}] Waiting for navigation`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific URL pattern
   * @param urlPattern - URL pattern (string or regex)
   */
  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    logger.debug(`[${this.pageName}] Waiting for URL: ${urlPattern}`);
    await this.page.waitForURL(urlPattern, { timeout: this.defaultTimeout });
  }

  /**
   * Wait for a fixed amount of time (use sparingly)
   * @param milliseconds - Time to wait in milliseconds
   */
  async wait(milliseconds: number): Promise<void> {
    logger.warn(`[${this.pageName}] Hard wait for ${milliseconds}ms - consider using explicit waits`);
    await this.page.waitForTimeout(milliseconds);
  }

  // ============================================
  // Assertion Helper Methods
  // ============================================

  /**
   * Assert element is visible
   * @param locator - Element locator
   * @param message - Optional assertion message
   */
  async assertVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible();
  }

  /**
   * Assert element is hidden
   * @param locator - Element locator
   * @param message - Optional assertion message
   */
  async assertHidden(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeHidden();
  }

  /**
   * Assert element contains text
   * @param locator - Element locator
   * @param text - Expected text
   * @param message - Optional assertion message
   */
  async assertContainsText(locator: Locator, text: string, message?: string): Promise<void> {
    await expect(locator, message).toContainText(text);
  }

  /**
   * Assert element has exact text
   * @param locator - Element locator
   * @param text - Expected text
   * @param message - Optional assertion message
   */
  async assertHasText(locator: Locator, text: string, message?: string): Promise<void> {
    await expect(locator, message).toHaveText(text);
  }

  /**
   * Assert page has title
   * @param title - Expected title (string or regex)
   * @param message - Optional assertion message
   */
  async assertTitle(title: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveTitle(title);
  }

  /**
   * Assert page has URL
   * @param url - Expected URL (string or regex)
   * @param message - Optional assertion message
   */
  async assertUrl(url: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveURL(url);
  }

  // ============================================
  // Screenshot & Debug Methods
  // ============================================

  /**
   * Take a screenshot of the current page
   * @param name - Screenshot name
   * @returns Path to the screenshot
   */
  async takeScreenshot(name: string): Promise<string> {
    const path = `test-results/screenshots/${name}-${Date.now()}.png`;
    logger.info(`[${this.pageName}] Taking screenshot: ${path}`);
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * Take a screenshot of a specific element
   * @param locator - Element locator
   * @param name - Screenshot name
   * @returns Path to the screenshot
   */
  async takeElementScreenshot(locator: Locator, name: string): Promise<string> {
    const path = `test-results/screenshots/${name}-${Date.now()}.png`;
    logger.info(`[${this.pageName}] Taking element screenshot: ${path}`);
    await locator.screenshot({ path });
    return path;
  }

  // ============================================
  // JavaScript Execution Methods
  // ============================================

  /**
   * Execute JavaScript in the page context
   * @param script - JavaScript to execute
   * @param args - Optional arguments to pass to the script
   * @returns Result of the script execution
   */
  async executeScript<T>(script: string | ((...args: unknown[]) => T), ...args: unknown[]): Promise<T> {
    logger.debug(`[${this.pageName}] Executing script`);
    return await this.page.evaluate(script, ...args);
  }

  /**
   * Scroll to an element
   * @param locator - Element locator
   */
  async scrollToElement(locator: Locator): Promise<void> {
    const description = await this.getLocatorDescription(locator);
    logger.debug(`[${this.pageName}] Scrolling to: ${description}`);
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to page top
   */
  async scrollToTop(): Promise<void> {
    logger.debug(`[${this.pageName}] Scrolling to top`);
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll to page bottom
   */
  async scrollToBottom(): Promise<void> {
    logger.debug(`[${this.pageName}] Scrolling to bottom`);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // ============================================
  // Frame Handling Methods
  // ============================================

  /**
   * Get a frame by name or URL
   * @param nameOrUrl - Frame name or URL pattern
   * @returns Frame page object or null
   */
  getFrame(nameOrUrl: string): ReturnType<Page['frame']> {
    return this.page.frame(nameOrUrl);
  }

  /**
   * Get frame locator
   * @param selector - Frame selector
   * @returns Frame locator
   */
  frameLocator(selector: string): ReturnType<Page['frameLocator']> {
    return this.page.frameLocator(selector);
  }

  // ============================================
  // Dialog Handling Methods
  // ============================================

  /**
   * Handle alert dialog
   * @param action - Action to perform ('accept' or 'dismiss')
   * @param promptText - Text to enter for prompt dialogs
   */
  async handleDialog(action: 'accept' | 'dismiss', promptText?: string): Promise<void> {
    logger.info(`[${this.pageName}] Setting up dialog handler: ${action}`);
    this.page.once('dialog', async (dialog) => {
      logger.info(`[${this.pageName}] Dialog appeared: ${dialog.message()}`);
      if (action === 'accept') {
        await dialog.accept(promptText);
      } else {
        await dialog.dismiss();
      }
    });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Get a human-readable description of a locator
   * @param locator - Element locator
   * @returns Description string
   */
  private async getLocatorDescription(locator: Locator): Promise<string> {
    try {
      // Try to get meaningful identifier
      const testId = await locator.getAttribute('data-testid');
      if (testId) {
        return `[data-testid="${testId}"]`;
      }

      const id = await locator.getAttribute('id');
      if (id) {
        return `#${id}`;
      }

      const name = await locator.getAttribute('name');
      if (name) {
        return `[name="${name}"]`;
      }

      return locator.toString();
    } catch {
      return locator.toString();
    }
  }
}

export default BasePage;
