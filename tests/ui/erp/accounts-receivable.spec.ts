/**
 * @fileoverview Accounts Receivable (AR) Test Suite using SauceDemo.
 * Demonstrates enterprise-grade AR testing including customer orders,
 * checkout flows, and invoice generation.
 *
 * @module tests/ui/erp/accounts-receivable.spec
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * =================
 * This test suite demonstrates:
 * - E-commerce checkout as AR simulation
 * - Order total and invoice verification
 * - Customer data generation
 * - Visual regression testing
 * - Network request interception
 * - Soft assertions
 *
 * AR Workflow Tested:
 * 1. Customer creates order (product selection)
 * 2. Invoice generation (checkout summary)
 * 3. Payment processing (checkout completion)
 * 4. Receipt/confirmation
 */

import { expect, test } from "../../../src/core/fixtures";
import {
  SauceDemoCartPage,
  SauceDemoCheckoutPage,
} from "../../../src/pages/saucedemo/SauceDemoCheckoutPage";
import { SauceDemoInventoryPage } from "../../../src/pages/saucedemo/SauceDemoInventoryPage";
import { SauceDemoLoginPage } from "../../../src/pages/saucedemo/SauceDemoLoginPage";
import { CustomerFactory } from "../../../src/utils/InsuranceDataFactory";
import { logger } from "../../../src/utils/Logger";
import { PerformanceMetrics } from "../../../src/utils/PerformanceMetrics";

/**
 * Accounts Receivable Test Suite
 * Tests checkout flow simulating customer invoice/AR workflows
 */
