import { css, type CSSResultGroup } from 'lit';
import { enterScaleYPopover } from '../../motion/enter.js';

/**
 * M3 / M3E time picker — docked popover or modal.
 * Horizontal orientation applies to dial layout only; keyboard is always vertical.
 * Field boxes: 96×80 everywhere (dial · keyboard · 12h · 24h · V/H).
 *
 * Open enter = FastSpatial scaleY spring (`enterScaleYPopover`, same as menus / dialogs).
 * Dial face: scale 0.8→1 when switching keyboard→dial (Noph ClockDial enter).
 *
 * @see https://m3.material.io/components/time-pickers/specs
 * @see https://matraic.github.io/m3e/components/timepicker.html
 * @see https://noph.dev/components/time-picker
 */
export const timePickerStyles: CSSResultGroup = [
  /* Docked — host is the animated panel (scoped close — never modal host) */
  enterScaleYPopover(
    ':host([open][data-resolved-variant="docked"]), :host(:popover-open[data-resolved-variant="docked"])',
    {
      origin: 'top center',
      closingSelector:
        ':host([data-closing][data-resolved-variant="docked"]), :host([data-closing]:popover-open[data-resolved-variant="docked"])',
    },
  ),
  /* Modal — surface scales like k3-dialog basic (center · spatial-fast bounce) */
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
    --k3-tp-pad: 1.5rem; /* 24 */
    --k3-tp-dial-size: 16rem; /* 256 */
    --k3-tp-field-h: 5rem; /* 80 */
    --k3-tp-field-w: 6rem; /* 96 */
    --k3-tp-sep-w: 1.5rem; /* 24 */
    --k3-tp-period-w: 3.25rem; /* 52 */
    --k3-tp-label-gap: 0.25rem; /* 4 */
    --k3-tp-shape: var(--k3-sys-shape-corner-extra-large); /* 28 modal */
    --k3-tp-shape-docked: var(--k3-sys-shape-corner-large); /* 16 */

    box-sizing: border-box;
    flex-direction: column;
    /* !important — UA popover attr beats bare :host for padding/margin */
    margin: 0 !important;
    border: 0 !important;
    padding: var(--k3-tp-pad) !important;
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

  /* Docked — beat UA popover inset:0 / margin:auto */
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
    background: var(--k3-sys-color-surface-container);
    border-radius: var(--k3-tp-shape-docked);
    transform-origin: top center;
  }

  /*
   * First docked open: stage closed paint after showPopover, then release so
   * scaleY enter actually runs (@starting-style alone skips first popover show).
   */
  :host([open][data-resolved-variant='docked'][data-enter]),
  :host(:popover-open[data-resolved-variant='docked'][data-enter]) {
    opacity: 0 !important;
    transform: scaleY(0.8) !important;
    animation: none !important;
    transition: none !important;
  }

  /*
   * Docked tight viewport — host scrolls with k3 edge scrollbar (never UA arrows).
   * Bare overflow:auto = Windows classic gutter; keep clip + discreet thumb.
   */
  :host([open][data-resolved-variant='docked'][data-clip]),
  :host(:popover-open[data-resolved-variant='docked'][data-clip]) {
    overflow-x: hidden !important;
    /* scroll (not auto) — thumb stays put while clipped; no appear/hide flash */
    overflow-y: scroll !important;
    overscroll-behavior: contain;
    --k3-scroll-size: 0.375rem; /* 6dp */
    --k3-scroll-track-inset: var(--k3-tp-shape-docked);
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
    gap: 0;
    min-width: 0;
  }

  /*
   * Modal chrome — animates (enterScaleY). Scroll lives on .surface-scroll so
   * transform animation never sits on the overflow element (native gutter + jank).
   */
  :host([open][data-resolved-variant='modal']) .surface,
  :host(:popover-open[data-resolved-variant='modal']) .surface {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    width: max-content;
    min-width: 22.75rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    padding: 0;
    background: var(--k3-sys-color-surface-container-high);
    border-radius: var(--k3-tp-shape);
    box-shadow: var(--k3-sys-elevation-level3);
    overflow: hidden; /* clip radius; do not scroll here */
  }

  :host([open][data-resolved-variant='modal']) .surface-scroll,
  :host(:popover-open[data-resolved-variant='modal']) .surface-scroll {
    flex: 1 1 auto;
    min-height: 0;
    max-height: inherit;
    box-sizing: border-box;
    --k3-scroll-size: 0.375rem; /* 6dp discreet */
    --k3-scroll-track-inset: var(--k3-tp-shape);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* Force k3 edge scrollbar — beat UA / classic Windows arrows */
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

  :host([open][data-resolved-variant='modal']) .surface-inner,
  :host(:popover-open[data-resolved-variant='modal']) .surface-inner {
    padding: var(--k3-tp-pad);
  }

  .headline {
    margin: 0;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    text-align: start;
  }

  .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.25rem; /* 36 */
    margin-block-start: 1.25rem; /* 20 */
  }

  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .body {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem; /* 24 */
  }

  .fields-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 0 0 auto;
    min-width: 0;
  }

  .fields {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--k3-tp-label-gap);
    min-width: 0;
  }

  .field-btn,
  .field-input {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-tp-field-w);
    height: var(--k3-tp-field-h);
    max-width: var(--k3-tp-field-w);
    flex: 0 0 auto;
    margin: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-small); /* 8 */
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    font-family: var(--k3-ref-typeface-brand, inherit);
    font-size: var(--k3-sys-typescale-display-medium-size, 2.8125rem); /* 45 */
    font-weight: var(--k3-sys-typescale-display-medium-weight, 400);
    line-height: var(--k3-sys-typescale-display-medium-line-height, 3.25rem); /* 52 */
    letter-spacing: var(--k3-sys-typescale-display-medium-tracking, 0);
    font-variant-numeric: tabular-nums;
    text-align: center;
    /* overflow visible — k3-focus-ring outward outline */
    cursor: pointer;
    transition: background-color var(--k3-sys-motion-duration-short4)
      var(--k3-sys-motion-easing-expressive-effects);
  }

  .field-input {
    cursor: text;
    appearance: none;
    -moz-appearance: textfield;
  }
  .field-input::placeholder {
    color: currentColor;
    opacity: 0.38;
  }
  .field-input::-webkit-outer-spin-button,
  .field-input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .field-btn:hover,
  .field-input:hover {
    background: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 8%,
      var(--k3-sys-color-surface-container-highest)
    );
  }
  .field-btn[aria-checked='true'],
  .field-input:focus {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }

  .field-label {
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    font-weight: var(--k3-sys-typescale-body-small-weight, 400);
    line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
    letter-spacing: var(--k3-sys-typescale-body-small-tracking, 0.025rem);
    text-align: start;
  }

  .sep {
    box-sizing: border-box;
    width: var(--k3-tp-sep-w);
    height: var(--k3-tp-field-h);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: var(--k3-sys-typescale-display-large-size, 3.5625rem); /* 57 */
    font-weight: var(--k3-sys-typescale-display-large-weight, 400);
    line-height: 1;
    color: var(--k3-sys-color-on-surface);
    user-select: none;
  }

  /* Period — 52×80 beside fields (dial vertical · keyboard) */
  .period {
    display: flex;
    flex-direction: column;
    width: var(--k3-tp-period-w);
    height: var(--k3-tp-field-h);
    border-radius: var(--k3-sys-shape-corner-small);
    border: 1px solid var(--k3-sys-color-outline);
    /* visible — period segment k3-focus-ring */
    overflow: visible;
    margin-inline-start: 0.75rem; /* 12 */
    flex: 0 0 auto;
  }
  .period button {
    flex: 1 1 50%;
    border: 0;
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
  }
  /* Radius on segments — period keeps overflow:visible for k3-focus-ring */
  .period button:first-child {
    border-start-start-radius: var(--k3-sys-shape-corner-small);
    border-start-end-radius: var(--k3-sys-shape-corner-small);
  }
  .period button:last-child {
    border-end-start-radius: var(--k3-sys-shape-corner-small);
    border-end-end-radius: var(--k3-sys-shape-corner-small);
  }
  .period button + button {
    border-block-start: 1px solid var(--k3-sys-color-outline);
  }
  .period button[aria-checked='true'] {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }

  /* Period under — dial horizontal only */
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period {
    flex-direction: row;
    width: 100%;
    height: 2.375rem; /* 38 */
    margin-inline-start: 0;
    margin-block-start: 0.75rem; /* 12 */
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button:first-child {
    border-start-end-radius: 0;
    border-end-start-radius: var(--k3-sys-shape-corner-small);
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button:last-child {
    border-end-start-radius: 0;
    border-start-end-radius: var(--k3-sys-shape-corner-small);
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button + button {
    border-block-start: 0;
    border-inline-start: 1px solid var(--k3-sys-color-outline);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* 8 */
    margin-block-start: 1.5rem; /* 24 */
    min-height: 2.5rem;
  }
  /* Hold footer invisible while keyboard→dial morphs; fade in with dial enter. */
  @media (prefers-reduced-motion: no-preference) {
    :host-context([data-k3-motion='expressive']) .actions,
    :host-context(:root:not([data-k3-motion='standard']):not([data-k3-reduce-motion])) .actions {
      transition: opacity var(--k3-sys-motion-duration-effects-fast)
        var(--k3-sys-motion-easing-effects-fast, var(--k3-sys-motion-easing-effects));
    }
  }
  :host([data-dial-entering]) .actions {
    opacity: 0;
    pointer-events: none;
    transition: none;
  }
  .spacer {
    flex: 1 1 auto;
  }

  .ms-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    speak: never;
  }
  .ms-btn .ms,
  .ms-btn [data-k3-icon] {
    font-family: inherit;
    font-size: inherit;
    line-height: 1;
  }
  .ms-btn:hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .fmt-btn {
    font-family: var(--k3-ref-typeface-plain, inherit);
  }
  .fmt-btn .fmt-label {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: 1;
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    font-variant-numeric: tabular-nums;
  }

  .dial-host {
    width: var(--k3-tp-dial-size);
    height: var(--k3-tp-dial-size);
    flex: 0 0 auto;
    transform-origin: center center;
  }

  /*
   * Dial face ↔ keyboard (Noph ClockDial):
   * - data-dial-entering: dial + .actions staged invisible during panel morph;
   *   remove attr → dial scale 0.8→1 + footer fade (same beat)
   * - data-dial-leaving: scale 1→0.8 before dial→keyboard (WAAPI / CSS)
   * Not on first open already in dial. Panel height morphs via morphSize().
   */
  /* Dial face motion — spatial-fast (snappy); standard / reduce = brute. */
  @media (prefers-reduced-motion: no-preference) {
    :host-context([data-k3-motion='expressive']) .dial-host,
    :host-context(:root:not([data-k3-motion='standard']):not([data-k3-reduce-motion])) .dial-host {
      transition:
        transform var(--k3-sys-motion-duration-spatial-fast)
          var(--k3-sys-motion-easing-spatial-fast, var(--k3-sys-motion-easing-expressive-spatial-fast)),
        opacity var(--k3-sys-motion-duration-effects-fast)
          var(--k3-sys-motion-easing-effects-fast, var(--k3-sys-motion-easing-effects));
    }
  }

  :host([data-dial-entering]) .dial-host {
    transform: scale(0.8);
    opacity: 0;
    transition: none;
  }

  /* Keep dial in layout while WAAPI scales it out (toggleModeAsync). */
  :host([data-dial-leaving]) .dial-host {
    pointer-events: none;
  }

  :host([data-mode='input']:not([data-dial-leaving])) .dial-host {
    display: none;
  }
  :host([data-mode='input']:not([data-dial-leaving])) .body {
    gap: 0;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }
  `,
];
