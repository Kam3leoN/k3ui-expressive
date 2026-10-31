/**
 * M3 FAB show / hide — scale + fade (same idea as Android `FloatingActionButton`).
 * Used by `k3-fab`, `k3-extended-fab`, fab-menu peers, and sheet/dialog overlay conceal.
 */

import { waitForMotion, prefersReducedMotion } from '../../core/index.js';

export type FabVisibilityHost = HTMLElement & {
  show?: () => Promise<boolean | void> | boolean | void;
  hide?: (source?: string) => Promise<boolean | void> | boolean | void;
  open?: boolean;
};

const ATTR = 'data-visibility';

/** Apply enter animation then clear phase. */
export async function fabShow(host: HTMLElement): Promise<boolean> {
  if (!host.hasAttribute('hidden') && host.getAttribute(ATTR) !== 'hiding') {
    return true;
  }
  host.removeAttribute('hidden');
  host.setAttribute(ATTR, 'showing');
  /* Start collapsed so the enter transition can run */
  void host.offsetWidth;
  host.setAttribute(ATTR, 'shown');
  if (!prefersReducedMotion()) await waitForMotion(host);
  if (host.getAttribute(ATTR) === 'shown') host.removeAttribute(ATTR);
  return true;
}

/** Run exit animation then set `hidden`. */
export async function fabHide(host: HTMLElement): Promise<boolean> {
  if (host.hasAttribute('hidden')) return true;
  host.setAttribute(ATTR, 'hiding');
  if (!prefersReducedMotion()) await waitForMotion(host);
  if (host.getAttribute(ATTR) !== 'hiding') return false;
  host.setAttribute('hidden', '');
  host.removeAttribute(ATTR);
  return true;
}

/** CSS string for hosts that use fabShow / fabHide. */
export const fabVisibilityCss = `
  :host {
    transition:
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      visibility var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }
  :host([data-visibility='showing']) {
    opacity: 0;
    transform: scale(0.8);
    visibility: hidden;
  }
  :host([data-visibility='shown']) {
    opacity: 1;
    transform: scale(1);
    visibility: visible;
  }
  :host([data-visibility='hiding']) {
    opacity: 0;
    transform: scale(0.8);
    visibility: hidden;
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`;

/** Peers concealed by an open fab-menu expansion zone. */
const MENU_PEER_SEL = [
  'k3-fab',
  'k3-extended-fab',
  'k3-scroll-to-top',
  'k3-button',
  'k3-icon-button',
  'k3-fab-dial[fixed]',
  'k3-fab-rail[fixed]',
].join(',');

/** Floating chrome concealed by a modal sheet / dialog surface. */
const OVERLAY_PEER_SEL = [
  'k3-fab',
  'k3-extended-fab',
  'k3-fab-menu',
  'k3-fab-dial[fixed]',
  'k3-fab-rail[fixed]',
  'k3-scroll-to-top',
].join(',');

const MENU_CONCEAL_ATTR = 'data-k3-fab-menu-concealed';
const OVERLAY_CONCEAL_ATTR = 'data-k3-overlay-concealed';

function rectsIntersect(a: DOMRectReadOnly, b: DOMRectReadOnly, pad = 0): boolean {
  return !(
    a.right + pad < b.left ||
    a.left - pad > b.right ||
    a.bottom + pad < b.top ||
    a.top - pad > b.bottom
  );
}

/**
 * Axis-aligned zone of a fab-menu expansion (trigger + pill column).
 * `side` = menu above or below the FAB; pills grow toward the reading start.
 */
export function fabMenuExpansionZone(
  trigger: DOMRectReadOnly,
  opts: {
    side: 'above' | 'below';
    menuHeightPx: number;
    menuWidthPx: number;
    gapPx: number;
    trailingRight: boolean;
  },
): DOMRect {
  const { side, menuHeightPx, menuWidthPx, gapPx, trailingRight } = opts;
  const width = Math.max(trigger.width, menuWidthPx);
  const left = trailingRight ? trigger.right - width : trigger.left;
  const top =
    side === 'above'
      ? trigger.top - gapPx - menuHeightPx
      : trigger.bottom + gapPx;
  const height = menuHeightPx + gapPx + trigger.height;
  const zoneTop = side === 'above' ? top : trigger.top;
  return new DOMRect(left, zoneTop, width, height);
}

