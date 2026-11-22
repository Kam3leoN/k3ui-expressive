import { test, expect, type Page } from '@playwright/test';

/**
 * Visual regression — Chromium desktop only (device pixel ratios / fonts
 * diverge across mobile / Firefox / WebKit). Snapshots live next to this file.
 */
async function readyHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains('k3-ready') &&
      document.querySelector('.comp-page[data-page="home"]')?.classList.contains('is-active'),
    { timeout: 20_000 },
  );
  /* Settle fonts / CE upgrade before the shot. */
  await page.waitForTimeout(400);
}

test.describe('visual regression', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== 'chromium' || test.info().project.name !== 'chromium',
      'Chromium desktop baselines only',
    );
    /* Baselines are OS/font-sensitive (win32 vs linux CI). Enforce with K3UI_E2E_VISUAL=1. */
    test.skip(!!process.env.CI && process.env.K3UI_E2E_VISUAL !== '1', 'set K3UI_E2E_VISUAL=1 to run on CI');
  });

  test('home hero + catalog chrome', async ({ page }) => {
    await readyHome(page);
    await expect(page.locator('#page-home')).toHaveScreenshot('home-hero.png', {
      maxDiffPixelRatio: 0.03,
    });
  });

  test('dialog open surface', async ({ page }) => {
    await page.goto('/#/dialog');
    await page.waitForFunction(() => !!customElements.get('k3-dialog') && !!window.K3UI);
    await page.locator('#btn-dialog').click();
    const panel = page.locator('#dlg').getByRole('alertdialog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveScreenshot('dialog-open.png', { maxDiffPixelRatio: 0.03 });
  });
});
