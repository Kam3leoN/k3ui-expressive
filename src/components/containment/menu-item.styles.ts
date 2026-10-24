import { css, type CSSResultGroup } from 'lit';
import { enterScaleY } from '../../motion/enter.js';

/**
 * Styles for `k3-menu-item` — row, divider, gap marker, submenu flyout.
 *
 * Vertical (M3e): item 48 · pad 12 · icon↔label 8 · hover 4 · selected 12.
 * Baseline: full-bleed radius 0 (via :host-context — nested flyout items too).
 * Flyout enter via shared `enterScaleY` (M3E scaleY + spatial spring).
 */
export const menuItemStyles: CSSResultGroup = [
  enterScaleY('.flyout', ':host([submenu-open]) .flyout[data-placed]', {
    origin: 'top left',
  }),
  css`
  :host {
    position: relative;
    display: block;
    box-sizing: border-box;
    width: 100%;
    /* Height from parent menu density (0 → 48 · -3 → 32) */
    --k3-menu-item-h: var(--k3-menu-density-item-h, 3rem);
    /* Hover / resting — 4dp (middle). First/last override via data-menu-edge. */
    --k3-menu-item-radius: var(--k3-sys-shape-corner-extra-small); /* 4 */
    --k3-menu-item-radius-selected: var(--k3-sys-shape-corner-medium); /* 12 */
    --k3-menu-item-icon: 1.25rem; /* 20 trailing / leading */
    --k3-menu-item-gap: 0.5rem; /* 8 icon↔label */
    --k3-menu-item-pad-block: 0;
    --k3-menu-item-pad-inline: 0.75rem; /* 12 before icon/content */
  }

  /*
   * Hover edge morph (M3e vertical) — middle stays 4dp.
   * First / last (incl. against divider="gap") → 12 on the outer end.
   */
  :host([data-menu-edge='first']),
  :host([data-menu-edge='gap-first']) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium) var(--k3-sys-shape-corner-extra-small)
      var(--k3-sys-shape-corner-extra-small); /* 12 12 4 4 */
  }
  :host([data-menu-edge='last']),
  :host([data-menu-edge='gap-last']) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-extra-small)
      var(--k3-sys-shape-corner-extra-small) var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium); /* 4 4 12 12 */
  }
  :host([data-menu-edge='only']),
  :host([data-menu-edge='gap-only-start']),
  :host([data-menu-edge='gap-only-end']),
  :host([data-menu-edge='gap-only-mid']) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium); /* 12 */
  }

  /*
   * Baseline — full-bleed hover/selected (radius 0), including nested
   * submenu items (they are not ::slotted into k3-menu, so host-context).
   */
  :host-context(k3-menu[variant='baseline']),
  :host-context(k3-menu[variant='baseline'])[data-menu-edge] {
    --k3-menu-item-h: var(--k3-menu-density-item-h, 3rem);
    --k3-menu-item-radius: 0;
    --k3-menu-item-radius-selected: 0;
    --k3-menu-item-icon: 1.5rem; /* 24 */
    --k3-menu-item-pad-block: 0;
    --k3-menu-item-pad-inline: 0.75rem;
    --k3-menu-divider-band: 1px;
    --k3-menu-flyout-pad: 0;
    --k3-menu-flyout-gap: 0;
    --k3-menu-surface-radius: var(--k3-sys-shape-corner-extra-small);
  }

  :host([divider]),
  :host([gap]) {
    pointer-events: none;
  }

  /* Divider — 1dp line · band 8 (vertical) · baseline overrides band to 1px */
  .divider {
    box-sizing: border-box;
    height: var(--k3-menu-divider-band, 0.5rem);
    margin: 0;
    padding: 0;
    border: 0;
    background: linear-gradient(
        var(--k3-sys-color-outline-variant),
        var(--k3-sys-color-outline-variant)
      )
      center / auto 1px no-repeat;
    background-clip: content-box;
    padding-inline: var(--k3-menu-divider-inset, 0.75rem);
  }

  /*
   * Gap marker — removed when menu promotes siblings into elevated
   * surfaces (2dp transparent gap · each surface keeps pad 4).
   */
  .gap {
    height: 0.125rem; /* 2 — fallback if not normalized */
    margin: 0;
    padding: 0;
    flex-shrink: 0;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--k3-menu-item-gap);
    box-sizing: border-box;
    width: 100%;
    min-height: var(--k3-menu-item-h);
    height: var(--k3-menu-item-h);
    padding: var(--k3-menu-item-pad-block) var(--k3-menu-item-pad-inline);
    border: 0;
    border-radius: var(--k3-menu-item-radius);
    background: transparent;
    color: var(--k3-menu-item-fg, var(--k3-sys-color-on-surface));
    font-family: var(--k3-ref-typeface-plain, inherit);
    /* M3 menu label — label-large / 500 (not body-large / 400) */
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    text-align: start;
    cursor: pointer;
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial),
      background-color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }

  .item:hover {
    outline: none;
  }

  /*
   * Focus — visible keyboard state layer.
   * Shared k3-state-layer hides focus (nav destinations); menus need it.
   */
  .item:focus-visible {
    outline: none;
  }
  .item:focus-visible::after {
    opacity: var(--k3-sys-state-focus-opacity, 0.12);
  }

  /* Selected — 12dp all corners + tertiary fill */
  :host([selected]) .item {
    background: var(--k3-menu-item-selected-bg, var(--k3-sys-color-tertiary-container));
    color: var(--k3-menu-item-selected-fg, var(--k3-sys-color-on-tertiary-container));
    border-radius: var(--k3-menu-item-radius-selected);
  }

  /*
   * Submenu open — same fill as selected, but keep first/last hover radii
   * (e.g. last → 4 top · 12 bottom).
   */
  :host([submenu-open]:not([selected])) .item {
    background: var(--k3-menu-item-selected-bg, var(--k3-sys-color-tertiary-container));
    color: var(--k3-menu-item-selected-fg, var(--k3-sys-color-on-tertiary-container));
  }
  :host([submenu-open]:not([selected])) .icon,
  :host([submenu-open]:not([selected])) .supporting {
    color: inherit;
  }

  :host([disabled]) .item {
    opacity: 0.38;
    pointer-events: none;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-menu-item-icon);
    height: var(--k3-menu-item-icon);
    font-size: var(--k3-menu-item-icon);
    color: var(--k3-menu-item-icon-fg, var(--k3-sys-color-on-surface-variant));
    flex-shrink: 0;
  }
  .icon:not(.has) {
    display: none;
  }
  :host([selected]) .icon {
    color: inherit;
  }
  ::slotted([slot='icon']) {
    display: inline-flex !important;
    place-items: center !important;
    box-sizing: border-box !important;
    width: var(--k3-menu-item-icon) !important;
    height: var(--k3-menu-item-icon) !important;
    font-size: var(--k3-menu-item-icon) !important;
    line-height: 1 !important;
    overflow: hidden !important;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif !important;
    font-feature-settings: 'liga' !important;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24 !important;
  }
  /* Flag / image icons — square crop + 4dp radius, no MS ligature force */
  ::slotted(img[slot='icon']),
  ::slotted(.flag-icon) {
    display: block !important;
    object-fit: cover !important;
    overflow: hidden !important;
    border-radius: 0.25rem !important; /* 4dp */
    font-family: inherit !important;
    font-size: 0 !important;
    color: transparent !important;
    line-height: 0 !important;
  }

  .label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.125rem; /* 2 — label ↔ supporting */
    flex: 1 1 auto;
    min-width: 0;
  }
  /* Primary line — title + optional badge stay on one row */
  .label > span:first-child {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem; /* 8 */
    min-width: 0;
  }
  .supporting {
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    font-weight: 400;
    line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
    letter-spacing: var(--k3-sys-typescale-body-small-tracking, 0.025rem);
    color: var(--k3-menu-item-icon-fg, var(--k3-sys-color-on-surface-variant));
  }
  .supporting:not(.has) {
    display: none;
  }
  :host([selected]) .supporting {
    color: inherit;
    opacity: 0.8;
  }
  /*
   * Two-line item (slot supporting-text) — M3 allows this; caution is about
   * nested interactive controls, not a second text line.
   */
  :host([data-supporting]) .item {
    height: auto;
    min-height: max(3rem, var(--k3-menu-item-h));
    padding-block: 0.5rem; /* 8 — keep ≥48 hit target with two lines */
  }

  .trailing {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem; /* 8 — shortcut↔chevron */
    flex: 0 0 auto;
    margin-inline-start: auto;
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    color: var(--k3-menu-item-icon-fg, var(--k3-sys-color-on-surface-variant));
  }
  .trailing:not(.has) {
    display: none;
  }
  .shortcut {
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    letter-spacing: 0.04em;
    white-space: nowrap;
    opacity: 0.8;
  }
  .chevron,
  .check {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-menu-item-icon);
    line-height: 1;
    width: var(--k3-menu-item-icon);
    text-align: center;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 20;
  }
  /* Submenu opens toward start in RTL — mirror the chevron */
  :host(:dir(rtl)) .chevron {
    transform: scaleX(-1);
  }

  /*
   * Submenu flyout — position:fixed; slightly overlaps parent (M3e).
   * Enter motion via shared enterScaleY (.flyout / [data-placed]).
   */
  .flyout {
    position: fixed;
    z-index: 70;
    box-sizing: border-box;
    width: max-content;
    min-width: 7rem;
    max-width: min(17.5rem, 90vw);
    padding: var(--k3-menu-flyout-pad, 0.25rem) !important; /* 4 · 0 baseline */
    border-radius: var(--k3-menu-surface-radius, var(--k3-sys-shape-corner-large)); /* 16 */
    background: var(--k3-menu-bg, var(--k3-sys-color-surface-container-low));
    color: var(--k3-menu-fg, var(--k3-sys-color-on-surface));
    box-shadow: var(
      --k3-menu-elev,
      0 1px 2px rgb(0 0 0 / 0.3),
      0 2px 6px 2px rgb(0 0 0 / 0.15)
    );
    /* Always flex — display:none kills enter/exit transitions */
    display: flex;
    flex-direction: column;
    gap: var(--k3-menu-flyout-gap, 0.125rem); /* 2 · 0 baseline */
    overflow: hidden; /* clip full-bleed hover to surface radius */
    visibility: hidden;
    pointer-events: none;
    transition: visibility 0s linear var(--k3-sys-motion-duration-spatial-fast);
  }
  .flyout[data-origin='end'] {
    transform-origin: top right;
  }
  .flyout[data-origin='start'] {
    transform-origin: top left;
  }
  :host([submenu-open]) .flyout {
    visibility: visible;
    transition: visibility 0s;
  }
  :host([submenu-open]) .flyout[data-placed] {
    pointer-events: auto;
  }
`,
];
