/**
 * Button Pill tokens — destination control shared by nav-rail / nav-bar.
 *
 * Two layouts (same chrome as former `k3-nav-item`):
 * - **vertical** — 56×32 indicator on the icon; label below
 * - **horizontal** — 56dp pill wraps icon + label (inline)
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */

export type ButtonPillLayout = 'vertical' | 'horizontal';

/** Vertical icon indicator width (dp). */
export const ButtonPillIndicatorWDp = 56;

/** Vertical icon indicator height (dp). */
export const ButtonPillIndicatorHDp = 32;

/** Horizontal pill height (dp) — icon + label row. */
export const ButtonPillRowHDp = 56;

/** Gap icon ↔ label inside horizontal pill (dp). */
export const ButtonPillRowGapDp = 12;

/** Horizontal pill padding-inline start / end (dp). */
export const ButtonPillRowPadInlineStartDp = 16;
export const ButtonPillRowPadInlineEndDp = 24;

/** Material symbol size (dp). */
export const ButtonPillIconDp = 24;

/** Min touch / destination column height when vertical (dp). */
export const ButtonPillVerticalMinHDp = 48;

export const ButtonPillDefaultLayout: ButtonPillLayout = 'vertical';
