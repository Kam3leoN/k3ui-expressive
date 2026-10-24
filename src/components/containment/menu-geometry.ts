/**
 * Shared geometry for menu panel fit + submenu flyouts.
 * Layout-box helpers avoid transform-skewed getBoundingClientRect.
 */

/** Viewport edge margin (dp). */
export const MENU_EDGE = 8;
/** Gap between trigger and panel (dp) — matches CSS 0.25rem. */
export const MENU_GAP = 4;
/** Submenu overlap onto parent surface (dp). */
export const MENU_SUBMENU_OVERLAP = 4;
export const MENU_MIN_W = 112;
export const MENU_MIN_H = 48;

export type FlyoutOrigin = 'start' | 'end';

export interface ContentSize {
  w: number;
  h: number;
}

export interface FlyoutPlace {
  left: string;
  right: string;
  top: string;
  origin: FlyoutOrigin;
  zIndex: number;
}

/**
 * Viewport rect using layout size (offset*) when a CSS transform has skewed
 * getBoundingClientRect — keeps submenu anchors flush to the parent.
 */
export function layoutBoundingRect(el: HTMLElement): DOMRect {
  const visual = el.getBoundingClientRect();
  const lw = el.offsetWidth;
  const lh = el.offsetHeight;
  if (lw < 1 || lh < 1) return visual;
  if (Math.abs(visual.width - lw) < 0.5 && Math.abs(visual.height - lh) < 0.5) {
    return visual;
  }
  const style = getComputedStyle(el);
  const parts = style.transformOrigin.split(/\s+/);
  const oxRaw = parts[0] ?? '50%';
  const oyRaw = parts[1] ?? '50%';
  const ox = oxRaw.endsWith('%')
    ? (lw * parseFloat(oxRaw)) / 100
    : parseFloat(oxRaw) || 0;
  const oy = oyRaw.endsWith('%')
    ? (lh * parseFloat(oyRaw)) / 100
    : parseFloat(oyRaw) || 0;
  const sx = visual.width / lw;
  const sy = visual.height / lh;
  const originX = visual.left + ox * sx;
  const originY = visual.top + oy * sy;
  return new DOMRect(originX - ox, originY - oy, lw, lh);
}

/** Stable content size — prefer laid-out / children over first-paint 0. */
export function measureContentBox(
  el: HTMLElement,
  mins: ContentSize = { w: MENU_MIN_W, h: MENU_MIN_H },
): ContentSize {
  void el.offsetWidth;
  let childW = 0;
  let childH = 0;
  for (const node of el.children) {
    if (!(node instanceof HTMLElement)) continue;
    childW = Math.max(childW, node.offsetWidth, node.scrollWidth);
    childH += Math.max(node.offsetHeight, node.scrollHeight);
  }
  const r = el.getBoundingClientRect();
  return {
    w: Math.max(el.offsetWidth, el.scrollWidth, r.width, childW, mins.w),
    h: Math.max(el.offsetHeight, el.scrollHeight, r.height, childH, mins.h),
  };
}

/**
 * Side flyout coords — edge-anchored to the parent so width under-measure
 * cannot open a gap (LTR grows from left · RTL from right).
 */
export function computeSubmenuFlyoutPlace(opts: {
  itemRect: DOMRect;
  panelRect: DOMRect;
  flyoutW: number;
  flyoutH: number;
  rtl: boolean;
  depth: number;
  vw?: number;
  vh?: number;
  edge?: number;
  overlap?: number;
}): FlyoutPlace {
  const edge = opts.edge ?? MENU_EDGE;
  const overlap = opts.overlap ?? MENU_SUBMENU_OVERLAP;
  const vw = opts.vw ?? window.innerWidth;
  const vh = opts.vh ?? window.innerHeight;
  const { itemRect: itemR, panelRect: panelR, flyoutW, flyoutH, rtl, depth } = opts;

  let origin: FlyoutOrigin = 'start';
  let left = '';
  let right = '';

  if (rtl) {
    const roomStart = panelR.left - edge;
    const openLeft =
      flyoutW + overlap <= roomStart || roomStart >= vw - panelR.right;
    if (openLeft) {
      right = `${Math.round(Math.max(edge, vw - panelR.left - overlap))}px`;
      left = 'auto';
      origin = 'end';
    } else {
      left = `${Math.round(panelR.right - overlap)}px`;
      right = 'auto';
      origin = 'start';
    }
  } else {
    const roomEnd = vw - panelR.right - edge;
    const openRight = flyoutW + overlap <= roomEnd || roomEnd >= panelR.left;
    if (openRight) {
      left = `${Math.round(panelR.right - overlap)}px`;
      right = 'auto';
      origin = 'start';
    } else {
      right = `${Math.round(Math.max(edge, vw - panelR.left - overlap))}px`;
      left = 'auto';
      origin = 'end';
    }
  }

  let top = itemR.top;
  if (top + flyoutH > vh - edge) top = Math.max(edge, vh - edge - flyoutH);
  if (top < edge) top = edge;

  return {
    left,
    right,
    top: `${Math.round(top)}px`,
    origin,
    zIndex: 70 + depth,
  };
}

/** Apply place to a flyout. Returns false if already placed with same coords. */
export function applyFlyoutPlace(
  flyout: HTMLElement,
  place: FlyoutPlace,
  reveal: boolean,
): boolean {
  const placed = flyout.hasAttribute('data-placed');
  if (
    placed &&
    flyout.style.left === place.left &&
    flyout.style.right === place.right &&
    flyout.style.top === place.top
  ) {
    return false;
  }
  flyout.style.left = place.left;
  flyout.style.right = place.right;
  flyout.style.top = place.top;
  flyout.style.zIndex = String(place.zIndex);
  flyout.dataset.origin = place.origin;
  if (reveal) flyout.setAttribute('data-placed', '');
  return true;
}

/** Clear imperative flyout placement styles. */
export function clearFlyoutPlace(flyout: HTMLElement): void {
  flyout.removeAttribute('data-placed');
  flyout.removeAttribute('data-origin');
  flyout.style.top = '';
  flyout.style.left = '';
  flyout.style.right = '';
  flyout.style.zIndex = '';
}
