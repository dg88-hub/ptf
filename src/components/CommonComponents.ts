/**
 * @fileoverview Reusable UI components for common patterns across page objects
 * @module components/NavigationMenu
 */

import { Locator, Page } from '@playwright/test';
import { logger } from '../utils/Logger';

/**
 * Navigation menu component
 * Reusable across different applications
 *
 * @example
 * ```typescript
 * const nav = new NavigationMenu(page, '.main-nav');
 * await nav.navigateTo('Dashboard');
 * ```
 */
export class NavigationMenu {
  private readonly container: Locator;

  constructor(
    private readonly page: Page,
    containerSelector: string
  ) {
    this.container = page.locator(containerSelector);
  }

  /**
   * Navigate to menu item by text
   */
  async navigateTo(itemText: string): Promise<void> {
    logger.info(`[NavigationMenu] Navigating to: ${itemText}`);
    await this.container.locator(`text=${itemText}`).click();
  }

  /**
   * Get all menu items
   */
  async getMenuItems(): Promise<string[]> {
    const items = await this.container.locator('a, button').allTextContents();
    return items;
  }

  /**
   * Check if menu item exists
   */
  async hasMenuItem(itemText: string): Promise<boolean> {
    const count = await this.container.locator(`text=${itemText}`).count();
    return count > 0;
  }
}

/**
 * Form component with common validation and submission patterns
 */
export class FormComponent {
  constructor(
    private readonly page: Page,
    private readonly formSelector: string
  ) {}

  /**
   * Fill form fields from object
   */
  async fill(data: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(data)) {
      const input = this.page.locator(`${this.formSelector} [name="${field}"]`);
      await input.fill(value);
    }
  }

  /**
   * Submit form and wait for navigation
   */
  async submit(): Promise<void> {
    await this.page.locator(`${this.formSelector} button[type="submit"]`).click();
  }

  /**
   * Get validation errors
   */
  async getErrors(): Promise<string[]> {
    return await this.page.locator(`${this.formSelector} .error`).allTextContents();
  }
}

/**
 * Modal dialog component
 */
export class ModalComponent {
  private readonly modal: Locator;

  constructor(page: Page, modalSelector: string = '.modal') {
    this.modal = page.locator(modalSelector);
  }

  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  async close(): Promise<void> {
    await this.modal.locator('.close, [aria-label="Close"]').click();
  }

  async getTitle(): Promise<string> {
    return (await this.modal.locator('.modal-title, h2').textContent()) || '';
  }

  async clickButton(buttonText: string): Promise<void> {
    await this.modal.locator(`button:has-text("${buttonText}")`).click();
  }
}

/**
 * Notification/Toast component
 */
export class NotificationComponent {
  constructor(private readonly page: Page) {}

  async waitForNotification(type: 'success' | 'error' | 'warning' = 'success'): Promise<string> {
    const notification = this.page.locator(`.notification.${type}, .toast.${type}`);
    await notification.waitFor({ state: 'visible', timeout: 5000 });
    return (await notification.textContent()) || '';
  }

  async closeAll(): Promise<void> {
    const closeButtons = this.page.locator('.notification .close, .toast .close');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click();
    }
  }
}
