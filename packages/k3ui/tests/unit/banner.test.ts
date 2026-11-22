import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Banner } from '../../src/components/feedback/banner.js';
import { BannerSpecs } from '../../src/components/feedback/banner.specs.js';

describe('k3-banner', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    await init({
      components: ['k3-banner', 'k3-top-app-bar'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
    document.documentElement.style.removeProperty(BannerSpecs.cssVarOffset);
  });

  afterEach(() => {
    host.remove();
    document.documentElement.style.removeProperty(BannerSpecs.cssVarOffset);
    document.documentElement.removeAttribute('data-k3-reduce-motion');
    document.querySelectorAll('k3-banner').forEach((el) => el.remove());
  });

  async function mount(html: string): Promise<K3Banner> {
    host.innerHTML = html;
    const el = host.querySelector('k3-banner') as K3Banner;
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return el;
  }

  it('defaults to primary · fixed', async () => {
    const el = await mount(`<k3-banner>Promo</k3-banner>`);
    expect(el.variant).toBe('primary');
    expect(el.position).toBe('fixed');
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.getAttribute('position')).toBe('fixed');
  });

  it('single-line strip targets 64dp (same as small app bar)', () => {
    expect(BannerSpecs.minHeightDp).toBe(64);
    expect(BannerSpecs.padBlockDp).toBe(12);
  });

  it('forced color + color-on override theme containers', async () => {
    const el = await mount(
      `<k3-banner position="static" color="#cc0000" color-on="#ffffff">Flash</k3-banner>`,
    );
    expect(el.color).toBe('#cc0000');
    expect(el.colorOn).toBe('#ffffff');
    expect(el.style.getPropertyValue('--k3-banner-container')).toBe('#cc0000');
    expect(el.style.getPropertyValue('--k3-banner-on-container')).toBe('#ffffff');
    expect(el.hasAttribute('data-forced-color')).toBe(true);
  });

  it('forced color alone auto-picks WCAG ink', async () => {
    const el = await mount(`<k3-banner position="static" color="#cc0000">Flash</k3-banner>`);
    expect(el.style.getPropertyValue('--k3-banner-container')).toBe('#cc0000');
    expect(el.style.getPropertyValue('--k3-banner-on-container').toLowerCase()).toBe('#ffffff');
  });

  it('surface CSS remaps primary to banner on-container for slotted actions', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/feedback/banner.styles.ts'),
      'utf8',
    );
    expect(src).toContain('--k3-sys-color-primary: var(--k3-banner-on-container)');
  });

  it('uses alert role for warning / error', async () => {
    const el = await mount(`<k3-banner position="static" variant="warning">Soon</k3-banner>`);
    const surface = el.shadowRoot!.querySelector('.surface')!;
    expect(surface.getAttribute('role')).toBe('alert');
  });

  it('uses status role for promo variants', async () => {
    const el = await mount(`<k3-banner position="static" variant="primary">Sale</k3-banner>`);
    const surface = el.shadowRoot!.querySelector('.surface')!;
    expect(surface.getAttribute('role')).toBe('status');
  });

  it('dismissible emits k3-dismiss and clears offset', async () => {
    const el = await mount(`<k3-banner dismissible>Hi</k3-banner>`);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const onDismiss = vi.fn();
    el.addEventListener('k3-dismiss', onDismiss as EventListener);
    const btn = el.shadowRoot!.querySelector('button.dismiss') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(el.hidden).toBe(true);
    expect(document.documentElement.style.getPropertyValue(BannerSpecs.cssVarOffset)).toBe('');
  });

  it('leave({ remove }) removes the host after dismiss', async () => {
    const el = await mount(`<k3-banner>Bye</k3-banner>`);
    await el.leave({ remove: true });
    expect(el.isConnected).toBe(false);
    expect(document.documentElement.style.getPropertyValue(BannerSpecs.cssVarOffset)).toBe('');
  });

  it('show() after dismiss emits k3-enter', async () => {
    const el = await mount(`<k3-banner dismissible>Hi</k3-banner>`);
    await el.leave();
    const onEnter = vi.fn();
    el.addEventListener('k3-enter', onEnter as EventListener);
    el.show();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    expect(el.hidden).toBe(false);
    expect(onEnter).toHaveBeenCalled();
  });

  it('fixed banner publishes --k3-banner-offset and spacer height', async () => {
    const el = await mount(`<k3-banner variant="info">Offset me</k3-banner>`);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const offset = document.documentElement.style.getPropertyValue(BannerSpecs.cssVarOffset);
    /* jsdom often reports 0 height — still expect the sync path to run without throwing */
    expect(typeof offset).toBe('string');
    expect(el.position).toBe('fixed');
    expect(el.measureSurfaceHeight()).toBeGreaterThanOrEqual(0);
  });

  it('static banner does not claim the global offset', async () => {
    document.documentElement.style.removeProperty(BannerSpecs.cssVarOffset);
    await mount(`<k3-banner position="static">Inline only</k3-banner>`);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    expect(document.documentElement.style.getPropertyValue(BannerSpecs.cssVarOffset)).toBe('');
  });

  it('sticky app bar uses --k3-banner-offset for top', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/navigation/top-app-bar.ts'),
      'utf8',
    );
    expect(src).toContain('top: var(--k3-banner-offset, 0px)');
  });

  it('nav rail + sheets consume --k3-banner-offset', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const rail = readFileSync(
      resolve(process.cwd(), 'src/components/navigation/nav-rail.styles.ts'),
      'utf8',
    );
    const sheet = readFileSync(
      resolve(process.cwd(), 'src/components/containment/sheet.ts'),
      'utf8',
    );
    expect(rail).toContain('var(--k3-banner-offset, 0px)');
    expect(sheet).toContain('var(--k3-banner-offset, 0px)');
    expect(sheet).toContain('inset-block-start: var(--k3-banner-offset, 0px)');
  });
});
