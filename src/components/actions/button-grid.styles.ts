import { css, unsafeCSS } from 'lit';
import {
  ButtonGridCellDp,
  ButtonGridGapDp,
  ButtonGridIconDp,
  ButtonGridInnerRadiusDp,
  ButtonGridOuterRadiusDp,
  ButtonGridSizeDp,
  ButtonGridStaggerMs,
} from './button-grid.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const cell = rem(ButtonGridCellDp);
const gap = rem(ButtonGridGapDp);
const size = rem(ButtonGridSizeDp);
const outerR = rem(ButtonGridOuterRadiusDp);
const innerR = rem(ButtonGridInnerRadiusDp);
const icon = rem(ButtonGridIconDp);
const stagger0 = unsafeCSS(`${ButtonGridStaggerMs[0]}ms`);
const stagger1 = unsafeCSS(`${ButtonGridStaggerMs[1]}ms`);
const stagger2 = unsafeCSS(`${ButtonGridStaggerMs[2]}ms`);

/**
 * Styles for `k3-button-grid`.
 *
 * Gap / size fallbacks only — runtime sets `--k3-btn-grid-gap` and
 * `--k3-btn-grid-size` via `devicePixelSnapCss(2)` so hairlines stay
 * integer device pixels at fractional DPR (e.g. Windows 125%).
 *
 * @see ./button-grid.specs.ts
 */
