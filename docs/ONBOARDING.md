# PTF Onboarding Guide - Complete Beginner's Handbook

Welcome to the **Playwright Test Framework (PTF)**! This comprehensive guide will take you from zero knowledge to confidently writing and running tests.

---

## Table of Contents

1. [🎓 Zero to Hero Training Guide](TRAINING_GUIDE.md) (**Start Here!**)
2. [What is This Framework?](#1-what-is-this-framework)
3. [Prerequisites](#2-prerequisites)
4. [Installation & Setup](#3-installation--setup)
5. [Project Structure](#4-project-structure)
6. [Configuration Deep Dive](#5-configuration-deep-dive)
7. [Working with Test Data](#6-working-with-test-data)
8. [Utility Scripts Reference](#7-utility-scripts-reference)
9. [Writing Your First Test](#8-writing-your-first-test)
10. [Running & Debugging Tests](#9-running--debugging-tests)
11. [Advanced Topics](#10-advanced-topics)

---

## 1. What is This Framework?

### What is Playwright?

**Playwright** is a modern browser automation library developed by Microsoft. It lets you control web browsers programmatically to:

- Navigate to web pages
- Click buttons, fill forms, and interact with elements
- Assert that pages work correctly
- Take screenshots and videos

### What is TypeScript?

**TypeScript** is JavaScript with added type safety. It helps catch errors before running code and provides better IDE autocomplete. Don't worry if you only know JavaScript—TypeScript is very similar!

### Why This Framework?

PTF provides:

- **Page Object Model (POM)**: Organized, maintainable test code
- **Data-Driven Testing**: Run the same test with different data sets
- **Multi-Environment Support**: Test against SIT, FAT, UAT environments
- **Built-in Utilities**: CSV/Excel handling, data generation, logging

---

## 2. Prerequisites

### Required Software

| Software | Version | Download Link                                          |
| -------- | ------- | ------------------------------------------------------ |
| Node.js  | 18+     | [nodejs.org](https://nodejs.org)                       |
| Git      | Latest  | [git-scm.com](https://git-scm.com)                     |
| VS Code  | Latest  | [code.visualstudio.com](https://code.visualstudio.com) |

### Recommended VS Code Extensions

When you open this project, VS Code will prompt you to install recommended extensions. Accept them, or install manually:

- **Playwright Test for VS Code** - Run tests from the sidebar
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **TypeScript Language Features** - Already built into VS Code

---

## 3. Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd PTF
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`.

### Step 3: Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers.

### Step 4: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (optional for getting started)
```

### Step 5: Verify Installation

```bash
# Run type checking
npm run type-check

# Run health check tests
npm run test:smoke
```

If tests pass, you're ready!

---

## 4. Project Structure

```
PTF/
├── src/                    # Source code (reusable components)
│   ├── config/             # Environment configuration
│   ├── core/               # Base classes (BasePage, fixtures)
│   ├── pages/              # Page Objects (one per page/component)
│   ├── api/                # API client and endpoint wrappers
│   ├── database/           # PostgreSQL and Oracle clients
│   ├── keywords/           # Keyword-driven test engine
│   └── utils/              # Utilities (CSV, Excel, Logger, etc.)
│
├── tests/                  # Test files
│   ├── ui/                 # UI tests (organized by: smoke, sanity, regression)
│   ├── api/                # API tests
│   ├── database/           # Database tests
│   ├── keyword/            # Keyword-driven tests
│   └── mobile/             # Mobile emulation tests
│
├── test-data/              # Test data files (JSON, CSV, Excel)
├── docs/                   # Documentation
├── docker/                 # Docker configuration
├── playwright.config.ts    # Playwright configuration
├── .env                    # Environment variables (not committed)
└── .env.example            # Example environment file
```

### Key Files Explained

| File                   | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `playwright.config.ts` | Configures browsers, timeouts, parallelism, reporters |
| `.env`                 | Your local environment variables (credentials, URLs)  |
| `package.json`         | Project dependencies and npm scripts                  |
| `tsconfig.json`        | TypeScript compiler configuration                     |

---

## 5. Configuration Deep Dive

### Understanding Environment Variables

All configuration is managed through the `.env` file. The framework reads these using the `config` module.

### Switching Environments

```bash
# Run tests in SIT environment (default)
npm test

# Run tests in UAT environment
TEST_ENV=uat npm test

# Run tests in FAT environment
TEST_ENV=fat npm test
```

### Complete Environment Variables Reference

#### Test Environment

```env
TEST_ENV=sit              # Options: sit, fat, uat
```

#### Base URLs (per environment)

```env
SIT_BASE_URL=https://your-sit-app.com
FAT_BASE_URL=https://your-fat-app.com
UAT_BASE_URL=https://your-uat-app.com
API_BASE_URL=https://api.your-app.com
```

#### PostgreSQL Database

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=testdb
PG_USER=testuser
PG_PASSWORD=your_password
PG_SSL=false
```

#### Oracle Database

```env
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=ORCL
ORACLE_USER=testuser
ORACLE_PASSWORD=your_password
```

#### SFTP Configuration

```env
SFTP_HOST=sftp.your-server.com
SFTP_PORT=22
SFTP_USER=sftpuser
SFTP_PASSWORD=your_password
# OR use key-based auth:
# SFTP_PRIVATE_KEY_PATH=/path/to/private/key
```

#### Email (IMAP) Configuration

```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=test@example.com
IMAP_PASSWORD=app_specific_password
IMAP_TLS=true
```

#### Test Execution Settings

```env
WORKERS=4                     # Parallel test workers
HEADLESS=true                 # Run browsers without UI
SCREENSHOT_ON_FAILURE=true    # Capture screenshots on failure
VIDEO_RECORDING=false         # Record test videos
LOG_LEVEL=info                # Options: debug, info, warn, error
```

### Accessing Configuration in Code

```typescript
import { config } from "../config";

// Get current environment
console.log(config.environment.name); // 'sit'
console.log(config.environment.baseUrl); // 'https://...'

// Check if database is configured
if (config.postgresDb) {
  console.log(config.postgresDb.host);
}
```

---

## 6. Working with Test Data

### Option 1: JSON Files

Create a JSON file in `test-data/`:

```json
// test-data/users.json
[
  {
    "id": "1",
    "email": "user1@test.com",
    "firstName": "John",
    "role": "admin"
  },
  { "id": "2", "email": "user2@test.com", "firstName": "Jane", "role": "user" }
]
```

Use in tests:

```typescript
import * as fs from "fs";

const users = JSON.parse(fs.readFileSync("test-data/users.json", "utf-8"));

for (const user of users) {
  test(`Login as ${user.firstName}`, async ({ page }) => {
    // Use user.email, user.role, etc.
  });
}
```

### Option 2: CSV Files

Create a CSV file:

```csv
id,email,firstName,lastName,role,password
1,user1@test.com,John,Doe,admin,Password123!
2,user2@test.com,Jane,Smith,user,Password123!
```

Use with `CsvHandler`:

```typescript
import { csvHandler } from "../utils/CsvHandler";

// Read CSV data
const users = await csvHandler.readFile<UserData>("test-data/users.csv");

// For data-driven tests
const testCases = await csvHandler.toTestCases(
  "test-data/users.csv",
  "firstName",
);
// Returns: [['John', {...}], ['Jane', {...}]]

for (const [testName, userData] of testCases) {
  test(`Test for ${testName}`, async ({ page }) => {
    // Use userData.email, userData.password, etc.
  });
}
```

### Option 3: Excel Files

```typescript
import { excelHandler } from "../utils/ExcelHandler";

// Read Excel file (first sheet by default)
const data = excelHandler.readFile("test-data/test-cases.xlsx");

// Read specific sheet
const scenarios = excelHandler.readFile("test-data/test-cases.xlsx", {
  sheet: "LoginScenarios",
});

// Get all sheet names
const sheets = excelHandler.getSheetNames("test-data/test-cases.xlsx");
```

### Option 4: Generate Fake Data

```typescript
import { dataGenerator } from "../utils/DataGenerator";

// Generate a single user with realistic fake data
const user = dataGenerator.generateUser();
// {
//   id: 'uuid-here',
//   firstName: 'John',
//   lastName: 'Doe',
//   email: 'johndoe123@gmail.com',
//   phone: '(555) 123-4567',
//   address: {...},
//   ssn: 'XXX-XX-1234',  // Masked by default
//   ...
// }

// Generate multiple users
const users = dataGenerator.generateUsers(10);

// Generate specific data types
const email = dataGenerator.generateEmail();
const phone = dataGenerator.generatePhone();
const password = dataGenerator.generatePassword(16, true); // 16 chars, with special chars
const uuid = dataGenerator.generateUuid();
const date = dataGenerator.generateDateOfBirth();
```

---

## 7. Utility Scripts Reference

| Utility               | Import                                                               | Purpose                       | Key Methods                                               |
| --------------------- | -------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| `CsvHandler`          | `import { csvHandler } from '../utils/CsvHandler'`                   | Read/write CSV files          | `readFile()`, `writeFile()`, `toTestCases()`              |
| `ExcelHandler`        | `import { excelHandler } from '../utils/ExcelHandler'`               | Read/write Excel files        | `readFile()`, `writeFile()`, `getSheetNames()`            |
| `DataGenerator`       | `import { dataGenerator } from '../utils/DataGenerator'`             | Generate fake test data       | `generateUser()`, `generateEmail()`, `generatePassword()` |
| `TestDataFactory`     | `import { UserFactory } from '../utils/TestDataFactory'`             | Builder pattern for test data | `UserFactory.create().withRole().build()`                 |
| `Logger`              | `import { logger } from '../utils/Logger'`                           | Framework logging             | `info()`, `debug()`, `warn()`, `error()`                  |
| `SchemaValidator`     | `import { schemaValidator } from '../utils/SchemaValidator'`         | API response validation       | `validate()`, `assertValid()`, `compile()`                |
| `AccessibilityHelper` | `import { AccessibilityHelper } from '../utils/AccessibilityHelper'` | WCAG compliance testing       | `check()`, `checkWCAG21AA()`, `getScore()`                |
| `PerformanceMetrics`  | `import { PerformanceMetrics } from '../utils/PerformanceMetrics'`   | Core Web Vitals               | `getWebVitals()`, `assertLCP()`, `generateReport()`       |
| `SftpClient`          | `import { SftpClient } from '../utils/SftpClient'`                   | SFTP file operations          | `connect()`, `uploadFile()`, `downloadFile()`             |
| `EmailValidator`      | `import { EmailValidator } from '../utils/EmailValidator'`           | Email verification            | `connect()`, `getUnreadEmails()`, `waitForEmail()`        |

### Logger Example

```typescript
import { logger } from "../utils/Logger";

logger.info("Test started");
logger.debug("Detailed debug information");
logger.warn("Something unexpected happened");
logger.error("Test failed", { error: "details" });
```

---

## 8. Writing Your First Test

### Step 1: Create a Page Object

Page Objects encapsulate all interactions with a specific page.

```typescript
// src/pages/sample/LoginPage.ts
import { Page, Locator } from "@playwright/test";
import { BasePage } from "../../core/BasePage";

export class LoginPage extends BasePage {
  // Define locators as class properties
  readonly usernameInput: Locator = this.page.locator("#username");
  readonly passwordInput: Locator = this.page.locator("#password");
  readonly loginButton: Locator = this.page.locator('button[type="submit"]');
  readonly errorMessage: Locator = this.page.locator(".flash.error");

  constructor(page: Page) {
    super(page, "LoginPage");
  }

  // Define actions as methods
  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}
```

### Step 2: Write a UI Test

```typescript
// tests/ui/smoke/login.smoke.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../../../src/pages/sample/LoginPage";

test.describe("Login Tests @smoke", () => {
  test("should login with valid credentials @critical", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Navigate to login page
    await page.goto("/login");

    // Perform login
    await loginPage.login("tomsmith", "SuperSecretPassword!");

    // Assert success
    await expect(page).toHaveURL(/secure/);
  });

  test("should show error for invalid password", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.goto("/login");
    await loginPage.login("tomsmith", "wrongpassword");

    // Assert error message
    await expect(loginPage.errorMessage).toBeVisible();
    expect(await loginPage.getErrorMessage()).toContain("password is invalid");
  });
});
```

### Step 3: Write an API Test

```typescript
// tests/api/users.api.spec.ts
import { test, expect } from "@playwright/test";

test.describe("User API Tests @api", () => {
  test("should fetch user list", async ({ request }) => {
    const response = await request.get(
      "https://jsonplaceholder.typicode.com/users",
    );

    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty("email");
  });

  test("should create a new user", async ({ request }) => {
    const newUser = {
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
    };

    const response = await request.post(
      "https://jsonplaceholder.typicode.com/users",
      {
        data: newUser,
      },
    );

    expect(response.status()).toBe(201);

    const createdUser = await response.json();
    expect(createdUser.name).toBe(newUser.name);
  });
});
```

### Test Tags

Use tags to categorize and filter tests:

| Tag            | Purpose                      | Run Command                               |
| -------------- | ---------------------------- | ----------------------------------------- |
| `@smoke`       | Quick verification tests     | `npm run test:smoke`                      |
| `@sanity`      | Core functionality tests     | `npm run test:sanity`                     |
| `@regression`  | Full regression suite        | `npm run test:regression`                 |
| `@critical`    | Business-critical flows      | `npx playwright test --grep @critical`    |
| `@api`         | API-only tests               | `npm run test:api`                        |
| `@db`          | Database tests               | `npm run test:db`                         |
| `@a11y`        | Accessibility tests          | `npm run test:a11y`                       |
| `@visual`      | Visual regression tests      | `npm run test:visual`                     |
| `@performance` | Performance/Web Vitals tests | `npx playwright test --grep @performance` |

---

## 9. Running & Debugging Tests

### Basic Run Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/ui/smoke/login.smoke.spec.ts

# Run tests matching a tag
npx playwright test --grep @smoke

# Run tests in a specific browser
npx playwright test --project=chromium
```

### Debugging Options

```bash
# Open Playwright UI Mode (recommended for debugging)
npx playwright test --ui

# Run with Playwright Inspector (step-by-step debugging)
npx playwright test --debug

# Run with headed browser and slow motion
npx playwright test --headed --slowmo=500
```

### Viewing Test Reports

After tests run:

```bash
# Open HTML report
npx playwright show-report

# View trace file (for failed tests)
npx playwright show-trace test-results/trace.zip
```

### Common Issues & Solutions

| Issue               | Solution                                                              |
| ------------------- | --------------------------------------------------------------------- |
| "Browser not found" | Run `npx playwright install`                                          |
| Tests timeout       | Increase timeout in `playwright.config.ts` or use `test.setTimeout()` |
| Element not found   | Use `await page.waitForSelector()` or check locator                   |
| API returns 403     | Check authentication headers or API rate limits                       |

---

## 10. Advanced Topics

### Test Context (Sharing Data Across Tests)

```typescript
import { testContext } from "../core/TestContext";

// Store data
testContext.set("createdUserId", "12345");

// Retrieve data in another test
const userId = testContext.get<string>("createdUserId");
```

### Database Testing

```typescript
import { createDatabaseClient } from "../database/DatabaseClient";
import { config } from "../config";

test("should verify user in database", async () => {
  const db = createDatabaseClient("postgresql", config.postgresDb!);
  await db.connect();

  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    "test@example.com",
  ]);
  expect(result.rows.length).toBe(1);

  await db.disconnect();
});
```

### Mobile Emulation

```typescript
// tests/mobile/responsive.mobile.spec.ts
import { test, devices } from "@playwright/test";

// Use iPhone 14
test.use({ ...devices["iPhone 14"] });

test("should display mobile menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".mobile-menu")).toBeVisible();
});
```

### Keyword-Driven Testing

Create test steps in JSON:

```json
// test-data/login-scenarios.json
{
  "testName": "Valid Login",
  "steps": [
    { "keyword": "navigate", "target": "/login" },
    { "keyword": "type", "target": "#username", "value": "tomsmith" },
    {
      "keyword": "type",
      "target": "#password",
      "value": "SuperSecretPassword!"
    },
    { "keyword": "click", "target": "button[type='submit']" },
    { "keyword": "assertUrl", "target": "/secure" }
  ]
}
```

Run with KeywordEngine:

```typescript
import { KeywordEngine } from "../keywords/KeywordEngine";

test("Keyword-driven login test", async ({ page }) => {
  const engine = new KeywordEngine(page);
  await engine.runFromFile("test-data/login-scenarios.json");
});
```

---

## Getting Help

- **Architecture Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Folder Structure**: [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)
- **Git Workflow**: [GIT_BRANCHING.md](GIT_BRANCHING.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Common Issues**: [Knowledge Base](../knowledge-base/README.md)
- **Review existing tests** for examples of patterns and best practices

---

**Happy Testing! 🎭**
