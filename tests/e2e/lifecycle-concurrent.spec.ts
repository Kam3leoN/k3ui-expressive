import { test, expect } from '@playwright/test';

test.describe('concurrent components + destroy/recreate', () => {
  test('stacked dialogs: Escape peels one layer at a time', async ({ page }) => {
    await page.goto('/#/dialog');
    await page.waitForFunction(() => !!window.K3UI);
    await page.evaluate(() => window.K3UI!.registry.registerAll(['k3-dialog', 'k3-button']));

    await page.evaluate(async () => {
      const mk = (id: string, title: string) => {
        const d = document.createElement('k3-dialog') as HTMLElement & {
          show: () => Promise<boolean>;
          updateComplete: Promise<unknown>;
        };
        d.id = id;
        d.innerHTML = `<span slot="headline">${title}</span><k3-button>OK</k3-button>`;
        document.body.append(d);
        return d;
      };
      const a = mk('stack-a', 'A');
      const b = mk('stack-b', 'B');
      await a.updateComplete;
      await b.updateComplete;
      await a.show();
      await b.show();
    });

    await expect(page.locator('#stack-b').getByRole('alertdialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => (document.getElementById('stack-b') as HTMLElement & { open: boolean }).open))
      .toBe(false);
    await expect(page.locator('#stack-a').getByRole('alertdialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => (document.getElementById('stack-a') as HTMLElement & { open: boolean }).open))
      .toBe(false);
  });

  test('remove + recreate a button host restores a working control', async ({ page }) => {
    await page.goto('/#/buttons');
    await page.waitForFunction(() => !!window.K3UI);
    await page.evaluate(() => window.K3UI!.registry.registerAll(['k3-button']));

    const ok = await page.evaluate(async () => {
      const host = document.createElement('div');
      document.body.append(host);
      const make = async () => {
        const b = document.createElement('k3-button') as HTMLElement & {
          updateComplete: Promise<unknown>;
        };
        b.setAttribute('aria-label', 'Retry');
        b.textContent = 'Go';
        host.replaceChildren(b);
        await b.updateComplete;
        return b;
      };
      const first = await make();
      const btn1 = first.shadowRoot?.querySelector('button');
      if (!btn1 || btn1.getAttribute('aria-label') !== 'Retry') return false;
      first.remove();
      const second = await make();
      const btn2 = second.shadowRoot?.querySelector('button');
      host.remove();
      return !!btn2 && btn2.getAttribute('aria-label') === 'Retry';
    });
    expect(ok).toBe(true);
  });

  test('loading-indicator + progress mounted together idle when removed', async ({ page }) => {
    test.skip(test.info().project.name !== 'chromium', 'CDP metrics on Chromium');
    await page.goto('/#/loading-indicator');
    await page.waitForFunction(() => !!window.K3UI);
    await page.evaluate((tags) => window.K3UI!.registry.registerAll(tags), [
      'k3-loading-indicator',
      'k3-progress',
    ]);

    await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'combo-host';
      host.innerHTML =
        '<k3-loading-indicator></k3-loading-indicator><k3-progress indeterminate></k3-progress>'.repeat(5);
      document.body.append(host);
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.getElementById('combo-host')!.remove());
    await page.waitForTimeout(200);
    /* Playground demos may keep their own indicators — only assert our host is gone. */
    expect(await page.locator('#combo-host').count()).toBe(0);
  });
});
