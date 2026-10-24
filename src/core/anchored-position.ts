/**
 * Anchored surface placement — docked vertical + inline start/end.
 * Source of truth for menu vertical dock and picker docked popovers.
 */

import {
  ANCHOR_GAP,
  VIEWPORT_EDGE,
  MENU_MIN_H,
  layoutBoundingRect,
} from './geometry.js';

export interface VerticalDockResult {
  top: number;
  above: boolean;
  /** Cap panel height; `null` clears maxHeight. */
  maxHeight: number | null;
}

export interface DockedPositionResult {
  top: number;
  left: number;
  flip: 'top' | 'bottom';
  maxHeight: number | null;
}

export interface VerticalDockOpts {
  gap?: number;
  edge?: number;
  minH?: number;
}

/**
 * Vertical dock — keep the panel glued to the trigger.
 * Cap `maxHeight` on overflow instead of clamping `top` alone.
 */
export function placeVerticalDocked(
  tr: DOMRectReadOnly,
  ph: number,
  vh: number,
  preferAbove: boolean,
  opts: VerticalDockOpts = {},
): VerticalDockResult {
  const gap = opts.gap ?? ANCHOR_GAP;
  const edge = opts.edge ?? VIEWPORT_EDGE;
  const minH = opts.minH ?? MENU_MIN_H;
  const spaceAbove = tr.top - gap - edge;
  const spaceBelow = vh - tr.bottom - gap - edge;
  let above = preferAbove;
  if (above && ph > spaceAbove && spaceBelow > spaceAbove) above = false;
  if (!above && ph > spaceBelow && spaceAbove > spaceBelow) above = true;

  if (above) {
    const dockBottom = tr.top - gap;
    let top = dockBottom - ph;
    if (top < edge) {
      return {
        top: edge,
        above: true,
        maxHeight: Math.max(minH, dockBottom - edge),
      };
    }
    return { top: Math.round(top), above: true, maxHeight: null };
  }

  const top = tr.bottom + gap;
  if (top + ph > vh - edge) {
    return {
      top: Math.round(top),
      above: false,
      maxHeight: Math.max(minH, vh - edge - top),
    };
  }
  return { top: Math.round(top), above: false, maxHeight: null };
}

/** Apply vertical dock result onto a panel (`top` + optional `maxHeight`). */
export function applyVerticalDockStyles(
  panel: HTMLElement,
  result: VerticalDockResult,
): void {
  if (result.maxHeight != null) {
    panel.style.maxHeight = `${Math.round(result.maxHeight)}px`;
  } else {
    panel.style.maxHeight = '';
  }
}

/**
 * Inline placement for above/below surfaces.
 * End-align anchors via `right` (LTR) so under-measured width grows left.
 */
export function placeInlineStartEnd(
  panel: HTMLElement,
  tr: DOMRectReadOnly,
  pw: number,
  vw: number,
  rtl: boolean,
  preferEnd: boolean,
  edge: number = VIEWPORT_EDGE,
): number {
  const roomEnd = rtl ? vw - edge - tr.left : tr.right - edge;
  const roomStart = rtl ? tr.right - edge : vw - edge - tr.left;

  let useEnd = preferEnd;
  if (preferEnd && pw > roomEnd && roomStart > roomEnd) useEnd = false;
  if (!preferEnd && pw > roomStart && roomEnd > roomStart) useEnd = true;

  if (!rtl) {
    if (useEnd) {
      const rightPx = Math.max(edge, vw - tr.right);
      if (tr.right - pw < edge) {
        panel.style.left = `${edge}px`;
        panel.style.right = 'auto';
        return edge;
      }
      panel.style.left = 'auto';
      panel.style.right = `${Math.round(rightPx)}px`;
      return Math.round(vw - rightPx - pw);
    }
    const left = Math.min(Math.max(edge, tr.left), Math.max(edge, vw - edge - pw));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.right = 'auto';
    return Math.round(left);
  }

  if (useEnd) {
    const leftPx = Math.max(edge, tr.left);
    if (tr.left + pw > vw - edge) {
      panel.style.left = 'auto';
      panel.style.right = `${edge}px`;
      return Math.round(vw - edge - pw);
    }
    panel.style.left = `${Math.round(leftPx)}px`;
    panel.style.right = 'auto';
    return Math.round(leftPx);
  }
  const rightPx = Math.max(edge, vw - tr.right);
  if (tr.right - pw >= edge) {
    panel.style.left = 'auto';
    panel.style.right = `${Math.round(rightPx)}px`;
    return Math.round(vw - rightPx - pw);
  }
  const left = Math.min(Math.max(edge, tr.right - pw), Math.max(edge, vw - edge - pw));
  panel.style.left = `${Math.round(left)}px`;
  panel.style.right = 'auto';
  return Math.round(left);
}

/**
 * Docked popover coords for pickers — vertical dock + horizontal clamp to anchor.
 * Prefer below; flip above when space is tight. Does not detach from the anchor.
 */
export function computeDockedPosition(
  anchor: DOMRectReadOnly,
  panel: { width: number; height: number },
  viewport: { width: number; height: number } = {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  },
  gap = 8,
  margin = 8,
): DockedPositionResult {
  const vh = viewport.height;
  const vw = viewport.width;
  const h = Math.min(panel.height || 420, vh - margin * 2);
  const w = Math.min(panel.width || 364, vw - margin * 2);

  const vertical = placeVerticalDocked(anchor, h, vh, false, {
    gap,
    edge: margin,
    minH: 48,
  });

  let left = Math.max(margin, anchor.left);
  if (left + w > vw - margin) {
    left = Math.max(margin, vw - w - margin);
  }
  if (anchor.right - w >= margin && anchor.left + w > vw - margin) {
    left = Math.max(margin, anchor.right - w);
  }

  return {
    top: vertical.top,
    left: Math.round(left),
    flip: vertical.above ? 'top' : 'bottom',
    maxHeight: vertical.maxHeight,
  };
}

/** Apply docked CSS vars + flip on the host (`--k3-tp-top` / `--k3-tp-left`). */
export function applyDockedPosition(
  host: HTMLElement,
  anchorEl: HTMLElement,
): DockedPositionResult {
  const result = computeDockedPosition(layoutBoundingRect(anchorEl), {
    width: host.offsetWidth,
    height: host.offsetHeight,
  });
  host.dataset.flip = result.flip;
  host.style.setProperty('--k3-tp-top', `${result.top}px`);
  host.style.setProperty('--k3-tp-left', `${result.left}px`);
  if (result.maxHeight != null) {
    host.style.maxHeight = `${Math.round(result.maxHeight)}px`;
  } else {
    host.style.maxHeight = '';
  }
  return result;
}