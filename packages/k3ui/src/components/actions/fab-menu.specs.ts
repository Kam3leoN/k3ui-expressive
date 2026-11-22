/**
 * Material 3 Expressive — FAB menu specifications.
 *
 * @see https://m3.material.io/components/fab-menu/overview
 * @see https://m3.material.io/components/fab-menu/specs
 * @see https://m3.material.io/components/fab-menu/guidelines
 * @see androidx.compose.material3.FloatingActionButtonMenu
 *
 * Rules:
 * - Replaces speed dials / stacked mini-FABs
 * - One menu size; close trigger always default FAB (56dp)
 * - Prefer 2–6 actions; never open from an extended FAB
 * - Trailing-edge alignment; RTL mirrors (icons + labels)
 * - Start-edge: icon at end of line (outer); end-edge: icon at inline-start
 * - 16dp from trailing + bottom when corner-docked
 * - Menu overlays the FAB (absolute) — trigger never shifts in layout
 * - Collision flip: prefer placement side, flip if clip box lacks room
 * - Trigger retracts toward pills (pin top if above, pin bottom if below)
 * - Motion: scaleX FastSpatial + fade FastEffects; stagger 35 / 25 ms
 */

import { springs } from '../../motion/springs.js';

export type FabMenuPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
export type FabMenuVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';
/** Trigger: default 56 · medium 80 · large 96 (`small` 40 deprecated). */
export type FabMenuSize = 'default' | 'small' | 'medium' | 'large';
export type FabMenuPhase = 'closed' | 'opening' | 'open' | 'closing';
/** Menu column side relative to the FAB (after collision flip). */
export type FabMenuSide = 'above' | 'below';

/** Trigger footprint (dp) — `small` deprecated in M3e. */
export const FabMenuFabDp = {
  /** @deprecated M3e */
  small: 40,
  default: 56,
  medium: 80,
  large: 96,
} as const;

const fastSpatial = springs.expressive.spatial.fast;
const fastEffects = springs.expressive.effects.fast;

export const FabMenuSpecs = {
  edgeDp: 16,
  /** M3E `space50` — gap between pills. */
  gapDp: 4,
  /**
   * Gap between menu column and FAB.
   * M3 web: “can vary, but 4dp is recommended”.
   * @see https://m3.material.io/components/fab-menu/specs
   */
  fabGapDp: 4,
  itemHeightDp: 56,
  /**
   * Flip one pill early — before the outer item reaches the edge / app bar
   * (late flip was waiting for full-height contact).
   */
  edgeSafetyDp: 56,
  itemIconDp: 24,
  itemGapDp: 12,
  itemPadInlineStartDp: 16,
  itemPadInlineEndDp: 24,
  itemMaxWidthDp: 280,
  menuMaxHeightDp: 400,
  minItems: 2,
  maxItems: 6,
  /** Open close FAB always 56; slot keeps closed footprint for morph. */
  closeSize: 'default' as const,
  staggerEnterMs: 35,
  staggerExitMs: 25,
  spatialEnterMs: fastSpatial.durationMs,
  spatialEnterEasing: fastSpatial.easing,
  /**
   * Same FastSpatial as menus (`enterScaleY`) — exit used to be 120ms effects
   * (no bounce), which felt limp vs menu fin de course.
   * Animated exit settles at scaleX(0.8) like menu close; hard-collapse after.
   */
  spatialExitMs: fastSpatial.durationMs,
  spatialExitEasing: fastSpatial.easing,
  effectsMs: fastEffects.durationMs,
  effectsEasing: fastEffects.easing,
  /** Trigger icon crossfade — match FAB size morph (short4 / effects). */
  closeTriggerMs: 200,
} as const;

/** Closed-trigger footprint in rem (slot height/width). */
export function fabMenuSlotRem(size: FabMenuSize): string {
  return `${FabMenuFabDp[size] / 16}rem`;
}

export function fabMenuIsTrailingRight(placement: FabMenuPlacement, rtl: boolean): boolean {
  const end = placement.endsWith('end');
  return rtl ? !end : end;
}

/**
 * Stagger delay (DOM order top→bottom).
 * Open: nearest FAB first. Close: farthest first.
 */
