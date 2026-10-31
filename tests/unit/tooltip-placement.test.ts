import { describe, it, expect } from 'vitest';
import { resolveFloatingTipPlacement } from '../../src/components/feedback/tooltip-placement.js';

describe('tooltip corner placement (NW/NE/SW/SE mirrors)', () => {
  const r = { left: 100, right: 140, top: 200, bottom: 240, width: 40, height: 40 };
  const gap = 8;

  it('LTR — NE mirrors NW (same top, opposite inline edge + origin)', () => {
    const nw = resolveFloatingTipPlacement('top-start', r, gap, false);
    const ne = resolveFloatingTipPlacement('top-end', r, gap, false);
    expect(nw.top).toBe(ne.top);
    expect(nw.left).toBe(r.left);
    expect(ne.left).toBe(r.right);
    expect(nw.tx).toBe('0%');
    expect(ne.tx).toBe('-100%');
    expect(nw.ox).toBe('0%');
    expect(ne.ox).toBe('100%');
    expect(nw.oy).toBe('100%');
    expect(ne.oy).toBe('100%');
  });

  it('LTR — SE mirrors SW', () => {
    const sw = resolveFloatingTipPlacement('bottom-start', r, gap, false);
    const se = resolveFloatingTipPlacement('bottom-end', r, gap, false);
    expect(sw.top).toBe(se.top);
    expect(sw.left).toBe(r.left);
    expect(se.left).toBe(r.right);
    expect(sw.ox).toBe('0%');
    expect(se.ox).toBe('100%');
    expect(sw.oy).toBe('0%');
    expect(se.oy).toBe('0%');
  });

  it('RTL flips start/end attachment without diagonal coords', () => {
    const nw = resolveFloatingTipPlacement('top-start', r, gap, true);
    const ne = resolveFloatingTipPlacement('top-end', r, gap, true);
    expect(nw.left).toBe(r.right);
    expect(ne.left).toBe(r.left);
    expect(nw.ox).toBe('100%');
    expect(ne.ox).toBe('0%');
    /* Both stay on the top axis — ty always -100% for top-* */
    expect(nw.ty).toBe('-100%');
    expect(ne.ty).toBe('-100%');
  });

  it('top / bottom stay centered on the preferred axis', () => {
    const top = resolveFloatingTipPlacement('top', r, gap, false);
    const bottom = resolveFloatingTipPlacement('bottom', r, gap, false);
    expect(top.left).toBe(r.left + r.width / 2);
    expect(top.tx).toBe('-50%');
    expect(top.oy).toBe('100%');
    expect(bottom.top).toBe(r.bottom + gap);
    expect(bottom.oy).toBe('0%');
  });
});
