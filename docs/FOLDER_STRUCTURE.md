# PTF Folder Structure - Complete Reference

> **For Beginners**: This document explains every folder and key file in the framework. Use this as a reference when navigating the codebase.

---

## Visual Overview

```
PTF/
├── 📁 .github/              # GitHub-specific configuration
│   └── workflows/           # GitHub Actions CI/CD pipelines
│       └── playwright.yml   # Main test automation workflow
│
├── 📁 .vscode/              # VS Code workspace settings
│   ├── extensions.json      # Recommended extensions
│   ├── launch.json          # Debug configurations
│   └── settings.json        # Editor settings (formatting, linting)
│
├── 📁 azure-pipelines/      # Azure DevOps CI/CD configuration
│   └── azure-pipelines.yml  # Pipeline definition
│
├── 📁 docker/               # Containerization
│   ├── Dockerfile           # Test runner container image
│   └── docker-compose.yml   # Multi-container orchestration
│
├── 📁 docs/                 # 📚 Documentation (you are here!)
│   ├── ARCHITECTURE.md      # Framework design & patterns
│   ├── FOLDER_STRUCTURE.md  # This file
│   ├── GIT_BRANCHING.md     # Git workflow guide
│   └── ONBOARDING.md        # Complete beginner's guide
│
├── 📁 jenkins/              # Jenkins CI configuration
│   └── Jenkinsfile          # Pipeline as code
│
├── 📁 knowledge-base/       # Team knowledge & issue tracking
│   ├── issues/              # Known issues & solutions
│   └── README.md            # Knowledge base index
│
├── 📁 src/                  # 🔧 Framework source code
│   ├── api/                 # API testing components
│   ├── config/              # Configuration management
│   ├── core/                # Core framework classes
│   ├── database/            # Database connectivity
│   ├── keywords/            # Keyword-driven engine
│   ├── pages/               # Page Object Models
│   └── utils/               # Utility modules
│
├── 📁 test-data/            # 📊 Test data files
│   ├── config/              # Environment-specific configs
│   ├── *.json               # JSON test data
│   ├── *.csv                # CSV test data
│   └── *.xlsx               # Excel test data
│
├── 📁 tests/                # 🧪 Test specifications
│   ├── api/                 # API tests
│   ├── database/            # Database tests
│   ├── keyword/             # Keyword-driven tests
│   ├── mobile/              # Mobile emulation tests
│   └── ui/                  # UI tests (smoke, sanity, regression)
│
├── 📄 .env                  # Environment variables (local, gitignored)
├── 📄 .env.example          # Environment template
├── 📄 .eslintrc.json        # ESLint configuration
├── 📄 .gitignore            # Git ignore rules
├── 📄 .prettierrc           # Prettier formatting rules
├── 📄 package.json          # Dependencies & npm scripts
├── 📄 playwright.config.ts  # Playwright configuration
├── 📄 README.md             # Project overview
└── 📄 tsconfig.json         # TypeScript compiler options
```

---

## Detailed Directory Reference

### `/src/` - Framework Source Code

This is where all reusable framework code lives.

#### `/src/api/` - API Testing Components

| File           | Purpose                            | When to Use                                |
| -------------- | ---------------------------------- | ------------------------------------------ |
| `ApiClient.ts` | Wraps Playwright's request context | All API tests                              |
| `endpoints/`   | API endpoint wrappers              | Organize by resource (users, orders, etc.) |

```typescript
// Example: Using ApiClient
import { ApiClient } from '../api/ApiClient';
const api = new ApiClient(request, 'https://api.example.com');
const response = await api.get('/users');
```

---

#### `/src/config/` - Configuration Management

| File                | Purpose                   | When to Use                                  |
| ------------------- | ------------------------- | -------------------------------------------- |
| `index.ts`          | Main configuration module | Import: `import { config } from '../config'` |
| `browser.config.ts` | Browser-specific settings | Viewport, user agent customization           |

```typescript
// Example: Accessing configuration
import { config } from '../config';
console.log(config.environment.baseUrl); // Current environment URL
console.log(config.postgresDb?.host); // Database host if configured
```

---

#### `/src/core/` - Core Framework Classes

| File                  | Purpose                         | Key Exports               |
| --------------------- | ------------------------------- | ------------------------- |
| `BasePage.ts`         | Base class for all page objects | `BasePage` class          |
| `fixtures.ts`         | Custom Playwright test fixtures | Extended `test`, `expect` |
| `TestContext.ts`      | Cross-test data sharing         | `testContext` singleton   |
| `TestDataProvider.ts` | Data-driven test support        | `TestDataProvider` class  |

```typescript
// Example: Creating a page object
import { BasePage } from '../core/BasePage';

export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page, 'MyPage');
  }
}
```

---

#### `/src/database/` - Database Connectivity

| File                | Purpose                    | Supported Databases |
| ------------------- | -------------------------- | ------------------- |
| `DatabaseClient.ts` | Unified database interface | PostgreSQL, Oracle  |

```typescript
// Example: Database query
import { createDatabaseClient } from '../database/DatabaseClient';
const db = createDatabaseClient('postgresql', config.postgresDb);
await db.connect();
const result = await db.query('SELECT * FROM users');
```

