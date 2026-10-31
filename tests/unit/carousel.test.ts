import { describe, it, expect, afterEach } from 'vitest';
import {
  arrangeMultiBrowse,
  arrangeHero,
  createModel,
  itemGeometry,
  scrollForIndex,
  snapPoints,
  focalIndex,
} from '../../src/components/containment/carousel.keylines.js';
import '../../src/components/containment/carousel.js';
import type { K3Carousel } from '../../src/components/containment/carousel.js';

const sum = (
  a: {
    large: number;
    medium: number;
    small: number;
    largeCount: number;
    mediumCount: number;
    smallCount: number;
  },
  gap: number,
): number =>
  a.large * a.largeCount +
  a.medium * a.mediumCount +
  a.small * a.smallCount +
  gap * (a.largeCount + a.mediumCount + a.smallCount - 1);

describe('carousel keylines', () => {
  it('multi-browse arrangement fills the viewport exactly', () => {
    for (const w of [320, 412, 600, 840, 1200]) {
      const a = arrangeMultiBrowse(w);
      expect(sum(a, 8)).toBeCloseTo(w, 3);
      expect(a.small).toBeGreaterThanOrEqual(40);
      expect(a.small).toBeLessThanOrEqual(56);
      if (a.mediumCount) {
        expect(a.medium).toBeGreaterThan(a.small);
        expect(a.medium).toBeLessThanOrEqual(a.large);
      }
    }
  });

  it('hero arrangement: 1 large + 1 small (start) / 2 small (center)', () => {
    expect(sum(arrangeHero(400, 'start'), 8)).toBeCloseTo(400);
    const c = arrangeHero(400, 'center');
    expect(c.smallCount).toBe(2);
    expect(sum(c, 8)).toBeCloseTo(400);
  });

  it('first item is large at scroll 0, last item is large at max scroll', () => {
    const m = createModel('multi-browse', 'start', 412, 8);
    expect(itemGeometry(m, 0, 0).size).toBeCloseTo(m.large);
    expect(itemGeometry(m, 0, 0).center).toBeCloseTo(m.large / 2);
    const end = itemGeometry(m, 7, m.maxScroll);
    expect(end.size).toBeCloseTo(m.large);
    expect(end.center + end.size / 2).toBeCloseTo(412);
  });

  it('item sizes stay continuous while scrolling (no popping)', () => {
    for (const layout of ['multi-browse', 'hero'] as const) {
      const m = createModel(layout, layout === 'hero' ? 'center' : 'start', 412, 6);
      for (let i = 0; i < 6; i++) {
        let prev = itemGeometry(m, i, 0);
        for (let s = 1; s <= m.maxScroll; s += 1) {
          const g = itemGeometry(m, i, s);
          expect(Math.abs(g.size - prev.size)).toBeLessThan(4);
          expect(Math.abs(g.center - prev.center)).toBeLessThan(6);
          prev = g;
        }
      }
    }
  });

  it('snap points are sorted, bounded, and every index is reachable', () => {
    const m = createModel('multi-browse', 'start', 600, 10);
    const pts = snapPoints(m);
    expect(pts[0]).toBe(0);
    expect(pts[pts.length - 1]).toBe(Math.round(m.maxScroll));
    let prev = -1;
    for (let i = 0; i < 10; i++) {
      const f = focalIndex(m, scrollForIndex(m, i));
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
      if (scrollForIndex(m, i) < m.maxScroll) expect(f).toBe(i);
    }
    expect(scrollForIndex(m, 9)).toBe(m.maxScroll);
  });
});

describe('k3-carousel', () => {
  let el: K3Carousel;
  afterEach(() => el?.remove());

  it('exposes carousel region semantics and labels slides', async () => {
    el = document.createElement('k3-carousel') as K3Carousel;
    el.label = 'Featured';
    el.innerHTML =
      '<k3-carousel-item label="A"></k3-carousel-item><k3-carousel-item></k3-carousel-item>';
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r));
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-roledescription')).toBe('carousel');
    expect(el.getAttribute('aria-label')).toBe('Featured');
    const items = el.querySelectorAll('k3-carousel-item');
    expect(items[0].getAttribute('aria-roledescription')).toBe('slide');
    expect(items[0].getAttribute('aria-label')).toBe('A, 1 of 2');
    expect(items[1].getAttribute('aria-label')).toBe('2 of 2');
    expect((items[0] as HTMLElement).tabIndex).toBe(0);
    expect((items[1] as HTMLElement).tabIndex).toBe(-1);
  });
});

describe('carousel loop + indicators', () => {
  it('loop geometry is periodic and the focal item is large', async () => {
    const { loopItemGeometry, loopPeriod, canLoop, loopDeltaTo } =
      await import('../../src/components/containment/carousel.keylines.js');
    const m = createModel('multi-browse', 'start', 600, 9);
    expect(canLoop(m)).toBe(true);
    const N = loopPeriod(m);
    for (const s of [0, 77, 300, 1234]) {
      for (let i = 0; i < 9; i++) {
        const a = loopItemGeometry(m, i, s);
        const b = loopItemGeometry(m, i, s + 2 * N);
        expect(a.size).toBeCloseTo(b.size);
        expect(a.center).toBeCloseTo(b.center);
      }
    }
    expect(loopItemGeometry(m, 3, 3 * m.step).size).toBeCloseTo(m.large);
    /* Last item wraps in before the first one */
    expect(loopItemGeometry(m, 8, 0).center).toBeLessThan(0);
    /* Shortest path: 0 → 8 goes backwards one step */
    expect(loopDeltaTo(m, 0, 8)).toBeCloseTo(-m.step);
  });

  it('indicator weights blend between neighbours', async () => {
    const { indicatorWeights, loopIndicatorWeights } =
      await import('../../src/components/containment/carousel.keylines.js');
    expect(indicatorWeights([0, 100, 200], 50)).toEqual([0.5, 0.5, 0]);
    expect(indicatorWeights([0, 100, 200], 999)).toEqual([0, 0, 1]);
    const m = createModel('multi-browse', 'start', 600, 9);
    const w = loopIndicatorWeights(m, 8.5 * m.step);
    expect(w[8]).toBeCloseTo(0.5);
    expect(w[0]).toBeCloseTo(0.5);
  });
});
