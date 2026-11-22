import { css, unsafeCSS } from 'lit';
import { FabMenuSpecs } from './fab-menu.specs.js';

const spatialEnterEasing = unsafeCSS(FabMenuSpecs.spatialEnterEasing);
const spatialExitEasing = unsafeCSS(FabMenuSpecs.spatialExitEasing);
const effectsEasing = unsafeCSS(FabMenuSpecs.effectsEasing);

const iconRem = FabMenuSpecs.itemIconDp / 16;
const gapRem = FabMenuSpecs.itemGapDp / 16;
const maxW = FabMenuSpecs.itemMaxWidthDp / 16;

/**
 * Styles for `k3-fab-menu-item` — pill chrome + phase motion.
 *
 * Motion on `.item`: FastSpatial (scaleX) + FastEffects (opacity) in parallel
 * — matches Compose expandHorizontally + fadeIn.
 *
 * @see https://m3.material.io/components/fab-menu/specs
 * @see https://matraic.github.io/m3e/#/components/fab-menu.html
 */
export const fabMenuItemStyles = css`
  :host {
    position: relative;
    z-index: 0;
    display: block;
    box-sizing: border-box;
    width: max-content;
    max-width: ${maxW}rem;
    flex: 0 0 auto;
    pointer-events: none;
    opacity: 1;
    transform: none;
  }

  /* Focus ring must paint above every neighboring pill (gap 4dp < ring extent). */
  :host(:focus-within) {
    z-index: 4;
  }

  :host([data-phase='closed']) {
    visibility: hidden;
    width: 0 !important;
    height: 0 !important;
    min-width: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
    pointer-events: none;
  }

  :host([data-phase='open']) {
    visibility: visible;
    width: max-content;
    max-width: ${maxW}rem;
    height: auto;
    pointer-events: auto;
  }

  :host([data-phase='opening']),
  :host([data-phase='closing']) {
    visibility: visible;
    width: max-content;
    max-width: ${maxW}rem;
    height: auto;
  }

  :host([data-phase='opening']) {
    pointer-events: auto;
  }

  :host([data-phase='closing']) {
    pointer-events: none;
  }

  .item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    gap: ${gapRem}rem;
    box-sizing: border-box;
    width: max-content;
    max-width: ${maxW}rem;
    min-height: max(${FabMenuSpecs.itemHeightDp}px, var(--k3-sys-touch-target, 3rem));
    padding-block: 0;
    /* Icon at inline-start (LTR left / RTL right) — trailing-edge menus */
    padding-inline: ${FabMenuSpecs.itemPadInlineStartDp}px
      ${FabMenuSpecs.itemPadInlineEndDp}px;
    border: 0;
    margin: 0;
    border-radius: var(--k3-sys-shape-corner-full);
    background: var(--k3-fab-menu-item-container, var(--k3-sys-color-primary-container));
    color: var(--k3-fab-menu-item-on-container, var(--k3-sys-color-on-primary-container));
    font: inherit;
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transform-origin: var(--k3-fab-menu-origin, right center);
    box-shadow: var(--k3-sys-elevation-level1);
    transition: background-color var(--k3-sys-motion-duration-effects-fast, 150ms)
      var(--k3-sys-motion-easing-expressive-effects, ease-out);
  }

  /*
   * Start-edge menus (M3): icon at end of line / outer edge.
   * LTR left → icon right; RTL start (physical right) → icon left via dir + reverse.
   */
  :host([data-icon-end]) .item {
    flex-direction: row-reverse;
    padding-inline: ${FabMenuSpecs.itemPadInlineEndDp}px
      ${FabMenuSpecs.itemPadInlineStartDp}px;
  }

  /* Idle / open — clear enter/exit only; k3-focus-ring keeps its animation. */
  :host([data-phase='open']) .item:not(:focus-visible),
  :host:not([data-phase]) .item:not(:focus-visible) {
    opacity: 1;
    transform: scaleX(1);
    animation: none;
  }
  :host([data-phase='open']) .item:focus-visible,
  :host([data-phase='opening']) .item:focus-visible {
    z-index: 1;
    opacity: 1;
    transform: scaleX(1);
  }

  :host([data-phase='closed']) .item {
    opacity: 0 !important;
    transform: scaleX(0.001) !important;
    animation: none !important;
    box-shadow: none !important;
    /* Keep container color — transparent flashed white on hard-collapse. */
    pointer-events: none;
  }

  /*
   * Spatial + effects in parallel (Compose expandHorizontally + fadeIn).
   * Overshoot lives in Expressive fast spatial easing — NOT mid-keyframes
   * (double-bounce). Effects easing never overshoots (opacity).
   * @see https://m3.material.io/styles/motion/overview/specs (web conversion)
   */
  :host([data-phase='opening']) .item {
    opacity: 1;
    transform: scaleX(1);
    animation:
      k3-fab-menu-item-in-spatial ${FabMenuSpecs.spatialEnterMs}ms
        var(--k3-sys-motion-easing-spatial-fast, ${spatialEnterEasing}) both,
      k3-fab-menu-item-in-fade ${FabMenuSpecs.effectsMs}ms
        var(--k3-sys-motion-easing-effects-fast, ${effectsEasing}) both;
    animation-delay: var(--k3-fab-menu-item-delay, 0ms), var(--k3-fab-menu-item-delay, 0ms);
  }

  /*
   * Exit = same FastSpatial spring as menus (enterScaleY close → scaleY(0.8)).
   * Settle to 0.8 (not 0) so overshoot stays readable; hard-collapse in closed.
   */
  :host([data-phase='closing']) .item {
    opacity: 0;
    transform: scaleX(0.8);
    animation:
      k3-fab-menu-item-out-spatial ${FabMenuSpecs.spatialExitMs}ms
        var(--k3-sys-motion-easing-spatial-fast, ${spatialExitEasing}) both,
      k3-fab-menu-item-out-fade ${FabMenuSpecs.effectsMs}ms
        var(--k3-sys-motion-easing-effects-fast, ${effectsEasing}) both;
    animation-delay: var(--k3-fab-menu-item-delay, 0ms), var(--k3-fab-menu-item-delay, 0ms);
  }

  @keyframes k3-fab-menu-item-in-spatial {
    from {
      transform: scaleX(0.001);
    }
    to {
      transform: scaleX(1);
    }
  }
  @keyframes k3-fab-menu-item-in-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes k3-fab-menu-item-out-spatial {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0.8);
    }
  }
  @keyframes k3-fab-menu-item-out-fade {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([data-phase='opening']) .item,
    :host([data-phase='closing']) .item {
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
    }
  }

  .item:active {
    transform: scale(0.96);
  }
  :host([data-phase='opening']) .item:active,
  :host([data-phase='closing']) .item:active {
    transform: scaleX(1);
  }

  .item.primary {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }
  .item.secondary {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .item.tertiary {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }
  .item.surface {
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-primary);
  }

  :host([disabled]) {
    pointer-events: none;
  }
  :host([disabled]) .item {
    opacity: 0.38;
  }

  .icon {
    display: grid;
    place-items: center;
    place-content: center;
    width: ${iconRem}rem;
    height: ${iconRem}rem;
    line-height: 0;
    overflow: hidden;
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: ${iconRem}rem;
    flex-shrink: 0;
  }
  ::slotted([slot='icon']),
  .icon-ligature {
    display: grid !important;
    place-items: center !important;
    width: ${iconRem}rem !important;
    height: ${iconRem}rem !important;
    margin: 0 !important;
    font-size: ${iconRem}rem !important;
    line-height: 1 !important;
    font-family: 'Material Symbols Rounded', sans-serif !important;
  }
  :host-context(:dir(rtl)) .icon-ligature[data-mirror],
  :host-context(:dir(rtl)) ::slotted([slot='icon'][data-mirror]) {
    transform: scaleX(-1);
  }
  .label {
    display: block;
    flex: 0 1 auto;
    min-width: 0;
  }
`;
