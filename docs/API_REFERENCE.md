# API Reference Documentation

> Auto-generated API documentation using TypeDoc

---

## Setup TypeDoc

### 1. Install TypeDoc

```bash
npm install --save-dev typedoc
```

### 2. Create TypeDoc Config

```json
// typedoc.json
{
  "entryPoints": ["src"],
  "out": "docs/api",
  "exclude": ["**/*.spec.ts", "**/*.test.ts", "**/node_modules/**"],
  "excludePrivate": true,
  "excludeProtected": false,
  "includeVersion": true,
  "sort": ["source-order"],
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "categorizeByGroup": true,
  "plugin": ["typedoc-plugin-markdown"],
  "gitRevision": "main"
}
```

### 3. Add Scripts

```json
// package.json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:serve": "npx http-server docs/api",
    "docs:watch": "typedoc --watch"
  }
}
```

---

## Generate Documentation

```bash
# Generate docs
npm run docs:generate

# Serve locally
npm run docs:serve

# Watch for changes
npm run docs:watch
```

---

## JSDoc Patterns

### Module Documentation

````typescript
/**
 * @fileoverview API Client utility for REST AP testing
 * @module utils/ApiClient
 *
 * @example
 * ```typescript
 * const api = new ApiClient(request, 'https://api.example.com');
 * const users = await api.get<User[]>('/users');
 * ```
 */
````

### Class Documentation

````typescript
/**
 * API Client for making HTTP requests with retry logic
 *
 * @class ApiClient
 * @category Utilities
 *
 * @example
 * ```typescript
 * const api = new ApiClient(request, baseUrl);
 * const response = await api.post('/users', { data: userData });
 * ```
 */
export class ApiClient {
  /**
   * Create new ApiClient instance
   *
   * @param context - Playwright API request context
   * @param baseUrl - Base URL for all requests
   * @param defaultOptions - Default request options
   */
  constructor(context: APIRequestContext, baseUrl: string, defaultOptions?: ApiRequestOptions) {
    // ...
  }
}
````

### Method Documentation

````typescript
/**
 * Make a GET request
 *
 * @template T - Response data type
 * @param endpoint - API endpoint
 * @param options - Request options
 * @returns Promise resolving to typed API response
 *
 * @example
 * ```typescript
 * const users = await api.get<User[]>('/users', {
 *   params: { role: 'admin' }
 * });
 * ```
 *
 * @throws {Error} If request fails after all retries
 */
async get<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  // ...
}
````

---

## Categories

Organize docs using `@category` tag:

```typescript
/**
 * @category Core
 */
export class BasePage {}

/**
 * @category Utilities
 */
export class DataGenerator {}

/**
 * @category Page Objects
 */
export class LoginPage {}
```

---

## Generated Structure

```
docs/api/
├── index.html
├── modules/
│   ├── utils_ApiClient.html
│   ├── utils_DataGenerator.html
│   └── core_BasePage.html
├── classes/
│   ├── ApiClient.html
│   └── BasePage.html
└── interfaces/
    └── ApiRequestOptions.html
```

---

## Publishing

### GitHub Pages

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run docs:generate

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
          cname: ptf-docs.example.com # Optional custom domain
```

### Accessing Docs

- Local: `http://localhost:8080`
- GitHub Pages: `https://your-org.github.io/ptf/`
- Custom Domain: `https://ptf-docs.example.com`

---

## Plugins

### Markdown Export

```bash
npm install --save-dev typedoc-plugin-markdown
```

```json
{
  "plugin": ["typedoc-plugin-markdown"],
  "out": "docs/api-markdown"
}
```

### Mermaid Diagrams

```bash
npm install --save-dev typedoc-plugin-mermaid
```

---

## Best Practices

1. **Complete JSDoc**: Document all public APIs
2. **Examples**: Include usage examples in @example tags
3. **Types**: Use TypeScript types, not any
4. **Links**: Use {@link ClassName} for cross-references
5. **Updates**: Regenerate docs on every release

---

## Resources

- [TypeDoc Documentation](https://typedoc.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [TypeDoc Plugins](https://typedoc.org/guides/plugins/)

---

_Last Updated: January 2026_
