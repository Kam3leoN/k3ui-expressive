import { css } from 'lit';

/**
 * Shared 48×48 selection-control state target (radio · checkbox · switch thumb).
 *
 * Enter: scale-in + fade (M3E spatial-fast).
 * Leave: fade only, then snap scale — scale-out leaves a ghost ring.
 *
 * @see https://m3.material.io/components/checkbox
 * @see https://m3.material.io/components/radio-button
 * @see https://m3.material.io/components/switch
 */

/** Host row + 48dp `.target` wrapper (radio / checkbox). */
export const selectionTargetStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: var(--k3-sys-touch-target, 3rem);
    color: inherit;
  }
  .target {
    box-sizing: border-box;
    width: var(--k3-sys-touch-target, 3rem);
    height: var(--k3-sys-touch-target, 3rem);
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    color: var(--k3-sys-color-on-surface);
  }
  .target.k3-state-layer {
    overflow: visible;
  }
  .target.k3-state-layer::after {
    transform: scale(0);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out),
      transform 0ms linear var(--k3-sys-motion-duration-effects-fast, 150ms),
      visibility 0ms linear var(--k3-sys-motion-duration-effects-fast, 150ms);
  }
  button:hover .target.k3-state-layer::after,
  .target.k3-state-layer:hover::after,
  button:focus-visible .target.k3-state-layer::after {
    visibility: visible;
    transform: scale(1);
    opacity: var(--k3-sys-state-hover-opacity, 0.08);
    transition:
      transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.38, 1.21, 0.22, 1)),
      opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out),
      visibility 0ms linear 0ms;
  }
  button:active .target.k3-state-layer::after,
  .target.k3-state-layer:active::after {
    visibility: visible;
    transform: scale(1);
    opacity: var(--k3-sys-state-pressed-opacity, 0.12);
    transition-duration: var(--k3-sys-motion-duration-short2, 100ms);
  }
  button:focus-visible {
    outline: none;
  }
  button:focus-visible .target.k3-state-layer::after {
    opacity: var(--k3-sys-state-focus-opacity, 0.12);
  }
  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }
  @media (forced-colors: active) {
    button:focus-visible .target {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
`;

/**
 * 48×48 overlay centered on switch thumb (`.handle::after`).
 * Parent hover/focus lives on `.track`.
 */
export const selectionThumbStateStyles = css`
  .handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--k3-sys-touch-target, 3rem);
    height: var(--k3-sys-touch-target, 3rem);
    margin: 0;
    border-radius: 50%;
    background: currentColor;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0);
    transition:
      opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out),
      transform 0ms linear var(--k3-sys-motion-duration-effects-fast, 150ms),
      visibility 0ms linear var(--k3-sys-motion-duration-effects-fast, 150ms);
  }
  .track:hover .handle::after,
  .track:focus-visible .handle::after {
    visibility: visible;
    opacity: var(--k3-sys-state-hover-opacity, 0.08);
    transform: translate(-50%, -50%) scale(1);
    transition:
      transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.38, 1.21, 0.22, 1)),
      opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out),
      visibility 0ms linear 0ms;
  }
  .track:focus-visible .handle::after {
    opacity: var(--k3-sys-state-focus-opacity, 0.12);
  }
  .track:active .handle::after {
    visibility: visible;
    opacity: var(--k3-sys-state-pressed-opacity, 0.12);
    transform: translate(-50%, -50%) scale(1);
    transition-duration: var(--k3-sys-motion-duration-short2, 100ms);
  }
`;