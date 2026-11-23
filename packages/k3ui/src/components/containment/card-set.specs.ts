/**
 * Material 3 Expressive — connected card set (card list) specifications.
 *
 * Mirrors M3E card-list / button-group connected joins: large outer corners on
 * the free silhouette, small inner corners on adjoining edges, tight gap.
 *
 * @see https://m3.material.io/styles/shape/corner-radius-scale
 * @see https://m3.material.io/components/cards/guidelines
 * @see m3e_card_list / frust_material::card_list defaults (24–28 outer · 4 inner · 2–4 gap)
 */

export type CardSetVariant = 'standard' | 'connected';
export type CardSetLayout = 'stack' | 'grid';

/** Connected between-space — 2dp (same join as button-group / segmented list). */
export const CardSetConnectedGapDp = 2;

/**
 * Outward corners of the connected silhouette —
 * Extra large (28dp), matching KydeOS / M3E card-list outer.
 */
export const CardSetConnectedOuterDp = 28;

/**
 * Facing / adjoining corners — Extra small (4dp).
 * Distinct from nested optical roundness (outer − inset).
 */
export const CardSetConnectedInnerDp = 4;

export const CardSetSpecs = {
  connectedGapDp: CardSetConnectedGapDp,
  connectedOuterDp: CardSetConnectedOuterDp,
  connectedInnerDp: CardSetConnectedInnerDp,
  /** CSS token refs applied as corner custom properties. */
  connectedOuterCss: 'var(--k3-sys-shape-corner-extra-large)',
  connectedInnerCss: 'var(--k3-sys-shape-corner-extra-small)',
  childSelector: 'k3-card',
} as const;
