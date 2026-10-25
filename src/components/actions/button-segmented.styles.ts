import { css, unsafeCSS } from 'lit';
import { ButtonSegmentedSpecs } from './button-segmented.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);
const s = ButtonSegmentedSpecs;

export const buttonSegmentedStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  .button-segmented {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    padding: ${rem(s.containerPaddingDp)};
    gap: ${rem(s.segmentGapDp)};
    background-color: color-mix(
      in srgb,
      var(--k3-sys-color-outline-variant) 25%,
      transparent
    );
    border-radius: ${rem(s.wrapRadiusRoundedDp)};
    border: none;
  }

  :host([shape='square']) .button-segmented {
    border-radius: ${rem(s.wrapRadiusSquareDp)};
  }

  .button-segmented__btn {
    position: relative;
    padding: 7px 18px;
    border: none;
    border-radius: ${rem(s.segmentRadiusRoundedDp)};
    cursor: pointer;
    font-family: var(--k3-ref-typeface-plain);
    font-weight: 500;
    font-size: 0.8125rem;
    letter-spacing: 0.01em;
    white-space: nowrap;
    user-select: none;
    outline: none;
    overflow: hidden;
    background: transparent;
    color: var(--k3-sys-color-on-surface);
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      color var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  :host([shape='square']) .button-segmented__btn {
    border-radius: ${rem(s.segmentRadiusSquareDp)};
  }

  .button-segmented__btn--active {
    color: var(--k3-sys-color-on-primary-container);
  }

  .button-segmented__pill {
    position: absolute;
    inset: 0;
    background-color: var(--k3-sys-color-primary-container);
    border-radius: inherit;
    transform-origin: center center;
    transform: scaleX(0);
    opacity: 0;
    transition:
      transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--k3-sys-motion-duration-effects-short, 200ms)
        var(--k3-sys-motion-easing-effects, ease);
    pointer-events: none;
  }

  .button-segmented__btn--active .button-segmented__pill {
    transform: scaleX(1);
    opacity: 1;
  }

  .button-segmented__overlay {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: transparent;
    pointer-events: none;
    transition: background-color var(--k3-sys-motion-duration-effects-short, 200ms)
      var(--k3-sys-motion-easing-effects, ease);
  }

  .button-segmented__btn:not(.button-segmented__btn--active):hover .button-segmented__overlay {
    background-color: color-mix(
      in srgb,
      var(--k3-sys-color-outline-variant) 19%,
      transparent
    );
  }

  .button-segmented__content {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  .button-segmented__leading-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      width var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    font-size: 1.125rem;
  }

  .button-segmented__btn--active .button-segmented__leading-icon {
    width: 1.25rem;
    min-width: 1.25rem;
    opacity: 1;
  }

  .button-segmented__icon {
    display: inline-grid;
    place-items: center;
    font-size: 1.125rem;
    line-height: 1;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .button-segmented__label {
    line-height: 1.2;
  }

  .button-segmented__btn:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .button-segmented__pill,
    .button-segmented__overlay,
    .button-segmented__leading-icon,
    .button-segmented__btn {
      transition-duration: 0.01ms !important;
    }
  }

  :host-context([data-k3-reduce-motion]) .button-segmented__pill,
  :host-context([data-k3-reduce-motion]) .button-segmented__overlay,
  :host-context([data-k3-reduce-motion]) .button-segmented__leading-icon,
  :host-context([data-k3-reduce-motion]) .button-segmented__btn {
    transition-duration: 0.01ms !important;
  }
`;
