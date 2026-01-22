/**
 * @fileoverview SauceDemo Inventory Page Object.
 * Handles product listing and adding items to cart.
 *
 * @module pages/saucedemo/SauceDemoInventoryPage
 * @author DG
 * @version 1.0.0
 */

import { expect, Locator, Page } from "@playwright/test";
import { SauceDemoBasePage } from "./SauceDemoBasePage";

/**
 * Product information interface
 */
export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

/**
 * Sort options
 */
export type SortOption = "az" | "za" | "lohi" | "hilo";

/**
 * SauceDemo Inventory Page Object
 * Simulates product catalog / inventory management
 */
export class SauceDemoInventoryPage extends SauceDemoBasePage {
  // Container
  readonly inventoryContainer: Locator;

  // Product elements
  readonly productItems: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly productDescriptions: Locator;
  readonly productImages: Locator;

  // Sorting
  readonly sortDropdown: Locator;

  // Filter/header
  readonly headerTitle: Locator;
  readonly productsCount: Locator;

  constructor(page: Page) {
    super(page);

    // Container
    this.inventoryContainer = page.locator("#inventory_container");

    // Products
    this.productItems = page.locator(".inventory_item");
    this.productNames = page.locator(".inventory_item_name");
    this.productPrices = page.locator(".inventory_item_price");
    this.productDescriptions = page.locator(".inventory_item_desc");
    this.productImages = page.locator(".inventory_item_img img");

    // Sorting
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');

    // Header
    this.headerTitle = page.locator(".title");
    this.productsCount = page.locator(
      ".products_label, .header_secondary_container",
    );
  }

  /**
   * Navigate to inventory page
   */
  async navigateToInventory(): Promise<void> {
    await this.navigate(`${this.baseUrl}/inventory.html`);
    await this.inventoryContainer.waitFor({ state: "visible" });
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<ProductInfo[]> {
    const products: ProductInfo[] = [];
    const count = await this.productItems.count();

    for (let i = 0; i < count; i++) {
      const item = this.productItems.nth(i);
      const product = await this.parseProductItem(item);
      products.push(product);
    }

    return products;
  }

  /**
   * Parse a product item element
   */
  private async parseProductItem(item: Locator): Promise<ProductInfo> {
    const nameElement = item.locator(".inventory_item_name");
    const name = (await nameElement.textContent())?.trim() || "";

    const descElement = item.locator(".inventory_item_desc");
    const description = (await descElement.textContent())?.trim() || "";

    const priceElement = item.locator(".inventory_item_price");
    const priceText = (await priceElement.textContent())?.trim() || "0";
    const price = parseFloat(priceText.replace("$", ""));

    const imgElement = item.locator(".inventory_item_img img");
    const imageUrl = (await imgElement.getAttribute("src")) || "";

    // Extract ID from the data-test attribute or link
    const link = item.locator("a").first();
    const href = (await link.getAttribute("href")) || "";
    const id = href.split("id=").pop() || "";

    return { id, name, description, price, imageUrl };
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    return await this.productItems.count();
  }

  /**
   * Get product by name
   */
  getProductByName(name: string): Locator {
    return this.productItems.filter({
      has: this.page.locator(`.inventory_item_name:text("${name}")`),
    });
  }

  /**
   * Get product by index
   */
  getProductByIndex(index: number): Locator {
    return this.productItems.nth(index);
  }

  /**
   * Add product to cart by name
   */
  async addToCart(productName: string): Promise<void> {
    const product = this.getProductByName(productName);
    const addButton = product.locator('button:has-text("Add to cart")');
    await this.click(addButton);
  }

  /**
   * Remove product from cart by name
   */
  async removeFromCart(productName: string): Promise<void> {
    const product = this.getProductByName(productName);
    const removeButton = product.locator('button:has-text("Remove")');
    await this.click(removeButton);
  }

  /**
   * Add product to cart by index
   */
  async addToCartByIndex(index: number): Promise<void> {
    const product = this.getProductByIndex(index);
    const addButton = product.locator('button:has-text("Add to cart")');
    await this.click(addButton);
  }

  /**
   * Add multiple products to cart
   */
  async addMultipleToCart(productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addToCart(name);
    }
  }

  /**
   * Add first N products to cart
   */
  async addFirstNToCart(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.addToCartByIndex(i);
    }
  }

  /**
   * Sort products
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.selectOption(this.sortDropdown, option);
    // Wait for sort to apply
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current sort order
   */
  async getCurrentSort(): Promise<string> {
    return await this.sortDropdown.inputValue();
  }

  /**
   * Click on product to view details
   */
  async viewProduct(productName: string): Promise<void> {
    const nameLink = this.page.locator(
      `.inventory_item_name:text("${productName}")`,
    );
    await this.click(nameLink);
  }

  /**
   * Verify on inventory page
   */
  async verifyOnInventoryPage(): Promise<void> {
    await expect(this.inventoryContainer).toBeVisible();
    await expect(this.headerTitle).toContainText("Products");
  }

  /**
   * Get all product names
   */
  async getProductNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.productNames.count();

    for (let i = 0; i < count; i++) {
      const name = (await this.productNames.nth(i).textContent())?.trim() || "";
      names.push(name);
    }

    return names;
  }

  /**
   * Get all product prices
   */
  async getProductPrices(): Promise<number[]> {
    const prices: number[] = [];
    const count = await this.productPrices.count();

    for (let i = 0; i < count; i++) {
      const priceText =
        (await this.productPrices.nth(i).textContent())?.trim() || "0";
      prices.push(parseFloat(priceText.replace("$", "")));
    }

    return prices;
  }

  /**
   * Verify products are sorted by price ascending
   */
  async verifySortedByPriceAsc(): Promise<void> {
    const prices = await this.getProductPrices();
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  }

  /**
   * Verify products are sorted by price descending
   */
  async verifySortedByPriceDesc(): Promise<void> {
    const prices = await this.getProductPrices();
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  }

  /**
   * Get cheapest product
   */
  async getCheapestProduct(): Promise<ProductInfo> {
    const products = await this.getAllProducts();
    return products.reduce((min, p) => (p.price < min.price ? p : min));
  }

  /**
   * Get most expensive product
   */
  async getMostExpensiveProduct(): Promise<ProductInfo> {
    const products = await this.getAllProducts();
    return products.reduce((max, p) => (p.price > max.price ? p : max));
  }
}
