/**
 * Neighbor detection for connected card corners (1D stack or 2D grid).
 *
 * A physical corner is **outer** only when both adjacent sides are free
 * (no neighbor). That yields KydeOS-style asymmetric radii on bento grids
 * and classic first/middle/last on vertical stacks.
 */

export interface CardRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Physical (LTR screen) corner flags before RTL remapping. */
export interface CardCornerFlags {
  topLeftOuter: boolean;
  topRightOuter: boolean;
  bottomRightOuter: boolean;
  bottomLeftOuter: boolean;
}

export interface CardNeighborEdges {
  above: boolean;
  right: boolean;
  below: boolean;
  left: boolean;
}

function overlaps1D(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  minOverlap: number,
): boolean {
  return Math.min(a1, b1) - Math.max(a0, b0) >= minOverlap;
}

/**
 * Detect orthogonal neighbors for each rect.
 * @param gapPx — connected gap in CSS pixels (between faces)
 */
export function detectCardNeighbors(
  rects: readonly CardRect[],
  gapPx: number,
): CardNeighborEdges[] {
  const tol = Math.max(2, gapPx * 0.75 + 1);
  const maxDist = gapPx + tol;
  const minOverlap = 8;

  return rects.map((a, i) => {
    let above = false;
    let right = false;
    let below = false;
    let left = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      const b = rects[j]!;
      const hOverlap = overlaps1D(a.left, a.right, b.left, b.right, minOverlap);
      const vOverlap = overlaps1D(a.top, a.bottom, b.top, b.bottom, minOverlap);

      if (hOverlap) {
        const down = b.top - a.bottom;
        if (down >= -tol && down <= maxDist) below = true;
        const up = a.top - b.bottom;
        if (up >= -tol && up <= maxDist) above = true;
      }
      if (vOverlap) {
        const toRight = b.left - a.right;
        if (toRight >= -tol && toRight <= maxDist) right = true;
        const toLeft = a.left - b.right;
        if (toLeft >= -tol && toLeft <= maxDist) left = true;
      }
    }
    return { above, right, below, left };
  });
}

/** Corner outer flags from neighbor edges (physical LTR). */
export function cornerFlagsFromNeighbors(
  edges: CardNeighborEdges,
): CardCornerFlags {
  return {
    topLeftOuter: !edges.above && !edges.left,
    topRightOuter: !edges.above && !edges.right,
    bottomRightOuter: !edges.below && !edges.right,
    bottomLeftOuter: !edges.below && !edges.left,
  };
}

export interface LogicalCornerCss {
  /** border-start-start-radius */
  rss: string;
  /** border-start-end-radius */
  rse: string;
  /** border-end-end-radius */
  ree: string;
  /** border-end-start-radius */
  res: string;
}

/**
 * Map physical corner flags → logical CSS custom-property values.
 */
export function logicalCornersFromFlags(
  flags: CardCornerFlags,
  outerCss: string,
  innerCss: string,
  rtl: boolean,
): LogicalCornerCss {
  const tl = flags.topLeftOuter ? outerCss : innerCss;
  const tr = flags.topRightOuter ? outerCss : innerCss;
  const br = flags.bottomRightOuter ? outerCss : innerCss;
  const bl = flags.bottomLeftOuter ? outerCss : innerCss;
  if (rtl) {
    return { rss: tr, rse: tl, ree: bl, res: br };
  }
  return { rss: tl, rse: tr, ree: br, res: bl };
}

/** Linear stack position label (tests / debug). */
export function stackPositionLabel(
  index: number,
  total: number,
): 'only' | 'first' | 'middle' | 'last' {
  if (total <= 1) return 'only';
  if (index === 0) return 'first';
  if (index === total - 1) return 'last';
  return 'middle';
}

/**
 * Resolve connected radii for a set of laid-out card rects.
 */
export function resolveConnectedCorners(
  rects: readonly CardRect[],
  gapPx: number,
  outerCss: string,
  innerCss: string,
  rtl: boolean,
): LogicalCornerCss[] {
  const neighbors = detectCardNeighbors(rects, gapPx);
  return neighbors.map((edges) =>
    logicalCornersFromFlags(
      cornerFlagsFromNeighbors(edges),
      outerCss,
      innerCss,
      rtl,
    ),
  );
}

/** Vertical stack corners from index (no layout measurement required). */
export function resolveStackConnectedCorners(
  total: number,
  outerCss: string,
  innerCss: string,
): LogicalCornerCss[] {
  return Array.from({ length: total }, (_, i) => {
    const pos = stackPositionLabel(i, total);
    if (pos === 'only') {
      return { rss: outerCss, rse: outerCss, ree: outerCss, res: outerCss };
    }
    if (pos === 'first') {
      return { rss: outerCss, rse: outerCss, ree: innerCss, res: innerCss };
    }
    if (pos === 'last') {
      return { rss: innerCss, rse: innerCss, ree: outerCss, res: outerCss };
    }
    return { rss: innerCss, rse: innerCss, ree: innerCss, res: innerCss };
  });
}

/**
 * Synthetic grid packing when getBoundingClientRect is empty (jsdom / pre-layout).
 * Left-to-right, top-to-bottom; `spans[i]` = column span (clamped to `columns`).
 */
export function packGridRects(
  count: number,
  columns: number,
  spans: readonly number[],
  cellW = 100,
  cellH = 40,
  gap = 2,
): CardRect[] {
  const cols = Math.max(1, columns);
  const rects: CardRect[] = [];
  let row = 0;
  let col = 0;
  for (let i = 0; i < count; i++) {
    const span = Math.min(cols, Math.max(1, spans[i] ?? 1));
    if (col + span > cols) {
      row += 1;
      col = 0;
    }
    const left = col * (cellW + gap);
    const top = row * (cellH + gap);
    rects.push({
      top,
      left,
      right: left + span * cellW + (span - 1) * gap,
      bottom: top + cellH,
    });
    col += span;
    if (col >= cols) {
      row += 1;
      col = 0;
    }
  }
  return rects;
}

/** Parse `col-span` attribute → column units (`full` = all columns). */
export function parseColSpan(el: Element, columns: number): number {
  const raw = (el.getAttribute('col-span') ?? '').trim().toLowerCase();
  if (!raw) return 1;
  if (raw === 'full') return Math.max(1, columns);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(columns, Math.floor(n)) : 1;
}
