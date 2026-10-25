import { css, unsafeCSS } from 'lit';
import { ButtonArrowSizeDp } from './button-arrow.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const s = ButtonArrowSizeDp;

/**
 * Styles for `k3-button-arrow`.
 *
 * State layers via `::before` (v1) · `--k3-sys-color-*`.
 * Gap fallback only — runtime sets `--k3-ba-gap` via `devicePixelSnapCss(2)`.
 *
 * @see ./button-arrow.specs.ts
 */
export const buttonArrowStyles = css`
  :host {
    --k3-ba-size: ${rem(s.half)};
    --k3-ba-gap: ${rem(s.gap)};
    --k3-ba-outer-r: ${rem(s.outerRadius)};
    --k3-ba-inner-r: ${rem(s.innerRadius)};
    --k3-ba-icon: ${rem(s.icon)};
    --k3-ba-icon-nudge: ${rem(s.iconHoverOffset)};
    display: inline-flex;
    align-items: center;
    gap: var(--k3-ba-gap);
    isolation: isolate;
    outline: none;
    vertical-align: middle;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([direction='vertical']) {
    flex-direction: column;
  }

  .btn {
    appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    width: var(--k3-ba-size);
    height: var(--k3-ba-size);
    min-width: var(--k3-ba-size);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
    box-shadow: none;
    transition:
      background-color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      border-color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  /* State layer — on-* color @ hover / focus */
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

  .icon {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-ba-icon);
    width: var(--k3-ba-icon);
    height: var(--k3-ba-icon);
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
    transition: transform 120ms
      var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    color: inherit;
  }

  /* ── Horizontal — pill halves ─────────────────────────────────────────── */
  :host([direction='horizontal']) .btn--a,
  :host(:not([direction='vertical'])) .btn--a {
    border-radius: var(--k3-ba-outer-r) var(--k3-ba-inner-r) var(--k3-ba-inner-r)
      var(--k3-ba-outer-r);
  }
  :host([direction='horizontal']) .btn--b,
  :host(:not([direction='vertical'])) .btn--b {
    border-radius: var(--k3-ba-inner-r) var(--k3-ba-outer-r) var(--k3-ba-outer-r)
      var(--k3-ba-inner-r);
  }
  :host([direction='horizontal']) .btn--a:hover .icon,
  :host(:not([direction='vertical'])) .btn--a:hover .icon {
    transform: translateX(calc(var(--k3-ba-icon-nudge) * -1));
  }
  :host([direction='horizontal']) .btn--b:hover .icon,
  :host(:not([direction='vertical'])) .btn--b:hover .icon {
    transform: translateX(var(--k3-ba-icon-nudge));
  }

  /* ── Vertical — stacked halves ────────────────────────────────────────── */
  :host([direction='vertical']) .btn--a {
    border-radius: var(--k3-ba-outer-r) var(--k3-ba-outer-r) var(--k3-ba-inner-r)
      var(--k3-ba-inner-r);
  }
  :host([direction='vertical']) .btn--b {
    border-radius: var(--k3-ba-inner-r) var(--k3-ba-inner-r) var(--k3-ba-outer-r)
      var(--k3-ba-outer-r);
  }
  :host([direction='vertical']) .btn--a:hover .icon {
    transform: translateY(calc(var(--k3-ba-icon-nudge) * -1));
  }
  :host([direction='vertical']) .btn--b:hover .icon {
    transform: translateY(var(--k3-ba-icon-nudge));
  }

  /* ── Variants ─────────────────────────────────────────────────────────── */
  :host([variant='tonal']) .btn {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  :host([variant='tonal']) .btn::before {
    background: var(--k3-sys-color-on-secondary-container);
  }

  :host([variant='outlined']) .btn {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    border: 1px solid var(--k3-sys-color-outline);
  }
  :host([variant='outlined']) .btn::before {
    background: var(--k3-sys-color-on-surface-variant);
  }
  :host([variant='outlined']) .btn:hover {
    border-color: var(--k3-sys-color-on-surface-variant);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .btn::before,
    .icon {
      transition-duration: 0.01ms !important;
    }
  }
  :host-context([data-k3-reduce-motion]) .btn,
  :host-context([data-k3-reduce-motion]) .btn::before,
  :host-context([data-k3-reduce-motion]) .icon {
    transition-duration: 0.01ms !important;
  }
`;
