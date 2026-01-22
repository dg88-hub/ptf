/**
 * @fileoverview Accounts Payable (AP) Test Suite using ParaBank.
 * Demonstrates enterprise-grade AP testing including bill payments,
 * vendor management, and payment workflows.
 *
 * @module tests/ui/erp/accounts-payable.spec
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * =================
 * This test suite demonstrates:
 * - Page Object Model pattern with BasePage extension
 * - Test data factories for realistic vendor data
 * - Soft assertions for non-blocking validations
 * - Test hooks (beforeEach, afterEach)
 * - Tags for test filtering (@ap, @erp, @payments)
 * - Retry mechanisms for flaky operations
 * - Performance metrics collection
 * - Accessibility checks
 *
 * AP Workflow Tested:
 * 1. Vendor/Payee creation
 * 2. Bill/Invoice entry
 * 3. Payment processing
 * 4. Transaction verification
 */

import { expect, test } from "../../../src/core/fixtures";
import { ParaBankAccountsPage } from "../../../src/pages/parabank/ParaBankAccountsPage";
import { ParaBankLoginPage } from "../../../src/pages/parabank/ParaBankLoginPage";
import { ParaBankBillPayPage } from "../../../src/pages/parabank/ParaBankTransferPage";
import { AccessibilityHelper } from "../../../src/utils/AccessibilityHelper";
import {
  InvoiceFactory,
  VendorFactory,
} from "../../../src/utils/ErpDataFactory";
import { logger } from "../../../src/utils/Logger";
import { PerformanceMetrics } from "../../../src/utils/PerformanceMetrics";
import { RetryHelper, RetryPolicies } from "../../../src/utils/RetryHelper";

/**
 * Accounts Payable Test Suite
 * Tests bill payment functionality simulating AP workflows
 */
