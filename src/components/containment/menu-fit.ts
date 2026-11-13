import type { MenuPosition } from './menu.types.js';
import { isSideMenuPosition } from './menu.types.js';
import {
  MENU_EDGE as EDGE,
  MENU_GAP as GAP,
  MENU_MIN_H as MIN_H,
  MENU_MIN_W as MIN_W,
  layoutBoundingRect,
  measureContentBox,
} from './menu-geometry.js';

export { layoutBoundingRect } from './menu-geometry.js';

type VPref = 'top' | 'bottom' | 'side';
type HPref = 'start' | 'end' | 'center';

function parsePosition(position: MenuPosition): { v: VPref; h: HPref } {
  switch (position) {
    case 'top':
      return { v: 'top', h: 'start' };
    case 'bottom':
      return { v: 'bottom', h: 'start' };
    case 'top-start':
      return { v: 'top', h: 'start' };
    case 'top-end':
      return { v: 'top', h: 'end' };
    case 'bottom-start':
      return { v: 'bottom', h: 'start' };
    case 'bottom-end':
      return { v: 'bottom', h: 'end' };
    case 'end-start':
      return { v: 'side', h: 'end' };
    case 'end-end':
      return { v: 'side', h: 'end' };
    case 'start-start':
      return { v: 'side', h: 'start' };
    case 'start-end':
      return { v: 'side', h: 'start' };
    default:
      return { v: 'bottom', h: 'start' };
  }
}

function sideIsEnd(position: MenuPosition): boolean {
  return position.startsWith('end');
}

function sideAlignEnd(position: MenuPosition): boolean {
  return position === 'end-end' || position === 'start-end';
}

/**
 * Panel size for fit — prefer laid-out offset sizes.
 * scrollHeight can inflate on the pre-open pass and force a false flip-above
 * (first paint too high, then a corrective jump).
 */
function measurePanel(panel: HTMLElement): { w: number; h: number } {
  void panel.offsetWidth;
  const list = panel.querySelector('.list') as HTMLElement | null;
  const w = Math.max(
    MIN_W,
    panel.offsetWidth,
    panel.scrollWidth,
    list?.offsetWidth ?? 0,
    list?.scrollWidth ?? 0,
  );
  let h = Math.max(MIN_H, panel.offsetHeight, list?.offsetHeight ?? 0);
  if (h <= MIN_H) {
    const base = measureContentBox(panel, { w: MIN_W, h: MIN_H });
    const listBox = list ? measureContentBox(list, { w: 0, h: 0 }) : null;
    h = Math.max(h, base.h, listBox?.h ?? 0);
  }
  return { w, h };
}

/**
 * Inline placement for above/below menus.
 * End-align anchors via `right` (LTR) so under-measured width grows left —
 * never past the window beside an app-bar trailing control.
 */
function placeInline(
  panel: HTMLElement,
  tr: DOMRectReadOnly,
  pw: number,
  vw: number,
  rtl: boolean,
  preferEnd: boolean,
): number {
  const roomEnd = rtl ? vw - EDGE - tr.left : tr.right - EDGE;
  const roomStart = rtl ? tr.right - EDGE : vw - EDGE - tr.left;

  let useEnd = preferEnd;
  if (preferEnd && pw > roomEnd && roomStart > roomEnd) useEnd = false;
  if (!preferEnd && pw > roomStart && roomEnd > roomStart) useEnd = true;

  if (!rtl) {
    if (useEnd) {
      const rightPx = Math.max(EDGE, vw - tr.right);
      if (tr.right - pw < EDGE) {
        panel.style.left = `${EDGE}px`;
        panel.style.right = 'auto';
        return EDGE;
      }
      panel.style.left = 'auto';
      panel.style.right = `${Math.round(rightPx)}px`;
      return Math.round(vw - rightPx - pw);
    }
    const left = Math.min(Math.max(EDGE, tr.left), Math.max(EDGE, vw - EDGE - pw));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.right = 'auto';
    return Math.round(left);
  }

  if (useEnd) {
    const leftPx = Math.max(EDGE, tr.left);
    if (tr.left + pw > vw - EDGE) {
      panel.style.left = 'auto';
      panel.style.right = `${EDGE}px`;
      return Math.round(vw - EDGE - pw);
    }
    panel.style.left = `${Math.round(leftPx)}px`;
    panel.style.right = 'auto';
    return Math.round(leftPx);
  }
  const rightPx = Math.max(EDGE, vw - tr.right);
  if (tr.right - pw >= EDGE) {
    panel.style.left = 'auto';
    panel.style.right = `${Math.round(rightPx)}px`;
    return Math.round(vw - rightPx - pw);
  }
  const left = Math.min(Math.max(EDGE, tr.right - pw), Math.max(EDGE, vw - EDGE - pw));
  panel.style.left = `${Math.round(left)}px`;
  panel.style.right = 'auto';
  return Math.round(left);
}

