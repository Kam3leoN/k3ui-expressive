/**
 * Carousel keyline engine — pure math, no DOM (unit-testable).
 *
 * Port (simplified) of the M3 / MDC "keyline" model:
 * - Every item is laid out *unmasked* at `i * step` (step = large + gap).
 * - A keyline state is a list of anchors in the viewport, each with
 *   a masked size and a masked center. Items between two keylines interpolate
 *   size + position → items grow / shrink as they travel (M3 masking).
 * - Start / end states shift keylines so the first and last items can
 *   become large; the carousel blends states near both scroll edges.
 */
import { CarouselSpecs, type CarouselAlign, type CarouselLayout } from './carousel.specs.js';

export interface Keyline {
  /** Masked size (px). */
  size: number;
  /** Masked center offset from viewport start (px). */
  offset: number;
  /** Unmasked center offset — where an item sits if every item were large. */
  loc: number;
  focal: boolean;
}

export interface KeylineState {
  large: number;
  gap: number;
  keylines: Keyline[];
  firstFocal: number;
  lastFocal: number;
}

export interface CarouselArrangement {
  large: number;
  medium: number;
  small: number;
  largeCount: number;
  mediumCount: number;
  smallCount: number;
}

export interface ItemGeometry {
  /** Masked center (px from viewport start). */
  center: number;
  /** Masked size (px). */
  size: number;
  /** 0 = smallest, 1 = fully large — drives label fade / parallax. */
  progress: number;
}

export interface CarouselModel {
  start: KeylineState;
  middle: KeylineState;
  end: KeylineState;
  step: number;
  large: number;
  small: number;
  viewport: number;
  count: number;
  /** Scroll distance over which start → middle blends. */
  startShift: number;
  /** Scroll distance over which middle → end blends. */
  endShift: number;
  maxScroll: number;
}

