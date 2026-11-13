import { test, expect, type Page } from '@playwright/test';

const open = async (page: Page) => {
  await page.goto('/#/coverflow');
  await page.waitForFunction(
    () =>
      document.querySelector('.comp-page[data-page="coverflow"]')?.classList.contains('is-active') &&
      !document.documentElement.hasAttribute('data-k3-deeplink') &&
      !document.documentElement.hasAttribute('data-k3-booting'),
    null,
    { timeout: 20_000 },
  );
  const flow = page.locator('#coverflow-demo');
  await flow.scrollIntoViewIfNeeded();
  await expect(flow.locator('k3-coverflow-item[active]')).toHaveCount(1, { timeout: 15_000 });
  return flow;
};

const index = (page: Page, id = 'coverflow-demo') =>
  page.evaluate((id) => (document.getElementById(id) as HTMLElement & { index: number }).index, id);

const setMode = async (page: Page, mode: 'lightbox' | 'flip') => {
  await page.locator(`#cf-mode k3-button[value="${mode}"]`).click();
  await expect(page.locator('#coverflow-demo k3-coverflow-item').first()).toBeVisible();
};

test('side covers are hit-testable and come to the centre on click', async ({ page }) => {
  const flow = await open(page);
  const box = (await flow.boundingBox())!;
  const y = box.y + box.height * 0.3;
  const right = await page.evaluate(
    ([x, y]) => {
      const item = document.elementFromPoint(x, y)?.closest('k3-coverflow-item');
      return item ? [...item.parentElement!.children].indexOf(item) : -1;
    },
    [box.x + box.width / 2 + box.width * 0.2, y],
  );
  expect(right).toBeGreaterThan(0);
  await page.mouse.click(box.x + box.width / 2 + box.width * 0.2, y);
  await expect.poll(() => index(page)).toBe(right);
});

test('drag with momentum moves several covers; the release click is swallowed', async ({ page }) => {
  const flow = await open(page);
  const box = (await flow.boundingBox())!;
  const y = box.y + box.height * 0.3;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 30, y);
  await page.mouse.up();
  await expect.poll(() => index(page)).toBeGreaterThanOrEqual(2);
  expect(page.context().pages()).toHaveLength(1);
});

test('lightbox: the centred cover opens its image over a scrim (top layer, no dialog, no new tab)', async ({ page }) => {
  const flow = await open(page);
  await setMode(page, 'lightbox');
  const box = (await flow.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.3);
  const lb = flow.locator('.lightbox');
  await expect(lb).toBeVisible();
  await expect(lb).toHaveClass(/open/);
  expect(await lb.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  expect(await page.locator('dialog').count()).toBe(0);
  const img = lb.locator('img');
  await expect(img).toHaveAttribute('src', '/coverflow/full/alpine-dawn.webp');
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
  /* Covers the viewport, image in the middle */
  const r = (await lb.boundingBox())!;
  expect(r.width).toBe(page.viewportSize()!.width);
  await expect(lb.locator('.lb-close')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(img).toHaveAttribute('src', '/coverflow/full/coffee.webp');
  await expect.poll(() => index(page)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(lb).toHaveCount(0);
  expect(page.context().pages()).toHaveLength(1);
  /* Focus back on the cover now centred */
  await expect
    .poll(() => page.evaluate(() => (document.activeElement as HTMLElement & { index?: number })?.index))
    .toBe(1);
});

test('without lightbox, the centred cover follows its link', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const flow = document.createElement('k3-coverflow');
    flow.id = 'cf-plain';
    flow.innerHTML =
      '<k3-coverflow-item href="/robots.txt" target="_blank"><img src="/coverflow/cat.webp" alt="Cat" /></k3-coverflow-item>' +
      '<k3-coverflow-item href="/robots.txt"><img src="/coverflow/coffee.webp" alt="Coffee" /></k3-coverflow-item>';
    document.querySelector('#coverflow-demo')!.closest('.demo-case-stage')!.prepend(flow);
  });
  const flow = page.locator('#cf-plain');
  await expect(flow.locator('k3-coverflow-item[active]')).toHaveCount(1);
  await flow.scrollIntoViewIfNeeded();
  const [popup] = await Promise.all([page.waitForEvent('popup'), flow.locator('k3-coverflow-item[active] >> a').click()]);
  expect(popup.url()).toContain('/robots.txt');
});

