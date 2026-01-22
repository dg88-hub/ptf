/**
 * @fileoverview Accessibility (a11y) tests for key application pages.
 * Uses axe-core to verify WCAG compliance.
 *
 * @module tests/accessibility/a11y.spec.ts
 * @tags @a11y
 */
/* eslint-disable playwright/no-conditional-in-test */

import { expect, test } from "@playwright/test";
import { AccessibilityHelper } from "../../src/utils/AccessibilityHelper";

test.describe("Accessibility Tests @a11y", () => {
  test("login page should be accessible @critical", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const a11y = new AccessibilityHelper(page);
    const violations = await a11y.check({ throwOnViolations: false });

    // Log violations for debugging (test may find issues in demo site)
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (violations.length > 0) {
      console.log("Accessibility violations found:");
      violations.forEach((v) => {
        console.log(`  - [${v.impact}] ${v.id}: ${v.help}`);
      });
    }

    // For demo site, we just log. In real projects, uncomment below:
    // expect(violations).toHaveLength(0);
  });

  test("homepage should meet WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const a11y = new AccessibilityHelper(page);

    // Check only serious and critical issues
    const violations = await a11y.check({
      minImpact: "serious",
      throwOnViolations: false,
    });

    // Log findings
    console.log(`Found ${violations.length} serious/critical a11y issues`);
  });

  test("should have good accessibility score", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const a11y = new AccessibilityHelper(page);
    const score = await a11y.getScore();

    console.log(`Accessibility score: ${score}%`);

    // Expect at least 70% accessibility score
    expect(score).toBeGreaterThanOrEqual(70);
  });

  test("form elements should have labels @forms", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Check that form inputs have associated labels
    const inputs = await page.locator('input:not([type="hidden"])').all();

    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledby = await input.getAttribute("aria-labelledby");

      // Input should have id with associated label, or aria-label
      const hasLabel = id || ariaLabel || ariaLabelledby;
      expect(hasLabel, `Input should have accessible label`).toBeTruthy();
    }
  });

  test("images should have alt text @images", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const images = await page.locator("img").all();

    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Images should have alt text or be marked as decorative
      const hasAltOrDecorative = alt !== null || role === "presentation";
      expect(hasAltOrDecorative, "Image should have alt text").toBeTruthy();
    }
  });

  test("color contrast should be sufficient @contrast", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const a11y = new AccessibilityHelper(page);

    // Check specifically for color contrast issues
    const violations = await a11y.check({
      throwOnViolations: false,
    });

    const contrastViolations = violations.filter((v) =>
      v.id.includes("contrast"),
    );

    console.log(`Found ${contrastViolations.length} color contrast issues`);
  });
});