export interface ArrangeOptions {
  itemWidth?: number;
  gap?: number;
  smallMin?: number;
  smallMax?: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Multi-browse: n large + 1 medium + 1 small filling the viewport exactly. */
export function arrangeMultiBrowse(
  viewport: number,
  opts: ArrangeOptions = {},
): CarouselArrangement {
  const gap = opts.gap ?? CarouselSpecs.gap;
  const sMin = opts.smallMin ?? CarouselSpecs.smallMin;
  const sMax = opts.smallMax ?? CarouselSpecs.smallMax;
  const target = Math.max(opts.itemWidth ?? CarouselSpecs.itemWidth, sMax * 2);
  const small = viewport < target * 1.5 ? sMin : sMax;

  /* Too narrow → behave like hero (1 large + 1 small) */
  if (viewport < target + small + gap) {
    return {
      large: Math.max(1, viewport - small - gap),
      medium: 0,
      small,
      largeCount: 1,
      mediumCount: 0,
      smallCount: 1,
    };
  }

  let largeCount = Math.max(1, Math.floor((viewport - small - gap) / (target + gap)));
  let large = target;
  let medium = viewport - largeCount * large - small - (largeCount + 1) * gap;
  const mediumMin = Math.max(sMax + 4, large * CarouselSpecs.mediumMinRatio);

  if (medium < mediumMin) {
    /* Not enough room for a meaningful medium → stretch larges, drop medium. */
    large = (viewport - small - largeCount * gap) / largeCount;
    return {
      large,
      medium: 0,
      small,
      largeCount,
      mediumCount: 0,
      smallCount: 1,
    };
  }
  if (medium > large) {
    largeCount += 1;
    large = (viewport - small - mediumMin - (largeCount + 1) * gap) / largeCount;
    medium = viewport - largeCount * large - small - (largeCount + 1) * gap;
  }
  return { large, medium, small, largeCount, mediumCount: 1, smallCount: 1 };
}

/** Hero: 1 large + small peek(s). */
export function arrangeHero(
  viewport: number,
  align: CarouselAlign,
  opts: ArrangeOptions = {},
): CarouselArrangement {
  const gap = opts.gap ?? CarouselSpecs.gap;
  const small = opts.smallMax ?? CarouselSpecs.smallMax;
  const smallCount = align === 'center' ? 2 : 1;
  const large = Math.max(1, viewport - smallCount * (small + gap));
  return { large, medium: 0, small, largeCount: 1, mediumCount: 0, smallCount };
}

/** Build a keyline state from a left → right list of sizes. */
export function buildState(
  sizes: number[],
  large: number,
  gap: number,
  viewport: number,
  small: number,
): KeylineState {
  const step = large + gap;
  const keylines: Keyline[] = [];
  let cursor = 0;
  for (const size of sizes) {
    keylines.push({
      size,
      offset: cursor + size / 2,
      loc: 0,
      focal: Math.abs(size - large) < 0.5,
    });
    cursor += size + gap;
  }
  const firstFocal = keylines.findIndex((k) => k.focal);
  const lastFocal = keylines.length - 1 - [...keylines].reverse().findIndex((k) => k.focal);
  /* Unmasked locations are anchored on the first focal keyline. */
  const anchor = keylines[firstFocal].offset;
  keylines.forEach((k, i) => (k.loc = anchor + (i - firstFocal) * step));

  /* Off-screen anchors so items shrink out of view instead of popping. */
  const head: Keyline = {
    size: small * 0.5,
    offset: -gap - small * 0.25,
    loc: keylines[0].loc - step,
    focal: false,
  };
  const tailFrom = keylines[keylines.length - 1];
  const tail: Keyline = {
    size: small * 0.5,
    offset: viewport + gap + small * 0.25,
    loc: tailFrom.loc + step,
    focal: false,
  };

  return {
    large,
    gap,
    keylines: [head, ...keylines, tail],
    firstFocal: firstFocal + 1,
    lastFocal: lastFocal + 1,
  };
}

function sizesFor(a: CarouselArrangement, order: 'start' | 'end' | 'center'): number[] {
  const larges = Array<number>(a.largeCount).fill(a.large);
  const mediums = Array<number>(a.mediumCount).fill(a.medium);
  const smalls = Array<number>(a.smallCount).fill(a.small);
  if (order === 'center') return [a.small, ...larges, a.small];
  const forward = [...larges, ...mediums, ...smalls];
  return order === 'start' ? forward : forward.reverse();
}

/** Full model for one layout + viewport + item count. */
export function createModel(
  layout: CarouselLayout,
  align: CarouselAlign,
  viewport: number,
  count: number,
  opts: ArrangeOptions = {},
): CarouselModel {
  const gap = opts.gap ?? CarouselSpecs.gap;
  let arr: CarouselArrangement;
  let start: KeylineState;
  let middle: KeylineState;
  let end: KeylineState;

  if (layout === 'hero') {
    arr = arrangeHero(viewport, align, opts);
    const startArr = align === 'center' ? arrangeHero(viewport, 'start', opts) : arr;
    /* Center-aligned hero keeps the same large size across states (M3). */
    const startSizes =
      align === 'center'
        ? [arr.large, startArr.small, viewport - arr.large - startArr.small - 2 * gap]
        : sizesFor(arr, 'start');
    start = buildState(
      startSizes.filter((s) => s > 0),
      arr.large,
      gap,
      viewport,
      arr.small,
    );
    middle =
      align === 'center'
        ? buildState(sizesFor(arr, 'center'), arr.large, gap, viewport, arr.small)
        : start;
    const endSizes = align === 'center' ? [...startSizes].reverse() : sizesFor(arr, 'end');
    end = buildState(
      endSizes.filter((s) => s > 0),
      arr.large,
      gap,
      viewport,
      arr.small,
    );
  } else {
    arr = arrangeMultiBrowse(viewport, opts);
    start = buildState(sizesFor(arr, 'start'), arr.large, gap, viewport, arr.small);
    middle = start;
    end = buildState(sizesFor(arr, 'end'), arr.large, gap, viewport, arr.small);
  }

  const step = arr.large + gap;
  const fo = (s: KeylineState): number => s.keylines[s.firstFocal].offset;
  const lo = (s: KeylineState): number => s.keylines[s.lastFocal].offset;
  const nbMiddle = middle.firstFocal - 1; /* keylines before focal (minus head anchor) */
  const naMiddle = middle.keylines.length - 2 - middle.lastFocal;

  const rawMax = (count - 1) * step + fo(start) - lo(end);
  const maxScroll = Math.max(0, rawMax);
  const startShift = clamp(nbMiddle * step + fo(start) - fo(middle), 0, maxScroll);
  const endShift = clamp(naMiddle * step + lo(middle) - lo(end), 0, maxScroll - startShift);

  return {
    start,
    middle,
    end,
    step,
    large: arr.large,
    small: arr.small,
    viewport,
    count,
    startShift,
    endShift,
    maxScroll,
  };
}

/** Map an unmasked center (relative to the viewport) through one keyline state. */
export function mapThroughState(
  state: KeylineState,
  unmasked: number,
): { center: number; size: number } {
  const k = state.keylines;
  if (unmasked <= k[0].loc) {
    return { center: k[0].offset - (k[0].loc - unmasked), size: k[0].size };
  }
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i];
    const b = k[i + 1];
    if (unmasked <= b.loc) {
      const t = (unmasked - a.loc) / (b.loc - a.loc || 1);
      return {
        center: lerp(a.offset, b.offset, t),
        size: lerp(a.size, b.size, t),
      };
    }
  }
  const last = k[k.length - 1];
  return { center: last.offset + (unmasked - last.loc), size: last.size };
}

