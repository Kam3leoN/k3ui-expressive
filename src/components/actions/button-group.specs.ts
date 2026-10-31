/**
 * Material 3 Expressive — Button group specifications.
 *
 * @see https://m3.material.io/components/button-groups/specs
 * @see https://m3.material.io/components/button-groups/guidelines
 * @see https://github.com/material-components/material-components-android/blob/master/docs/components/ButtonGroup.md
 * @see androidx.compose.material3.ButtonGroupDefaults
 *
 * Anatomy: invisible container — spacing + shape only (no own color).
 *
 * Standard between-space (touch 48dp): XS 18 · S 12 · M/L/XL 8
 * Connected between-space: 2dp every size
 * Round connected: outer CornerFull · inner XS 4 · S/M 8 · L 16 · XL 20
 * Square connected: outer XS 4 · S/M 8 · L 16 · XL 20 · inner 4dp (facing seams)
 * Pressed inner (connected): 4dp · Round selected inner: 50% (stadium)
 * Standard press: ExpandedRatio 0.15 · neighbors only (compressionLimit)
 * Connected: no child size morph
 * Color: filled / tonal / outlined toggle styles (elevated / text not recommended)
 */

import type { ButtonShape, ButtonSize } from './button.js';

/**
 * `segmented` is an accepted alias of `connected` (joined pill look).
 * Prefer `connected` in new code — matches M3 “connected button group”.
 */
export type ButtonGroupVariant = 'standard' | 'connected' | 'segmented';
export type ButtonGroupSelection = 'none' | 'single' | 'multi';
export type ButtonGroupSize = ButtonSize;
export type ButtonGroupShape = ButtonShape;
export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export type ButtonGroupLabels = 'always' | 'selected';

/**
 * Standard inner padding (between-space) per size —
 * `md.comp.button-group.standard.*.between-space`
 */
export const ButtonGroupStandardGapDp: Record<ButtonGroupSize, number> = {
  xs: 18,
  sm: 12,
  md: 8,
  lg: 8,
  xl: 8,
};

/** Default / Small token — used when size omitted. */
export const ButtonGroupStandardGapDefaultDp = ButtonGroupStandardGapDp.sm;

/** `ConnectedButtonGroup*Tokens.BetweenSpace` — 2dp at every size */
export const ButtonGroupConnectedGapDp = 2;

/**
 * Round connected — inner corner at rest.
 * Square connected — **outer** corner (first left / last right).
 */
export const ButtonGroupConnectedCornerDp: Record<ButtonGroupSize, number> = {
  xs: 4,
  sm: 8,
  md: 8,
  lg: 16,
  xl: 20,
};

/** @deprecated Use `ButtonGroupConnectedCornerDp` */
export const ButtonGroupConnectedInnerDp = ButtonGroupConnectedCornerDp;

/**
 * Square connected facing seams + pressed inner — CornerValueExtraSmall (4dp).
 * Outer first/last stay on `ButtonGroupConnectedCornerDp` (more pronounced).
 */
export const ButtonGroupConnectedPressedInnerDp = 4;
export const ButtonGroupConnectedSquareInnerDp = ButtonGroupConnectedPressedInnerDp;

/**
 * Selected inner corner — `SelectedInnerCornerCornerSizePercent = 50`
 * → stadium (half of height via `--k3-btn-corner`).
 */
export const ButtonGroupConnectedSelectedInnerPercent = 50;

/** Min segment width hint (xs–sm). */
export const ButtonGroupConnectedMinWidthDp = 48;

/**
 * `ButtonGroupDefaults.ExpandedRatio` — +15% while pressed (standard only).
 * Growth capped by neighbor `compressionLimit` (content padding, shell only).
 * Content (label / icon) never scales — only the layout width morphs.
 */
export const ButtonGroupExpandedRatio = 0.15;

/** Fallback compressionLimit ≈ ButtonDefaults ContentPadding start. */
export const ButtonGroupCompressionLimitFallbackDp = 16;

/**
 * Clear delay after release — matches `--k3-sys-motion-duration-spatial-fast`
 * (+ small buffer so the CSS width transition finishes before snap-clear).
 * Press morph uses M3E FastSpatial (350ms · spring cubic) — same as button
 * shape morph; Standard scheme remaps via `data-k3-motion`.
 */
export const ButtonGroupPressReleaseMs = 370;

export const ButtonGroupSpecs = {
  standardGapDp: ButtonGroupStandardGapDp,
  standardGapDefaultDp: ButtonGroupStandardGapDefaultDp,
  connectedGapDp: ButtonGroupConnectedGapDp,
  connectedCornerDp: ButtonGroupConnectedCornerDp,
  connectedInnerDp: ButtonGroupConnectedCornerDp,
  connectedPressedInnerDp: ButtonGroupConnectedPressedInnerDp,
  connectedSquareInnerDp: ButtonGroupConnectedSquareInnerDp,
  connectedSelectedInnerPercent: ButtonGroupConnectedSelectedInnerPercent,
  connectedMinWidthDp: ButtonGroupConnectedMinWidthDp,
  expandedRatio: ButtonGroupExpandedRatio,
  compressionLimitFallbackDp: ButtonGroupCompressionLimitFallbackDp,
  pressReleaseMs: ButtonGroupPressReleaseMs,
  childSelector: 'k3-button, k3-icon-button',
  /** Optional light-DOM tip wrap around a group child (audio extras, labs). */
  tooltipWrapSelector: 'k3-tooltip',
} as const;
