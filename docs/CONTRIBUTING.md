# Contributing to PTF

> **Summary**: How to contribute code, tests, and documentation to the Playwright Test Framework.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone <your-fork-url>`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/your-feature`

---

## Code Standards

### TypeScript

- Use **strict** TypeScript everywhere
- Add **JSDoc** comments on all public methods:
  ```typescript
  /**
   * Login with credentials.
   * @param username - User's email or username
   * @param password - User's password
   * @returns Promise that resolves on successful login
   */
  async login(username: string, password: string): Promise<void> { ... }
  ```

### File Organization

- **Page Objects**: `src/pages/<appName>/<PageName>.ts`
- **Utilities**: `src/utils/<UtilityName>.ts`
- **Tests**: `tests/<category>/<feature>.spec.ts`

### Imports

Use barrel imports for cleaner code:

```typescript
// ✅ Good
import { config, StringUtils, DataGenerator } from '../utils';

// ❌ Avoid
import { config } from '../config/index';
import { StringUtils } from '../utils/StringUtils';
```

### Naming Conventions

| Type       | Convention        | Example                               |
| ---------- | ----------------- | ------------------------------------- |
| Files      | `PascalCase.ts`   | `LoginPage.ts`                        |
| Test Files | `feature.spec.ts` | `login.smoke.spec.ts`                 |
| Classes    | `PascalCase`      | `SauceDemoLoginPage`                  |
| Methods    | `camelCase`       | `submitLoginForm`                     |
| Tests      | Descriptive       | `should login with valid credentials` |

---

## Writing Tests

### Structure

```typescript
import { test, expect } from '../src/core/fixtures';

test.describe('Feature Name @tag', () => {
  test.beforeEach(async ({ app }) => {
    // Setup
  });

  test('should do something @smoke', async ({ app, page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Tags

Always tag tests appropriately:

| Tag           | Usage                    |
| ------------- | ------------------------ |
| `@smoke`      | Quick verification tests |
| `@sanity`     | Core functionality       |
| `@regression` | Full coverage            |
| `@critical`   | Business-critical        |
| `@api`        | API tests                |
| `@db`         | Database tests           |

---

## Pull Request Process

1. **Run** lint and type-check: `npm run lint && npm run type-check`
2. **Run** relevant tests: `npm run test:smoke`
3. **Update** documentation if needed
4. **Create** PR with descriptive title
5. **Fill** out the PR template

### Commit Messages

Use conventional commits:

```
feat: add user profile page
fix: resolve login timeout issue
docs: update ONBOARDING.md with new setup steps
test: add checkout flow regression tests
refactor: consolidate config files
```

---

## Adding a New Page

See [GUIDE_ADD_PAGE.md](GUIDE_ADD_PAGE.md).

---

## Adding a New Utility

1. Create file in `src/utils/`
2. Add JSDoc comments
3. Export from `src/utils/index.ts`
4. Add to documentation

---

## Documentation

### Files to Update

| When you...       | Update these...                        |
| ----------------- | -------------------------------------- |
| Add a page        | `GUIDE_ADD_PAGE.md` if pattern changes |
| Add a utility     | `README.md` utilities table            |
| Change config     | `ONBOARDING.md` configuration section  |
| Add test category | `FOLDER_STRUCTURE.md`                  |

### Style

- Use **clear headings**
- Include **code examples**
- Add **tables** for reference data
- Use **emoji** sparingly for visual cues

---

## Questions?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Ask in team Slack channel
