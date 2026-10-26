/**
 * Scroll-to-top — fixed FAB-style control with optional scroll progress ring.
 */

import { FabMenuSpecs, type FabMenuVariant } from '../actions/fab-menu.specs.js';

export type ScrollToTopVariant = FabMenuVariant;

/** M3 floating chrome inset (align FAB corner dock — 16dp). */
export const ScrollToTopFloatingInsetDp = FabMenuSpecs.edgeDp;

export const ScrollToTopSpecs = {
  behaviors: {
    /** Same role tokens as `k3-fab-menu` trigger (default primary). */
    defaultVariant: 'primary' as ScrollToTopVariant,
    threshold: 80 as number,
    size: 56 as number,
    strokeWidth: 6 as number,
    /**
     * Extra dp on progress stroke, applied inward only (same outer edge as
     * track) so progress covers the track without a rim / outline.
     */
    progressStrokeExtra: 2 as number,
    rightOffset: ScrollToTopFloatingInsetDp as number,
    bottomOffset: ScrollToTopFloatingInsetDp as number,
    showProgress: true as boolean,
    icon: 'keyboard_arrow_up',
  },
  motion: {
    scrollDuration: 450 as number,
    minScrollDuration: 220 as number,
  },
  accessibility: {
    ariaLabel: 'Scroll to top',
  },
};

export function resolveScrollToTopVariant(
  value: string | null | undefined,
): ScrollToTopVariant {
  if (
    value === 'primary' ||
    value === 'secondary' ||
    value === 'tertiary' ||
    value === 'surface'
  ) {
    return value;
  }
  return ScrollToTopSpecs.behaviors.defaultVariant;
}
