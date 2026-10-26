import { css, unsafeCSS } from 'lit';
import { FabDialSpecs } from './fab-dial.specs.js';

const spatialEasing = unsafeCSS(FabDialSpecs.spatialEasing);
const exitEasing = unsafeCSS(FabDialSpecs.exitEasing);
const effectsEasing = unsafeCSS(FabDialSpecs.effectsEasing);
const iconEasing = unsafeCSS(FabDialSpecs.iconPlusEasing);
const pressRadius = unsafeCSS(FabDialSpecs.pressRadius);

/**
 * Styles for `k3-fab-dial`.
 * Host = trigger footprint · actions absolute with `--x` / `--y` / stagger delays.
 */
export const fabDialStyles = css`
  :host {
    --k3-fab-dial-size: ${FabDialSpecs.triggerSizeDp / 16}rem;
    --k3-fab-dial-item-size: ${FabDialSpecs.actionSizeDp / 16}rem;
    --k3-fab-dial-inset: ${FabDialSpecs.insetDp}px;
    --k3-fab-dial-rotate: 135deg;
    --k3-fab-dial-action-bg: var(--k3-sys-color-surface-container-high);
    --k3-fab-dial-action-fg: var(--k3-sys-color-on-surface);
    --k3-fab-dial-label-bg: var(--k3-sys-color-inverse-surface);
    --k3-fab-dial-label-fg: var(--k3-sys-color-inverse-on-surface);
    --k3-fab-dial-scrim: color-mix(in srgb, var(--k3-sys-color-surface) 62%, transparent);

    position: relative;
    display: inline-flex;
    box-sizing: border-box;
    width: var(--k3-fab-dial-size);
    height: var(--k3-fab-dial-size);
    overflow: visible;
    z-index: ${FabDialSpecs.zIndex};
  }

  :host([fixed]) {
    position: fixed;
    inset-block-end: calc(
      var(--k3-fab-dial-inset) + var(--k3-nav-chrome-inset-block-end, 0px)
    );
    inset-inline-end: var(--k3-fab-dial-inset);
    inset-block-start: auto;
    inset-inline-start: auto;
    transition:
      inset-block-end var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1)),
      visibility var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
  }
  :host([fixed][position='bottom-left']) {
    inset-inline-end: auto;
    inset-inline-start: var(--k3-fab-dial-inset);
  }
  :host([fixed][position='top-right']) {
    inset-block-end: auto;
    inset-block-start: var(--k3-fab-dial-inset);
  }
  :host([fixed][position='top-left']) {
    inset-block-end: auto;
    inset-block-start: var(--k3-fab-dial-inset);
    inset-inline-end: auto;
    inset-inline-start: var(--k3-fab-dial-inset);
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: ${FabDialSpecs.scrimZ};
    border: 0;
    padding: 0;
    margin: 0;
    background: var(--k3-fab-dial-scrim);
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    cursor: default;
    transition: opacity ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing};
  }
  :host([open]) .scrim,
  :host([data-phase='opening']) .scrim {
    opacity: 1;
    pointer-events: auto;
  }
  :host([data-phase='closing']) .scrim {
    opacity: 0;
    pointer-events: none;
  }

  .menu {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .slot {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .item {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transform: translate3d(0, 0, 0) scale(0.35);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
    transition:
      transform ${FabDialSpecs.exitDurationMs}ms ${exitEasing} var(--delay-out, 0ms),
      opacity ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing} var(--delay-out, 0ms);
  }
  :host([open]) .item,
  :host([data-phase='opening']) .item {
    transform: translate3d(var(--x, 0), var(--y, 0), 0) scale(1);
    opacity: 1;
    pointer-events: auto;
    transition:
      transform ${FabDialSpecs.spatialDurationMs}ms ${spatialEasing} var(--delay-in, 0ms),
      opacity ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing} var(--delay-in, 0ms);
  }
  :host([data-phase='closing']) .item {
    transform: translate3d(0, 0, 0) scale(0.35);
    opacity: 0;
    pointer-events: none;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--k3-fab-dial-item-size);
    height: var(--k3-fab-dial-item-size);
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    background: var(--k3-fab-dial-action-bg);
    color: var(--k3-fab-dial-action-fg);
    box-shadow: var(--k3-sys-elevation-level3);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.25rem;
    line-height: 1;
    transition:
      border-radius ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing},
      transform ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing};
  }
  .action[data-pressed] {
    border-radius: ${pressRadius};
    transform: scale(0.92);
  }
  .action:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 3px;
  }
  .action [data-k3-icon] {
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    font-size: 1.25rem;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .label {
    position: absolute;
    inset-inline-end: calc(100% + 0.75rem);
    white-space: nowrap;
    font-family: var(--k3-ref-typeface-plain);
    font-size: 0.8125rem;
    line-height: 1;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--k3-fab-dial-label-bg);
    color: var(--k3-fab-dial-label-fg);
    opacity: 0;
    transform: translateX(0.5rem);
    pointer-events: none;
    transition:
      opacity ${FabDialSpecs.effectsDurationMs}ms ${effectsEasing},
      transform ${FabDialSpecs.spatialDurationMs}ms ${spatialEasing};
  }
  :host([position='bottom-left']) .label,
  :host([position='top-left']) .label {
    inset-inline-end: auto;
    inset-inline-start: calc(100% + 0.75rem);
    transform: translateX(-0.5rem);
  }
  :host([open][show-labels]) .label,
  :host([data-phase='opening'][show-labels]) .label {
    opacity: 1;
    transform: translateX(0);
    transition-delay: var(--delay-in, 0ms);
  }

  .trigger-wrap {
    pointer-events: auto;
  }
  .trigger-wrap k3-fab {
    --k3-fab-bg: var(--k3-sys-color-primary);
    --k3-fab-fg: var(--k3-sys-color-on-primary);
  }

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

  .icon-rotator {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(0deg);
    transform-origin: center;
    backface-visibility: hidden;
    will-change: transform;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.5rem;
    line-height: 1;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }
  .icon-rotator.open {
    animation: k3-fab-dial-icon-in ${FabDialSpecs.iconPlusDurationMs}ms ${iconEasing}
      forwards;
  }
  .icon-rotator.closing {
    animation: k3-fab-dial-icon-out ${FabDialSpecs.iconPlusDurationMs}ms ${iconEasing}
      forwards;
  }

  @keyframes k3-fab-dial-icon-in {
    0% {
      transform: rotate(0deg) scale(1);
    }
    20% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) * 1.333)) scale(0.93);
    }
    55% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) * 0.778)) scale(0.97);
    }
    80% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) * 1.067)) scale(0.94);
    }
    100% {
      transform: rotate(var(--k3-fab-dial-rotate, 135deg)) scale(0.95);
    }
  }
  @keyframes k3-fab-dial-icon-out {
    0% {
      transform: rotate(var(--k3-fab-dial-rotate, 135deg)) scale(0.95);
    }
    20% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) - 60deg)) scale(1);
    }
    55% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) - 35deg)) scale(1);
    }
    80% {
      transform: rotate(calc(var(--k3-fab-dial-rotate, 135deg) - 48deg)) scale(1);
    }
    100% {
      transform: rotate(0deg) scale(1);
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

  ::slotted(k3-fab-dial-item) {
    display: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .item,
    .scrim,
    .label,
    .action {
      transition-duration: 1ms !important;
      transition-delay: 0ms !important;
    }
    .icon-rotator.open,
    .icon-rotator.closing {
      animation: none !important;
    }
    .icon-rotator.open {
      transform: rotate(var(--k3-fab-dial-rotate, 135deg)) scale(0.95);
    }
    .icon-rotator.closing {
      transform: rotate(0deg) scale(1);
    }
  }
`;
