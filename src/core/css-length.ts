/**
 * Resolve a CSS length custom property (or raw string) to device pixels.
 * Handles `1rem` correctly — never `parseFloat('1rem') === 1`.
 */
export function resolveCssLengthPx(
  raw: string,
  fallbackPx = 16,
  rootFontPx?: number,
): number {
  const rem =
    rootFontPx ??
    (typeof document !== 'undefined'
      ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16);
  const s = raw.trim();
  if (!s) return fallbackPx;
  if (s.endsWith('rem')) return (Number.parseFloat(s) || 1) * rem;
  if (s.endsWith('em')) return (Number.parseFloat(s) || 1) * rem;
  if (s.endsWith('px')) return Number.parseFloat(s) || fallbackPx;
  const n = Number.parseFloat(s);
  /* Unitless tiny values are almost always a bad parse of "1rem" */
  if (Number.isFinite(n) && n > 0 && n <= 4 && !/px|rem|em|%/.test(s)) {
    return n * rem;
  }
  return Number.isFinite(n) && n > 0 ? n : fallbackPx;
}

/** Root font-size in px (16 when unavailable). */
export function rootRemPx(): number {
  if (typeof document === 'undefined') return 16;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}