test('side arrows and bullets navigate; the active bullet is 3× wider', async ({ page }) => {
  const flow = await open(page);
  await flow.locator('.arrow.next').click();
  await expect.poll(() => index(page)).toBe(1);
  await flow.locator('.arrow.prev').click();
  await expect.poll(() => index(page)).toBe(0);
  await flow.locator('.bullet').nth(4).click();
  await expect.poll(() => index(page)).toBe(4);
  await expect(flow.locator('.bullet').nth(4)).toHaveAttribute('aria-current', 'true');
  const widths = await flow.locator('.bullet').evaluateAll((els) =>
    els.map((b) => parseFloat(getComputedStyle(b, '::before').width)),
  );
  expect(widths[4]).toBeCloseTo(widths[0]! * 3, 0);
});

test('full width: side covers reach both edges of the container', async ({ page }) => {
  const flow = await open(page);
  await expect(flow).toHaveAttribute('full-width', '');
  const r = await flow.evaluate((el) => {
    const vp = el.shadowRoot!.querySelector('.viewport')!.getBoundingClientRect();
    const covers = [...el.querySelectorAll('k3-coverflow-item:not([data-hidden])')].map((c) => c.getBoundingClientRect());
    return {
      left: Math.min(...covers.map((c) => c.left)) - vp.left,
      right: vp.right - Math.max(...covers.map((c) => c.right)),
    };
  });
  expect(r.left).toBeLessThanOrEqual(12);
  expect(r.right).toBeLessThanOrEqual(12);
});

test('flip covers turn over on click and on Enter; arrows move', async ({ page }) => {
  const flow = await open(page);
  await setMode(page, 'flip');
  await expect(flow.locator('k3-coverflow-item[flip]').first()).toBeVisible();
  const centre = flow.locator('k3-coverflow-item[active]');
  await expect(centre).toHaveCount(1);
  await centre.click();
  await expect(centre).toHaveAttribute('flipped', '');
  await expect(centre).toHaveAttribute('aria-pressed', 'true');
  await centre.press('Enter');
  await expect(flow.locator('k3-coverflow-item[flipped]')).toHaveCount(0);
  const before = await index(page);
  await centre.press('ArrowRight');
  await expect.poll(() => index(page)).toBe(before + 1);
  /* Focus followed the new centre */
  expect(await page.evaluate(() => (document.activeElement as HTMLElement & { active?: boolean })?.active)).toBe(true);
});

