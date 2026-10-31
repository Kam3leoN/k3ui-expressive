import { css } from 'lit';
import { FabMenuSpecs } from './fab-menu.specs.js';

/**
 * Styles for `k3-fab-menu`.
 * Host = FAB footprint · menu absolute (`data-menu-side`) · trigger pin mirrors side.
 */
export const fabMenuStyles = css`
  :host {
    --k3-fab-menu-edge: ${FabMenuSpecs.edgeDp}px;
    --k3-fab-menu-gap: ${FabMenuSpecs.gapDp}px;
    --k3-fab-menu-fab-gap: ${FabMenuSpecs.fabGapDp}px;
    --k3-fab-slot-size: 3.5rem;
    --k3-fab-menu-origin: right center;
    --k3-fab-menu-item-container: var(--k3-sys-color-primary-container);
    --k3-fab-menu-item-on-container: var(--k3-sys-color-on-primary-container);

    /* Host = FAB footprint only; menu overlays so trigger never shifts. */
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    width: max-content;
    height: var(--k3-fab-slot-size);
    overflow: visible;
    z-index: 20;
  }

  :host([size='small']) {
    --k3-fab-slot-size: 2.5rem;
  }
  :host([size='medium']) {
    --k3-fab-slot-size: 5rem;
  }
  :host([size='large']) {
    --k3-fab-slot-size: 6rem;
  }
  :host(:dir(rtl)) {
    --k3-fab-menu-origin: left center;
  }

  /* ── Variant colors ── */
  :host([variant='primary']) k3-fab {
    --k3-fab-bg: var(--k3-sys-color-primary);
    --k3-fab-fg: var(--k3-sys-color-on-primary);
  }
  :host([variant='secondary']) {
    --k3-fab-menu-item-container: var(--k3-sys-color-secondary-container);
    --k3-fab-menu-item-on-container: var(--k3-sys-color-on-secondary-container);
  }
  :host([variant='secondary']) k3-fab {
    --k3-fab-bg: var(--k3-sys-color-secondary);
    --k3-fab-fg: var(--k3-sys-color-on-secondary);
  }
  :host([variant='tertiary']) {
    --k3-fab-menu-item-container: var(--k3-sys-color-tertiary-container);
    --k3-fab-menu-item-on-container: var(--k3-sys-color-on-tertiary-container);
  }
  :host([variant='tertiary']) k3-fab {
    --k3-fab-bg: var(--k3-sys-color-tertiary);
    --k3-fab-fg: var(--k3-sys-color-on-tertiary);
  }
  :host([variant='surface']) {
    --k3-fab-menu-item-container: var(--k3-sys-color-surface-container-highest);
    --k3-fab-menu-item-on-container: var(--k3-sys-color-primary);
  }

  :host([placement='bottom-start']),
  :host([placement='top-start']) {
    align-items: flex-start;
    --k3-fab-menu-origin: left center;
  }
  :host(:dir(rtl)[placement='bottom-start']),
  :host(:dir(rtl)[placement='top-start']) {
    --k3-fab-menu-origin: right center;
  }

  /* ── Corner dock (16dp) + nav-bar lift · sheet/dialog via fab-visibility ── */
  :host([fixed]) {
    position: fixed;
    inset-inline-end: var(--k3-fab-menu-edge);
    inset-inline-start: auto;
    bottom: calc(
      var(--k3-fab-menu-edge) + var(--k3-nav-chrome-inset-block-end, 0px)
    );
    top: auto;
    z-index: 1100;
    transition:
      bottom var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1)),
      visibility var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
  }
  :host([fixed][contained]) {
    position: absolute;
    z-index: 20;
    transition: none;
  }
  :host([fixed][placement='bottom-start']),
  :host([fixed][placement='top-start']) {
    inset-inline-end: auto;
    inset-inline-start: var(--k3-fab-menu-edge);
  }
  :host([fixed][placement='top-end']),
  :host([fixed][placement='top-start']) {
    bottom: auto;
    top: var(--k3-fab-menu-edge);
  }

  /*
   * Menu overlay — natural height (no clip max-height).
   * Clamping height + overflow:visible packed from the far edge and spilled
   * pills into the FAB. Flip side instead; pack toward the trigger.
   */
  .menu {
    position: absolute;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end; /* above: last pill sits on the FAB gap */
    gap: var(--k3-fab-menu-gap);
    width: max-content;
    max-width: none;
    max-height: min(${FabMenuSpecs.menuMaxHeightDp / 16}rem, calc(100vh - 8rem));
    pointer-events: none;
    transform-origin: var(--k3-fab-menu-origin);
    overflow: visible;
    inset-inline-end: 0;
    inset-inline-start: auto;
    bottom: calc(100% + var(--k3-fab-menu-fab-gap));
    top: auto;
  }
  :host([data-menu-side='below']) .menu {
    top: calc(100% + var(--k3-fab-menu-fab-gap));
    bottom: auto;
    justify-content: flex-start; /* below: first pill sits on the FAB gap */
  }
  :host([placement='bottom-start']) .menu,
  :host([placement='top-start']) .menu {
    align-items: flex-start;
    inset-inline-end: auto;
    inset-inline-start: 0;
  }
  /* Preferred below (top-* placements) until flip sets data-menu-side */
  :host([placement='top-end']:not([data-menu-side])) .menu,
  :host([placement='top-start']:not([data-menu-side])) .menu {
    top: calc(100% + var(--k3-fab-menu-fab-gap));
    bottom: auto;
    justify-content: flex-start;
  }
  :host([placement='top-end'][data-menu-side='above']) .menu,
  :host([placement='top-start'][data-menu-side='above']) .menu {
    bottom: calc(100% + var(--k3-fab-menu-fab-gap));
    top: auto;
    justify-content: flex-end;
  }

  .menu.open {
    pointer-events: auto;
    overflow: visible;
  }
  .menu.closing {
    pointer-events: none;
  }

  /* Hard collapse after close-end only (kills GPU ghost arcs). */
  .menu:not(.open) {
    visibility: hidden;
    opacity: 0;
    width: 0;
    height: 0;
    min-width: 0;
    min-height: 0;
    margin: 0;
    gap: 0;
    overflow: hidden;
    pointer-events: none;
  }

  ::slotted(k3-fab-menu-item) {
    display: block;
    width: max-content !important;
    max-width: ${FabMenuSpecs.itemMaxWidthDp / 16}rem;
    flex: 0 0 auto;
    align-self: flex-end;
  }
  :host([placement='bottom-start']) ::slotted(k3-fab-menu-item),
  :host([placement='top-start']) ::slotted(k3-fab-menu-item) {
    align-self: flex-start;
  }

  /*
   * FAB slot — closed footprint kept.
   * Vertical pin follows menu side so soft→56 retracts TOWARD the pills
   * (above → pin top · below → pin bottom). Horizontal pin = placement only.
   * Apply data-menu-side before size morph (FAB still fills slot → no jump).
   */
  .fab-slot {
    position: relative;
    z-index: 0;
    display: flex;
    box-sizing: border-box;
    align-items: flex-start;
    justify-content: flex-end;
    width: var(--k3-fab-slot-size);
    height: var(--k3-fab-slot-size);
    flex-shrink: 0;
    overflow: visible;
  }
  :host([data-menu-side='below']) .fab-slot,
  :host([placement='top-end']:not([data-menu-side])) .fab-slot,
  :host([placement='top-start']:not([data-menu-side])) .fab-slot {
    align-items: flex-end;
  }
  .fab-slot:focus-within {
    z-index: 4;
  }
  :host([placement='bottom-start']) .fab-slot,
  :host([placement='top-start']) .fab-slot {
    justify-content: flex-start;
  }

  /*
   * Trigger icon — plus/edit stays still; only the × spins on itself.
   * (Rotating the shared wrapper flipped the pencil and looked like late clip.)
   */
  .trigger-icon {
    position: relative;
    display: grid;
    place-items: center;
    place-content: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    line-height: 0;
  }
  /* Wrapper name kept for part= API; only .icon-face.close rotates. */
  .icon-rotator {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .icon-face {
    grid-area: 1 / 1;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: inherit;
    font-weight: normal;
    line-height: 1;
    color: inherit;
    speak: never;
    transition: opacity ${FabMenuSpecs.closeTriggerMs}ms
      var(--k3-sys-motion-easing-effects-fast, cubic-bezier(0.2, 0, 0, 1));
  }
  .icon-face.plus {
    opacity: 1;
  }
  .icon-face.close {
    opacity: 0;
    pointer-events: none;
    transform: rotate(0deg);
  }
  .icon-rotator.expanded .icon-face.plus {
    opacity: 0;
  }
  .icon-rotator.expanded .icon-face.close {
    opacity: 1;
    pointer-events: auto;
  }
  /* × only — half-turn (glyph is 180°-symmetric) */
  .icon-rotator.opening .icon-face.close {
    transition: none;
    animation: k3-fab-menu-close-spin-in ${FabMenuSpecs.closeTriggerMs}ms
      var(--k3-sys-motion-easing-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9)) both;
  }
  .icon-rotator.closing .icon-face.close {
    transition: none;
    pointer-events: none;
    animation: k3-fab-menu-close-spin-out ${FabMenuSpecs.closeTriggerMs}ms
      var(--k3-sys-motion-easing-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9)) both;
  }
  :host(:dir(rtl)) .icon-rotator.opening .icon-face.close {
    animation-name: k3-fab-menu-close-spin-out;
  }
  :host(:dir(rtl)) .icon-rotator.closing .icon-face.close {
    animation-name: k3-fab-menu-close-spin-in;
  }
  @keyframes k3-fab-menu-close-spin-in {
    from {
      opacity: 0;
      transform: rotate(0.5turn);
    }
    to {
      opacity: 1;
      transform: rotate(0deg);
    }
  }
  @keyframes k3-fab-menu-close-spin-out {
    from {
      opacity: 1;
      transform: rotate(0deg);
    }
    to {
      opacity: 0;
      transform: rotate(0.5turn);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .icon-face {
      transition: none;
    }
    .icon-rotator.opening .icon-face.close,
    .icon-rotator.closing .icon-face.close {
      animation: none;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
