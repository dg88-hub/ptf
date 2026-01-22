# Guide: Adding a New Page Object

> **Summary**: How to add a new page to the framework in 3 simple steps.

---

## Step 1: Create the Page Object

Create a new file in `src/pages/<appName>/` extending the appropriate base class.

```typescript
// src/pages/saucedemo/SauceDemoInventoryPage.ts

import { Locator, Page } from '@playwright/test';
import { SauceDemoBasePage } from './SauceDemoBasePage';

/**
 * Inventory page for browsing products.
 */
export class SauceDemoInventoryPage extends SauceDemoBasePage {
  // ============================================
  // Locators
  // ============================================
  readonly inventoryContainer: Locator;
  readonly productItems: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page, 'SauceDemoInventoryPage');

    this.inventoryContainer = page.locator('.inventory_container');
    this.productItems = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  // ============================================
  // Actions
  // ============================================

  /**
   * Add a product to cart by name.
   * @param productName - Name of the product
   */
  async addToCart(productName: string): Promise<void> {
    const item = this.productItems.filter({ hasText: productName });
    await item.locator('[data-test*="add-to-cart"]').click();
    this.logger.info(`Added "${productName}" to cart`);
  }

  /**
   * Get the cart item count.
   */
  async getCartCount(): Promise<number> {
    if (await this.cartBadge.isVisible()) {
      const text = await this.cartBadge.textContent();
      return parseInt(text || '0', 10);
    }
    return 0;
  }
}
```

---

## Step 2: Register in AppManager

Update `src/pages/AppManager.ts` to expose the new page.

```typescript
// src/pages/AppManager.ts

import { SauceDemoInventoryPage } from './saucedemo/SauceDemoInventoryPage';

export class SauceApp {
  public loginPage: SauceDemoLoginPage;
  public inventoryPage: SauceDemoInventoryPage; // 👈 Add here

  constructor(page: Page) {
    this.loginPage = new SauceDemoLoginPage(page);
    this.inventoryPage = new SauceDemoInventoryPage(page); // 👈 Initialize
  }
}
```

---

## Step 3: Add to Barrel Export (Optional)

For external consumers, add to `src/pages/index.ts`:

```typescript
// src/pages/index.ts

export { SauceDemoInventoryPage } from './saucedemo/SauceDemoInventoryPage';
```

---

## Step 4: Use in Tests

Access the new page through the `app` fixture:

```typescript
// tests/ui/smoke/inventory.smoke.spec.ts

import { test, expect } from '../../../src/core/fixtures';

test.describe('Inventory @smoke', () => {
  test('should add product to cart', async ({ app }) => {
    // Login first
    await app.sauce.loginPage.navigateToLogin();
    await app.sauce.loginPage.login({
      username: 'standard_user',
      password: 'secret_sauce',
    });

    // Use the new inventory page
    await app.sauce.inventoryPage.addToCart('Sauce Labs Backpack');

    const count = await app.sauce.inventoryPage.getCartCount();
    expect(count).toBe(1);
  });
});
```

---

## Checklist

- [ ] Page extends appropriate base class (`SauceDemoBasePage`, `ParaBankBasePage`, etc.)
- [ ] Constructor calls `super(page, 'PageName')` for logging
- [ ] Locators are `readonly` properties
- [ ] Methods have JSDoc comments
- [ ] Page is registered in `AppManager`
- [ ] Page is added to barrel export (if needed externally)

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) - Design patterns
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - Coding standards
