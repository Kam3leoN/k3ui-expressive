/**
 * Gap normalization for `k3-menu`.
 *
 * Authoring:
 *   <k3-menu-item>…</k3-menu-item>
 *   <k3-menu-item divider="gap"></k3-menu-item>
 *   <k3-menu-item>…</k3-menu-item>
 *
 * Runtime (vertical only — never on baseline):
 *   [data-k3-menu-elev]
 *     k3-menu-group[data-auto-gap]  ← surface A (pad 4)
 *     k3-menu-group[data-auto-gap]  ← surface B (pad 4)
 *   (2dp transparent gap via flex gap on elev)
 *
 * Once converted, further slotchange calls are no-ops (no gap markers left),
 * which avoids a freeze loop from re-flattening.
 */

/** Attribute on the wrapper that stacks auto gap groups. */
export const MENU_ELEV_ATTR = 'data-k3-menu-elev';

/** Marker on groups created by normalize (vs author-written groups). */
export const MENU_AUTO_GAP_ATTR = 'data-auto-gap';

const GAP_ITEM_SEL = ':scope > k3-menu-item[gap], :scope > k3-menu-item[divider="gap"]';

function isGapEl(el: Element): boolean {
  return el.matches('k3-menu-item[gap], k3-menu-item[divider="gap"]');
}

/**
 * Flatten light-DOM children into a linear list of menu items, exploding any
 * prior elev/auto-group wrappers so re-normalize is deterministic.
 */
function flattenMenuChildren(host: HTMLElement): HTMLElement[] {
  const flat: HTMLElement[] = [];
  for (const child of [...host.children]) {
    if (!(child instanceof HTMLElement) || child.slot === 'trigger') continue;

    if (child.hasAttribute(MENU_ELEV_ATTR)) {
      for (const g of [...child.children]) {
        if (g instanceof HTMLElement && g.localName === 'k3-menu-group') {
          for (const c of [...g.children]) {
            if (c instanceof HTMLElement) flat.push(c);
          }
        }
      }
      child.remove();
      continue;
    }

    if (child.localName === 'k3-menu-group' && child.hasAttribute(MENU_AUTO_GAP_ATTR)) {
      for (const c of [...child.children]) {
        if (c instanceof HTMLElement) flat.push(c);
      }
      child.remove();
      continue;
    }

    if (child.localName === 'k3-menu-item') {
      flat.push(child);
    }
  }
  return flat;
}

/**
 * Split a flat item list on gap markers; remove the markers from the DOM.
 * Returns only non-empty segments.
 */
function splitOnGaps(flat: HTMLElement[]): HTMLElement[][] {
  const segments: HTMLElement[][] = [[]];
  for (const el of flat) {
    if (isGapEl(el)) {
      el.remove();
      segments.push([]);
    } else {
      segments[segments.length - 1]!.push(el);
    }
  }
  return segments.filter((s) => s.length > 0);
}

export type NormalizeGapsOptions = {
  /** Menu variant — baseline never promotes gap surfaces. */
  variant: string;
  /** Re-entrancy guard (slotchange during DOM moves). */
  isNormalizing: () => boolean;
  setNormalizing: (v: boolean) => void;
  /** Called after structure settles (edge marks, data-has-groups). */
  onSync: () => void;
};

/**
 * Promote `divider="gap"` into elevated group surfaces, or sync if already done.
 * Safe to call on every slotchange / open.
 */
export function normalizeMenuGaps(host: HTMLElement, opts: NormalizeGapsOptions): void {
  if (opts.isNormalizing()) return;

  /* Baseline: divider="gap" unsupported — keep a flat list */
  if (opts.variant === 'baseline') {
    opts.onSync();
    return;
  }

  /* Author-supplied groups win — never auto-rewrite */
  if (host.querySelector(`:scope > k3-menu-group:not([${MENU_AUTO_GAP_ATTR}])`) != null) {
    opts.onSync();
    return;
  }

  const gapItems = host.querySelectorAll(GAP_ITEM_SEL);
  /* Already converted (no markers) — do not flatten */
  if (!gapItems.length) {
    opts.onSync();
    return;
  }

  opts.setNormalizing(true);
  try {
    const flat = flattenMenuChildren(host);
    const filled = splitOnGaps(flat);

    if (filled.length <= 1) {
      for (const item of filled[0] ?? []) host.appendChild(item);
      opts.onSync();
      return;
    }

    const elev = document.createElement('div');
    elev.setAttribute(MENU_ELEV_ATTR, '');
    for (const seg of filled) {
      const g = document.createElement('k3-menu-group');
      g.setAttribute(MENU_AUTO_GAP_ATTR, '');
      for (const item of seg) g.appendChild(item);
      elev.appendChild(g);
    }
    host.appendChild(elev);
    opts.onSync();
  } finally {
    /* Release after the current slotchange cascade settles */
    queueMicrotask(() => opts.setNormalizing(false));
  }
}

/** True when the menu light DOM has group surfaces (manual or auto). */
export function menuHasGroupSurfaces(host: HTMLElement): boolean {
  return (
    host.querySelector(`:scope > k3-menu-group, :scope > [${MENU_ELEV_ATTR}]`) != null
  );
}