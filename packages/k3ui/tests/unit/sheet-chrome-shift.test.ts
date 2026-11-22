import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerSheetChromeHost,
  unregisterSheetChromeHost,
  recomputeSheetChromeShift,
  markSheetChromeOpening,
  clearSheetChromeOpening,
  type SheetChromeHost,
} from '../../src/components/containment/sheet-chrome-shift.js';
import { FAB_OVERLAY_CONCEAL_ATTR } from '../../src/components/actions/fab-visibility.js';

describe('sheet-chrome-shift', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-k3-sheet-chrome-hidden');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-k3-sheet-chrome-hidden');
    document.querySelectorAll('[data-k3-overlay-concealed]').forEach((el) => {
      el.removeAttribute('data-k3-overlay-concealed');
      el.removeAttribute('hidden');
    });
  });

  it('hides chrome while a modal sheet is visible', () => {
    const host = {
      modal: true,
      isSheetVisible: () => true,
    } as SheetChromeHost;
    registerSheetChromeHost(host);
    recomputeSheetChromeShift();
    expect(
      document.documentElement.hasAttribute('data-k3-sheet-chrome-hidden'),
    ).toBe(true);
    unregisterSheetChromeHost(host);
    expect(
      document.documentElement.hasAttribute('data-k3-sheet-chrome-hidden'),
    ).toBe(false);
  });

  it('hides chrome while opening before the sheet is visible', () => {
    const host = {
      modal: true,
      isSheetVisible: () => false,
    } as SheetChromeHost;
    registerSheetChromeHost(host);
    markSheetChromeOpening(host);
    expect(
      document.documentElement.hasAttribute('data-k3-sheet-chrome-hidden'),
    ).toBe(true);
    clearSheetChromeOpening(host);
    recomputeSheetChromeShift();
    expect(
      document.documentElement.hasAttribute('data-k3-sheet-chrome-hidden'),
    ).toBe(false);
    unregisterSheetChromeHost(host);
  });

  it('ignores non-modal sheets', () => {
    const host = {
      modal: false,
      isSheetVisible: () => true,
    } as SheetChromeHost;
    registerSheetChromeHost(host);
    recomputeSheetChromeShift();
    expect(
      document.documentElement.hasAttribute('data-k3-sheet-chrome-hidden'),
    ).toBe(false);
    unregisterSheetChromeHost(host);
  });

  it('conceals overlapping FABs in the overlay zone and restores them', async () => {
    const { init } = await import('../../src/index.js');
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-fab'], theme: { mode: 'light' } });

    const fab = document.createElement('k3-fab') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    document.body.appendChild(fab);
    await fab.updateComplete;

    const host = document.createElement('div') as HTMLElement & SheetChromeHost;
    host.modal = true;
    host.isSheetVisible = () => true;
    host.getOverlayZone = () => new DOMRect(0, 0, 400, 400);
    document.body.appendChild(host);

    vi.spyOn(fab, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(40, 40, 56, 56),
    );

    registerSheetChromeHost(host);
    recomputeSheetChromeShift();
    expect(fab.hasAttribute(FAB_OVERLAY_CONCEAL_ATTR)).toBe(true);

    unregisterSheetChromeHost(host);
    expect(fab.hasAttribute(FAB_OVERLAY_CONCEAL_ATTR)).toBe(false);

    fab.remove();
    host.remove();
  });

  it('skips nav-rail FAB even when the overlay zone covers it', async () => {
    const { init } = await import('../../src/index.js');
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-fab'], theme: { mode: 'light' } });

    const rail = document.createElement('k3-nav-rail');
    const fab = document.createElement('k3-fab') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    fab.slot = 'fab';
    rail.appendChild(fab);
    document.body.appendChild(rail);
    await fab.updateComplete;

    const host = document.createElement('div') as HTMLElement & SheetChromeHost;
    host.modal = true;
    host.isSheetVisible = () => true;
    /* Full viewport — still must not conceal shell nav chrome. */
    host.getOverlayZone = () => new DOMRect(0, 0, 2000, 2000);
    document.body.appendChild(host);

    vi.spyOn(fab, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(24, 24, 56, 56),
    );

    registerSheetChromeHost(host);
    recomputeSheetChromeShift();
    expect(fab.hasAttribute(FAB_OVERLAY_CONCEAL_ATTR)).toBe(false);

    unregisterSheetChromeHost(host);
    fab.remove();
    rail.remove();
    host.remove();
  });

  it('conceals only FABs on the opening trajectory (not the opposite side)', async () => {
    const { init } = await import('../../src/index.js');
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-fab'], theme: { mode: 'light' } });

    const left = document.createElement('k3-fab') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    const right = document.createElement('k3-fab') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    document.body.append(left, right);
    await Promise.all([left.updateComplete, right.updateComplete]);

    const host = document.createElement('div') as HTMLElement & SheetChromeHost;
    host.modal = true;
    host.isSheetVisible = () => false;
    /* Right-side sheet strip (~22rem) — left FAB stays, right FAB hides. */
    host.getOpeningOverlayZone = () => new DOMRect(800, 0, 352, 900);
    document.body.appendChild(host);

    vi.spyOn(left, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(24, 24, 56, 56),
    );
    vi.spyOn(right, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(900, 800, 56, 56),
    );

    registerSheetChromeHost(host);
    markSheetChromeOpening(host);
    expect(left.hasAttribute(FAB_OVERLAY_CONCEAL_ATTR)).toBe(false);
    expect(right.hasAttribute(FAB_OVERLAY_CONCEAL_ATTR)).toBe(true);

    unregisterSheetChromeHost(host);
    left.remove();
    right.remove();
    host.remove();
  });
});
