/**
 * Modal overlay stack — shared by `k3-dialog` and modal `k3-sheet`.
 *
 * - **Escape**: only the top-most overlay closes. Inner widgets (menu, select,
 *   autocomplete, tooltip…) that consume Escape call `preventDefault()`; the
 *   overlay then ignores that key press (existing K3UI convention).
 * - **Scroll lock** (opt-in, `K3UI.init({ overlays: { scrollLock: true } })`):
 *   ref-counted `overflow: hidden` on `<html>` while ≥ 1 modal is open, with
 *   `scrollbar-gutter: stable` so the layout does not shift.
 */

export interface OverlayEntry {
  /** Element registered as an open modal overlay. */
  readonly host: HTMLElement;
  /** Close request when Escape reaches this overlay while it is top-most. */
  readonly onEscape: () => void;
}

const stack: OverlayEntry[] = [];
let scrollLockEnabled = false;
let lockedStyle: { overflow: string; gutter: string } | null = null;

function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
  const top = stack[stack.length - 1];
  if (!top) return;
  e.preventDefault();
  top.onEscape();
}

function syncListener(): void {
  if (typeof document === 'undefined') return;
  if (stack.length === 1) document.addEventListener('keydown', onDocumentKeydown);
  else if (stack.length === 0) document.removeEventListener('keydown', onDocumentKeydown);
}

function syncScrollLock(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const shouldLock = scrollLockEnabled && stack.length > 0;
  if (shouldLock && !lockedStyle) {
    lockedStyle = { overflow: root.style.overflow, gutter: root.style.getPropertyValue('scrollbar-gutter') };
    root.style.setProperty('scrollbar-gutter', 'stable');
    root.style.overflow = 'hidden';
    root.toggleAttribute('data-k3-scroll-locked', true);
  } else if (!shouldLock && lockedStyle) {
    root.style.overflow = lockedStyle.overflow;
    if (lockedStyle.gutter) root.style.setProperty('scrollbar-gutter', lockedStyle.gutter);
    else root.style.removeProperty('scrollbar-gutter');
    root.removeAttribute('data-k3-scroll-locked');
    lockedStyle = null;
  }
}

export const overlayStack = {
  /** Register `host` as the top-most open modal (idempotent — moves it to the top). */
  push(host: HTMLElement, onEscape: () => void): void {
    const i = stack.findIndex((e) => e.host === host);
    if (i !== -1) stack.splice(i, 1);
    stack.push({ host, onEscape });
    if (i === -1) syncListener();
    syncScrollLock();
  },

  /** Unregister `host` (no-op when absent). */
  remove(host: HTMLElement): void {
    const i = stack.findIndex((e) => e.host === host);
    if (i === -1) return;
    stack.splice(i, 1);
    syncListener();
    syncScrollLock();
  },

  /** True when `host` is the top-most open modal. */
  isTop(host: HTMLElement): boolean {
    return stack[stack.length - 1]?.host === host;
  },

  /** Top-most modal host, or `null`. */
  topHost(): HTMLElement | null {
    return stack[stack.length - 1]?.host ?? null;
  },

  /**
   * True when opening `host` from `anchor` would sit beside an existing
   * modal scrim (anchor outside the top modal). Nested opens from inside
   * the top modal (confirm, etc.) are allowed.
   */
  wouldOpenBeside(host: HTMLElement, anchor?: HTMLElement | null): boolean {
    const top = this.topHost();
    if (!top || top === host) return false;
    if (anchor && top.contains(anchor)) return false;
    if (top.contains(host)) return false;
    return true;
  },

  /** Open modal overlays, bottom → top. */
  get size(): number {
    return stack.length;
  },

  /** Lock page scroll while a modal is open (default off — opt-in). */
  setScrollLock(enabled: boolean): void {
    scrollLockEnabled = enabled;
    syncScrollLock();
  },

  get scrollLock(): boolean {
    return scrollLockEnabled;
  },
};
