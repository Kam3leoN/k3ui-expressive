/**
 * M3 / Compose indeterminate timing — ported from ProgressIndicator.kt.
 * @see https://github.com/androidx/androidx/.../ProgressIndicator.kt
 */

/** Cubic-bezier unit easing (Compose CubicBezierEasing). */
export function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): (t: number) => number {
  /* Approximate with CSS cubic-bezier sampling (Newton). */
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (tIn: number) => {
    let t = Math.min(1, Math.max(0, tIn));
    for (let i = 0; i < 8; i++) {
      const x = sampleX(t) - tIn;
      const dx = sampleDX(t);
      if (Math.abs(x) < 1e-5 || Math.abs(dx) < 1e-6) break;
      t -= x / dx;
      t = Math.min(1, Math.max(0, t));
    }
    return sampleY(t);
  };
}

const easeLine1Head = cubicBezier(0.2, 0, 0.8, 1);
const easeLine1Tail = cubicBezier(0.4, 0, 1, 1);
const easeLine2Head = cubicBezier(0, 0, 0.65, 1);
const easeLine2Tail = cubicBezier(0.1, 0, 0.45, 1);
const easeCircular = cubicBezier(0.4, 0, 0.2, 1);

/** Keyframe fraction in [0,1] with delay/duration inside a cycle. */
function keyframeFrac(
  cycleT: number,
  delayMs: number,
  durationMs: number,
  totalMs: number,
  ease: (t: number) => number,
): number {
  const ms = cycleT * totalMs;
  if (ms <= delayMs) return 0;
  if (ms >= delayMs + durationMs) return 1;
  return ease((ms - delayMs) / durationMs);
}

/* —— Linear indeterminate (1800ms, two segments) —— */
export const LINEAR_INDET_MS = 1800;

export interface LinearSegment {
  start: number;
  end: number;
}

export function linearIndeterminateSegments(cycleT: number): LinearSegment[] {
  const t = ((cycleT % 1) + 1) % 1;
  const firstHead = keyframeFrac(t, 0, 750, LINEAR_INDET_MS, easeLine1Head);
  const firstTail = keyframeFrac(t, 333, 850, LINEAR_INDET_MS, easeLine1Tail);
  const secondHead = keyframeFrac(t, 1000, 567, LINEAR_INDET_MS, easeLine2Head);
  const secondTail = keyframeFrac(t, 1267, 533, LINEAR_INDET_MS, easeLine2Tail);
  const out: LinearSegment[] = [];
  if (firstHead - firstTail > 0) out.push({ start: firstTail, end: firstHead });
  if (secondHead - secondTail > 0) out.push({ start: secondTail, end: secondHead });
  return out;
}

/* —— Circular indeterminate (Compose star cycle) —— */
export const CIRCULAR_ROTATION_MS = 1332;
export const CIRCULAR_ROTATIONS_PER_CYCLE = 5;
export const CIRCULAR_CYCLE_MS = CIRCULAR_ROTATION_MS * CIRCULAR_ROTATIONS_PER_CYCLE;
const BASE_ROTATION_ANGLE = 286;
const JUMP_ROTATION_ANGLE = 290;
const ROTATION_ANGLE_OFFSET = (BASE_ROTATION_ANGLE + JUMP_ROTATION_ANGLE) % 360;
const START_ANGLE_OFFSET = -90;
const HEAD_TAIL_MS = Math.floor(CIRCULAR_ROTATION_MS * 0.5);

export interface CircularIndeterminate {
  /** Arc start angle (degrees, canvas: 0 = 3 o'clock). */
  startAngle: number;
  sweep: number;
}

export function circularIndeterminate(cycleT: number): CircularIndeterminate {
  const total = CIRCULAR_CYCLE_MS;
  const ms = (((cycleT % 1) + 1) % 1) * total;
  const rotationIndex = Math.floor(ms / CIRCULAR_ROTATION_MS) % CIRCULAR_ROTATIONS_PER_CYCLE;
  const rotT = (ms % CIRCULAR_ROTATION_MS) / CIRCULAR_ROTATION_MS;

  const baseRotation = rotT * BASE_ROTATION_ANGLE;
  const headTailPeriod = HEAD_TAIL_MS + HEAD_TAIL_MS;
  const local = ms % CIRCULAR_ROTATION_MS;
  /* endAngle (head) animates first half; startAngle (tail) second half */
  let endJump = 0;
  let startJump = 0;
  if (local < HEAD_TAIL_MS) {
    endJump = easeCircular(local / HEAD_TAIL_MS) * JUMP_ROTATION_ANGLE;
  } else {
    endJump = JUMP_ROTATION_ANGLE;
    startJump =
      easeCircular((local - HEAD_TAIL_MS) / HEAD_TAIL_MS) * JUMP_ROTATION_ANGLE;
  }
  /* Also account for delay pattern matching Compose keyframes across period */
  void headTailPeriod;

  const currentRotationOffset = (rotationIndex * ROTATION_ANGLE_OFFSET) % 360;
  const sweep = Math.max(0.1, Math.abs(endJump - startJump));
  const offset = START_ANGLE_OFFSET + currentRotationOffset + baseRotation;
  return { startAngle: startJump + offset, sweep };
}

/**
 * Determinate progress lerp — Compose ProgressAnimationSpec ≈ very-low stiffness spring.
 * Approximated as 500ms ease-out for web (M3 web conversion table).
 */
export const DETERMINATE_MS = 500;

export function easeDeterminate(t: number): number {
  /* Standard spatial-ish settle without bounce (dampingRatioNoBouncy). */
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) * (1 - x) * (1 - x);
}