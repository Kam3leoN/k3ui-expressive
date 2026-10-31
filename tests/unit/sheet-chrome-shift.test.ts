import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerSheetChromeHost,
  unregisterSheetChromeHost,
  recomputeSheetChromeShift,
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
});
