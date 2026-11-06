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
  /* First paint: home hidden, loading veil shown */
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('page-home')!).display)).toBe('none');
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
