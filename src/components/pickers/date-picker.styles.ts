import { css, type CSSResultGroup } from 'lit';
import { enterScaleYPopover } from '../../motion/enter.js';

/**
 * M3 / M3E date picker — docked popover or modal.
 * Open enter = same FastSpatial scaleY spring as menus / dialogs (`enterScaleYPopover`).
 * Docked: origin top (flip → bottom). Modal: center, like `enterDialogMotion`.
 *
 * @see https://m3.material.io/components/date-pickers/specs
 * @see https://matraic.github.io/m3e/components/datepicker.html
 * @see https://noph.dev/components/dialog
 */
export const datePickerStyles: CSSResultGroup = [
  enterScaleYPopover(
    ':host([open][data-resolved-variant="docked"]), :host(:popover-open[data-resolved-variant="docked"])',
    {
      origin: 'top center',
      closingSelector:
        ':host([data-closing][data-resolved-variant="docked"]), :host([data-closing]:popover-open[data-resolved-variant="docked"])',
    },
  ),
  enterScaleYPopover(
    ':host([open][data-resolved-variant="modal"]) .surface, :host(:popover-open[data-resolved-variant="modal"]) .surface',
    {
      origin: 'center center',
      closingSelector:
        ':host([data-closing][data-resolved-variant="modal"]) .surface',
    },
  ),
  css`
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
      /* Noph docked ≈ 360 + pad — calendar body dominates header */
      --k3-dp-pad: 0.75rem 1rem 0.5rem; /* tighter chrome */
      min-width: 22.5rem; /* 360 */
      max-width: calc(100vw - 1rem);
      max-height: calc(100vh - 1rem);
      background: var(--k3-sys-color-surface-container-high);
      border-radius: var(--k3-dp-shape-docked);
      transform-origin: top center;
    }

    /* First docked open — stage closed, then release for scaleY enter */
    :host([open][data-resolved-variant='docked'][data-enter]),
    :host(:popover-open[data-resolved-variant='docked'][data-enter]) {
      opacity: 0 !important;
      transform: scaleY(0.8) !important;
      animation: none !important;
      transition: none !important;
    }

    /* Docked tight viewport — k3 edge scrollbar on host (never UA arrows) */
    :host([open][data-resolved-variant='docked'][data-clip]),
    :host(:popover-open[data-resolved-variant='docked'][data-clip]) {
      overflow-x: hidden !important;
      /* scroll (not auto) — stable thumb while clipped; no appear/hide flash */
      overflow-y: scroll !important;
      overscroll-behavior: contain;
      --k3-scroll-size: 0.375rem;
      --k3-scroll-track-inset: var(--k3-dp-shape-docked);
    }
    :host([open][data-resolved-variant='docked'][data-clip])::-webkit-scrollbar,
    :host(:popover-open[data-resolved-variant='docked'][data-clip])::-webkit-scrollbar {
      width: var(--k3-scroll-size, 0.375rem);
      height: var(--k3-scroll-size, 0.375rem);
    }
    :host([open][data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-button,
    :host(:popover-open[data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-button {
      width: 0;
      height: 0;
      display: none;
    }
    :host([open][data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-track,
    :host(:popover-open[data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-track {
      background: transparent;
      margin-block: var(--k3-scroll-track-inset, 0);
    }
    :host([open][data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-thumb,
    :host(:popover-open[data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--k3-sys-color-on-surface-variant) 40%, transparent);
      border-radius: var(--k3-sys-shape-corner-full, 999px);
      min-height: 2rem;
    }
    :host([open][data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-corner,
    :host(:popover-open[data-resolved-variant='docked'][data-clip])::-webkit-scrollbar-corner {
      background: transparent;
    }

    :host([open][data-resolved-variant='docked'][data-flip='top']),
    :host(:popover-open[data-resolved-variant='docked'][data-flip='top']) {
      transform-origin: bottom center;
    }

    /*
     * Modal — full-viewport host (scrim + centered surface).
     * Popover UA ::backdrop is pointer-events:none; real .scrim closes on click.
     */
    :host([open][data-resolved-variant='modal']),
    :host(:popover-open[data-resolved-variant='modal']) {
      position: fixed !important;
      inset: 0 !important;
      margin: 0 !important;
      width: auto !important;
      height: auto !important;
      min-width: 0;
      max-width: none;
      max-height: none;
      padding: 0 !important;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      display: grid !important;
      place-items: center;
      opacity: 1;
      transform: none;
      overflow: hidden !important;
    }

    :host(:popover-open[data-resolved-variant='docked'])::backdrop {
      background: transparent;
    }
    :host(:popover-open[data-resolved-variant='modal'])::backdrop {
      background: transparent;
    }

    .scrim {
      display: none;
    }
    :host([open][data-resolved-variant='modal']) .scrim,
    :host(:popover-open[data-resolved-variant='modal']) .scrim {
      display: block;
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--k3-sys-color-scrim, #000) 32%, transparent);
      z-index: 0;
    }

    .surface {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    :host([open][data-resolved-variant='modal']) .surface,
    :host(:popover-open[data-resolved-variant='modal']) .surface {
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      width: max-content;
      min-width: 22.5rem; /* 360 — match Noph dialog */
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
      padding: 0;
      background: var(--k3-sys-color-surface-container-high);
      border-radius: var(--k3-dp-shape);
      box-shadow: var(--k3-sys-elevation-level3);
      overflow: hidden; /* clip radius; scroll on .surface-scroll */
    }

    /*
     * Modal chrome — head/foot fixed; months scroll on edge-sticky k3-scroll
     * (timepicker pattern: overflow on scrollport, pad on inner).
     */
    :host([open][data-resolved-variant='modal']) .surface-head,
    :host(:popover-open[data-resolved-variant='modal']) .surface-head,
    :host([open][data-resolved-variant='modal']) .surface-foot,
    :host(:popover-open[data-resolved-variant='modal']) .surface-foot {
      flex: 0 0 auto;
      box-sizing: border-box;
      padding-inline: var(--k3-dp-pad);
    }
    :host([open][data-resolved-variant='modal']) .surface-head,
    :host(:popover-open[data-resolved-variant='modal']) .surface-head {
      padding-block-start: 1rem;
    }
    :host([open][data-resolved-variant='modal']) .surface-foot,
    :host(:popover-open[data-resolved-variant='modal']) .surface-foot {
      padding-block-end: var(--k3-dp-pad);
    }

    :host([open][data-resolved-variant='modal']) .surface-scroll,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll {
      flex: 1 1 auto;
      min-height: 0;
      max-height: inherit;
      box-sizing: border-box;
      --k3-scroll-size: 0.375rem;
      /* Inset thumb from modal corner radius — flush to side edge */
      --k3-scroll-track-inset: 0;
      overflow-x: hidden;
      /* scroll (not auto) — stable thumb; no appear/hide flash */
      overflow-y: scroll;
      overscroll-behavior: contain;
    }

    :host([open][data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar {
      width: var(--k3-scroll-size);
      height: var(--k3-scroll-size);
    }
    :host([open][data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-button,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-button {
      width: 0;
      height: 0;
      display: none;
    }
    :host([open][data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-thumb,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--k3-sys-color-on-surface-variant) 40%, transparent);
      border-radius: var(--k3-sys-shape-corner-full, 999px);
    }
    :host([open][data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-track,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll.k3-scroll::-webkit-scrollbar-track {
      background: transparent;
      margin-block: var(--k3-scroll-track-inset, 0);
    }

    :host([open][data-resolved-variant='modal']) .surface-scroll-inner,
    :host(:popover-open[data-resolved-variant='modal']) .surface-scroll-inner {
      padding-inline: var(--k3-dp-pad);
      padding-block: 0.25rem 0.5rem;
    }

    :host([open][data-resolved-variant='modal']) .surface-inner,
    :host(:popover-open[data-resolved-variant='modal']) .surface-inner {
      padding: var(--k3-dp-pad);
      padding-block-start: 1rem;
    }

    /* Modal header — title + compact value + mode toggle (Noph) */
    .modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .modal-head-text {
      flex: 1 1 auto;
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
      margin: 0.25rem 0 0;
      color: var(--k3-sys-color-on-surface);
      font-size: var(--k3-sys-typescale-headline-large-size, 2rem);
      font-weight: var(--k3-sys-typescale-headline-large-weight, 400);
      line-height: var(--k3-sys-typescale-headline-large-line-height, 2.5rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    /*
     * Range: always shows 4-digit years — allow wrap so both ends stay readable
     * (ex. 24 nov. 2026 – 27 nov. 2026).
     */
    :host([range]) .supporting {
      font-size: var(--k3-sys-typescale-title-large-size, 1.375rem);
      font-weight: var(--k3-sys-typescale-title-large-weight, 400);
      line-height: var(--k3-sys-typescale-title-large-line-height, 1.75rem);
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      overflow-wrap: anywhere;
    }

    .ms-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 3rem;
      height: 3rem;
      margin-block-start: 0.25rem;
      border-radius: 50%;
      font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--k3-sys-color-on-surface-variant);
      cursor: pointer;
    }
    .ms-btn:hover {
      background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
    }
    .ms-btn .ms,
    .ms-btn [data-k3-icon] {
      font-family: inherit;
      font-size: inherit;
      line-height: 1;
    }

    :host([data-resolved-variant='docked']) .modal-head,
    :host([data-resolved-variant='docked']) .divider {
      display: none;
    }

    .divider {
      height: 1px;
      margin-block: 0.75rem 0.5rem;
      background: var(--k3-sys-color-outline-variant);
    }

    .input-host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-block: 0.5rem 0.25rem;
      min-width: min(22.5rem, 100%);
      width: 100%;
    }
    .input-host--range {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      align-items: start;
    }
    .input-host k3-text-field {
      width: 100%;
      min-width: 0;
    }

    .cal-host {
      margin-block-start: 0.25rem;
      min-width: 0;
      width: min(22.5rem, 100%); /* day grid owns the width */
    }

    /* Multi-month paged — let panes sit side by side */
    :host([months='2']) .cal-host,
    :host([months='3']) .cal-host {
      width: max-content;
      max-width: 100%;
    }
    :host([range]) .cal-host {
      width: min(22.5rem, 100%); /* scroll list = one column */
    }
    /*
     * Range modal: wide enough for years in headline; fixed height so the
     * edge k3-scroll viewport engages (months stack, head/foot stay put).
     */
    :host([range][open][data-resolved-variant='modal']) .surface,
    :host([range]:popover-open[data-resolved-variant='modal']) .surface {
      min-width: min(26rem, calc(100vw - 2rem));
      height: min(40rem, calc(100vh - 2rem));
      max-height: calc(100vh - 2rem);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-block-start: 0;
      min-height: 2.5rem;
    }
    :host([data-resolved-variant='docked']) .actions {
      margin-block-start: 0.125rem;
    }
    .spacer {
      flex: 1 1 auto;
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.38;
    }
  `,
];
