import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerSheetChromeHost,
  unregisterSheetChromeHost,
  recomputeSheetChromeShift,
  type SheetChromeHost,
} from '../../src/components/containment/sheet-chrome-shift.js';

describe('sheet-chrome-shift', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-k3-sheet-chrome-hidden');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-k3-sheet-chrome-hidden');
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
});
