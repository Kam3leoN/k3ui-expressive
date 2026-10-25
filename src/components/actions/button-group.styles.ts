import { css, unsafeCSS } from 'lit';
import {
  ButtonGroupConnectedCornerDp,
  ButtonGroupConnectedGapDp,
  ButtonGroupConnectedMinWidthDp,
  ButtonGroupConnectedPressedInnerDp,
  ButtonGroupStandardGapDp,
} from './button-group.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const gXs = rem(ButtonGroupStandardGapDp.xs);
const gSm = rem(ButtonGroupStandardGapDp.sm);
const gMd = rem(ButtonGroupStandardGapDp.md);
const gLg = rem(ButtonGroupStandardGapDp.lg);
const gXl = rem(ButtonGroupStandardGapDp.xl);

const cXs = rem(ButtonGroupConnectedCornerDp.xs);
const cSm = rem(ButtonGroupConnectedCornerDp.sm);
const cMd = rem(ButtonGroupConnectedCornerDp.md);
const cLg = rem(ButtonGroupConnectedCornerDp.lg);
const cXl = rem(ButtonGroupConnectedCornerDp.xl);

const connectedGap = rem(ButtonGroupConnectedGapDp);
const connectedMinW = rem(ButtonGroupConnectedMinWidthDp);
const pressedInner = rem(ButtonGroupConnectedPressedInnerDp);

/**
 * Styles for `k3-button-group` — [M3 specs](https://m3.material.io/components/button-groups/specs).
 *
 * @see ./button-group.specs.ts
 */
