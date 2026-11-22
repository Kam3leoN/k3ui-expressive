import { test, expect } from '@playwright/test';

test('toc page mounts layout + sticky rail', async ({ page }) => {
  await page.goto('/#/toc');
  const article = page.locator('#page-toc');
  await expect(article).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => !!customElements.get('k3-toc'), null, { timeout: 30_000 });
  const toc = page.locator('#demo-toc');
  await expect(toc).toBeVisible();
  await expect(page.locator('#toc-demo-layout .k3-toc-layout__content')).toBeVisible();
  await expect(toc).toHaveAttribute('sticky', '');
  await expect(toc.locator('a.link').first()).toBeVisible();
});
