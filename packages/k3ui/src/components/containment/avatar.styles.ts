import { css } from 'lit';

/**
 * Styles for `k3-avatar` / `k3-avatar-group` — M3 surfaces + status dots.
 * Status position uses logical insets so LTR/RTL stay mirrored.
 */
export const avatarStyles = css`
  :host {
    --k3-avatar-size: 2.5rem; /* 40 — md */
    --k3-avatar-font: var(--k3-sys-typescale-title-medium-size, 1rem);
    --k3-avatar-badge-size: 0.75rem; /* 12 */
    --k3-avatar-badge-ring: 0.125rem; /* 2 */
    --k3-avatar-radius: var(--k3-sys-shape-corner-full);
    --k3-avatar-bg: var(--k3-sys-color-secondary-container);
    --k3-avatar-fg: var(--k3-sys-color-on-secondary-container);
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: var(--k3-avatar-size);
    height: var(--k3-avatar-size);
    vertical-align: middle;
  }

  :host([size='sm']) {
    --k3-avatar-size: 2rem; /* 32 */
    --k3-avatar-font: var(--k3-sys-typescale-label-large-size, 0.875rem);
    --k3-avatar-badge-size: 0.625rem; /* 10 */
  }
  :host([size='lg']) {
    --k3-avatar-size: 3.5rem; /* 56 */
    --k3-avatar-font: var(--k3-sys-typescale-title-large-size, 1.375rem);
    --k3-avatar-badge-size: 0.875rem; /* 14 */
  }

  :host([shape='rounded']) {
    --k3-avatar-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
  }
  :host([shape='square']) {
    --k3-avatar-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem);
  }

  :host([data-tone='primary']) {
    --k3-avatar-bg: var(--k3-sys-color-primary-container);
    --k3-avatar-fg: var(--k3-sys-color-on-primary-container);
  }
  :host([data-tone='secondary']),
  :host(:not([data-tone])) {
    --k3-avatar-bg: var(--k3-sys-color-secondary-container);
    --k3-avatar-fg: var(--k3-sys-color-on-secondary-container);
  }
  :host([data-tone='tertiary']) {
    --k3-avatar-bg: var(--k3-sys-color-tertiary-container);
    --k3-avatar-fg: var(--k3-sys-color-on-tertiary-container);
  }
  :host([data-tone='error']) {
    --k3-avatar-bg: var(--k3-sys-color-error-container);
    --k3-avatar-fg: var(--k3-sys-color-on-error-container);
  }
  :host([data-tone='neutral']) {
    --k3-avatar-bg: var(--k3-sys-color-surface-container-highest);
    --k3-avatar-fg: var(--k3-sys-color-on-surface);
  }

  .face {
    position: relative;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
    border-radius: var(--k3-avatar-radius);
    background: var(--k3-avatar-bg);
    color: var(--k3-avatar-fg);
    font-size: var(--k3-avatar-font);
    font-weight: 500;
    line-height: 1;
    user-select: none;
    -webkit-user-select: none;
  }
  :host([variant='outlined']) .face {
    background: var(--k3-sys-color-surface);
    color: var(--k3-avatar-fg);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
  }
  :host([variant='elevated']) .face {
    box-shadow: var(--k3-sys-elevation-level1);
  }

  .face img,
  ::slotted(img) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .face img[hidden] {
    display: none;
  }

  .initials,
  .icon {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    text-transform: uppercase;
  }
  .icon {
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: calc(var(--k3-avatar-size) * 0.55);
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  /* Interactive — menu trigger / button */
  button.face {
    margin: 0;
    padding: 0;
    border: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
    -webkit-tap-highlight-color: transparent;
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial),
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }
  button.face:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }
  button.face:active {
    border-radius: var(--k3-sys-shape-corner-full);
  }

  /* Status / custom badge — logical end + block-end (RTL-aware) */
  .badge,
  ::slotted([slot='badge']) {
    position: absolute;
    z-index: 1;
    inset-block-end: 0;
    inset-inline-end: 0;
    box-sizing: border-box;
    width: var(--k3-avatar-badge-size);
    height: var(--k3-avatar-badge-size);
    min-width: var(--k3-avatar-badge-size);
    border-radius: var(--k3-sys-shape-corner-full);
    background: var(--k3-sys-color-surface);
    box-shadow: 0 0 0 var(--k3-avatar-badge-ring) var(--k3-sys-color-surface);
    display: grid;
    place-items: center;
    overflow: hidden;
    pointer-events: none;
  }
  ::slotted([slot='badge']) {
    font-size: calc(var(--k3-avatar-badge-size) * 0.75);
    color: var(--k3-sys-color-on-primary);
    background: var(--k3-sys-color-primary);
  }

  .badge[data-status='online'] {
    background: #34a853;
  }
  .badge[data-status='offline'] {
    background: var(--k3-sys-color-outline);
  }
  /* Idle — v1 crescent (radial mask + rgb(255, 185, 51)) */
  .badge[data-status='idle'] {
    background: transparent;
  }
  .badge[data-status='idle']::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: rgb(255, 185, 51);
    mask-image: radial-gradient(
      90% 100% at 90% 30%,
      transparent calc(50% - 0.5px),
      #000 calc(50% + 0.5px)
    );
    -webkit-mask-image: radial-gradient(
      90% 100% at 90% 30%,
      transparent calc(50% - 0.5px),
      #000 calc(50% + 0.5px)
    );
  }
  .badge[data-status='away'] {
    background: #fa7b17;
  }
  .badge[data-status='dnd'],
  .badge[data-status='busy'] {
    background: rgb(255, 40, 80);
  }
  /* DND — v1 avatar__dnd-line (pill, -9deg, tinted white) */
  .badge[data-status='dnd'] {
    overflow: visible;
  }
  .badge[data-status='dnd']::after {
    content: '';
    display: block;
    width: 80%;
    aspect-ratio: 4 / 1;
    height: auto;
    border-radius: 100vmax;
    rotate: -9deg;
    background: color-mix(in oklch, rgb(255, 40, 80), white 50%);
  }

  .badge-icon {
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: calc(var(--k3-avatar-badge-size) * 0.85);
    color: #fff;
    line-height: 1;
    font-variation-settings:
      'FILL' 1,
      'wght' 500,
      'GRAD' 0,
      'opsz' 20;
  }
`;

