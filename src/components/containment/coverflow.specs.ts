/**
 * `k3-coverflow` geometry — pure functions (no DOM), unit-tested.
 *
 * Positions are measured in items: the stage has a continuous `position`
 * (0 = first item centred, 2.5 = halfway between items 2 and 3). Each item's
 * signed offset from the centre decides its translate / rotate / depth.
 */

export interface CoverflowGeometry {
  /** Item width in px (measured). */
  width: number;
  /** Side rotation in degrees (items face the centre). */
  angle: number;
  /** Centre → first side item, as a fraction of the item width. */
  gap: number;
  /** Between two side items, as a fraction of the item width. */
  spacing: number;
  /** How far side items sit behind the centre one (fraction of width). */
  depth: number;
  /** Side items shown on each side before fading out. */
  visible: number;
}

export const CoverflowSpecs = {
  angle: 60,
  gap: 0.72,
  spacing: 0.24,
  depth: 0.62,
  visible: 4,
  /** Extra depth for every further side item (fraction of width). */
  depthStep: 0.04,
  /** Pointer distance (fraction of width) that moves the stage by one item. */
  dragUnit: 0.5,
  /** Accumulated wheel delta (px) for one step. */
  wheelStep: 60,
  /** Natural frequency (rad/s) of the critically damped spring towards the target. */
  frequency: 16,
  /** Seconds of momentum projected from the release velocity. */
  throw: 0.18,
  /** Pointer travel (px) below which a press is a click, not a drag. */
  clickSlop: 6,
  /** Viewport perspective, as a multiple of the cover width (matches the CSS). */
  perspective: 3.2,
  /** `full-width`: widest spacing between side covers (× width). */
  maxSpacing: 1.2,
  /** Active bullet width, as a multiple of the inactive one. */
  bulletStretch: 3,
  /** `effect="slide"`: scale of the centred cover. */
  slideScale: 1.4,
  /** `effect="slide"`: space between two covers (× width). */
  slideGap: 0.1,
} as const;

/** Wrap `value` into `[0, count)`. */
export function wrapIndex(value: number, count: number): number {
  if (count <= 0) return 0;
  return ((value % count) + count) % count;
}

/**
 * Signed distance (in items) of `index` from the stage `position`. With
 * `loop`, the shortest way round the ring: −count/2 … +count/2.
 */
export function coverflowOffset(index: number, position: number, count: number, loop: boolean): number {
  const d = index - position;
  if (!loop || count <= 1) return d;
  const half = count / 2;
  return wrapIndex(d + half, count) - half;
}

export interface CoverflowPose {
  /** Horizontal translation, px (positive = towards the inline end). */
  x: number;
  /** Depth, px (negative = away from the viewer). */
  z: number;
  /** rotateY, degrees. */
  rotate: number;
  opacity: number;
  /** Stacking: the centre item on top. */
  zIndex: number;
  /** Outside the visible window — not rendered. */
  hidden: boolean;
  /** Uniform scale (`effect="slide"`); absent = 1. */
  scale?: number;
}

/** Pose of an item at signed offset `d` from the centre (`rtl` mirrors x / rotation). */
export function coverflowPose(d: number, g: CoverflowGeometry, rtl = false): CoverflowPose {
  const a = Math.abs(d);
  const sign = d === 0 ? 0 : d > 0 ? 1 : -1;
  const w = g.width;
  let x: number;
  let z: number;
  let rotate: number;
  if (a <= 1) {
    x = sign * a * g.gap * w;
    z = -a * g.depth * w;
    rotate = -sign * a * g.angle;
  } else {
    x = sign * (g.gap + (a - 1) * g.spacing) * w;
    z = -(g.depth + (a - 1) * CoverflowSpecs.depthStep) * w;
    rotate = -sign * g.angle;
  }
  const fadeFrom = g.visible;
  const opacity = a <= fadeFrom ? 1 : Math.max(0, 1 - (a - fadeFrom));
  const dir = rtl ? -1 : 1;
  return {
    x: x * dir,
    z,
    rotate: rotate * dir,
    opacity,
    zIndex: Math.max(0, Math.round((g.visible + 2 - a) * 100)),
    hidden: opacity <= 0,
  };
}

/**
 * CSS transform for a pose (items are centred on the stage beforehand).
 * `vertical`: the offset runs down the y axis and covers tilt around x —
 * those below the centre lean back at the top, those above at the bottom.
 */
export function coverflowTransform(p: CoverflowPose, vertical = false): string {
  const z = p.z.toFixed(2);
  if (p.scale !== undefined) {
    const t = vertical ? `0, ${p.x.toFixed(2)}px` : `${p.x.toFixed(2)}px, 0`;
    return `translate3d(${t}, ${z}px) scale(${p.scale.toFixed(4)})`;
  }
  if (vertical) return `translate3d(0, ${p.x.toFixed(2)}px, ${z}px) rotateX(${(-p.rotate || 0).toFixed(3)}deg)`;
  return `translate3d(${p.x.toFixed(2)}px, 0, ${z}px) rotateY(${p.rotate.toFixed(3)}deg)`;
}

/**
 * `effect="slide"` — flat carousel: covers side by side, the centred one grows
 * to `scale`. Neighbours make room for it progressively, so nothing overlaps
 * while sliding. `g.width` is the cover size on the main axis.
 */
