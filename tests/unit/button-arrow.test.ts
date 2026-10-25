import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import { ButtonArrowSizeDp } from '../../src/components/actions/button-arrow.specs.js';
import type { K3ButtonArrow } from '../../src/components/actions/button-arrow.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('button-arrow specs', () => {
  it('matches M3E Small geometry', () => {
    expect(ButtonArrowSizeDp.half).toBe(48);
    expect(ButtonArrowSizeDp.gap).toBe(2);
    expect(ButtonArrowSizeDp.outerRadius).toBe(24);
    expect(ButtonArrowSizeDp.innerRadius).toBe(4);
  });
});

describe('k3-button-arrow', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-button-arrow'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('cycles list and emits k3-change', async () => {
    host.innerHTML = `<k3-button-arrow list="A,B,C" index="0"></k3-button-arrow>`;
    const el = host.querySelector('k3-button-arrow') as K3ButtonArrow;
    await el.updateComplete;
    const events: unknown[] = [];
    el.addEventListener('k3-change', ((e: Event) => {
      events.push((e as CustomEvent).detail);
    }) as EventListener);
    el.next();
    await el.updateComplete;
    expect(el.index).toBe(1);
    expect(el.value).toBe('B');
    expect(events[0]).toEqual({ value: 'B', index: 1 });
    el.prev();
    expect(el.index).toBe(0);
  });

  it('snaps --k3-ba-gap to integer device pixels (125% DPI)', async () => {
    host.innerHTML = `<k3-button-arrow list="A,B"></k3-button-arrow>`;
    const el = host.querySelector('k3-button-arrow') as K3ButtonArrow;
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-ba-gap').trim()).toBe(
      devicePixelSnapCss(ButtonArrowSizeDp.gap),
    );
  });
});
