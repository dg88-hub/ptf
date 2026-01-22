/**
 * @fileoverview Barrel export for all page objects.
 *
 * Import page objects from this single entry point.
 *
 * @module pages
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { AppManager, ApplicationFactory } from '../pages';
 * ```
 */

// Application Manager (Facade)
export { AppManager } from './AppManager';
export { ApplicationFactory } from './ApplicationFactory';

// SauceDemo Pages
export { SauceDemoBasePage } from './saucedemo/SauceDemoBasePage';
export { SauceDemoCartPage, SauceDemoCheckoutPage } from './saucedemo/SauceDemoCheckoutPage';
export { SauceDemoInventoryPage } from './saucedemo/SauceDemoInventoryPage';
export { SauceDemoLoginPage } from './saucedemo/SauceDemoLoginPage';

// ParaBank Pages
export { ParaBankAccountsPage } from './parabank/ParaBankAccountsPage';
export { ParaBankBasePage } from './parabank/ParaBankBasePage';
export { ParaBankLoginPage } from './parabank/ParaBankLoginPage';
export { ParaBankTransferPage } from './parabank/ParaBankTransferPage';

// Sample Pages
export { DashboardPage } from './sample/DashboardPage';
export { LoginPage } from './sample/LoginPage';
export { SampleBasePage } from './sample/SampleBasePage';
