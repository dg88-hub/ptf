/**
 * @fileoverview SauceDemo Cart and Checkout Page Objects.
 * Handles shopping cart and checkout flow - simulates invoice/AR.
 *
 * @module pages/saucedemo/SauceDemoCheckoutPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from "@playwright/test";
import { SauceDemoBasePage } from "./SauceDemoBasePage";

/**
 * Cart item interface
 */
export interface CartItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

/**
 * Checkout information interface
 */
export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * Order summary interface (like an invoice)
 */
export interface OrderSummary {
  items: CartItem[];
  itemTotal: number;
  tax: number;
  total: number;
}

/**
 * SauceDemo Cart Page Object
 */
export class SauceDemoCartPage extends SauceDemoBasePage {
  // Cart container
  readonly cartContainer: Locator;
  readonly cartItems: Locator;

  // Cart item elements
  readonly cartQuantity: Locator;
  readonly cartItemNames: Locator;
  readonly cartItemPrices: Locator;

  // Buttons
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    super(page);

    // Container
    this.cartContainer = page.locator("#cart_contents_container");
    this.cartItems = page.locator(".cart_item");

    // Items
    this.cartQuantity = page.locator(".cart_quantity");
    this.cartItemNames = page.locator(".inventory_item_name");
    this.cartItemPrices = page.locator(".inventory_item_price");

    // Buttons
    this.continueShoppingButton = page.locator("#continue-shopping");
    this.checkoutButton = page.locator("#checkout");
    this.removeButtons = page.locator('button:has-text("Remove")');
  }

  /**
   * Navigate to cart page
   */
  async navigateToCart(): Promise<void> {
    await this.navigate(`${this.baseUrl}/cart.html`);
    await this.cartContainer.waitFor({ state: "visible" });
  }

  /**
   * Get all cart items
   */
  async getCartItems(): Promise<CartItem[]> {
    const items: CartItem[] = [];
    const count = await this.cartItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);

      const name =
        (await item.locator(".inventory_item_name").textContent())?.trim() ||
        "";
      const description =
        (await item.locator(".inventory_item_desc").textContent())?.trim() ||
        "";
      const priceText =
        (await item.locator(".inventory_item_price").textContent())?.trim() ||
        "0";
      const price = parseFloat(priceText.replace("$", ""));
      const qtyText =
        (await item.locator(".cart_quantity").textContent())?.trim() || "1";
      const quantity = parseInt(qtyText, 10);

      items.push({ name, description, price, quantity });
    }

    return items;
  }

  /**
   * Get cart item count
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Remove item from cart by name
   */
  async removeItem(productName: string): Promise<void> {
    const item = this.cartItems.filter({
      has: this.page.locator(`.inventory_item_name:text("${productName}")`),
    });
    const removeButton = item.locator('button:has-text("Remove")');
    await this.click(removeButton);
  }

  /**
   * Remove all items from cart
   */
  async removeAllItems(): Promise<void> {
    const count = await this.removeButtons.count();
    for (let i = count - 1; i >= 0; i--) {
      await this.click(this.removeButtons.nth(0));
    }
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  /**
   * Continue shopping
   */
  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton);
  }

  /**
   * Calculate cart total
   */
  async getCartTotal(): Promise<number> {
    const items = await this.getCartItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Verify cart is empty
   */
  async verifyCartEmpty(): Promise<void> {
    const count = await this.getItemCount();
    expect(count).toBe(0);
  }

  /**
   * Verify cart has items
   */
  async verifyCartHasItems(expectedCount?: number): Promise<void> {
    const count = await this.getItemCount();
    if (expectedCount !== undefined) {
      expect(count).toBe(expectedCount);
    } else {
      expect(count).toBeGreaterThan(0);
    }
  }
}

/**
 * SauceDemo Checkout Page Object
 * Handles the checkout flow - simulates creating an invoice
 */
export class SauceDemoCheckoutPage extends SauceDemoBasePage {
  // Step 1: Customer Information
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  // Step 2: Overview (Invoice-like summary)
  readonly summaryContainer: Locator;
  readonly summaryItems: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryTax: Locator;
  readonly summaryTotal: Locator;
  readonly finishButton: Locator;

