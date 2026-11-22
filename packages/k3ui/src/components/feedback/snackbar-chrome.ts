import { resolveCssLengthPx, rootRemPx } from '../../core/css-length.js';

/**
 * Compute bottom inset (px) so the snackbar sits above FAB / bottom bar.
 * Returns `null` when the CSS default (`1rem` / safe-area) should apply.
 */
export function computeChromeInsetBottomPx(enabled: boolean): number | null {
  if (!enabled || typeof document === 'undefined') return null;

  const root = getComputedStyle(document.documentElement);
  const base = resolveCssLengthPx(root.getPropertyValue('--k3-snackbar-inset'), rootRemPx());
  let bottom = base;

  const bar = document.querySelector(
    'k3-bottom-app-bar:not([hidden]), k3-nav-bar:not([hidden])',
  ) as HTMLElement | null;
  const fab = document.querySelector(
    'k3-fab:not([hidden]), k3-extended-fab:not([hidden])',
  ) as HTMLElement | null;

  const bump = (el: HTMLElement | null): void => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.height <= 0 || r.width <= 0) return;
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const gap = window.innerHeight - r.top + base;
    if (gap > bottom) bottom = gap;
  };

  bump(bar);
  if (!bar) bump(fab);

  /* Only override when chrome needs a larger inset than the CSS floor */
  return bottom > base + 0.5 ? Math.round(bottom) : null;
}

/** Apply or clear `--k3-snackbar-inset-bottom` on a host. */
export function applyChromeInset(host: HTMLElement, enabled: boolean): void {
  const px = computeChromeInsetBottomPx(enabled);
  if (px == null) {
    host.style.removeProperty('--k3-snackbar-inset-bottom');
  } else {
    host.style.setProperty('--k3-snackbar-inset-bottom', `${px}px`);
  }
}
