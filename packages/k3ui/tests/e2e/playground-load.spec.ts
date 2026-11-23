import { test, expect, type Page } from '@playwright/test';

/** Layout-shift score (no recent input) recorded from the very first paint. */
async function recordShifts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

const ready = (page: Page, id: string) =>
  page.waitForFunction(
    (id) =>
      document.documentElement.classList.contains('k3-ready') &&
      document.querySelector(`.comp-page[data-page="${id}"]`)?.classList.contains('is-active') &&
      !document.documentElement.hasAttribute('data-k3-deeplink') &&
      !document.documentElement.hasAttribute('data-k3-booting') &&
      (document.getElementById('doc-page-loading') as HTMLElement | null)?.hidden,
    id,
    { timeout: 20_000 },
  );

test('home: hero + stats ready, every doc page stamped after boot', async ({ page }) => {
  await recordShifts(page);
  await page.goto('/');
  await ready(page, 'home');
  await expect(page.locator('#home-hero-title')).toBeVisible();
  await expect(page.locator('#product-switch')).toHaveCount(0);
  /* Blurred Material orbs (Trainable-style) behind the hero */
  await expect(page.locator('#home-ambient .home-ambient__orb')).toHaveCount(4);
  await expect(page.locator('#home-ambient .home-ambient__shape')).toHaveCount(4);
  await expect(page.locator('#home-stats .home-stat')).toHaveCount(4);
  await expect(page.locator('#home-stats [data-stat="k3ui"] .home-stat__value')).not.toHaveText('');
  await expect(page.locator('#home-stats [data-stat="oss"] .home-stat__value')).toContainText(/open source/i);
  await expect(page.locator('.home-hero-banner__chips k3-chip')).toHaveCount(3);
  await expect(page.locator('.home-hero-morph__shape')).toHaveCount(3);
  await expect(page.locator('#home-thoughtful')).toBeVisible();
  await expect(page.locator('#home-thoughtful .home-thoughtful-card')).toHaveCount(3);
  await expect(page.locator('#home-thoughtful-settings')).toBeVisible();
  await expect(page.locator('#home-lift-cta')).toBeVisible();
  await expect(page.locator('#home-lift-cta .home-lift-cta__blob')).toHaveCount(2);
  await expect(page.locator('#home-lift-cta k3-button[data-nav="quick-start"]')).toBeVisible();
  await expect(page.locator('#home-lift-cta k3-button[data-nav="pack"]')).toBeVisible();
  /* Sponsors live on their own page — not on home; reached via Démarrage hub */
  await expect(page.locator('#page-home #sponsors-root')).toHaveCount(0);
  await expect(page.locator('#nav-rail #rail-sponsors')).toHaveCount(0);
  /* Five primary destinations (M3 max) — no Showcase / Resources top-level */
  await expect(page.locator('#nav-rail > k3-nav-item:not([slot])')).toHaveCount(5);
  const ver = page.locator('#nav-rail .rail-foot #ver');
  await expect(ver).toBeVisible();
  await expect(ver).toHaveJSProperty('localName', 'k3-status');
  await expect(ver).toHaveAttribute('show-icon', 'false');
  /* Every doc page was put back once the app booted */
  const empty = await page.evaluate(
    () => [...document.querySelectorAll('.comp-page')].filter((a) => !a.firstElementChild).length,
  );
  expect(empty).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
});

test('Modal shell: rail docked, app-bar bleed tracks expand', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await ready(page, 'home');
  const rail = page.locator('#nav-rail');
  await expect(rail).toHaveAttribute('layout', 'modal');
  const appbar = page.locator('#shell-appbar');
  await expect(appbar).not.toHaveAttribute('sticky', '');

  const before = await page.evaluate(() => {
    const r = document.getElementById('nav-rail') as HTMLElement & { size: string };
    const railBox = r.getBoundingClientRect();
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--k3-shell-rail-inline-size')
      .trim();
    return {
      railLeft: railBox.left,
      railWidth: railBox.width,
      railPos: getComputedStyle(r).position,
      size: r.size,
      token,
    };
  });
  /* Modal docks flush to the start edge (not XR float) */
  expect(before.railLeft).toBeLessThanOrEqual(2);
  expect(before.railPos).toBe('sticky');
  expect(before.size).toBe('compact');
  expect(before.railWidth).toBeGreaterThanOrEqual(80);
  expect(parseFloat(before.token)).toBeGreaterThanOrEqual(80);

  await rail.locator('.toggle').click();
  await page.waitForFunction(
    () => (document.getElementById('nav-rail') as HTMLElement & { size: string }).size === 'large',
  );
  const after = await page.evaluate(() => {
    const r = document.getElementById('nav-rail')!;
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--k3-shell-rail-inline-size')
      .trim();
    return {
      railWidth: r.getBoundingClientRect().width,
      token: parseFloat(token),
    };
  });
  /* Expand grows the rail and the published shell token (app-bar bleed) */
  expect(after.railWidth).toBeGreaterThan(before.railWidth + 40);
  expect(after.token).toBeGreaterThan(parseFloat(before.token) + 40);
});

test('sponsors page: Démarrage hub stays active on the cells grid', async ({ page }) => {
  await page.goto('/#/sponsors');
  await ready(page, 'sponsors');
  await expect(page.locator('#page-sponsors')).toBeVisible();
  /* 216 − 5×8 − 10×3 = 146 DOM cells · 5 large (3×3) + 10 small (2×2) */
  await expect(page.locator('#sponsors-root .sponsor-wall-cell')).toHaveCount(146);
  await expect(page.locator('#sponsors-root .sponsor-wall-cell--mega')).toHaveCount(15);
  await expect(page.locator('#sponsors-root .sponsor-wall-cell--mega-lg')).toHaveCount(5);
  await expect(page.locator('#sponsors-root .sponsor-wall-cell--mega-sm')).toHaveCount(10);
  /* First primary item = Démarrage (hub) */
  await expect(page.locator('#nav-rail > k3-nav-item:not([slot])').first()).toHaveAttribute(
    'active',
    '',
  );
});

test('deep link: veil instead of a flash of the home page, no layout shift', async ({ page }) => {
  await recordShifts(page);
  await page.goto('/#/buttons');
  /* First paint: boot veil on, home not shown */
  expect(
    await page.evaluate(() => {
      const home = document.getElementById('page-home');
      const loading = document.getElementById('doc-page-loading');
      return {
        homeDisplay: home ? getComputedStyle(home).display : null,
        booting: document.documentElement.hasAttribute('data-k3-booting'),
        loadingOn: loading?.classList.contains('is-on') || loading?.hidden === false,
      };
    }),
  ).toMatchObject({ homeDisplay: 'none', booting: true, loadingOn: true });
  await ready(page, 'buttons');
  await expect(page.locator('#page-buttons')).toBeVisible();
  await expect(page.locator('#page-home')).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
});

test('navigation after boot shows any stamped page with working demos', async ({ page }) => {
  await page.goto('/');
  await ready(page, 'home');
  await page.evaluate(() => {
    location.hash = '#/dialog';
  });
  await ready(page, 'dialog');
  await page.locator('#btn-dialog').click();
  await expect(page.locator('#dlg').getByRole('alertdialog')).toBeVisible();
});
