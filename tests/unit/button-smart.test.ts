import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonSmartGlyphDp,
  ButtonSmartGridGapDp,
  ButtonSmartHeightDp,
  ButtonSmartIconBoxDp,
  ButtonSmartInsetDp,
} from '../../src/components/actions/button-smart.specs.js';
import type { K3ButtonSmart } from '../../src/components/actions/button-smart.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('button-smart specs (AOSP qs_tile_*)', () => {
  it('matches SystemUI dimens', () => {
    expect(ButtonSmartHeightDp).toBe(80);
    expect(ButtonSmartInsetDp).toBe(12);
    expect(ButtonSmartIconBoxDp).toBe(56);
    expect(ButtonSmartGlyphDp).toBe(20);
    expect(ButtonSmartGridGapDp).toBe(8);
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

  it('applies AOSP geometry as DPR-snapped CSS px', async () => {
    host.innerHTML = `<div class="btn-smart-grid"><k3-button-smart label="Wi-Fi"></k3-button-smart></div>`;
    const el = host.querySelector('k3-button-smart') as K3ButtonSmart;
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-button-smart-height').trim()).toBe(
      devicePixelSnapCss(ButtonSmartHeightDp),
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
});
