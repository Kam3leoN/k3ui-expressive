/**
 * Material 3 Expressive — Icon button specifications.
 *
 * @see https://m3.material.io/components/icon-buttons/specs
 * @see https://m3.material.io/components/icon-buttons/accessibility
 *
 * Five sizes · two shapes · four color styles · three widths · toggle.
 * XS/S keep a ≥48×48 dp touch target beyond the painted container.
 */

export type IconButtonVariant = 'filled' | 'tonal' | 'outlined' | 'standard';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconButtonShape = 'round' | 'square';
export type IconButtonWidth = 'narrow' | 'default' | 'wide';

/** Per-size layout tokens (dp). Default width = container (square). */
export type IconButtonSizeTokens = {
  /** Painted container height (and default width). */
  container: number;
  icon: number;
  squareRadius: number;
  pressedRadius: number;
  narrowWidth: number;
  wideWidth: number;
};

/**
 * M3E measurement table (md3 / m3.material.io).
 * Default width equals `container` (uniform).
 */
export const IconButtonSizeDp: Record<IconButtonSize, IconButtonSizeTokens> = {
  xs: {
    container: 32,
    icon: 20,
    squareRadius: 12,
    pressedRadius: 8,
    narrowWidth: 28,
    wideWidth: 40,
  },
  sm: {
    container: 40,
    icon: 24,
    squareRadius: 12,
    pressedRadius: 8,
    narrowWidth: 32,
    wideWidth: 52,
  },
  md: {
    container: 56,
    icon: 24,
    squareRadius: 16,
    pressedRadius: 12,
    narrowWidth: 48,
    wideWidth: 72,
  },
  lg: {
    container: 96,
    icon: 32,
    squareRadius: 28,
    pressedRadius: 16,
    narrowWidth: 64,
    wideWidth: 128,
  },
  xl: {
    container: 136,
    icon: 40,
    squareRadius: 28,
    pressedRadius: 16,
    narrowWidth: 104,
    wideWidth: 184,
  },
};

/** Minimum interactive target (M3 a11y) — applied to XS & S. */
export const IconButtonMinTargetDp = 48;

export const IconButtonSpecs = {
  sizeDp: IconButtonSizeDp,
  minTargetDp: IconButtonMinTargetDp,
  /** M3 Expressive configs — filled is the default color style. */
  defaultVariant: 'filled' as IconButtonVariant,
  defaultSize: 'sm' as IconButtonSize,
  defaultShape: 'round' as IconButtonShape,
  defaultWidth: 'default' as IconButtonWidth,
} as const;

/** Painted width for a size × width combo. */
export function iconButtonWidthDp(
  size: IconButtonSize,
  width: IconButtonWidth = 'default',
): number {
  const t = IconButtonSizeDp[size];
  if (width === 'narrow') return t.narrowWidth;
  if (width === 'wide') return t.wideWidth;
  return t.container;
}

/** Hit-target box (W×H) — ≥48 on XS/S. */
export function iconButtonTargetDp(
  size: IconButtonSize,
  width: IconButtonWidth = 'default',
): { w: number; h: number } {
  const t = IconButtonSizeDp[size];
  const paintW = iconButtonWidthDp(size, width);
  const paintH = t.container;
  const min = size === 'xs' || size === 'sm' ? IconButtonMinTargetDp : 0;
  return {
    w: Math.max(paintW, min),
    h: Math.max(paintH, min),
  };
}
