/**
 * @fileoverview Application Factory.
 * creates instances of the Application Manager.
 */

import { Page } from '@playwright/test';
import { AppManager } from './AppManager';

export class ApplicationFactory {
  /**
   * Create a new Application Manager instance
   * @param page Playwright Page object
   */
  static createApp(page: Page): AppManager {
    return new AppManager(page);
  }
}
