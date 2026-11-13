import { test, expect, type Page } from '@playwright/test';

type Heap = { used: number; total: number } | null;

async function heap(page: Page): Promise<Heap> {
  return page.evaluate(() => {
    const m = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } })
      .memory;
    return m ? { used: m.usedJSHeapSize, total: m.totalJSHeapSize } : null;
  });
}

test.describe('memory / GC pressure', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'performance.memory is Chromium-only');
  });

  test('create/destroy 200 buttons does not balloon the heap unboundedly', async ({ page }) => {
    await page.goto('/#/buttons');
    await page.waitForFunction(() => !!window.K3UI);
    await page.evaluate(() => window.K3UI!.registry.registerAll(['k3-button']));

    const before = await heap(page);
    test.skip(!before, 'performance.memory unavailable');

    await page.evaluate(async () => {
      const host = document.createElement('div');
      host.id = 'mem-host';
      document.body.append(host);
      for (let round = 0; round < 10; round++) {
        host.replaceChildren(
          ...Array.from({ length: 20 }, () => {
            const b = document.createElement('k3-button');
            b.textContent = `b${round}`;
            return b;
          }),
        );
        await Promise.all(
          [...host.querySelectorAll('k3-button')].map(
            (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
          ),
        );
        host.replaceChildren();
      }
      host.remove();
    });

    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 50));
    });

    const after = await heap(page);
    expect(after).toBeTruthy();
    const growthMb = (after!.used - before!.used) / (1024 * 1024);
    console.log(`[memory] button churn heap Δ=${growthMb.toFixed(2)} MB (before=${before!.used} after=${after!.used})`);
    expect(growthMb).toBeLessThan(40);
  });

  test('dialog open/close cycle leaves no orphan live dialogs', async ({ page }) => {
    await page.goto('/#/dialog');
    await page.waitForFunction(() => !!window.K3UI);
    await page.waitForFunction(() => {
      const dlg = document.getElementById('dlg') as (HTMLElement & { show?: () => Promise<boolean> }) | null;
      return typeof dlg?.show === 'function';
    });

    await page.evaluate(async () => {
      const dlg = document.getElementById('dlg') as HTMLElement & {
        show: () => Promise<boolean>;
        hide: () => Promise<boolean>;
        open: boolean;
      };
      for (let i = 0; i < 15; i++) {
        await dlg.show();
        await dlg.hide();
      }
    });

    const state = await page.evaluate(() => {
      const dlg = document.getElementById('dlg') as HTMLElement & { open: boolean };
      const live = document.querySelectorAll(
        '[role="alertdialog"]:not([inert]), [role="dialog"]:not([inert])',
      ).length;
      return { open: dlg.open, live };
    });
    expect(state.open).toBe(false);
    expect(state.live).toBe(0);
  });
});
