import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FLOATING_CHROME_INSET_INLINE_END_VAR,
  FLOATING_CHROME_INSET_INLINE_START_VAR,
  isBottomEndFloatingChrome,
  isBottomFloatingChrome,
  measureFloatingChromeInsetInlineEnd,
  measureFloatingChromeInsetInlineStart,
  syncFloatingChromeInsets,
} from '../../src/core/floating-chrome-inset.js';

describe('floating-chrome-inset', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('dir');
    document.documentElement.style.removeProperty(FLOATING_CHROME_INSET_INLINE_END_VAR);
    document.documentElement.style.removeProperty(FLOATING_CHROME_INSET_INLINE_START_VAR);
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      position: 'fixed',
      opacity: '1',
      display: 'block',
      visibility: 'visible',
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  function mockRect(el: HTMLElement, partial: Partial<DOMRect>): void {
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          x: partial.left ?? 0,
          y: partial.top ?? 0,
          left: partial.left ?? 0,
          top: partial.top ?? 0,
          right: partial.right ?? (partial.left ?? 0) + (partial.width ?? 0),
          bottom: partial.bottom ?? (partial.top ?? 0) + (partial.height ?? 0),
          width: partial.width ?? 0,
          height: partial.height ?? 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });
  }

  it('returns 0 when no floating chrome is present', () => {
    expect(measureFloatingChromeInsetInlineEnd()).toBe(0);
    expect(measureFloatingChromeInsetInlineStart()).toBe(0);
  });

  it('measures fab-menu[fixed] from the inline-end edge (LTR = right)', () => {
    const fab = document.createElement('k3-fab-menu');
    fab.setAttribute('fixed', '');
    fab.setAttribute('placement', 'bottom-end');
    document.body.appendChild(fab);
    mockRect(fab, { left: 928, top: 728, width: 56, height: 56, right: 984, bottom: 784 });
    expect(isBottomEndFloatingChrome(fab)).toBe(true);
    expect(measureFloatingChromeInsetInlineEnd()).toBe(72);
    expect(measureFloatingChromeInsetInlineStart()).toBe(0);
  });

  it('measures bottom-start chrome on the inline-start edge (LTR = left)', () => {
    const fab = document.createElement('k3-fab-menu');
    fab.setAttribute('fixed', '');
    fab.setAttribute('placement', 'bottom-start');
    document.body.appendChild(fab);
    mockRect(fab, { left: 16, top: 728, width: 56, height: 56, right: 72, bottom: 784 });
    expect(isBottomFloatingChrome(fab, 'start')).toBe(true);
    expect(isBottomFloatingChrome(fab, 'end')).toBe(false);
    expect(measureFloatingChromeInsetInlineStart()).toBe(72);
    expect(measureFloatingChromeInsetInlineEnd()).toBe(0);
  });

  it('uses the outermost peer when STT sits left of the FAB (end side)', () => {
    const fab = document.createElement('k3-fab-menu');
    fab.setAttribute('fixed', '');
    document.body.appendChild(fab);
    mockRect(fab, { left: 928, top: 728, width: 56, height: 56, right: 984, bottom: 784 });

    const stt = document.createElement('k3-scroll-to-top');
    stt.setAttribute('data-visible', '');
    document.body.appendChild(stt);
    mockRect(stt, { left: 856, top: 728, width: 56, height: 56, right: 912, bottom: 784 });

    expect(measureFloatingChromeInsetInlineEnd()).toBe(144);
  });

  it('RTL: end chrome on the physical left still fills inset-inline-end', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const fab = document.createElement('k3-fab-menu');
    fab.setAttribute('fixed', '');
    fab.setAttribute('placement', 'bottom-end');
    document.body.appendChild(fab);
    /* RTL end = left: fab at left 16..72 → reserved = right edge = 72 */
    mockRect(fab, { left: 16, top: 728, width: 56, height: 56, right: 72, bottom: 784 });
    expect(isBottomFloatingChrome(fab, 'end')).toBe(true);
    expect(measureFloatingChromeInsetInlineEnd()).toBe(72);
  });

  it('ignores scroll-to-top when not data-visible', () => {
    const stt = document.createElement('k3-scroll-to-top');
    document.body.appendChild(stt);
    mockRect(stt, { left: 856, top: 728, width: 56, height: 56, right: 912, bottom: 784 });
    expect(measureFloatingChromeInsetInlineEnd()).toBe(0);
  });

  it('publishes start + end CSS vars on <html>', () => {
    const endFab = document.createElement('k3-fab-menu');
    endFab.setAttribute('fixed', '');
    endFab.setAttribute('placement', 'bottom-end');
    document.body.appendChild(endFab);
    mockRect(endFab, { left: 928, top: 728, width: 56, height: 56, right: 984, bottom: 784 });

    const startFab = document.createElement('k3-fab-dial');
    startFab.setAttribute('fixed', '');
    startFab.setAttribute('position', 'bottom-left');
    document.body.appendChild(startFab);
    mockRect(startFab, { left: 16, top: 728, width: 56, height: 56, right: 72, bottom: 784 });

    const { start, end } = syncFloatingChromeInsets();
    expect(end).toBe(72);
    expect(start).toBe(72);
    expect(
      document.documentElement.style.getPropertyValue(FLOATING_CHROME_INSET_INLINE_END_VAR),
    ).toBe('72px');
    expect(
      document.documentElement.style.getPropertyValue(FLOATING_CHROME_INSET_INLINE_START_VAR),
    ).toBe('72px');
  });
});
