/** Ellipsis glyph in page ranges. */
export const PAGINATION_ELLIPSIS = '…';

export const PaginationSpecs = {
  defaultPage: 1 as number,
  defaultCount: 10 as number,
  defaultSiblingCount: 1 as number,
  showFirst: true as boolean,
  showLast: true as boolean,
  showPrev: true as boolean,
  showNext: true as boolean,
  disabled: false as boolean,
  navIcons: {
    first: 'first_page',
    prev: 'chevron_left',
    next: 'chevron_right',
    last: 'last_page',
  },
} as const;

/**
 * Build visible page numbers with ellipsis (1-based `current`, `total` pages).
 */
export function buildPaginationPages(
  current: number,
  total: number,
  siblingCount = 1,
): (number | typeof PAGINATION_ELLIPSIS)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSiblingIdx = Math.max(current - siblingCount, 1);
  const rightSiblingIdx = Math.min(current + siblingCount, total);

  const showLeftDots = leftSiblingIdx > 2;
  const showRightDots = rightSiblingIdx < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, PAGINATION_ELLIPSIS, total];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => total - (3 + 2 * siblingCount) + i + 1,
    );
    return [1, PAGINATION_ELLIPSIS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIdx - leftSiblingIdx + 1 },
    (_, i) => leftSiblingIdx + i,
  );
  return [1, PAGINATION_ELLIPSIS, ...middleRange, PAGINATION_ELLIPSIS, total];
}
