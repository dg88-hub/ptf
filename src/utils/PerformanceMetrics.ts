/**
 * @fileoverview Performance Metrics collector for web vitals and timing.
 * Captures Core Web Vitals (LCP, FID, CLS) and custom performance metrics.
 *
 * @module utils/PerformanceMetrics
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Core Web Vitals are Google's metrics for user experience:
 * - LCP (Largest Contentful Paint): Loading performance (< 2.5s good)
 * - FID (First Input Delay): Interactivity (< 100ms good)
 * - CLS (Cumulative Layout Shift): Visual stability (< 0.1 good)
 *
 * Collecting these during automated tests helps track performance regressions.
 *
 * @example
 * ```typescript
 * import { PerformanceMetrics } from '../utils/PerformanceMetrics';
 *
 * test('homepage performance', async ({ page }) => {
 *   const metrics = new PerformanceMetrics(page);
 *   await page.goto('/');
 *
 *   const webVitals = await metrics.getWebVitals();
 *   expect(webVitals.lcp).toBeLessThan(2500);
 * });
 * ```
 */

import { Page } from '@playwright/test';
import { logger } from './Logger';

/**
 * Web Vitals metrics interface
 */
export interface WebVitals {
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** First Input Delay (ms) */
  fid: number | null;
  /** Cumulative Layout Shift (score) */
  cls: number | null;
  /** First Contentful Paint (ms) */
  fcp: number | null;
  /** Time to First Byte (ms) */
  ttfb: number | null;
}

/**
 * Navigation timing metrics
 */
export interface NavigationTiming {
  /** DNS lookup time (ms) */
  dnsLookup: number;
  /** TCP connection time (ms) */
  tcpConnect: number;
  /** Time to First Byte (ms) */
  ttfb: number;
  /** DOM Content Loaded (ms) */
  domContentLoaded: number;
  /** Page Load Complete (ms) */
  loadComplete: number;
  /** DOM Interactive (ms) */
  domInteractive: number;
}

/**
 * Resource timing entry
 */
export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
}

/**
 * Performance Metrics collector class
 *
 * @example
 * ```typescript
 * const perf = new PerformanceMetrics(page);
 *
 * // Get all metrics
 * const webVitals = await perf.getWebVitals();
 * const timing = await perf.getNavigationTiming();
 * const resources = await perf.getResourceTimings();
 *
 * // Assert performance thresholds
 * await perf.assertLCP(2500);
 * await perf.assertCLS(0.1);
 * ```
 */
export class PerformanceMetrics {
  constructor(private page: Page) {}

  /**
   * Get Core Web Vitals metrics
   * @returns Web Vitals metrics object
   *
   * @example
   * ```typescript
   * const vitals = await metrics.getWebVitals();
   * console.log('LCP:', vitals.lcp, 'ms');
   * console.log('CLS:', vitals.cls);
   * ```
   */
  async getWebVitals(): Promise<WebVitals> {
    logger.info('[Performance] Collecting Web Vitals');

    const vitals = await this.page.evaluate((): WebVitals => {
      const getMetric = (name: string): number | null => {
        const entries = performance.getEntriesByType('paint');
        const entry = entries.find((e) => e.name === name);
        return entry ? entry.startTime : null;
      };

      // Get LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp =
        lcpEntries.length > 0
          ? (lcpEntries[lcpEntries.length - 1] as PerformanceEntry).startTime
          : null;

      // Get CLS
      let cls = 0;
      const layoutShiftEntries = performance.getEntriesByType('layout-shift');
      layoutShiftEntries.forEach((entry: PerformanceEntry) => {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          cls += (entry as PerformanceEntry & { value: number }).value || 0;
        }
      });

      // Get FID (requires user interaction, may be null)
      const fidEntries = performance.getEntriesByType('first-input');
      const fid =
        fidEntries.length > 0
          ? (fidEntries[0] as PerformanceEntry & { processingStart: number }).processingStart -
            fidEntries[0].startTime
          : null;

      return {
        lcp,
        fid,
        cls: cls || null,
        fcp: getMetric('first-contentful-paint'),
        ttfb: performance.timing
          ? performance.timing.responseStart - performance.timing.requestStart
          : null,
      };
    });

