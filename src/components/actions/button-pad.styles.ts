import { css, unsafeCSS } from 'lit';
import { ButtonPadSizeDp } from './button-pad.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const s = ButtonPadSizeDp;

/**
 * Styles for `k3-button-pad`.
 *
 * State layers via `::before` (v1) · `--k3-sys-color-*`.
 * Cardinal: host `rotate(45deg)` · icons `rotate(-45deg)`.
 * Gap / grid fallbacks — runtime sets `--k3-bp-gap` + `--k3-bp-grid`
 * via `devicePixelSnapCss(2)` (Windows 125% hairline).
 *
 * @see ./button-pad.specs.ts
 */
export const buttonPadStyles = css`
  :host {
    --k3-bp-cell: ${rem(s.cell)};
    --k3-bp-gap: ${rem(s.gap)};
    --k3-bp-grid: ${rem(s.grid)};
    --k3-bp-outer-r: ${rem(s.outerRadius)};
    --k3-bp-inner-r: ${rem(s.innerRadius)};
    --k3-bp-icon: ${rem(s.icon)};
    display: grid;
    grid-template-columns: var(--k3-bp-cell) var(--k3-bp-cell);
    grid-template-rows: var(--k3-bp-cell) var(--k3-bp-cell);
    gap: var(--k3-bp-gap);
    width: var(--k3-bp-grid);
    height: var(--k3-bp-grid);
    isolation: isolate;
    outline: none;
    vertical-align: middle;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([mode='cardinal']) {
    transform: rotate(45deg);
  }

  .btn {
    appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    width: var(--k3-bp-cell);
    height: var(--k3-bp-cell);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
    box-shadow:
      0 1px 3px rgb(0 0 0 / 0.3),
      inset 0 1px 0 rgb(255 255 255 / 0.06);
    transition: box-shadow var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    background: var(--k3-sys-color-on-primary);
    transition: opacity var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    pointer-events: none;
    z-index: 1;
  }

  .btn:hover::before {
    opacity: 0.08;
  }

  .btn:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }

  .btn:focus-visible::before,
  .btn:active::before {
    opacity: 0.12;
  }

  .btn:hover {
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.38),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
  }

  /* Asymmetric radii — outer corner 24, junctions 4 */
  .btn--tl {
    border-radius: var(--k3-bp-outer-r) var(--k3-bp-inner-r) var(--k3-bp-inner-r)
      var(--k3-bp-inner-r);
  }
  .btn--tr {
    border-radius: var(--k3-bp-inner-r) var(--k3-bp-outer-r) var(--k3-bp-inner-r)
      var(--k3-bp-inner-r);
  }
  .btn--bl {
    border-radius: var(--k3-bp-inner-r) var(--k3-bp-inner-r) var(--k3-bp-inner-r)
      var(--k3-bp-outer-r);
  }
  .btn--br {
    border-radius: var(--k3-bp-inner-r) var(--k3-bp-inner-r) var(--k3-bp-outer-r)
      var(--k3-bp-inner-r);
  }

  .icon {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-bp-icon);
    width: var(--k3-bp-icon);
    height: var(--k3-bp-icon);
    line-height: 1;
    display: inline-grid;
    place-items: center;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    color: inherit;
    /* No transform transition — subpixel translate (1.5dp) blurred glyphs @125%. */
  }

  /*
   * Cardinal (45°) — counter-rotate icons so arrows stay screen-aligned.
   * Static only (no hover nudge / no transition) to keep ligatures sharp.
   */
  :host([mode='cardinal']) .icon {
    transform: rotate(-45deg);
  }

  /* ── Variants ─────────────────────────────────────────────────────────── */
  :host([variant='tonal']) .btn {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
    box-shadow: none;
  }
  :host([variant='tonal']) .btn::before {
    background: var(--k3-sys-color-on-secondary-container);
  }
  :host([variant='tonal']) .btn:hover {
    box-shadow: none;
  }

  :host([variant='outlined']) .btn {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    border: 1px solid var(--k3-sys-color-outline);
    box-shadow: none;
  }
  :host([variant='outlined']) .btn::before {
    background: var(--k3-sys-color-on-surface-variant);
  }
  :host([variant='outlined']) .btn:hover {
    border-color: var(--k3-sys-color-on-surface-variant);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .btn::before {
      transition-duration: 0.01ms !important;
    }
  }
  :host-context([data-k3-reduce-motion]) .btn,
  :host-context([data-k3-reduce-motion]) .btn::before {
    transition-duration: 0.01ms !important;
  }
`;
