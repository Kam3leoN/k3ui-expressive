import { css, unsafeCSS } from 'lit';
import { ScrollToTopSpecs } from './scroll-to-top.specs.js';

const inset = unsafeCSS(`${ScrollToTopSpecs.behaviors.rightOffset / 16}rem`);

/**
 * Styles for `k3-scroll-to-top`.
 *
 * Host = floating chrome container (position / show-hide).
 * `.control` = circular surface — color roles match `k3-fab-menu` trigger.
 *
 * @see ./scroll-to-top.specs.ts
 * @see ../actions/fab-menu.styles.ts
 */
export const scrollToTopStyles = css`
  :host {
    --k3-scroll-to-top-size: 3.5rem;
    /*
     * Face = fab-menu trigger (solid role).
     * Ring track = *-container (submenu face) · progress = on-*-container.
     */
    --k3-scroll-to-top-bg: var(--k3-sys-color-primary);
    --k3-scroll-to-top-fg: var(--k3-sys-color-on-primary);
    --k3-scroll-to-top-track: var(--k3-sys-color-primary-container);
    --k3-scroll-to-top-progress: var(--k3-sys-color-on-primary-container);
    position: fixed;
    z-index: 40;
    inset-inline-end: var(--k3-scroll-to-top-right, ${inset});
    inset-block-end: calc(
      var(--k3-scroll-to-top-bottom, ${inset}) +
        var(--k3-nav-chrome-inset-block-end, 0px)
    );
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
        var(--k3-sys-motion-easing-expressive-spatial),
      inset-block-end var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-spatial),
      visibility var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }

  :host([variant='primary']),
  :host(:not([variant])) {
    --k3-scroll-to-top-bg: var(--k3-sys-color-primary);
    --k3-scroll-to-top-fg: var(--k3-sys-color-on-primary);
    --k3-scroll-to-top-track: var(--k3-sys-color-primary-container);
    --k3-scroll-to-top-progress: var(--k3-sys-color-on-primary-container);
  }

  :host([variant='secondary']) {
    --k3-scroll-to-top-bg: var(--k3-sys-color-secondary);
    --k3-scroll-to-top-fg: var(--k3-sys-color-on-secondary);
    --k3-scroll-to-top-track: var(--k3-sys-color-secondary-container);
    --k3-scroll-to-top-progress: var(--k3-sys-color-on-secondary-container);
  }

  :host([variant='tertiary']) {
    --k3-scroll-to-top-bg: var(--k3-sys-color-tertiary);
    --k3-scroll-to-top-fg: var(--k3-sys-color-on-tertiary);
    --k3-scroll-to-top-track: var(--k3-sys-color-tertiary-container);
    --k3-scroll-to-top-progress: var(--k3-sys-color-on-tertiary-container);
  }

  :host([variant='surface']) {
    --k3-scroll-to-top-bg: var(--k3-sys-color-surface-container-high);
    --k3-scroll-to-top-fg: var(--k3-sys-color-primary);
    --k3-scroll-to-top-track: var(--k3-sys-color-surface-container-highest);
    --k3-scroll-to-top-progress: var(--k3-sys-color-primary);
  }

  :host([data-visible]) {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }

  /* Peer conceal — fab-menu expansion or sheet/dialog overlay. */
  :host([data-k3-fab-menu-concealed]),
  :host([data-k3-overlay-concealed]) {
    z-index: 1 !important; /* under modal sheet band (1200+) while fading */
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden;
    transform: scale(0.8);
  }

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
    background: var(--k3-scroll-to-top-bg);
    color: var(--k3-scroll-to-top-fg);
    cursor: pointer;
    box-shadow: var(--k3-sys-elevation-level3);
    transition:
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial),
      background-color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .control:hover {
    box-shadow: var(--k3-sys-elevation-level4);
  }

  .control:focus-visible {
    outline: 2px solid var(--k3-scroll-to-top-progress);
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
    stroke: var(--k3-scroll-to-top-track);
    opacity: 1;
  }

  .ring-progress {
    stroke: var(--k3-scroll-to-top-progress);
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
    color: var(--k3-scroll-to-top-fg);
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
