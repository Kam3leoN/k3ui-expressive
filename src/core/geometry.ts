/**
 * Layout-box geometry — avoids transform-skewed getBoundingClientRect.
 */

/** Viewport edge margin (dp). */
export const VIEWPORT_EDGE = 8;
/** Default gap between anchor and surface (dp). */
export const ANCHOR_GAP = 4;
/** Menu aliases — same values. */
export const MENU_EDGE = VIEWPORT_EDGE;
export const MENU_GAP = ANCHOR_GAP;
export const MENU_SUBMENU_OVERLAP = 4;
export const MENU_MIN_W = 112;
export const MENU_MIN_H = 48;

export interface ContentSize {
  w: number;
  h: number;
}

/**
 * Viewport rect using layout size (offset*) when a CSS transform has skewed
 * getBoundingClientRect — keeps submenu / docked anchors flush.
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