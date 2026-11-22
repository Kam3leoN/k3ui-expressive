import { test, expect, type Page } from '@playwright/test';

/**
 * Main-thread cost of continuous indicators. Budgets are absolute and only
 * meant to catch regressions (per-frame renders coming back, loops running
 * off-screen). Numbers are printed so runs can be compared.
 */

async function mount(page: Page, tag: string, count: number, offscreen: boolean, attrs = ''): Promise<void> {
  await page.evaluate(
    ({ tag, count, offscreen, attrs }) => {
      const host = document.createElement('div');
      host.id = 'perf-host';
      host.style.cssText = offscreen
        ? 'position:absolute;top:300vh;left:0;display:flex;flex-wrap:wrap'
        : 'position:fixed;inset:0;display:flex;flex-wrap:wrap;z-index:99999;background:#fff';
      host.innerHTML = Array.from({ length: count }, () => `<${tag} ${attrs}></${tag}>`).join('');
      document.body.append(host);
    },
    { tag, count, offscreen, attrs },
  );
}

/** Lit update() calls of `tag` during `ms`, plus CDP script time. */
async function measure(page: Page, tag: string, ms: number): Promise<{ updates: number; scriptMs: number }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.evaluate((t) => {
    const proto = customElements.get(t)!.prototype as { update: (c: unknown) => void; __k3n?: number };
    const w = window as unknown as { __k3updates: number };
    w.__k3updates = 0;
    if (!proto.__k3n) {
      const orig = proto.update;
      proto.update = function (this: unknown, c: unknown) {
        w.__k3updates++;
        return orig.call(this, c);
      };
      proto.__k3n = 1;
    }
  }, tag);
  const metric = async (): Promise<number> => {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return (metrics.find((m) => m.name === 'ScriptDuration')?.value ?? 0) * 1000;
  };
  const s0 = await metric();
  await page.waitForTimeout(ms);
  const s1 = await metric();
  const updates = await page.evaluate(() => (window as unknown as { __k3updates: number }).__k3updates);
  return { updates, scriptMs: Math.round(s1 - s0) };
}

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'uses Chrome DevTools Protocol metrics');
  await page.goto('/#/loading-indicator');
  await page.waitForFunction(() => !!window.K3UI);
  /* The playground defines components per page — register what the test mounts. */
  await page.evaluate((tags) => window.K3UI!.registry.registerAll(tags), ['k3-loading-indicator', 'k3-progress']);
  await page.waitForTimeout(500);
});

test('k3-loading-indicator: at most one render per frame, idle when off-screen', async ({ page }) => {
  await mount(page, 'k3-loading-indicator', 40, false);
  await page.waitForTimeout(300);
  const visible = await measure(page, 'k3-loading-indicator', 2000);
  await page.evaluate(() => document.getElementById('perf-host')!.remove());
  await mount(page, 'k3-loading-indicator', 40, true);
  await page.waitForTimeout(300);
  const offscreen = await measure(page, 'k3-loading-indicator', 2000);
  console.log(`[perf] loading-indicator ×40 visible: ${JSON.stringify(visible)} · off-screen: ${JSON.stringify(offscreen)}`);
  /* Spin runs on the compositor: only the shape morph renders (≤ 1 update / frame / instance) */
  expect(visible.updates / 40 / 2).toBeLessThanOrEqual(62);
  expect(offscreen.updates).toBe(0);
});

test('k3-progress indeterminate: canvas loop stops off-screen', async ({ page }) => {
  await mount(page, 'k3-progress', 30, true, 'indeterminate');
  await page.waitForTimeout(300);
  const offscreen = await measure(page, 'k3-progress', 2000);
  console.log(`[perf] progress ×30 indeterminate off-screen: ${JSON.stringify(offscreen)}`);
  expect(offscreen.scriptMs).toBeLessThan(150);
});