export function fabMenuItemDelayMs(
  phase: 'opening' | 'closing',
  index: number,
  count: number,
  menuAbove: boolean,
): number {
  if (count <= 0) return 0;
  const step =
    phase === 'opening' ? FabMenuSpecs.staggerEnterMs : FabMenuSpecs.staggerExitMs;
  const fromFab = phase === 'opening' ? count - 1 - index : index;
  const fromTop = phase === 'opening' ? index : count - 1 - index;
  return (menuAbove ? fromFab : fromTop) * step;
}

/** Estimated menu column height (dp) for collision / flip. */
export function fabMenuEstimateHeightDp(itemCount: number): number {
  const n = Math.max(itemCount, 0);
  if (n === 0) return 0;
  return n * FabMenuSpecs.itemHeightDp + (n - 1) * FabMenuSpecs.gapDp;
}

/**
 * Collision ancestor for flip: explicit clip → demo-frame (logical) → overflow
 * clip → null. Always intersect with the viewport via `fabMenuClipBounds`
 * so off-screen edges still flip (demo-frame alone can extend past the screen).
 */
export function fabMenuFindClipElement(start: Element | null): HTMLElement | null {
  let el: HTMLElement | null =
    start instanceof HTMLElement ? start : (start?.parentElement ?? null);
  let overflowClip: HTMLElement | null = null;
  while (el) {
    if (
      el.hasAttribute('data-k3-fab-menu-clip') ||
      el.classList.contains('demo-frame')
    ) {
      return el;
    }
    if (!overflowClip) {
      const { overflowY, overflow } = getComputedStyle(el);
      const oy = overflowY !== 'visible' ? overflowY : overflow;
      if (oy === 'auto' || oy === 'scroll' || oy === 'hidden' || oy === 'clip') {
        overflowClip = el;
      }
    }
    el = el.parentElement;
  }
  return overflowClip;
}

/** Top / bottom chrome that counts as a screen edge for FAB menu flip. */
const FAB_MENU_TOP_CHROME =
  'k3-top-app-bar:not([hidden])';
const FAB_MENU_BOTTOM_CHROME =
  'k3-bottom-app-bar:not([hidden]), k3-nav-bar:not([hidden]), k3-footer-bar:not([hidden])';

/**
 * Visible band from app bars / nav (and optional safe-area).
 * Top app bar bottom edge = top collision line; bottom bar top = bottom line.
 */
export function fabMenuViewportChromeBounds(
  doc: Document | null = typeof document !== 'undefined' ? document : null,
  viewportTop = 0,
  viewportBottom =
    typeof window !== 'undefined' ? window.innerHeight : 0,
): { top: number; bottom: number } {
  let top = viewportTop;
  let bottom = viewportBottom;
  if (!doc) return { top, bottom };

  const visible = (r: DOMRectReadOnly): boolean =>
    r.height > 0 && r.width > 0 && r.bottom > viewportTop && r.top < viewportBottom;

  for (const node of doc.querySelectorAll(FAB_MENU_TOP_CHROME)) {
    if (!(node instanceof HTMLElement)) continue;
    const r = node.getBoundingClientRect();
    if (!visible(r)) continue;
    top = Math.max(top, r.bottom);
  }
  for (const node of doc.querySelectorAll(FAB_MENU_BOTTOM_CHROME)) {
    if (!(node instanceof HTMLElement)) continue;
    const r = node.getBoundingClientRect();
    if (!visible(r)) continue;
    bottom = Math.min(bottom, r.top);
  }
  if (bottom < top) bottom = top;
  return { top, bottom };
}

/**
 * Visible collision band: ancestor box ∩ (viewport ∪ app-bar chrome).
 * App bars count as the screen edge — flip before the first pill crosses them.
 */
export function fabMenuClipBounds(
  el: HTMLElement | null,
  viewportTop = 0,
  viewportBottom =
    typeof window !== 'undefined' ? window.innerHeight : 0,
  chrome: { top: number; bottom: number } | null = null,
): { top: number; bottom: number } {
  const band =
    chrome ?? fabMenuViewportChromeBounds(undefined, viewportTop, viewportBottom);
  const vt = Math.max(viewportTop, band.top);
  const vb = Math.min(viewportBottom, band.bottom);
  if (!el) return { top: vt, bottom: Math.max(vt, vb) };
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(vt, r.top),
    bottom: Math.min(vb, r.bottom),
  };
}

/** Free space (px) on each side of the host inside the clip box. */
export function fabMenuSpacePx(
  hostTop: number,
  hostBottom: number,
  gapPx: number,
  clipTop: number,
  clipBottom: number,
): { above: number; below: number } {
  return {
    above: Math.max(0, hostTop - clipTop - gapPx),
    below: Math.max(0, clipBottom - hostBottom - gapPx),
  };
}

