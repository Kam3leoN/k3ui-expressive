import { css } from 'lit';

/**
 * M3 / M3E date picker — docked popover or modal.
 * @see https://m3.material.io/components/date-pickers/specs
 * @see https://matraic.github.io/m3e/components/datepicker.html
 */
export const datePickerStyles = css`
  :host {
    --k3-dp-pad: 1.5rem; /* 24 */
    --k3-dp-shape: var(--k3-sys-shape-corner-extra-large); /* 28 modal */
    --k3-dp-shape-docked: var(--k3-sys-shape-corner-large); /* 16 */

    box-sizing: border-box;
    flex-direction: column;
    margin: 0 !important;
    border: 0 !important;
    padding: var(--k3-dp-pad) !important;
    overflow: visible !important;
    color: var(--k3-sys-color-on-surface);
    box-shadow: var(--k3-sys-elevation-level3);
    display: none;
    opacity: 0;
    transform: scaleY(0.8);
    z-index: 200;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([open]),
  :host(:popover-open) {
    display: flex !important;
    opacity: 1;
    transform: scaleY(1);
    transition:
      opacity var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease),
      transform var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease),
      overlay var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease) allow-discrete,
      display var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease) allow-discrete;
  }

  @starting-style {
    :host([open]),
    :host(:popover-open) {
      opacity: 0;
      transform: scaleY(0.8);
    }
  }

  :host([open][data-resolved-variant='docked']),
  :host(:popover-open[data-resolved-variant='docked']) {
    position: fixed !important;
    inset: unset !important;
    margin: 0 !important;
    top: var(--k3-tp-top, 0) !important;
    left: var(--k3-tp-left, 0) !important;
    width: max-content;
    height: max-content;
    min-width: 22.75rem; /* 364 */
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    background: var(--k3-sys-color-surface-container-high);
    border-radius: var(--k3-dp-shape-docked);
    transform-origin: top center;
  }

  :host([open][data-resolved-variant='docked'][data-flip='top']),
  :host(:popover-open[data-resolved-variant='docked'][data-flip='top']) {
    transform-origin: bottom center;
  }

  :host([open][data-resolved-variant='modal']),
  :host(:popover-open[data-resolved-variant='modal']) {
    position: fixed !important;
    inset: 0 !important;
    margin: auto !important;
    width: max-content;
    height: max-content;
    min-width: 20.5rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    background: var(--k3-sys-color-surface-container-high);
    border-radius: var(--k3-dp-shape);
    transform-origin: top center;
    padding-block-start: 1rem !important;
  }

  :host(:popover-open[data-resolved-variant='docked'])::backdrop {
    background: transparent;
  }
  :host(:popover-open[data-resolved-variant='modal'])::backdrop {
    background: color-mix(in srgb, var(--k3-sys-color-scrim, #000) 32%, transparent);
  }

  .scrim {
    display: none;
  }
  :host([open][data-resolved-variant='modal']:not(:popover-open)) .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--k3-sys-color-scrim, #000) 32%, transparent);
    z-index: -1;
  }

  .surface {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .headline {
    margin: 0;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
    font-weight: 500;
    letter-spacing: 0.03125rem;
  }

  .supporting {
    margin: 0.5rem 0 0;
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-headline-large-size, 2rem);
    font-weight: var(--k3-sys-typescale-headline-large-weight, 400);
    line-height: var(--k3-sys-typescale-headline-large-line-height, 2.5rem);
    white-space: normal;
    overflow-wrap: anywhere;
    max-width: 100%;
  }
  /* Range: two rows (Du / Au) — avoids clipping both dates on one line */
  :host([range]) .supporting {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: var(--k3-sys-typescale-title-large-size, 1.375rem);
    font-weight: var(--k3-sys-typescale-title-large-weight, 400);
    line-height: var(--k3-sys-typescale-title-large-line-height, 1.75rem);
  }
  :host([range]) .supporting .range-line {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :host([range]) .supporting .range-label {
    color: var(--k3-sys-color-on-surface-variant);
    font-weight: 500;
  }

  :host([data-resolved-variant='docked']) .headline,
  :host([data-resolved-variant='docked']) .supporting {
    display: none;
  }

  .divider {
    height: 1px;
    margin-block: 1rem 0.5rem;
    background: var(--k3-sys-color-outline-variant);
  }

  :host([data-resolved-variant='docked']) .divider {
    display: none;
  }

  .cal-host {
    margin-block-start: 0.5rem;
    min-width: 0;
  }

  /* Wider surface when 2+ month panes (paged) or range scroll */
  :host([range]),
  :host([months='2']),
  :host([months='3']) {
    min-width: min(40rem, calc(100vw - 2rem));
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
    min-height: 2.5rem;
  }
  .spacer {
    flex: 1 1 auto;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }
`;
