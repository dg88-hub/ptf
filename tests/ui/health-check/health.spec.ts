/**
 * @fileoverview Health check tests for application availability.
 * @module tests/ui/health-check/health.spec
 */

import { expect, test } from '@playwright/test';

test.describe('Health Check Tests @health', () => {
  test('should verify application is accessible @health @critical', async ({ page }) => {
    const response = await page.goto('https://the-internet.herokuapp.com');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1.heading')).toBeVisible();
  });

  test('should verify login page loads @health', async ({ page }) => {
    const response = await page.goto('https://the-internet.herokuapp.com/login');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should verify API endpoint is responding @health @api', async ({ request }) => {
    // Using jsonplaceholder as reqres.in often blocks automated requests (403 Cloudflare)
    const response = await request.get('https://jsonplaceholder.typicode.com/todos/1');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(1);
  });
});
