import { defineConfig, devices } from '@playwright/test';

/*
 * Chromium always runs. Firefox / WebKit join with `K3UI_E2E_ALL_BROWSERS=1`
 * (they need `npx playwright install firefox webkit`).
 * `PW_CHROMIUM_PATH` points at a pre-installed Chromium (offline CI, containers).
 */
const chromiumPath = process.env.PW_CHROMIUM_PATH || undefined;
const allBrowsers = process.env.K3UI_E2E_ALL_BROWSERS === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
      },
    },
    ...(allBrowsers
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
