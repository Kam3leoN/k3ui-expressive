import { css } from 'lit';

/**
 * M3 text field / textarea — filled · outlined · standard.
 *
 * Outlined (Material Web): start | notch | end · cutout scaleX from center
 * (short3) · floating label in notch · float via WAAPI (text-field.ts).
 * Filled: fixed 56dp — float must not change height.
 *
 * @see https://m3.material.io/components/text-fields/specs
 * @see https://github.com/material-components/material-web/blob/main/field/internal/_outlined-field.scss
 */
export const textFieldStyles = css`
  :host {
    display: block;
    width: 100%;
    max-width: 22rem; /* 352 — M3 form field */
    overflow: visible;
    --k3-tf-h: 3.5rem; /* 56 */
    --k3-tf-icon: 1.5rem; /* 24 */
    --k3-tf-pad-inline: 1rem; /* 16 */
    --k3-tf-icon-gap: 0.75rem; /* 12 */
    --k3-tf-radius: var(--k3-sys-shape-corner-extra-small); /* 4 */
    --k3-tf-outline: var(--k3-sys-color-outline);
    --k3-tf-outline-width: 1px;
    --k3-tf-cutout-motion: var(--k3-sys-motion-duration-short3, 150ms);
    --k3-tf-cutout-ease: var(--k3-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
    --k3-tf-label: var(--k3-sys-color-on-surface-variant);
    --k3-tf-input: var(--k3-sys-color-on-surface);
    --k3-tf-caret: var(--k3-sys-color-primary);
    --k3-tf-container: var(--k3-sys-color-surface-container-highest);
    --k3-tf-supporting: var(--k3-sys-color-on-surface-variant);
    --k3-tf-icon-color: var(--k3-sys-color-on-surface-variant);
    --k3-tf-outline-label-pad: 0.25rem; /* 4 — M3 populated label pad */
    --k3-tf-label-pad-bottom: 0.5rem; /* 8 — centers float on stroke */
  }

  :host([density='compact']) {
    --k3-tf-h: 2.5rem; /* 40 */
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  /* ── Color roles ───────────────────────────────────────────────────────── */
  :host([variant='outlined']) {
    --k3-tf-outline-width: 2px;
    margin-block-start: 0.5rem; /* room for stroke label */
  }
  :host([variant='outlined'][data-floated]:not([data-focused]):not([data-error])) {
    --k3-tf-label: var(--k3-sys-color-on-surface);
  }
  :host([data-focused]) {
    --k3-tf-outline: var(--k3-sys-color-primary);
    --k3-tf-outline-width: 2px;
    --k3-tf-label: var(--k3-sys-color-primary);
    --k3-tf-caret: var(--k3-sys-color-primary);
  }
  :host(:hover:not([data-focused]):not([disabled]):not([data-error])) {
    --k3-tf-outline: var(--k3-sys-color-on-surface);
  }
  :host([data-error]) {
    --k3-tf-outline: var(--k3-sys-color-error);
    --k3-tf-label: var(--k3-sys-color-error);
    --k3-tf-caret: var(--k3-sys-color-error);
    --k3-tf-supporting: var(--k3-sys-color-error);
    --k3-tf-icon-color: var(--k3-sys-color-error);
  }
  :host([data-error][data-focused]) {
    --k3-tf-outline: var(--k3-sys-color-error);
    --k3-tf-label: var(--k3-sys-color-error);
  }

  .field {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-height: var(--k3-tf-h);
    padding-inline: var(--k3-tf-pad-inline);
    gap: var(--k3-tf-icon-gap);
    border-radius: var(--k3-tf-radius);
    color: var(--k3-tf-input);
    overflow: visible;
    transition:
      background var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }

  /* ── Filled — fixed 56dp (float must not grow height) ───────────────────── */
  :host(:is([variant='filled'], :not([variant]))) .field {
    align-items: stretch;
    min-height: var(--k3-tf-h);
    padding-block: 0;
    background: var(--k3-tf-container);
    border-radius: var(--k3-tf-radius) var(--k3-tf-radius) 0 0;
    box-shadow: inset 0 -2px 0 var(--k3-sys-color-on-surface-variant);
  }
  :host(:is([variant='filled'], :not([variant])):not([multiline])) .field {
    height: var(--k3-tf-h);
  }
  :host(:is([variant='filled'], :not([variant]))[data-focused]) .field {
    box-shadow: inset 0 -2px 0 var(--k3-tf-outline);
  }
  :host(:is([variant='filled'], :not([variant]))[data-error]) .field,
  :host(:is([variant='filled'], :not([variant]))[data-error][data-focused]) .field {
    box-shadow: inset 0 -2px 0 var(--k3-sys-color-error);
  }
  :host(
      :is([variant='filled'], :not([variant])):hover:not([data-focused]):not([disabled]):not(
          [data-error]
        )
    )
    .field {
    box-shadow: inset 0 -2px 0 var(--k3-sys-color-on-surface);
  }

  /* ── Standard — static label above, no float ───────────────────────────── */
  :host([variant='standard']) .field {
    align-items: center;
    padding-block: 0.5rem;
    background: var(--k3-tf-container);
    border-radius: var(--k3-tf-radius);
    box-shadow: none;
  }
  .static-label {
    display: block;
    margin-block-end: 0.125rem;
    padding-inline: var(--k3-tf-pad-inline);
    color: var(--k3-tf-label);
    font-size: var(--k3-sys-typescale-body-medium-size);
    line-height: var(--k3-sys-typescale-body-medium-line-height);
    font-weight: var(--k3-sys-typescale-body-medium-emphasized-weight, 500);
    pointer-events: none;
  }
  :host([variant='standard'][data-focused]) .static-label {
    color: var(--k3-sys-color-primary);
  }
  :host([variant='standard'][data-error]) .static-label {
    color: var(--k3-sys-color-error);
  }
  :host([variant='standard']) .control::placeholder {
    opacity: 1;
  }

  /* ── Outlined — 3-part outline (Material Web) · no fill unless filled variant ── */
  :host([variant='outlined']) .field {
    background: transparent;
    padding-block: 0.25rem;
  }

  .outline {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border-radius: inherit;
    border-color: var(--k3-tf-outline);
    color: var(--k3-tf-outline);
  }

  .outline-start,
  .outline-end {
    position: relative;
    box-sizing: border-box;
    border-style: none;
    border-radius: inherit;
    border-color: inherit;
  }

  .outline-start::before,
  .outline-start::after,
  .outline-end::before,
  .outline-end::after,
  .outline-panel-inactive::before,
  .outline-panel-inactive::after,
  .outline-panel-active::before,
  .outline-panel-active::after {
    content: '';
    position: absolute;
    inset: 0;
    border: inherit;
    box-sizing: border-box;
  }

  /*
   * Logical borders — physical TRBL border-style opens the wrong edge in RTL
   * (flex puts .outline-start on the inline-end side).
   */
  .outline-start::before,
  .outline-start::after {
    border-block-style: solid;
    border-inline-start-style: solid;
    border-inline-end-style: none;
    border-start-start-radius: inherit;
    border-end-start-radius: inherit;
    border-start-end-radius: 0;
    border-end-end-radius: 0;
    margin-inline-end: var(--k3-tf-outline-label-pad);
  }
  .outline-end {
    flex: 1 1 auto;
    margin-inline-start: calc(-1 * var(--k3-tf-outline-label-pad));
  }
  .outline-end::before,
  .outline-end::after {
    border-block-style: solid;
    border-inline-start-style: none;
    border-inline-end-style: solid;
    border-start-end-radius: inherit;
    border-end-end-radius: inherit;
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  .outline-start::before,
  .outline-end::before {
    border-width: var(--k3-tf-outline-width);
  }
  .outline-start::after,
  .outline-end::after {
    border-width: 2px;
    opacity: 0;
    transition: opacity var(--k3-tf-cutout-motion) var(--k3-tf-cutout-ease);
  }
  :host([data-focused]) .outline-start::after,
  :host([data-focused]) .outline-end::after {
    opacity: 1;
  }

  .outline-start {
    flex: 0 0 auto;
    padding-inline-start: var(--k3-tf-pad-inline);
  }
  :host([data-has-leading]) .outline-start {
    padding-inline-start: calc(
      var(--k3-tf-pad-inline) + var(--k3-tf-icon) + var(--k3-tf-icon-gap)
    );
  }
  :host(:not([data-has-label])) .outline-start {
    flex: 1 1 auto;
  }
  :host(:not([data-has-label])) .outline-start::before,
  :host(:not([data-has-label])) .outline-start::after {
    margin-inline-end: 0;
    border-start-end-radius: inherit;
    border-end-end-radius: inherit;
    border-style: solid;
  }
  :host(:not([data-has-label])) .outline-end,
  :host(:not([data-has-label])) .outline-notch {
    display: none;
  }

  .outline-notch {
    position: relative;
    display: flex;
    align-items: flex-start;
    flex: 0 1 auto;
    max-width: calc(100% - var(--k3-tf-pad-inline) * 2);
    margin-inline-start: calc(-1 * var(--k3-tf-outline-label-pad));
    margin-inline-end: var(--k3-tf-outline-label-pad);
    padding: 0 var(--k3-tf-outline-label-pad);
    border-color: inherit;
    border-style: none;
  }

  .outline-panel-inactive,
  .outline-panel-active {
    position: absolute;
    inset: 0;
    border-color: inherit;
    border-bottom-style: solid;
    border-width: var(--k3-tf-outline-width);
  }
  .outline-panel-inactive::before,
  .outline-panel-inactive::after,
  .outline-panel-active::before,
  .outline-panel-active::after {
    border-top-style: solid;
    border-bottom: none;
    bottom: auto;
    height: 0;
    width: auto;
    transform: scaleX(1);
    transition: transform var(--k3-tf-cutout-motion) var(--k3-tf-cutout-ease);
  }
  .outline-panel-inactive::before,
  .outline-panel-active::before {
    right: 50%;
    left: 0;
    inset-block-end: auto;
    transform-origin: top left;
  }
  .outline-panel-inactive::after,
  .outline-panel-active::after {
    left: 50%;
    right: 0;
    inset-block-end: auto;
    transform-origin: top right;
  }
  /* Open while floated or animating (hole stays open during descent) */
  :host(:is([data-floated], [data-animating])) .outline-panel-inactive::before,
  :host(:is([data-floated], [data-animating])) .outline-panel-inactive::after,
  :host(:is([data-floated], [data-animating])) .outline-panel-active::before,
  :host(:is([data-floated], [data-animating])) .outline-panel-active::after {
    transform: scaleX(0);
  }

  .outline-panel-inactive {
    border-width: var(--k3-tf-outline-width);
  }
  /*
   * The panels only paint their bottom border (top style is none), so their
   * computed border-top-width is 0 and \`border: inherit\` copied that 0 into
   * the pseudo-elements — the notch stayed open on every empty field.
   */
  .outline-panel-inactive::before,
  .outline-panel-inactive::after {
    border-top-width: var(--k3-tf-outline-width);
  }
  .outline-panel-active::before,
  .outline-panel-active::after {
    border-top-width: 2px;
  }
  .outline-panel-active {
    border-width: 2px;
    opacity: 0;
    transition: opacity var(--k3-tf-cutout-motion) var(--k3-tf-cutout-ease);
  }
  :host([data-focused]) .outline-panel-active {
    opacity: 1;
  }

  /* MW: translateY(calc(-100% + pad-bottom)) centers label on stroke */
  .outline-label {
    display: flex;
    max-width: 100%;
    transform: translateY(calc(-100% + var(--k3-tf-label-pad-bottom)));
  }

  /* ── Icons ─────────────────────────────────────────────────────────────── */
  .leading,
  .trailing {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    flex: 0 0 auto;
    width: var(--k3-tf-icon);
    height: var(--k3-tf-icon);
    color: var(--k3-tf-icon-color);
    font-size: var(--k3-tf-icon);
    line-height: 1;
  }
  .leading:not(.has),
  .trailing:not(.has) {
    display: none;
  }
  button.trailing {
    display: inline-flex;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-tf-icon-color);
    cursor: pointer;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  button.trailing:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }
  button.trailing .ms,
  button.trailing [data-k3-icon] {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-tf-icon);
    line-height: 1;
    width: var(--k3-tf-icon);
    text-align: center;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }
  /*
   * Bare icon glyphs — 24dp.
   * k3-icon-button / k3-button keep intrinsic size (default width, not narrow).
   */
  ::slotted([slot='leading-icon']:not(k3-icon-button):not(k3-button)),
  ::slotted([slot='trailing-icon']:not(k3-icon-button):not(k3-button)) {
    display: inline-flex !important;
    place-items: center !important;
    width: var(--k3-tf-icon) !important;
    height: var(--k3-tf-icon) !important;
    font-size: var(--k3-tf-icon) !important;
    line-height: 1 !important;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif !important;
  }
  /*
   * Icon buttons in field slots — keep native k3-icon-button geometry
   * (sm + width=default → 40dp rond / 48dp hit). Do not squash the circle.
   */
  ::slotted(k3-icon-button[slot='leading-icon']),
  ::slotted(k3-icon-button[slot='trailing-icon']),
  ::slotted(k3-button[slot='leading-icon']),
  ::slotted(k3-button[slot='trailing-icon']) {
    display: inline-grid !important;
    place-items: center !important;
    place-content: center !important;
    flex: 0 0 auto !important;
  }
  .leading.control,
  .trailing.control {
    width: auto;
    height: auto;
    min-width: var(--k3-tf-icon);
    min-height: var(--k3-tf-icon);
    overflow: visible;
  }

  /* Pull trailing icon-button to the end (less end pad — rond sits trailing) */
  :host([data-trailing-control]) .field {
    padding-inline-end: 0.25rem; /* 4 */
  }

  /*
   * Trailing (clear / icons): tight gap so the control keeps width for the value
   * (date ranges etc.) — default field gap 12dp was eating the input.
   */
  :host([data-has-trailing]) .field,
  :host([clearable]) .field {
    gap: 0.25rem; /* 4 */
  }

  /* M3: clear then trailing action — clock (rond) flush at end */
  .trailing-group {
    position: relative;
    z-index: 1;
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center;
    justify-content: flex-end;
    align-self: center;
    flex: 0 0 auto;
    gap: 0;
    width: auto;
    height: auto;
    overflow: visible;
    color: var(--k3-tf-icon-color);
  }
  .trailing-group:not(.has) {
    display: none !important;
  }
  /* Clear — 40dp (match icon-button default), 24dp glyph — was 48dp and too wide */
  .trailing-group > button.trailing {
    flex: 0 0 auto;
    box-sizing: border-box;
    width: 2.5rem; /* 40 */
    height: 2.5rem;
  }
  /* Clear + slotted action: even tighter so value isn’t clipped */
  :host([data-trailing-control]) .trailing-group > button.trailing {
    width: 2.25rem; /* 36 */
    height: 2.25rem;
    margin-inline-end: -0.125rem;
  }
  .trailing-group > .trailing {
    flex: 0 0 auto;
    width: auto;
    height: auto;
    overflow: visible;
  }

  /* ── Body ──────────────────────────────────────────────────────────────── */
  .body {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1 1 auto;
    flex-direction: row;
    align-items: center;
    align-self: stretch;
    min-width: 0;
    gap: 0.125rem;
  }

  :host([multiline]) .field {
    align-items: flex-start;
    min-height: calc(var(--k3-tf-h) + 2rem);
    padding-block: 0.75rem;
  }
  :host([multiline]) .body {
    align-items: stretch;
    padding-block-start: 0.75rem;
  }
  :host([multiline]:is([variant='filled'], :not([variant]))) .field {
    align-items: stretch;
  }

  /* ── Labels (dual resting / floating — motion via WAAPI) ───────────────── */
  .label-wrapper {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    text-align: initial;
  }

  .label {
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--k3-tf-label);
    font-family: inherit;
    font-size: var(--k3-sys-typescale-body-large-size);
    line-height: var(--k3-sys-typescale-body-large-line-height);
    letter-spacing: var(--k3-sys-typescale-body-large-tracking);
    font-weight: 400;
    width: min-content;
    transition: color var(--k3-sys-motion-duration-short4) linear;
  }
  .label.hidden {
    opacity: 0; /* keep layout for getBoundingClientRect */
  }

  .label.resting {
    position: absolute;
    inset-inline-start: var(--k3-tf-pad-inline);
    top: 50%;
    transform: translateY(-50%);
  }
  :host([data-has-leading]) .label.resting {
    inset-inline-start: calc(
      var(--k3-tf-pad-inline) + var(--k3-tf-icon) + var(--k3-tf-icon-gap)
    );
  }

  /* Same size/weight as .static-label; LH 16dp fits filled 56dp */
  .label.floating {
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    line-height: 1rem;
    letter-spacing: var(--k3-sys-typescale-body-medium-tracking, 0.015625rem);
    font-weight: var(--k3-sys-typescale-body-medium-emphasized-weight, 500);
    transform-origin: top left;
    overflow: visible;
  }
  :host(:dir(rtl)) .label.floating {
    transform-origin: top right;
  }

  :host(:not([variant='outlined'])) .label.floating {
    position: absolute;
    inset-inline-start: var(--k3-tf-pad-inline);
    top: 0.5rem; /* 8 */
    padding-inline: 0;
  }
  :host(:not([variant='outlined'])[data-has-leading]) .label.floating {
    inset-inline-start: calc(
      var(--k3-tf-pad-inline) + var(--k3-tf-icon) + var(--k3-tf-icon-gap)
    );
  }

  :host(:is([variant='filled'], :not([variant])):not([multiline])) .body {
    align-items: center;
  }
  :host([data-floated]:not([variant='outlined']):not([multiline])) .body {
    align-items: flex-end;
    padding-block-end: 0.5rem; /* 8 — value band, no height jump */
  }

  .affix {
    flex: 0 0 auto;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-large-size);
    line-height: var(--k3-sys-typescale-body-large-line-height);
    white-space: nowrap;
  }
  .affix:not(.has) {
    display: none;
  }

  .control {
    display: block;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--k3-tf-input);
    caret-color: var(--k3-tf-caret);
    font: inherit;
    font-size: var(--k3-sys-typescale-body-large-size);
    line-height: var(--k3-sys-typescale-body-large-line-height);
    letter-spacing: var(--k3-sys-typescale-body-large-tracking);
    resize: vertical;
  }
  .control::placeholder {
    color: var(--k3-sys-color-on-surface-variant);
    opacity: 1;
  }
  /* Hide on unfloat immediately (not during descent) */
  :host([data-has-label]:not([data-floated])) .control::placeholder {
    opacity: 0;
  }
  :host(:not([data-has-label])) .control::placeholder,
  :host([variant='standard']) .control::placeholder {
    opacity: 1;
  }
  textarea.control {
    min-height: 3.5rem;
    field-sizing: content;
    white-space: pre; /* keep Du/Au on two fixed lines — no soft wrap */
    overflow-x: auto;
    overflow-y: hidden;
    overflow-wrap: normal;
    resize: none;
  }
  /*
   * rows=2 (date range Du/Au): room for TWO body-large lines.
   * Previous 2.75rem + overflow-y:hidden clipped the "Au" line when
   * "From : yyyy-MM-dd" wrapped — never again.
   */
  :host([multiline][rows='2']) textarea.control {
    min-height: calc(
      2 * var(--k3-sys-typescale-body-large-line-height, 1.5rem)
    );
    height: calc(2 * var(--k3-sys-typescale-body-large-line-height, 1.5rem));
    field-sizing: fixed;
  }
  :host([multiline][rows='2']) .field {
    min-height: calc(
      2 * var(--k3-sys-typescale-body-large-line-height, 1.5rem) + 2.5rem
    );
  }

  .supporting {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    box-sizing: border-box;
    min-height: 1rem;
    margin-block-start: 0.25rem;
    padding-inline: var(--k3-tf-pad-inline);
    color: var(--k3-tf-supporting);
    font-size: var(--k3-sys-typescale-body-small-size);
    line-height: var(--k3-sys-typescale-body-small-line-height);
  }
  .supporting:not(.has) {
    display: none;
  }
  .supporting-text {
    flex: 1 1 auto;
    min-width: 0;
  }
  .counter {
    flex: 0 0 auto;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .counter:not(.has) {
    display: none;
  }
`;
