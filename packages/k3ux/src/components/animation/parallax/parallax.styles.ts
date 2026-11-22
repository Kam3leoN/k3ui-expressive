import { css } from 'lit';

/**
 * Full-page parallax stack — CSS port of
 * https://codepen.io/eehayman/pen/qdGZJr (Montserrat / SCSS → tokens).
 */
export const parallaxStyles = css`
  :host {
    --k3-parallax-offset: 30vh;
    --k3-parallax-content-offset: 40vh;
    --k3-parallax-transition: 1.2s;
    --k3-parallax-content-transition: 1.7s;
    --k3-parallax-easing: cubic-bezier(0.22, 0.44, 0, 1);
    --k3-parallax-overlay: 0.3;

    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    min-block-size: 20rem;
    overflow: hidden;
    touch-action: none;
    background: var(--k3-sys-color-surface, #121212);
    color: var(--k3-sys-color-on-surface, #fff);
  }

  :host([disabled]),
  :host([data-reduced-motion]) {
    --k3-parallax-transition: 0s;
    --k3-parallax-content-transition: 0s;
  }

  .viewport {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  ::slotted(k3-parallax-slide) {
    /* stacking assigned in JS via --k3-parallax-z */
  }
`;

export const parallaxSlideStyles = css`
  :host {
    display: block;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    overflow: hidden;
    will-change: transform;
    backface-visibility: hidden;
    height: calc(100% + var(--k3-parallax-offset, 30vh));
    position: absolute;
    inset-inline: 0;
    top: 0;
    width: 100%;
    transform: translate3d(0, var(--k3-parallax-offset, 30vh), 0);
    transition: transform var(--k3-parallax-transition, 1.2s)
      var(--k3-parallax-easing, cubic-bezier(0.22, 0.44, 0, 1));
    z-index: var(--k3-parallax-z, 0);
    color: #fff;
    box-sizing: border-box;
  }

  :host::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgb(0 0 0 / var(--k3-parallax-overlay, 0.3));
    pointer-events: none;
    z-index: 0;
  }

  /* Current (initial / up-scroll) */
  :host([data-state='current']),
  :host([data-state='up']) {
    transform: translate3d(0, calc(var(--k3-parallax-offset, 30vh) / -2), 0);
  }

  :host([data-state='current']) .content,
  :host([data-state='up']) .content {
    transform: translateY(calc(var(--k3-parallax-offset, 30vh) / 2));
  }

  /* Passed (down-scroll) — full self height up (CodePen: -(100vh + offset)). */
  :host([data-state='passed']) {
    transform: translate3d(0, -100%, 0);
  }

  :host([data-state='passed']) .content {
    transform: translateY(var(--k3-parallax-content-offset, 40vh));
  }

  /* Upcoming (default) */
  :host([data-state='upcoming']) {
    transform: translate3d(0, var(--k3-parallax-offset, 30vh), 0);
  }

  :host([data-state='upcoming']) .content {
    transform: translateY(var(--k3-parallax-content-offset, 40vh));
  }

  .content {
    position: relative;
    z-index: 1;
    height: calc(100% - var(--k3-parallax-offset, 30vh));
    display: flex;
    justify-content: center;
    text-align: center;
    flex-flow: column nowrap;
    padding: var(--k3-sys-spacing-space400, 2rem);
    box-sizing: border-box;
    will-change: transform;
    backface-visibility: hidden;
    transform: translateY(var(--k3-parallax-content-offset, 40vh));
    transition: transform var(--k3-parallax-content-transition, 1.7s)
      var(--k3-parallax-easing, cubic-bezier(0.22, 0.44, 0, 1));
    font-family: var(--k3-ref-typeface-brand, var(--k3-ref-typeface-plain, system-ui));
    text-transform: uppercase;
  }

  .title {
    margin: 0;
    font-size: clamp(1.75rem, 8vh, 12vh);
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .subtitle {
    margin: 0.75rem 0 0;
    font-size: clamp(0.875rem, 2.2vh, 1.25rem);
    line-height: 1.5;
    font-weight: 500;
    opacity: 0.92;
    text-transform: none;
    max-inline-size: 40rem;
    margin-inline: auto;
  }

  ::slotted([slot='title']),
  ::slotted(h1),
  ::slotted(h2) {
    margin: 0;
    font-size: clamp(1.75rem, 8vh, 12vh);
    line-height: 1.25;
    font-weight: 700;
  }

  ::slotted([slot='subtitle']),
  ::slotted(p) {
    margin: 0.75rem 0 0;
    font-size: clamp(0.875rem, 2.2vh, 1.25rem);
    text-transform: none;
  }
`;
