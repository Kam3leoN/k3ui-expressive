import { css, type CSSResultGroup } from 'lit';

/**
 * k3-extended-fab styles — M3 Expressive.
 *
 * Nav-rail morph (`data-rail-collapsed`): host width springs; label stays put;
 * overflow:hidden on the host is the reveal (no max-width/opacity text shift).
 */
export const extendedFabStyles: CSSResultGroup = css`
  :host {
    --k3-efab-h: 3.5rem;
    --k3-efab-icon: 1.5rem;
    /* M3 squircle — same 16dp as k3-fab (not a pill / 50%) */
    --k3-efab-radius: 1rem;
    --k3-efab-radius-pressed: 0.75rem;
    /* Pad start centers icon in the square; gap pushes label past the clip edge */
    --k3-efab-pad-start: 1rem;
    --k3-efab-pad-end: 1.5rem;
    --k3-efab-label-gap: calc(
      var(--k3-efab-h) - var(--k3-efab-pad-start) - var(--k3-efab-icon) + 2px
    );
    display: inline-flex;
    vertical-align: middle;
    box-sizing: border-box;
    /* Height fixed — rail morph is width-only (pill ↔ square), never a tall capsule */
    height: var(--k3-efab-h);
    width: fit-content;
    max-width: min(100%, 17.5rem);
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    /* Shadow on host so overflow:hidden never clips it */
    box-shadow: var(--k3-sys-elevation-level3);
    border-radius: var(--k3-efab-radius);
    overflow: hidden;
    transition:
      width var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial)),
      max-width var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial)),
      box-shadow var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
      border-radius var(--k3-sys-motion-duration-spatial-default, 500ms)
        var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial)),
      opacity var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
      transform var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
      visibility var(--k3-sys-motion-duration-effects-default, 200ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
  }
  /* Nav-rail compact — square (width = height token) */
  :host([data-rail-collapsed]) {
    width: var(--k3-efab-h);
    max-width: var(--k3-efab-h);
    flex-shrink: 0;
  }
  :host([size='small']) {
    --k3-efab-h: 2.5rem;
    --k3-efab-icon: 1.25rem;
    --k3-efab-radius: 0.75rem;
    --k3-efab-radius-pressed: 0.5rem;
  }
  :host([size='large']) {
    --k3-efab-h: 6rem;
    --k3-efab-icon: 2.25rem;
    --k3-efab-radius: 1.75rem;
    --k3-efab-radius-pressed: 1.25rem;
  }
  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }
  :host([data-pressed]) {
    box-shadow: var(--k3-sys-elevation-level4);
    border-radius: var(--k3-efab-radius-pressed);
  }
  .fab {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--k3-efab-label-gap);
    box-sizing: border-box;
    width: max-content;
    min-width: var(--k3-efab-h);
    height: 100%;
    padding-inline: var(--k3-efab-pad-start) var(--k3-efab-pad-end);
    border-radius: inherit;
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
    font: inherit;
    border: 0;
    cursor: pointer;
    box-shadow: none;
  }
  .fab.primary {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
  }
  .fab.secondary {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .fab.tertiary {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }
  .fab.surface {
    background: var(--k3-sys-color-surface-container-high);
    color: var(--k3-sys-color-primary);
  }
  :host([data-pressed]) .fab,
  .fab:active {
    border-radius: inherit;
  }
  .icon {
    display: grid;
    place-items: center;
    place-content: center;
    flex: 0 0 auto;
    width: var(--k3-efab-icon);
    height: var(--k3-efab-icon);
    line-height: 0;
    overflow: hidden;
  }
  .label {
    font-size: var(--k3-sys-typescale-label-large-size);
    font-weight: 500;
    white-space: nowrap;
    line-height: 1;
    flex: 0 0 auto;
  }
  ::slotted([slot='icon']) {
    display: grid !important;
    place-items: center !important;
    place-content: center !important;
    box-sizing: border-box !important;
    width: var(--k3-efab-icon) !important;
    height: var(--k3-efab-icon) !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: var(--k3-efab-icon) !important;
    line-height: 1 !important;
    text-align: center !important;
    font-family: 'Material Symbols Rounded', sans-serif !important;
  }
`;
