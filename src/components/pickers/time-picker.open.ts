/**
 * Popover top-layer helpers for `k3-time-picker`.
 * UA uses `display:none !important` until `:popover-open`.
 */

type PopoverHost = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
  popover?: string;
  matches: (s: string) => boolean;
};

export function supportsPopoverApi(el: HTMLElement): boolean {
  return typeof (el as PopoverHost).showPopover === 'function';
}

/** @returns true when the element is in the Popover top-layer */
export function openPopoverLayer(el: HTMLElement): boolean {
  const host = el as PopoverHost;
  if (typeof host.showPopover !== 'function') return false;
  try {
    host.popover = 'manual';
    host.showPopover();
    return host.matches(':popover-open');
  } catch {
    return false;
  }
}

export function closePopoverLayer(el: HTMLElement): void {
  const host = el as PopoverHost;
  if (typeof host.hidePopover !== 'function') return;
  try {
    if (host.matches(':popover-open')) host.hidePopover();
  } catch {
    /* ignore */
  }
}
