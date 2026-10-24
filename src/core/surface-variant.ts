/**
 * M3 surface variant — docked popover vs modal dialog (date/time pickers).
 */

/** Author-facing variant (`auto` resolves by compact breakpoint). */
export type SurfaceVariant = 'docked' | 'modal' | 'auto';
/** Runtime surface after resolving `auto`. */
export type ResolvedSurfaceVariant = 'docked' | 'modal';

/** Compact viewport — M3 window class compact (~600dp). */
export const SURFACE_COMPACT_MQ = '(max-width: 599.98px)';

/** `auto` → compact ? modal : docked. */
export function resolveSurfaceVariant(
  variant: SurfaceVariant,
  compact: boolean,
): ResolvedSurfaceVariant {
  if (variant === 'auto') return compact ? 'modal' : 'docked';
  return variant === 'modal' ? 'modal' : 'docked';
}

/** Sync `data-resolved-variant` + `aria-modal` on the host. */
export function syncResolvedSurface(
  host: HTMLElement,
  resolved: ResolvedSurfaceVariant,
): void {
  host.dataset.resolvedVariant = resolved;
  host.toggleAttribute('aria-modal', resolved === 'modal');
}

export interface DockedFitOptions {
  /** When false, `bind` is a no-op / `unbind` still cleans up. */
  isActive: () => boolean;
  onReposition: () => void;
  /** Element(s) to observe with ResizeObserver. Default: none. */
  observe?: () => Element | Element[] | null | undefined;
}

export interface DockedFitController {
  bind: () => void;
  unbind: () => void;
}

/**
 * Resize / scroll / ResizeObserver while a docked surface is open.
 * Call `bind` when open+docked; `unbind` on close or disconnect.
 */
export function attachDockedFit(options: DockedFitOptions): DockedFitController {
  let listening = false;
  let ro: ResizeObserver | null = null;

  const onRepos = (): void => {
    if (!options.isActive()) return;
    options.onReposition();
  };

  const unbind = (): void => {
    if (!listening) return;
    listening = false;
    window.removeEventListener('resize', onRepos);
    window.removeEventListener('scroll', onRepos, true);
    ro?.disconnect();
    ro = null;
  };

  const bind = (): void => {
    if (listening || !options.isActive()) return;
    listening = true;
    window.addEventListener('resize', onRepos, { passive: true });
    window.addEventListener('scroll', onRepos, true);
    if (typeof ResizeObserver === 'undefined') return;
    const targets = options.observe?.();
    const list = !targets
      ? []
      : Array.isArray(targets)
        ? targets
        : [targets];
    const els = list.filter((n): n is Element => n != null);
    if (!els.length) return;
    ro = new ResizeObserver(onRepos);
    for (const el of els) ro.observe(el);
  };

  return { bind, unbind };
}