test.describe("Accounts Payable (AP) Tests @erp @ap", () => {
  let loginPage: ParaBankLoginPage;
  let accountsPage: ParaBankAccountsPage;
  let billPayPage: ParaBankBillPayPage;
  let performanceMetrics: PerformanceMetrics;

  // Test data generated using factories
  const testVendor = VendorFactory.create()
    .withName("Acme Office Supplies")
    .withCategory("Office Supplies")
    .withPaymentTerms("Net 30")
    .build();

  test.beforeEach(async ({ page }) => {
    logger.info("Setting up AP test environment");

    // Initialize page objects
    loginPage = new ParaBankLoginPage(page);
    accountsPage = new ParaBankAccountsPage(page);
    billPayPage = new ParaBankBillPayPage(page);
    performanceMetrics = new PerformanceMetrics(page);

    // Navigate to ParaBank and login
    await loginPage.navigateToLogin();

    // Register a new user for clean state or login with existing
    const timestamp = Date.now().toString().slice(-6);
    const regData = {
      ...ParaBankLoginPage.generateRegistrationData(),
      username: `aptest${timestamp}`,
    };

    await RetryHelper.retry(
      async () => {
        await loginPage.register(regData);
      },
      {
        ...RetryPolicies.standard,
        operationName: "User registration",
        retryCondition: () => true,
      },
    );

    logger.info("AP test environment ready");
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: logout if still logged in
    try {
      const loginPageCheck = new ParaBankLoginPage(page);
      if (await loginPageCheck.isLoggedIn()) {
        await loginPageCheck.logout();
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Test: Complete bill payment workflow
   * Simulates paying a vendor invoice
   */
  test("should complete bill payment to vendor @ap @payments @critical", async ({
    page: _page,
  }) => {
    logger.testStart("Complete bill payment to vendor");

    // Arrange - Create invoice data using factory
    const invoice = InvoiceFactory.create()
      .withType("vendor")
      .withVendor(testVendor.vendorId)
      .addLineItem("Office Supplies", 10, 25.0)
      .addLineItem("Printer Paper", 5, 35.0)
      .build();

    // Get initial account balance
    await accountsPage.navigateToAccountsOverview();
    const initialAccounts = await accountsPage.getAllAccounts();
    // eslint-disable-next-line playwright/no-conditional-in-test -- Safe nullish coalescing for optional data
    const initialBalance = initialAccounts[0]?.balance || 0;
    logger.info(`Initial account balance: $${initialBalance}`);

    // Act - Navigate to Bill Pay and make payment
    await billPayPage.navigateToBillPay();

    // Fill payee information and submit payment
    await billPayPage.quickPayBill(
      testVendor.name,
      testVendor.vendorId,
      invoice.total,
      0, // First account
    );

    // Assert - Verify payment success
    await billPayPage.verifyPaymentSuccess(testVendor.name);

    // Verify amount paid
    const paidAmount = await billPayPage.getPaidAmount();
    expect(paidAmount).toBe(invoice.total);

    // Verify account balance was reduced (soft assertion)
    await accountsPage.navigateToAccountsOverview();
    const finalAccounts = await accountsPage.getAllAccounts();

    // Use soft expect for non-critical validation
    expect.soft(finalAccounts[0]?.balance).toBeLessThan(initialBalance);

    // Log performance report
    const webVitals = await performanceMetrics.getWebVitals();
    logger.info(`Payment LCP: ${webVitals.lcp}ms`);

    logger.testEnd("Complete bill payment to vendor", "passed");
  });

  /**
   * Test: Bill payment validation errors
   * Verifies form validation for bill payments
   */
  test("should validate required fields in bill pay form @ap @validation", async ({
    page,
  }) => {
    logger.testStart("Bill pay form validation");

    await billPayPage.navigateToBillPay();

    // Try to submit without filling required fields
    await billPayPage.page.locator('input[value="Send Payment"]').click();

    // Verify error states
    const errorElements = await page.locator(".error, .ng-invalid").count();
    expect(errorElements).toBeGreaterThan(0);

    logger.testEnd("Bill pay form validation", "passed");
  });

  /**
   * Test: Multiple vendor payments
   * Simulates batch payment processing
   */
  test("should process multiple vendor payments @ap @batch @regression", async ({
    page: _page,
  }) => {
    logger.testStart("Multiple vendor payments");

    // Create multiple vendors
    const vendors = VendorFactory.createMany(3);

    for (const vendor of vendors) {
      await billPayPage.navigateToBillPay();

      // Create a unique invoice for each vendor
      const invoice = InvoiceFactory.create()
        .withVendor(vendor.vendorId)
        .addLineItem("Services", 1, 100)
        .build();

      await billPayPage.quickPayBill(
        vendor.name,
        vendor.vendorId,
        invoice.total,
      );

      // Verify each payment
      await billPayPage.verifyPaymentSuccess(vendor.name);

      logger.info(`Payment to ${vendor.name} completed`);
    }

    logger.testEnd("Multiple vendor payments", "passed");
  });

  /**
   * Test: Accessibility compliance for bill pay
   */
  test("should meet accessibility standards on bill pay page @ap @a11y", async ({
    page,
  }) => {
    logger.testStart("Bill pay accessibility");

    await billPayPage.navigateToBillPay();

    // Run accessibility check
    const a11yHelper = new AccessibilityHelper(page);
    const violations = await a11yHelper.check();

    // eslint-disable-next-line playwright/no-conditional-in-test -- Conditional logging for debugging
    if (violations.length > 0) {
      logger.warn(`Found ${violations.length} accessibility violations`);
      violations.forEach((v) => logger.debug(`- ${v.id}: ${v.description}`));
    }

    // Assert WCAG 2.1 AA compliance (allowing minor issues for demo site)
    expect
      .soft(violations.filter((v) => v.impact === "critical").length)
      .toBe(0);

    logger.testEnd("Bill pay accessibility", "passed");
  });

  /**
   * Test: Payment confirmation details
   */
  test("should display correct payment confirmation details @ap @smoke", async ({
    page,
  }) => {
    logger.testStart("Payment confirmation details");

    await billPayPage.navigateToBillPay();

    const vendor = VendorFactory.create().withName("Test Vendor Corp").build();
    const paymentAmount = 500.0;

    await billPayPage.quickPayBill(vendor.name, "ACCT123456", paymentAmount);

    // Verify confirmation page elements
    await expect(page.locator("#rightPanel h1.title")).toContainText(
      "Bill Payment Complete",
    );
    await expect(page.locator("#payeeName")).toContainText(vendor.name);
    await expect(page.locator("#amount")).toContainText("500");

    logger.testEnd("Payment confirmation details", "passed");
  });
});

/**
 * Integration Tests: AP with GL
 * Tests the integration between Accounts Payable and General Ledger
 */
test.describe("AP-GL Integration Tests @erp @integration", () => {
  test("should reflect payment in transaction history @ap @gl @integration", async ({
    page,
  }) => {
    logger.testStart("AP-GL integration test");

    // This test would verify that a bill payment appears in transaction history
    // Demonstrating cross-module testing patterns

    const loginPage = new ParaBankLoginPage(page);
    const billPayPage = new ParaBankBillPayPage(page);
    const accountsPage = new ParaBankAccountsPage(page);

    // Setup
    await loginPage.navigateToLogin();
    const regData = ParaBankLoginPage.generateRegistrationData();
    await loginPage.register(regData);

    // Make payment
    await billPayPage.navigateToBillPay();
    await billPayPage.quickPayBill("Integration Test Vendor", "INT12345", 250);
    await billPayPage.verifyPaymentSuccess();

    // Navigate to accounts and view transactions
    await accountsPage.navigateToAccountsOverview();
    const accounts = await accountsPage.getAllAccounts();

    // eslint-disable-next-line playwright/no-conditional-in-test -- Graceful handling of demo site state
    if (accounts.length > 0) {
      await accountsPage.viewAccountDetails(accounts[0].accountId);
      const transactions = await accountsPage.getTransactions();

      // Verify the payment appears in transaction history
      const paymentTransaction = transactions.find(
        (t) => t.description.includes("Bill") || t.debit,
      );

      expect.soft(paymentTransaction).toBeDefined();
    }

    logger.testEnd("AP-GL integration test", "passed");
  });
});