/**
 * Prefer side from placement; flip one pill before the outer item would hit
 * the edge / app bar (`need = menuHeight + edgeSafety`). When neither fits,
 * pick the larger side (natural height, no FAB-spilling clamp).
 */
export function fabMenuResolveSide(
  preferAbove: boolean,
  hostTop: number,
  hostBottom: number,
  menuHeightPx: number,
  gapPx: number,
  clipTop: number,
  clipBottom: number,
  edgeSafetyPx: number = FabMenuSpecs.edgeSafetyDp,
): FabMenuSide {
  const { above: spaceAbove, below: spaceBelow } = fabMenuSpacePx(
    hostTop,
    hostBottom,
    gapPx,
    clipTop,
    clipBottom,
  );
  const need = menuHeightPx + Math.max(0, edgeSafetyPx);
  if (preferAbove) {
    if (spaceAbove > need) return 'above';
    if (spaceBelow > need) return 'below';
    return spaceAbove >= spaceBelow ? 'above' : 'below';
  }
  if (spaceBelow > need) return 'below';
  if (spaceAbove > need) return 'above';
  return spaceBelow >= spaceAbove ? 'below' : 'above';
}

/**
 * Snap available height to a whole number of pills (+ gaps) so the clip edge
 * never shears through a mid-pill (looks like a “partial” collision bug).
 */
export function fabMenuSnapHeightToItemsPx(
  availablePx: number,
  absoluteMaxPx: number = FabMenuSpecs.menuMaxHeightDp,
): number {
  const item = FabMenuSpecs.itemHeightDp;
  const gap = FabMenuSpecs.gapDp;
  const room = Math.min(absoluteMaxPx, Math.max(0, availablePx));
  /* n items occupy n*item + (n-1)*gap */
  const n = Math.max(1, Math.floor((room + gap) / (item + gap)));
  return n * item + (n - 1) * gap;
}

/**
 * Block-edge inset inside the collision clip (keeps end pills from shearing
 * against the frame). Used only in max-height math — menu has no scrollbar.
 */
export const FabMenuScrollBleedYDp = 8;

/** Max menu height inside the clip for a resolved side (capped by spec). */
export function fabMenuClampMaxHeightPx(
  side: FabMenuSide,
  hostTop: number,
  hostBottom: number,
  gapPx: number,
  clipTop: number,
  clipBottom: number,
  absoluteMaxPx: number = FabMenuSpecs.menuMaxHeightDp,
): number {
  const { above, below } = fabMenuSpacePx(
    hostTop,
    hostBottom,
    gapPx,
    clipTop,
    clipBottom,
  );
  const room = side === 'above' ? above : below;
  /* Inset both block edges; snap content to whole pills. */
  const contentRoom = Math.max(
    FabMenuSpecs.itemHeightDp,
    room - FabMenuScrollBleedYDp * 2,
  );
  const contentH = fabMenuSnapHeightToItemsPx(contentRoom, absoluteMaxPx);
  return contentH + FabMenuScrollBleedYDp * 2;
}

export function fabMenuMaxDurationMs(phase: 'opening' | 'closing', count: number): number {
  const n = Math.max(count, 1);
  const step =
    phase === 'opening' ? FabMenuSpecs.staggerEnterMs : FabMenuSpecs.staggerExitMs;
  const spatial =
    phase === 'opening' ? FabMenuSpecs.spatialEnterMs : FabMenuSpecs.spatialExitMs;
  const itemsMs = (n - 1) * step + Math.max(spatial, FabMenuSpecs.effectsMs) + 16;
  /* Closing: also wait for trigger icon crossfade (size morph). */
  if (phase === 'closing') {
    return Math.max(itemsMs, FabMenuSpecs.closeTriggerMs + 16);
  }
  return itemsMs;
}

export function fabMenuResolvePhase(menuOpen: boolean, phase: FabMenuPhase): FabMenuPhase {
  if (!menuOpen || phase === 'closed') return 'closed';
  if (phase === 'opening' || phase === 'closing') return phase;
  return 'open';
}

/** Directional Material icons that flip in RTL. */
export function fabMenuIconMirrors(icon: string): boolean {
  return /^(reply|reply_all|forward|arrow_|undo|redo|send)/i.test(icon);
}
