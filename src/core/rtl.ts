/**
 * Reading direction — shared by menus, sheets, chips, tabs, FAB menu.
 */

/** True when `el` (or the document) is laid out RTL. */
export function isRtl(el?: Element | null): boolean {
  if (el) {
    try {
      if (getComputedStyle(el).direction === 'rtl') return true;
    } catch {
      /* detached / non-styled */
    }
  }
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('dir') === 'rtl';
}