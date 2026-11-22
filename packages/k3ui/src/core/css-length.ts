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

/** Current `window.devicePixelRatio` (1 when unavailable). */
export function devicePixelRatioSafe(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

/**
 * Snap a CSS px length so it covers an **integer** number of device pixels.
 *
 * At Windows 125% DPI, `2px` → 2.5 physical pixels. Browsers then round each
 * flex-gap / margin independently (Chrome vs Electron can disagree which gap
 * “disappears”). Snapping to N physical pixels keeps every hairline stable.
 *
 * @example
 * devicePixelSnapPx(2, 1)    // 2
 * devicePixelSnapPx(2, 1.25) // 2.4  (3 physical)
 * devicePixelSnapPx(2, 1.5)  // 2    (3 physical)
 * devicePixelSnapPx(2, 2)    // 2    (4 physical)
 */
export function devicePixelSnapPx(
  cssPx: number,
  dpr: number = devicePixelRatioSafe(),
): number {
  if (!(cssPx > 0) || !Number.isFinite(cssPx)) return 0;
  if (!(dpr > 0) || !Number.isFinite(dpr)) return cssPx;
  const physical = Math.max(1, Math.round(cssPx * dpr));
  return physical / dpr;
}

/** Same as {@link devicePixelSnapPx} formatted for inline / CSS custom props. */
export function devicePixelSnapCss(
  cssPx: number,
  dpr: number = devicePixelRatioSafe(),
): string {
  return `${devicePixelSnapPx(cssPx, dpr)}px`;
}

/**
 * Call `onChange` when `devicePixelRatio` changes (zoom / monitor move).
 * Returns an unsubscribe function.
 */
export function watchDevicePixelRatio(onChange: (dpr: number) => void): () => void {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') {
    return () => undefined;
  }

  let mql: MediaQueryList | null = null;

  const bind = (): void => {
    mql?.removeEventListener('change', onMqChange);
    const dpr = devicePixelRatioSafe();
    mql = matchMedia(`(resolution: ${dpr}dppx)`);
    mql.addEventListener('change', onMqChange);
  };

  const onMqChange = (): void => {
    bind();
    onChange(devicePixelRatioSafe());
  };

  bind();
  return () => {
    mql?.removeEventListener('change', onMqChange);
    mql = null;
  };
}