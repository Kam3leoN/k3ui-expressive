/**
 * Bottom floating chrome → logical end/start insets.
 *
 * Sticky audio (and similar) shorten `inset-inline-end` / `inset-inline-start`
 * so they never paint over FAB / extended FAB / FAB menu / scroll-to-top on the
 * same edge — works LTR (end=right) and RTL (end=left), and for chrome on either
 * bottom corner.
 *
 * Values = px from the viewport edge to the content-facing edge of the
 * outermost visible peer on that side.
 */

export const FLOATING_CHROME_INSET_INLINE_END_VAR =
  '--k3-floating-chrome-inset-inline-end';
export const FLOATING_CHROME_INSET_INLINE_START_VAR =
  '--k3-floating-chrome-inset-inline-start';

/** Peers that may occupy a bottom corner. */
export const FLOATING_CHROME_PEER_SELECTOR = [
  'k3-fab-menu[fixed]',
  'k3-fab-dial[fixed]',
  'k3-fab-rail[fixed]',
  'k3-scroll-to-top[data-visible]',
  'k3-fab',
  'k3-extended-fab',
].join(',');

const BOTTOM_BAND_PX = 160;
const SIDE_BAND_PX = 280;

export type FloatingChromeSide = 'start' | 'end';

function isRtlDocument(root: HTMLElement = document.documentElement): boolean {
  return (root.getAttribute('dir') || document.dir || 'ltr').toLowerCase() === 'rtl';
}

/** Declared placement/position → preferred side, or null if top / unknown. */
function declaredSide(el: HTMLElement): FloatingChromeSide | null {
  const placement = (el.getAttribute('placement') || '').toLowerCase();
  const position = (el.getAttribute('position') || '').toLowerCase();
  if (placement.startsWith('top') || position.startsWith('top')) return null;
  if (placement.endsWith('start') || position.endsWith('left') || position.includes('start')) {
    return 'start';
  }
  if (placement.endsWith('end') || position.endsWith('right') || position.includes('end')) {
    return 'end';
  }
  /* Default M3 floating chrome = bottom-end */
  if (!placement && !position) return 'end';
  if (placement.startsWith('bottom') || position.startsWith('bottom')) return 'end';
  return null;
}

function isPaintedFixed(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden')) return false;
  if (el.hasAttribute('data-k3-overlay-concealed')) return false;
  if (el.hasAttribute('data-k3-fab-menu-concealed')) return false;
  const cs = getComputedStyle(el);
  if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const opacity = parseFloat(cs.opacity || '1');
  if (Number.isFinite(opacity) && opacity < 0.05) return false;
  const r = el.getBoundingClientRect();
  return r.width >= 1 && r.height >= 1;
}

function isInBottomBand(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return vh - r.bottom <= BOTTOM_BAND_PX;
}

/** Infer side from geometry when attrs are ambiguous. */
function geometricSide(el: HTMLElement): FloatingChromeSide | null {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const rtl = isRtlDocument();
  const distEnd = rtl ? r.left : vw - r.right;
  const distStart = rtl ? vw - r.right : r.left;
  if (distEnd <= SIDE_BAND_PX && distEnd <= distStart) return 'end';
  if (distStart <= SIDE_BAND_PX && distStart < distEnd) return 'start';
  return null;
}

/**
 * True when the host is fixed/sticky bottom chrome on `side`
 * (`end` = inline-end · `start` = inline-start).
 */
export function isBottomFloatingChrome(
  el: HTMLElement,
  side: FloatingChromeSide = 'end',
): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.localName === 'k3-audio-player') return false;
  if (!isPaintedFixed(el) || !isInBottomBand(el)) return false;

  const declared = declaredSide(el);
  if (declared === null && (el.getAttribute('placement') || el.getAttribute('position'))) {
    return false; /* top-* */
  }
  const resolved = declared ?? geometricSide(el);
  return resolved === side;
}

/** @deprecated Prefer `isBottomFloatingChrome(el, 'end')`. */
export function isBottomEndFloatingChrome(el: HTMLElement): boolean {
  return isBottomFloatingChrome(el, 'end');
}

function measureSide(side: FloatingChromeSide): number {
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const rtl = isRtlDocument();
  let reserved = 0;

  document.querySelectorAll(FLOATING_CHROME_PEER_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (!isBottomFloatingChrome(node, side)) return;
    const r = node.getBoundingClientRect();
    let fromEdge = 0;
    if (side === 'end') {
      fromEdge = rtl ? r.right : vw - r.left;
    } else {
      fromEdge = rtl ? vw - r.left : r.right;
    }
    if (fromEdge > reserved) reserved = fromEdge;
  });

  return Math.max(0, Math.round(reserved));
}

/** Measure reserved inline-end space (px). */
export function measureFloatingChromeInsetInlineEnd(): number {
  return measureSide('end');
}

/** Measure reserved inline-start space (px) — bottom-start FAB / STT. */
export function measureFloatingChromeInsetInlineStart(): number {
  return measureSide('start');
}

/** Write both floating-chrome inset vars on `root` (default `<html>`). */
export function syncFloatingChromeInsetInlineEnd(
  root: HTMLElement = document.documentElement,
): number {
  const endPx = measureFloatingChromeInsetInlineEnd();
  const startPx = measureFloatingChromeInsetInlineStart();
  root.style.setProperty(FLOATING_CHROME_INSET_INLINE_END_VAR, `${endPx}px`);
  root.style.setProperty(FLOATING_CHROME_INSET_INLINE_START_VAR, `${startPx}px`);
  return endPx;
}

/** Alias — syncs start + end. */
export function syncFloatingChromeInsets(
  root: HTMLElement = document.documentElement,
): { start: number; end: number } {
  const end = measureFloatingChromeInsetInlineEnd();
  const start = measureFloatingChromeInsetInlineStart();
  root.style.setProperty(FLOATING_CHROME_INSET_INLINE_END_VAR, `${end}px`);
  root.style.setProperty(FLOATING_CHROME_INSET_INLINE_START_VAR, `${start}px`);
  return { start, end };
}

export type FloatingChromeInsetObserver = {
  /** Force a remeasure now. */
  sync: () => number;
  /** Stop observing. */
  disconnect: () => void;
};

/**
 * Keep the CSS vars in sync with peer show/hide / resize.
 * Call from sticky audio dock or the app shell.
 */
export function observeFloatingChromeInset(
  root: HTMLElement = document.documentElement,
): FloatingChromeInsetObserver {
  let raf = 0;
  const schedule = (): void => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      syncFloatingChromeInsets(root);
    });
  };

  const sync = (): number => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    return syncFloatingChromeInsetInlineEnd(root);
  };

  sync();

  const ro =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => schedule())
      : null;
  const mo =
    typeof MutationObserver === 'function'
      ? new MutationObserver(() => schedule())
      : null;

  const watchPeers = (): void => {
    document.querySelectorAll(FLOATING_CHROME_PEER_SELECTOR).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      ro?.observe(node);
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

  return {
    sync,
    disconnect: () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    },
  };
}
