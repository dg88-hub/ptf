/**
 * =============================================
 * Prettier Configuration for PTF Framework
 * =============================================
 * Prettier auto-formats code on save.
 * These settings ensure consistent code style across the team.
 *
 * Run manually: npm run format
 * Check without fixing: npx prettier --check .
 *
 * @see https://prettier.io/docs/en/options.html
 */
module.exports = {
  // ---------------------
  // Punctuation
  // ---------------------
  semi: true, // Add semicolons at end of statements
  singleQuote: true, // Use 'single quotes' instead of "double"
  quoteProps: "as-needed", // Only quote object keys when necessary
  trailingComma: "es5", // Add trailing commas (ES5 compatible: objects, arrays)

  // ---------------------
  // Indentation & Spacing
  // ---------------------
  tabWidth: 2, // 2 spaces per indentation level
  useTabs: false, // Use spaces, not tabs
  bracketSpacing: true, // Space inside object braces: { foo: bar }

  // ---------------------
  // Line Formatting
  // ---------------------
  printWidth: 100, // Wrap lines at 100 characters
  endOfLine: "lf", // Use Unix line endings (LF) for cross-platform

  // ---------------------
  // Functions
  // ---------------------
  arrowParens: "always", // Always wrap arrow function params: (x) => x
};
