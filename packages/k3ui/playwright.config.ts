import { defineConfig, devices } from '@playwright/test';

/*
 * Chromium desktop always runs.
 * Mobile Chromium emulations: `K3UI_E2E_MOBILE=1` (no extra browser install).
 * Firefox / WebKit: `K3UI_E2E_ALL_BROWSERS=1` (needs `npx playwright install firefox webkit`).
 * `PW_CHROMIUM_PATH` points at a pre-installed Chromium (offline CI, containers).
 */
const chromiumPath = process.env.PW_CHROMIUM_PATH || undefined;
const allBrowsers = process.env.K3UI_E2E_ALL_BROWSERS === '1';
const mobile = process.env.K3UI_E2E_MOBILE === '1';
const chromiumLaunch = chromiumPath ? { executablePath: chromiumPath } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      /* Stable across CI CPU noise — still catches layout/chrome regressions. */
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumLaunch,
      },
    },
    ...(mobile
      ? [
          {
            name: 'mobile-chrome',
            use: {
              ...devices['Pixel 5'],
              launchOptions: chromiumLaunch,
            },
          },
          {
            /* iPhone metrics on Chromium — avoids a local WebKit install. */
            name: 'mobile-iphone',
            use: {
              ...devices['iPhone 12'],
              browserName: 'chromium',
              launchOptions: chromiumLaunch,
            },
          },
        ]
      : []),
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
