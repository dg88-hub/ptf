/**
 * @fileoverview ParaBank Transfer & Bill Pay Page Objects.
 * Handles fund transfers and bill payments - simulates AP functionality.
 *
 * @module pages/parabank/ParaBankTransferPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from "@playwright/test";
import { ParaBankBasePage } from "./ParaBankBasePage";

/**
 * Transfer details interface
 */
export interface TransferDetails {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
}

/**
 * Bill payment details interface
 */
export interface BillPaymentDetails {
  payeeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
  verifyAccountNumber: string;
  amount: number;
  fromAccountId: string;
}

/**
 * ParaBank Transfer Funds Page Object
 * Simulates internal fund transfers (similar to GL transfers)
 */
export class ParaBankTransferPage extends ParaBankBasePage {
  // Transfer form elements
  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly toAccountSelect: Locator;
  readonly transferButton: Locator;

  // Result elements
  readonly transferComplete: Locator;
  readonly transferAmount: Locator;

  constructor(page: Page) {
    super(page);

    // Transfer form
    this.amountInput = page.locator("#amount");
    this.fromAccountSelect = page.locator("#fromAccountId");
    this.toAccountSelect = page.locator("#toAccountId");
    this.transferButton = page.locator('input[value="Transfer"]');

    // Results
    this.transferComplete = page.locator("#rightPanel h1.title");
    this.transferAmount = page
      .locator("#amount.ng-binding, #rightPanel p")
      .first();
  }

  /**
   * Navigate to transfer funds page
   */
  async navigateToTransfer(): Promise<void> {
    await this.navigate(`${this.baseUrl}/transfer.htm`);
    await this.waitForPageLoad();
    await this.fromAccountSelect.waitFor({ state: "visible" });
  }

  /**
   * Execute a fund transfer
   */
  async transfer(
    amount: number,
    fromAccountIndex: number = 0,
    toAccountIndex: number = 1,
  ): Promise<void> {
    // Wait for accounts to load
    await this.page.waitForTimeout(500);

    await this.fill(this.amountInput, String(amount));
    await this.selectOption(this.fromAccountSelect, {
      index: fromAccountIndex,
    });
    await this.selectOption(this.toAccountSelect, { index: toAccountIndex });

    await this.click(this.transferButton);
    await this.waitForPageLoad();
  }

  /**
   * Transfer between specific account IDs
   */
  async transferBetweenAccounts(details: TransferDetails): Promise<void> {
    await this.fill(this.amountInput, String(details.amount));
    await this.selectOption(this.fromAccountSelect, details.fromAccountId);
    await this.selectOption(this.toAccountSelect, details.toAccountId);

    await this.click(this.transferButton);
    await this.waitForPageLoad();
  }

  /**
   * Verify transfer was successful
   */
  async verifyTransferSuccess(): Promise<void> {
    await expect(this.transferComplete).toContainText("Transfer Complete");
  }

  /**
   * Get available account options
   */
  async getAvailableAccounts(): Promise<string[]> {
    const options = this.fromAccountSelect.locator("option");
    const count = await options.count();
    const accounts: string[] = [];

    for (let i = 0; i < count; i++) {
      const value = await options.nth(i).getAttribute("value");
      if (value) accounts.push(value);
    }

    return accounts;
  }
}

/**
 * ParaBank Bill Pay Page Object
 * Simulates Accounts Payable (AP) - paying vendors/bills
 */
export class ParaBankBillPayPage extends ParaBankBasePage {
  // Payee information
  readonly payeeNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly accountInput: Locator;
  readonly verifyAccountInput: Locator;

  // Payment details
  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly submitButton: Locator;

  // Result elements
  readonly paymentComplete: Locator;
  readonly payeeName: Locator;
  readonly amountPaid: Locator;

  constructor(page: Page) {
    super(page);

    // Payee info
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');

    // Payment
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountSelect = page.locator('select[name="fromAccountId"]');
    this.submitButton = page.locator('input[value="Send Payment"]');

    // Results
    this.paymentComplete = page.locator("#rightPanel h1.title");
    this.payeeName = page.locator("#payeeName");
    this.amountPaid = page.locator("#amount");
  }

  /**
   * Navigate to bill pay page
   */
  async navigateToBillPay(): Promise<void> {
    await this.navigate(`${this.baseUrl}/billpay.htm`);
    await this.waitForPageLoad();
    await this.payeeNameInput.waitFor({ state: "visible" });
  }

  /**
   * Fill payee information
   */
  async fillPayeeInfo(payee: Partial<BillPaymentDetails>): Promise<void> {
    if (payee.payeeName) await this.fill(this.payeeNameInput, payee.payeeName);
    if (payee.address) await this.fill(this.addressInput, payee.address);
    if (payee.city) await this.fill(this.cityInput, payee.city);
    if (payee.state) await this.fill(this.stateInput, payee.state);
    if (payee.zipCode) await this.fill(this.zipCodeInput, payee.zipCode);
    if (payee.phone) await this.fill(this.phoneInput, payee.phone);
    if (payee.accountNumber) {
      await this.fill(this.accountInput, payee.accountNumber);
      await this.fill(
        this.verifyAccountInput,
        payee.verifyAccountNumber || payee.accountNumber,
      );
    }
  }

  /**
   * Make a bill payment
   */
  async payBill(details: BillPaymentDetails): Promise<void> {
    await this.fillPayeeInfo(details);
    await this.fill(this.amountInput, String(details.amount));

    // Wait for accounts to load and select
    await this.page.waitForTimeout(500);
    if (details.fromAccountId) {
      await this.selectOption(this.fromAccountSelect, details.fromAccountId);
    }

    await this.click(this.submitButton);
    await this.waitForPageLoad();
  }

  /**
   * Quick bill payment with minimal info
   */
  async quickPayBill(
    payeeName: string,
    accountNumber: string,
    amount: number,
    fromAccountIndex: number = 0,
  ): Promise<void> {
    const details: BillPaymentDetails = {
      payeeName,
      address: "123 Vendor St",
      city: "Vendor City",
      state: "VC",
      zipCode: "12345",
      phone: "555-555-5555",
      accountNumber,
      verifyAccountNumber: accountNumber,
      amount,
      fromAccountId: "",
    };

    await this.fillPayeeInfo(details);
    await this.fill(this.amountInput, String(amount));
    await this.page.waitForTimeout(500);
    await this.selectOption(this.fromAccountSelect, {
      index: fromAccountIndex,
    });

    await this.click(this.submitButton);
    await this.waitForPageLoad();
  }

  /**
   * Verify payment was successful
   */
  async verifyPaymentSuccess(expectedPayee?: string): Promise<void> {
    await expect(this.paymentComplete).toContainText("Bill Payment Complete");
    if (expectedPayee) {
      await expect(this.payeeName).toContainText(expectedPayee);
    }
  }

  /**
   * Get paid amount from confirmation
   */
  async getPaidAmount(): Promise<number> {
    const text = await this.amountPaid.textContent();
    return parseFloat(text?.replace(/[$,]/g, "") || "0");
  }

  /**
   * Generate default vendor payment details
   */
  static generateVendorPayment(
    vendorName: string,
    amount: number,
  ): BillPaymentDetails {
    return {
      payeeName: vendorName,
      address: "456 Vendor Lane",
      city: "Commerce City",
      state: "CC",
      zipCode: "54321",
      phone: "555-123-4567",
      accountNumber: `VEND${Date.now().toString().slice(-8)}`,
      verifyAccountNumber: "",
      amount,
      fromAccountId: "",
    };
  }
}
