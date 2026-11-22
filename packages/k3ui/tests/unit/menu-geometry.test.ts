import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  applyFlyoutPlace,
  clearFlyoutPlace,
  computeSubmenuFlyoutPlace,
  layoutBoundingRect,
  measureContentBox,
} from '../../src/components/containment/menu-geometry.js';

describe('computeSubmenuFlyoutPlace', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 800);
    vi.stubGlobal('innerHeight', 600);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('edge-anchors to parent right in LTR when room allows', () => {
    const place = computeSubmenuFlyoutPlace({
      itemRect: new DOMRect(100, 200, 180, 48),
      panelRect: new DOMRect(100, 100, 200, 300),
      flyoutW: 160,
      flyoutH: 120,
      rtl: false,
      depth: 0,
    });
    expect(place.left).toBe('296px'); /* panel.right - overlap(4) */
    expect(place.right).toBe('auto');
    expect(place.origin).toBe('start');
    expect(place.top).toBe('200px');
    expect(place.zIndex).toBe(70);
  });

  it('flips to left (end origin) when LTR end room is tight', () => {
    const place = computeSubmenuFlyoutPlace({
      itemRect: new DOMRect(620, 200, 160, 48),
      panelRect: new DOMRect(600, 100, 180, 300),
      flyoutW: 200,
      flyoutH: 120,
      rtl: false,
      depth: 1,
    });
    expect(place.right).toBe('196px'); /* vw - panel.left - overlap */
    expect(place.left).toBe('auto');
    expect(place.origin).toBe('end');
    expect(place.zIndex).toBe(71);
  });

  it('edge-anchors to parent left in RTL when room allows', () => {
    const place = computeSubmenuFlyoutPlace({
      itemRect: new DOMRect(400, 180, 180, 48),
      panelRect: new DOMRect(400, 80, 200, 300),
      flyoutW: 160,
      flyoutH: 100,
      rtl: true,
      depth: 0,
    });
    expect(place.right).toBe('396px'); /* vw - panel.left - overlap */
    expect(place.left).toBe('auto');
    expect(place.origin).toBe('end');
  });

  it('clamps top so flyout stays in viewport', () => {
    const place = computeSubmenuFlyoutPlace({
      itemRect: new DOMRect(100, 520, 180, 48),
      panelRect: new DOMRect(100, 100, 200, 400),
      flyoutW: 160,
      flyoutH: 120,
      rtl: false,
      depth: 0,
    });
    expect(Number.parseInt(place.top, 10)).toBeLessThanOrEqual(600 - 8 - 120);
    expect(Number.parseInt(place.top, 10)).toBeGreaterThanOrEqual(8);
  });
});

describe('applyFlyoutPlace / clearFlyoutPlace', () => {
  let flyout: HTMLElement;

  beforeEach(() => {
    flyout = document.createElement('div');
    document.body.append(flyout);
  });

  afterEach(() => {
    flyout.remove();
  });

  it('writes coords once and skips identical re-apply', () => {
    const place = {
      left: '300px',
      right: 'auto',
      top: '120px',
      origin: 'start' as const,
      zIndex: 70,
    };
    expect(applyFlyoutPlace(flyout, place, true)).toBe(true);
    expect(flyout.getAttribute('data-placed')).toBe('');
    expect(flyout.style.left).toBe('300px');
    expect(flyout.dataset.origin).toBe('start');
    expect(applyFlyoutPlace(flyout, place, true)).toBe(false);
  });

  it('clearFlyoutPlace removes imperative styles', () => {
    applyFlyoutPlace(
      flyout,
      { left: '10px', right: 'auto', top: '20px', origin: 'end', zIndex: 72 },
      true,
    );
    clearFlyoutPlace(flyout);
    expect(flyout.hasAttribute('data-placed')).toBe(false);
    expect(flyout.hasAttribute('data-origin')).toBe(false);
    expect(flyout.style.left).toBe('');
    expect(flyout.style.zIndex).toBe('');
  });
});

describe('layoutBoundingRect / measureContentBox', () => {
  it('returns visual rect when layout matches transform box', () => {
    const el = document.createElement('div');
    document.body.append(el);
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 40 });
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 20,
      bottom: 50,
      right: 120,
      width: 100,
      height: 40,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    });
    const r = layoutBoundingRect(el);
    expect(r.left).toBe(20);
    expect(r.width).toBe(100);
    el.remove();
  });

  it('measureContentBox prefers children over zero paint', () => {
    const el = document.createElement('div');
    const child = document.createElement('div');
    el.append(child);
    document.body.append(el);
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 0 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 0 });
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 0 });
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 0 });
    Object.defineProperty(child, 'offsetWidth', { configurable: true, value: 180 });
    Object.defineProperty(child, 'offsetHeight', { configurable: true, value: 96 });
    Object.defineProperty(child, 'scrollWidth', { configurable: true, value: 180 });
    Object.defineProperty(child, 'scrollHeight', { configurable: true, value: 96 });
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const box = measureContentBox(el, { w: 112, h: 48 });
    expect(box.w).toBe(180);
    expect(box.h).toBe(96);
    el.remove();
  });
});
