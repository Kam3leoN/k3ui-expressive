/**
 * Material 3 Expressive — Split button specifications.
 *
 * @see https://m3.material.io/components/split-button/specs
 * @see https://m3.material.io/components/split-button/guidelines
 *
 * Gap 2dp · outer = H/2 · trailing square H×H · selected → circle.
 * Leading = label surface (not clickable) · trailing = menu + focus ring.
 * Leading inner corners morph when trailing is hovered / focused / pressed.
 */

export type SplitButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SplitButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated';

/** Per-size layout tokens (dp). */
export type SplitButtonSizeTokens = {
  height: number;
  inner: number;
  innerHover: number;
  innerPressed: number;
  leadPadStart: number;
  leadPadEnd: number;
  leadIcon: number;
  leadIconGap: number;
  trailIcon: number;
  /** Optical chevron shift (negative). */
  chevShift: number;
};

/**
 * M3E size table — trail pad = (H − trailIcon) / 2 for a centered icon in H×H.
 */
export const SplitButtonSizeDp: Record<SplitButtonSize, SplitButtonSizeTokens> = {
  xs: {
    height: 32,
    inner: 4,
    innerHover: 8,
    innerPressed: 8,
    leadPadStart: 12,
    leadPadEnd: 10,
    leadIcon: 20,
    leadIconGap: 4,
    trailIcon: 22,
    chevShift: -1,
  },
  sm: {
    height: 40,
    inner: 4,
    innerHover: 12,
    innerPressed: 12,
    leadPadStart: 16,
    leadPadEnd: 12,
    leadIcon: 24,
    leadIconGap: 8,
    trailIcon: 22,
    chevShift: -1,
  },
  md: {
    height: 56,
    inner: 4,
    innerHover: 12,
    innerPressed: 12,
    leadPadStart: 24,
    leadPadEnd: 24,
    leadIcon: 24,
    leadIconGap: 8,
    trailIcon: 26,
    chevShift: -2,
  },
  lg: {
    height: 96,
    inner: 8,
    innerHover: 20,
    innerPressed: 20,
    leadPadStart: 48,
    leadPadEnd: 48,
    leadIcon: 32,
    leadIconGap: 12,
    trailIcon: 38,
    chevShift: -3,
  },
  xl: {
    height: 136,
    inner: 12,
    innerHover: 20,
    innerPressed: 20,
    leadPadStart: 64,
    leadPadEnd: 64,
    leadIcon: 40,
    leadIconGap: 16,
    trailIcon: 50,
    chevShift: -6,
  },
};

/** Between leading and trailing segments. */
export const SplitButtonGapDp = 2;

export const SplitButtonSpecs = {
  gapDp: SplitButtonGapDp,
  sizeDp: SplitButtonSizeDp,
  defaultSize: 'sm' as SplitButtonSize,
  defaultVariant: 'filled' as SplitButtonVariant,
} as const;

/** Trail horizontal pad to center icon in the H×H square. */
export function splitButtonTrailPadDp(size: SplitButtonSize): number {
  const t = SplitButtonSizeDp[size];
  return (t.height - t.trailIcon) / 2;
}
