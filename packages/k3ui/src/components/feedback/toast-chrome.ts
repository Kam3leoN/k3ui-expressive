/**
 * Toast clearance vs FAB menu / scroll-to-top / scrollbar.
 * Logical insets — LTR and RTL (inline-end = right in LTR, left in RTL).
 */

import {
  FLOATING_CHROME_PEER_SELECTOR,
  isBottomFloatingChrome,
  measureFloatingChromeInsetInlineEnd,
  measureFloatingChromeInsetInlineStart,
  syncFloatingChromeInsets,
} from '../../core/floating-chrome-inset.js';

const CHROME_GAP_DP = 8;

/** Classic vertical scrollbar gutter (0 when overlay / absent). */
export function measureScrollbarInlineGutter(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

/**
 * Distance from viewport bottom to the top of the tallest bottom floating peer.
 * Used when the stack must lift above chrome (e.g. bottom-center).
 */
export function measureFloatingChromeInsetBlockEnd(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  let reserved = 0;
  document.querySelectorAll(FLOATING_CHROME_PEER_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (!isBottomFloatingChrome(node, 'end') && !isBottomFloatingChrome(node, 'start')) {
      return;
    }
    const r = node.getBoundingClientRect();
    const fromBottom = vh - r.top;
    if (fromBottom > reserved) reserved = fromBottom;
  });
  return Math.max(0, Math.round(reserved));
}

export type ToastChromeInsets = {
  inlineEnd: number;
  inlineStart: number;
  blockEnd: number;
  scrollbar: number;
  gap: number;
};

/** Live insets for the toast host (chrome + scrollbar + gap). */
export function measureToastChromeInsets(): ToastChromeInsets {
  syncFloatingChromeInsets();
  const gap = CHROME_GAP_DP;
  const scrollbar = measureScrollbarInlineGutter();
  const chromeEnd = measureFloatingChromeInsetInlineEnd();
  const chromeStart = measureFloatingChromeInsetInlineStart();
  const block = measureFloatingChromeInsetBlockEnd();
  return {
    /* Chrome occupies the corner → toast sits inward + gap; scrollbar on that edge too */
    inlineEnd: (chromeEnd > 0 ? chromeEnd + gap : 0) + scrollbar,
    inlineStart: (chromeStart > 0 ? chromeStart + gap : 0) + scrollbar,
    blockEnd: block > 0 ? block + gap : 0,
    scrollbar,
    gap,
  };
}

/** Apply measured insets as CSS vars on the toast host. */
export function applyToastChromeInsets(host: HTMLElement): ToastChromeInsets {
  const m = measureToastChromeInsets();
  host.style.setProperty('--k3-toast-chrome-inset-inline-end', `${m.inlineEnd}px`);
  host.style.setProperty('--k3-toast-chrome-inset-inline-start', `${m.inlineStart}px`);
  host.style.setProperty('--k3-toast-chrome-inset-block-end', `${m.blockEnd}px`);
  host.style.setProperty('--k3-toast-scrollbar-inline', `${m.scrollbar}px`);
  return m;
}

/**
 * Keep a toast host clear of FAB / STT / scrollbar (LTR + RTL).
 * Returns a disconnect fn.
 */
export function observeToastChrome(host: HTMLElement): () => void {
  let raf = 0;
  const schedule = (): void => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      applyToastChromeInsets(host);
    });
  };

  applyToastChromeInsets(host);

  const ro =
    typeof ResizeObserver === 'function' ? new ResizeObserver(() => schedule()) : null;
  const mo =
    typeof MutationObserver === 'function'
      ? new MutationObserver(() => schedule())
      : null;

  const watchPeers = (): void => {
    document.querySelectorAll(FLOATING_CHROME_PEER_SELECTOR).forEach((node) => {
      if (node instanceof HTMLElement) ro?.observe(node);
    });
  };
  watchPeers();

  mo?.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'hidden',
      'fixed',
      'placement',
      'position',
      'data-visible',
      'data-visibility',
      'data-k3-overlay-concealed',
      'data-k3-fab-menu-concealed',
      'style',
      'class',
      'size',
      'dir',
    ],
  });

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true, capture: true });

  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    ro?.disconnect();
    mo?.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule, true);
  };
}
