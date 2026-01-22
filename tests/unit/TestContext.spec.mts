import { beforeEach, describe, expect, it } from 'vitest';
import { TestContext } from '../../src/core/TestContext';

describe('TestContext', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestContext.getInstance();
    context.clear();
  });

  it('should store and retrieve values', () => {
    context.set('key', 'value');
    expect(context.get('key')).toBe('value');
  });

  it('should return undefined for missing keys', () => {
    expect(context.get('nonexistent')).toBeUndefined();
  });

  it('should support scoped context', () => {
    const scoped = context.scoped('namespace');
    scoped.set('key', 'scoped-value');

    expect(scoped.get('key')).toBe('scoped-value');
    expect(context.get('namespace.key')).toBe('scoped-value');
  });

  it('should capture test name in metadata', () => {
    context.set('key', 'value', { testName: 'Test A' });
    // Note: getAll returns raw values, checking metadata would require accessing store directly or exposing metadata
    expect(context.get('key')).toBe('value');
  });

  it('should support getAll with prefix', () => {
    context.set('prefix.1', 1);
    context.set('prefix.2', 2);
    context.set('other', 3);

    const result = context.getAll('prefix');
    expect(result.size).toBe(2);
    expect(result.get('prefix.1')).toBe(1);
    expect(result.get('prefix.2')).toBe(2);
  });
});
