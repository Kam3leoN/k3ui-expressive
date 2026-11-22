import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/* The download assembles k3ux dist/lazy chunks + dist/k3ux.css: needs the full build. */
const built =
  existsSync(resolve(process.cwd(), '../k3ux/dist/lazy/components.json')) &&
  existsSync(resolve(process.cwd(), '../k3ux/dist/k3ux.css'));
test.skip(!built, 'k3ux dist missing — run `npm run build` at the repository root');

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
  await page.goto('/?components=confetti#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => !!customElements.get('k3-checkbox'));
});

test('unified pack: core locked, confetti selected among k3ui + k3ux rows', async ({
  page,
  isMobile,
}) => {
  await expect.poll(() => checked(page)).toEqual(['core*', 'k3-confetti']);
  await expect(page.locator('k3-checkbox[data-tag="k3-select"]')).toHaveCount(1);
  await expect(page.locator('k3-checkbox[data-tag="k3-snow"]')).toHaveCount(1);
  await expect(page.locator('.pack-ux-divider')).toBeVisible();
  await expect(page.locator('#pack-app')).toHaveAttribute('data-pack-product', 'unified');
  await expect(page.locator('#pack-download')).toContainText(/Custom/i);
  /* Phones: the shell swaps the rail for the bottom nav bar. */
  await expect(page.locator(isMobile ? '#nav-bar' : '#nav-rail')).toBeVisible();
});

test('k3ux-only selection downloads a self-describing k3ux pack with peer imports', async ({
  page,
}) => {
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