export const avatarGroupStyles = css`
  :host {
    --k3-avatar-size: 2.5rem; /* md */
    /* Same overlap for stack / +count / +icon / LTR / RTL */
    --k3-avatar-group-overlap: calc(var(--k3-avatar-size) * 0.4);
    --k3-avatar-group-ring: 2px;
    --k3-avatar-group-gap: var(--k3-layout-gutter, 0.5rem);
    display: inline-flex;
    align-items: center;
    max-width: 100%;
  }
  :host([size='sm']) {
    --k3-avatar-size: 2rem;
  }
  :host([size='md']) {
    --k3-avatar-size: 2.5rem;
  }
  :host([size='lg']) {
    --k3-avatar-size: 3.5rem;
  }

  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 0;
  }

  /* Stack: every item after the first pulls by the same overlap (logical → RTL OK) */
  :host([layout='stack']) ::slotted(k3-avatar),
  :host([layout='stack']) ::slotted(k3-avatar-group-count),
  :host([layout='stack']) .count {
    position: relative;
    box-shadow: 0 0 0 var(--k3-avatar-group-ring) var(--k3-sys-color-surface);
    border-radius: var(--k3-sys-shape-corner-full);
    margin-inline-start: 0;
  }
  :host([layout='stack']) ::slotted(:not(:first-child)),
  :host([layout='stack']) .count {
    margin-inline-start: calc(var(--k3-avatar-group-overlap) * -1);
  }
  :host([layout='stack']) ::slotted(k3-avatar-group-count),
  :host([layout='stack']) .count {
    z-index: 100;
  }

  :host([layout='grid']) {
    display: block;
    width: 100%;
  }
  :host([layout='grid']) .row {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(var(--k3-avatar-size), auto)
    );
    gap: var(--k3-avatar-group-gap);
    justify-content: start;
  }
  :host([layout='grid']) ::slotted(k3-avatar),
  :host([layout='grid']) ::slotted(k3-avatar-group-count),
  :host([layout='grid']) .count {
    margin-inline-start: 0;
    box-shadow: none;
  }

  .count {
    display: inline-grid;
    place-items: center;
    box-sizing: border-box;
    width: var(--k3-avatar-size);
    height: var(--k3-avatar-size);
    border-radius: var(--k3-sys-shape-corner-full);
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: 600;
    line-height: 1;
    direction: ltr;
    unicode-bidi: isolate;
  }
  :host([size='sm']) .count {
    font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
  }
  :host([size='lg']) .count {
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
  }
  .count .ms,
  .count [data-k3-icon] {
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: calc(var(--k3-avatar-size) * 0.45);
    font-variation-settings:
      'FILL' 0,
      'wght' 500,
      'GRAD' 0,
      'opsz' 24;
  }
`;