/** Resolve a live layout rect from an element or a pre-built box. */
export function resolveFitRect(trigger: HTMLElement | DOMRectReadOnly): DOMRectReadOnly {
  return trigger instanceof HTMLElement ? layoutBoundingRect(trigger) : trigger;
}

/**
 * Synthetic 0-width rect for side menus: vertical band from `item`,
 * horizontal origin from the chrome edge (e.g. nav-rail content face).
 */
export function sideAnchorRect(
  item: DOMRectReadOnly,
  edge: DOMRectReadOnly,
  position: MenuPosition,
  rtl: boolean,
): DOMRect {
  const openEnd = sideIsEnd(position);
  const x = openEnd ? (rtl ? edge.left : edge.right) : rtl ? edge.right : edge.left;
  return new DOMRect(x, item.top, 0, item.height);
}

/**
 * Cap panel height when the preferred dock overflows the viewport.
 * Prefer maxHeight over shifting `top` alone — keeps side menus glued to the
 * trigger band (nav-rail) and avoids a gap on flip-above near the bottom.
 *
 * @param shrinkFrom When `preferredTop < EDGE`, set maxHeight from this edge
 *   (e.g. trigger bottom). Omit to only pin `top` without shrinking.
 */
function dockTopWithMaxHeight(
  panel: HTMLElement,
  preferredTop: number,
  ph: number,
  vh: number,
  shrinkFrom?: number,
): number {
  if (preferredTop < EDGE) {
    if (shrinkFrom != null) {
      panel.style.maxHeight = `${Math.round(Math.max(MIN_H, shrinkFrom - EDGE))}px`;
    } else {
      panel.style.maxHeight = '';
    }
    return EDGE;
  }
  if (preferredTop + ph > vh - EDGE) {
    panel.style.maxHeight = `${Math.round(Math.max(MIN_H, vh - EDGE - preferredTop))}px`;
  } else {
    panel.style.maxHeight = '';
  }
  return Math.round(preferredTop);
}

/** Vertical dock — keep the panel glued to the trigger. */
function placeVerticalDocked(
  panel: HTMLElement,
  tr: DOMRectReadOnly,
  ph: number,
  vh: number,
  preferAbove: boolean,
): { top: number; above: boolean } {
  const spaceAbove = tr.top - GAP - EDGE;
  const spaceBelow = vh - tr.bottom - GAP - EDGE;
  let above = preferAbove;
  if (above && ph > spaceAbove && spaceBelow > spaceAbove) above = false;
  if (!above && ph > spaceBelow && spaceAbove > spaceBelow) above = true;

  if (above) {
    const dockBottom = tr.top - GAP;
    const top = dockTopWithMaxHeight(panel, dockBottom - ph, ph, vh, dockBottom);
    return { top, above: true };
  }

  const top = dockTopWithMaxHeight(panel, tr.bottom + GAP, ph, vh);
  return { top, above: false };
}

