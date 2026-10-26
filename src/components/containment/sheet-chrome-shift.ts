/**
 * Modal sheet ↔ floating chrome (FAB · FAB menu · dial · rail · scroll-to-top).
 *
 * M3 FAB guidelines: on major layout changes the FAB should **disappear** and
 * **reappear** when the new surface settles — not sit under a modal sheet.
 * We toggle `data-k3-sheet-chrome-hidden` on `<html>` while any modal sheet is
 * open; global / component CSS fades chrome out and restores it on close.
 *
 * Nav bar clearance (compact): consumers set
 * `--k3-nav-chrome-inset-block-end` (e.g. 4rem) so fixed chrome sits above
 * the bar — independent of sheet hide/show.
 */

export type SheetChromeHost = HTMLElement & {
  modal?: boolean;
  isSheetVisible?: () => boolean;
};

const hosts = new Set<SheetChromeHost>();

const HIDDEN_ATTR = 'data-k3-sheet-chrome-hidden';

function isVisible(host: SheetChromeHost): boolean {
  if (typeof host.isSheetVisible === 'function') return host.isSheetVisible();
  return host.hasAttribute('open');
}

/** Hide floating chrome while any registered modal sheet is visible. */
export function recomputeSheetChromeShift(): void {
  if (typeof document === 'undefined') return;
  let hide = false;
  for (const host of hosts) {
    if (!host.modal) continue;
    if (!isVisible(host)) continue;
    hide = true;
    break;
  }
  document.documentElement.toggleAttribute(HIDDEN_ATTR, hide);
}

export function registerSheetChromeHost(host: SheetChromeHost): void {
  hosts.add(host);
}

export function unregisterSheetChromeHost(host: SheetChromeHost): void {
  hosts.delete(host);
  recomputeSheetChromeShift();
}
