/**
 * Specs for `k3-button-card` — compact link/action row (icon + label + subtitle).
 */

export const ButtonCardSpecs = {
  accessibility: {
    role: 'link' as const,
  },
  /** Icon well size (dp) — medyamagaza reference. */
  iconWellDp: 44,
  /** Icon glyph size (dp). */
  iconDp: 22,
  /** Card padding block / inline (dp). */
  padBlockDp: 10,
  padInlineDp: 14,
  /** Card corner. */
  corner: '0.625rem',
  /** Icon well corner. */
  iconCorner: '0.5rem',
} as const;
