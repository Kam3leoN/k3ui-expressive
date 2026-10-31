/**
 * Modal sheet / dialog ↔ floating chrome (FAB · FAB menu · dial · rail · scroll-to-top).
 *
 * M3 FAB guidelines: on major layout changes the FAB should **disappear** and
 * **reappear** when the new surface settles. We:
 * 1. Toggle `data-k3-sheet-chrome-hidden` on `<html>` (sticky audio, legacy CSS).
 * 2. Conceal FABs that **intersect** any visible modal sheet/dialog surface
 *    via show/hide (fab-visibility) — including `k3-fab-menu`.
 *
 * Nav bar clearance (compact): consumers set
 * `--k3-nav-chrome-inset-block-end` (e.g. 4rem) so fixed chrome sits above
 * the bar — independent of sheet hide/show.
 */

import {
  concealFloatingInOverlayZones,
  restoreConcealedPeers,
  type ConcealedPeer,
} from '../actions/fab-visibility.js';

export type SheetChromeHost = HTMLElement & {
  modal?: boolean;
  isSheetVisible?: () => boolean;
  /** Surface rect used for perimeter conceal (sheet panel / dialog panel). */
  getOverlayZone?: () => DOMRectReadOnly | null;
};

const hosts = new Set<SheetChromeHost>();

const HIDDEN_ATTR = 'data-k3-sheet-chrome-hidden';

let concealedPeers: ConcealedPeer[] = [];

function isVisible(host: SheetChromeHost): boolean {
  if (typeof host.isSheetVisible === 'function') return host.isSheetVisible();
  return host.hasAttribute('open');
}

function resolveZone(host: SheetChromeHost): DOMRectReadOnly | null {
  if (typeof host.getOverlayZone === 'function') {
    const z = host.getOverlayZone();
    if (z && z.width >= 1 && z.height >= 1) return z;
  }
  if (host instanceof HTMLElement) {
    const r = host.getBoundingClientRect();
    if (r.width >= 1 && r.height >= 1) return r;
  }
  return null;
}

/** Hide floating chrome while any registered modal sheet/dialog is visible. */
export function recomputeSheetChromeShift(): void {
  if (typeof document === 'undefined') return;

  restoreConcealedPeers(concealedPeers);

  const overlays: Array<{ host: HTMLElement; zone: DOMRectReadOnly }> = [];
  let hide = false;

  for (const host of hosts) {
    if (!host.modal) continue;
    if (!isVisible(host)) continue;
    hide = true;
    if (!(host instanceof HTMLElement)) continue;
    const zone = resolveZone(host);
    if (zone) overlays.push({ host, zone });
  }

  document.documentElement.toggleAttribute(HIDDEN_ATTR, hide);
  concealedPeers = concealFloatingInOverlayZones(overlays);
}

export function registerSheetChromeHost(host: SheetChromeHost): void {
  hosts.add(host);
}

export function unregisterSheetChromeHost(host: SheetChromeHost): void {
  hosts.delete(host);
  recomputeSheetChromeShift();
}
