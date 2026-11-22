import { css } from 'lit';

export const rippleStyles = css`
    :host {
      /* Host fills the interactive surface */
      position: absolute;
      inset: 0;
      border-radius: inherit;
      display: block;
      overflow: hidden;
      pointer-events: none;
      color: var(--k3-ripple-color, currentColor);
      --k3-ripple-hover-opacity: var(--k3-sys-state-hover-opacity, 0.08);
      --k3-ripple-pressed-opacity: var(--k3-sys-state-pressed-opacity, 0.16);
    }
    :host([hidden]),
    :host([disabled]) {
      display: none !important;
    }

    .surface {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
    }

    /* Hover / keyboard state layer (full surface) */
    .surface::before {
      content: '';
      position: absolute;
      inset: 0;
      background: currentColor;
      opacity: 0;
      transition: opacity var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease);
    }
    .surface.hovered::before {
      opacity: var(--k3-ripple-hover-opacity);
    }
    .surface.pressed::before {
      opacity: var(--k3-ripple-pressed-opacity);
    }

    /* Ink circle — grown via WAAPI on ::after */
    .surface::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: var(--k3-ripple-size, 100%);
      height: var(--k3-ripple-size, 100%);
      border-radius: 50%;
      background: currentColor;
      opacity: 0;
      transform-origin: center center;
      /* Soft edge like MDC */
      -webkit-mask-image: radial-gradient(closest-side, #fff 88%, transparent);
      mask-image: radial-gradient(closest-side, #fff 88%, transparent);
    }
    .surface.pressed::after {
      opacity: var(--k3-ripple-pressed-opacity);
      transition: opacity 75ms linear;
    }

    /*
     * Unbounded — fixed circle centered in the parent.
     * Must NOT keep inset:0 together with width/height (width would be ignored).
     */
    :host([unbounded]) {
      inset: unset;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: var(--k3-ripple-unbounded-size, 2.5rem); /* 40dp state layer */
      height: var(--k3-ripple-unbounded-size, 2.5rem);
      margin: auto;
      border-radius: 50%;
      overflow: hidden;
    }
    :host([unbounded]) .surface {
      border-radius: 50%;
    }

    @media (forced-colors: active) {
      :host {
        display: none !important;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .surface::after {
        display: none;
      }
    }
  `;
