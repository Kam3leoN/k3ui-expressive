/**
 * Canvas drawing helpers for M3 Expressive progress indicators.
 * Units are CSS pixels (1dp ≈ 1px at 100% zoom in the playground).
 */

export const GAP_DP = 4;
export const STOP_DP = 4;
export const DEFAULT_THICKNESS = 4;
export const LINEAR_WAVE_AMP = 3;
export const LINEAR_WAVE_LEN = 40;
export const CIRCULAR_SIZE = 40;
export const CIRCULAR_SIZE_WAVY = 48;
export const CIRCULAR_WAVE_AMP = 1.6;
export const CIRCULAR_WAVE_LEN = 15;

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Flat horizontal capsule from x0→x1 at vertical center cy. */
export function drawFlatBar(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  thickness: number,
  color: string,
): void {
  const w = x1 - x0;
  if (w <= 0) return;
  const h = thickness;
  const y = cy - h / 2;
  ctx.fillStyle = color;
  if (w < h) {
    /* Dot / short — circle (M3 min indicator) */
    ctx.beginPath();
    ctx.arc(x0 + w / 2, cy, h / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  roundRect(ctx, x0, y, w, h, h / 2);
  ctx.fill();
}

/** Wavy stroke along [x0,x1] — sine amplitude/wavelength (M3E linear). */
export function drawWavyBar(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  thickness: number,
  amp: number,
  wavelength: number,
  phase: number,
  color: string,
): void {
  const w = x1 - x0;
  if (w <= 0) return;
  if (w < thickness) {
    drawFlatBar(ctx, x0, x1, cy, thickness, color);
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const steps = Math.max(8, Math.ceil(w / 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + w * t;
    const y = cy + amp * Math.sin((2 * Math.PI * (x / wavelength)) + phase);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function drawStop(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  /* Specs sample shows square stop; guidelines mention circle — use rounded square 4dp */
  const r = size * 0.2;
  roundRect(ctx, x - size / 2, cy - size / 2, size, size, r);
  ctx.fill();
}

/** Circular arc (flat). Angles in degrees, 0 = 3 o'clock, CW positive (canvas). */
export function drawFlatArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  sweepDeg: number,
  thickness: number,
  color: string,
): void {
  if (Math.abs(sweepDeg) < 0.05) {
    /* Min dot at start */
    const a = (startDeg * Math.PI) / 180;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, (startDeg * Math.PI) / 180, ((startDeg + sweepDeg) * Math.PI) / 180);
  ctx.stroke();
}

/** Circular wavy arc — radius modulated by sine along the sweep. */
export function drawWavyArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  sweepDeg: number,
  thickness: number,
  amp: number,
  wavelengthDeg: number,
  phase: number,
  color: string,
): void {
  if (Math.abs(sweepDeg) < 0.5) {
    drawFlatArc(ctx, cx, cy, radius, startDeg, sweepDeg, thickness, color);
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const steps = Math.max(24, Math.ceil(Math.abs(sweepDeg) * 2));
  const dir = sweepDeg >= 0 ? 1 : -1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const deg = startDeg + sweepDeg * t;
    const rad = (deg * Math.PI) / 180;
    const wave =
      amp * Math.sin(((2 * Math.PI * deg) / wavelengthDeg) + phase);
    const r = radius + wave;
    const x = cx + Math.cos(rad) * r;
    const y = cy + Math.sin(rad) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  void dir;
  ctx.stroke();
}