export type ConcealedPeer = {
  el: HTMLElement;
  restore: () => void | Promise<void>;
};

function isMenuOpenCloseHost(el: HTMLElement): boolean {
  const n = el.localName;
  return n === 'k3-fab-menu' || n === 'k3-fab-dial' || n === 'k3-fab-rail';
}

/** Close open menu/dial/rail then animate visibility out. */
async function hideFloatingHost(el: HTMLElement): Promise<void> {
  const fabish = el as FabVisibilityHost;
  if (isMenuOpenCloseHost(el)) {
    if (fabish.open && typeof fabish.hide === 'function') await fabish.hide('auto');
    await fabHide(el);
    return;
  }
  if (typeof fabish.hide === 'function') {
    await fabish.hide();
    return;
  }
  await fabHide(el);
}

async function showFloatingHost(el: HTMLElement): Promise<void> {
  const fabish = el as FabVisibilityHost;
  if (isMenuOpenCloseHost(el)) {
    await fabShow(el);
    return;
  }
  if (typeof fabish.show === 'function') {
    await fabish.show();
    return;
  }
  await fabShow(el);
}

function stillConcealed(el: HTMLElement, except: string): boolean {
  if (except !== MENU_CONCEAL_ATTR && el.hasAttribute(MENU_CONCEAL_ATTR)) return true;
  if (except !== OVERLAY_CONCEAL_ATTR && el.hasAttribute(OVERLAY_CONCEAL_ATTR)) return true;
  return false;
}

/** Hide floating peers that intersect the expansion zone (not the menu host). */
export function concealPeersInZone(
  menuHost: HTMLElement,
  zone: DOMRectReadOnly,
): ConcealedPeer[] {
  const out: ConcealedPeer[] = [];
  const nodes = document.querySelectorAll(MENU_PEER_SEL);
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node === menuHost || menuHost.contains(node)) return;
    if (node.closest('k3-fab-menu') === menuHost) return;
    const r = node.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (!rectsIntersect(zone, r, 8)) return;
    if (node.hasAttribute(MENU_CONCEAL_ATTR)) return;

    node.setAttribute(MENU_CONCEAL_ATTR, '');
    void hideFloatingHost(node);
    out.push({
      el: node,
      restore: () => {
        node.removeAttribute(MENU_CONCEAL_ATTR);
        if (stillConcealed(node, MENU_CONCEAL_ATTR)) return;
        void showFloatingHost(node);
      },
    });
  });
  return out;
}

/**
 * Hide FABs / fab-menus / scroll-to-top that intersect a modal sheet or dialog
 * surface. Skips chrome that lives inside the overlay host.
 */
export function concealFloatingInOverlayZones(
  overlays: Array<{ host: HTMLElement; zone: DOMRectReadOnly }>,
): ConcealedPeer[] {
  const out: ConcealedPeer[] = [];
  const seen = new Set<HTMLElement>();
  if (!overlays.length) return out;

  const nodes = document.querySelectorAll(OVERLAY_PEER_SEL);
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (seen.has(node)) return;
    if (node.hasAttribute(OVERLAY_CONCEAL_ATTR)) return;

    let hit = false;
    for (const { host, zone } of overlays) {
      if (node === host || host.contains(node)) continue;
      const r = node.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (rectsIntersect(zone, r, 8)) {
        hit = true;
        break;
      }
    }
    if (!hit) return;

    seen.add(node);
    node.setAttribute(OVERLAY_CONCEAL_ATTR, '');
    void hideFloatingHost(node);
    out.push({
      el: node,
      restore: () => {
        node.removeAttribute(OVERLAY_CONCEAL_ATTR);
        if (stillConcealed(node, OVERLAY_CONCEAL_ATTR)) return;
        void showFloatingHost(node);
      },
    });
  });
  return out;
}

export function restoreConcealedPeers(peers: ConcealedPeer[]): void {
  for (const p of peers) {
    try {
      void p.restore();
    } catch {
      /* peer may have been disconnected */
    }
  }
  peers.length = 0;
}

export {
  MENU_CONCEAL_ATTR as FAB_MENU_CONCEAL_ATTR,
  OVERLAY_CONCEAL_ATTR as FAB_OVERLAY_CONCEAL_ATTR,
};
