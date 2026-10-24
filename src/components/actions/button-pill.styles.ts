import { css, unsafeCSS } from 'lit';
import {
  ButtonPillIconDp,
  ButtonPillIndicatorHDp,
  ButtonPillIndicatorWDp,
  ButtonPillRowGapDp,
  ButtonPillRowHDp,
  ButtonPillRowPadInlineEndDp,
  ButtonPillRowPadInlineStartDp,
  ButtonPillVerticalMinHDp,
} from './button-pill.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

/**
 * Button Pill — vertical (icon pill + label below) · horizontal (icon+label pill).
 * Spring scaleX selected / hover / menu-open — same motion as nav destinations.
 */
export const buttonPillStyles = css`
  :host {
    --k3-button-pill-w: ${rem(ButtonPillIndicatorWDp)};
    --k3-button-pill-h: ${rem(ButtonPillIndicatorHDp)};
    --k3-button-pill-h-row: ${rem(ButtonPillRowHDp)};
    --k3-button-pill-gap: ${rem(ButtonPillRowGapDp)};
    --k3-button-pill-pad-inline: ${rem(ButtonPillRowPadInlineStartDp)}
      ${rem(ButtonPillRowPadInlineEndDp)};
    --k3-button-pill-icon: ${rem(ButtonPillIconDp)};
    --k3-button-pill-min-h: ${rem(ButtonPillVerticalMinHDp)};
    --k3-button-pill-motion: var(--k3-sys-motion-duration-spatial-default, 500ms)
      var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial));
    --k3-button-pill-effects: var(--k3-sys-motion-duration-effects-default, 200ms)
      var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
    display: inline-flex;
    vertical-align: middle;
    box-sizing: border-box;
    width: auto;
    min-width: 0;
    max-width: 100%;
  }
  :host([stretch]),
  :host([layout='horizontal'][stretch]) {
    display: flex;
    width: 100%;
    align-self: stretch;
  }
  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }

  .item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    box-sizing: border-box;
    width: 100%;
    min-height: var(--k3-button-pill-min-h);
    padding: 0.375rem 0.25rem;
    border: 0;
    margin: 0;
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    font: inherit;
    cursor: pointer;
    text-decoration: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    z-index: 0;
  }
  .item:focus,
  .item:focus-visible {
    outline: none;
  }
  .item:hover,
  :host([menu-open]) .item {
    color: var(--k3-sys-color-on-surface);
  }

  .shell {
    position: relative;
    z-index: 0;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: var(--k3-button-pill-w);
    height: var(--k3-button-pill-h);
    flex-shrink: 0;
    border-radius: var(--k3-sys-shape-corner-full);
  }

  .shell::before,
  .shell::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: transparent;
    transform: scaleX(0);
    transform-origin: 50% 50%;
    pointer-events: none;
    transition:
      transform var(--k3-button-pill-motion),
      background-color var(--k3-button-pill-effects);
  }

  .shell.pill-reset-highlight::before,
  .shell.pill-reset-selected::after {
    transition: none !important;
    transform: scaleX(0) !important;
    background-color: transparent !important;
  }

  .shell::before {
    z-index: -2;
  }
  .item:hover .shell::before,
  .item:focus-visible .shell::before,
  .shell.highlight::before {
    transform: scaleX(1);
    background-color: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 8%,
      transparent
    );
  }
  :host([menu-open]:not([selected])) .shell.highlight::before {
    background-color: color-mix(
      in srgb,
      var(--k3-sys-color-secondary-container) 55%,
      transparent
    );
  }
  :host([menu-open][selected]) .shell.highlight::before {
    background-color: color-mix(
      in srgb,
      var(--k3-sys-color-on-secondary-container) 12%,
      transparent
    );
  }

  .shell::after {
    z-index: -1;
  }
  .shell.selected::after {
    transform: scaleX(1);
    background-color: var(--k3-sys-color-secondary-container);
  }

  @starting-style {
    .item:hover .shell::before,
    .item:focus-visible .shell::before,
    .shell.highlight::before {
      transform: scaleX(0);
      background-color: transparent;
    }
    .shell.selected::after {
      transform: scaleX(0);
      background-color: transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .shell::before,
    .shell::after {
      transition: none;
    }
  }

  .icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-button-pill-icon);
    height: var(--k3-button-pill-icon);
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: var(--k3-button-pill-icon);
    line-height: 1;
    font-weight: normal;
    speak: never;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    transition:
      font-variation-settings var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
      color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
  }
  :host([selected]) .icon {
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    color: var(--k3-sys-color-on-secondary-container);
  }

  .label {
    position: relative;
    z-index: 1;
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
    font-weight: 500;
    line-height: 1rem;
    text-align: center;
    color: inherit;
    transition: color var(--k3-sys-motion-duration-short4)
      var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
  }
  :host([selected]) .label {
    color: var(--k3-sys-color-secondary);
    font-weight: 600;
  }

  /* Horizontal — icon + label inside the 56dp pill */
  :host([layout='horizontal']) .item {
    flex-direction: row;
    align-items: center;
    min-height: 0;
    padding: 0;
    width: auto;
  }
  :host([layout='horizontal'][stretch]) .item {
    width: 100%;
  }
  :host([layout='horizontal']) .shell {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--k3-button-pill-gap);
    width: auto;
    height: var(--k3-button-pill-h-row);
    padding: 0;
    padding-inline: var(--k3-button-pill-pad-inline);
  }
  :host([layout='horizontal'][stretch]) .shell {
    width: 100%;
    justify-content: flex-start;
  }
  :host([layout='horizontal']) .label {
    display: flex;
    align-items: center;
    height: var(--k3-button-pill-icon);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: 1;
    text-align: start;
    max-width: none;
  }
  :host([layout='horizontal'][selected]) .label {
    color: var(--k3-sys-color-on-secondary-container);
  }
`;
