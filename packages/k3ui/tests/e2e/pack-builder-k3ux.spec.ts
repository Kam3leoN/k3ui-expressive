import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const built = existsSync(resolve(process.cwd(), '../k3ux/dist/lazy/components.json'));
test.skip(!built, 'k3ux/dist/lazy missing — run `npm run build:lazy` in k3ux');

const checked = (page: import('@playwright/test').Page): Promise<string[]> =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement & { checked: boolean; disabled: boolean }>(
        '#pack-list k3-checkbox',
      ),
    ]
      .filter((b) => b.checked)
      .map((b) => `${b.dataset.tag}${b.disabled ? '*' : ''}`),
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/?product=k3ux&components=confetti#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => !!customElements.get('k3-checkbox'));
});

test('k3ux catalog: core locked, confetti selected, no k3ui-only tags', async ({ page }) => {
  await expect.poll(() => checked(page)).toEqual(['core*', 'k3-confetti']);
  await expect(page.locator('k3-checkbox[data-tag="k3-select"]')).toHaveCount(0);
  await expect(page.locator('k3-checkbox[data-tag="k3-snow"]')).toHaveCount(1);
  await expect(page.locator('#pack-download')).toContainText(/K3ux Custom/i);
  await expect(page.locator('#nav-rail')).toBeVisible();
});

test('k3ux download is a self-describing pack with peer imports', async ({ page }) => {
  test.setTimeout(180_000);
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 150_000 }),
    page.locator('#pack-download').click(),
  ]);
  expect(download.suggestedFilename()).toBe('k3ux.custom.js');
  const stream = await download.createReadStream();
  let code = '';
  for await (const chunk of stream) code += String(chunk);

  expect(code).toMatch(/^\/\*! K3UX \d+\.\d+\.\d+ — custom pack "k3ux\.custom"/);
  expect(code).not.toContain('\n');
  expect(code).toContain('globalThis.K3UX_PACK=');
  expect(code).toContain('dataset.k3PackCss');
  expect(code).toContain('k3-confetti');
  expect(code).toContain('#/pack');
  expect(code).toMatch(/from\s*["']k3ui["']/);
});
