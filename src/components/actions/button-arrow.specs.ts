/**
 * Spécifications `k3-button-arrow` — split flèches M3 Expressive.
 *
 * Géométrie Small (S) : 48×48 · gap 2 · outer-r 24 · inner-r 4 · icon 28.
 *
 * @see https://m3.material.io/components/buttons/overview
 */

export type ButtonArrowDirection = 'horizontal' | 'vertical';
export type ButtonArrowVariant = 'filled' | 'tonal' | 'outlined';

/** Tokens géométrie (dp). */
export const ButtonArrowSizeDp = {
  half: 48,
  gap: 2,
  outerRadius: 24,
  innerRadius: 4,
  icon: 28,
  /** Subtle nudge on hover. */
  iconHoverOffset: 0.5,
} as const;

/** Material Symbols — horizontal / vertical. */
export const ButtonArrowIcons = {
  left: 'chevron_left',
  right: 'chevron_right',
  up: 'expand_less',
  down: 'expand_more',
} as const;

export const ButtonArrowSpecs = {
  sizeDp: ButtonArrowSizeDp,
  icons: ButtonArrowIcons,
  defaultDirection: 'horizontal' as ButtonArrowDirection,
  defaultVariant: 'filled' as ButtonArrowVariant,
  defaultIndex: 0,
  defaultList: [] as string[],
  accessibility: {
    role: 'group' as const,
    labelPrev: 'Previous',
    labelNext: 'Next',
    labelUp: 'Up',
    labelDown: 'Down',
  },
} as const;
