import { css, unsafeCSS } from 'lit';
import { ScrollToTopSpecs } from './scroll-to-top.specs.js';

const inset = unsafeCSS(`${ScrollToTopSpecs.behaviors.rightOffset / 16}rem`);

/**
 * Styles for `k3-scroll-to-top` — fixed bottom-end control + progress ring.
 *
 * @see ./scroll-to-top.specs.ts
 */
export const scrollToTopStyles = css`
  :host {
    position: fixed;
    z-index: 40;
    inset-inline-end: var(--k3-scroll-to-top-right, ${inset});
    inset-block-end: var(--k3-scroll-to-top-bottom, ${inset});
    display: block;
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

  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--k3-scroll-to-top-size, 3.5rem);
    height: var(--k3-scroll-to-top-size, 3.5rem);
    padding: 0;
    border: none;
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
    cursor: pointer;
    box-shadow: var(--k3-sys-elevation-level3);
    transition:
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .btn:hover {
    box-shadow: var(--k3-sys-elevation-level4);
  }

  .btn.is-pressed {
    transform: scale(0.96);
  }

  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .ring-base {
    stroke: color-mix(in srgb, var(--k3-sys-color-on-primary-container) 24%, transparent);
    fill: none;
  }

  .ring-progress {
    stroke: var(--k3-sys-color-primary);
    fill: none;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 80ms linear;
  }

  .icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    line-height: 1;
    width: 1.5rem;
    height: 1.5rem;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }
`;
