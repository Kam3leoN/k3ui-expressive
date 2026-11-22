/**
 * Docked surface placement for date/time pickers.
 *
 * Prefer **below** the field outline (M3 docked). Flip above only when below
 * is clearly worse. Never lift `top` off the anchor (that caused dial/keyboard
 * to sit at different heights). Clip with maxHeight when space is tight.
 */

export type { DockedPositionResult } from '../../core/anchored-position.js';
export { computeDockedPosition } from '../../core/anchored-position.js';

import type { DockedPositionResult } from '../../core/anchored-position.js';
import { layoutBoundingRect } from '../../core/geometry.js';

const GAP = 8;
const MARGIN = 8;
/** Below this, prefer flipping above when above has more room. */
const MIN_BELOW = 160;

/**
 * Prefer the outlined field box inside `k3-text-field` (excludes label /
 * supporting text) so the panel docks flush under the input.
 */
export function pickerAnchorRect(el: HTMLElement): DOMRect {
  const root = el.shadowRoot;
  const box =
    root?.querySelector<HTMLElement>('.field, [part="container"]') ??
    root?.querySelector<HTMLElement>('[part="outline"]');
  if (box) return layoutBoundingRect(box);
  return layoutBoundingRect(el);
}

/**
 * Natural content height — must NOT use `offsetHeight` while clipped:
 * offsetHeight collapses to maxHeight → next pass thinks we fit → unclips →
 * grows → clips again (scrollbar / window flash loop).
 */
function naturalHeight(host: HTMLElement): number {
  return Math.max(host.scrollHeight, host.offsetHeight, 1);
}

/**
 * Apply docked CSS vars + flip on the picker host.
 * Same top edge for dial and keyboard when opening below the same anchor.
 */
export function applyDockedPosition(
  host: HTMLElement,
  anchorEl: HTMLElement,
): DockedPositionResult {
  const anchor = pickerAnchorRect(anchorEl);
  const measuredH = naturalHeight(host);
  const measuredW = Math.max(host.offsetWidth, 1);
  const viewW = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 0;
  const wasClipped = host.hasAttribute('data-clip');
  /** Unclip only with clear slack — avoids 1px thrash at the clip boundary. */
  const UNCLIP_SLACK = 16;

  const spaceBelow = viewH - anchor.bottom - GAP - MARGIN;
  const spaceAbove = anchor.top - GAP - MARGIN;

  let flip: 'top' | 'bottom' = 'bottom';
  let top: number;
  let maxHeight: number | null = null;

  const preferAbove =
    spaceBelow < MIN_BELOW && spaceAbove > spaceBelow && spaceAbove >= MIN_BELOW;

  if (preferAbove) {
    flip = 'top';
    const dockBottom = anchor.top - GAP;
    top = dockBottom - measuredH;
    if (top < MARGIN) {
      top = MARGIN;
      maxHeight = Math.max(48, dockBottom - MARGIN);
    } else if (wasClipped && measuredH > dockBottom - MARGIN - UNCLIP_SLACK) {
      /* Still tight after flip-above measure — keep clip stable */
      maxHeight = Math.max(48, dockBottom - MARGIN);
      top = MARGIN;
    }
  } else {
    flip = 'bottom';
    top = anchor.bottom + GAP;
    const avail = viewH - MARGIN - top;
    if (measuredH > avail) {
      maxHeight = Math.max(48, avail);
    } else if (wasClipped && measuredH > avail - UNCLIP_SLACK) {
      /* Content still near the edge — keep previous clip (no flash) */
      maxHeight = Math.max(48, avail);
    }
  }

  const w = Math.min(measuredW, Math.max(0, viewW - MARGIN * 2));
  let left = Math.max(MARGIN, anchor.left);
  if (left + w > viewW - MARGIN) {
    left = Math.max(MARGIN, viewW - w - MARGIN);
  }
  if (anchor.right - w >= MARGIN && anchor.left + w > viewW - MARGIN) {
    left = Math.max(MARGIN, anchor.right - w);
  }

  const result: DockedPositionResult = {
    top: Math.round(top),
    left: Math.round(left),
    flip,
    maxHeight,
  };

  host.dataset.flip = result.flip;
  host.style.setProperty('--k3-tp-top', `${result.top}px`);
  host.style.setProperty('--k3-tp-left', `${result.left}px`);
  if (result.maxHeight != null) {
    host.style.maxHeight = `${Math.round(result.maxHeight)}px`;
    host.setAttribute('data-clip', '');
  } else {
    host.style.maxHeight = '';
    host.removeAttribute('data-clip');
  }
  return result;
}
