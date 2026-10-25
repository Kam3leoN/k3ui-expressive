import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonPadSizeDp,
  ButtonPadDiagonalCells,
} from '../../src/components/actions/button-pad.specs.js';
import type { K3ButtonPad } from '../../src/components/actions/button-pad.js';
import {
  devicePixelSnapCss,
  devicePixelSnapPx,
} from '../../src/core/css-length.js';

describe('button-pad specs', () => {
  it('matches M3E Small geometry + 4 diagonal cells', () => {
    expect(ButtonPadSizeDp.cell).toBe(48);
    expect(ButtonPadSizeDp.gap).toBe(2);
    expect(ButtonPadSizeDp.grid).toBe(98);
    expect(ButtonPadDiagonalCells).toHaveLength(4);
  });
});

describe('k3-button-pad', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-button-pad'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('emits k3-navigate with direction', async () => {
    host.innerHTML = `<k3-button-pad mode="diagonal" variant="filled"></k3-button-pad>`;
    const el = host.querySelector('k3-button-pad') as K3ButtonPad;
    await el.updateComplete;
    let dir = '';
    el.addEventListener('k3-navigate', ((e: Event) => {
      dir = (e as CustomEvent).detail.direction;
    }) as EventListener);
    el.navigate('ne');
    expect(dir).toBe('ne');
    expect(el.shadowRoot!.querySelectorAll('button').length).toBe(4);
  });

  it('snaps --k3-bp-gap / grid to integer device pixels (125% DPI)', async () => {
    host.innerHTML = `<k3-button-pad mode="diagonal"></k3-button-pad>`;
    const el = host.querySelector('k3-button-pad') as K3ButtonPad;
    await el.updateComplete;
    const gapPx = devicePixelSnapPx(ButtonPadSizeDp.gap);
    expect(el.style.getPropertyValue('--k3-bp-gap').trim()).toBe(
      devicePixelSnapCss(ButtonPadSizeDp.gap),
    );
    expect(el.style.getPropertyValue('--k3-bp-grid').trim()).toBe(
      `${2 * ButtonPadSizeDp.cell + gapPx}px`,
    );
  });
});
