/**
 * Pointer drag controller — reusable for sheets, drawers, sliders, etc.
 *
 * Gesture: {@link attachDrag}. Settle helpers (M3 sheet / dismissible):
 * {@link setAxisTranslate}, {@link animateAxisTranslate}, {@link clearAxisTranslate},
 * {@link shouldDismissDrag}, {@link resolveDismissThresholdPx}.
 *
 * ```ts
 * const drag = attachDrag(handle, {
 *   axis: 'y',
 *   onMove: ({ dy }) => setAxisTranslate(sheet, 'y', Math.max(0, dy)),
 *   onEnd: async ({ dy, velocityY }) => {
 *     if (shouldDismissDrag({ offset: dy, size: h, velocity: velocityY })) {
 *       await animateAxisTranslate(sheet, 'y', h, 'dismiss');
 *     } else {
 *       await animateAxisTranslate(sheet, 'y', 0, 'snap');
 *       clearAxisTranslate(sheet);
 *     }
 *   },
 * });
 * ```
 */

import { waitForMotion } from './lifecycle.js';

export type DragAxis = 'x' | 'y' | 'both';

/** Material `SheetDefaults.positionalThreshold` — 56dp. */
export const M3_DISMISS_POSITION_DP = 56;
/** Material `SheetDefaults.velocityThreshold` — 125dp/s as px/ms. */
export const M3_DISMISS_VELOCITY = 125 / 1000;

export type DragSettleMode = 'snap' | 'dismiss';

export interface DragDetail {
  /** Delta from pointer-down (axis-clamped) */
  dx: number;
  dy: number;
  /** Raw client coordinates */
  x: number;
  y: number;
  startX: number;
  startY: number;
  /** px/ms, recent samples */
  velocityX: number;
  velocityY: number;
  pointerId: number;
  event: PointerEvent;
  /** True once movement passed threshold */
  active: boolean;
}

export interface DragOptions {
  axis?: DragAxis;
  /** Element that moves / receives transforms (default: surface) */
  target?: HTMLElement | (() => HTMLElement | null);
  /** Min/max clamp for dx / dy (number or lazy getter) */
  minX?: number | (() => number);
  maxX?: number | (() => number);
  minY?: number | (() => number);
  maxY?: number | (() => number);
  /** Pixels before drag activates (default 4) */
  threshold?: number;
  /** Return false to ignore this pointerdown */
  canStart?: (e: PointerEvent) => boolean;
  /**
   * Called when movement crosses `threshold`. Return false to keep waiting
   * (e.g. axis lock: dismiss wants horizontal, sort wants vertical).
   * `dx`/`dy` are raw (pre-axis-clamp) deltas from pointer-down.
   */
  shouldActivate?: (d: DragDetail) => boolean;
  disabled?: boolean | (() => boolean);
  /** Prevent default on move once active (helps avoid scroll) */
  preventScroll?: boolean;
  /**
   * Override `touch-action` on the surface.
   * Pass `null` to leave CSS untouched (needed when the surface also scrolls).
   */
  touchAction?: string | null;
  onStart?: (d: DragDetail) => void;
  onMove?: (d: DragDetail) => void;
  onEnd?: (d: DragDetail) => void;
  /** Fired when threshold is crossed (once per gesture) */
  onActivate?: (d: DragDetail) => void;
}

export interface DragController {
  destroy(): void;
  setEnabled(enabled: boolean): void;
  get enabled(): boolean;
  /** True while a gesture is in progress */
  get dragging(): boolean;
}

interface Sample {
  t: number;
  x: number;
  y: number;
}

function resolveNum(v: number | (() => number) | undefined, fallback: number): number {
  if (v == null) return fallback;
  return typeof v === 'function' ? v() : v;
}

function isDisabled(opt: DragOptions): boolean {
  const d = opt.disabled;
  if (d == null) return false;
  return typeof d === 'function' ? d() : d;
}

