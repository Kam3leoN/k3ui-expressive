import { css } from 'lit';

/**
 * Toast stack — Expressive / Base UI layout on M3 tokens.
 * Collapsed: peek + scale · expanded (hover/focus): fan column · swipe dismiss.
 */
export const toastStyles = css`
  :host {
    display: block;
    position: fixed;
    z-index: 50;
    /* Edge floor — chrome/scrollbar raise via --k3-toast-chrome-inset-* (toast-chrome.ts) */
    --k3-toast-edge: var(--k3-sys-spacing-space200, 1rem);
    --k3-toast-chrome-inset-inline-end: 0px;
    --k3-toast-chrome-inset-inline-start: 0px;
    --k3-toast-chrome-inset-block-end: 0px;
    --k3-toast-scrollbar-inline: 0px;
    bottom: var(--k3-toast-edge);
    width: min(
      22.5rem,
      calc(
        100vw - (2 * var(--k3-toast-edge)) - var(--k3-toast-chrome-inset-inline-end) -
          var(--k3-toast-chrome-inset-inline-start)
      )
    );
    outline: none;
    pointer-events: none;
    /* Stack geometry (Expressive [--ex-*]) */
    --k3-toast-gap: var(--k3-sys-spacing-space100, 0.5rem);
    --k3-toast-peek: 0.625rem;
    --k3-toast-swipe-x: 0px;
    --k3-toast-swipe-y: 0px;
  }

  /*
   * bottom-right / bottom-left use logical inset (inline-end / start)
   * so FAB menu + STT + scrollbar clear in LTR and RTL.
   */
  :host([position='bottom-right']),
  :host(:not([position])) {
    inset-inline-end: max(
      var(--k3-toast-edge),
      var(--k3-toast-chrome-inset-inline-end)
    );
  }
  :host([position='bottom-left']) {
    inset-inline-start: max(
      var(--k3-toast-edge),
      var(--k3-toast-chrome-inset-inline-start)
    );
  }
  :host([position='bottom-center']) {
    left: 50%;
    transform: translateX(-50%);
    /* Lift above corner chrome when centered */
    bottom: max(var(--k3-toast-edge), var(--k3-toast-chrome-inset-block-end));
  }

  @media (min-width: 600px) {
    :host {
      --k3-toast-edge: var(--k3-sys-spacing-space300, 1.5rem);
    }
  }

  .viewport {
    position: relative;
    width: 100%;
    min-height: 0;
    pointer-events: none;
  }

  .toast {
    position: absolute;
    inset-inline-end: 0;
    bottom: 0;
    z-index: calc(1000 - var(--k3-toast-index, 0));
    width: 100%;
    origin: bottom center;
    transform-origin: bottom center;
    pointer-events: auto;
    user-select: none;
    -webkit-user-select: none;
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    background: var(--k3-sys-color-surface-container-high);
    color: var(--k3-sys-color-on-surface);
    box-shadow: var(--k3-sys-elevation-level3);
    /* Collapsed height tracks frontmost so peeks align */
    --k3-toast-scale: max(0, calc(1 - (var(--k3-toast-index, 0) * 0.06)));
    --k3-toast-h: var(--k3-toast-front-h, var(--k3-toast-own-h, auto));
    height: var(--k3-toast-h);
    transform: translateX(var(--k3-toast-swipe-x))
      translateY(
        calc(
          var(--k3-toast-swipe-y) - (var(--k3-toast-index, 0) * var(--k3-toast-peek)) -
            ((1 - var(--k3-toast-scale)) * var(--k3-toast-h, 0px))
        )
      )
      scale(var(--k3-toast-scale));
    /* Settle when peers leave — spatial spring, not a snap */
    transition:
      transform var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(
          --k3-sys-motion-easing-spatial-default,
          var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1))
        ),
      opacity var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      height var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(
          --k3-sys-motion-easing-spatial-default,
          var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1))
        ),
      scale var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(
          --k3-sys-motion-easing-spatial-default,
          var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1))
        );
  }

  /* Exiting toast stays on top while peers settle underneath */
  .toast[data-leaving] {
    z-index: 2000;
    pointer-events: none;
  }

  /* Expanded stack — fan into a column */
  :host([data-expanded]) .toast {
    height: var(--k3-toast-own-h, auto);
    transform: translateX(var(--k3-toast-swipe-x))
      translateY(
        calc(
          var(--k3-toast-swipe-y) - var(--k3-toast-offset-y, 0px) -
            (var(--k3-toast-index, 0) * var(--k3-toast-gap))
        )
      );
  }

  /* Hit bridge across gap so pointer can move between toasts */
  .toast::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: calc(var(--k3-toast-gap) + 1px);
  }

  .toast[data-limited] {
    opacity: 0;
    pointer-events: none;
  }

  .toast[data-entering] {
    transform: translateY(150%);
  }

  .toast[data-leaving]:not([data-swipe]) {
    opacity: 0;
    transform: translateY(150%);
    /* Exit a touch faster than peer settle — still overlaps smoothly */
    transition:
      transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-emphasized-accelerate, cubic-bezier(0.3, 0, 1, 1)),
      opacity var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .toast[data-leaving][data-swipe='down'] {
    opacity: 0;
    transform: translateY(calc(var(--k3-toast-swipe-y) + 150%));
  }

  .toast[data-leaving][data-swipe='end'] {
    opacity: 0;
    transform: translateX(calc(var(--k3-toast-swipe-x) + 150%));
  }

  .toast[data-swiping] {
    transition: none;
  }

  .content {
    display: flex;
    align-items: flex-start;
    gap: var(--k3-sys-spacing-space150, 0.75rem);
    overflow: hidden;
    padding: var(--k3-sys-spacing-space200, 1rem);
    transition: opacity var(--k3-sys-motion-duration-effects-fast, 100ms)
      var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  /* Behind peeks hide content until expanded */
  .toast[data-behind] .content {
    opacity: 0;
  }
  :host([data-expanded]) .toast .content {
    opacity: 1;
  }

  .icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.5rem; /* 40 */
    height: 2.5rem;
    border-radius: var(--k3-sys-shape-corner-full);
    font-size: 1.25rem;
  }

  /* Ligatures Material Symbols (shadow — font + liga obligatoires) */
  .ms,
  [data-k3-icon] {
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: 1.25rem;
    font-weight: 400;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    overflow: hidden;
    font-feature-settings: 'liga';
    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    -webkit-font-smoothing: antialiased;
  }

  [data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    font-style: inherit;
    line-height: 1;
    font-feature-settings: 'liga';
    font-variation-settings: inherit;
  }

  .icon[data-type='info'] {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .icon[data-type='success'] {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }
  .icon[data-type='warning'] {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }
  .icon[data-type='error'] {
    background: var(--k3-sys-color-error-container);
    color: var(--k3-sys-color-on-error-container);
  }
  .icon[data-type='loading'] {
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-primary);
  }

  .spin {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 0.15625rem solid color-mix(in srgb, currentColor 28%, transparent);
    border-top-color: currentColor;
    animation: k3-toast-spin 1s linear infinite;
  }

  @keyframes k3-toast-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .toast[data-typed] .body {
    min-height: 2.5rem;
    justify-content: center;
  }

  .title {
    margin: 0;
    font: var(--k3-sys-typescale-title-small);
    color: var(--k3-sys-color-on-surface);
  }

  .description {
    margin: 0;
    font: var(--k3-sys-typescale-body-medium);
    color: var(--k3-sys-color-on-surface-variant);
  }

  .action {
    align-self: flex-start;
    margin-block-start: var(--k3-sys-spacing-space50, 0.25rem);
    margin-inline-start: calc(-1 * var(--k3-sys-spacing-space150, 0.75rem));
    height: 2.5rem;
    padding-inline: var(--k3-sys-spacing-space150, 0.75rem);
    border-radius: var(--k3-sys-shape-corner-full);
    font: var(--k3-sys-typescale-label-large);
    color: var(--k3-sys-color-primary);
    cursor: pointer;
  }

  .close {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    margin-block: calc(-1 * var(--k3-sys-spacing-space50, 0.25rem));
    margin-inline-end: calc(-1 * var(--k3-sys-spacing-space100, 0.5rem));
    border-radius: var(--k3-sys-shape-corner-full);
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    font-size: 1.25rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      transition-duration: 0.01ms !important;
    }
    .spin {
      animation: none;
      border-top-color: currentColor;
      opacity: 0.7;
    }
  }
`;