  // Complete
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  // Payment/Shipping info (displayed on overview)
  readonly paymentInfo: Locator;
  readonly shippingInfo: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1
    this.firstNameInput = page.locator("#first-name");
    this.lastNameInput = page.locator("#last-name");
    this.postalCodeInput = page.locator("#postal-code");
    this.continueButton = page.locator("#continue");
    this.cancelButton = page.locator("#cancel");
    this.errorMessage = page.locator('[data-test="error"]');

    // Step 2
    this.summaryContainer = page.locator("#checkout_summary_container");
    this.summaryItems = page.locator(".cart_item");
    this.summarySubtotal = page.locator(".summary_subtotal_label");
    this.summaryTax = page.locator(".summary_tax_label");
    this.summaryTotal = page.locator(".summary_total_label");
    this.finishButton = page.locator("#finish");

    // Payment/Shipping
    this.paymentInfo = page.locator(".summary_value_label").first();
    this.shippingInfo = page.locator(".summary_value_label").last();

    // Complete
    this.completeHeader = page.locator(".complete-header");
    this.completeText = page.locator(".complete-text");
    this.backHomeButton = page.locator("#back-to-products");
  }

  /**
   * Fill checkout information (Step 1)
   */
  async fillCheckoutInfo(info: CheckoutInfo): Promise<void> {
    await this.fill(this.firstNameInput, info.firstName);
    await this.fill(this.lastNameInput, info.lastName);
    await this.fill(this.postalCodeInput, info.postalCode);
  }

  /**
   * Continue to next step
   */
  async continue(): Promise<void> {
    await this.click(this.continueButton);
  }

  /**
   * Fill info and continue
   */
  async fillAndContinue(info: CheckoutInfo): Promise<void> {
    await this.fillCheckoutInfo(info);
    await this.continue();
  }

  /**
   * Get order summary (like invoice details)
   */
  async getOrderSummary(): Promise<OrderSummary> {
    const items: CartItem[] = [];
    const count = await this.summaryItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.summaryItems.nth(i);
      const name =
        (await item.locator(".inventory_item_name").textContent())?.trim() ||
        "";
      const description =
        (await item.locator(".inventory_item_desc").textContent())?.trim() ||
        "";
      const priceText =
        (await item.locator(".inventory_item_price").textContent())?.trim() ||
        "0";
      const price = parseFloat(priceText.replace("$", ""));

      items.push({ name, description, price, quantity: 1 });
    }

    const subtotalText =
      (await this.summarySubtotal.textContent())?.trim() || "0";
    const taxText = (await this.summaryTax.textContent())?.trim() || "0";
    const totalText = (await this.summaryTotal.textContent())?.trim() || "0";

    const itemTotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ""));
    const tax = parseFloat(taxText.replace(/[^0-9.]/g, ""));
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ""));

    return { items, itemTotal, tax, total };
  }

  /**
   * Finish checkout (complete order)
   */
  async finishCheckout(): Promise<void> {
    await this.click(this.finishButton);
  }

  /**
   * Verify on checkout step 1
   */
  async verifyOnCheckoutStep1(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
  }

  /**
   * Verify on checkout step 2 (overview)
   */
  async verifyOnCheckoutStep2(): Promise<void> {
    await expect(this.summaryContainer).toBeVisible();
    await expect(this.finishButton).toBeVisible();
  }

  /**
   * Verify checkout complete
   */
  async verifyCheckoutComplete(): Promise<void> {
    await expect(this.completeHeader).toContainText("Thank you for your order");
  }

  /**
   * Verify error message
   */
  async verifyError(expectedError?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedError) {
      await expect(this.errorMessage).toContainText(expectedError);
    }
  }

  /**
   * Complete full checkout flow
   */
  async completeCheckout(info: CheckoutInfo): Promise<OrderSummary> {
    await this.fillAndContinue(info);
    await this.verifyOnCheckoutStep2();

    const summary = await this.getOrderSummary();

    await this.finishCheckout();
    await this.verifyCheckoutComplete();

    return summary;
  }

  /**
   * Go back to products after checkout
   */
  async goBackToProducts(): Promise<void> {
    await this.click(this.backHomeButton);
  }

  /**
   * Generate default checkout info
   */
  static getDefaultCheckoutInfo(): CheckoutInfo {
    return {
      firstName: "Test",
      lastName: "User",
      postalCode: "12345",
    };
  }
}
