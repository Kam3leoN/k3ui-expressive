/**
 * M3 Expressive — Carousel specs.
 * @see https://m3.material.io/components/carousel/specs
 *
 * Layouts:
 * - `multi-browse` — large + medium + small items, snaps item by item (default)
 * - `uncontained`  — same-size items cut off at the edge, free scroll (no snap)
 * - `hero`         — one large item + small peek(s); `align="start" | "center"`
 * - `full-screen`  — one edge-to-edge item at a time, vertical scroll
 */
export type CarouselLayout = 'multi-browse' | 'uncontained' | 'hero' | 'full-screen';
export type CarouselAlign = 'start' | 'center';
/** Page indicators: none, horizontal (top / bottom) or vertical (left / right). */
export type CarouselIndicators = 'none' | 'top' | 'bottom' | 'left' | 'right';
/** `continuous` stops at both ends; `loop` wraps around (infinite in keyline layouts). */
export type CarouselMode = 'continuous' | 'loop';

export const CarouselSpecs = {
  layout: 'multi-browse' as CarouselLayout,
  align: 'start' as CarouselAlign,
  indicators: 'none' as CarouselIndicators,
  mode: 'continuous' as CarouselMode,
  /** Indicator dot: 8dp; active dot is 3× wider (24dp). */
  dot: 8,
  dotActiveRatio: 3,
  /** Preferred large item width (dp → px @1x). Compose default: 186dp. */
  itemWidth: 186,
  /** Space between items: 8dp. */
  gap: 8,
  /** Small item min / max width: 40dp – 56dp. */
  smallMin: 40,
  smallMax: 56,
  /** Medium item never smaller than small max + this ratio of large. */
  mediumMinRatio: 0.3,
  /** Item corner — extra-large (28dp). */
  corner: 'var(--k3-sys-shape-corner-extra-large)',
  /** Container height (≈ 221dp, M3 multi-browse reference). */
  height: '13.8125rem',
} as const;
