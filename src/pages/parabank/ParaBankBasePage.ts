/**
 * @fileoverview ParaBank Base Page Object.
 * Provides common functionality for all ParaBank page objects.
 *
 * @module pages/parabank/ParaBankBasePage
 * @author DG
 * @version 1.0.0
 *
 * Target: https://parabank.parasoft.com
 *
 * ParaBank is a realistic banking demo application used for testing.
 * It simulates AP/AR/GL-like operations through:
 * - Account management (similar to GL accounts)
 * - Fund transfers (similar to AP payments)
 * - Bill payments (accounts payable)
 * - Transaction history (general ledger)
 */

import { Locator, Page } from "@playwright/test";
import { BasePage } from "../../core/BasePage";

/**
 * Navigation menu items in ParaBank
 */
export interface ParaBankNavigation {
  openNewAccount: Locator;
  accountsOverview: Locator;
  transferFunds: Locator;
  billPay: Locator;
  findTransactions: Locator;
  updateContactInfo: Locator;
  requestLoan: Locator;
  logOut: Locator;
}

/**
 * Base page for ParaBank application
 */
export class ParaBankBasePage extends BasePage {
  // Base URL
  readonly baseUrl = "https://parabank.parasoft.com/parabank";

  // Header elements
  readonly headerLogo: Locator;
  readonly homeLink: Locator;
  readonly aboutLink: Locator;
  readonly contactLink: Locator;

  // Navigation panel (left sidebar)
  readonly nav: ParaBankNavigation;

  // Footer
  readonly footer: Locator;

  // Error/Message containers
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page, "ParaBankBasePage");

    // Header
    this.headerLogo = page.locator(".logo");
    this.homeLink = page.locator('#headerPanel a[href*="index"]');
    this.aboutLink = page.locator('#headerPanel a[href*="about"]');
    this.contactLink = page.locator('#headerPanel a[href*="contact"]');

    // Navigation panel
    this.nav = {
      openNewAccount: page.locator('a[href*="openaccount"]'),
      accountsOverview: page.locator('a[href*="overview"]'),
      transferFunds: page.locator('a[href*="transfer"]'),
      billPay: page.locator('a[href*="billpay"]'),
      findTransactions: page.locator('a[href*="findtrans"]'),
      updateContactInfo: page.locator('a[href*="updateprofile"]'),
      requestLoan: page.locator('a[href*="requestloan"]'),
      logOut: page.locator('a[href*="logout"]'),
    };

    // Footer
    this.footer = page.locator("#footerPanel");

    // Messages
    this.errorMessage = page.locator(".error");
    this.successMessage = page.locator(
      "#rightPanel p.title, #rightPanel h1.title",
    );
  }

  /**
   * Navigate to ParaBank home page
   */
  async navigateToHome(): Promise<void> {
    await this.navigate(`${this.baseUrl}/index.htm`);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const logoutLink = this.nav.logOut;
    return await logoutLink.isVisible();
  }

  /**
   * Log out from the application
   */
  async logout(): Promise<void> {
    await this.click(this.nav.logOut);
    await this.page.waitForURL("**/index.htm**");
  }

  /**
   * Navigate to Accounts Overview
   */
  async goToAccountsOverview(): Promise<void> {
    await this.click(this.nav.accountsOverview);
  }

  /**
   * Navigate to Transfer Funds
   */
  async goToTransferFunds(): Promise<void> {
    await this.click(this.nav.transferFunds);
  }

  /**
   * Navigate to Bill Pay
   */
  async goToBillPay(): Promise<void> {
    await this.click(this.nav.billPay);
  }

  /**
   * Navigate to Find Transactions
   */
  async goToFindTransactions(): Promise<void> {
    await this.click(this.nav.findTransactions);
  }

  /**
   * Navigate to Open New Account
   */
  async goToOpenNewAccount(): Promise<void> {
    await this.click(this.nav.openNewAccount);
  }

  /**
   * Navigate to Request Loan
   */
  async goToRequestLoan(): Promise<void> {
    await this.click(this.nav.requestLoan);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      return (await this.errorMessage.textContent()) || "";
    }
    return "";
  }

  /**
   * Get success/title message
   */
  async getSuccessMessage(): Promise<string> {
    if (await this.successMessage.isVisible()) {
      return (await this.successMessage.first().textContent()) || "";
    }
    return "";
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
