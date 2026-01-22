/**
 * ESLint Configuration for PTF Framework
 * =======================================
 *
 * This file configures ESLint for TypeScript and Playwright test files.
 * It enforces code quality, catches common errors, and ensures consistency.
 *
 * Configuration sections:
 * - Parser: TypeScript-ESLint for .ts file analysis
 * - Plugins: TypeScript rules + Playwright-specific rules
 * - Rules: Organized by category (TypeScript, Playwright, General)
 *
 * Run linting: npm run lint
 * Fix auto-fixable issues: npm run lint:fix
 *
 * @see https://eslint.org/docs/rules/
 * @see https://typescript-eslint.io/rules/
 * @see https://github.com/playwright-community/eslint-plugin-playwright
 */
module.exports = {
  // =============================================
  // Parser Configuration
  // =============================================
  root: true, // Don't look for configs in parent directories
  parser: '@typescript-eslint/parser', // Use TypeScript parser
  parserOptions: {
    ecmaVersion: 2022, // Support modern ECMAScript features
    sourceType: 'module', // Use ES modules
    project: './tsconfig.json', // Use project's TypeScript config
  },

  // =============================================
  // Plugins
  // =============================================
  plugins: [
    '@typescript-eslint', // TypeScript-specific rules
    'playwright', // Playwright test best practices
  ],

  // =============================================
  // Extended Configurations
  // =============================================
  extends: [
    'eslint:recommended', // ESLint recommended rules
    'plugin:@typescript-eslint/recommended', // TS recommended rules
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // Type-aware rules
    'plugin:playwright/recommended', // Playwright best practices
    'prettier', // Disable rules that conflict with Prettier
  ],

  // =============================================
  // Environment
  // =============================================
  env: {
    node: true, // Node.js global variables
    es2022: true, // ES2022 globals
  },

  // =============================================
  // Ignored Paths
  // =============================================
  ignorePatterns: [
    'dist/', // Build output
    'node_modules/', // Dependencies
    'playwright-report/', // Test reports
    'test-results/', // Test artifacts
    'scripts/', // Tooling scripts
    'vitest.config.ts', // Vitest config
  ],

  // =============================================
  // Rules
  // =============================================
  rules: {
    // -----------------------------------------
    // TypeScript: Async/Promise Handling
    // -----------------------------------------
    '@typescript-eslint/no-floating-promises': 'error', // Must handle promises
    '@typescript-eslint/await-thenable': 'error', // Only await promises
    '@typescript-eslint/no-misused-promises': 'error', // Correct promise usage

    // -----------------------------------------
    // TypeScript: Code Quality
    // -----------------------------------------
    '@typescript-eslint/explicit-function-return-type': 'warn', // Document return types
    '@typescript-eslint/no-explicit-any': 'warn', // Discourage 'any'
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_', // Allow _unused parameters
      },
    ],
    '@typescript-eslint/prefer-optional-chain': 'error', // Use ?. operator
    '@typescript-eslint/strict-boolean-expressions': 'off', // Allow implicit booleans

    // -----------------------------------------
    // TypeScript: Relaxed for Dynamic Data
    // These are disabled to allow flexible test data handling
    // -----------------------------------------
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    'no-case-declarations': 'off',

    // -----------------------------------------
    // Playwright: Test Best Practices
    // -----------------------------------------
    'playwright/no-focused-test': 'error', // No test.only() in commits
    'playwright/no-skipped-test': 'warn', // Warn on test.skip()
    'playwright/valid-expect': 'error', // Valid expect() usage
    'playwright/expect-expect': 'off', // Allow tests without expect (Page Objects)
    'playwright/no-wait-for-timeout': 'warn', // Discourage hard waits
    'playwright/no-force-option': 'warn', // Discourage force: true

    // -----------------------------------------
    // General: Code Quality
    // -----------------------------------------
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'], // Allow console.warn/error
      },
    ],
    'prefer-const': 'error', // Use const when possible
    'no-var': 'error', // Disallow var
    eqeqeq: ['error', 'always'], // Require === and !==
    curly: ['error', 'all'], // Require braces for all blocks
  },

  // =============================================
  // Overrides for Specific File Types
  // =============================================
  overrides: [
    {
      // Relaxed rules for test files
      files: ['**/*.spec.ts', '**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in tests
        'no-console': 'off', // Allow console.log in tests
      },
    },
  ],
};
