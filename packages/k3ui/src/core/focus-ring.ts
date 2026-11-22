import { css } from 'lit';

/**
 * M3 Expressive outward focus ring (grow-shrink).
 *
 * Usage — add class `k3-focus-ring` on the focusable surface, and include
 * `focusRingStyles` in `static styles` (after `stateLayerStyles` if both):
 *
 * ```ts
 * static styles = [hostReset, stateLayerStyles, focusRingStyles, myStyles];
 * // template: class="… k3-focus-ring"
 * ```
 *
 * Tokens (override on the element or a parent):
 * - `--k3-focus-ring-color` (default: secondary)
 * - `--k3-focus-ring-width` (rest, default: 3px)
 * - `--k3-focus-ring-active-width` (peak, default: 6px)
 * - `--k3-focus-ring-offset` (default: 2px)
 * - `--k3-focus-ring-duration` (default: long2 / 500ms)
 */
export const focusRingStyles = css`
  .k3-focus-ring {
    --k3-focus-ring-color: var(--k3-sys-color-secondary);
    --k3-focus-ring-width: 3px;
    --k3-focus-ring-active-width: 6px;
    --k3-focus-ring-offset: 2px;
    --k3-focus-ring-duration: var(--k3-sys-motion-duration-long2, 500ms);
    /* Outward ring must not be clipped by state-layer overflow */
    overflow: visible;
    outline: none;
  }

  .k3-focus-ring:focus {
    outline: none;
  }

  .k3-focus-ring:focus-visible {
    outline: var(--k3-focus-ring-width) solid var(--k3-focus-ring-color);
    outline-offset: var(--k3-focus-ring-offset);
    animation: k3-focus-ring-grow-shrink var(--k3-focus-ring-duration) ease-out;
  }

  @keyframes k3-focus-ring-grow-shrink {
    0%,
    100% {
      outline-width: var(--k3-focus-ring-width);
      outline-offset: var(--k3-focus-ring-offset);
    }
    50% {
      outline-width: var(--k3-focus-ring-active-width);
      outline-offset: var(--k3-focus-ring-offset);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .k3-focus-ring:focus-visible {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .k3-focus-ring:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--k3-focus-ring-offset);
      animation: none;
    }
  }
`;