---

#### `/src/keywords/` - Keyword-Driven Engine

| File               | Purpose                           | When to Use             |
| ------------------ | --------------------------------- | ----------------------- |
| `KeywordEngine.ts` | Executes keyword-based test steps | Excel/JSON driven tests |

```typescript
// Example: Running keyword tests
import { KeywordEngine } from '../keywords/KeywordEngine';
const engine = new KeywordEngine(page);
await engine.runFromFile('test-data/login-scenarios.json');
```

---

#### `/src/pages/` - Page Object Models

Organize page objects by feature or application section:

```
pages/
├── sample/                  # Example/demo pages
│   ├── LoginPage.ts
│   └── SecurePage.ts
├── user/                    # User management pages
│   ├── ProfilePage.ts
│   └── SettingsPage.ts
└── checkout/                # E-commerce checkout
    ├── CartPage.ts
    └── PaymentPage.ts
```

**Naming Convention**: `{PageName}Page.ts`

---

#### `/src/utils/` - Utility Modules

| File                | Purpose               | Key Methods                                               |
| ------------------- | --------------------- | --------------------------------------------------------- |
| `CsvHandler.ts`     | CSV file operations   | `readFile()`, `writeFile()`, `toTestCases()`              |
| `ExcelHandler.ts`   | Excel file operations | `readFile()`, `writeFile()`, `getSheetNames()`            |
| `DataGenerator.ts`  | Fake data generation  | `generateUser()`, `generateEmail()`, `generatePassword()` |
| `Logger.ts`         | Structured logging    | `info()`, `debug()`, `warn()`, `error()`                  |
| `SftpClient.ts`     | SFTP file transfers   | `connect()`, `uploadFile()`, `downloadFile()`             |
| `EmailValidator.ts` | Email inbox checking  | `connect()`, `waitForEmail()`, `getUnreadEmails()`        |

---

### `/tests/` - Test Specifications

Test files organized by type and category:

```
tests/
├── api/                     # API tests
│   └── users.api.spec.ts    # User API tests
│
├── database/                # Database validation tests
│   └── userData.db.spec.ts  # User data validation
│
├── keyword/                 # Keyword-driven tests
│   └── keywordTest.spec.ts  # JSON/Excel based tests
│
├── mobile/                  # Mobile emulation tests
│   └── responsive.mobile.spec.ts
│
└── ui/                      # UI tests
    ├── health-check/        # Health checks
    │   └── health.spec.ts
    ├── smoke/               # Quick verification (5-10 tests)
    │   └── login.smoke.spec.ts
    ├── sanity/              # Core functionality (20-30 tests)
    │   └── dashboard.sanity.spec.ts
    └── regression/          # Full regression (50+ tests)
        └── userJourney.regression.spec.ts
```

**Naming Convention**: `{feature}.{type}.spec.ts`

| Type         | Purpose            | Run Frequency  |
| ------------ | ------------------ | -------------- |
| `smoke`      | Quick verification | Every commit   |
| `sanity`     | Core features      | Daily          |
| `regression` | Full coverage      | Weekly/Release |
| `api`        | Backend validation | Every commit   |
| `db`         | Data integrity     | Daily          |

---

### `/test-data/` - Test Data Files

```
test-data/
├── config/                  # Environment-specific data
│   └── environments.json    # URLs, credentials per env
├── users.json               # User test data (JSON format)
├── users.csv                # User test data (CSV format)
├── login-scenarios.json     # Keyword test scenarios
└── test-cases.xlsx          # Excel test cases
```

**Guidelines**:

- Use JSON for structured data
- Use CSV for tabular data
- Use Excel when business team maintains data
- Never commit real credentials

---

### Root Configuration Files

| File                   | Purpose                     | When to Modify                |
| ---------------------- | --------------------------- | ----------------------------- |
| `.env`                 | Local environment variables | Per-developer (gitignored)    |
| `.env.example`         | Environment template        | Add new variables here        |
| `.eslintrc.json`       | Linting rules               | Customize code standards      |
| `.prettierrc`          | Formatting rules            | Customize code style          |
| `package.json`         | Dependencies & scripts      | Add packages, scripts         |
| `playwright.config.ts` | Test configuration          | Browsers, timeouts, reporters |
| `tsconfig.json`        | TypeScript settings         | Path aliases, strictness      |

---

## Quick Reference: Where to Put Things

| I want to...                   | Put it in...            |
| ------------------------------ | ----------------------- |
| Add a new page object          | `src/pages/{feature}/`  |
| Add a new utility function     | `src/utils/`            |
| Add a new API endpoint wrapper | `src/api/endpoints/`    |
| Add a smoke test               | `tests/ui/smoke/`       |
| Add API test                   | `tests/api/`            |
| Add test data                  | `test-data/`            |
| Add environment variable       | `.env.example` + `.env` |
| Document something             | `docs/`                 |

---

## See Also

- [Architecture Overview](ARCHITECTURE.md) - Design patterns
- [Onboarding Guide](ONBOARDING.md) - Getting started
- [Git Workflow](GIT_BRANCHING.md) - Version control

---

**Well-organized code is half the battle won!** 📁
