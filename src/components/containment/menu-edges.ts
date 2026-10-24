/**
 * First / last / only actionable items → `data-menu-edge` for M3e hover radii.
 *
 * Runs per surface (`k3-menu` flat list, or each `k3-menu-group`).
 * Skips divider & gap separators.
 *
 * Edge kinds:
 * - `first` / `last` / `only` — outer 12 (matches container feel)
 * - `gap-first` / `gap-last` — gap-facing (legacy; tree mark uses outer on both ends)
 * - `gap-only-*` — single item on a gap surface
 *
 * Gap stack policy: each surface is its own mini-menu — first + last (12) on
 * both ends (item above a gap = last, item below = first).
 */

export type MenuEdge =
  | 'first'
  | 'last'
  | 'only'
  | 'gap-first'
  | 'gap-last'
  | 'gap-only-start'
  | 'gap-only-end'
  | 'gap-only-mid';

function isGapSep(n: Element): boolean {
  return (
    n.localName === 'k3-menu-item' &&
    (n.hasAttribute('gap') || n.getAttribute('divider') === 'gap')
  );
}

function isLineDivider(n: Element): boolean {
  return (
    n.localName === 'k3-menu-item' &&
    n.hasAttribute('divider') &&
    n.getAttribute('divider') !== 'gap'
  );
}

function isActionableItem(n: Element): n is HTMLElement {
  return (
    n instanceof HTMLElement &&
    n.localName === 'k3-menu-item' &&
    !isGapSep(n) &&
    !isLineDivider(n)
  );
}

/**
 * Mark edges among direct children of `parent` (menu root or one group).
 */
export function markMenuItemEdges(
  parent: Element,
  opts?: { startOuter?: boolean; endOuter?: boolean },
): void {
  const startOuter = opts?.startOuter ?? true;
  const endOuter = opts?.endOuter ?? true;

  const items = [...parent.children].filter(isActionableItem);
  for (const el of items) el.removeAttribute('data-menu-edge');
  if (items.length === 0) return;

  if (items.length === 1) {
    let edge: MenuEdge = 'only';
    if (startOuter && !endOuter) edge = 'gap-only-start';
    else if (!startOuter && endOuter) edge = 'gap-only-end';
    else if (!startOuter && !endOuter) edge = 'gap-only-mid';
    items[0]!.setAttribute('data-menu-edge', edge);
    return;
  }

  items[0]!.setAttribute('data-menu-edge', startOuter ? 'first' : 'gap-first');
  items[items.length - 1]!.setAttribute('data-menu-edge', endOuter ? 'last' : 'gap-last');
}

/**
 * Mark edges on a menu root and every nested group surface.
 */
export function markMenuTreeEdges(root: Element): void {
  const groups = [
    ...root.querySelectorAll(':scope > k3-menu-group'),
    ...root.querySelectorAll(':scope > [data-k3-menu-elev] > k3-menu-group'),
  ];
  if (!groups.length) {
    markMenuItemEdges(root);
    return;
  }
  /* Per surface: always first + last (not gap-first/gap-last at 8) */
  for (const g of groups) markMenuItemEdges(g, { startOuter: true, endOuter: true });
}