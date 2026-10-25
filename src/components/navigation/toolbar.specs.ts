/**
 * Material 3 Expressive Toolbar — token constants.
 *
 * @see https://m3.material.io/components/toolbars/overview
 * @see https://m3.material.io/components/toolbars/specs
 *
 * Bottom app bar is **not recommended** in M3E — use `variant="docked"`.
 * Do not show a toolbar at the same time as a navigation bar.
 */

export type ToolbarVariant = 'docked' | 'floating';
export type ToolbarColor = 'standard' | 'vibrant';
export type ToolbarOrientation = 'horizontal' | 'vertical';
/** Docked item distribution — cluster (fixed gaps) · spread (leading / fill / trailing). */
export type ToolbarLayout = 'cluster' | 'spread';
/**
 * Floating bar corners:
 * - `full` — pill (CornerFull)
 * - `rounded` — Extra large 28dp (Meet-like flatter capsule)
 */
export type ToolbarShape = 'full' | 'rounded';

export const ToolbarSpecs = {
  /** Container height — all variants. */
  heightDp: 64,
  /** Floating inline pad (Meet ~12). */
  floatingPadInlineDp: 12,
  /** Floating block pad (Meet ~8 — vertical breathing room). */
  floatingPadBlockDp: 8,
  /** @deprecated Prefer floatingPadInlineDp. */
  floatingPadDp: 12,
  /** Floating inter-item gap. */
  floatingGapDp: 4,
  /** Gap between floating toolbar and paired FAB. */
  fabGapDp: 8,
  /** Paired FAB height (default FAB). */
  fabHeightDp: 56,
  /** Floating rounded shape radius (extra-large). */
  floatingRoundedRadiusDp: 28,
  /** Docked outside horizontal pad. */
  dockedOutsidePadDp: 16,
  /** Docked inter-item gap when layout=cluster. */
  dockedGapDp: 32,
  /** Floating min viewport inset (sides / bottom). */
  floatingMarginDp: 16,
  defaultVariant: 'floating' as ToolbarVariant,
  defaultColor: 'standard' as ToolbarColor,
  defaultOrientation: 'horizontal' as ToolbarOrientation,
  defaultLayout: 'cluster' as ToolbarLayout,
  defaultShape: 'full' as ToolbarShape,
} as const;
