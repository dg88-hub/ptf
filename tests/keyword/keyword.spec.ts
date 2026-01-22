/**
 * @fileoverview Keyword-driven test execution.
 * @module tests/keyword/keyword.spec
 */

import { expect, test } from '@playwright/test';
import { KeywordEngine, KeywordTestCase } from '../../src/keywords/KeywordEngine';

test.describe('Keyword-Driven Tests @keyword', () => {
  test('should execute login flow using keywords @keyword @smoke', async ({ page }) => {
    const engine = new KeywordEngine(page);
    const loginTest: KeywordTestCase = {
      name: 'Login Flow',
      steps: [
        { keyword: 'navigate', target: 'https://the-internet.herokuapp.com/login' },
        { keyword: 'fill', target: '#username', value: 'tomsmith' },
        { keyword: 'fill', target: '#password', value: 'SuperSecretPassword!' },
        { keyword: 'click', target: 'button[type="submit"]' },
        { keyword: 'waitForUrl', target: '.*secure.*' },
        { keyword: 'assertVisible', target: 'a.button[href="/logout"]' },
      ],
    };
    const results = await engine.execute(loginTest);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  test('should use variables in keywords @keyword @regression', async ({ page }) => {
    const engine = new KeywordEngine(page);
    engine.setVariable('username', 'tomsmith');
    
    const variableTest: KeywordTestCase = {
      name: 'Variable Test',
      steps: [
        { keyword: 'navigate', target: 'https://the-internet.herokuapp.com/login' },
        { keyword: 'fill', target: '#username', value: '{{username}}' },
        { keyword: 'storeValue', target: '#username', value: 'storedValue' },
      ],
    };
    const results = await engine.execute(variableTest);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(engine.getVariable('storedValue')).toBe('tomsmith');
  });
});
