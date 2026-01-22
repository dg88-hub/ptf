/**
 * @fileoverview Keyword-driven test execution engine.
 * Provides a flexible keyword-based approach to test automation
 * allowing tests to be defined in JSON format.
 *
 * @module keywords/KeywordEngine
 * @author DG
 * @version 1.0.0
 */

import { Page, expect } from '@playwright/test';
import { logger } from '../utils/Logger';

/**
 * Keyword action definition
 */
export interface KeywordAction {
  /** Action keyword name */
  keyword: string;
  /** Target element selector or URL */
  target?: string;
  /** Value for input actions */
  value?: string;
  /** Expected value for assertions */
  expected?: string;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Keyword test case definition
 */
export interface KeywordTestCase {
  /** Test case name */
  name: string;
  /** Test description */
  description?: string;
  /** Test tags */
  tags?: string[];
  /** Array of actions to execute */
  steps: KeywordAction[];
}

/**
 * Keyword execution result
 */
export interface KeywordResult {
  /** Action executed */
  action: KeywordAction;
  /** Whether action passed */
  passed: boolean;
  /** Error message if failed */
  error?: string;
  /** Execution time in ms */
  duration: number;
}

/**
 * Keyword Engine for executing keyword-driven tests
 *
 * @example
 * ```typescript
 * const engine = new KeywordEngine(page);
 *
 * await engine.execute({
 *   name: 'Login Test',
 *   steps: [
 *     { keyword: 'navigate', target: '/login' },
 *     { keyword: 'type', target: '#username', value: 'user@example.com' },
 *     { keyword: 'type', target: '#password', value: 'password123' },
 *     { keyword: 'click', target: '#login-button' },
 *     { keyword: 'assertUrl', expected: '/dashboard' }
 *   ]
 * });
 * ```
 */
export class KeywordEngine {
  private page: Page;
  private variables: Map<string, unknown> = new Map();

  /**
   * Creates a new KeywordEngine instance
   * @param page - Playwright Page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Execute a keyword test case
   * @param testCase - Test case to execute
   * @returns Array of results for each step
   */
  async execute(testCase: KeywordTestCase): Promise<KeywordResult[]> {
    logger.info(`[KeywordEngine] Executing test: ${testCase.name}`);
    const results: KeywordResult[] = [];

    for (let i = 0; i < testCase.steps.length; i++) {
      const action = testCase.steps[i];
      logger.step(i + 1, `${action.keyword}: ${action.target || action.value || ''}`);

      const startTime = Date.now();
      const result: KeywordResult = {
        action,
        passed: true,
        duration: 0,
      };

      try {
        await this.executeAction(action);
      } catch (error) {
        result.passed = false;
        result.error = (error as Error).message;
        logger.error(`[KeywordEngine] Step ${i + 1} failed: ${result.error}`);
      }

      result.duration = Date.now() - startTime;
      results.push(result);

      // Stop on failure unless configured otherwise
      if (!result.passed) {
        break;
      }
    }

    const passed = results.every((r) => r.passed);
    logger.info(`[KeywordEngine] Test ${passed ? 'PASSED' : 'FAILED'}: ${testCase.name}`);

    return results;
  }

