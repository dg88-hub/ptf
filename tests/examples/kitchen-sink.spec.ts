import { config as frameworkConfig } from '../../src/config';
import { testContext } from '../../src/core/TestContext';
import { expect, test } from '../../src/core/fixtures'; // Use custom fixtures
import { TimeUtils } from '../../src/utils/TimeUtils';

// ... (omitted comments)

test.describe('Reference Suite: Kitchen Sink', () => {
  // ... (omitted setup)

  test('demonstrate all framework features', async ({ app, page }) => {
    // ---------------------------------------------------------
    // 1. configuration Access
    // ---------------------------------------------------------
    console.log(
      `Testing against env: ${JSON.stringify(frameworkConfig.credentials.sauce.username)}`
    );

    // ---------------------------------------------------------
    // 2. Facade Pattern (Page Objects)
    // Access pages through the 'app' fixture, not new Page()
    // ---------------------------------------------------------
    await test.step('Login to Application', async () => {
      await app.sauce.loginPage.navigateToLogin();
      await app.sauce.loginPage.login({
        username: frameworkConfig.credentials.sauce.username,
        password: frameworkConfig.credentials.sauce.password,
      });
    });

    // ---------------------------------------------------------
    // 3. Interactions & Locators
    // ---------------------------------------------------------
    await test.step('Verify Inventory Load', async () => {
      // Standard Playwright assertions
      await expect(page).toHaveURL(/.*inventory.html/);
    });

    // ---------------------------------------------------------
    // 4. Test Context (Data Sharing)
    // Capture data in one step, use it in another
    // ---------------------------------------------------------
    await test.step('Capture State', async () => {
      // Imagine we grabbed this ID from the UI
      const generatedOrderId = 'ORD-999-888';

      // Store it safely
      testContext.set('currentOrder.id', generatedOrderId);
      console.log(`Captured Order ID: ${generatedOrderId}`);
    });

    await test.step('Use Captured State', async () => {
      // Retrieve it (type-safe)
      const orderId = testContext.get<string>('currentOrder.id');
      expect(orderId).toBe('ORD-999-888');

      // Use utility to generate a future follow-up date
      const followUpDate = TimeUtils.getFutureDate(7);
      console.log(`Scheduled follow-up for Order ${orderId} on ${followUpDate}`);
    });
  });
});
