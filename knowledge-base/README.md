# Knowledge Base

Centralized repository for known issues, resolutions, and best practices.

## Quick Links

- [Issue Template](issues/ISSUE_TEMPLATE.md)
- [Common Issues](#common-issues)
- [Best Practices](#best-practices)

## Common Issues

### KI-001: Flaky Test - Element Not Found
**Symptoms**: Test intermittently fails with "element not found"

**Root Cause**: Dynamic content loading, race conditions

**Resolution**:
```typescript
// Use explicit waits instead of hardcoded timeouts
await page.locator('#element').waitFor({ state: 'visible' });
// OR use auto-waiting assertions
await expect(page.locator('#element')).toBeVisible();
```

### KI-002: Database Connection Timeout
**Symptoms**: Tests fail with "connection timeout" in CI

**Root Cause**: Database not accessible from CI environment

**Resolution**: Ensure database is network-accessible or use test.skip()
```typescript
test.skip(!config.postgresDb, 'Database not configured');
```

### KI-003: Screenshot Mismatch on CI
**Symptoms**: Visual tests pass locally but fail on CI

**Root Cause**: Font rendering differences between environments

**Resolution**: Use Docker for consistent environment or increase tolerance

## Best Practices

1. **Always use data-testid** for reliable element selection
2. **Avoid hardcoded waits** - use Playwright's auto-waiting
3. **Tag tests appropriately** - @smoke, @regression, etc.
4. **Keep tests independent** - no shared state between tests
5. **Use Page Objects** - encapsulate page interactions

## Adding New Issues

Use the [Issue Template](issues/ISSUE_TEMPLATE.md) to document new issues.
