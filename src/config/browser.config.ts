/**
 * @fileoverview Browser configuration for Playwright tests.
 * Defines browser-specific settings and device emulation profiles.
 *
 * @module config/browser
 * @author DG
 * @version 1.0.0
 */

import { devices } from '@playwright/test';

/**
 * Supported browser types
 */
export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'edge';

/**
 * Browser configuration interface
 */
export interface BrowserConfig {
  /** Browser type */
  type: BrowserType;
  /** Browser display name */
  displayName: string;
  /** Browser channel (e.g., 'chrome', 'msedge') */
  channel?: string;
  /** Default viewport size */
  viewport: { width: number; height: number };
  /** User agent string override */
  userAgent?: string;
  /** Device scale factor */
  deviceScaleFactor?: number;
  /** Whether the browser has touch capabilities */
  hasTouch?: boolean;
  /** Whether the browser is mobile */
  isMobile?: boolean;
}

/**
 * Desktop browser configurations
 */
export const desktopBrowsers: Record<string, BrowserConfig> = {
  chrome: {
    type: 'chromium',
    displayName: 'Google Chrome',
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
  },
  firefox: {
    type: 'firefox',
    displayName: 'Mozilla Firefox',
    viewport: { width: 1920, height: 1080 },
  },
  webkit: {
    type: 'webkit',
    displayName: 'Safari',
    viewport: { width: 1920, height: 1080 },
  },
  edge: {
    type: 'chromium',
    displayName: 'Microsoft Edge',
    channel: 'msedge',
    viewport: { width: 1920, height: 1080 },
  },
};

/**
 * Mobile device configurations using Playwright's built-in device descriptors
 */
export const mobileDevices = {
  /** iPhone 13 configuration */
  iphone13: {
    ...devices['iPhone 13'],
    displayName: 'iPhone 13',
  },
  /** iPhone 13 Pro Max configuration */
  iphone13ProMax: {
    ...devices['iPhone 13 Pro Max'],
    displayName: 'iPhone 13 Pro Max',
  },
  /** Pixel 5 configuration */
  pixel5: {
    ...devices['Pixel 5'],
    displayName: 'Google Pixel 5',
  },
  /** Samsung Galaxy S21 configuration */
  galaxyS21: {
    ...devices['Galaxy S III'],
    displayName: 'Samsung Galaxy S21',
  },
  /** iPad Pro 11 configuration */
  ipadPro: {
    ...devices['iPad Pro 11'],
    displayName: 'iPad Pro 11',
  },
  /** Galaxy Tab S4 configuration */
  galaxyTab: {
    ...devices['Galaxy Tab S4'],
    displayName: 'Galaxy Tab S4',
  },
};

/**
 * Common viewport sizes for responsive testing
 */
export const viewportSizes = {
  /** Full HD desktop */
  desktop: { width: 1920, height: 1080 },
  /** Laptop screen */
  laptop: { width: 1366, height: 768 },
  /** Tablet landscape */
  tabletLandscape: { width: 1024, height: 768 },
  /** Tablet portrait */
  tabletPortrait: { width: 768, height: 1024 },
  /** Mobile landscape */
  mobileLandscape: { width: 667, height: 375 },
  /** Mobile portrait */
  mobilePortrait: { width: 375, height: 667 },
};

/**
 * Get browser configuration by name
 * @param browserName - Name of the browser (chrome, firefox, webkit, edge)
 * @returns Browser configuration object
 */
export function getBrowserConfig(browserName: string): BrowserConfig {
  const browser = desktopBrowsers[browserName.toLowerCase()];
  if (!browser) {
    throw new Error(`Unknown browser: ${browserName}. Supported: ${Object.keys(desktopBrowsers).join(', ')}`);
  }
  return browser;
}

/**
 * Get mobile device configuration by name
 * @param deviceName - Name of the device
 * @returns Device configuration object
 */
export function getMobileDevice(deviceName: keyof typeof mobileDevices): typeof mobileDevices[keyof typeof mobileDevices] {
  const device = mobileDevices[deviceName];
  if (!device) {
    throw new Error(`Unknown device: ${deviceName}. Supported: ${Object.keys(mobileDevices).join(', ')}`);
  }
  return device;
}

export default {
  desktopBrowsers,
  mobileDevices,
  viewportSizes,
  getBrowserConfig,
  getMobileDevice,
};