/** Side dock (nav-rail secondary) — horizontal flip + vertical maxHeight cap. */
function placeSide(
  panel: HTMLElement,
  tr: DOMRectReadOnly,
  pw: number,
  ph: number,
  position: MenuPosition,
  rtl: boolean,
  vw: number,
  vh: number,
): { top: number; left: number } {
  panel.removeAttribute('data-flip');
  panel.style.maxHeight = '';

  let openEnd = sideIsEnd(position);
  const spaceEnd = rtl ? tr.left - EDGE : vw - tr.right - EDGE;
  const spaceStart = rtl ? vw - tr.right - EDGE : tr.left - EDGE;
  if (openEnd && pw + GAP > spaceEnd && spaceStart > spaceEnd) openEnd = false;
  if (!openEnd && pw + GAP > spaceStart && spaceEnd > spaceStart) openEnd = true;

  let left = rtl
    ? openEnd
      ? tr.left - GAP - pw
      : tr.right + GAP
    : openEnd
      ? tr.right + GAP
      : tr.left - GAP - pw;
  left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - EDGE - pw));
  panel.style.left = `${Math.round(left)}px`;
  panel.style.right = 'auto';

  if (sideAlignEnd(position)) {
    const top = dockTopWithMaxHeight(panel, tr.bottom - ph, ph, vh, tr.bottom);
    return { top, left: Math.round(left) };
  }

  const top = dockTopWithMaxHeight(panel, tr.top, ph, vh);
  return { top, left: Math.round(left) };
}

export type FitMenuPanelOptions = {
  /**
   * Stretch the panel to the trigger width (exposed dropdown / select).
   * Matches Noph Select: menu flush with the field, elastic scaleY enter.
   */
  matchWidth?: boolean;
};

/**
 * Place a menu panel with `position:fixed`, flipping on viewport overflow.
 * Uses logical start/end so LTR and RTL stay correct.
 * `trigger` may be an element (live) or a rect (e.g. rail edge × item band).
 */
export function fitMenuPanel(
  panel: HTMLElement,
  trigger: HTMLElement | DOMRectReadOnly,
  position: MenuPosition,
  rtl: boolean,
  options: FitMenuPanelOptions = {},
): { top: number; left: number } {
  const tr = resolveFitRect(trigger);

  if (options.matchWidth) {
    const w = Math.max(1, Math.round(tr.width));
    panel.style.width = `${w}px`;
    panel.style.minWidth = `${w}px`;
    panel.style.maxWidth = 'none';
  }

  const { w: pw, h: ph } = measurePanel(panel);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { v, h } = parsePosition(position);

  panel.setAttribute('data-fitted', '');
  panel.style.position = 'fixed';
  panel.style.bottom = 'auto';
  panel.style.insetInlineStart = 'auto';
  panel.style.insetInlineEnd = 'auto';

  let top = 0;
  let left = 0;

  if (v === 'side' || isSideMenuPosition(position)) {
    ({ top, left } = placeSide(panel, tr, pw, ph, position, rtl, vw, vh));
  } else {
    const placed = placeVerticalDocked(panel, tr, ph, vh, v === 'top');
    top = placed.top;
    if (placed.above) panel.setAttribute('data-flip', 'above');
    else panel.removeAttribute('data-flip');
    left = placeInline(panel, tr, pw, vw, rtl, h === 'end');
  }

  panel.style.top = `${Math.round(top)}px`;
  return { top: Math.round(top), left: Math.round(left) };
}

/** Clear fixed fit styles — restore CSS position classes. */
export function clearMenuPanelFit(panel: HTMLElement): void {
  panel.removeAttribute('data-fitted');
  panel.removeAttribute('data-flip');
  panel.style.position = '';
  panel.style.top = '';
  panel.style.left = '';
  panel.style.right = '';
  panel.style.bottom = '';
  panel.style.maxHeight = '';
  panel.style.width = '';
  panel.style.minWidth = '';
  panel.style.maxWidth = '';
  panel.style.insetInlineStart = '';
  panel.style.insetInlineEnd = '';
}