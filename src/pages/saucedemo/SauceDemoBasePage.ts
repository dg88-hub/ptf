/**
 * @fileoverview SauceDemo Base Page Object.
 * Provides common functionality for all SauceDemo page objects.
 *
 * @module pages/saucedemo/SauceDemoBasePage
 * @author DG
 * @version 1.0.0
 *
 * Target: https://www.saucedemo.com
 *
 * SauceDemo is a demo e-commerce application for testing.
 * It simulates AR/Invoice flows through:
 * - Product catalog (inventory)
 * - Shopping cart
 * - Checkout process (creates invoice/receipt)
 */

import { Locator, Page } from "@playwright/test";
import { BasePage } from "../../core/BasePage";

/**
 * SauceDemo Base Page Object
 */
export class SauceDemoBasePage extends BasePage {
  // Base URL
  readonly baseUrl = "https://www.saucedemo.com";

  // Header elements
  readonly menuButton: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly appLogo: Locator;

  // Sidebar menu
  readonly sidebarMenu: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppLink: Locator;
  readonly closeMenuButton: Locator;

  // Footer
  readonly footer: Locator;
  readonly socialLinks: Locator;

  constructor(page: Page) {
    super(page, "SauceDemoBasePage");

    // Header
    this.menuButton = page.locator("#react-burger-menu-btn");
    this.cartLink = page.locator(".shopping_cart_link");
    this.cartBadge = page.locator(".shopping_cart_badge");
    this.appLogo = page.locator(".app_logo");

    // Sidebar
    this.sidebarMenu = page.locator(".bm-menu-wrap");
    this.allItemsLink = page.locator("#inventory_sidebar_link");
    this.aboutLink = page.locator("#about_sidebar_link");
    this.logoutLink = page.locator("#logout_sidebar_link");
    this.resetAppLink = page.locator("#reset_sidebar_link");
    this.closeMenuButton = page.locator("#react-burger-cross-btn");

    // Footer
    this.footer = page.locator("footer");
    this.socialLinks = page.locator(".social");
  }

  /**
   * Open sidebar menu
   */
  async openMenu(): Promise<void> {
    await this.click(this.menuButton);
    await this.sidebarMenu.waitFor({ state: "visible" });
  }

  /**
   * Close sidebar menu
   */
  async closeMenu(): Promise<void> {
    await this.click(this.closeMenuButton);
    await this.sidebarMenu.waitFor({ state: "hidden" });
  }

  /**
   * Log out from the application
   */
  async logout(): Promise<void> {
    await this.openMenu();
    await this.click(this.logoutLink);
    await this.page.waitForURL("**/saucedemo.com**");
  }

  /**
   * Reset application state
   */
  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.click(this.resetAppLink);
    await this.closeMenu();
  }

  /**
   * Navigate to cart
   */
  async goToCart(): Promise<void> {
    await this.click(this.cartLink);
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    try {
      const badgeText = await this.cartBadge.textContent({ timeout: 2000 });
      return parseInt(badgeText || "0", 10);
    } catch {
      return 0;
    }
  }

  /**
   * Check if cart has items
   */
  async hasItemsInCart(): Promise<boolean> {
    return (await this.getCartItemCount()) > 0;
  }

  /**
   * Navigate to all items
   */
  async goToAllItems(): Promise<void> {
    await this.openMenu();
    await this.click(this.allItemsLink);
  }
}