  /**
   * Execute a single keyword action
   * @param action - Action to execute
   */
  private async executeAction(action: KeywordAction): Promise<void> {
    const keyword = action.keyword.toLowerCase();
    const target = this.resolveVariables(action.target || '');
    const value = this.resolveVariables(action.value || '');
    const expected = this.resolveVariables(action.expected || '');

    switch (keyword) {
      // Navigation keywords
      case 'navigate':
      case 'goto':
        await this.page.goto(target);
        break;

      case 'reload':
        await this.page.reload();
        break;

      case 'goback':
        await this.page.goBack();
        break;

      case 'goforward':
        await this.page.goForward();
        break;

      // Interaction keywords
      case 'click':
        await this.page.locator(target).click();
        break;

      case 'doubleclick':
        await this.page.locator(target).dblclick();
        break;

      case 'rightclick':
        await this.page.locator(target).click({ button: 'right' });
        break;

      case 'type':
      case 'fill':
        await this.page.locator(target).fill(value);
        break;

      case 'clear':
        await this.page.locator(target).clear();
        break;

      case 'check':
        await this.page.locator(target).check();
        break;

      case 'uncheck':
        await this.page.locator(target).uncheck();
        break;

      case 'select':
        await this.page.locator(target).selectOption(value);
        break;

      case 'hover':
        await this.page.locator(target).hover();
        break;

      case 'focus':
        await this.page.locator(target).focus();
        break;

      case 'press':
        await this.page.keyboard.press(value);
        break;

      case 'upload':
        await this.page.locator(target).setInputFiles(value);
        break;

      // Wait keywords
      case 'wait':
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await this.page.waitForTimeout(parseInt(value) || 1000);
        break;

      case 'waitforvisible':
        await this.page.locator(target).waitFor({ state: 'visible' });
        break;

      case 'waitforhidden':
        await this.page.locator(target).waitFor({ state: 'hidden' });
        break;

      case 'waitforurl':
        await this.page.waitForURL(target);
        break;

      case 'waitforloadstate':
        await this.page.waitForLoadState(
          (value as 'load' | 'domcontentloaded' | 'networkidle') || 'domcontentloaded'
        );
        break;

      // Assertion keywords
      case 'assertvisible':
        await expect(this.page.locator(target)).toBeVisible();
        break;

      case 'asserthidden':
        await expect(this.page.locator(target)).toBeHidden();
        break;

      case 'asserttext':
        await expect(this.page.locator(target)).toHaveText(expected);
        break;

      case 'assertcontainstext':
        await expect(this.page.locator(target)).toContainText(expected);
        break;

      case 'assertvalue':
        await expect(this.page.locator(target)).toHaveValue(expected);
        break;

      case 'assertchecked':
        await expect(this.page.locator(target)).toBeChecked();
        break;

      case 'assertunchecked':
        await expect(this.page.locator(target)).not.toBeChecked();
        break;

      case 'assertenabled':
        await expect(this.page.locator(target)).toBeEnabled();
        break;

      case 'assertdisabled':
        await expect(this.page.locator(target)).toBeDisabled();
        break;

      case 'asserturl':
        await expect(this.page).toHaveURL(new RegExp(expected));
        break;

      case 'asserttitle':
        await expect(this.page).toHaveTitle(new RegExp(expected));
        break;

      case 'assertcount':
        await expect(this.page.locator(target)).toHaveCount(parseInt(expected));
        break;

      // Variable keywords
      case 'setvar':
        this.variables.set(target, value);
        break;

      case 'storetext':
        const textContent = await this.page.locator(target).textContent();
        this.variables.set(value, textContent);
        break;

      case 'storevalue':
        const inputValue = await this.page.locator(target).inputValue();
        this.variables.set(value, inputValue);
        break;

      case 'storeattribute':
        const attr = (action.options?.attribute as string) || 'value';
        const attrValue = await this.page.locator(target).getAttribute(attr);
        this.variables.set(value, attrValue);
        break;

      // Screenshot keywords
      case 'screenshot':
        await this.page.screenshot({ path: target, fullPage: true });
        break;

      case 'elementscreenshot':
        await this.page.locator(target).screenshot({ path: value });
        break;

      // Execute JavaScript
      case 'execute':
      case 'executescript':
        await this.page.evaluate(value);
        break;

      // Scroll keywords
      case 'scrollto':
        await this.page.locator(target).scrollIntoViewIfNeeded();
        break;

      case 'scrolltotop':
        await this.page.evaluate(() => window.scrollTo(0, 0));
        break;

      case 'scrolltobottom':
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;

      default:
        throw new Error(`Unknown keyword: ${action.keyword}`);
    }
  }

  /**
   * Resolve variable placeholders in a string
   * @param input - Input string with possible {{variable}} placeholders
   * @returns Resolved string
   */
  private resolveVariables(input: string): string {
    return input.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = this.variables.get(varName);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Set a variable
   * @param name - Variable name
   * @param value - Variable value
   */
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  /**
   * Get a variable
   * @param name - Variable name
   * @returns Variable value
   */
  getVariable(name: string): unknown {
    return this.variables.get(name);
  }

  /**
   * Clear all variables
   */
  clearVariables(): void {
    this.variables.clear();
  }

  /**
   * Load and execute test cases from JSON
   * @param jsonContent - JSON content containing test cases
   * @returns Map of test name to results
   */
  async executeFromJson(jsonContent: string): Promise<Map<string, KeywordResult[]>> {
    const testCases: KeywordTestCase[] = JSON.parse(jsonContent);
    const allResults = new Map<string, KeywordResult[]>();

    for (const testCase of testCases) {
      const results = await this.execute(testCase);
      allResults.set(testCase.name, results);
    }

    return allResults;
  }
}

export default KeywordEngine;