/** Geometry for item `index` at `scroll` (px, logical / inline-start based). */
export function itemGeometry(model: CarouselModel, index: number, scroll: number): ItemGeometry {
  const { start, middle, end, step, large, small, startShift, endShift, maxScroll } = model;
  const anchor = start.keylines[start.firstFocal].offset;
  const unmasked = index * step + anchor - scroll;

  let g: { center: number; size: number };
  if (startShift > 0 && scroll < startShift) {
    const t = clamp(scroll / startShift, 0, 1);
    const a = mapThroughState(start, unmasked);
    const b = mapThroughState(middle, unmasked);
    g = { center: lerp(a.center, b.center, t), size: lerp(a.size, b.size, t) };
  } else if (endShift > 0 && scroll > maxScroll - endShift) {
    const t = clamp((scroll - (maxScroll - endShift)) / endShift, 0, 1);
    const a = mapThroughState(middle, unmasked);
    const b = mapThroughState(end, unmasked);
    g = { center: lerp(a.center, b.center, t), size: lerp(a.size, b.size, t) };
  } else {
    g = mapThroughState(middle, unmasked);
  }
  const progress = clamp((g.size - small) / (large - small || 1), 0, 1);
  return { ...g, progress };
}

/** Scroll position that brings `index` onto the first focal keyline. */
export function scrollForIndex(model: CarouselModel, index: number): number {
  const anchor = model.start.keylines[model.start.firstFocal].offset;
  const focal = model.middle.keylines[model.middle.firstFocal].offset;
  if (index <= 0) return 0;
  const raw = index * model.step + anchor - focal;
  return clamp(raw, 0, model.maxScroll);
}

/** All snap positions (deduplicated, ascending). */
export function snapPoints(model: CarouselModel): number[] {
  const pts = new Set<number>([0, Math.round(model.maxScroll)]);
  for (let i = 0; i < model.count; i++) pts.add(Math.round(scrollForIndex(model, i)));
  if (model.startShift > 0) pts.add(Math.round(model.startShift));
  if (model.endShift > 0) pts.add(Math.round(model.maxScroll - model.endShift));
  return [...pts].filter((p) => p >= 0 && p <= Math.round(model.maxScroll)).sort((a, b) => a - b);
}

/** Index of the item currently occupying the first focal (largest, leftmost on tie). */
export function focalIndex(model: CarouselModel, scroll: number): number {
  let best = 0;
  let bestSize = -1;
  for (let i = 0; i < model.count; i++) {
    const g = itemGeometry(model, i, scroll);
    if (g.size > bestSize + 0.5) {
      best = i;
      bestSize = g.size;
    }
  }
  return best;
}

