import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for A11yScan API
 * This config is for future E2E tests of the audit service
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent resource exhaustion
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    headless: true,
  },
});
