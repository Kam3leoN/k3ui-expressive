/**
 * Coordinates stacked `k3-banner[position=fixed]` strips.
 * Publishes `--k3-banner-offset` on `<html>` so sticky app bars, nav rails,
 * and sheets sit below (or retract under) fixed banners.
 */
import { BannerSpecs } from './banner.specs.js';

export type BannerOffsetHost = HTMLElement & {
  position: string;
  hidden: boolean;
  /** Measured painted surface height (px). */
  measureSurfaceHeight(): number;
  /** Apply stack offset for this instance. */
  applyStackTop(px: number): void;
};

let raf = 0;

function isActiveFixed(el: Element): el is BannerOffsetHost {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hidden || !el.isConnected) return false;
  const pos = (el as BannerOffsetHost).position ?? el.getAttribute('position');
  return pos !== 'static';
}

/** Schedule a single frame sync of all fixed banners. */
export function requestBannerOffsetSync(): void {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    syncBannerOffset();
  });
}

/** Recompute stack tops + `--k3-banner-offset` from DOM order. */
export function syncBannerOffset(): void {
  const list = [...document.querySelectorAll('k3-banner')].filter(isActiveFixed);
  let top = 0;
  for (const el of list) {
    el.applyStackTop(top);
    const phase = el.dataset.phase;
    /* During enter/leave WAAPI owns host height — do not overwrite. */
    if (phase === 'entering' || phase === 'leaving') {
      top += Math.max(0, Math.round(el.getBoundingClientRect().height));
      continue;
    }
    const h = Math.max(0, Math.round(el.measureSurfaceHeight()));
    /* Keep host spacer in sync so in-flow app bars are pushed down. */
    el.style.height = h ? `${h}px` : '';
    top += h;
  }
  const root = document.documentElement;
  const varName = BannerSpecs.cssVarOffset;
  if (top > 0) {
    root.style.setProperty(varName, `${top}px`);
  } else {
    root.style.removeProperty(varName);
  }
}

/** Drop this host from the stack and refresh peers. */
export function clearBannerHostSpacer(el: HTMLElement): void {
  el.style.removeProperty('height');
  el.style.removeProperty(BannerSpecs.cssVarStackTop);
  requestBannerOffsetSync();
}
