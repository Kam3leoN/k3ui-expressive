/**
 * Modal sheet / dialog ↔ floating chrome (FAB · FAB menu · dial · rail · scroll-to-top).
 *
 * M3 FAB guidelines: on major layout changes the FAB should **disappear** and
 * **reappear** when the new surface settles. We:
 * 1. Toggle `data-k3-sheet-chrome-hidden` on `<html>` (sticky audio, legacy CSS).
 * 2. Conceal only FABs that **intersect the sheet/dialog panel trajectory**
 *    via show/hide (fab-visibility) — never nav-rail / nav-bar chrome.
 *
 * Call `markSheetChromeOpening` **before** the sheet enter animation so chrome
 * on the path starts fading during elevate/paint — no extra delay on open.
 *
 * Nav bar clearance (compact): consumers set
 * `--k3-nav-chrome-inset-block-end` (e.g. 4rem) so fixed chrome sits above
 * the bar — independent of sheet hide/show.
 */

import {
  concealFloatingInOverlayZones,
  overlayPeerHitsZone,
  restoreConcealedPeers,
  type ConcealedPeer,
} from '../actions/fab-visibility.js';

export type SheetChromeHost = HTMLElement & {
  modal?: boolean;
  isSheetVisible?: () => boolean;
  /** Settled panel bounds (sheet / dialog surface). */
  getOverlayZone?: () => DOMRectReadOnly | null;
  /**
   * Projected bounds while opening (before panel paint) — placement trajectory
   * only (not the full viewport).
   */
  getOpeningOverlayZone?: () => DOMRectReadOnly | null;
};

const hosts = new Set<SheetChromeHost>();

/** Hosts whose enter animation has not settled yet — hide chrome early. */
const openingHosts = new Set<SheetChromeHost>();

const HIDDEN_ATTR = 'data-k3-sheet-chrome-hidden';

let concealedPeers: ConcealedPeer[] = [];

function isVisible(host: SheetChromeHost): boolean {
  if (typeof host.isSheetVisible === 'function') return host.isSheetVisible();
  return host.hasAttribute('open');
}

function isActive(host: SheetChromeHost): boolean {
  return isVisible(host) || openingHosts.has(host);
}

function resolveZone(host: SheetChromeHost): DOMRectReadOnly | null {
  if (typeof host.getOverlayZone === 'function') {
    const z = host.getOverlayZone();
    if (z && z.width >= 1 && z.height >= 1) return z;
  }
  /* Opening: panel not painted — placement trajectory only (never host/viewport). */
  if (openingHosts.has(host) && typeof host.getOpeningOverlayZone === 'function') {
    const z = host.getOpeningOverlayZone();
    if (z && z.width >= 1 && z.height >= 1) return z;
  }
  /* No host.getBoundingClientRect fallback — elevated hosts often span the
   * viewport and would conceal nav-rail FABs far from the panel path. */
  return null;
}

/**
 * Start floating-chrome hide **before** sheet/dialog enter.
 * Fire-and-forget (fab show/hide animations run in parallel — do not await).
 */
export function markSheetChromeOpening(host: SheetChromeHost): void {
  if (!host.modal) return;
  openingHosts.add(host);
  recomputeSheetChromeShift();
}

/** Drop opening mark once enter settled or host closed. */
export function clearSheetChromeOpening(host: SheetChromeHost): void {
  if (!openingHosts.has(host)) return;
  openingHosts.delete(host);
}

/** Hide floating chrome while any registered modal sheet/dialog is active. */
export function recomputeSheetChromeShift(): void {
  if (typeof document === 'undefined') return;

  const overlays: Array<{ host: HTMLElement; zone: DOMRectReadOnly }> = [];
  let hide = false;

  for (const host of hosts) {
    if (!host.modal) continue;
    if (!isActive(host)) continue;
    hide = true;
    if (isVisible(host)) openingHosts.delete(host);
    if (!(host instanceof HTMLElement)) continue;
    const zone = resolveZone(host);
    if (zone) overlays.push({ host, zone });
  }

  document.documentElement.toggleAttribute(HIDDEN_ATTR, hide);

  if (!hide) {
    restoreConcealedPeers(concealedPeers);
    return;
  }

  /* Drop peers that no longer sit on any overlay trajectory (e.g. rail FAB). */
  const kept: ConcealedPeer[] = [];
  for (const p of concealedPeers) {
    if (overlayPeerHitsZone(p.el, overlays)) {
      kept.push(p);
    } else {
      try {
        void p.restore();
      } catch {
        /* peer may have been disconnected */
      }
    }
  }
  concealedPeers = kept;

  const added = concealFloatingInOverlayZones(overlays);
  if (!added.length) return;
  const seen = new Set(concealedPeers.map((p) => p.el));
  for (const p of added) {
    if (seen.has(p.el)) continue;
    seen.add(p.el);
    concealedPeers.push(p);
  }
}

export function registerSheetChromeHost(host: SheetChromeHost): void {
  hosts.add(host);
}

export function unregisterSheetChromeHost(host: SheetChromeHost): void {
  hosts.delete(host);
  openingHosts.delete(host);
  recomputeSheetChromeShift();
}
