import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const built = existsSync(resolve(process.cwd(), 'dist/lazy/components.json'));
test.skip(!built, 'dist/lazy missing — run `npm run build:lazy`');

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
  await page.goto('/?components=select#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => !!customElements.get('k3-checkbox'));
});

test('core is locked, the hash selection brings its dependencies', async ({ page }) => {
  await expect.poll(() => checked(page)).toEqual(['core*', 'k3-text-field*', 'k3-select', 'k3-menu*', 'k3-menu-item*']);
  await expect(page.locator('k3-checkbox[data-tag="core"]')).toHaveAttribute('disabled', '');
  const sizes = await page.locator('.pack-size').allTextContents();
  expect(sizes.length).toBeGreaterThan(50);
  for (const s of sizes) expect(s).toMatch(/^\d+([.,]\d)? kB$/);
});

test('ticking updates the total and the shareable link; unticking frees dependencies', async ({ page }) => {
  const gzip = page.locator('#pack-custom-totals dd').nth(1);
  const before = await gzip.textContent();
  await page.locator('k3-checkbox[data-tag="k3-dialog"]').click();
  await expect(page).toHaveURL(/components=select(\+|%20|\s)dialog/);
  await expect(page).toHaveURL(/#\/pack/);
  await expect(gzip).not.toHaveText(before!);
  expect(await checked(page)).toContain('k3-button*');

  await page.locator('k3-checkbox[data-tag="k3-select"]').click();
  await page.locator('k3-checkbox[data-tag="k3-dialog"]').click();
  await expect.poll(() => checked(page)).toEqual(['core*']);
  await expect(page.locator('#pack-feedback')).not.toBeEmpty();
});

test('keyboard: a row toggles with Space', async ({ page }) => {
  const box = page.locator('k3-checkbox[data-tag="k3-badge"]');
  await box.locator('[role="checkbox"]').focus();
  await page.keyboard.press('Space');
  await expect(box).toHaveAttribute('checked', '');
  await expect(page).toHaveURL(/badge/);
});

test('downloads one self-describing file without the components left out', async ({ page }) => {
  test.setTimeout(180_000);
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 150_000 }),
    page.locator('#pack-download').click(),
  ]);
  expect(download.suggestedFilename()).toBe('k3ui.custom.js');
  const stream = await download.createReadStream();
  let code = '';
  for await (const chunk of stream) code += String(chunk);

  expect(code).toMatch(/^\/\*! K3UI \d+\.\d+\.\d+ — custom pack "k3ui\.custom"/);
  expect(code).not.toContain('\n');
  expect(code).toContain('#/pack');
  expect(code).toContain('globalThis.K3UI_PACK=');
  expect(code).toContain('dataset.k3PackCss');
  expect(code).toMatch(/--k3-sys-color-|--k3-sys-spacing-/);
  expect(code).not.toContain('Focus carré');
  expect(code).not.toMatch(/\bimport\s*\(\s*["']\.\//);
  expect(code).toContain('k3-select');
  expect(code).not.toContain('alertdialog');
  expect(code.length).toBeLessThan(1_200_000);
});

test('pack stays inside the docs shell (nav rail)', async ({ page }) => {
  await expect(page.locator('#nav-rail')).toBeVisible();
  await expect(page.locator('#pack-app')).toBeVisible();
});

test('home product switch is honored when opening Pack via Démarrage (not stuck on k3ux)', async ({
  page,
}) => {
  await page.goto('/#/');
  await page.locator('[data-product-switch="k3ui"]').click();
  await expect(page.locator('#home-hero-title')).toContainText(/Material K3ui/i);
  await expect(page.locator('#home-hero-title .hero-title__accent')).toBeVisible();
  await page.locator('#page-home [data-nav="quick-start"]').click();
  await expect(page.locator('#page-quick-start')).toBeVisible({ timeout: 30_000 });
  await page
    .locator('#page-quick-start [data-doc-product="k3ui"] .qs-card--pack a.qs-pack-cta')
    .click();
  await expect(page).toHaveURL(/#\/pack/);
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#pack-app')).toHaveAttribute('data-pack-product', 'k3ui');
  await expect(page.locator('#pack-download')).toContainText(/K3ui Custom/i);
  await expect(page.locator('#pack-product-switch [data-product-switch="k3ui"]')).toHaveAttribute(
    'selected',
    '',
  );
});

const hasK3uxLazy = existsSync(resolve(process.cwd(), '../k3ux/dist/lazy/components.json'));

test('pack-side switch toggles catalog without leaving the page', async ({ page }) => {
  test.skip(!hasK3uxLazy, 'k3ux/dist/lazy missing — sibling k3ux optional');
  await page.goto('/?product=k3ui#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await page.locator('#pack-product-switch [data-product-switch="k3ux"]').click();
  await expect(page.locator('#pack-app')).toHaveAttribute('data-pack-product', 'k3ux');
  await expect(page.locator('#pack-download')).toContainText(/K3ux Custom/i);
  await expect(page).toHaveURL(/#\/pack/);
});

test('two summary cards show raw + gzip; full download yields a complete file', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?product=k3ui#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.pack-summary--full')).toBeVisible();
  await expect(page.locator('.pack-summary--custom')).toBeVisible();
  await expect(page.locator('#pack-full-title')).toHaveText(/AiO/i);
  await expect(page.locator('#pack-custom-title')).toHaveText(/sur mesure|Custom pack/i);

  const fullRows = page.locator('#pack-full-totals dt');
  await expect(fullRows).toHaveCount(3);
  await expect(fullRows.nth(0)).toHaveText(/Non compressé|Uncompressed/i);
  await expect(fullRows.nth(1)).toHaveText(/Gzip/i);
  await expect(page.locator('#pack-full-totals dd').nth(0)).toHaveText(/kB/);
  await expect(page.locator('#pack-full-totals dd').nth(1)).toHaveText(/kB/);
  await expect(page.locator('#pack-custom-totals dt').nth(0)).toHaveText(/Non compressé|Uncompressed/i);

  const before = await checked(page);
  expect(before).toEqual(['core*']);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    page.locator('#pack-download-full').click(),
  ]);
  expect(download.suggestedFilename()).toBe('k3ui.full.js');
  /* AiO must not pre-tick the custom checklist */
  await expect.poll(() => checked(page)).toEqual(['core*']);

  const stream = await download.createReadStream();
  let code = '';
  for await (const chunk of stream) code += String(chunk);
  expect(code).toMatch(/^\/\*! K3UI \d+\.\d+\.\d+ — AiO pack "k3ui\.full"/);
  expect(code).not.toContain('custom pack');
  expect(code).toContain('globalThis.K3UI_PACK=');
  expect(code).toContain('dataset.k3PackCss');
  expect(code).toContain('k3-dialog');
  expect(code).toContain('k3-select');
  expect(code.length).toBeGreaterThan(400_000);
});

test('custom reset clears selection and URL without leaving Pack', async ({ page }) => {
  await page.goto('/?product=k3ui&components=select+dialog#/pack');
  await expect(page.locator('#pack-layout')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => checked(page)).toContain('k3-select');
  await page.locator('#pack-reset').click();
  await expect.poll(() => checked(page)).toEqual(['core*']);
  await expect(page).not.toHaveURL(/components=/);
  await expect(page.locator('#pack-feedback')).toHaveText(/effacée|cleared/i);
  await expect(page.locator('#pack-reset')).toHaveAttribute('disabled', '');
});
