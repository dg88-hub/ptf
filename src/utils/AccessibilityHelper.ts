/**
 * @fileoverview Accessibility (a11y) testing utilities using axe-core.
 * Provides automated accessibility testing capabilities for UI tests.
 *
 * @module utils/AccessibilityHelper
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Accessibility testing ensures your application is usable by people with
 * disabilities. The axe-core library tests against WCAG (Web Content
 * Accessibility Guidelines) standards.
 *
 * Common accessibility issues:
 * - Missing alt text on images
 * - Poor color contrast
 * - Missing form labels
 * - Keyboard navigation issues
 *
 * @example
 * ```typescript
 * import { checkAccessibility, AccessibilityHelper } from '../utils/AccessibilityHelper';
 *
 * test('page should be accessible @a11y', async ({ page }) => {
 *   await page.goto('/dashboard');
 *   await checkAccessibility(page);
 * });
 * ```
 */

import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';
import { logger } from './Logger';

/**
 * Accessibility violation severity levels
 */
export type ViolationImpact = 'minor' | 'moderate' | 'serious' | 'critical';

/**
 * Accessibility check options
 */
export interface A11yCheckOptions {
  /** Include specific tags (e.g., 'wcag2a', 'wcag2aa', 'wcag21aa') */
  includeTags?: string[];
  /** Exclude specific tags */
  excludeTags?: string[];
  /** CSS selectors to exclude from testing */
  excludeSelectors?: string[];
  /** Minimum impact level to report ('minor', 'moderate', 'serious', 'critical') */
  minImpact?: ViolationImpact;
  /** Whether to throw on violations (default: true) */
  throwOnViolations?: boolean;
}

/**
 * Accessibility violation result
 */
export interface A11yViolation {
  id: string;
  impact: ViolationImpact;
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

/**
 * Accessibility Helper class for running a11y tests
 *
 * @example
 * ```typescript
 * const a11y = new AccessibilityHelper(page);
 *
 * // Run accessibility check
 * const results = await a11y.check();
 *
 * // Run with specific WCAG level
 * await a11y.checkWCAG21AA();
 *
 * // Check specific element
 * await a11y.checkElement('#main-content');
 * ```
 */
export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Run accessibility check on the current page
   * @param options - Check options
   * @returns Array of violations
   *
   * @example
   * ```typescript
   * const violations = await a11y.check();
   * expect(violations).toHaveLength(0);
   * ```
   */
  async check(options: A11yCheckOptions = {}): Promise<A11yViolation[]> {
    logger.info('[A11y] Running accessibility check');

    let axeBuilder = new AxeBuilder({ page: this.page });

    // Apply tag filters
    if (options.includeTags?.length) {
      axeBuilder = axeBuilder.withTags(options.includeTags);
    }

    // Exclude selectors
    if (options.excludeSelectors?.length) {
      axeBuilder = axeBuilder.exclude(options.excludeSelectors);
    }

    const results = await axeBuilder.analyze();

    // Filter by minimum impact level
    let violations = results.violations;
    if (options.minImpact) {
      const impactOrder: ViolationImpact[] = ['minor', 'moderate', 'serious', 'critical'];
      const minIndex = impactOrder.indexOf(options.minImpact);
      violations = violations.filter((v) => {
        const vIndex = impactOrder.indexOf(v.impact as ViolationImpact);
        return vIndex >= minIndex;
      });
    }

    // Map to simplified format
    const mappedViolations: A11yViolation[] = violations.map((v) => ({
      id: v.id,
      impact: v.impact as ViolationImpact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));

    if (mappedViolations.length > 0) {
      logger.warn(`[A11y] Found ${mappedViolations.length} accessibility violations`);
      mappedViolations.forEach((v) => {
        logger.warn(`  - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes} elements)`);
      });
    } else {
      logger.info('[A11y] No accessibility violations found');
    }

    // Throw if requested
    if (options.throwOnViolations !== false && mappedViolations.length > 0) {
      const summary = mappedViolations.map((v) => `${v.id}: ${v.help}`).join('\n');
      throw new Error(`Accessibility violations found:\n${summary}`);
    }

    return mappedViolations;
  }

  /**
   * Check accessibility against WCAG 2.1 Level AA
   * This is the most common compliance level
   */
  async checkWCAG21AA(): Promise<A11yViolation[]> {
    return this.check({
      includeTags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    });
  }

  /**
   * Check accessibility against WCAG 2.1 Level AAA (strictest)
   */
  async checkWCAG21AAA(): Promise<A11yViolation[]> {
    return this.check({
      includeTags: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'],
    });
  }

  /**
   * Check accessibility of a specific element
   * @param selector - CSS selector of element to check
   */
  async checkElement(selector: string): Promise<A11yViolation[]> {
    logger.info(`[A11y] Checking element: ${selector}`);

    const results = await new AxeBuilder({ page: this.page }).include(selector).analyze();

    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact as ViolationImpact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));
  }

  /**
   * Get accessibility score as percentage
   * @returns Score between 0-100
   */
  async getScore(): Promise<number> {
    const results = await new AxeBuilder({ page: this.page }).analyze();

    const totalRules = results.passes.length + results.violations.length;
    if (totalRules === 0) return 100;

    return Math.round((results.passes.length / totalRules) * 100);
  }
}

/**
 * Quick accessibility check function
 * @param page - Playwright Page instance
 * @param options - Check options
 *
 * @example
 * ```typescript
 * test('homepage accessibility @a11y', async ({ page }) => {
 *   await page.goto('/');
 *   await checkAccessibility(page);
 * });
 * ```
 */
export async function checkAccessibility(
  page: Page,
  options: A11yCheckOptions = {}
): Promise<void> {
  const helper = new AccessibilityHelper(page);
  await helper.check(options);
}

/**
 * Expect no accessibility violations (for use with Playwright expect)
 * @param page - Playwright Page instance
 *
 * @example
 * ```typescript
 * await expectNoA11yViolations(page);
 * ```
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const helper = new AccessibilityHelper(page);
  const violations = await helper.check({ throwOnViolations: false });

  expect(
    violations,
    `Expected no accessibility violations but found ${violations.length}`
  ).toHaveLength(0);
}

export default AccessibilityHelper;
