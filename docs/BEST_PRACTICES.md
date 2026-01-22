# Best Practices

> **Summary**: Follow these guidelines to write consistent, maintainable tests.

---

## ✅ Do's

### 1. Use the `app` Fixture (Facade Pattern)

Always access pages through the `app` fixture, not by direct instantiation.

```typescript
// ✅ CORRECT - Uses dependency injection
test('login test', async ({ app }) => {
  await app.sauce.loginPage.login({ username: 'user', password: 'pass' });
});

// ❌ WRONG - Manual instantiation breaks DI
test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(credentials);
});
```

### 2. Use `TestContext` for Cross-Step Data Sharing

Share data between test steps using `TestContext`, not global variables.

```typescript
// ✅ CORRECT - Type-safe, scoped data
await test.step('Create Order', async () => {
  const orderId = await createOrder();
  testContext.set('orderId', orderId);
});

await test.step('Verify Order', async () => {
  const orderId = testContext.get<string>('orderId');
  expect(orderId).toBeDefined();
});

// ❌ WRONG - Global variable pollution
let globalOrderId: string;
test('create', async () => {
  globalOrderId = 'x';
});
test('verify', async () => {
  expect(globalOrderId).toBe('x');
}); // Flaky!
```

### 3. Use Typed Interfaces for Test Data

Always type your test data for IntelliSense and compile-time safety.

```typescript
// ✅ CORRECT
interface UserData {
  email: string;
  password: string;
}
const user: UserData = { email: 'test@example.com', password: 'secret' };

// ❌ WRONG
const user = { email: 'test@example.com', password: 'secret' }; // No type safety
```

### 4. Import from Barrel Files

Use centralized barrel imports for cleaner code.

```typescript
// ✅ CORRECT - Single import
import { config, StringUtils, DataGenerator } from '../utils';

// ❌ WRONG - Multiple deep imports
import { config } from '../config/index';
import { StringUtils } from '../utils/StringUtils';
import { DataGenerator } from '../utils/DataGenerator';
```

### 5. Use Web-First Assertions

Playwright's auto-waiting assertions are more reliable than manual waits.

```typescript
// ✅ CORRECT - Auto-waits
await expect(page.locator('.success')).toBeVisible();

// ❌ WRONG - Manual wait
await page.waitForSelector('.success');
const element = page.locator('.success');
expect(await element.isVisible()).toBe(true);
```

---

## ❌ Don'ts

### 1. No Hardcoded URLs

Use `src/constants/Routes.ts` or config for URLs.

```typescript
// ❌ WRONG
await page.goto('https://www.saucedemo.com/inventory.html');

// ✅ CORRECT
import { config } from '../config';
await page.goto(`${config.baseUrl}/inventory.html`);
```

### 2. No Hardcoded Credentials

Use `config.credentials` for all authentication.

```typescript
// ❌ WRONG
await loginPage.login('standard_user', 'secret_sauce');

// ✅ CORRECT
const { username, password } = config.credentials.sauce;
await loginPage.login({ username, password });
```

### 3. No Business Logic in Tests

Keep tests focused on assertions. Move complex logic to Page Objects.

```typescript
// ❌ WRONG - Logic in test
test('checkout', async ({ page }) => {
  const items = await page.locator('.item').all();
  let total = 0;
  for (const item of items) {
    total += parseFloat(await item.locator('.price').textContent());
  }
  expect(total).toBeGreaterThan(0);
});

// ✅ CORRECT - Logic in Page Object
test('checkout', async ({ app }) => {
  const total = await app.sauce.cartPage.getTotal();
  expect(total).toBeGreaterThan(0);
});
```

### 4. No `waitForTimeout`

Use explicit waits or auto-waiting locators instead.

```typescript
// ❌ WRONG - Arbitrary sleep
await page.waitForTimeout(5000);

// ✅ CORRECT - Wait for specific condition
await page.waitForLoadState('networkidle');
await expect(locator).toBeVisible();
```

---

## 📝 Naming Conventions

| Type           | Convention                  | Example               |
| -------------- | --------------------------- | --------------------- |
| **Files**      | `PascalCase.ts` for classes | `LoginPage.ts`        |
| **Test Files** | `feature-name.spec.ts`      | `login.smoke.spec.ts` |
| **Classes**    | `PascalCase`                | `SauceDemoLoginPage`  |
| **Methods**    | `camelCase`                 | `submitLoginForm`     |
| **Variables**  | `camelCase`                 | `userCredentials`     |
| **Constants**  | `UPPER_SNAKE_CASE`          | `MAX_RETRY_COUNT`     |
| **Interfaces** | `PascalCase`                | `UserCredentials`     |
| **Test Tags**  | `@kebab-case`               | `@smoke`, `@critical` |

---

## 🏷️ Test Tagging

Always tag tests for selective execution:

```typescript
test('critical login flow @smoke @critical', async ({ app }) => {
  // This test runs in smoke and critical suites
});
```

| Tag           | Purpose            | When to Use    |
| ------------- | ------------------ | -------------- |
| `@smoke`      | Quick verification | Every commit   |
| `@sanity`     | Core functionality | Daily builds   |
| `@regression` | Full coverage      | Weekly/release |
| `@critical`   | Business-critical  | Every commit   |

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) - Design patterns
- [TRAINING_GUIDE.md](TRAINING_GUIDE.md) - Learning curriculum
- [GUIDE_ADD_PAGE.md](GUIDE_ADD_PAGE.md) - Adding new pages
