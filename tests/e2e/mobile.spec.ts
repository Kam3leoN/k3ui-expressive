import { test, expect, type Page } from '@playwright/test';

const ready = (page: Page, id: string) =>
  page.waitForFunction(
    (id) =>
      document.documentElement.classList.contains('k3-ready') &&
      document.querySelector(`.comp-page[data-page="${id}"]`)?.classList.contains('is-active') &&
      !document.documentElement.hasAttribute('data-k3-deeplink') &&
      !document.documentElement.hasAttribute('data-k3-booting'),
    id,
    { timeout: 20_000 },
  );

test.describe('mobile viewport', () => {
  test.beforeEach(() => {
    test.skip(!test.info().project.name.startsWith('mobile-'), 'mobile projects only');
  });

  test('home catalog is reachable and dialog opens from a deep link', async ({ page }) => {
    await page.goto('/');
    await ready(page, 'home');
    await expect(page.locator('#catalog-grid .catalog-card').first()).toBeVisible();

    await page.goto('/#/dialog');
    await ready(page, 'dialog');
    await page.locator('#btn-dialog').click();
    await expect(page.locator('#dlg').getByRole('alertdialog')).toBeVisible();
  });

  test('compact shell keeps primary chrome usable', async ({ page }) => {
    await page.goto('/');
    await ready(page, 'home');
    /* Compact layouts use the bar; larger phones may keep a rail — either counts. */
    const chrome = page.locator('#nav-bar, #nav-rail');
    await expect(chrome.first()).toBeAttached();
    const minH = await page.evaluate(() => {
      const items = [...document.querySelectorAll('k3-nav-item, k3-fab, k3-icon-button')];
      const heights = items.map((el) => el.getBoundingClientRect().height).filter((h) => h > 0);
      return heights.length ? Math.min(...heights) : 0;
    });
    expect(minH).toBeGreaterThanOrEqual(40);
  });
});
