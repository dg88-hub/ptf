# 🎓 Zero to Hero: Enterprise Playwright Training Guide

> **"Master the framework, master the quality."**

Welcome to the definitive guide for the Playwright Test Framework (PTF). This interactive course is designed to take you from a complete beginner to an enterprise automation architect.

---

## 🗺️ Learning Path

| Module | Topic                                                            | Goal                                                        |
| :----- | :--------------------------------------------------------------- | :---------------------------------------------------------- |
| **1**  | **[The Foundations](#module-1-the-foundations)**                 | TypeScript & Playwright Basics                              |
| **2**  | **[Core Playwright](#module-2-core-playwright)**                 | Selectors, Actions, Assertions                              |
| **3**  | **[Enterprise Architecture](#module-3-enterprise-architecture)** | POM, Fixtures, Factories (The "Golden Rules")               |
| **4**  | **[Framework Utilities](#module-4-framework-utilities)**         | Mastering the Toolbox (`TableHandler`, `FormHandler`, etc.) |
| **5**  | **[Hands-on Workshop](#module-5-hands-on-workshop)**             | Build a Real Test Suite from Scratch                        |
| **6**  | **[Advanced Testing](#module-6-advanced-testing)**               | API, Database, A11y, Visual, Performance                    |
| **7**  | **[The Real World](#module-7-the-real-world)**                   | Debugging, CI/CD, Reporting                                 |

---

## Module 1: The Foundations

### 1.1 TypeScript Crash Course for Testers

You don't need to be a developer to use TypeScript effectively. You just need to maximize **Type Safety** to avoid flaky tests.

#### 1. Variables & Types

Stop using `var`. Use `const` by default, `let` if it changes.

```typescript
// Explicit typing
let username: string = "admin";
let attempts: number = 0;
let isActive: boolean = true;
const MAX_RETRIES: number = 3;

// Union Types (Can be one of several values)
let status: "active" | "inactive" | "suspended" = "active";
```

#### 2. Interfaces (The "Shape" of Data)

Define what your data looks like. This saves you from "undefined" errors!

```typescript
interface UserConfig {
  username: string;
  role: "admin" | "user";
  preferences?: {
    // Optional nested object
    theme: "light" | "dark";
  };
}

const tester: UserConfig = {
  username: "qa_expert",
  role: "admin",
  // preferences is optional, so we can omit it
};
```

#### 3. Async/Await (The "Waiting" Game)

**Crucial Concept:** Playwright commands are asynchronous. They return a `Promise`. You **MUST** `await` them.

```typescript
// ❌ WRONG: Code runs too fast, fails immediately
page.click("#login-btn");
console.log("Clicked!");

// ✅ RIGHT: Pauses execution until click completes
await page.click("#login-btn");
console.log("Clicked!");
```

### 1.2 Playwright vs. Selenium

Why are we here?

- **Auto-waiting:** Playwright waits for elements to be actionable (visible, enabled, stable) automatically. No more `Thread.sleep()`.
- **Web-First Assertions:** Assertions retry until they pass or timeout.
- **Fast:** Runs in parallel by default.
- **Trace Viewer:** The ultimate debugging tool (time-travel debugging).

---

## Module 2: Core Playwright

### 2.1 The "Golden Rules" of Selectors

**Rule #1: Use User-Facing Locators.**
Test as a user, not as a developer. Avoid XPath and CSS classes if possible.

| Priority | Locator       | Example                                        | Why?                                        |
| :------- | :------------ | :--------------------------------------------- | :------------------------------------------ |
| 🥇 **1** | `getByRole`   | `page.getByRole('button', { name: 'Submit' })` | Most resilient. Fails if ARIA is broken.    |
| 🥈 **2** | `getByLabel`  | `page.getByLabel('Username')`                  | Great for forms.                            |
| 🥉 **3** | `getByText`   | `page.getByText('Welcome back')`               | Good for content checks.                    |
| ⚠️ **4** | `getByTestId` | `page.getByTestId('submit-btn')`               | Use only if nothing else works.             |
| ❌ **5** | CSS/XPath     | `page.locator('div > .btn-primary')`           | **Avoid.** Brittle and implementation-tied. |

### 2.2 Actions: Doing Things

```typescript
// Navigation
await page.goto("/dashboard");

// Inputs
await page.getByLabel("Name").fill("John Doe"); // Clears and types
await page.getByLabel("Bio").pressSequentially("Hello"); // Types like a user

// Clicks
await page.getByRole("button", { name: "Save" }).click();
await page.getByRole("button", { name: "Save" }).dblclick();

// Checkboxes & Radios
await page.getByLabel("Terms").check();
await page.getByLabel("Gender").selectOption("Non-binary");

// Dropdowns
await page.getByLabel("Country").selectOption({ label: "United States" }); // By label
await page.getByLabel("Country").selectOption("US"); // By value

// Keyboard
await page.keyboard.press("Enter");
```

### 2.3 Assertions: Checking Things

Use **Web-First Assertions**. They automatically wait/retry (default 5s).

```typescript
// ✅ Visibility
await expect(page.getByText("Success")).toBeVisible();

// ✅ Text Content
await expect(page.locator("#title")).toHaveText("Welcome User"); // Exact match
await expect(page.locator("#title")).toContainText("Welcome"); // Partial match

// ✅ URL & Title
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle("Dashboard - My App");

// ✅ Attributes & State
await expect(page.getByRole("button")).toBeEnabled();
await expect(page.getByRole("checkbox")).toBeChecked();
await expect(page.locator("img")).toHaveAttribute("src", "logo.png");
```

---

## Module 3: Enterprise Architecture

This framework follows specific patterns to ensure scalability and maintainability.

### 3.1 Page Object Model (POM)

**Rule:** NEVER write selectors in test files. Always encapsulate them in Page Objects.

**Structure:**

1. **Properties:** Define Locators.
2. **Constructor:** Initialize BasePage.
3. **Methods:** Define User Actions.

**Example (`src/pages/LoginPage.ts`):**

```typescript
export class LoginPage extends BasePage {
  // 1. Locators
  readonly username = this.page.getByLabel("Username");
  readonly password = this.page.getByLabel("Password");
  readonly loginBtn = this.page.getByRole("button", { name: "Sign In" });

  // 2. Constructor
  constructor(page: Page) {
    super(page, "LoginPage"); // 'LoginPage' used for logging
  }

  // 3. Actions
  async login(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginBtn.click();
    // BasePage handles logging: "LoginPage: Clicked Sign In button"
  }
}
```

### 3.2 Fixtures (Dependency Injection)

We don't do `const loginPage = new LoginPage(page)`. We use **Fixtures**.

**Test File:**

```typescript
import { test } from "../../core/fixtures"; // Import custom test fixture

test("login test", async ({ loginPage }) => {
  // Inject loginPage
  await loginPage.navigateTo();
  await loginPage.login("admin", "pass");
});
```

### 3.3 Data Factories (Builder Pattern)

Stop hardcoding test data. Use Factories to generate valid, type-safe data.

**Example Usage:**

```typescript
// Create a totally random customer
const customer = CustomerFactory.create().build();

// Create a specific VIP customer
const vipCustomer = CustomerFactory.create()
  .withName("John", "Doe")
  .withRiskLevel("low")
  .asPremiumMember()
  .build();
```

---

## Module 4: Framework Utilities

Your toolbox for solving complex problems.

### 📊 `TableHandler`

Interact with complex data grids/tables.

```typescript
import { createTableHandler } from "../utils/TableHandler";

const table = createTableHandler(page, "#user-grid");

// Get all data
const rows = await table.getData();

// Filter & Find
const adminRow = await table.getRowByMatch("Role", "Admin");
await table.clickButtonInRow(adminRow, "Edit");

// Sorting
await table.verifySortedBy("Name", "ascending");
```

### 📝 `FormHandler`

Fill massive forms in one line.

```typescript
import { FormHandler } from "../utils/FormHandler";

const form = new FormHandler(page);

await form.fillForm({
  "#first-name": "John",
  "#last-name": "Doe",
  "#email": "john@example.com",
  'select[name="country"]': "USA",
});

await form.submit("#submit-btn");
```

### 📅 `DatePickerHandler`

Handle tricky calendars.

```typescript
import { DatePickerHandler } from "../utils/DatePickerHandler";

const datePicker = new DatePickerHandler(page);

// Select specific date
await datePicker.selectDate("#birth-date", new Date("1990-01-01"));

// Select range
await datePicker.selectDateRange("#trip", startDate, endDate);
```

### 🔄 `RetryHelper`

Handle flaky external systems.

```typescript
import { RetryHelper } from "../utils/RetryHelper";

await RetryHelper.retry(
  async () => {
    await page.click("#unstable-button");
  },
  { maxRetries: 3, delayMs: 1000 },
);
```

---

## Module 5: Hands-on Workshop

**Scenario:** Automate a "Bill Pay" flow in ParaBank.

### Step 1: Create the Page Object

File: `src/pages/parabank/BillPayPage.ts`

```typescript
import { BasePage } from "../../core/BasePage";
import { Page } from "@playwright/test";

export class BillPayPage extends BasePage {
  readonly payeeName = this.page.locator('input[name="payee.name"]');
  readonly address = this.page.locator('input[name="payee.address.street"]');
  readonly amount = this.page.locator('input[name="amount"]');
  readonly sendBtn = this.page.getByRole("button", { name: "Send Payment" });
  readonly successMsg = this.page.locator('div[ng-show="showResult"] h1');

  constructor(page: Page) {
    super(page, "BillPayPage");
  }

  async payBill(name: string, amt: string) {
    await this.payeeName.fill(name);
    await this.amount.fill(amt);
    await this.sendBtn.click();
  }
}
```

### Step 2: Create the Test

File: `tests/ui/workshop/bill-pay.spec.ts`

```typescript
import { test, expect } from "../../../src/core/fixtures";
import { BillPayPage } from "../../../src/pages/parabank/BillPayPage";

test.describe("Bill Payment Workshop", () => {
  test("should pay bill successfully", async ({ page }) => {
    const billPayPage = new BillPayPage(page);

    // 1. Arrange
    await page.goto("/parabank/billpay.htm");

    // 2. Act
    await billPayPage.payBill("John Electric", "100");

    // 3. Assert
    await expect(billPayPage.successMsg).toHaveText("Bill Payment Complete");
  });
});
```

### Step 3: Run & Debug

```bash
# Run in headed mode to see it happening
npx playwright test tests/ui/workshop/bill-pay.spec.ts --headed
```

---

## Module 6: Advanced Testing

### 🔗 API Testing

Directly interact with backend APIs using `Endpoint` classes.

```typescript
import { UserEndpoint } from "../../src/api/endpoints/UserEndpoint";

test("create user via API", async ({ request }) => {
  const userEndpoint = new UserEndpoint(request);
  const response = await userEndpoint.createUser({ name: "API User" });

  expect(response.status()).toBe(201);
});
```

### ♿ Accessibility (A11y)

Automated WCAG 2.1 AA checking using `axe-core`.

```typescript
import { AccessibilityHelper } from "../../src/utils/AccessibilityHelper";

test("check page accessibility", async ({ page }) => {
  const a11y = new AccessibilityHelper(page);
  const violations = await a11y.check();

  expect(violations.length).toBe(0); // Fail if any violations found
});
```

### 👁️ Visual Regression

Compare screenshots pixel-by-pixel.

```typescript
test("visual check of dashboard", async ({ page }) => {
  await expect(page).toHaveScreenshot("dashboard-v1.png", {
    maxDiffPixelRatio: 0.01,
  });
});
```

### ⚡ Performance (Web Vitals)

Measure LCP, CLS, FID.

```typescript
import { PerformanceMetrics } from "../../src/utils/PerformanceMetrics";

test("check performance", async ({ page }) => {
  const metrics = new PerformanceMetrics(page);
  const vitals = await metrics.getWebVitals();

  expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
});
```

---

## Module 7: The Real World

### 🐛 Debugging Strategies

1.  **Trace Viewer (The Holy Grail):**
    Always enabled on CI failure.
    `npx playwright show-trace test-results/trace.zip`
    _See network calls, console logs, and snapshots for every action._

2.  **UI Mode (Local Development):**
    `npx playwright test --ui`
    _Interactive time-travel debugger._

3.  **VS Code Debugger:**
    Set breakpoints `.vscode/launch.json` is pre-configured. Pick "Debug Playwright" and hit F5.

### 🏭 CI/CD & Reporting

- **GitHub Actions:** `.github/workflows/playwright.yml`
  - Runs on push/PR
  - Uploads Traces & Reports
  - Shards tests for speed (Parallel execution)

- **Reports:**
  - HTML Report: `npx playwright show-report`
  - Allure Report: `npm run report:allure` (Rich historical trends)

### 🏷️ Test Tags Reference

| Tag           | Purpose                                            |
| :------------ | :------------------------------------------------- |
| `@smoke`      | Critical paths (Login, Checkout). run on every PR. |
| `@sanity`     | Core features. Run daily.                          |
| `@regression` | Everything. Run nightly/weekly.                    |
| `@api`        | Pure API tests.                                    |
| `@visual`     | Visual regression (slow, brittle).                 |

---

## 🎓 Final Expert Checklist

Before calling yourself an expert, ensure you can:

- [ ] Write a test using a **Page Object**.
- [ ] Use **Data Factories** instead of hardcoded strings.
- [ ] Assert using **Web-First Assertions**.
- [ ] Debug a failure using the **Trace Viewer**.
- [ ] Implement **Retries** for flaky steps.
- [ ] Run tests in **Parallel** and **Sharded** modes.

**Happy Testing! 🎭**
