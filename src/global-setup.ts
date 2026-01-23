import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { config as frameworkConfig } from './config';

/**
 * Global Setup for Playwright
 * Authenticates once and saves the storage state for reuse in tests.
 *
 * Gracefully handles site unavailability to avoid blocking all tests.
 */
async function globalSetup(playwrightConfig: FullConfig): Promise<void> {
  const { storageState } = playwrightConfig.projects[0].use;

  if (!storageState) {
    // eslint-disable-next-line no-console
    console.log('No storageState path defined in config, skipping global auth.');
    return;
  }

  // Check if storage state already exists (reuse from previous run)
  if (fs.existsSync(storageState as string)) {
    // eslint-disable-next-line no-console
    console.log(`Global Setup: Using existing storage state from ${String(storageState)}`);
    return;
  }

  // Use the standard user credentials from framework config
  const { username, password } = frameworkConfig.credentials.sauce;
  const baseUrl = frameworkConfig.baseUrl;

  // eslint-disable-next-line no-console
  console.log(`Global Setup: Authenticating as ${username} at ${baseUrl}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page with timeout
    const response = await page.goto(baseUrl, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });

    // Check if page loaded successfully
    if (!response || !response.ok()) {
      // eslint-disable-next-line no-console
      console.warn(
        `Global Setup: Site returned ${response?.status() || 'no response'}. Creating empty storage state.`
      );
      await createEmptyStorageState(storageState as string);
      return;
    }

    // Wait for the username field with shorter timeout
    try {
      await page.waitForSelector('#user-name', { state: 'visible', timeout: 5000 });
    } catch {
      // eslint-disable-next-line no-console
      console.warn(
        'Global Setup: Login form not found. Site may have changed. Creating empty storage state.'
      );
      await createEmptyStorageState(storageState as string);
      return;
    }

    // Perform Login
    await page.fill('#user-name', username);
    await page.fill('#password', password);
    await page.click('#login-button');

    // Wait for successful login
    await page.waitForURL('**/inventory.html', { timeout: 10000 });

    // Save storage state
    await page.context().storageState({ path: storageState as string });
    // eslint-disable-next-line no-console
    console.log(`Global Setup: Auth state saved to ${storageState}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Global Setup: Auth failed. Tests will run without pre-authenticated state.');
    // eslint-disable-next-line no-console
    console.warn('Current URL:', page.url());
    // eslint-disable-next-line no-console
    console.warn('Error:', (error as Error).message);

    // Create empty storage state so tests can still run
    await createEmptyStorageState(storageState as string);
  } finally {
    await browser.close();
  }
}

/**
 * Creates an empty storage state file so tests don't fail looking for it
 */
async function createEmptyStorageState(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const emptyState = {
    cookies: [],
    origins: [],
  };

  fs.writeFileSync(filePath, JSON.stringify(emptyState, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Global Setup: Created empty storage state at ${String(filePath)}`);
}

export default globalSetup;