export const buttonGroupStyles = css`
  :host {
    /* Invisible container — spacing + shape only (no color) */
    display: inline-flex;
    max-width: 100%;
    vertical-align: middle;
    --k3-btn-group-gap: ${gSm};
    --k3-btn-group-corner: ${cSm};
    --k3-btn-group-inner: ${cSm};
    --k3-btn-group-inner-pressed: ${pressedInner};
    --k3-btn-group-outer: var(--k3-btn-corner); /* round default = CornerFull */
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }

  /* ── Size tokens (standard gap + connected corners) ── */
  :host([size='xs']) {
    --k3-btn-group-gap: ${gXs};
    --k3-btn-group-corner: ${cXs};
    --k3-btn-group-inner: ${cXs};
  }
  :host([size='sm']) {
    --k3-btn-group-gap: ${gSm};
    --k3-btn-group-corner: ${cSm};
    --k3-btn-group-inner: ${cSm};
  }
  :host([size='md']) {
    --k3-btn-group-gap: ${gMd};
    --k3-btn-group-corner: ${cMd};
    --k3-btn-group-inner: ${cMd};
  }
  :host([size='lg']) {
    --k3-btn-group-gap: ${gLg};
    --k3-btn-group-corner: ${cLg};
    --k3-btn-group-inner: ${cLg};
  }
  :host([size='xl']) {
    --k3-btn-group-gap: ${gXl};
    --k3-btn-group-corner: ${cXl};
    --k3-btn-group-inner: ${cXl};
  }

  .group {
    /* Stacking context so :focus-within z-index on children paints above neighbors */
    position: relative;
    isolation: isolate;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    box-sizing: border-box;
    max-width: 100%;
    width: max-content;
    gap: var(--k3-btn-group-gap);
    /* Clip press-morph overshoot so shells never paint past the pinned row */
    overflow: hidden;
  }

  :host([orientation='vertical']) .group {
    flex-direction: column;
    align-items: stretch;
  }

  /* ── Standard — between-space per size · shapes preserved ── */
  :host([variant='standard']) .group {
    gap: var(--k3-btn-group-gap);
  }

  :host([variant='standard']) ::slotted(k3-button) {
    flex: 0 0 auto;
    min-width: 0;
    overflow: visible;
    /*
     * Width morph — FastSpatial *duration* (350ms) + effects easing (no overshoot).
     * Spatial-fast bounce would briefly exceed the pinned .group width (Meet glitch).
     * Shape morph on the button itself still uses spatial-fast bounce.
     */
    transition:
      width var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      min-width var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      max-width var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  /* Icon buttons — square paint + ≥48dp target; no width morph */
  :host([variant='standard']) ::slotted(k3-icon-button) {
    flex: 0 0 auto;
    align-self: center;
    overflow: visible;
  }

  /* Snap-clear press widths without a one-frame flash */
  :host([data-press-snap]) ::slotted(k3-button),
  :host([data-press-snap]) ::slotted(k3-icon-button) {
    transition: none !important;
  }

  :host([equal-width][variant='standard']) ::slotted(k3-button),
  :host([equal-width][variant='standard']) ::slotted(k3-icon-button) {
    flex: 1 1 0;
  }

  /* ── Connected — 2dp · no width morph ── */
  :host([variant='connected']) {
    display: inline-flex;
    width: auto;
    max-width: 100%;
  }
  :host([variant='connected'][equal-width]) {
    display: flex;
    width: 100%;
  }
  :host([variant='connected']) .group {
    gap: ${connectedGap};
    align-items: stretch;
  }
  :host([variant='connected'][equal-width]) .group {
    width: 100%;
    flex: 1 1 auto;
  }

  :host([variant='connected']) ::slotted(k3-button),
  :host([variant='connected']) ::slotted(k3-icon-button) {
    flex: 0 0 auto;
    min-width: ${connectedMinW};
  }
  :host([variant='connected'][equal-width]) ::slotted(k3-button),
  :host([variant='connected'][equal-width]) ::slotted(k3-icon-button) {
    flex: 1 1 0;
    width: 0;
    min-width: ${connectedMinW};
  }

  /*
   * Round connected — outer CornerFull · inner per size (4/8/8/16/20)
   * Square connected — outer per size (first L / last R) · facing seams 4dp
   */
  :host([variant='connected'][shape='round']),
  :host([variant='connected']:not([shape])) {
    --k3-btn-group-outer: var(--k3-btn-corner);
    --k3-btn-group-inner: var(--k3-btn-group-corner);
  }
  :host([variant='connected'][shape='square']) {
    --k3-btn-group-outer: var(--k3-btn-group-corner);
    --k3-btn-group-inner: var(--k3-btn-group-inner-pressed); /* 4dp seams */
  }

  /* Default: all corners = inner (middle segments / facing edges) */
  :host([variant='connected']) ::slotted(k3-button),
  :host([variant='connected']) ::slotted(k3-icon-button) {
    --k3-btn-rss: var(--k3-btn-group-inner);
    --k3-btn-rse: var(--k3-btn-group-inner);
    --k3-btn-ree: var(--k3-btn-group-inner);
    --k3-btn-res: var(--k3-btn-group-inner);
  }

  /* Leading — outer start more pronounced, facing end = inner */
  :host([variant='connected']) ::slotted([data-bg='first']) {
    --k3-btn-rss: var(--k3-btn-group-outer);
    --k3-btn-res: var(--k3-btn-group-outer);
    --k3-btn-rse: var(--k3-btn-group-inner);
    --k3-btn-ree: var(--k3-btn-group-inner);
  }

  /* Trailing — outer end more pronounced, facing start = inner */
  :host([variant='connected']) ::slotted([data-bg='last']) {
    --k3-btn-rse: var(--k3-btn-group-outer);
    --k3-btn-ree: var(--k3-btn-group-outer);
    --k3-btn-rss: var(--k3-btn-group-inner);
    --k3-btn-res: var(--k3-btn-group-inner);
  }

  :host([variant='connected']) ::slotted([data-bg='only']) {
    --k3-btn-rss: var(--k3-btn-group-outer);
    --k3-btn-rse: var(--k3-btn-group-outer);
    --k3-btn-ree: var(--k3-btn-group-outer);
    --k3-btn-res: var(--k3-btn-group-outer);
  }

  /* Pressed — facing edges → 4dp (already 4dp for square) */
  :host([variant='connected']) ::slotted([data-pressed][data-bg='first']) {
    --k3-btn-rse: var(--k3-btn-group-inner-pressed);
    --k3-btn-ree: var(--k3-btn-group-inner-pressed);
  }
  :host([variant='connected']) ::slotted([data-pressed][data-bg='last']) {
    --k3-btn-rss: var(--k3-btn-group-inner-pressed);
    --k3-btn-res: var(--k3-btn-group-inner-pressed);
  }
  :host([variant='connected']) ::slotted([data-pressed][data-bg='middle']) {
    --k3-btn-rss: var(--k3-btn-group-inner-pressed);
    --k3-btn-rse: var(--k3-btn-group-inner-pressed);
    --k3-btn-ree: var(--k3-btn-group-inner-pressed);
    --k3-btn-res: var(--k3-btn-group-inner-pressed);
  }

  /*
   * Selected — shape of *this* button only (no neighbor width change).
   * Round: stadium (50%). Square: keep outer pronounced + inner 4dp (color only).
   */
  :host([variant='connected'][shape='round']) ::slotted([selected]),
  :host([variant='connected']:not([shape])) ::slotted([selected]) {
    --k3-btn-rss: var(--k3-btn-corner);
    --k3-btn-rse: var(--k3-btn-corner);
    --k3-btn-ree: var(--k3-btn-corner);
    --k3-btn-res: var(--k3-btn-corner);
  }
  :host([variant='connected'][shape='square']) ::slotted([selected]) {
    --k3-btn-rss: var(--k3-btn-group-inner);
    --k3-btn-rse: var(--k3-btn-group-inner);
    --k3-btn-ree: var(--k3-btn-group-inner);
    --k3-btn-res: var(--k3-btn-group-inner);
  }
  :host([variant='connected'][shape='square']) ::slotted([selected][data-bg='first']) {
    --k3-btn-rss: var(--k3-btn-group-outer);
    --k3-btn-res: var(--k3-btn-group-outer);
    --k3-btn-rse: var(--k3-btn-group-inner);
    --k3-btn-ree: var(--k3-btn-group-inner);
  }
  :host([variant='connected'][shape='square']) ::slotted([selected][data-bg='last']) {
    --k3-btn-rse: var(--k3-btn-group-outer);
    --k3-btn-ree: var(--k3-btn-group-outer);
    --k3-btn-rss: var(--k3-btn-group-inner);
    --k3-btn-res: var(--k3-btn-group-inner);
  }
`;
