import { chromium, FullConfig } from '@playwright/test';
import { config as frameworkConfig } from './config';

/**
 * Global Setup for Playwright
 * Authenticates once and saves the storage state for reuse in tests.
 */
async function globalSetup(playwrightConfig: FullConfig): Promise<void> {
  const { storageState } = playwrightConfig.projects[0].use;

  if (!storageState) {
    // eslint-disable-next-line no-console
    console.log('No storageState path defined in config, skipping global auth.');
    return;
  }

  // Use the standard user credentials from framework config
  const { username, password } = frameworkConfig.credentials.sauce;

  // eslint-disable-next-line no-console
  console.log(`Global Setup: Authenticating as ${username}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(frameworkConfig.baseUrl);

    // Perform Login
    await page.fill('#user-name', username);
    await page.fill('#password', password);
    await page.click('#login-button');

    // Simple verification (wait for inventory)
    await page.waitForURL('**/inventory.html');

    // Save storage state
    await page.context().storageState({ path: storageState as string });
    // eslint-disable-next-line no-console
    console.log(`Global Setup: Auth state saved to ${storageState as string}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Global Setup Failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
