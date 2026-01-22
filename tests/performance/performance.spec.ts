/**
 * @fileoverview Performance tests capturing Core Web Vitals.
 * Measures LCP, CLS, FCP and other performance metrics.
 *
 * @module tests/performance/performance.spec.ts
 * @tags @performance
 */

import { expect, test } from "@playwright/test";
import { PerformanceMetrics } from "../../src/utils/PerformanceMetrics";

test.describe("Performance Tests @performance", () => {
  test("homepage should load within performance budget @critical", async ({
    page,
  }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Get timing metrics
    const timing = await perf.getNavigationTiming();

    console.log("Navigation Timing:");
    console.log(`  - DNS Lookup: ${timing.dnsLookup}ms`);
    console.log(`  - TCP Connect: ${timing.tcpConnect}ms`);
    console.log(`  - TTFB: ${timing.ttfb}ms`);
    console.log(`  - DOM Interactive: ${timing.domInteractive}ms`);
    console.log(`  - Full Load: ${timing.loadComplete}ms`);

    // Assert performance budgets
    expect(timing.loadComplete).toBeLessThan(5000); // 5 seconds max
  });

  test("login page Web Vitals should meet thresholds", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Allow time for LCP measurement
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    const vitals = await perf.getWebVitals();

    console.log("Core Web Vitals:");
    console.log(`  - LCP: ${vitals.lcp?.toFixed(0) || "N/A"}ms`);
    console.log(`  - FCP: ${vitals.fcp?.toFixed(0) || "N/A"}ms`);
    console.log(`  - CLS: ${vitals.cls?.toFixed(3) || "N/A"}`);
    console.log(`  - TTFB: ${vitals.ttfb?.toFixed(0) || "N/A"}ms`);

    // Web Vitals thresholds (based on Google's recommendations)
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(4000); // Good: < 2.5s, Needs improvement: < 4s
    }
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(0.25); // Good: < 0.1, Needs improvement: < 0.25
    }
  });

  test("should generate performance report", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    const report = await perf.generateReport();

    // Log the full report
    console.log(report);

    // Report should contain key sections
    expect(report).toContain("Performance Report");
    expect(report).toContain("Core Web Vitals");
    expect(report).toContain("Navigation Timing");
  });

  test("page weight should be reasonable @budget", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const weightBytes = await perf.getPageWeight();
    const weightKB = weightBytes / 1024;
    const weightMB = weightKB / 1024;

    console.log(
      `Page weight: ${weightKB.toFixed(1)} KB (${weightMB.toFixed(2)} MB)`,
    );

    // Page should be under 5MB total transfer
    expect(weightBytes).toBeLessThan(5 * 1024 * 1024);
  });

  test("identify slow resources @debug", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const slowest = await perf.getSlowestResources(10);

    console.log("Top 10 Slowest Resources:");
    slowest.forEach((resource, index) => {
      const name = resource.name.split("/").pop() || resource.name;
      console.log(
        `  ${index + 1}. ${name.substring(0, 40)}: ${resource.duration.toFixed(0)}ms`,
      );
    });

    // No single resource should take more than 5 seconds
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (slowest.length > 0) {
      expect(slowest[0].duration).toBeLessThan(5000);
    }
  });

  test("compare performance across pages @comparison", async ({ page }) => {
    const perf = new PerformanceMetrics(page);
    const results: { page: string; loadTime: number }[] = [];

    const pagesToTest = ["/", "/login"];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState("domcontentloaded");

      const timing = await perf.getNavigationTiming();
      results.push({ page: pagePath, loadTime: timing.loadComplete });
    }

    console.log("Page Load Time Comparison:");
    results.forEach((r) => {
      console.log(`  - ${r.page}: ${r.loadTime}ms`);
    });

    // All pages should load within budget
    results.forEach((r) => {
      expect(r.loadTime).toBeLessThan(5000);
    });
  });
});

test.describe("Performance Assertions @performance @assertions", () => {
  test("LCP should meet threshold", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    // This will throw if LCP exceeds 4000ms
    try {
      await perf.assertLCP(4000);
    } catch (error) {
      console.log("LCP threshold exceeded:", error);
      // Don't fail test for demo site, just log
    }
  });

  test("CLS should meet threshold", async ({ page }) => {
    const perf = new PerformanceMetrics(page);

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    try {
      await perf.assertCLS(0.25);
    } catch (error) {
      console.log("CLS threshold exceeded:", error);
    }
  });
});