/** Next / previous snap position from the current scroll (for arrows & drag). */
export function adjacentSnap(points: number[], scroll: number, dir: 1 | -1): number {
  if (dir > 0) return points.find((p) => p > scroll + 1) ?? points[points.length - 1] ?? 0;
  for (let i = points.length - 1; i >= 0; i--) if (points[i] < scroll - 1) return points[i];
  return 0;
}

/* ------------------------------------------------------------------ loop */

/**
 * Infinite loop (keyline layouts). Only the *middle* keyline state is used and
 * item positions are periodic: period = count × step. The scroller gets
 * `LOOP_CYCLES` periods of runway and is silently re-centred when it settles.
 */
export const LOOP_CYCLES = 5;

/** True when there are enough items to fill the viewport + both off-screen anchors. */
export function canLoop(model: CarouselModel): boolean {
  return model.count * model.step >= model.viewport + 3 * model.step;
}

export function loopPeriod(model: CarouselModel): number {
  return model.count * model.step;
}

/** Scroll runway in loop mode. */
export function loopMaxScroll(model: CarouselModel): number {
  return loopPeriod(model) * LOOP_CYCLES;
}

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Geometry of item `index` at `scroll` in loop mode. */
export function loopItemGeometry(
  model: CarouselModel,
  index: number,
  scroll: number,
): ItemGeometry {
  const N = loopPeriod(model);
  const { middle, step, large, small } = model;
  const before = middle.firstFocal; /* keylines before focal, incl. head anchor */
  let d = mod(index * step - scroll, N);
  if (d >= N - before * step) d -= N;
  const unmasked = d + middle.keylines[middle.firstFocal].offset;
  const g = mapThroughState(middle, unmasked);
  const progress = clamp((g.size - small) / (large - small || 1), 0, 1);
  return { ...g, progress };
}

/** Fractional focal position in loop mode (0 … count). */
export function loopPosition(model: CarouselModel, scroll: number): number {
  return mod(scroll, loopPeriod(model)) / model.step;
}

/** Shortest scroll delta that brings `index` to the focal keyline. */
export function loopDeltaTo(model: CarouselModel, scroll: number, index: number): number {
  const N = loopPeriod(model);
  let delta = mod(index * model.step - scroll, N);
  if (delta > N / 2) delta -= N;
  return delta;
}

/** Snap points for loop mode: one per step across the whole runway. */
export function loopSnapPoints(model: CarouselModel): number[] {
  const out: number[] = [];
  const total = model.count * LOOP_CYCLES;
  for (let j = 0; j <= total; j++) out.push(Math.round(j * model.step));
  return out;
}

/**
 * Indicator weights — active dot = 1, neighbours blend while scrolling.
 * `positions` are the scroll offsets of each indicator, ascending.
 */
export function indicatorWeights(positions: number[], scroll: number): number[] {
  const w = positions.map(() => 0);
  if (!positions.length) return w;
  if (scroll <= positions[0]) {
    w[0] = 1;
    return w;
  }
  const last = positions.length - 1;
  if (scroll >= positions[last]) {
    w[last] = 1;
    return w;
  }
  for (let k = 0; k < last; k++) {
    const a = positions[k];
    const b = positions[k + 1];
    if (scroll >= a && scroll <= b) {
      const t = (scroll - a) / (b - a || 1);
      w[k] = 1 - t;
      w[k + 1] = t;
      break;
    }
  }
  return w;
}

/** Indicator weights in loop mode (wraps last → first). */
export function loopIndicatorWeights(model: CarouselModel, scroll: number): number[] {
  const n = model.count;
  const w = Array<number>(n).fill(0);
  const p = loopPosition(model, scroll);
  const k = Math.floor(p) % n;
  const t = p - Math.floor(p);
  w[k] = 1 - t;
  w[(k + 1) % n] += t;
  return w;
}
