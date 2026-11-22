/**
 * Counter — Material 3 Expressive pill with − / value / +.
 *
 * Sizes follow the 5-step ladder: xs · sm · md · lg · xl (default md).
 * Circle diameter drives button + value height; min-width ≈ 2.5 × circle.
 */

export type CounterSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Circle diameter (dp) per size — shared by − / value / +. */
export const CounterCircleDp: Record<CounterSize, number> = {
  xs: 32, // 2rem
  sm: 40, // 2.5rem
  md: 48, // 3rem
  lg: 56, // 3.5rem
  xl: 64, // 4rem
};

/** Pill min-width (dp) = 2.5 × circle. */
export const CounterMinWidthDp: Record<CounterSize, number> = {
  xs: 80,
  sm: 100,
  md: 120,
  lg: 140,
  xl: 160,
};

/** Font size (rem) for value / ± glyphs. */
export const CounterFontRem: Record<CounterSize, number> = {
  xs: 0.9,
  sm: 1,
  md: 1.15,
  lg: 1.35,
  xl: 1.5,
};

/** Gap between value circle and ± buttons (dp). */
export const CounterValueGapDp = 3.2; // 0.2rem

/** Inner padding on the value pill so long numbers don't clip (em). */
export const CounterNumberInnerGapEm = 0.35;

export const CounterSpecs = {
  defaultSize: 'md' as CounterSize,
  defaultValue: 0,
  defaultStep: 1,
  defaultDecimals: 0,
  allowNegative: false,
  circleDp: CounterCircleDp,
  minWidthDp: CounterMinWidthDp,
  fontRem: CounterFontRem,
  valueGapDp: CounterValueGapDp,
  numberInnerGapEm: CounterNumberInnerGapEm,
  accessibility: {
    role: 'group',
    ariaLabelDecrement: 'Decrement',
    ariaLabelIncrement: 'Increment',
    ariaLabelValue: 'Current value',
  },
} as const;

export function resolveCounterSize(size: string | null | undefined): CounterSize {
  if (size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' || size === 'xl') {
    return size;
  }
  return CounterSpecs.defaultSize;
}