    logger.debug('[Performance] Web Vitals collected', vitals);
    return vitals;
  }

  /**
   * Get detailed navigation timing metrics
   * @returns Navigation timing object
   */
  async getNavigationTiming(): Promise<NavigationTiming> {
    logger.info('[Performance] Collecting navigation timing');

    const timing = await this.page.evaluate((): NavigationTiming => {
      const nav = performance.timing;
      return {
        dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
        tcpConnect: nav.connectEnd - nav.connectStart,
        ttfb: nav.responseStart - nav.requestStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
        loadComplete: nav.loadEventEnd - nav.navigationStart,
        domInteractive: nav.domInteractive - nav.navigationStart,
      };
    });

    logger.debug('[Performance] Navigation timing collected', timing);
    return timing;
  }

  /**
   * Get resource timing entries (scripts, styles, images, etc.)
   * @param limit - Maximum number of entries to return
   * @returns Array of resource timing entries
   */
  async getResourceTimings(limit: number = 50): Promise<ResourceTiming[]> {
    const resources = await this.page.evaluate((maxEntries) => {
      return performance
        .getEntriesByType('resource')
        .slice(0, maxEntries)
        .map((entry: PerformanceEntry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          return {
            name: entry.name,
            type: resourceEntry.initiatorType,
            duration: entry.duration,
            size: resourceEntry.transferSize || 0,
          };
        });
    }, limit);

    return resources;
  }

  /**
   * Get total page weight (size of all resources)
   * @returns Total size in bytes
   */
  async getPageWeight(): Promise<number> {
    const resources = await this.getResourceTimings(500);
    return resources.reduce((total, r) => total + r.size, 0);
  }

  /**
   * Get slowest resources
   * @param count - Number of slow resources to return
   * @returns Array of slowest resources
   */
  async getSlowestResources(count: number = 10): Promise<ResourceTiming[]> {
    const resources = await this.getResourceTimings(500);
    return resources.sort((a, b) => b.duration - a.duration).slice(0, count);
  }

  /**
   * Assert LCP is below threshold
   * @param maxMs - Maximum LCP in milliseconds (default: 2500)
   * @throws Error if LCP exceeds threshold
   */
  async assertLCP(maxMs: number = 2500): Promise<void> {
    const vitals = await this.getWebVitals();
    if (vitals.lcp !== null && vitals.lcp > maxMs) {
      throw new Error(`LCP ${vitals.lcp}ms exceeds threshold ${maxMs}ms`);
    }
    logger.info(`[Performance] LCP ${vitals.lcp}ms is within threshold ${maxMs}ms`);
  }

  /**
   * Assert CLS is below threshold
   * @param maxScore - Maximum CLS score (default: 0.1)
   * @throws Error if CLS exceeds threshold
   */
  async assertCLS(maxScore: number = 0.1): Promise<void> {
    const vitals = await this.getWebVitals();
    if (vitals.cls !== null && vitals.cls > maxScore) {
      throw new Error(`CLS ${vitals.cls} exceeds threshold ${maxScore}`);
    }
    logger.info(`[Performance] CLS ${vitals.cls} is within threshold ${maxScore}`);
  }

  /**
   * Assert page load time is below threshold
   * @param maxMs - Maximum load time in milliseconds
   * @throws Error if load time exceeds threshold
   */
  async assertLoadTime(maxMs: number = 3000): Promise<void> {
    const timing = await this.getNavigationTiming();
    if (timing.loadComplete > maxMs) {
      throw new Error(`Load time ${timing.loadComplete}ms exceeds threshold ${maxMs}ms`);
    }
    logger.info(`[Performance] Load time ${timing.loadComplete}ms is within threshold ${maxMs}ms`);
  }

  /**
   * Generate performance report
   * @returns Formatted performance report string
   */
  async generateReport(): Promise<string> {
    const vitals = await this.getWebVitals();
    const timing = await this.getNavigationTiming();
    const weight = await this.getPageWeight();
    const slowest = await this.getSlowestResources(5);

    const report = `
Performance Report
==================
URL: ${this.page.url()}

Core Web Vitals:
  LCP: ${vitals.lcp?.toFixed(0) || 'N/A'} ms ${vitals.lcp && vitals.lcp <= 2500 ? '✓' : '✗'}
  FID: ${vitals.fid?.toFixed(0) || 'N/A'} ms ${vitals.fid && vitals.fid <= 100 ? '✓' : '✗'}
  CLS: ${vitals.cls?.toFixed(3) || 'N/A'} ${vitals.cls && vitals.cls <= 0.1 ? '✓' : '✗'}
  FCP: ${vitals.fcp?.toFixed(0) || 'N/A'} ms
  TTFB: ${vitals.ttfb?.toFixed(0) || 'N/A'} ms

Navigation Timing:
  DNS Lookup: ${timing.dnsLookup} ms
  TCP Connect: ${timing.tcpConnect} ms
  TTFB: ${timing.ttfb} ms
  DOM Interactive: ${timing.domInteractive} ms
  DOM Content Loaded: ${timing.domContentLoaded} ms
  Full Load: ${timing.loadComplete} ms

Page Weight: ${(weight / 1024).toFixed(1)} KB

Slowest Resources:
${slowest.map((r) => `  - ${r.name.substring(0, 50)}: ${r.duration.toFixed(0)}ms`).join('\n')}
`;

    logger.info(report);
    return report;
  }
}

/**
 * Quick function to collect and log performance metrics
 * @param page - Playwright Page instance
 */
export async function collectPerformanceMetrics(page: Page): Promise<WebVitals> {
  const metrics = new PerformanceMetrics(page);
  return metrics.getWebVitals();
}

export default PerformanceMetrics;