/**
 * Attach pointer-driven drag to `surface` (usually a handle).
 * Uses setPointerCapture; cleans up on destroy.
 */
export function attachDrag(surface: HTMLElement, options: DragOptions = {}): DragController {
  const axis = options.axis ?? 'both';
  const threshold = options.threshold ?? 4;
  let enabled = true;
  let dragging = false;
  let activated = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastDx = 0;
  let lastDy = 0;
  const samples: Sample[] = [];

  const blockSelect = (ev: Event): void => {
    ev.preventDefault();
  };

  const clearTextSelection = (): void => {
    try {
      const sel = globalThis.getSelection?.();
      sel?.removeAllRanges();
    } catch {
      /* ignore */
    }
  };

  const unbindDoc = (): void => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', endGesture);
    document.removeEventListener('pointercancel', endGesture);
    document.removeEventListener('selectstart', blockSelect, true);
  };

  const onPointerDown = (e: PointerEvent): void => {
    if (!enabled || isDisabled(options)) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (options.canStart && !options.canStart(e)) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastDx = 0;
    lastDy = 0;
    activated = false;
    dragging = true;
    samples.length = 0;
    samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });

    /* Doc listeners — survive pointer capture on another surface (sort vs dismiss) */
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endGesture);
    document.addEventListener('pointercancel', endGesture);
    document.addEventListener('selectstart', blockSelect, true);
    clearTextSelection();

    try {
      surface.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const detail = makeDetail(e, 0, 0, false);
    options.onStart?.(detail);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging || e.pointerId !== pointerId) return;

    const rawDx = e.clientX - startX;
    const rawDy = e.clientY - startY;
    let dx = rawDx;
    let dy = rawDy;
    if (axis === 'x') dy = 0;
    if (axis === 'y') dx = 0;

    dx = clamp(dx, resolveNum(options.minX, -Infinity), resolveNum(options.maxX, Infinity));
    dy = clamp(dy, resolveNum(options.minY, -Infinity), resolveNum(options.maxY, Infinity));

    samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    if (samples.length > 6) samples.shift();

    lastDx = dx;
    lastDy = dy;

    if (!activated) {
      /* Axis-aligned distance so orthogonal swipes don’t arm the wrong gesture */
      const dist =
        axis === 'x'
          ? Math.abs(rawDx)
          : axis === 'y'
            ? Math.abs(rawDy)
            : Math.hypot(rawDx, rawDy);
      if (dist < threshold) return;
      const probe = makeDetail(e, rawDx, rawDy, false);
      if (options.shouldActivate && !options.shouldActivate(probe)) return;
      activated = true;
      clearTextSelection();
      const act = makeDetail(e, dx, dy, true);
      options.onActivate?.(act);
    }

    if (options.preventScroll !== false && activated) {
      e.preventDefault();
    }

    options.onMove?.(makeDetail(e, dx, dy, true));
  };

  const endGesture = (e: PointerEvent): void => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    unbindDoc();
    try {
      if (surface.hasPointerCapture(e.pointerId)) {
        surface.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
    clearTextSelection();
    const detail = makeDetail(e, lastDx, lastDy, activated);
    pointerId = null;
    options.onEnd?.(detail);
    activated = false;
  };

  const makeDetail = (
    event: PointerEvent,
    dx: number,
    dy: number,
    active: boolean,
  ): DragDetail => {
    const { velocityX, velocityY } = computeVelocity(samples);
    return {
      dx,
      dy,
      x: event.clientX,
      y: event.clientY,
      startX,
      startY,
      velocityX,
      velocityY,
      pointerId: event.pointerId,
      event,
      active,
    };
  };

  surface.addEventListener('pointerdown', onPointerDown);
  /* move/up also on surface as fallback before doc bind (same handlers) */
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', endGesture);
  surface.addEventListener('pointercancel', endGesture);

  const prevTouchAction = surface.style.touchAction;
  if (options.touchAction !== null) {
    surface.style.touchAction =
      options.touchAction ??
      (axis === 'y' ? 'pan-x' : axis === 'x' ? 'pan-y' : 'none');
  }

  return {
    destroy() {
      unbindDoc();
      surface.removeEventListener('pointerdown', onPointerDown);
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerup', endGesture);
      surface.removeEventListener('pointercancel', endGesture);
      if (options.touchAction !== null) {
        surface.style.touchAction = prevTouchAction;
      }
      enabled = false;
      dragging = false;
    },
    setEnabled(v: boolean) {
      enabled = v;
    },
    get enabled() {
      return enabled;
    },
    get dragging() {
      return dragging;
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function computeVelocity(samples: Sample[]): { velocityX: number; velocityY: number } {
  if (samples.length < 2) return { velocityX: 0, velocityY: 0 };
  const a = samples[0]!;
  const b = samples[samples.length - 1]!;
  const dt = Math.max(1, b.t - a.t);
  return {
    velocityX: (b.x - a.x) / dt,
    velocityY: (b.y - a.y) / dt,
  };
}

/**
 * Resolve a dismiss threshold to CSS px.
 * Values in (0, 1] are treated as a fraction of `size` (legacy API).
 */
export function resolveDismissThresholdPx(
  threshold: number,
  size: number,
  fallbackDp = M3_DISMISS_POSITION_DP,
): number {
  const t = Number.isFinite(threshold) ? threshold : fallbackDp;
  if (t > 0 && t <= 1) return t * size;
  return Math.min(Math.max(0, t), Math.max(0, size));
}

/** M3 anchored-drag dismiss: positional OR fling velocity. */
export function shouldDismissDrag(opts: {
  offset: number;
  size: number;
  velocity: number;
  /** px, or fraction ≤1 — see {@link resolveDismissThresholdPx} */
  positionalThreshold?: number;
  /** px/ms — default {@link M3_DISMISS_VELOCITY} */
  velocityThreshold?: number;
}): boolean {
  const size = Math.max(1, opts.size);
  const pos = resolveDismissThresholdPx(
    opts.positionalThreshold ?? M3_DISMISS_POSITION_DP,
    size,
  );
  const vel = opts.velocityThreshold ?? M3_DISMISS_VELOCITY;
  return opts.offset >= pos || opts.velocity >= vel;
}

/** Set `translateX/Y` inline (dismiss axis). `sign` flips side-sheet RTL/LTR. */
export function setAxisTranslate(
  el: HTMLElement,
  axis: 'x' | 'y',
  offset: number,
  sign = 1,
): void {
  const v = offset * sign;
  el.style.transform = axis === 'y' ? `translateY(${v}px)` : `translateX(${v}px)`;
}

/**
 * Animate inline axis translate to `offset`.
 * - `snap` — standard decelerate (no overshoot; keeps docked edge glued)
 * - `dismiss` — spatial-fast expressive slide-off
 */
export async function animateAxisTranslate(
  el: HTMLElement,
  axis: 'x' | 'y',
  offset: number,
  mode: DragSettleMode,
  sign = 1,
): Promise<void> {
  if (mode === 'dismiss') {
    el.style.transition = `transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-spatial-fast, var(--k3-sys-motion-easing-expressive-spatial-fast))`;
  } else {
    el.style.transition = `transform var(--k3-sys-motion-duration-spatial-default, 500ms)
      var(--k3-sys-motion-easing-standard-decelerate, cubic-bezier(0, 0, 0, 1))`;
  }
  setAxisTranslate(el, axis, offset, sign);
  await waitForMotion(el, mode === 'dismiss' ? 450 : 600);
}

/** Clear inline transform + transition (after snap settle or teardown). */
export function clearAxisTranslate(el: HTMLElement): void {
  el.style.transition = 'none';
  el.style.transform = '';
  void el.offsetWidth;
  el.style.removeProperty('transition');
}

export default attachDrag;
