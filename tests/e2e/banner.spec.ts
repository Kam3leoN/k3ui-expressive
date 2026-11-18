import { test, expect } from '@playwright/test';

test.describe('k3-banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/banner');
    await expect(page.locator('#page-banner')).toBeVisible({ timeout: 30_000 });
  });

  test('docs page shows static banners and dismiss + reset works', async ({ page }) => {
    const banners = page.locator('#page-banner k3-banner[position="static"]');
    await expect(banners.first()).toBeVisible();

    const dismissible = page.locator('#banner-demo-dismiss');
    const reset = page.locator('#btn-banner-demo-reset');
    await expect(dismissible).toBeVisible();
    await expect(reset).toBeHidden();

    await dismissible.locator('[part="dismiss"]').click();
    await expect(dismissible).toBeHidden();
    await expect(reset).toBeVisible();

    await reset.click();
    await expect(dismissible).toBeVisible();
    await expect(reset).toBeHidden();
  });

  test('forced color banner paints custom fill and action ink', async ({ page }) => {
    const flash = page.locator('#banner-demo-flash');
    const reset = page.locator('#btn-banner-flash-reset');
    await expect(flash).toBeVisible();
    const colors = await flash.evaluate((el) => {
      const surface = el.shadowRoot!.querySelector('.surface') as HTMLElement;
      const btn = el.querySelector('k3-button') as HTMLElement | null;
      return {
        bg: getComputedStyle(surface).backgroundColor,
        primary: getComputedStyle(surface).getPropertyValue('--k3-sys-color-primary').trim(),
        btnPrimary: btn
          ? getComputedStyle(btn).getPropertyValue('--k3-sys-color-primary').trim()
          : '',
      };
    });
    expect(colors.bg).toMatch(/rgb\(\s*204,\s*0,\s*0\s*\)/);
    expect(colors.primary.toLowerCase()).toBe('#ffffff');
    expect(colors.btnPrimary.toLowerCase()).toBe('#ffffff');

    await expect(reset).toBeHidden();
    await flash.locator('[part="dismiss"]').click();
    await expect(flash).toBeHidden();
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(flash).toBeVisible();
    await expect(reset).toBeHidden();
  });

  test('live banner show / dismiss / re-show and auto-destroy on nav', async ({ page }) => {
    const showBtn = page.locator('#btn-banner-live');
    await expect(showBtn).toBeVisible();
    await expect(page.locator('#btn-banner-live-remove')).toHaveCount(0);

    await showBtn.click();
    const live = page.locator('k3-banner[data-playground-live-banner]');
    await expect(live).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(450);

    const offset = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--k3-banner-offset').trim(),
    );
    expect(offset).toMatch(/^\d+(\.\d+)?px$/);
    expect(parseFloat(offset)).toBeGreaterThan(0);

    const layout = await page.evaluate(() => {
      const banner = document.querySelector(
        'k3-banner[data-playground-live-banner]',
      ) as HTMLElement;
      const bar = document.getElementById('shell-appbar');
      const rail = document.getElementById('nav-rail');
      if (!banner || !bar) return null;
      const br = banner.getBoundingClientRect();
      const ar = bar.getBoundingClientRect();
      const rr = rail?.getBoundingClientRect();
      return {
        hostHeight: br.height,
        spacerOk: ar.top >= br.height - 1,
        railOk: rr == null || rr.top >= br.height - 2,
      };
    });
    expect(layout).toBeTruthy();
    expect(layout!.hostHeight).toBeGreaterThan(0);
    expect(layout!.spacerOk).toBe(true);
    expect(layout!.railOk).toBe(true);

    /* Dismiss via × — button can fire again */
    await live.locator('[part="dismiss"]').click();
    await expect(live).toHaveCount(0, { timeout: 10_000 });
    await expect(showBtn).toBeEnabled();

    await showBtn.click();
    await expect(page.locator('k3-banner[data-playground-live-banner]')).toBeVisible();

    await page.goto('/#/dialog');
    await expect(page.locator('#page-dialog')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('k3-banner[data-playground-live-banner]')).toHaveCount(0);
  });

  test('fixed banner sets --k3-banner-offset on html', async ({ page }) => {
    const offset = await page.evaluate(async () => {
      const el = document.createElement('k3-banner') as HTMLElement & {
        position?: string;
        updateComplete?: Promise<unknown>;
      };
      el.setAttribute('variant', 'primary');
      el.textContent = 'Pinned promo for e2e';
      document.body.prepend(el);
      await customElements.whenDefined('k3-banner');
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 450));
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--k3-banner-offset')
        .trim();
      el.remove();
      return value;
    });
    expect(offset).toMatch(/^\d+(\.\d+)?px$/);
    const px = parseFloat(offset);
    expect(px).toBeGreaterThan(0);
  });
});
