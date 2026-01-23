# Unit Testing Guide with Vitest

> Test your framework utilities and helpers with Vitest

---

## Setup

### 1. Install Vitest

```bash
npm install --save-dev vitest @vitest/ui
```

### 2. Create Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@utils': path.resolve(__dirname, './src/utils'),
      '@core': path.resolve(__dirname, './src/core'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
});
```

### 3. Update package.json

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage"
  }
}
```

---

## Example: Testing StringUtils

```typescript
// src/utils/__tests__/StringUtils.test.ts
import { describe, it, expect } from 'vitest';
import { StringUtils } from '../StringUtils';

describe('StringUtils', () => {
  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(StringUtils.toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('converts kebab-case to camelCase', () => {
      expect(StringUtils.toCamelCase('hello-world')).toBe('helloWorld');
    });

    it('handles empty string', () => {
      expect(StringUtils.toCamelCase('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longText = 'This is a very long string that needs truncation';
      expect(StringUtils.truncate(longText, 20)).toBe('This is a very lo...');
    });

    it('does not truncate short strings', () => {
      expect(StringUtils.truncate('Short', 10)).toBe('Short');
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email', () => {
      expect(StringUtils.isValidEmail('test@example.com')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(StringUtils.isValidEmail('not-an-email')).toBe(false);
    });
  });
});
```

---

## Example: Testing DataGenerator

```typescript
// src/utils/__tests__/DataGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { DataGenerator } from '../DataGenerator';

describe('DataGenerator', () => {
  it('generates valid email', () => {
    const email = DataGenerator.generateEmail();
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it('generates phone number with correct format', () => {
    const phone = DataGenerator.generatePhoneNumber();
    expect(phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });

  it('generates unique emails', () => {
    const email1 = DataGenerator.generateEmail();
    const email2 = DataGenerator.generateEmail();
    expect(email1).not.toBe(email2);
  });
});
```

---

## Example: Testing ApiClient

```typescript
// src/utils/__tests__/ApiClient.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../ApiClient';

describe('ApiClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('makes GET request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'Test' }),
      headers: new Headers(),
    });

    const client = new ApiClient({} as any, 'https://api.example.com');
    const response = await client.get('/users/1');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ id: 1, name: 'Test' });
  });

  it('retries on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new ApiClient({} as any, 'https://api.example.com', {
      retries: 1,
      retryDelay: 100,
    });

    const response = await client.get('/endpoint');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

---

## Coverage Configuration

### Generate Coverage Report

```bash
npm run test:unit:coverage
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

---

## CI Integration

### GitHub Actions

```yaml
name: Unit Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

1. **Test file naming**: `*.test.ts` or `*.spec.ts`
2. **Co-locate tests**: Keep tests next to source files in `__tests__/` folder
3. **Mock external dependencies**: Use vi.mock() for modules
4. **Test edge cases**: Empty strings, null, undefined, boundary values
5. **Use descriptive test names**: "should do X when Y"

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)

---

_Last Updated: January 2026_