export function coverflowSlidePose(
  d: number,
  g: Pick<CoverflowGeometry, 'width' | 'visible'>,
  scale: number = CoverflowSpecs.slideScale,
  rtl = false,
  gap: number = CoverflowSpecs.slideGap,
): CoverflowPose {
  const a = Math.abs(d);
  const sign = d === 0 ? 0 : d > 0 ? 1 : -1;
  const w = g.width;
  const grow = (scale - 1) * w;
  const near = Math.min(a, 1);
  /* Room left by the centre cover's growth, shared as it passes */
  const x = sign * (a * w * (1 + gap) + near * grow * 0.5);
  const opacity = a <= g.visible ? 1 : Math.max(0, 1 - (a - g.visible));
  return {
    x: x * (rtl ? -1 : 1),
    /* Tiny depth only to order the covers in the 3D context */
    z: -Math.min(a, g.visible + 2) * 0.5,
    rotate: 0,
    opacity,
    zIndex: Math.max(0, Math.round((g.visible + 2 - a) * 100)),
    hidden: opacity <= 0,
    scale: 1 + (scale - 1) * Math.max(0, 1 - a),
  };
}

/** Side covers needed so a flat row reaches the edges of `containerSize`. */
export function coverflowSlideVisible(
  containerSize: number,
  width: number,
  scale: number = CoverflowSpecs.slideScale,
  gap: number = CoverflowSpecs.slideGap,
): number {
  if (!containerSize || !width) return CoverflowSpecs.visible;
  const free = containerSize / 2 - (width * scale) / 2;
  return Math.max(1, Math.ceil(free / (width * (1 + gap))) + 1);
}

/**
 * One step of a critically damped spring (exact solution — stable whatever
 * the frame time). `position` / `velocity` in items and items / s.
 */
export function coverflowSpring(
  position: number,
  velocity: number,
  target: number,
  dt: number,
  frequency: number = CoverflowSpecs.frequency,
): { position: number; velocity: number } {
  const w = frequency;
  const e0 = position - target;
  const c = velocity + w * e0;
  const decay = Math.exp(-w * dt);
  return {
    position: target + (e0 + c * dt) * decay,
    velocity: (velocity - w * c * dt) * decay,
  };
}

/** Target index after a drag release, with momentum (`velocity` in items / s). */
export function coverflowSnap(position: number, velocity: number, count: number, loop: boolean): number {
  const projected = Math.round(position + velocity * CoverflowSpecs.throw);
  if (loop || count <= 0) return projected;
  return Math.min(count - 1, Math.max(0, projected));
}

/**
 * Link targets: http(s), mailto, tel, relative and fragment URLs only —
 * `javascript:`, `data:`, `vbscript:`… are dropped.
 */
export function safeCoverflowHref(raw: string | null | undefined): string {
  /* Browsers ignore control characters and spaces inside a scheme */
  // eslint-disable-next-line no-control-regex
  const value = String(raw ?? '').replace(/[\u0000- \u007f-\u009f]/g, '');
  if (!value) return '';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (!scheme) return String(raw).trim();
  return ['http', 'https', 'mailto', 'tel'].includes(scheme) ? String(raw).trim() : '';
}

/**
 * Half-width on screen (px) reached by the side cover at offset `d`: its outer
 * edge after rotation and perspective projection (origin at the centre).
 */
export function coverflowExtent(d: number, g: CoverflowGeometry, perspective: number = CoverflowSpecs.perspective): number {
  const p = coverflowPose(d, g);
  const P = perspective * g.width;
  const r = (p.rotate * Math.PI) / 180;
  let max = 0;
  for (const u of [-g.width / 2, g.width / 2]) {
    /* rotateY: a point (u, 0, 0) lands on (u cos r, 0, −u sin r) */
    const x = p.x + u * Math.cos(r);
    const z = p.z - u * Math.sin(r);
    max = Math.max(max, Math.abs((x * P) / (P - z)));
  }
  return max;
}

/**
 * `full-width`: side covers per side and spacing so that the outermost cover
 * reaches the edges of a `containerWidth` wide viewport. Uses as many of the
 * `maxSide` covers as fit without packing them tighter than ¾ of `g.spacing`;
 * keeps `g` when even two side covers do not fit (narrow screens).
 */
export function coverflowFit(
  containerWidth: number,
  g: CoverflowGeometry,
  maxSide: number,
  perspective: number = CoverflowSpecs.perspective,
): { visible: number; spacing: number } {
  const half = containerWidth / 2;
  const extent = (n: number, spacing: number) => coverflowExtent(n, { ...g, spacing, visible: n }, perspective);
  for (let n = Math.floor(maxSide); n >= 2; n--) {
    let lo = 0;
    let hi: number = CoverflowSpecs.maxSpacing;
    if (extent(n, hi) <= half) return { visible: n, spacing: hi };
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      if (extent(n, mid) < half) lo = mid;
      else hi = mid;
    }
    if (lo >= g.spacing * 0.75) return { visible: n, spacing: lo };
  }
  return { visible: g.visible, spacing: g.spacing };
}

/** Bullet emphasis 0…1 for an item at signed offset `d` (1 = centred). */
export function coverflowBulletWeight(d: number): number {
  return Math.max(0, 1 - Math.abs(d));
}
