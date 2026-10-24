import { css } from 'lit';

/**
 * Shared M3 state-layer styles for interactive surfaces.
 * Focus indicator is invisible (Expressive / nav destinations) —
 * only hover + pressed paint the overlay; forced-colors keeps an outline.
 */
export const stateLayerStyles = css`
  .k3-state-layer {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }

  .k3-state-layer::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--k3-sys-motion-duration-short2, 100ms)
      var(--k3-sys-motion-easing-expressive-effects, ease);
  }

  .k3-state-layer:hover::after {
    opacity: var(--k3-sys-state-hover-opacity, 0.08);
  }

  /* Focus carré — invisible (keyboard a11y via aria / forced-colors only) */
  .k3-state-layer:focus-visible {
    outline: none;
  }
  .k3-state-layer:focus-visible::after {
    opacity: 0;
  }

  .k3-state-layer:active::after,
  .k3-state-layer[pressed]::after {
    opacity: var(--k3-sys-state-pressed-opacity, 0.12);
  }

  @media (forced-colors: active) {
    .k3-state-layer:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
`;
