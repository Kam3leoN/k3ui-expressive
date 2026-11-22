import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonGridCellDp,
  ButtonGridGapDp,
  ButtonGridSizeDp,
} from '../../src/components/actions/button-grid.specs.js';
import type { K3ButtonGrid } from '../../src/components/actions/button-grid.js';
import {
  devicePixelSnapCss,
  devicePixelSnapPx,
} from '../../src/core/css-length.js';

describe('button-grid specs', () => {
  it('matches M3E 3×3 geometry', () => {
    expect(ButtonGridCellDp).toBe(48);
    expect(ButtonGridGapDp).toBe(2);
    expect(ButtonGridSizeDp).toBe(148);
  });
});

describe('k3-button-grid', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-button-grid'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('selects 0-based index and emits k3-select', async () => {
    host.innerHTML = `<k3-button-grid trigger-fab="false"></k3-button-grid>`;
    const el = host.querySelector('k3-button-grid') as K3ButtonGrid;
    await el.updateComplete;
    let detail: { index: number; label: string } | null = null;
    el.addEventListener('k3-select', ((e: Event) => {
      detail = (e as CustomEvent).detail;
    }) as EventListener);
    el.select(4);
    expect(detail).toEqual({ index: 4, label: '5' });
  });

  it('snaps --k3-btn-grid-gap / size to integer device pixels (125% DPI)', async () => {
    host.innerHTML = `<k3-button-grid trigger-fab="false"></k3-button-grid>`;
    const el = host.querySelector('k3-button-grid') as K3ButtonGrid;
    await el.updateComplete;
    const gapPx = devicePixelSnapPx(ButtonGridGapDp);
    expect(el.style.getPropertyValue('--k3-btn-grid-gap').trim()).toBe(
      devicePixelSnapCss(ButtonGridGapDp),
    );
    expect(el.style.getPropertyValue('--k3-btn-grid-size').trim()).toBe(
      `${3 * ButtonGridCellDp + 2 * gapPx}px`,
    );
  });
});
