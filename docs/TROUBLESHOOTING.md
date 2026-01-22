# Troubleshooting Guide

> **For Beginners**: This guide helps you solve common issues encountered when using the PTF framework.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Test Execution Issues](#test-execution-issues)
3. [Browser Issues](#browser-issues)
4. [Configuration Issues](#configuration-issues)
5. [IDE/TypeScript Issues](#idetypescript-issues)
6. [CI/CD Issues](#cicd-issues)

---

## Installation Issues

### Node.js Version Mismatch

**Error**: `engine "node" is incompatible with this module`

**Solution**:

```bash
# Check your Node version
node --version

# Install correct version (18+)
nvm install 20
nvm use 20
```

### npm install fails

**Error**: `npm ERR! code ERESOLVE`

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Playwright browsers not found

**Error**: `browserType.launch: Executable doesn't exist`

**Solution**:

```bash
# Install Playwright browsers
npx playwright install

# Or install specific browser
npx playwright install chromium
```

---

## Test Execution Issues

### Tests timeout

**Error**: `Test timeout of 30000ms exceeded`

**Solutions**:

1. **Increase timeout in test**:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

2. **Increase global timeout** in `playwright.config.ts`:

```typescript
timeout: 120000, // 2 minutes
```

3. **Check for slow page loads**:

```typescript
await page.goto('/slow-page', { timeout: 60000 });
```

### Element not found

**Error**: `locator.click: Timeout 15000ms exceeded`

**Solutions**:

1. **Wait for element explicitly**:

```typescript
await page.waitForSelector('#my-element', { state: 'visible' });
```

2. **Check selector is correct**:

```typescript
// Use Playwright Inspector
npx playwright test --debug
```

3. **Increase action timeout**:

```typescript
await page.click('#slow-button', { timeout: 30000 });
```

### Tests are flaky (intermittent failures)

**Solutions**:

1. **Avoid fixed waits**:

```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await page.waitForSelector('#element');
await page.waitForLoadState('networkidle');
```

2. **Use proper assertions**:

```typescript
// ❌ Bad - checking immediately
const text = await page.textContent('#result');
expect(text).toBe('Success');

// ✅ Good - using auto-wait
await expect(page.locator('#result')).toHaveText('Success');
```

3. **Re-run with retries**:

```bash
npx playwright test --retries=2
```

### API test returns 403

**Possible causes**:

- Rate limiting
- Missing authentication
- Cloudflare/bot protection

**Solutions**:

1. **Add User-Agent header**:

```typescript
await request.get('/api/users', {
  headers: { 'User-Agent': 'Mozilla/5.0 ...' },
});
```

2. **Use different test API** (e.g., jsonplaceholder.typicode.com instead of reqres.in)

3. **Check authentication token is valid**

---

## Browser Issues

### Chrome not starting

**Error**: `Failed to launch chromium`

**Solutions**:

1. **Reinstall browsers**:

```bash
npx playwright install chromium
```

2. **Install dependencies (Linux)**:

```bash
npx playwright install-deps
```

3. **Check for running Chrome processes**:

```bash
# Windows
taskkill /F /IM chrome.exe

# Mac/Linux
pkill -f chromium
```

### Headed mode not showing browser

**Solution**: Ensure you're running with `--headed`:

```bash
npx playwright test --headed
```

### Screenshots/videos not saving

**Check** `playwright.config.ts`:

```typescript
use: {
  screenshot: 'only-on-failure', // or 'on'
  video: 'retain-on-failure',    // or 'on'
}
```

---

## Configuration Issues

### Environment not switching

**Error**: Tests always run against wrong URL

**Solutions**:

1. **Check .env file exists** (copy from .env.example)

2. **Use cross-env for Windows**:

```bash
npx cross-env TEST_ENV=uat playwright test
```

3. **Verify env variable is read**:

```typescript
console.log('Current env:', process.env.TEST_ENV);
```

### Database connection fails

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Solutions**:

1. **Check database is running**:

```bash
docker-compose up -d postgres
```

2. **Verify credentials in .env**:

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=testdb
PG_USER=testuser
PG_PASSWORD=yourpassword
```

3. **Check SSL settings**:

```env
PG_SSL=false  # For local development
```

---

## IDE/TypeScript Issues

### "Cannot find module" error

**Solution**:

```bash
# Reinstall dependencies
npm install

# Restart VS Code
# Or reload TypeScript: Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### Red squiggles everywhere

**Solutions**:

1. **Check tsconfig.json exists and is valid**

2. **Restart TypeScript server**:
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

3. **Verify types are installed**:

```bash
npm install --save-dev @types/node
```

### ESLint not working

**Solutions**:

1. **Install ESLint extension** in VS Code

2. **Check .eslintrc.json exists**

3. **Run lint manually**:

```bash
npm run lint
```

---

## CI/CD Issues

### Tests fail only in CI

**Common causes and solutions**:

1. **Different viewport size**:

```typescript
// Set explicit viewport
await page.setViewportSize({ width: 1920, height: 1080 });
```

2. **Missing browsers**:

```yaml
- run: npx playwright install --with-deps
```

3. **Font rendering differences** (visual tests):
   - Use `maxDiffPixelRatio: 0.05` for tolerance

4. **Timezone differences**:

```yaml
env:
  TZ: UTC
```

### Artifacts not uploading

**Check** your CI config has artifact upload step:

```yaml
- uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Out of memory

**Solutions**:

1. **Reduce parallel workers**:

```yaml
- run: npx playwright test --workers=2
```

2. **Run browser tests in separate jobs**

---

## Quick Fixes Summary

| Issue              | Quick Fix                    |
| ------------------ | ---------------------------- |
| Browser not found  | `npx playwright install`     |
| Module not found   | `npm install`                |
| Tests timeout      | Increase timeout in config   |
| Element not found  | Use `waitForSelector()`      |
| Flaky tests        | Avoid `waitForTimeout()`     |
| Config not loading | Check `.env` file exists     |
| TypeScript errors  | Restart TS Server            |
| CI failures        | Add `--with-deps` to install |

---

## Getting More Help

1. **Check existing tests** for working examples
2. **Run in debug mode**: `npx playwright test --debug`
3. **Use UI mode**: `npx playwright test --ui`
4. **View trace**: `npx playwright show-trace trace.zip`
5. **Check Playwright docs**: [playwright.dev](https://playwright.dev)

---

**Most issues are solved by: reinstalling, restarting, or re-reading the error message carefully!** 🔧
