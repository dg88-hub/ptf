# CLI Scaffolding Tool Guide

> Automated code generation for page objects, tests, and utilities

---

## Overview

The PTF CLI tool helps you quickly scaffold new test files, page objects, and utilities with standardized templates.

**Status**: 🚧 Planned Feature (Implementation Guide)

---

## Proposed Architecture

```
ptf-cli/
├── bin/
│   └── ptf.js          # CLI entry point
├── templates/
│   ├── test.hbs        # Test file template
│   ├── page.hbs        # Page object template
│   └── component.hbs   # Component template
└── commands/
    ├── generate.ts     # Generate command
    ├── init.ts         # Initialize command
    └── validate.ts     # Validate command
```

---

## Installation (Future)

```bash
npm install --global @ptf/cli

# Or use npx
npx @ptf/cli generate page LoginPage
```

---

## Proposed Commands

### 1. Generate Page Object

```bash
ptf generate page LoginPage

# Creates:
# src/pages/[app]/LoginPage.ts
```

**Generated Code**:

```typescript
import { BasePage } from '@core/BasePage';
import { Page } from '@playwright/test';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  public readonly usernameInput = this.page.locator('#username');
  public readonly passwordInput = this.page.locator('#password');
  public readonly submitButton = this.page.locator('button[type="submit"]');

  // Actions
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### 2. Generate Test File

```bash
ptf generate test login.spec.ts

# Creates:
# tests/login.spec.ts
```

**Generated Code**:

```typescript
import { test, expect } from '@core/fixtures';

test.describe('Login Tests', () => {
  test.beforeEach(async ({ app }) => {
    await app.login.open();
  });

  test('should login successfully', async ({ app }) => {
    // Arrange
    const username = 'testuser';
    const password = 'password123';

    // Act
    await app.login.login(username, password);

    // Assert
    await expect(app.dashboard.welcomeMessage).toBeVisible();
  });
});
```

### 3. Generate Component

```bash
ptf generate component NavigationMenu

# Creates:
# src/components/NavigationMenu.ts
```

### 4. Generate Utility

```bash
ptf generate utility DateFormatter

# Creates:
# src/utils/DateFormatter.ts
```

### 5. Initialize New App

```bash
ptf init myapp

# Creates:
# src/pages/myapp/
# ├── MyAppBasePage.ts
# └── index.ts
```

---

##Implementation Example

### CLI Entry Point

```typescript
#!/usr/bin/env node
// bin/ptf.js

import { Command } from 'commander';
import { generatePage, generateTest } from './commands/generate';

const program = new Command();

program.name('ptf').description('PTF Framework CLI').version('1.0.0');

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate code from template')
  .option('-a, --app <app>', 'Application name')
  .action((type, name, options) => {
    switch (type) {
      case 'page':
        generatePage(name, options.app);
        break;
      case 'test':
        generateTest(name);
        break;
      default:
        console.error(`Unknown type: ${type}`);
    }
  });

program.parse();
```

### Template System

```typescript
// commands/generate.ts
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

export function generatePage(name: string, app: string = 'sample') {
  const templatePath = path.join(__dirname, '../templates/page.hbs');
  const template = Handlebars.compile(fs.readFileSync(templatePath, 'utf-8'));

  const code = template({
    className: name,
    app,
    timestamp: new Date().toISOString(),
  });

  const outputPath = path.join(process.cwd(), `src/pages/${app}/${name}.ts`);
  fs.writeFileSync(outputPath, code);

  console.log(`✅ Created ${outputPath}`);
}
```

### Template File

```handlebars
{{! templates/page.hbs }}
/** * @fileoverview
{{className}}
page object * @module pages/{{app}}/{{className}}
* * Generated:
{{timestamp}}
*/ import { BasePage } from '@core/BasePage'; import { Page } from '@playwright/test'; export class
{{className}}
extends BasePage { constructor(page: Page) { super(page); } // TODO: Add locators here // public
readonly element = this.page.locator('selector'); // TODO: Add actions here // async doSomething()
{} }
```

---

## Interactive Mode

```bash
? What would you like to generate?
  ❯ Page Object
    Test File
    Component
    Utility

? Enter page name: LoginPage
? Select application:
  ❯ saucedemo
    parabank
    sample
    [Create new app]

✅ Created src/pages/saucedemo/LoginPage.ts
✅ Updated src/pages/saucedemo/index.ts
```

---

## Configuration

```json
// ptf.config.json
{
  "templatesDir": "./templates",
  "outputDir": {
    "pages": "./src/pages",
    "tests": "./tests",
    "utils": "./src/utils"
  },
  "naming": {
    "convention": "PascalCase",
    "suffix": {
      "page": "Page",
      "test": ".spec.ts"
    }
  }
}
```

---

## VS Code Extension (Future)

Right-click in Explorer → `PTF: Generate Page Object`

---

## Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Inquirer.js (Interactive prompts)](https://github.com/SBoudrias/Inquirer.js)

---

_Status: Planning Phase | January 2026_
