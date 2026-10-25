/**
 * Canvas drawing helpers for M3 Expressive progress indicators.
 *
 * Tokens mirror Compose `LinearProgressIndicatorTokens` /
 * `CircularProgressIndicatorTokens` (v0_7_0).
 *
 * CSS px ≈ dp at 100% zoom; callers snap via `devicePixelSnapPx` for DPI.
 */

/** Gap between active indicator and track (TrackActiveSpace). */
export const GAP_DP = 4;
/** Stop indicator diameter — always 4dp (inside the track). */
export const STOP_DP = 4;
/**
 * Inset of stop from the trailing track edge when thickness ≥ 8dp.
 * At 4dp thickness the stop is flush (0). M3 linear specs sample.
 */
export const STOP_INSET_THICK_DP = 2;
export const DEFAULT_THICKNESS = 4;

/** Linear wavy — ActiveWaveAmplitude / ActiveWaveWavelength / WaveHeight. */
export const LINEAR_WAVE_AMP = 3;
export const LINEAR_WAVE_LEN = 40;
export const LINEAR_WAVE_HEIGHT = 10;

/** Circular — Size / WaveSize / ActiveWaveAmplitude / ActiveWaveWavelength. */
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

/**
 * Flat horizontal indicator from x0→x1 at cy — round stroke caps (same
 * geometry as wavy). Endpoints are cap centers; inset by thickness/2 from
 * canvas edges so caps are not clipped.
 */
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
  if (w < thickness * 0.5) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x0 + w / 2, cy, thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.lineTo(x1, cy);
  ctx.stroke();
}

/**
 * Wavy stroke along [x0,x1] — round caps (never a flat clipped start).
 * Endpoints are geometric centers of the round caps; keep x0/x1 inset by
 * thickness/2 from the canvas edge so caps are not truncated.
 */
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
  if (w < thickness || amp <= 0.05) {
    drawFlatBar(ctx, x0, x1, cy, thickness, color);
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const steps = Math.max(16, Math.ceil(w / 1.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + w * t;
    const y = cy + amp * Math.sin(2 * Math.PI * (x / wavelength) + phase);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** Stop indicator — full circle (M3 track stop). */
export function drawStop(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

/** Circular arc (flat). Angles in degrees, 0 = 3 o'clock, CW positive. */
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
    const a = (startDeg * Math.PI) / 180;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * radius,
      cy + Math.sin(a) * radius,
      thickness / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = Math.abs(sweepDeg) >= 359.5 ? 'butt' : 'round';
  ctx.beginPath();
  if (Math.abs(sweepDeg) >= 359.5) {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
  } else {
    const a0 = (startDeg * Math.PI) / 180;
    const a1 = ((startDeg + sweepDeg) * Math.PI) / 180;
    ctx.arc(cx, cy, radius, a0, a1, sweepDeg < 0);
  }
  ctx.stroke();
}

/**
 * Circular wavy arc — amplitude in CSS px, wavelength along the arc in CSS px
 * (M3E ActiveWaveWavelength 15dp), not degrees.
 */
export function drawWavyArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  sweepDeg: number,
  thickness: number,
  amp: number,
  wavelengthPx: number,
  phase: number,
  color: string,
): void {
  if (Math.abs(sweepDeg) < 0.5 || amp <= 0.05) {
    drawFlatArc(ctx, cx, cy, radius, startDeg, sweepDeg, thickness, color);
    return;
  }
  const circ = Math.max(1e-3, 2 * Math.PI * radius);
  const waves = Math.max(1, Math.round(circ / Math.max(1, wavelengthPx)));
  const full = Math.abs(sweepDeg) >= 359.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = full ? 'butt' : 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const steps = Math.max(48, Math.ceil(Math.abs(sweepDeg) * 3));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const deg = startDeg + sweepDeg * t;
    const rad = (deg * Math.PI) / 180;
    const wave = amp * Math.sin(waves * rad + phase);
    const r = radius + wave;
    const x = cx + Math.cos(rad) * r;
    const y = cy + Math.sin(rad) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  if (full) ctx.closePath();
  ctx.stroke();
}

/**
 * Compose `indicatorAmplitude` — full wave mid-progress, flat near 0 / 100%
 * so start/end join cleanly at completion.
 */
export function indicatorAmplitudeFactor(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0.1 || p >= 0.95) return 0;
  if (p < 0.2) return (p - 0.1) / 0.1;
  if (p > 0.85) return (0.95 - p) / 0.1;
  return 1;
}
