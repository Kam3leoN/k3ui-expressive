import { test, expect, type Page } from '@playwright/test';

async function boot(page: Page, route: string, tags: string[]): Promise<void> {
  await page.goto(`/#/${route}`);
  await page.waitForFunction(() => !!window.K3UI);
  await page.evaluate((t) => window.K3UI!.registry.registerAll(t), tags);
  await page.waitForFunction(
    (id) => !!document.querySelector(`.comp-page[data-page="${id}"]`)?.firstElementChild,
    route,
    { timeout: 20_000 },
  );
}

test.describe('stress', () => {
  test('mount 120 buttons and click every 10th without hanging', async ({ page }) => {
    await boot(page, 'buttons', ['k3-button']);
    const clicks = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.id = 'stress-host';
      host.style.cssText =
        'display:flex;flex-wrap:wrap;gap:4px;position:fixed;inset:0;z-index:99998;background:#fff;overflow:auto';
      document.body.append(host);
      const nodes = Array.from({ length: 120 }, (_, i) => {
        const b = document.createElement('k3-button') as HTMLElement & { updateComplete: Promise<unknown> };
        b.textContent = String(i);
        host.append(b);
        return b;
      });
      await Promise.all(nodes.map((n) => n.updateComplete));
      let n = 0;
      for (let i = 0; i < nodes.length; i += 10) {
        nodes[i]!.shadowRoot?.querySelector('button')?.click();
        n++;
      }
      host.remove();
      return n;
    });
    expect(clicks).toBe(12);
  });

  test('rapid dialog show/hide 40× stays responsive', async ({ page }) => {
    await boot(page, 'dialog', ['k3-dialog']);
    await page.waitForFunction(() => {
      const dlg = document.getElementById('dlg') as (HTMLElement & { show?: () => Promise<boolean> }) | null;
      return typeof dlg?.show === 'function';
    });
    const ms = await page.evaluate(async () => {
      const dlg = document.getElementById('dlg') as HTMLElement & {
        show: () => Promise<boolean>;
        hide: () => Promise<boolean>;
      };
      const t0 = performance.now();
      for (let i = 0; i < 40; i++) {
        await dlg.show();
        await dlg.hide();
      }
      return Math.round(performance.now() - t0);
    });
    console.log(`[stress] dialog show/hide ×40 = ${ms}ms`);
    expect(ms).toBeLessThan(20_000);
  });
});
