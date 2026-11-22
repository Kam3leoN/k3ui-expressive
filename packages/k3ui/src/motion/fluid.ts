/**
 * Fluid motion — droplet-like stretch / squash / jelly.
 *
 * Inspired by Grenish Expressive fluid scheme
 * (@see https://expressive.grenishrai.pro/docs/motion).
 *
 * CSS transitions can't read velocity, so the full stretch-with-speed
 * engine needs a rAF loop. This module ships:
 * - pure shape math (poseTransform, targetStretch, …)
 * - CSS custom-property readers
 * - `attachFluidPress` — press jelly for buttons / FABs / chips
 *
 * Activate via `data-k3-motion="fluid"` on `:root` (theme.apply).
 */

import { prefersReducedMotion } from '../core/lifecycle.js';
import { stepSpring, springSettled, type Spring, type SpringState } from './spring.js';

export interface FluidTokens {
  /** Stretch per (size / second) of speed along travel. */
  viscosity: number;
  /** Upper bound on stretch; 0.3 ≈ +30% longer / ~23% thinner. */
  maxStretch: number;
  /** Press squash (0.07 ≈ 7% wider, ~7% shorter). */
  squash: number;
  /** Jelly wobble damping — lower = wobblier. */
  wobble: number;
}

/** Defaults from Expressive fluid theme (docs/motion Tuning). */
export const fluidTokens: FluidTokens = {
  viscosity: 0.045,
  maxStretch: 0.3,
  squash: 0.07,
  wobble: 0.32,
};

export interface FluidPose {
  x: number;
  y: number;
  sx: number;
  sy: number;
  /** > 0 wider+shorter, &lt; 0 taller+narrower (area-preserving). */
  squash: number;
}

export interface FluidShape {
  stretch: number;
  angle: number;
  lean: number;
}

export const restPose = (): FluidPose => ({ x: 0, y: 0, sx: 1, sy: 1, squash: 0 });
export const restShape = (): FluidShape => ({ stretch: 1, angle: 0, lean: 0 });

export const shapeSpring = (tokens: FluidTokens): Spring => ({
  dampingRatio: tokens.wobble,
  stiffness: 380,
});

export function targetStretch(
  vx: number,
  vy: number,
  size: number,
  tokens: FluidTokens,
): number {
  const speed = Math.hypot(vx, vy) / Math.max(size, 1);
  return 1 + Math.min(tokens.maxStretch, speed * tokens.viscosity);
}

export function leanFor(vx: number, size: number, tokens: FluidTokens): number {
  return Math.max(
    -4,
    Math.min(4, (vx / Math.max(size, 1)) * tokens.viscosity * 12),
  );
}

export function clampStretch(stretch: number, tokens: FluidTokens): number {
  const max = 1 + tokens.maxStretch;
  return Math.min(max, Math.max(1 / max, stretch));
}

const r = (n: number) => Math.round(n * 1000) / 1000;

/** CSS transform for a pose + shape. Empty string at rest. */
export function poseTransform(pose: FluidPose, shape: FluidShape): string {
  const parts: string[] = [];
  if (Math.abs(pose.x) > 0.01 || Math.abs(pose.y) > 0.01) {
    parts.push(`translate(${r(pose.x)}px, ${r(pose.y)}px)`);
  }
  if (Math.abs(shape.lean) > 0.01) parts.push(`rotate(${r(shape.lean)}deg)`);
  if (Math.abs(shape.stretch - 1) > 0.001) {
    const deg = (shape.angle * 180) / Math.PI;
    parts.push(
      `rotate(${r(deg)}deg) scale(${r(shape.stretch)}, ${r(1 / shape.stretch)}) rotate(${r(-deg)}deg)`,
    );
  }
  const squashX = 1 + pose.squash;
  const sx = pose.sx * squashX;
  const sy = pose.sy / squashX;
  if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) {
    parts.push(`scale(${r(sx)}, ${r(sy)})`);
  }
  return parts.join(' ');
}

/** Read `--k3-fluid-*` from computed style (theme can tune). */
export function readFluidTokens(
  element: Element,
  fallback: FluidTokens = fluidTokens,
): FluidTokens {
  const style = getComputedStyle(element);
  const read = (name: string, value: number) => {
    const parsed = Number.parseFloat(style.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : value;
  };
  return {
    viscosity: read('--k3-fluid-viscosity', fallback.viscosity),
    maxStretch: read('--k3-fluid-max-stretch', fallback.maxStretch),
    squash: read('--k3-fluid-squash', fallback.squash),
    wobble: read('--k3-fluid-wobble', fallback.wobble),
  };
}

export function isFluidMotionActive(): boolean {
  if (typeof document === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  return document.documentElement.getAttribute('data-k3-motion') === 'fluid';
}

export type FluidPressHandle = { detach: () => void };

/**
 * Press jelly — squash on pointer down, spring back with a soft wobble.
 * No-ops unless `data-k3-motion="fluid"` (and not reduced-motion).
 */
export function attachFluidPress(
  el: HTMLElement,
  opts: { target?: HTMLElement | null } = {},
): FluidPressHandle {
  const surface = opts.target ?? el;
  let raf = 0;
  let lastTs = 0;
  const squashState: SpringState = { value: 0, velocity: 0 };
  let pressing = false;

  const apply = () => {
    const tokens = readFluidTokens(el);
    const pose = restPose();
    pose.squash = squashState.value;
    const t = poseTransform(pose, restShape());
    surface.style.transform = t || '';
    if (t) surface.setAttribute('data-fluid', '');
    else surface.removeAttribute('data-fluid');
  };

  const tick = (ts: number) => {
    if (!isFluidMotionActive()) {
      squashState.value = 0;
      squashState.velocity = 0;
      surface.style.transform = '';
      surface.removeAttribute('data-fluid');
      raf = 0;
      return;
    }
    const tokens = readFluidTokens(el);
    const dt = lastTs ? Math.min(0.032, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    const target = pressing ? tokens.squash : 0;
    stepSpring(squashState, target, shapeSpring(tokens), dt);
    apply();
    if (!pressing && springSettled(squashState, 0, tokens.squash || 0.07)) {
      squashState.value = 0;
      squashState.velocity = 0;
      surface.style.transform = '';
      surface.removeAttribute('data-fluid');
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const arm = () => {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  };

  const onDown = (e: PointerEvent) => {
    if (!isFluidMotionActive() || e.button !== 0) return;
    pressing = true;
    arm();
  };
  const onUp = () => {
    if (!pressing) return;
    pressing = false;
    arm();
  };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onUp);

  return {
    detach: () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onUp);
      if (raf) cancelAnimationFrame(raf);
      surface.style.transform = '';
      surface.removeAttribute('data-fluid');
    },
  };
}
