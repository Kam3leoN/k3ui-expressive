/**
 * Docked surface placement — menu-style flip / clamp to viewport.
 * Prefer below the anchor; flip above when space is tight.
 */

export interface DockedPositionResult {
  top: number;
  left: number;
  flip: 'top' | 'bottom';
}

export function computeDockedPosition(
  anchor: DOMRect,
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
  const spaceBelow = vh - anchor.bottom - gap - margin;
  const spaceAbove = anchor.top - gap - margin;

  let flip: 'top' | 'bottom' = 'bottom';
  let top: number;
  if (spaceBelow >= h) {
    top = anchor.bottom + gap;
    flip = 'bottom';
  } else if (spaceAbove >= h) {
    top = anchor.top - h - gap;
    flip = 'top';
  } else if (spaceBelow >= spaceAbove) {
    top = anchor.bottom + gap;
    flip = 'bottom';
  } else {
    top = anchor.top - h - gap;
    flip = 'top';
  }
  top = Math.min(Math.max(margin, top), vh - h - margin);

  let left = Math.max(margin, anchor.left);
  if (left + w > vw - margin) {
    left = Math.max(margin, vw - w - margin);
  }
  if (anchor.right - w >= margin && anchor.left + w > vw - margin) {
    left = Math.max(margin, anchor.right - w);
  }

  return { top: Math.round(top), left: Math.round(left), flip };
}

/** Apply docked CSS vars + flip on the host. */
export function applyDockedPosition(
  host: HTMLElement,
  anchorEl: HTMLElement,
): DockedPositionResult {
  const result = computeDockedPosition(anchorEl.getBoundingClientRect(), {
    width: host.offsetWidth,
    height: host.offsetHeight,
  });
  host.dataset.flip = result.flip;
  host.style.setProperty('--k3-tp-top', `${result.top}px`);
  host.style.setProperty('--k3-tp-left', `${result.left}px`);
  return result;
}
