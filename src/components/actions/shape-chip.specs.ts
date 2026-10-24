/**
 * Shape Chip tokens — pill + Material shape (center on leading or trailing edge).
 *
 * Custom K3ui action (legend / filter chrome) — not an M3 Chip / Input.
 *
 * Proportions locked from the original 28dp pill design:
 * - shape = pill × (36×1.1 / 28)
 * - gap   = pill × (7 / 28)
 * - icon  = M3 Icon Button sizes (20 / 24 / 24 / 32 / 40)
 */

/** M3 Expressive sizes — same ladder as Buttons (pill height). */
export type ShapeChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Shape side relative to the pill. */
export type ShapeChipPlacement = 'leading' | 'trailing';

/** Design reference pill (pre-size ladder). */
export const ShapeChipRefPillDp = 28;

/** Base shape before ×1.1 (on ref pill). */
export const ShapeChipShapeBaseDp = 36;

/** Shape on ref pill — base × 1.1. */
export const ShapeChipShapeSizeDp = ShapeChipShapeBaseDp * 1.1;

/** Extra gap beyond half-shape on ref pill. */
export const ShapeChipGapExtraDp = 7;

/** Trailing/leading label pad end on ref pill (0.85rem). */
export const ShapeChipPadEndDp = 13.6;

/** shape / pill */
export const ShapeChipShapeOverPill =
  ShapeChipShapeSizeDp / ShapeChipRefPillDp;

/** gap extra / pill */
export const ShapeChipGapOverPill = ShapeChipGapExtraDp / ShapeChipRefPillDp;

/** pad-end / pill */
export const ShapeChipPadEndOverPill = ShapeChipPadEndDp / ShapeChipRefPillDp;

/**
 * Pill heights — aligned with Buttons (xs 32 · sm 40 · md 56 · lg 96 · xl 136).
 * Default `sm`.
 */
export const ShapeChipPillHeightDp: Record<ShapeChipSize, number> = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 96,
  xl: 136,
};

/**
 * Icon inside the shape — M3 Icon Button specs (same as `k3-icon-button`).
 * @see https://m3.material.io/components/icon-buttons/specs
 */
export const ShapeChipIconSizeDp: Record<ShapeChipSize, number> = {
  xs: 20,
  sm: 24,
  md: 24,
  lg: 32,
  xl: 40,
};

export const ShapeChipDefaultSize: ShapeChipSize = 'sm';

/** Default Material shape when `shape` is omitted. */
export const ShapeChipDefaultShape = 'Cookie7Sided' as const;

/** Derived metrics for one size (pill · shape · icon · insets). */
export function shapeChipMetrics(size: ShapeChipSize = ShapeChipDefaultSize) {
  const pill = ShapeChipPillHeightDp[size];
  const shape = pill * ShapeChipShapeOverPill;
  const icon = ShapeChipIconSizeDp[size];
  const labelInset = shape * 0.5 + pill * ShapeChipGapOverPill;
  const padEnd = pill * ShapeChipPadEndOverPill;
  return { pill, shape, icon, labelInset, padEnd };
}
