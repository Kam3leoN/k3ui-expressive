import { css, unsafeCSS } from 'lit';
import { BubbleSpecs } from './bubble.specs.js';

/**
 * Styles for `k3-bubble` — v1 bubble layout + M3 tokens.
 */
export const bubbleStyles = css`
  :host {
    display: block;
    --bubble-tail-mask: ${unsafeCSS(BubbleSpecs.tailMask)};
  }

  .bubble {
    display: grid;
    grid-auto-rows: min-content;
    column-gap: var(--k3-sys-spacing-space150, 0.75rem);
    padding-block: var(--k3-sys-spacing-space50, 0.25rem);
  }

  .bubble--start {
    place-items: start;
    grid-template-columns: auto 1fr;
  }

  .bubble--start .bubble__header,
  .bubble--start .bubble__footer,
  .bubble--start .bubble__body {
    grid-column-start: 2;
  }

  .bubble--start .bubble__image {
    grid-column-start: 1;
    grid-row: span 2;
    align-self: end;
  }

  .bubble--start .bubble__body {
    border-end-start-radius: 0;
  }

  .bubble--start .bubble__body::before {
    transform: rotateY(0deg);
    inset-inline-start: -0.75rem;
  }

  :host([dir='rtl']) .bubble--start .bubble__body::before {
    transform: rotateY(180deg);
  }

  .bubble--end {
    place-items: end;
    grid-template-columns: 1fr auto;
  }

  .bubble--end .bubble__header,
  .bubble--end .bubble__footer,
  .bubble--end .bubble__body {
    grid-column-start: 1;
  }

  .bubble--end .bubble__image {
    grid-column-start: 2;
    grid-row: span 2;
    align-self: end;
  }

  .bubble--end .bubble__body {
    border-end-end-radius: 0;
  }

  .bubble--end .bubble__body::before {
    transform: rotateY(180deg);
    inset-inline-start: 100%;
  }

  :host([dir='rtl']) .bubble--end .bubble__body::before {
    transform: rotateY(0deg);
  }

  .bubble__image {
    align-self: end;
  }

  .bubble__image ::slotted(*) {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }

  .bubble__header {
    display: flex;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    align-items: center;
    font-size: 0.6875rem;
    grid-row-start: 1;
  }

  .bubble__header ::slotted(time) {
    opacity: 0.5;
  }

  .bubble__footer {
    display: flex;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    align-items: center;
    font-size: 0.6875rem;
    grid-row-start: 3;
    opacity: 0.85;
  }

  .bubble__footer ::slotted([muted]),
  .bubble__footer ::slotted(.muted) {
    opacity: 0.5;
  }

  .bubble__body {
    position: relative;
    display: block;
    width: fit-content;
    max-width: 90%;
    min-width: 2.5rem;
    min-height: 2rem;
    padding: var(--k3-sys-spacing-space100, 0.5rem) var(--k3-sys-spacing-space200, 1rem);
    border-radius: var(--k3-sys-shape-corner-small, 8px);
    background-color: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    grid-row-end: 3;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .bubble__body::before {
    content: '';
    position: absolute;
    bottom: 0;
    width: 0.75rem;
    height: 0.75rem;
    background-color: inherit;
    mask-repeat: no-repeat;
    mask-image: var(--bubble-tail-mask);
    mask-position: 0 -1px;
    mask-size: 0.8125rem;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-image: var(--bubble-tail-mask);
    -webkit-mask-position: 0 -1px;
    -webkit-mask-size: 0.8125rem;
  }

  .bubble__body--primary {
    background-color: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
  }

  .bubble__body--secondary {
    background-color: var(--k3-sys-color-secondary);
    color: var(--k3-sys-color-on-secondary);
  }

  .bubble__body--accent {
    background-color: var(--k3-sys-color-tertiary);
    color: var(--k3-sys-color-on-tertiary);
  }

  .bubble__body--neutral {
    background-color: var(--k3-sys-color-inverse-surface);
    color: var(--k3-sys-color-inverse-on-surface);
  }

  .bubble__body--info {
    background-color: var(--k3-sys-color-info);
    color: var(--k3-sys-color-on-info);
  }

  .bubble__body--success {
    background-color: var(--k3-sys-color-success);
    color: var(--k3-sys-color-on-success);
  }

  .bubble__body--warning {
    background-color: var(--k3-sys-color-warning);
    color: var(--k3-sys-color-on-warning);
  }

  .bubble__body--error {
    background-color: var(--k3-sys-color-error);
    color: var(--k3-sys-color-on-error);
  }

  .bubble__image[hidden],
  .bubble__header[hidden],
  .bubble__footer[hidden] {
    display: none;
  }
`;
