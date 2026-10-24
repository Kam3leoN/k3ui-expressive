import { describe, expect, it } from 'vitest';
import {
  computeDockedPosition,
  placeVerticalDocked,
} from '../../src/core/anchored-position.js';

describe('placeVerticalDocked', () => {
  it('opens below when there is room', () => {
    const tr = new DOMRect(20, 100, 40, 40);
    const r = placeVerticalDocked(tr, 120, 600, false, { gap: 4, edge: 8 });
    expect(r.above).toBe(false);
    expect(r.top).toBe(144);
    expect(r.maxHeight).toBeNull();
  });

  it('flips above and caps maxHeight near the bottom', () => {
    const tr = new DOMRect(20, 500, 40, 40);
    const r = placeVerticalDocked(tr, 400, 600, false, { gap: 4, edge: 8, minH: 48 });
    expect(r.above).toBe(true);
    expect(r.top).toBe(8);
    expect(r.maxHeight).toBeGreaterThan(0);
    /* Docked to trigger top — not clamped away leaving a gap */
    expect(r.maxHeight).toBe(Math.max(48, 500 - 4 - 8));
  });
});

describe('computeDockedPosition', () => {
  it('stays docked below without clamping top off the anchor', () => {
    const anchor = new DOMRect(40, 80, 120, 40);
    const r = computeDockedPosition(
      anchor,
      { width: 280, height: 200 },
      { width: 800, height: 600 },
      8,
      8,
    );
    expect(r.flip).toBe('bottom');
    expect(r.top).toBe(80 + 40 + 8);
    expect(r.left).toBe(40);
  });

  it('flips above near the bottom edge', () => {
    const anchor = new DOMRect(40, 520, 120, 40);
    const r = computeDockedPosition(
      anchor,
      { width: 280, height: 300 },
      { width: 800, height: 600 },
      8,
      8,
    );
    expect(r.flip).toBe('top');
    expect(r.top).toBe(8);
    expect(r.maxHeight).not.toBeNull();
  });
});
