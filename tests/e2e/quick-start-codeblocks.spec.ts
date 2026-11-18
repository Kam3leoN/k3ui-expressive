import { test, expect } from '@playwright/test';

/**
 * Quick Start install samples — native codeblock tabs (NPM / PNPM),
 * no nested card chrome, no phantom H-scrollbar on short commands.
 */
test.describe('Quick Start codeblocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/quick-start');
    await expect(page.locator('#page-quick-start')).toBeVisible({ timeout: 30_000 });
  });

  test('k3ui install uses NPM/PNPM tabs without qs-code card or phantom H-scroll', async ({
    page,
  }) => {
    const product = page.locator('#page-quick-start [data-doc-product="k3ui"]');
    await expect(product).toBeVisible();

    const install = product.locator('.qs-section').filter({
      has: page.locator('k3-codeblock pre[data-label="NPM"]'),
    });
    await expect(install).toBeVisible();
    await expect(install.locator('.qs-tabs')).toHaveCount(0);
    await expect(install.locator('k3-codeblock.qs-code')).toHaveCount(0);
    await expect(install).not.toHaveClass(/qs-card/);

    const pm = install.locator('k3-codeblock').first();
    await expect(pm).toBeVisible();

    const tabLabels = await pm.evaluate((el) => {
      const tabs = el.shadowRoot?.querySelector('k3-tabs') as
        | (HTMLElement & { labels?: string })
        | null;
      return tabs?.labels ?? '';
    });
    expect(tabLabels).toBe('NPM,PNPM');

    const scroll = await pm.evaluate((el) => {
      const code = el.shadowRoot?.querySelector('.code') as HTMLElement | null;
      if (!code) return { hasX: true, scrollWidth: 0, clientWidth: 0 };
      return {
        hasX: code.classList.contains('k3-scroll--x'),
        scrollWidth: code.scrollWidth,
        clientWidth: code.clientWidth,
      };
    });
    expect(scroll.hasX).toBe(false);
    expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1);
  });

  test('copy tooltip opens without clipping the chrome', async ({ page }) => {
    const product = page.locator('#page-quick-start [data-doc-product="k3ui"]');
    const pm = product.locator('.qs-section k3-codeblock').first();
    await expect(pm).toBeVisible();

    const copy = pm.locator('[part="copy"]');
    await copy.hover();

    const tipOpen = await pm.evaluate((el) => {
      const tipHost = el.shadowRoot?.querySelector('k3-tooltip[data-action="copy"]');
      const tip = tipHost?.shadowRoot?.querySelector('.tip') as HTMLElement | null;
      if (!tip) return false;
      const open =
        tip.classList.contains('open') || tip.matches(':popover-open') || tip.hasAttribute('data-floating');
      const r = tip.getBoundingClientRect();
      return open && r.width > 0 && r.height > 0 && r.top >= 0;
    });
    expect(tipOpen).toBe(true);

    const chromeOk = await pm.evaluate((el) => {
      const chrome = el.shadowRoot?.querySelector('.chrome') as HTMLElement | null;
      const panel = el.shadowRoot?.querySelector('.panel') as HTMLElement | null;
      if (!chrome || !panel) return false;
      const c = chrome.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      /* Panel must sit below chrome — no overlap through the header */
      return p.top >= c.bottom - 2;
    });
    expect(chromeOk).toBe(true);
  });
});