export const buttonGridStyles = css`
  :host {
    --k3-btn-grid-cell: ${cell};
    --k3-btn-grid-gap: ${gap};
    --k3-btn-grid-size: ${size};
    --k3-btn-grid-outer-r: ${outerR};
    --k3-btn-grid-inner-r: ${innerR};
    --k3-btn-grid-icon: ${icon};
    --k3-btn-grid-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
    --k3-btn-grid-decelerate: var(
      --k3-sys-motion-easing-standard-decelerate,
      cubic-bezier(0.2, 0, 0, 1)
    );
    --k3-btn-grid-effects: var(
      --k3-sys-motion-easing-emphasized-decelerate,
      cubic-bezier(0.05, 0.7, 0.1, 1)
    );
    --k3-btn-grid-state-ms: var(--k3-sys-motion-duration-short4, 200ms);
    --k3-btn-grid-bg: var(--k3-sys-color-primary);
    --k3-btn-grid-fg: var(--k3-sys-color-on-primary);
    --k3-btn-grid-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    --k3-btn-grid-shadow-hover: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    --k3-btn-grid-fab-shadow: 0 1px 3px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    --k3-btn-grid-fab-shadow-hover: 0 2px 6px rgba(0, 0, 0, 0.38),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
    display: inline-block;
    width: var(--k3-btn-grid-size);
    height: var(--k3-btn-grid-size);
    isolation: isolate;
    vertical-align: middle;
    outline: none;
  }

  :host([hidden]) {
    display: none !important;
  }

  /* ── Variants ── */
  :host([variant='tonal']) {
    --k3-btn-grid-bg: var(--k3-sys-color-secondary-container);
    --k3-btn-grid-fg: var(--k3-sys-color-on-secondary-container);
    --k3-btn-grid-shadow: none;
    --k3-btn-grid-shadow-hover: none;
    --k3-btn-grid-fab-shadow: none;
    --k3-btn-grid-fab-shadow-hover: none;
  }

  :host([variant='outlined']) {
    --k3-btn-grid-bg: transparent;
    --k3-btn-grid-fg: var(--k3-sys-color-primary);
    --k3-btn-grid-shadow: none;
    --k3-btn-grid-shadow-hover: none;
    --k3-btn-grid-fab-shadow: none;
    --k3-btn-grid-fab-shadow-hover: none;
  }

  /* ── Shared cell / FAB chrome ── */
  .fab,
  .cell {
    appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
    width: var(--k3-btn-grid-cell);
    height: var(--k3-btn-grid-cell);
    min-width: var(--k3-btn-grid-cell);
    max-width: var(--k3-btn-grid-cell);
    max-height: var(--k3-btn-grid-cell);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: var(--k3-btn-grid-bg);
    color: var(--k3-btn-grid-fg);
    box-shadow: var(--k3-btn-grid-shadow);
    transition: box-shadow var(--k3-btn-grid-state-ms) var(--k3-btn-grid-decelerate);
    font-family: inherit;
    font-size: 0;
    line-height: 1;
  }

  .fab::before,
  .cell::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    background: var(--k3-btn-grid-fg);
    transition: opacity var(--k3-btn-grid-state-ms) var(--k3-btn-grid-decelerate);
    pointer-events: none;
    z-index: 1;
  }

  .fab:hover::before,
  .cell:hover::before {
    opacity: 0.08;
  }

  .fab:focus-visible,
  .cell:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }

  .fab:focus-visible::before,
  .cell:focus-visible::before,
  .fab:active::before,
  .cell:active::before {
    opacity: 0.12;
  }

  .fab:hover,
  .cell:hover {
    box-shadow: var(--k3-btn-grid-shadow-hover);
  }

  :host([variant='outlined']) .fab,
  :host([variant='outlined']) .cell {
    border: 1.5px solid var(--k3-sys-color-outline-variant);
  }

  :host([variant='outlined']) .fab:hover,
  :host([variant='outlined']) .cell:hover {
    border-color: var(--k3-sys-color-outline);
  }

  /* ── FAB ── */
  .fab {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(1);
    border-radius: var(--k3-btn-grid-outer-r);
    z-index: 10;
    box-shadow: var(--k3-btn-grid-fab-shadow);
    transition:
      transform 0.5s var(--k3-btn-grid-spring) 0.2s,
      opacity 0.4s var(--k3-btn-grid-effects) 0.2s,
      box-shadow var(--k3-btn-grid-state-ms) var(--k3-btn-grid-decelerate);
  }

  .fab:hover {
    box-shadow: var(--k3-btn-grid-fab-shadow-hover);
  }

  .fab .icon {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    width: var(--k3-btn-grid-icon);
    height: var(--k3-btn-grid-icon);
    font-size: var(--k3-btn-grid-icon);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  :host([data-state='expanded']) .fab {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
    pointer-events: none;
    transition:
      transform 0.3s var(--k3-btn-grid-decelerate),
      opacity 0.2s var(--k3-btn-grid-decelerate);
  }

  /* ── Grid ── */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, var(--k3-btn-grid-cell));
    grid-template-rows: repeat(3, var(--k3-btn-grid-cell));
    gap: var(--k3-btn-grid-gap);
    width: var(--k3-btn-grid-size);
    height: var(--k3-btn-grid-size);
    box-sizing: border-box;
    transform: scale(0.88);
    transition: transform 0.45s var(--k3-btn-grid-decelerate);
  }

  :host([data-state='expanded']) .grid {
    transform: scale(1);
    transition: transform 0.55s var(--k3-btn-grid-spring) 0.04s;
  }

  /* ── Cells ── */
  .cell {
    transform: scale(0);
    opacity: 0;
    will-change: transform, opacity;
    transition:
      transform 0.42s var(--k3-btn-grid-decelerate),
      opacity 0.28s var(--k3-btn-grid-decelerate);
    transition-delay: 0s;
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  :host([data-state='expanded']) .cell {
    transform: scale(1);
    opacity: 1;
    transition:
      transform 0.5s var(--k3-btn-grid-spring),
      opacity 0.35s var(--k3-btn-grid-effects);
  }

  /* Origins toward grid centre */
  .cell--tl {
    transform-origin: 100% 100%;
  }
  .cell--tc {
    transform-origin: 50% 100%;
  }
  .cell--tr {
    transform-origin: 0% 100%;
  }
  .cell--ml {
    transform-origin: 100% 50%;
  }
  .cell--mc {
    transform-origin: 50% 50%;
  }
  .cell--mr {
    transform-origin: 0% 50%;
  }
  .cell--bl {
    transform-origin: 100% 0%;
  }
  .cell--bc {
    transform-origin: 50% 0%;
  }
  .cell--br {
    transform-origin: 0% 0%;
  }

  /* Asymmetric M3 Expressive radii */
  .cell--tl {
    border-radius: var(--k3-btn-grid-outer-r) var(--k3-btn-grid-inner-r)
      var(--k3-btn-grid-inner-r) var(--k3-btn-grid-inner-r);
  }
  .cell--tc,
  .cell--ml,
  .cell--mc,
  .cell--mr,
  .cell--bc {
    border-radius: var(--k3-btn-grid-inner-r);
  }
  .cell--tr {
    border-radius: var(--k3-btn-grid-inner-r) var(--k3-btn-grid-outer-r)
      var(--k3-btn-grid-inner-r) var(--k3-btn-grid-inner-r);
  }
  .cell--bl {
    border-radius: var(--k3-btn-grid-inner-r) var(--k3-btn-grid-inner-r)
      var(--k3-btn-grid-inner-r) var(--k3-btn-grid-outer-r);
  }
  .cell--br {
    border-radius: var(--k3-btn-grid-inner-r) var(--k3-btn-grid-inner-r)
      var(--k3-btn-grid-outer-r) var(--k3-btn-grid-inner-r);
  }

  /* Stagger open: centre → edges → corners */
  :host([data-state='expanded']) .cell[data-d='0'] {
    transition-delay: ${stagger0};
  }
  :host([data-state='expanded']) .cell[data-d='1'] {
    transition-delay: ${stagger1};
  }
  :host([data-state='expanded']) .cell[data-d='2'] {
    transition-delay: ${stagger2};
  }

  /* ── Pad mode (always expanded) ── */
  :host([data-trigger='pad']) {
    width: auto;
    height: auto;
  }

  :host([data-trigger='pad']) .fab {
    display: none;
  }

  :host([data-trigger='pad']) .grid {
    transform: none;
    transition: none;
  }

  :host([data-trigger='pad']) .cell {
    transform: none;
    opacity: 1;
    transition: none;
  }

  :host([data-trigger='pad']) .cell::before {
    transition: opacity var(--k3-btn-grid-state-ms) var(--k3-btn-grid-decelerate);
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      width: auto;
      height: auto;
    }

    .fab {
      display: none;
    }

    .grid {
      transform: none;
      transition: none;
    }

    .cell {
      transform: none;
      opacity: 1;
      transition: none;
    }

    .fab::before,
    .cell::before {
      transition-duration: 0ms !important;
    }
  }
`;
