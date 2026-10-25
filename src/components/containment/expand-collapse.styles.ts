import { css } from 'lit';

/**
 * Shared M3E expand / collapse — used by `k3-list-item`.
 *
 * - Body: grid `0fr → 1fr` (spatial default · expressive overshoot curve).
 * - No opacity fade on the body (avoids ghosting over siblings).
 * - Chevron: `expand_more` via `data-k3-icon`, rotates 180° when `.open`.
 */
export const expandCollapseStyles = css`
  .expand {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows
      var(--k3-sys-motion-duration-spatial-default, 500ms)
      var(--k3-sys-motion-easing-expressive-spatial);
  }
  .expand.open {
    grid-template-rows: 1fr;
  }
  .expand-inner {
    overflow: hidden;
    min-height: 0;
  }

  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: 1.5rem;
    line-height: 1;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 0,
      'wght' 300,
      'GRAD' 0,
      'opsz' 24;
    color: var(--k3-sys-color-on-surface-variant);
    transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial);
    transform: rotate(0deg);
  }
  .chevron.open {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .expand,
    .chevron {
      transition: none !important;
    }
  }
`;