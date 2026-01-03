import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for A11yScan
 * This config is primarily for the audit service, not for testing
 */
export default defineConfig({
  testDir: './apps/api/tests',
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

