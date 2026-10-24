import { css } from 'lit';

/**
 * M3 Expressive slider chrome — geometry via CSS vars from size tokens.
 * @see https://m3.material.io/components/sliders/specs
 */
export const sliderStyles = css`
  :host {
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    --k3-slider-track: var(--k3-sys-color-secondary-container);
    --k3-slider-active: var(--k3-sys-color-primary);
    --k3-slider-handle: var(--k3-sys-color-primary);
    --k3-slider-stop: var(--k3-sys-color-on-secondary-container);
    --k3-slider-stop-on-active: var(--k3-sys-color-on-primary);
    --k3-slider-icon: var(--k3-sys-color-on-primary);
    --k3-slider-icon-inactive: var(--k3-sys-color-on-secondary-container);
    color: var(--k3-sys-color-on-surface);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }
  :host([orientation='vertical']) {
    display: inline-flex;
    width: auto;
    height: 12rem;
    max-width: none;
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    width: 100%;
    min-width: 0;
  }
  :host([orientation='vertical']) .root {
    flex-direction: row;
    align-items: stretch;
    height: 100%;
    width: auto;
  }

  .label {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    color: var(--k3-sys-color-on-surface);
  }
  .label:not(.has) {
    display: none;
  }

  .area {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: var(--k3-slider-handle-h, 44px);
    cursor: pointer;
  }
  :host([orientation='vertical']) .area {
    flex-direction: column;
    width: var(--k3-slider-handle-h, 44px);
    height: 100%;
    min-height: 8rem;
    min-width: var(--k3-slider-handle-h, 44px);
  }

  .track {
    position: relative;
    width: 100%;
    height: var(--k3-slider-track-h, 16px);
    border-radius: var(--k3-slider-corner, 8px);
    background: transparent;
  }
  :host([orientation='vertical']) .track {
    width: var(--k3-slider-track-h, 16px);
    height: 100%;
  }

  .seg {
    position: absolute;
    inset-block: 0;
    border-radius: var(--k3-slider-inner-corner, 2px);
    pointer-events: none;
  }
  :host([orientation='vertical']) .seg {
    inset-inline: 0;
    inset-block: auto;
  }
  .seg.active {
    background: var(--k3-slider-active);
  }
  .seg.inactive {
    background: var(--k3-slider-track);
  }
  /* Outer ends fully rounded */
  .seg.lead-cap {
    border-start-start-radius: var(--k3-slider-corner, 8px);
    border-end-start-radius: var(--k3-slider-corner, 8px);
  }
  .seg.trail-cap {
    border-start-end-radius: var(--k3-slider-corner, 8px);
    border-end-end-radius: var(--k3-slider-corner, 8px);
  }
  :host([orientation='vertical']) .seg.lead-cap {
    border-start-start-radius: var(--k3-slider-corner, 8px);
    border-start-end-radius: var(--k3-slider-corner, 8px);
    border-end-start-radius: var(--k3-slider-inner-corner, 2px);
    border-end-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical']) .seg.trail-cap {
    border-end-start-radius: var(--k3-slider-corner, 8px);
    border-end-end-radius: var(--k3-slider-corner, 8px);
    border-start-start-radius: var(--k3-slider-inner-corner, 2px);
    border-start-end-radius: var(--k3-slider-inner-corner, 2px);
  }

  .handle {
    position: absolute;
    top: 50%;
    width: var(--k3-slider-handle-w, 4px);
    height: var(--k3-slider-handle-h, 44px);
    margin-top: calc(var(--k3-slider-handle-h, 44px) / -2);
    margin-inline-start: calc(var(--k3-slider-handle-w, 4px) / -2);
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: var(--k3-slider-handle);
    z-index: 2;
    touch-action: none;
    transition: width var(--k3-sys-motion-duration-spatial-fast, 200ms)
      var(--k3-sys-motion-easing-expressive-spatial, ease);
  }
  :host([orientation='vertical']) .handle {
    left: 50%;
    /* top set inline (min-at-top axis) */
    width: var(--k3-slider-handle-h, 44px);
    height: var(--k3-slider-handle-w, 4px);
    margin-top: calc(var(--k3-slider-handle-w, 4px) / -2);
    margin-inline-start: calc(var(--k3-slider-handle-h, 44px) / -2);
    transition: height var(--k3-sys-motion-duration-spatial-fast, 200ms)
      var(--k3-sys-motion-easing-expressive-spatial, ease);
  }
  .handle.pressed,
  .area:active .handle.active-drag {
    width: var(--k3-slider-handle-w-pressed, 2px);
    margin-inline-start: calc(var(--k3-slider-handle-w-pressed, 2px) / -2);
  }
  :host([orientation='vertical']) .handle.pressed,
  :host([orientation='vertical']) .area:active .handle.active-drag {
    width: var(--k3-slider-handle-h, 44px);
    height: var(--k3-slider-handle-w-pressed, 2px);
    margin-inline-start: calc(var(--k3-slider-handle-h, 44px) / -2);
    margin-top: calc(var(--k3-slider-handle-w-pressed, 2px) / -2);
  }
  .handle:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .stop {
    position: absolute;
    top: 50%;
    width: var(--k3-slider-stop, 4px);
    height: var(--k3-slider-stop, 4px);
    margin-top: calc(var(--k3-slider-stop, 4px) / -2);
    margin-inline-start: calc(var(--k3-slider-stop, 4px) / -2);
    border-radius: 50%;
    background: var(--k3-slider-stop);
    pointer-events: none;
    z-index: 1;
  }
  .stop.on-active {
    background: var(--k3-slider-stop-on-active);
  }
  :host([orientation='vertical']) .stop {
    left: 50%;
    top: auto;
  }

  .inset-icon {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--k3-slider-icon-size, 24px);
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
    color: var(--k3-slider-icon);
    font-size: var(--k3-slider-icon-size, 24px);
    padding-inline-start: calc(
      (var(--k3-slider-track-h, 40px) - var(--k3-slider-icon-size, 24px)) / 2
    );
  }
  .inset-icon.has {
    display: flex;
  }
  .inset-icon.on-inactive {
    color: var(--k3-slider-icon-inactive);
  }
  .inset-icon [data-k3-icon],
  .inset-icon .ms {
    font-size: inherit;
    width: 1em;
    height: 1em;
    line-height: 1;
  }
  :host([orientation='vertical']) .inset-icon {
    inset-inline: 0;
    inset-block-end: 0;
    inset-block-start: auto;
    width: 100%;
    height: var(--k3-slider-icon-size, 24px);
    padding-inline-start: 0;
    padding-block-end: calc(
      (var(--k3-slider-track-h, 40px) - var(--k3-slider-icon-size, 24px)) / 2
    );
  }

  .value-indicator {
    position: absolute;
    z-index: 3;
    display: none;
    align-items: center;
    justify-content: center;
    width: var(--k3-slider-vi-w, 48px);
    height: var(--k3-slider-vi-h, 44px);
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: var(--k3-sys-color-inverse-surface);
    color: var(--k3-sys-color-inverse-on-surface);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
    transform: translate(-50%, calc(-100% - var(--k3-slider-vi-gap, 12px)));
  }
  .value-indicator.has {
    display: flex;
  }
  :host([orientation='vertical']) .value-indicator {
    transform: translate(
      calc(-100% - var(--k3-slider-vi-gap, 12px)),
      -50%
    );
  }
`;