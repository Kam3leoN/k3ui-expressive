/**
 * Scroll-to-top — fixed FAB-style control with optional scroll progress ring.
 */

import { FabMenuSpecs } from '../actions/fab-menu.specs.js';

/** M3 floating chrome inset (align FAB corner dock — 16dp). */
export const ScrollToTopFloatingInsetDp = FabMenuSpecs.edgeDp;

export const ScrollToTopSpecs = {
  behaviors: {
    threshold: 80 as number,
    size: 56 as number,
    strokeWidth: 6 as number,
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
