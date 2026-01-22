/**
 * @fileoverview ParaBank Accounts Page Object.
 * Handles account overview and account details - simulates GL functionality.
 *
 * @module pages/parabank/ParaBankAccountsPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from '@playwright/test';
import { ParaBankBasePage } from './ParaBankBasePage';

/**
 * Account information interface
 */
export interface AccountInfo {
  accountId: string;
  balance: number;
  availableBalance: number;
}

/**
 * Transaction record interface
 */
export interface TransactionInfo {
  id: string;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
}

/**
 * ParaBank Accounts Page Object
 * Simulates General Ledger (GL) functionality
 */
export class ParaBankAccountsPage extends ParaBankBasePage {
  // Accounts Overview elements
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly totalBalance: Locator;

  // Account Details elements
  readonly accountIdDisplay: Locator;
  readonly accountTypeDisplay: Locator;
  readonly accountBalanceDisplay: Locator;
  readonly accountAvailableDisplay: Locator;
  readonly transactionsTable: Locator;
  readonly transactionRows: Locator;

  // New Account elements
  readonly accountTypeSelect: Locator;
  readonly fromAccountSelect: Locator;
  readonly openAccountButton: Locator;
  readonly newAccountId: Locator;

  constructor(page: Page) {
    super(page);

    // Accounts Overview
    this.accountsTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr');
    this.totalBalance = page
      .locator('#accountTable tfoot .ng-binding, #accountTable td.ng-binding')
      .last();

    // Account Details
    this.accountIdDisplay = page.locator('#accountId');
    this.accountTypeDisplay = page.locator('#accountType');
    this.accountBalanceDisplay = page.locator('#balance');
    this.accountAvailableDisplay = page.locator('#availableBalance');
    this.transactionsTable = page.locator('#transactionTable');
    this.transactionRows = page.locator('#transactionTable tbody tr');

    // New Account
    this.accountTypeSelect = page.locator('#type');
    this.fromAccountSelect = page.locator('#fromAccountId');
    this.openAccountButton = page.locator('input[value="Open New Account"]');
    this.newAccountId = page.locator('#newAccountId');
  }

  /**
   * Navigate to accounts overview
   */
  async navigateToAccountsOverview(): Promise<void> {
    await this.navigate(`${this.baseUrl}/overview.htm`);
    await this.waitForPageLoad();
  }

  /**
   * Get all account information from overview
   */
  async getAllAccounts(): Promise<AccountInfo[]> {
    await this.accountsTable.waitFor({ state: 'visible' });

    // Attempt to wait for rows to populate to avoid race conditions
    try {
      await this.accountRows.first().waitFor({ state: 'visible', timeout: 2000 });
    } catch (e) {
      // Ignore timeout; table might legitimately be empty, or we simply continue to return []
    }

    const accounts: AccountInfo[] = [];

    const rowCount = await this.accountRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.accountRows.nth(i);
      const cells = row.locator('td');

      const accountLink = cells.nth(0).locator('a');
      const accountId = (await accountLink.textContent())?.trim() || '';
      const balanceText = (await cells.nth(1).textContent())?.trim() || '0';
      const availableText = (await cells.nth(2).textContent())?.trim() || '0';

      accounts.push({
        accountId,
        balance: this.parseAmount(balanceText),
        availableBalance: this.parseAmount(availableText),
      });
    }

    return accounts;
  }

  /**
   * Parse currency amount to number
   */
  private parseAmount(text: string): number {
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Click on an account to view details
   */
  async viewAccountDetails(accountId: string): Promise<void> {
    const accountLink = this.page.locator(`a:has-text("${accountId}")`);
    await this.click(accountLink);
    await this.waitForPageLoad();
  }

  /**
   * Get current account balance
   */
  async getAccountBalance(): Promise<number> {
    const balanceText = await this.accountBalanceDisplay.textContent();
    return this.parseAmount(balanceText || '0');
  }

  /**
   * Get transactions for current account
   */
  async getTransactions(): Promise<TransactionInfo[]> {
    await this.transactionsTable.waitFor({ state: 'visible' });
    const transactions: TransactionInfo[] = [];

    const rowCount = await this.transactionRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.transactionRows.nth(i);
      const cells = row.locator('td');

      const dateText = (await cells.nth(0).textContent())?.trim() || '';
      const descLink = cells.nth(1).locator('a');
      const description = (await descLink.textContent())?.trim() || '';
      const id = (await descLink.getAttribute('href'))?.split('/').pop() || '';

      const debitText = (await cells.nth(2).textContent())?.trim();
      const creditText = (await cells.nth(3).textContent())?.trim();

      transactions.push({
        id,
        date: dateText,
        description,
        debit: debitText ? this.parseAmount(debitText) : undefined,
        credit: creditText ? this.parseAmount(creditText) : undefined,
      });
    }

    return transactions;
  }

  /**
   * Navigate to open new account
   */
  async navigateToOpenNewAccount(): Promise<void> {
    await this.navigate(`${this.baseUrl}/openaccount.htm`);
    await this.waitForPageLoad();
  }

  /**
   * Open a new account
   */
  async openNewAccount(
    accountType: 'CHECKING' | 'SAVINGS',
    fundingAccountIndex: number = 0
  ): Promise<string> {
    await this.navigateToOpenNewAccount();

    // Wait for form to be ready
    await this.accountTypeSelect.waitFor({ state: 'visible' });
    await this.fromAccountSelect.waitFor({ state: 'visible' });

    // Select account type
    await this.selectOption(this.accountTypeSelect, accountType);

    // Wait for accounts to load and select funding account
    // Wait for at least one option to be present in the dropdown
    await this.fromAccountSelect.locator('option').first().waitFor({ state: 'attached' });
    await this.selectOption(this.fromAccountSelect, {
      index: fundingAccountIndex,
    });

    // Open account
    await this.click(this.openAccountButton);
    await this.waitForPageLoad();

    // Get new account ID
    await this.newAccountId.waitFor({ state: 'visible' });
    const newAccountId = (await this.newAccountId.textContent())?.trim() || '';
    return newAccountId;
  }

  /**
   * Verify account overview is displayed
   */
  async verifyOnAccountsOverview(): Promise<void> {
    await expect(this.accountsTable).toBeVisible();
  }

  /**
   * Verify account details are displayed
   */
  async verifyOnAccountDetails(): Promise<void> {
    await expect(this.accountIdDisplay).toBeVisible();
    await expect(this.accountBalanceDisplay).toBeVisible();
  }

  /**
   * Get total balance across all accounts
   */
  async getTotalBalance(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }

  /**
   * Assert account balance
   */
  async assertAccountBalance(expectedBalance: number, tolerance: number = 0.01): Promise<void> {
    const actualBalance = await this.getAccountBalance();
    expect(Math.abs(actualBalance - expectedBalance)).toBeLessThanOrEqual(tolerance);
  }
}
