/**
 * @fileoverview Tablet emulation tests for responsive UI validation.
 * @module tests/mobile/tablet.mobile.spec
 *
 * Separate file for tablet tests since test.use() must be at file level
 */

import { devices, expect, test } from "@playwright/test";

// iPad Pro 11 configuration
test.use({ ...devices["iPad Pro 11"] });

test.describe("Tablet Tests @mobile @tablet", () => {
  test("should display tablet layout @mobile @sanity", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com");
    await expect(page.locator("h1.heading")).toBeVisible();
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(700);
  });
});
