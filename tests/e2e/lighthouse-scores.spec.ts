import { test, expect, type Page } from '@playwright/test';

const SUMMARY = {
  scores: { performance: 42, accessibility: 91, 'best-practices': 100, seo: 73 },
  metrics: {
    fcp: { value: '2.9 s', score: 0.45 },
    lcp: { value: '4.1 s', score: 0.2 },
    tbt: { value: '600 ms', score: 0.5 },
    cls: { value: '0.02', score: 1 },
    si: { value: '3.3 s', score: 0.9 },
  },
  lighthouse: '12.8.2',
  date: '2026-11-07T15:00:00.000Z',
  url: 'http://127.0.0.1:5173/',
  form: 'mobile',
  mode: 'dev',
  report: '/__k3-lighthouse/report/mobile.html',
};

const openSection = async (page: Page) => {
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('k3-ready'), null, { timeout: 20_000 });
  await page.locator('#lighthouse-root').scrollIntoViewIfNeeded();
  await expect(page.locator('.lh-gauge')).toHaveCount(4);
};

const values = (page: Page) =>
  page.locator('.lh-gauge').evaluateAll((els) =>
    els.map((g) => `${g.getAttribute('aria-valuenow')}:${(g as HTMLElement).dataset.band}`),
  );

test('home shows the stored Lighthouse scores as gauges, per form factor', async ({ page }) => {
  const stored = await (await page.request.get('/lighthouse.json')).json();
  await openSection(page);
  const expected = (form: 'desktop' | 'mobile') =>
    ['performance', 'accessibility', 'best-practices', 'seo'].map((c) => {
      const v = stored[form].scores[c] as number;
      return `${v}:${v < 50 ? 'poor' : v < 90 ? 'average' : 'good'}`;
    });
  await expect.poll(() => values(page)).toEqual(expected('desktop'));
  await expect(page.locator('.lh-gauge').first()).toHaveAttribute('role', 'meter');
  await expect(page.locator('.lh-num').first()).toHaveText(String(stored.desktop.scores.performance));
  await page.locator('.lh-tabs').evaluate((t) => (t.shadowRoot!.querySelectorAll('[role=tab]')[1] as HTMLElement).click());
  await expect.poll(() => values(page)).toEqual(expected('mobile'));
  await expect(page.locator('.lh-metric-value').first()).toHaveText(stored.mobile.metrics.fcp.value);
});

test('live audit: gauges spin, then animate to the new scores with a report link', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route('**/__k3-lighthouse/run**', async (route) => {
    expect(new URL(route.request().url()).searchParams.get('form')).toBe('mobile');
    await gate;
    await route.fulfill({ json: SUMMARY });
  });
  await openSection(page);
  await page.locator('.lh-tabs').evaluate((t) => (t.shadowRoot!.querySelectorAll('[role=tab]')[1] as HTMLElement).click());
  /* k3-tabs reports the change once its indicator has moved */
  await expect(page.locator('.lh-run')).toContainText('Mobile');
  await expect(page.locator('.lh-run')).not.toHaveAttribute('disabled', '');
  await page.locator('.lh-run').click();
  await expect(page.locator('.lh-gauge.is-loading')).toHaveCount(4);
  await expect(page.locator('.lh-gauge').first()).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.lh-status')).toContainText(/Lighthouse/);
  release();
  await expect(page.locator('.lh-gauge.is-loading')).toHaveCount(0);
  await expect.poll(() => values(page)).toEqual(['42:poor', '91:good', '100:good', '73:average']);
  await expect(page.locator('.lh-num').first()).toHaveText('42');
  await expect(page.locator('.lh-report')).toHaveAttribute('href', SUMMARY.report);
  await expect(page.locator('.lh-metric').nth(1)).toHaveAttribute('data-band', 'poor');
  await expect(page.locator('.lh-date')).toContainText('2026');
});

test('without the dev / preview endpoint the run button explains what is needed', async ({ page }) => {
  await page.route('**/__k3-lighthouse/ping', (route) => route.fulfill({ status: 404, body: 'not found' }));
  await openSection(page);
  await expect(page.locator('.lh-run')).toHaveAttribute('disabled', '');
  await expect(page.locator('.lh-status')).toContainText(/npm run (dev|preview)/);
});
