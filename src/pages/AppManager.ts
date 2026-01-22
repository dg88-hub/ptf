/**
 * @fileoverview Application Manager (Facade Pattern).
 * Centralizes access to all page objects through a single entry point.
 * This decouples tests from individual page instantiations and structure.
 */

import { Page } from '@playwright/test';
import { ParaBankAccountsPage } from './parabank/ParaBankAccountsPage';
import { ParaBankLoginPage } from './parabank/ParaBankLoginPage';
import { ParaBankTransferPage } from './parabank/ParaBankTransferPage';
import { DashboardPage } from './sample/DashboardPage';
import { LoginPage } from './sample/LoginPage';
import { SauceDemoCheckoutPage } from './saucedemo/SauceDemoCheckoutPage';
import { SauceDemoInventoryPage } from './saucedemo/SauceDemoInventoryPage';
import { SauceDemoLoginPage } from './saucedemo/SauceDemoLoginPage';

export class AppManager {
  readonly page: Page;

  readonly sauce: {
    loginPage: SauceDemoLoginPage;
    inventoryPage: SauceDemoInventoryPage;
    checkoutPage: SauceDemoCheckoutPage;
  };

  readonly parabank: {
    loginPage: ParaBankLoginPage;
    accountsPage: ParaBankAccountsPage;
    transferPage: ParaBankTransferPage;
  };

  readonly sample: {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
  };

  constructor(page: Page) {
    this.page = page;

    this.sauce = {
      loginPage: new SauceDemoLoginPage(page),
      inventoryPage: new SauceDemoInventoryPage(page),
      checkoutPage: new SauceDemoCheckoutPage(page),
    };

    this.parabank = {
      loginPage: new ParaBankLoginPage(page),
      accountsPage: new ParaBankAccountsPage(page),
      transferPage: new ParaBankTransferPage(page),
    };

    this.sample = {
      loginPage: new LoginPage(page),
      dashboardPage: new DashboardPage(page),
    };
  }
}
