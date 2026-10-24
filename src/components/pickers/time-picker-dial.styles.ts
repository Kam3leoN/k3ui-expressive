import { css } from 'lit';

/**
 * Clock dial — Matraic/M3 geometry:
 * numeral 40, inset 4 → outer radius 104; inner = outer − 40.
 */
export const timePickerDialStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    --_dial-size: 16rem; /* 256 */
    --_numeral-size: 2.5rem; /* 40 — Matraic (thumb + hit) */
    --_dial-inset: 0.25rem; /* 4 */
    --_handle-track: 2px;
    --_center-size: 0.5rem; /* 8 */
    --_numeral-radius: calc(
      var(--_dial-size) / 2 - var(--_numeral-size) / 2 - var(--_dial-inset)
    ); /* 104 */
  }
  .base {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--k3-sys-color-surface-container-highest);
    touch-action: none;
    user-select: none;
    cursor: grab;
  }
  .base.dragging {
    cursor: grabbing;
  }
  .center {
    position: absolute;
    bottom: calc(50% - var(--_center-size) / 2);
    left: calc(50% - var(--_center-size) / 2);
    width: var(--_center-size);
    height: var(--_center-size);
    border-radius: 50%;
    background: var(--k3-sys-color-primary);
    pointer-events: none;
    z-index: 2;
  }
  .handle {
    position: absolute;
    left: calc(50% - var(--_handle-track) / 2);
    width: var(--_handle-track);
    transform-origin: bottom center;
    transform: rotate(calc(var(--_hand-angle, 0) * 1deg));
    background: var(--k3-sys-color-primary);
    pointer-events: none;
    z-index: 1;
    transition: transform var(--k3-sys-motion-duration-spatial-fast)
      var(--k3-sys-motion-easing-expressive-spatial);
  }
  .base.dragging .handle {
    transition: none;
  }
  /* Outer ring — track ends at numeral center */
  .handle:not(.inner) {
    top: calc(var(--_dial-inset) + var(--_numeral-size));
    height: calc(50% - var(--_dial-inset) - var(--_numeral-size));
  }
  /* Inner ring — one numeral inward (Matraic) */
  .handle.inner {
    top: calc(var(--_numeral-size) + var(--_dial-inset) + var(--_numeral-size));
    height: calc(50% - var(--_numeral-size) - var(--_dial-inset) - var(--_numeral-size));
  }
  /* Thumb — always visible, sits on numeral */
  .handle::before {
    content: '';
    position: absolute;
    width: var(--_numeral-size);
    height: var(--_numeral-size);
    top: calc(0px - var(--_numeral-size));
    left: calc(0px - var(--_numeral-size) / 2 + var(--_handle-track) / 2);
    border-radius: 50%;
    background: var(--k3-sys-color-primary);
    box-sizing: border-box;
  }
  .dial {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .dial.hidden {
    visibility: hidden;
  }
  .numeral {
    position: absolute;
    inset: 50%;
    translate: -50% -50%;
    width: var(--_numeral-size);
    height: var(--_numeral-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-large-size);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    transform: rotate(var(--_numeral-angle)) translateY(calc(-1 * var(--_numeral-radius)))
      rotate(calc(-1 * var(--_numeral-angle)));
    pointer-events: none;
    z-index: 3;
  }
  /* Inner = outer radius − numeral size */
  .numeral.inner {
    font-size: var(--k3-sys-typescale-body-small-size);
    color: var(--k3-sys-color-on-surface-variant);
    transform: rotate(var(--_numeral-angle))
      translateY(calc(-1 * var(--_numeral-radius) + var(--_numeral-size)))
      rotate(calc(-1 * var(--_numeral-angle)));
  }
  .numeral.active {
    color: var(--k3-sys-color-on-primary);
  }
  .numeral.disabled {
    opacity: 0.38;
  }
`;
