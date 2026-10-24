import type { K3NavItem } from './nav-item.js';

/** Slotted destinations under a nav host (bar / rail). */
export function queryNavItems(host: HTMLElement): K3NavItem[] {
  return [...host.querySelectorAll<K3NavItem>('k3-nav-item')];
}

/** Resolve the clicked `k3-nav-item` from a composed event path. */
export function navItemFromEvent(
  e: Event,
  host: HTMLElement,
): K3NavItem | null {
  const fromPath = e.composedPath().find(
    (n): n is K3NavItem =>
      n instanceof HTMLElement && n.localName === 'k3-nav-item',
  );
  const el =
    fromPath ??
    ((e.target as HTMLElement | null)?.closest('k3-nav-item') as K3NavItem | null);
  if (!el || !host.contains(el)) return null;
  return el;
}

export type ArmNavHandle = { cancel: () => void };

/**
 * Clear all `active`, wait for Lit paint at scaleX(0), then arm the target
 * index so each item’s selected pill can spring (same path as hover).
 */
export function armNavActive(
  items: K3NavItem[],
  index: number,
  animate: boolean,
): ArmNavHandle {
  let raf = 0;
  let cancelled = false;

  for (const el of items) el.active = false;

  const apply = (): void => {
    if (cancelled) return;
    for (let i = 0; i < items.length; i++) items[i]!.active = i === index;
  };

  if (!animate) {
    apply();
    return { cancel: () => undefined };
  }

  void Promise.all(items.map((el) => el.updateComplete)).then(() => {
    if (cancelled) return;
    for (const el of items) void el.offsetWidth;
    raf = requestAnimationFrame(() => {
      apply();
      raf = 0;
    });
  });

  return {
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    },
  };
}

/** Index of a marked-active item, or -1. */
export function findMarkedNavIndex(items: K3NavItem[]): number {
  return items.findIndex((el) => el.active || el.hasAttribute('active'));
}