test.describe("Accounts Receivable (AR) Tests @erp @ar", () => {
  let loginPage: SauceDemoLoginPage;
  let inventoryPage: SauceDemoInventoryPage;
  let cartPage: SauceDemoCartPage;
  let checkoutPage: SauceDemoCheckoutPage;

  test.beforeEach(async ({ page }) => {
    logger.info("Setting up AR test environment");

    // Initialize page objects
    loginPage = new SauceDemoLoginPage(page);
    inventoryPage = new SauceDemoInventoryPage(page);
    cartPage = new SauceDemoCartPage(page);
    checkoutPage = new SauceDemoCheckoutPage(page);

    // Login with standard user
    await loginPage.navigateToLogin();
    await loginPage.loginAs("standard");
    await inventoryPage.verifyOnInventoryPage();

    logger.info("AR test environment ready");
  });

  test.afterEach(async ({ page }) => {
    // Reset app state for next test
    try {
      const basePage = new SauceDemoInventoryPage(page);
      await basePage.resetAppState();
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Test: Complete checkout/invoice flow
   * Simulates creating a customer invoice through checkout
   */
  test("should complete checkout and generate invoice @ar @invoice @critical", async ({
    page: _page,
  }) => {
    logger.testStart("Complete checkout/invoice flow");

    // Arrange - Generate customer data
    const customer = CustomerFactory.create()
      .withName("John", "Smith")
      .withRiskLevel("low")
      .build();

    const checkoutInfo = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      postalCode: customer.address.zipCode,
    };

    // Act - Add items to cart
    await inventoryPage.addToCart("Sauce Labs Backpack");
    await inventoryPage.addToCart("Sauce Labs Bike Light");
    await inventoryPage.addToCart("Sauce Labs Onesie");

    // Verify cart count
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe(3);

    // Go to cart
    await inventoryPage.goToCart();
    await cartPage.verifyCartHasItems(3);

    // Get cart total before checkout
    const cartTotal = await cartPage.getCartTotal();
    logger.info(`Cart total before checkout: $${cartTotal.toFixed(2)}`);

    // Proceed to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.verifyOnCheckoutStep1();

    // Fill customer info and continue
    await checkoutPage.fillAndContinue(checkoutInfo);
    await checkoutPage.verifyOnCheckoutStep2();

    // Get order summary (like an invoice)
    const orderSummary = await checkoutPage.getOrderSummary();

    // Assert - Verify invoice details
    expect(orderSummary.items).toHaveLength(3);
    expect(orderSummary.itemTotal).toBeCloseTo(cartTotal, 2);
    expect(orderSummary.tax).toBeGreaterThan(0);
    expect(orderSummary.total).toBe(orderSummary.itemTotal + orderSummary.tax);

    logger.info(`Invoice Summary:`);
    logger.info(`  Items: ${orderSummary.items.length}`);
    logger.info(`  Subtotal: $${orderSummary.itemTotal.toFixed(2)}`);
    logger.info(`  Tax: $${orderSummary.tax.toFixed(2)}`);
    logger.info(`  Total: $${orderSummary.total.toFixed(2)}`);

    // Complete checkout
    await checkoutPage.finishCheckout();
    await checkoutPage.verifyCheckoutComplete();

    logger.testEnd("Complete checkout/invoice flow", "passed");
  });

  /**
   * Test: Checkout validation
   * Verifies required customer information for invoice
   */
  test("should validate customer information during checkout @ar @validation", async ({
    page: _page,
  }) => {
    logger.testStart("Checkout validation");

    // Add item and go to checkout
    await inventoryPage.addToCartByIndex(0);
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();

    // Try to continue without filling required fields
    await checkoutPage.continue();
    await checkoutPage.verifyError("First Name is required");

    // Fill only first name
    await checkoutPage.fillCheckoutInfo({
      firstName: "Test",
      lastName: "",
      postalCode: "",
    });
    await checkoutPage.continue();
    await checkoutPage.verifyError("Last Name is required");

    // Fill first and last name, missing postal code
    await checkoutPage.fillCheckoutInfo({
      firstName: "Test",
      lastName: "User",
      postalCode: "",
    });
    await checkoutPage.continue();
    await checkoutPage.verifyError("Postal Code is required");

    logger.testEnd("Checkout validation", "passed");
  });

  /**
   * Test: Cart management
   * Tests adding, removing, and updating cart items
   */
  test("should manage cart items correctly @ar @cart", async ({
    page: _page,
  }) => {
    logger.testStart("Cart management");

    // Add multiple items
    await inventoryPage.addToCart("Sauce Labs Backpack");
    await inventoryPage.addToCart("Sauce Labs Bolt T-Shirt");

    expect(await inventoryPage.getCartItemCount()).toBe(2);

    // Remove one item from inventory page
    await inventoryPage.removeFromCart("Sauce Labs Backpack");
    expect(await inventoryPage.getCartItemCount()).toBe(1);

    // Go to cart and verify
    await inventoryPage.goToCart();
    const items = await cartPage.getCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Sauce Labs Bolt T-Shirt");

    // Remove from cart page
    await cartPage.removeItem("Sauce Labs Bolt T-Shirt");
    await cartPage.verifyCartEmpty();

    logger.testEnd("Cart management", "passed");
  });

  /**
   * Test: Product sorting
   * Tests AR-relevant product sorting (price-based)
   */
  test("should sort products by price @ar @inventory", async ({
    page: _page,
  }) => {
    logger.testStart("Product sorting");

    // Sort by price low to high
    await inventoryPage.sortBy("lohi");
    await inventoryPage.verifySortedByPriceAsc();

    // Sort by price high to low
    await inventoryPage.sortBy("hilo");
    await inventoryPage.verifySortedByPriceDesc();

    logger.testEnd("Product sorting", "passed");
  });

  /**
   * Test: Multi-item invoice with tax calculation
   */
  test("should calculate correct tax and total for multi-item order @ar @calculation", async ({
    page: _page,
  }) => {
    logger.testStart("Tax calculation test");

    // Add all products to get maximum invoice
    const productCount = await inventoryPage.getProductCount();
    for (let i = 0; i < productCount; i++) {
      await inventoryPage.addToCartByIndex(i);
    }

    await inventoryPage.goToCart();
    const cartTotal = await cartPage.getCartTotal();

    await cartPage.proceedToCheckout();
    await checkoutPage.fillAndContinue(
      SauceDemoCheckoutPage.getDefaultCheckoutInfo(),
    );

    const summary = await checkoutPage.getOrderSummary();

    // Verify tax is 8% (SauceDemo's tax rate)
    const expectedTax = cartTotal * 0.08;
    expect(summary.tax).toBeCloseTo(expectedTax, 2);

    // Verify total
    expect(summary.total).toBeCloseTo(cartTotal + expectedTax, 2);

    logger.testEnd("Tax calculation test", "passed");
  });

  /**
   * Test: Performance during checkout
   */
  test("should complete checkout within performance thresholds @ar @performance", async ({
    page,
  }) => {
    logger.testStart("Checkout performance");

    const metrics = new PerformanceMetrics(page);

    // Add item
    await inventoryPage.addToCartByIndex(0);
    await inventoryPage.goToCart();

    // Measure checkout flow performance
    await cartPage.proceedToCheckout();
    await checkoutPage.fillAndContinue(
      SauceDemoCheckoutPage.getDefaultCheckoutInfo(),
    );
    await checkoutPage.finishCheckout();

    // Get navigation timing
    const timing = await metrics.getNavigationTiming();

    // Assert performance thresholds
    expect(timing.loadComplete).toBeLessThan(5000); // 5 seconds max load time

    logger.info(`Checkout load time: ${timing.loadComplete}ms`);

    logger.testEnd("Checkout performance", "passed");
  });
});

/**
 * Visual Regression Tests for AR
 */
test.describe("AR Visual Tests @erp @ar @visual", () => {
  test("should match visual snapshot for checkout summary @visual", async ({
    page,
  }) => {
    const loginPage = new SauceDemoLoginPage(page);
    const inventoryPage = new SauceDemoInventoryPage(page);
    const cartPage = new SauceDemoCartPage(page);
    const checkoutPage = new SauceDemoCheckoutPage(page);

    await loginPage.navigateToLogin();
    await loginPage.loginAs("standard");

    // Add items
    await inventoryPage.addToCartByIndex(0);
    await inventoryPage.addToCartByIndex(1);

    // Navigate through checkout
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillAndContinue(
      SauceDemoCheckoutPage.getDefaultCheckoutInfo(),
    );

    // Take screenshot of checkout summary (invoice-like view)
    await expect(page.locator("#checkout_summary_container")).toHaveScreenshot(
      "checkout-summary.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
