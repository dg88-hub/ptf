# Real-World Test Examples

> Production-ready test scenarios demonstrating framework capabilities

---

## Example 1: E-Commerce Checkout Flow

### Scenario

Test complete purchase flow from product selection to order confirmation.

### Implementation

```typescript
// tests/e2e/checkout-flow.spec.ts
import { test, expect } from '@core/fixtures';
import { DataGenerator } from '@utils';

test.describe('E-Commerce Checkout Flow', () => {
  test('complete purchase as guest user', async ({ app, page }) => {
    // 1. Browse and add product to cart
    await app.products.open();
    await app.products.selectProduct('Laptop');
    await app.products.addToCart();

    // 2. Proceed to checkout
    await app.cart.open();
    await expect(app.cart.cartTotal).toBeVisible();
    await app.cart.proceedToCheckout();

    // 3. Fill shipping information
    const customer = {
      firstName: DataGenerator.generateFirstName(),
      lastName: DataGenerator.generateLastName(),
      email: DataGenerator.generateEmail(),
      phone: DataGenerator.generatePhoneNumber(),
      address: DataGenerator.generateAddress(),
    };

    await app.checkout.fillShippingInfo(customer);
    await app.checkout.selectShippingMethod('standard');

    // 4. Payment
    await app.payment.fillCreditCard({
      number: '4111111111111111',
      cvv: '123',
      expiry: '12/25',
    });

    // 5. Place order
    await app.checkout.placeOrder();

    // 6. Verify confirmation
    await expect(app.orderConfirmation.thankYouMessage).toBeVisible();
    const orderNumber = await app.orderConfirmation.getOrderNumber();
    expect(orderNumber).toMatch(/ORD-\d{6}/);

    // 7. Take screenshot of confirmation
    await page.screenshot({ path: `order-${orderNumber}.png` });
  });
});
```

---

## Example 2: API + UI Integration Test

### Scenario

Create data via API, verify in UI, then clean up.

### Implementation

```typescript
// tests/integration/api-ui-sync.spec.ts
import { test, expect } from '@core/fixtures';
import { ApiClient } from '@utils';

test.describe('API and UI Integration', () => {
  let apiClient: ApiClient;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    apiClient = new ApiClient(request, 'https://api.example.com');
  });

  test('create user via API and verify in UI', async ({ app, request }) => {
    // Create user via API
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
    };

    const response = await apiClient.post<{ id: string }>('/users', {
      data: userData,
    });

    userId = response.data.id;
    expect(response.status).toBe(201);

    // Verify in UI
    await app.admin.users.open();
    await app.admin.users.search(userData.email);

    const userRow = app.admin.users.getUserRow(userId);
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText(userData.name);
    await expect(userRow).toContainText('admin');
  });

  test.afterAll(async () => {
    // Cleanup
    if (userId) {
      await apiClient.delete(`/users/${userId}`);
    }
  });
});
```

---

## Example 3: Visual Regression Testing

### Scenario

Detect unintended UI changes across environments.

### Implementation

```typescript
// tests/visual/homepage.visual.spec.ts
import { test, expect } from '@core/fixtures';

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ app }) => {
    await app.home.open();
  });

  test('desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });

  test('tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('dark mode', async ({ page, app }) => {
    await app.settings.toggleDarkMode();
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

---

## Example 4: File Upload/Download

### Scenario

Test file operations with validation.

### Implementation

```typescript
// tests/features/file-operations.spec.ts
import { test, expect } from '@core/fixtures';
import { FileHandler } from '@utils';

test.describe('File Operations', () => {
  test('upload and download report', async ({ page }) => {
    const fileHandler = new FileHandler(page);

    // Upload
    await page.goto('/upload');
    await fileHandler.uploadFile({
      selector: 'input[type="file"]',
      filePath: './test-data/sample-report.xlsx',
      maxSizeInMB: 10,
      allowedExtensions: ['.xlsx', '.xls'],
    });

    await expect(page.locator('.upload-success')).toBeVisible();

    // Process and download
    await page.click('button:has-text("Process")');

    const download = await fileHandler.downloadFile({
      trigger: 'button:has-text("Download")',
      expectedFileName: /processed-report.*\.xlsx$/,
      savePath: './downloads',
    });

    // Validate downloaded file
    const downloadPath = await download.path();
    const stats = await fileHandler.compareFiles('./test-data/expected-output.xlsx', downloadPath!);

    expect(stats.areIdentical).toBeTruthy();
  });
});
```

---

## Example 5: Multi-Tab Testing

### Scenario

Handle multiple browser tabs/windows.

### Implementation

```typescript
// tests/advanced/multi-tab.spec.ts
import { test, expect } from '@core/fixtures';

test('verify data sync across tabs', async ({ page, context }) => {
  // Open second tab
  const secondPage = await context.newPage();

  // Action in tab 1
  await page.goto('/dashboard');
  await page.click('button:has-text("Create Item")');
  await page.fill('#item-name', 'Test Item');
  await page.click('button:has-text("Save")');

  // Verify in tab 2
  await secondPage.goto('/dashboard');
  await secondPage.reload();

  await expect(secondPage.locator('text=Test Item')).toBeVisible();

  await secondPage.close();
});
```

---

## Example 6: Authentication State Management

### Scenario

Test different user roles without re-authenticating.

### Implementation

```typescript
// tests/auth/role-based-access.spec.ts
import { test as base, expect } from '@playwright/test';

const test = base.extend({
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'storage-states/admin.json',
    });
    await use(context);
    await context.close();
  },

  userContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'storage-states/user.json',
    });
    await use(context);
    await context.close();
  },
});

test('admin can access admin panel', async ({ adminContext }) => {
  const page = await adminContext.newPage();
  await page.goto('/admin');
  await expect(page.locator('h1')).toHaveText('Admin Panel');
});

test('user cannot access admin panel', async ({ userContext }) => {
  const page = await userContext.newPage();
  await page.goto('/admin');
  await expect(page.locator('.access-denied')).toBeVisible();
});
```

---

## Example 7: Database Validation

### Scenario

Verify UI changes are persisted correctly in database.

### Implementation

```typescript
// tests/integration/database-sync.spec.ts
import { test, expect } from '@core/fixtures';
import { DatabaseClient } from '@utils';

test.describe('Database Synchronization', () => {
  let db: DatabaseClient;

  test.beforeAll(async () => {
    db = new DatabaseClient({
      host: process.env.DB_HOST!,
      database: 'test_db',
      username: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
    });
    await db.connect();
  });

  test('user profile update reflects in database', async ({ app }) => {
    const userId = '12345';
    const newName = 'Updated Name';

    // Update via UI
    await app.profile.open(userId);
    await app.profile.updateName(newName);
    await app.profile.save();

    // Verify in database
    const result = await db.queryOne<{ name: string }>('SELECT name FROM users WHERE id = $1', [
      userId,
    ]);

    expect(result.name).toBe(newName);
  });

  test.afterAll(async () => {
    await db.disconnect();
  });
});
```

---

_More examples in `/tests/examples/` directory_
