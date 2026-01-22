# Playwright Test Framework (PTF)

> **Enterprise-grade test automation framework** built with Playwright and TypeScript.

[![Playwright Tests](https://github.com/yourusername/ptf/actions/workflows/playwright.yml/badge.svg)](https://github.com/yourusername/ptf/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40+-green.svg)](https://playwright.dev/)

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd PTF
npm install

# 2. Install browsers
npx playwright install

# 3. Run tests
npm test                    # All tests
npm run test:smoke          # Quick verification
npm run test:headed         # Watch tests run
```

**New to the framework?**

- 🎓 **Start Here:** [Zero to Hero Training Guide](docs/TRAINING_GUIDE.md) - Interactive course
- 📘 [Onboarding Guide](docs/ONBOARDING.md) - Reference handbook

---

## ✨ Features

| Feature                 | Description                            |
| ----------------------- | -------------------------------------- |
| **Page Object Model**   | Maintainable, reusable UI abstractions |
| **Data-Driven Testing** | CSV, Excel, JSON test data support     |
| **Multi-Browser**       | Chromium, Firefox, WebKit, Edge        |
| **Mobile Emulation**    | iPhone, Android, Tablet viewports      |
| **API Testing**         | Built-in REST client with retries      |
| **Database Testing**    | PostgreSQL, Oracle connectivity        |
| **Keyword-Driven**      | Excel/JSON based test definitions      |
| **CI/CD Ready**         | GitHub Actions, Azure DevOps, Jenkins  |
| **Rich Reporting**      | HTML reports, traces, screenshots      |

---

## 📁 Project Structure

```
PTF/
├── src/                    # Framework source code
│   ├── api/                # API testing components
│   ├── config/             # Configuration management
│   ├── core/               # Core framework (BasePage, fixtures)
│   ├── database/           # Database clients (PostgreSQL, Oracle)
│   ├── keywords/           # Keyword-driven engine
│   ├── pages/              # Page Object Models
│   └── utils/              # Utilities (CSV, Excel, Logger, etc.)
├── tests/                  # Test specifications
│   ├── ui/                 # UI tests (smoke, sanity, regression)
│   ├── api/                # API tests
│   ├── database/           # Database tests
│   └── mobile/             # Mobile emulation tests
├── test-data/              # Test data files
├── docs/                   # 📚 Documentation
└── docker/                 # Docker configuration
```

📖 See [Folder Structure](docs/FOLDER_STRUCTURE.md) for complete reference.

---

## ⚙️ Configuration

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
code .env
```

### Switch Environments

```bash
npm test                    # Default (SIT)
TEST_ENV=uat npm test       # UAT environment
TEST_ENV=fat npm test       # FAT environment
```

### Key Environment Variables

| Variable       | Description         | Example                       |
| -------------- | ------------------- | ----------------------------- |
| `TEST_ENV`     | Target environment  | `sit`, `fat`, `uat`           |
| `SIT_BASE_URL` | SIT application URL | `https://app.sit.example.com` |
| `PG_HOST`      | PostgreSQL host     | `localhost`                   |
| `LOG_LEVEL`    | Logging verbosity   | `debug`, `info`, `warn`       |

📖 See [Onboarding Guide](docs/ONBOARDING.md#5-configuration-deep-dive) for complete configuration reference.

---

## 🧪 Running Tests

### By Category

```bash
npm run test:smoke          # Quick verification (5-10 tests)
npm run test:sanity         # Core functionality
npm run test:regression     # Full regression suite
npm run test:api            # API tests only
npm run test:db             # Database tests only
npm run test:mobile         # Mobile emulation tests
npm run test:a11y           # Accessibility tests
npm run test:visual         # Visual regression tests
npm run test:quick          # Single browser, headed (developers)
```

### By Tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep @critical
npx playwright test --grep "@smoke|@sanity"
```

### Debugging

```bash
npx playwright test --ui                    # Interactive UI mode
npx playwright test --debug                 # Step-by-step debugger
npx playwright test --headed --slowmo=500   # Slow motion
```

### View Reports

```bash
npx playwright show-report                  # HTML report
npx playwright show-trace trace.zip         # Trace viewer
npm run report:allure                       # Allure report
```

---

## 🏷️ Test Tags

| Tag            | Purpose            | Run Frequency  |
| -------------- | ------------------ | -------------- |
| `@smoke`       | Quick verification | Every commit   |
| `@sanity`      | Core functionality | Daily          |
| `@regression`  | Full coverage      | Weekly/Release |
| `@critical`    | Business-critical  | Every commit   |
| `@api`         | API tests          | Every commit   |
| `@db`          | Database tests     | Daily          |
| `@mobile`      | Mobile tests       | Daily          |
| `@a11y`        | Accessibility      | Daily          |
| `@visual`      | Visual regression  | Weekly         |
| `@performance` | Web Vitals         | Weekly         |

Usage: `test('my test @smoke @critical', async ({ page }) => { ... })`

---

## 🐳 Docker

```bash
cd docker
docker-compose up playwright-tests
```

---

## 🔄 CI/CD Integration

| Platform           | Configuration                         |
| ------------------ | ------------------------------------- |
| **GitHub Actions** | `.github/workflows/playwright.yml`    |
| **Azure DevOps**   | `azure-pipelines/azure-pipelines.yml` |
| **Jenkins**        | `jenkins/Jenkinsfile`                 |

---

## 📚 Documentation

| Document                                         | Description                            |
| ------------------------------------------------ | -------------------------------------- |
| [**Onboarding Guide**](docs/ONBOARDING.md)       | Complete beginner's handbook           |
| [**Architecture**](docs/ARCHITECTURE.md)         | Design patterns and component overview |
| [**Folder Structure**](docs/FOLDER_STRUCTURE.md) | Detailed file reference                |
| [**Git Workflow**](docs/GIT_BRANCHING.md)        | Branching strategy and commands        |
| [**Troubleshooting**](docs/TROUBLESHOOTING.md)   | Common issues and solutions            |
| [**Knowledge Base**](knowledge-base/README.md)   | Issues and solutions                   |

---

## 🛠️ Utilities Reference

> **Tip**: Use barrel imports: `import { DataGenerator, StringUtils } from '../utils'`

| Utility               | Purpose                       |
| --------------------- | ----------------------------- |
| `DataGenerator`       | Generate fake test data       |
| `UserFactory`         | Builder pattern for test data |
| `StringUtils`         | String manipulation utilities |
| `CsvHandler`          | Read/write CSV files          |
| `ExcelHandler`        | Read/write Excel files        |
| `SchemaValidator`     | API schema validation         |
| `AccessibilityHelper` | WCAG compliance testing       |
| `PerformanceMetrics`  | Core Web Vitals               |
| `logger`              | Structured logging            |
| `SftpHandler`         | SFTP file operations          |
| `EmailValidator`      | Email inbox verification      |

---

## 📝 Contributing

1. Create feature branch from `dev1`
2. Follow [Git Workflow](docs/GIT_BRANCHING.md)
3. Write tests with appropriate tags
4. Create Pull Request

---

## 📄 License

MIT

---

**Happy Testing! 🎭**
