import { test, expect } from '@playwright/test';

async function waitShell(page: import('@playwright/test').Page) {
  await page.goto('/#/home');
  await page.waitForSelector('#nav-rail k3-nav-item');
  await page.waitForFunction(() => {
    const app = document.querySelector('.app');
    return app?.getAttribute('data-nav') === 'rail';
  });
  /* Let boot veil / first paint settle */
  await page.waitForTimeout(800);
}

async function menuState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const menu = document.getElementById('shell-nav-menu') as HTMLElement & {
      open?: boolean;
    };
    const panel = menu?.shadowRoot?.querySelector('.panel') as HTMLElement | null;
    const items = [...document.querySelectorAll('#nav-rail k3-nav-item')].filter(
      (el) => !(el as HTMLElement).closest('[slot]'),
    ) as Array<HTMLElement & { label?: string; active?: boolean; menuOpen?: boolean }>;
    return {
      open: !!menu?.open,
      left: panel?.style.left ?? '',
      top: panel?.style.top ?? '',
      fitted: panel?.hasAttribute('data-fitted') ?? false,
      count: menu?.querySelectorAll('k3-menu-item').length ?? 0,
      first: menu?.querySelector('k3-menu-item')?.textContent?.trim().slice(0, 40) ?? '',
      openDestHighlight: items.map((el) => ({
        label: el.label,
        active: !!el.active,
        menuOpen: !!el.menuOpen,
      })),
    };
  });
}

test.describe('rail first hover', () => {
  test('Démarrage opens on first hover without prior click', async ({ page }) => {
    await waitShell(page);
    const demarrage = page.locator('#nav-rail k3-nav-item').nth(0);
    await expect(demarrage).toHaveAttribute('active', '');

    /* Move from far away so the first entry is a real hover */
    await page.mouse.move(400, 400);
    await page.waitForTimeout(100);
    await demarrage.hover({ force: true });
    await page.waitForTimeout(500);

    const state = await menuState(page);
    console.log('Démarrage first hover', state);
    expect(state.open, `Démarrage should open on hover: ${JSON.stringify(state)}`).toBe(true);
    expect(state.count).toBeGreaterThan(0);
    /* Same MENU_GAP as Composants — flush (96) stole first-hover */
    expect(state.left).toBe('100px');
  });

  test('Démarrage survives spurious menu pointerleave while still on the item', async ({
    page,
  }) => {
    await waitShell(page);
    const demarrage = page.locator('#nav-rail k3-nav-item').nth(0);
    const box = await demarrage.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 1 });
    await page.waitForTimeout(300);
    expect((await menuState(page)).open).toBe(true);

    /* Simulate flush-edge steal: menu gets leave while cursor stays on Démarrage */
    await page.evaluate(() => {
      document.getElementById('shell-nav-menu')?.dispatchEvent(
        new PointerEvent('pointerleave', { bubbles: true, composed: true }),
      );
    });
    await page.waitForTimeout(350);

    const state = await menuState(page);
    expect(state.open, `should stay open after menu leave: ${JSON.stringify(state)}`).toBe(
      true,
    );
  });

  test('Composants opens on first hover without prior click', async ({ page }) => {
    await waitShell(page);
    const composants = page.locator('#nav-rail k3-nav-item').nth(1);

    await page.mouse.move(400, 400);
    await page.waitForTimeout(100);
    await composants.hover({ force: true });
    await page.waitForTimeout(500);

    const state = await menuState(page);
    console.log('Composants first hover', state);
    expect(state.open, `Composants should open on hover: ${JSON.stringify(state)}`).toBe(true);
    expect(state.count).toBeGreaterThan(0);
  });

  test('after Composants hover, Démarrage still opens on hover', async ({ page }) => {
    await waitShell(page);
    await page.mouse.move(400, 400);
    await page.locator('#nav-rail k3-nav-item').nth(1).hover({ force: true });
    await page.waitForTimeout(400);
    await page.locator('#nav-rail k3-nav-item').nth(0).hover({ force: true });
    await page.waitForTimeout(500);

    const state = await menuState(page);
    console.log('Démarrage after Composants', state);
    expect(state.open).toBe(true);
    expect(state.count).toBeGreaterThan(0);
    expect(state.count).toBeLessThan(20); /* hub, not 98 components */
  });
});