test('no horizontal overflow on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('vertical via toolbar: click below, drag up, ↑ ↓, arrows, bullets, wheel and lightbox', async ({ page }) => {
  const flow = await open(page);
  await page.locator('#cf-orient k3-button[value="vertical"]').click();
  await expect(flow).toHaveAttribute('orientation', 'vertical');
  await expect(flow).toHaveClass(/coverflow-vertical-demo/);
  /* Match the former vertical demo layout (not full-width) */
  await page.locator('#cf-width k3-button[value="container"]').click();
  await flow.evaluate((el) => {
    (el as HTMLElement & { index: number }).index = 2;
  });
  const idx = () => index(page);
  await expect.poll(idx).toBe(2);
  await flow.scrollIntoViewIfNeeded();
  await expect.poll(async () => {
    const t = await flow.locator('k3-coverflow-item').nth(3).evaluate((el) => (el as HTMLElement).style.transform);
    return /^translate3d\(0(px)?, [\d.]+px/.test(t);
  }).toBe(true);
  const box = (await flow.boundingBox())!;
  const x = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  /* Scan below the centre for a hit-testable side cover */
  const hit = await page.evaluate(
    ([px, cy0, h]) => {
      for (let dy = Math.round(h * 0.12); dy < h * 0.42; dy += 4) {
        const item = document.elementFromPoint(px, cy0 + dy)?.closest('k3-coverflow-item');
        if (!item || (item as HTMLElement & { active?: boolean }).active) continue;
        const i = [...item.parentElement!.children].indexOf(item);
        if (i > 2) return { i, y: cy0 + dy };
      }
      return { i: -1, y: cy0 };
    },
    [x, cy, box.height] as [number, number, number],
  );
  expect(hit.i).toBeGreaterThan(2);
  await page.mouse.click(x, hit.y);
  await expect.poll(idx).toBe(hit.i);
  /* Dragging up brings the next covers */
  await page.mouse.move(x, cy);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x, cy - i * 25);
  await page.mouse.up();
  await expect.poll(idx).toBeGreaterThanOrEqual(hit.i + 2);
  const after = await idx();
  await flow.locator('k3-coverflow-item[active]').press('ArrowUp');
  await expect.poll(idx).toBe(after - 1);
  await flow.locator('.arrow.next').click();
  await expect.poll(idx).toBe(after);
  await flow.locator('.bullet').nth(0).click();
  await expect.poll(idx).toBe(0);
  await page.mouse.move(x, cy);
  await page.mouse.wheel(0, 130);
  await expect.poll(idx).toBe(2);
  /* Active bullet 3× taller */
  const heights = await flow.locator('.bullet').evaluateAll((els) =>
    els.map((b) => parseFloat(getComputedStyle(b, '::before').height)),
  );
  expect(heights[2]).toBeCloseTo(heights[0]! * 3, 0);
  /* Covers sit on the y axis and tilt around x */
  const t = await flow.locator('k3-coverflow-item').nth(3).evaluate((el) => (el as HTMLElement).style.transform);
  expect(t).toMatch(/^translate3d\(0(px)?, [\d.]+px, -[\d.]+px\) rotateX\(60/);
  /* Lightbox from the vertical flow */
  await page.mouse.click(x, cy);
  await expect(flow.locator('.lightbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect.poll(idx).toBe(3);
  await page.keyboard.press('Escape');
  await expect(flow.locator('.lightbox')).toHaveCount(0);
});

test('slide effect via toolbar: flat row filling the width, centred cover larger, with reflection', async ({ page }) => {
  const flow = await open(page);
  await page.locator('#cf-effect k3-button[value="slide"]').click();
  await expect(flow).toHaveAttribute('effect', 'slide');
  await expect(flow).toHaveClass(/coverflow-slide-demo/);
  await expect(flow).toHaveAttribute('data-reflect', '');
  const start = await index(page);
  const sizes = await flow.evaluate((el) => {
    const items = [...el.querySelectorAll('k3-coverflow-item')];
    const active = items.findIndex((i) => (i as HTMLElement & { active: boolean }).active);
    const size = (i: Element) => i.getBoundingClientRect().width;
    return { active: size(items[active]!), next: size(items[active + 1]!), t: (items[active + 1] as HTMLElement).style.transform };
  });
  expect(sizes.active / sizes.next).toBeCloseTo(1.4, 1);
  expect(sizes.t).not.toContain('rotate');
  /* The row reaches both edges */
  const r = await flow.evaluate((el) => {
    const vp = el.shadowRoot!.querySelector('.viewport')!.getBoundingClientRect();
    const rects = [...el.querySelectorAll('k3-coverflow-item:not([data-hidden])')].map((c) => c.getBoundingClientRect());
    return [Math.min(...rects.map((c) => c.left)) - vp.left, vp.right - Math.max(...rects.map((c) => c.right))];
  });
  expect(r[0]).toBeLessThanOrEqual(0);
  expect(r[1]).toBeLessThanOrEqual(0);
  await flow.locator('.arrow.next').click();
  await expect.poll(() => index(page)).toBe(start + 1);
  /* A side cover comes to the centre (the next one: outer covers sit under the arrows) */
  const box = (await flow.locator('k3-coverflow-item').nth(start + 2).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => index(page)).toBe(start + 2);
});

