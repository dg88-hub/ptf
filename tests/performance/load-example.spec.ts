import { expect, test } from '../../src/core/fixtures';
import { LoadTestRunner } from '../../src/performance/LoadTestRunner';

test.describe('Performance Load Tests @load', () => {
  test('should support sustained load on login flow @performance', async ({ app }) => {
    // 1. Setup - Page Object creation handled by app fixture

    // 2. Configure Load Test
    const runner = new LoadTestRunner({
      testName: 'SauceDemo Login Load',
      duration: 10 * 1000, // Run for 10 seconds (short for demo)
      pacing: 1000, // Minimum 1 second per iteration
      thinkTime: 500, // Simulate user thinking for 500ms
    });

    // 3. Define the critical transaction
    const report = await runner.run(async () => {
      // Use facade to access page objects
      await app.sauce.loginPage.navigateToLogin();

      await app.sauce.loginPage.login({
        username: 'standard_user',
        password: 'secret_sauce',
      });

      // Verify login success to count as "PASS"
      await app.sauce.loginPage.verifyLoginSuccess();

      // Cleanup for next iteration (logout or reset)
      // Note: For simple load tests, re-navigating usually works,
      // but proper cleanup makes metrics cleaner.
      await app.sauce.loginPage.navigateToLogin();
    });

    // 4. Assert Performance Goals
    expect(report.errorRate).toBe(0); // 0% failures
    expect(report.duration.p95).toBeLessThan(5000); // 95% of logins < 5s
    expect(report.throughput).toBeGreaterThan(0.5); // At least 0.5 TPS
  });
});
