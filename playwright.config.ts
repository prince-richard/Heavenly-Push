import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Heavenly Push web build.
 *
 * Runs end-to-end tests against `expo start --web`. The dev server is
 * started automatically by Playwright via the `webServer` block, so
 * `npx playwright test` is the only command you need.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    // Grant the web app permission for mic/geolocation-style features
    // that the voice-first UI might probe for.
    permissions: [],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    // Expo web bundling from cold can take a while.
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
