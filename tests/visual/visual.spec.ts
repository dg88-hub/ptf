/**
 * @fileoverview Visual regression tests using Playwright's built-in snapshots.
 * Captures and compares screenshots to detect unintended UI changes.
 *
 * @module tests/visual/visual.spec.ts
 * @tags @visual
 *
 * EDUCATIONAL NOTE:
 * ================
 * Visual regression testing catches UI changes that functional tests miss.
 * On first run, Playwright saves baseline screenshots.
 * On subsequent runs, it compares current screenshots to baselines.
 *
 * To update baselines after intentional UI changes:
 * npm run test:visual
 * OR
 * npx playwright test --grep @visual --update-snapshots
 */

import { expect, test } from '@playwright/test';

test.describe('Visual Regression Tests @visual', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip in CI unless baselines exist (to avoid flakiness)
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      process.env.CI === 'true' && browserName !== 'chromium',
      'Visual tests run only on Chromium in CI'
    );

    // Use consistent viewport for snapshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('login page visual appearance', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      // Allow small differences due to rendering variations
      maxDiffPixelRatio: 0.02,
    });
  });

  test('homepage visual appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login form element snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Capture specific element
    const loginForm = page.locator('#login');
    await expect(loginForm).toBeVisible();
    await expect(loginForm).toHaveScreenshot('login-form.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('responsive design - tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('dark mode appearance', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('error state visual', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Trigger error state
    await page.fill('#username', 'invalid');
    await page.fill('#password', 'wrong');
    await page.click('button[type="submit"]');

    // Wait for error message
    // Replaced catch with optional chaining or better selector wait, but keeping strictly robust
    const errorFlash = page.locator('#flash');
    await expect(errorFlash).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveScreenshot('login-error-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Component Visual Tests @visual @components', () => {
  test('button styles', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveScreenshot('submit-button.png');
  });

  test('input field styles', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    const usernameInput = page.locator('#username');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveScreenshot('username-input.png');
  });
});
