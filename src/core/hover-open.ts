/**
 * Hover-open with grace leave — menus / shell secondary surfaces.
 */

export interface HoverOpenOptions {
  show: () => void;
  hide: () => void;
  isOpen: () => boolean;
  /** When false, enter/leave no-op. Default true. */
  isEnabled?: () => boolean;
  /** Grace before hide after leave (ms). Default 120. */
  graceMs?: number;
  /** Busy (e.g. enter animation lock) — skip leave scheduling. */
  isBusy?: () => boolean;
  /** relatedTarget still inside the open surface tree. */
  isInTree?: (related: EventTarget | null) => boolean;
}

export interface HoverOpenController {
  detach: () => void;
  cancelClose: () => void;
}

const DEFAULT_GRACE_MS = 120;

/** Bind pointerenter / pointerleave hover-open on `host`. */
export function attachHoverOpen(
  host: HTMLElement,
  options: HoverOpenOptions,
): HoverOpenController {
  let closeTimer = 0;
  const grace = options.graceMs ?? DEFAULT_GRACE_MS;

  const cancelClose = (): void => {
    if (!closeTimer) return;
    window.clearTimeout(closeTimer);
    closeTimer = 0;
  };

  const scheduleClose = (): void => {
    cancelClose();
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      if (options.isEnabled && !options.isEnabled()) return;
      if (!options.isOpen()) return;
      options.hide();
    }, grace);
  };

  const onEnter = (): void => {
    if (options.isEnabled && !options.isEnabled()) return;
    cancelClose();
    if (options.isOpen()) return;
    options.show();
  };

  const onLeave = (e: PointerEvent): void => {
    if (options.isEnabled && !options.isEnabled()) return;
    if (options.isBusy?.()) return;
    if (!options.isOpen()) return;
    if (options.isInTree?.(e.relatedTarget)) return;
    scheduleClose();
  };

  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointerleave', onLeave);

  return {
    cancelClose,
    detach: () => {
      cancelClose();
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
    },
  };
}