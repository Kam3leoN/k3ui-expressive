/**
 * Specs for `k3-quote` — tilted testimonial card (author | citation split).
 */

export type QuoteLayout = 'author-start' | 'author-end';

/** Tilt sense: auto = random once; ccw = −deg; cw = +deg. */
export type QuoteTiltDir = 'auto' | 'ccw' | 'cw';

export const QuoteSpecs = {
  /** Default tilt enabled (attribute absent = on). */
  defaultTilt: true,
  layouts: ['author-start', 'author-end'] as const satisfies readonly QuoteLayout[],
  defaultLayout: 'author-start' as QuoteLayout,
  tiltDirs: ['auto', 'ccw', 'cw'] as const satisfies readonly QuoteTiltDir[],
  defaultTiltDir: 'auto' as QuoteTiltDir,
  /** Resting rotation magnitude when tilt is on (sign from tilt-dir). */
  tiltDeg: 3,
  /** Hover rotation magnitude (tilt on). */
  tiltHoverDeg: 5,
  /** Offset layer shift (dp). */
  offsetShift: '0.75rem',
  /** Offset shift on hover. */
  offsetHoverShift: '1rem',
  accessibility: {
    role: 'figure' as const,
  },
} as const;

export function isQuoteLayout(value: string): value is QuoteLayout {
  return (QuoteSpecs.layouts as readonly string[]).includes(value);
}

export function isQuoteTiltDir(value: string): value is QuoteTiltDir {
  return (QuoteSpecs.tiltDirs as readonly string[]).includes(value);
}

/** Pick a concrete tilt sense (never auto). */
export function resolveQuoteTiltDir(dir: QuoteTiltDir = 'auto'): 'ccw' | 'cw' {
  if (dir === 'ccw' || dir === 'cw') return dir;
  return Math.random() < 0.5 ? 'ccw' : 'cw';
}
