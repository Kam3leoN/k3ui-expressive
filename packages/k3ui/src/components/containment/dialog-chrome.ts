/**
 * Derive footer / close chrome for basic vs fullscreen (M3 Adaptive).
 * Shared by `syncSlots` and `render` so the two stay in lockstep.
 */
export interface DialogFooterChrome {
  headerInFooter: boolean;
  showDefaultClose: boolean;
  hasFooterActions: boolean;
}

export function deriveDialogFooterChrome(opts: {
  fullscreen: boolean;
  closeAction: boolean;
  hasHeaderActions: boolean;
  hasActionsSlot: boolean;
}): DialogFooterChrome {
  const headerInFooter = !opts.fullscreen && opts.hasHeaderActions;
  const showDefaultClose =
    opts.closeAction && !opts.fullscreen && !opts.hasActionsSlot && !headerInFooter;
  return {
    headerInFooter,
    showDefaultClose,
    hasFooterActions: opts.hasActionsSlot || showDefaultClose || headerInFooter,
  };
}
