import { css, unsafeCSS } from 'lit';
import {
  CounterCircleDp,
  CounterFontRem,
  CounterMinWidthDp,
  CounterNumberInnerGapEm,
  CounterValueGapDp,
} from './counter.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const gap = rem(CounterValueGapDp);
const innerGap = unsafeCSS(`${CounterNumberInnerGapEm}em`);

const xsC = rem(CounterCircleDp.xs);
const smC = rem(CounterCircleDp.sm);
const mdC = rem(CounterCircleDp.md);
const lgC = rem(CounterCircleDp.lg);
const xlC = rem(CounterCircleDp.xl);

const xsMw = rem(CounterMinWidthDp.xs);
const smMw = rem(CounterMinWidthDp.sm);
const mdMw = rem(CounterMinWidthDp.md);
const lgMw = rem(CounterMinWidthDp.lg);
const xlMw = rem(CounterMinWidthDp.xl);

const xsFs = unsafeCSS(`${CounterFontRem.xs}rem`);
const smFs = unsafeCSS(`${CounterFontRem.sm}rem`);
const mdFs = unsafeCSS(`${CounterFontRem.md}rem`);
const lgFs = unsafeCSS(`${CounterFontRem.lg}rem`);
const xlFs = unsafeCSS(`${CounterFontRem.xl}rem`);

/**
 * Styles for `k3-counter` — primary pill + tonal value spinbutton.
 *
 * @see ./counter.specs.ts
 */
export const counterStyles = css`
  :host {
    --k3-counter-circle: ${mdC};
    --k3-counter-min-w: ${mdMw};
    --k3-counter-font: ${mdFs};
    --k3-counter-gap: ${gap};
    --k3-counter-number-pad: ${innerGap};
    display: inline-block;
    vertical-align: middle;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([size='xs']) {
    --k3-counter-circle: ${xsC};
    --k3-counter-min-w: ${xsMw};
    --k3-counter-font: ${xsFs};
  }
  :host([size='sm']) {
    --k3-counter-circle: ${smC};
    --k3-counter-min-w: ${smMw};
    --k3-counter-font: ${smFs};
  }
  :host([size='md']) {
    --k3-counter-circle: ${mdC};
    --k3-counter-min-w: ${mdMw};
    --k3-counter-font: ${mdFs};
  }
  :host([size='lg']) {
    --k3-counter-circle: ${lgC};
    --k3-counter-min-w: ${lgMw};
    --k3-counter-font: ${lgFs};
  }
  :host([size='xl']) {
    --k3-counter-circle: ${xlC};
    --k3-counter-min-w: ${xlMw};
    --k3-counter-font: ${xlFs};
  }

  :host([disabled]) {
    opacity: 0.6;
    pointer-events: none;
  }

  :host([readonly]) .wrapper {
    cursor: default;
  }

  .wrapper {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    justify-content: space-between;
    gap: var(--k3-counter-gap);
    width: max-content;
    min-width: var(--k3-counter-min-w);
    height: var(--k3-counter-circle);
    padding: 0;
    border-radius: 9999px;
    background-color: var(--k3-sys-color-primary);
    box-shadow: 0 0 2em rgba(0, 0, 0, 0.2);
    overflow: visible;
    transition: background-color 0.2s ease;
  }

  .btn {
    flex-shrink: 0;
    width: var(--k3-counter-circle);
    height: var(--k3-counter-circle);
    min-width: var(--k3-counter-circle);
    min-height: var(--k3-counter-circle);
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
    font-size: var(--k3-counter-font);
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .btn .glyph {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-counter-font);
    line-height: 1;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn:not(:disabled):active {
    transform: scale(0.95);
  }

  .number {
    flex-shrink: 0;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: max-content;
    min-width: var(--k3-counter-circle);
    height: var(--k3-counter-circle);
    min-height: var(--k3-counter-circle);
    padding: var(--k3-counter-number-pad);
    border-radius: 9999px;
    background-color: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
    font-size: var(--k3-counter-font);
    font-weight: 600;
    white-space: nowrap;
    touch-action: none;
    cursor: grab;
    user-select: none;
    transition: transform 0.3s ease;
  }

  .number:hover {
    cursor: grab;
  }

  .number:active,
  .number[data-dragging] {
    cursor: grabbing;
  }

  :host([disabled]) .number,
  :host([readonly]) .number {
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .number {
      transition: none;
    }
  }
`;
