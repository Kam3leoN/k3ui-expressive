import { css, type CSSResultGroup } from 'lit';
import { enterScaleY } from '../../motion/enter.js';

/**
 * Styles for `k3-menu` — host tokens, panel, list, gap stack, connected.
 *
 * Hard rules baked in (do not regress):
 * - Never `filter` / `transform` on ancestors of submenu flyouts
 *   (`position:fixed` would attach to the wrong containing block).
 * - Baseline: no container pad, divider band = 1px, no gap surfaces.
 * - Gap mode: transparent panel; elevation lives on each `k3-menu-group`.
 * - Enter motion via shared `enterScaleY` (M3E menu recipe · matraic/m3e).
 *   Same FastSpatial tokens as FAB menu pills (`scaleX` per item + stagger) —
 *   different recipe; do not merge the two enter helpers.
 */
export const menuStyles: CSSResultGroup = [
  enterScaleY('.panel', '.panel.open'),
  css`
  :host {
    position: relative;
    display: inline-block;
    /* Vertical M3e — official measurements */
    --k3-menu-radius: var(--k3-sys-shape-corner-large); /* 16 parent + submenu */
    --k3-menu-surface-radius: var(--k3-sys-shape-corner-large); /* 16 */
    /* Gap-facing surface corner — 12 to match item first/last hover */
    --k3-menu-gap-inner-radius: var(--k3-sys-shape-corner-medium); /* 12 */
    --k3-menu-pad: 0.25rem; /* 4 all sides */
    --k3-menu-item-gap: 0.125rem; /* 2 between items */
    --k3-menu-min-w: 7rem; /* 112 */
    --k3-menu-max-w: 17.5rem; /* 280 */
    /* Density 0 (default) — item 48 · inherited by items + flyouts */
    --k3-menu-density-item-h: 3rem;
    --k3-menu-bg: var(--k3-sys-color-surface-container-low);
    --k3-menu-fg: var(--k3-sys-color-on-surface);
    --k3-menu-item-fg: var(--k3-menu-fg);
    --k3-menu-item-selected-bg: var(--k3-sys-color-tertiary-container);
    --k3-menu-item-selected-fg: var(--k3-sys-color-on-tertiary-container);
    --k3-menu-item-icon-fg: var(--k3-sys-color-on-surface-variant);
    --k3-menu-elev: var(
      --k3-sys-elevation-level2,
      0 1px 2px rgb(0 0 0 / 0.3),
      0 2px 6px 2px rgb(0 0 0 / 0.15)
    );
  }

  /* Baseline — capture 7 · no gap · divider = 1px only (no band pad) */
  :host([variant='baseline']) {
    --k3-menu-radius: var(--k3-sys-shape-corner-extra-small); /* 4 */
    --k3-menu-surface-radius: var(--k3-sys-shape-corner-extra-small);
    --k3-menu-pad: 0;
    --k3-menu-item-gap: 0;
    --k3-menu-divider-band: 1px;
    --k3-menu-flyout-pad: 0;
    --k3-menu-flyout-gap: 0;
    --k3-menu-bg: var(--k3-sys-color-surface-container);
    /* Inherited by all items (root + nested flyouts) */
    --k3-menu-item-h: var(--k3-menu-density-item-h, 3rem);
    --k3-menu-item-radius: 0;
    --k3-menu-item-radius-selected: 0;
    --k3-menu-item-icon: 1.5rem; /* 24 */
    --k3-menu-item-pad-block: 0;
    --k3-menu-item-pad-inline: 0.75rem; /* 12 */
  }

  :host([color='vibrant']) {
    --k3-menu-bg: var(--k3-sys-color-tertiary-container);
    --k3-menu-fg: var(--k3-sys-color-on-tertiary-container);
    --k3-menu-item-fg: var(--k3-sys-color-on-tertiary-container);
    --k3-menu-item-icon-fg: var(--k3-sys-color-on-tertiary-container);
    --k3-menu-item-selected-bg: var(--k3-sys-color-tertiary);
    --k3-menu-item-selected-fg: var(--k3-sys-color-on-tertiary);
  }

  /* M3 density — shorter rows (padding); type stays label-large */
  :host([density='-1']),
  :host([density='compact']) {
    --k3-menu-density-item-h: 2.5rem; /* 40 */
  }
  :host([density='-2']) {
    --k3-menu-density-item-h: 2.25rem; /* 36 */
  }
  :host([density='-3']) {
    --k3-menu-density-item-h: 2rem; /* 32 */
  }

  /*
   * Gap surfaces — outer 16, inner (facing 2dp gap) 12.
   * Parent + submenu stay 16 (no morph).
   */
  :host([data-has-groups]) ::slotted(k3-menu-group:first-of-type) {
    --k3-menu-group-radius: var(--k3-menu-surface-radius)
      var(--k3-menu-surface-radius) var(--k3-menu-gap-inner-radius)
      var(--k3-menu-gap-inner-radius);
  }
  :host([data-has-groups]) ::slotted(k3-menu-group:last-of-type) {
    --k3-menu-group-radius: var(--k3-menu-gap-inner-radius)
      var(--k3-menu-gap-inner-radius) var(--k3-menu-surface-radius)
      var(--k3-menu-surface-radius);
  }
  :host([data-has-groups]) ::slotted(k3-menu-group:only-of-type) {
    --k3-menu-group-radius: var(--k3-menu-surface-radius);
  }
  :host([data-has-groups])
    ::slotted(k3-menu-group:not(:first-of-type):not(:last-of-type)) {
    --k3-menu-group-radius: var(--k3-menu-gap-inner-radius);
  }

  /* Connected — 0 gap, soft joins (overrides data-menu-edge hover radii) */
  :host([connected]) {
    --k3-menu-item-gap: 0;
  }
  :host([connected]:not([data-has-groups]):not([variant='baseline'])) ::slotted(k3-menu-item) {
    --k3-menu-item-radius: 0;
  }
  :host([connected]:not([data-has-groups]):not([variant='baseline']))
    ::slotted(k3-menu-item:first-child) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium) 0 0;
  }
  :host([connected]:not([data-has-groups]):not([variant='baseline']))
    ::slotted(k3-menu-item:last-child) {
    --k3-menu-item-radius: 0 0 var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium);
  }
  :host([connected]:not([data-has-groups]):not([variant='baseline']))
    ::slotted(k3-menu-item:only-child) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium);
  }

  .panel {
    position: absolute;
    z-index: 50;
    box-sizing: border-box;
    width: max-content;
    min-width: var(--k3-menu-min-w);
    max-width: min(var(--k3-menu-max-w), 90vw);
    overflow: visible;
    /* !important: keep pad token authoritative vs host resets */
    padding: var(--k3-menu-pad) !important;
    border-radius: var(--k3-menu-radius);
    background: var(--k3-menu-bg);
    color: var(--k3-menu-fg);
    box-shadow: var(--k3-menu-elev);
    pointer-events: none;
  }
  .panel.bottom-start,
  .panel.bottom,
  .panel.bottom-end {
    transform-origin: top center;
  }
  .panel.top,
  .panel.top-start,
  .panel.top-end {
    transform-origin: bottom center;
  }
  .panel.end-start,
  .panel.end-end,
  .panel.start-start,
  .panel.start-end {
    transform-origin: top center;
  }
  .panel[data-fitted][data-flip='above'] {
    transform-origin: bottom center;
  }
  /* Keyboard trap host — no item highlight until ↑↓ / Tab */
  .panel:focus,
  .panel:focus-visible {
    outline: none;
  }
  .panel.open {
    pointer-events: auto;
  }
  /*
   * Viewport-fitted — JS sets position:fixed + top/left (menu-fit.ts).
   * Absolute placement must NOT apply while fitted (same specificity would
   * override inset:auto and detach the panel from the trigger).
   */
  .panel[data-fitted] {
    /* Placement comes only from inline top/left/right set by menu-fit.ts */
    position: fixed;
  }
  .panel.bottom-start,
  .panel.bottom {
    top: calc(100% + 0.25rem);
    inset-inline-start: 0;
  }
  .panel.bottom-end {
    top: calc(100% + 0.25rem);
    inset-inline-end: 0;
  }
  .panel.top-start,
  .panel.top {
    bottom: calc(100% + 0.25rem);
    inset-inline-start: 0;
  }
  .panel.top-end {
    bottom: calc(100% + 0.25rem);
    inset-inline-end: 0;
  }
  /* Side of trigger — nav-rail / anchored flyouts */
  .panel.end-start {
    top: 0;
    inset-inline-start: calc(100% + 0.5rem); /* 8dp gap */
  }
  .panel.end-end {
    bottom: 0;
    inset-inline-start: calc(100% + 0.5rem);
  }
  .panel.start-start {
    top: 0;
    inset-inline-end: calc(100% + 0.5rem);
  }
  .panel.start-end {
    bottom: 0;
    inset-inline-end: calc(100% + 0.5rem);
  }

  /*
   * Scrollport — cap tall menus; class `k3-scroll` (edgeScrollbarStyles)
   * provides the discreet thumb (no Windows arrows). overflow-y comes from
   * that class; keep max-height here.
   */
  .list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--k3-menu-item-gap);
    max-height: min(28rem, 75vh); /* room for dual-line items (L1+en-US) */
  }
  /* Submenus use position:fixed — don’t clip while a flyout is open */
  :host([data-submenu-open]) .list {
    overflow: visible;
  }

  /*
   * Gap stack — no filter on elev (filter = containing block → broken flyouts).
   * Soft box-shadow lives on each k3-menu-group instead.
   */
  :host([data-has-groups]) .panel {
    background: transparent;
    box-shadow: none;
    padding: 0 !important;
    min-width: 0;
    overflow: visible;
  }
  :host([data-has-groups]) .list {
    gap: 0;
    min-width: 0;
    overflow: visible;
  }
  :host([data-has-groups]) ::slotted([data-k3-menu-elev]) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem; /* 2 dp transparent between surfaces */
    width: max-content;
    min-width: var(--k3-menu-min-w);
  }
`,
];
