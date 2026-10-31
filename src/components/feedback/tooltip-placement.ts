/**
 * Floating tip geometry — shared by `K3Tooltip.syncFloatingTip` and unit tests.
 * Corner placements follow Floating UI / Popper: preferred side + edge flush
 * (NE mirrors NW, SE mirrors SW). Enter motion stays axial via transform-origin.
 */

export type TooltipPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'start'
  | 'end'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

export type FloatingTipRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type FloatingTipLayout = {
  left: number;
  top: number;
  tx: string;
  ty: string;
  ox: string;
  oy: string;
};

/** Resolve viewport left/top + translate + transform-origin for a tip placement. */
export function resolveFloatingTipPlacement(
  pos: TooltipPosition,
  r: FloatingTipRect,
  gap: number,
  rtl: boolean,
): FloatingTipLayout {
  let left = r.left + r.width / 2;
  let top = r.top - gap;
  let tx = '-50%';
  let ty = '-100%';
  let ox = '50%';
  let oy = '100%';

  switch (pos) {
    case 'bottom':
      top = r.bottom + gap;
      tx = '-50%';
      ty = '0%';
      ox = '50%';
      oy = '0%';
      break;
    case 'left':
      left = r.left - gap;
      top = r.top + r.height / 2;
      tx = '-100%';
      ty = '-50%';
      ox = '100%';
      oy = '50%';
      break;
    case 'right':
      left = r.right + gap;
      top = r.top + r.height / 2;
      tx = '0%';
      ty = '-50%';
      ox = '0%';
      oy = '50%';
      break;
    case 'start':
      left = rtl ? r.right + gap : r.left - gap;
      top = r.top + r.height / 2;
      tx = rtl ? '0%' : '-100%';
      ty = '-50%';
      ox = rtl ? '0%' : '100%';
      oy = '50%';
      break;
    case 'end':
      left = rtl ? r.left - gap : r.right + gap;
      top = r.top + r.height / 2;
      tx = rtl ? '-100%' : '0%';
      ty = '-50%';
      ox = rtl ? '100%' : '0%';
      oy = '50%';
      break;
    case 'top-start':
      left = rtl ? r.right : r.left;
      top = r.top - gap;
      tx = rtl ? '-100%' : '0%';
      ty = '-100%';
      ox = rtl ? '100%' : '0%';
      oy = '100%';
      break;
    case 'top-end':
      left = rtl ? r.left : r.right;
      top = r.top - gap;
      tx = rtl ? '0%' : '-100%';
      ty = '-100%';
      ox = rtl ? '0%' : '100%';
      oy = '100%';
      break;
    case 'bottom-start':
      left = rtl ? r.right : r.left;
      top = r.bottom + gap;
      tx = rtl ? '-100%' : '0%';
      ty = '0%';
      ox = rtl ? '100%' : '0%';
      oy = '0%';
      break;
    case 'bottom-end':
      left = rtl ? r.left : r.right;
      top = r.bottom + gap;
      tx = rtl ? '0%' : '-100%';
      ty = '0%';
      ox = rtl ? '0%' : '100%';
      oy = '0%';
      break;
    case 'top':
    default:
      break;
  }

  return { left, top, tx, ty, ox, oy };
}
