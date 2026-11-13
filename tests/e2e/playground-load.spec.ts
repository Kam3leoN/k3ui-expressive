import { test, expect, type Page } from '@playwright/test';

/** Layout-shift score (no recent input) recorded from the very first paint. */
async function recordShifts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

const ready = (page: Page, id: string) =>
  page.waitForFunction(
    (id) =>
      document.documentElement.classList.contains('k3-ready') &&
      document.querySelector(`.comp-page[data-page="${id}"]`)?.classList.contains('is-active') &&
      !document.documentElement.hasAttribute('data-k3-deeplink') &&
      !document.documentElement.hasAttribute('data-k3-booting') &&
      (document.getElementById('doc-page-loading') as HTMLElement | null)?.hidden,
    id,
    { timeout: 20_000 },
  );

test('home: catalog visible at once, every doc page stamped after boot', async ({ page }) => {
  await recordShifts(page);
  await page.goto('/');
  /* Prerendered at build in production; the dev server builds it at boot */
  await expect(page.locator('#catalog-grid .catalog-card').first()).toBeVisible();
  await ready(page, 'home');
  /* Material ambient shapes (pale, spinning) behind the hero */
  await expect(page.locator('#home-ambient .home-ambient__shape')).toHaveCount(4);
  /* Every doc page was put back once the app booted */
  const empty = await page.evaluate(
    () => [...document.querySelectorAll('.comp-page')].filter((a) => !a.firstElementChild).length,
  );
  expect(empty).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
});

test('deep link: veil instead of a flash of the home page, no layout shift', async ({ page }) => {
  await recordShifts(page);
  await page.goto('/#/buttons');
  /* First paint: boot veil on, home not shown */
  expect(
    await page.evaluate(() => {
      const home = document.getElementById('page-home');
      const loading = document.getElementById('doc-page-loading');
      return {
        homeDisplay: home ? getComputedStyle(home).display : null,
        booting: document.documentElement.hasAttribute('data-k3-booting'),
        loadingOn: loading?.classList.contains('is-on') || loading?.hidden === false,
      };
    }),
  ).toMatchObject({ homeDisplay: 'none', booting: true, loadingOn: true });
  await ready(page, 'buttons');
  await expect(page.locator('#page-buttons')).toBeVisible();
  await expect(page.locator('#page-home')).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
});

test('navigation after boot shows any stamped page with working demos', async ({ page }) => {
  await page.goto('/');
  await ready(page, 'home');
  await page.evaluate(() => {
    location.hash = '#/dialog';
  });
  await ready(page, 'dialog');
  await page.locator('#btn-dialog').click();
  await expect(page.locator('#dlg').getByRole('alertdialog')).toBeVisible();
});
