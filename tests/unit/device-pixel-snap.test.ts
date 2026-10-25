import { describe, it, expect } from 'vitest';
import {
  devicePixelSnapPx,
  devicePixelSnapCss,
} from '../../src/core/css-length.js';

describe('devicePixelSnapPx', () => {
  it('keeps 2px at 100% / 200% DPR', () => {
    expect(devicePixelSnapPx(2, 1)).toBe(2);
    expect(devicePixelSnapPx(2, 2)).toBe(2);
  });

  it('snaps 2px @125% to 2.4px (3 physical) — never 2.5', () => {
    expect(devicePixelSnapPx(2, 1.25)).toBe(2.4);
    expect(devicePixelSnapPx(2, 1.25) * 1.25).toBe(3);
  });

  it('snaps 2px @150% to 2px (3 physical)', () => {
    expect(devicePixelSnapPx(2, 1.5)).toBe(2);
    expect(devicePixelSnapPx(2, 1.5) * 1.5).toBe(3);
  });

  it('never returns a sub-physical length', () => {
    expect(devicePixelSnapPx(0.4, 1.25) * 1.25).toBeGreaterThanOrEqual(1);
  });

  it('formats CSS', () => {
    expect(devicePixelSnapCss(2, 1.25)).toBe('2.4px');
  });
});
