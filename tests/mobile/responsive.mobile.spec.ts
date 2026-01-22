/**
 * @fileoverview Mobile emulation tests for responsive UI validation.
 * @module tests/mobile/responsive.mobile.spec
 *
 * NOTE: test.use() must be called at the file level, not inside describe blocks.
 */

import { devices, expect, test } from "@playwright/test";

// iPhone 13 configuration - must be at file level
test.use({ ...devices["iPhone 13"] });

test.describe("Mobile Responsive Tests @mobile", () => {
  test("should display mobile layout on iPhone @mobile @smoke", async ({
    page,
  }) => {
    await page.goto("https://the-internet.herokuapp.com");
    await expect(page.locator("h1.heading")).toBeVisible();
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(500);
  });

  test("should navigate on mobile device @mobile @sanity", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com/login");
    await page.locator("#username").fill("tomsmith");
    await page.locator("#password").fill("SuperSecretPassword!");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/.*secure.*/);
  });
});
