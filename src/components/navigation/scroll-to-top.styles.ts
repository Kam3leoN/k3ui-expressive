import { css, unsafeCSS } from 'lit';
import { ScrollToTopSpecs } from './scroll-to-top.specs.js';

const inset = unsafeCSS(`${ScrollToTopSpecs.behaviors.rightOffset / 16}rem`);

/**
 * Styles for `k3-scroll-to-top`.
 *
 * Host = floating chrome container (position / show-hide).
 * `.control` = circular surface (not an M3 button shape).
 *
 * @see ./scroll-to-top.specs.ts
 */
export const scrollToTopStyles = css`
  :host {
    --k3-scroll-to-top-size: 3.5rem;
    position: fixed;
    z-index: 40;
    inset-inline-end: var(--k3-scroll-to-top-right, ${inset});
    inset-block-end: var(--k3-scroll-to-top-bottom, ${inset});
    display: block;
    width: var(--k3-scroll-to-top-size);
    height: var(--k3-scroll-to-top-size);
    pointer-events: none;
    opacity: 0;
    transform: translateY(0.75rem) scale(0.92);
    transition:
      opacity var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      transform var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial);
  }

  :host([data-visible]) {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }

  /*
   * Own circular chrome (V1) — secondary-container + secondary ring/icon.
   * Solid fill (no translucent mix) so light/dark themes stay readable
   * next to the primary FAB.
   */
  .control {
    position: relative;
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 50%;
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
    cursor: pointer;
    box-shadow: var(--k3-sys-elevation-level3);
    transition:
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial),
      background-color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .control:hover {
    box-shadow: var(--k3-sys-elevation-level4);
  }

  .control:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .control.is-pressed {
    transform: scale(0.96);
  }

  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transform: rotate(-90deg);
  }

  .ring-base,
  .ring-progress {
    fill: none;
  }

  .ring-base {
    stroke: var(--k3-sys-color-on-secondary-container);
    opacity: 0.28;
  }

  .ring-progress {
    stroke: var(--k3-sys-color-secondary);
    stroke-linecap: butt;
    transition: stroke-dashoffset 60ms linear;
  }

  .icon {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    line-height: 1;
    width: auto;
    height: auto;
    color: var(--k3-sys-color-on-secondary-container);
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-variation-settings:
      'FILL' 0,
      'wght' 500,
      'GRAD' 0,
      'opsz' 24;
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    .control,
    .ring-progress {
      transition: none !important;
    }
  }
`;
