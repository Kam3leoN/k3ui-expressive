import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonSmartGeometryCssVars,
  ButtonSmartGlyphDp,
  ButtonSmartGridGapDp,
  ButtonSmartHeightDp,
  ButtonSmartIconBoxDp,
  ButtonSmartInsetDp,
  ButtonSmartPadInlineEndDp,
  ButtonSmartPadInlineStartDp,
  ButtonSmartSpecs,
} from '../../src/components/actions/button-smart.specs.js';
import type { K3ButtonSmart } from '../../src/components/actions/button-smart.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('button-smart specs (AOSP Compose CommonTileDefaults)', () => {
  it('matches SystemUI Compose tile geometry', () => {
    expect(ButtonSmartHeightDp).toBe(72);
    expect(ButtonSmartInsetDp).toBe(8);
    expect(ButtonSmartIconBoxDp).toBe(56);
    expect(ButtonSmartGlyphDp).toBe(28);
    expect(ButtonSmartGridGapDp).toBe(8);
    expect(ButtonSmartPadInlineStartDp).toBe(ButtonSmartInsetDp);
    expect(ButtonSmartPadInlineEndDp).toBe(ButtonSmartInsetDp);
    expect(ButtonSmartSpecs.geometry.iconBoxDp).toBe(
      ButtonSmartHeightDp - 2 * ButtonSmartInsetDp,
    );
  });

  it('lists snapped CSS vars for every geometry token', () => {
    expect(ButtonSmartGeometryCssVars.length).toBeGreaterThanOrEqual(8);
    expect(ButtonSmartGeometryCssVars.map(([n]) => n)).toContain(
      '--k3-button-smart-height',
    );
  });
});

describe('k3-button-smart', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-button-smart'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('toggles active and emits k3-toggle', async () => {
    host.innerHTML = `<k3-button-smart label="Flashlight"></k3-button-smart>`;
    const el = host.querySelector('k3-button-smart') as K3ButtonSmart;
    await el.updateComplete;
    let active: boolean | null = null;
    el.addEventListener('k3-toggle', ((e: Event) => {
      active = (e as CustomEvent).detail.active;
    }) as EventListener);
    el.toggle();
    await el.updateComplete;
    expect(el.active).toBe(true);
    expect(active).toBe(true);
  });

  it('ignores toggle when disabled', async () => {
    host.innerHTML = `<k3-button-smart label="Flashlight" disabled></k3-button-smart>`;
    const el = host.querySelector('k3-button-smart') as K3ButtonSmart;
    await el.updateComplete;
    const spy = vi.fn();
    el.addEventListener('k3-toggle', spy);
    el.toggle();
    expect(el.active).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('applies AOSP geometry as DPR-snapped CSS px', async () => {
    host.innerHTML = `<div class="btn-smart-grid"><k3-button-smart label="Wi-Fi"></k3-button-smart></div>`;
    const el = host.querySelector('k3-button-smart') as K3ButtonSmart;
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-button-smart-height').trim()).toBe(
      devicePixelSnapCss(ButtonSmartHeightDp),
    );
    expect(el.style.getPropertyValue('--k3-button-smart-inset').trim()).toBe(
      devicePixelSnapCss(ButtonSmartInsetDp),
    );
    expect(el.style.getPropertyValue('--k3-button-smart-icon-size').trim()).toBe(
      devicePixelSnapCss(ButtonSmartIconBoxDp),
    );
    expect(el.style.getPropertyValue('--k3-button-smart-glyph').trim()).toBe(
      devicePixelSnapCss(ButtonSmartGlyphDp),
    );
    const grid = host.querySelector('.btn-smart-grid') as HTMLElement;
    expect(grid.style.gap).toBe(devicePixelSnapCss(ButtonSmartGridGapDp));
  });

  it('wires attachTextMarquee viewport (track + label + ghost)', async () => {
    host.innerHTML = `<k3-button-smart label="Wi-Fi"></k3-button-smart>`;
    const el = host.querySelector('k3-button-smart') as K3ButtonSmart;
    await el.updateComplete;
    const root = el.shadowRoot!;
    expect(root.querySelector('.marquee .track')).toBeTruthy();
    expect(root.querySelectorAll('.marquee .label')).toHaveLength(2);
    expect(root.querySelector('.marquee .label.ghost')).toBeTruthy();
  });
});
