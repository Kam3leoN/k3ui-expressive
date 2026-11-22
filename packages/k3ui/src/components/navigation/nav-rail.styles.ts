import { css, type CSSResultGroup } from 'lit';

/**
 * k3-nav-rail styles — M3 Expressive.
 *
 * Motion:
 * - **expand** — expressive spatial overshoot (Android rail ChangeBounds)
 * - **collapse** — emphasized decelerate (no bounce)
 * - **effects default** — opacities (labels / crossfades)
 *
 * Collapsed baseline = everything centered in the compact content track.
 * Expand keeps that same X (offsets stay on the compact track) so icons do
 * not slide — the rail grows and row labels reveal beside the pill.
 * Modal chrome only while expanded (compact = straight end edge).
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://m3.material.io/styles/motion/overview/how-it-works
 */
export const navRailStyles: CSSResultGroup = css`
  :host {
    display: block;
    height: 100%;
    /* Under fixed k3-banner — sticky hosts sit below; tall hosts retract */
    top: var(--k3-banner-offset, 0px);
    max-height: calc(100dvh - var(--k3-banner-offset, 0px));
    width: var(--k3-nav-rail-width);
    --k3-nav-rail-compact: 6.5rem; /* 104 — fits “Containment” @ 12px */
    --k3-nav-rail-width: var(--k3-nav-rail-compact);
    --k3-nav-rail-pad-inline: 0.5rem;
    --k3-nav-rail-content: calc(
      var(--k3-nav-rail-compact) - 2 * var(--k3-nav-rail-pad-inline)
    );
    --k3-nav-rail-fab-size: 3.5rem; /* 56 */
    --k3-nav-rail-fab-max: 17.5rem; /* 280 — M3 extended label cap */
    --k3-nav-rail-toggle-size: var(--k3-sys-touch-target, 3rem); /* 48 */
    /*
     * Compact-track centering — identical collapsed ↔ expanded (expand
     * baseline). Not recalculated on the wide rail, so icons stay put.
     */
    --k3-nav-rail-center-toggle: max(
      0px,
      calc((var(--k3-nav-rail-content) - var(--k3-nav-rail-toggle-size)) / 2)
    );
    --k3-nav-rail-center-fab: max(
      0px,
      calc((var(--k3-nav-rail-content) - var(--k3-nav-rail-fab-size)) / 2)
    );
    /*
     * M3 Expressive NavigationRail (Android):
     * collapsed item min height 64dp · item spacing 4dp
     * @see https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md
     */
    --k3-nav-rail-item-gap: var(--k3-sys-spacing-space50, 0.25rem); /* 4dp */
    --k3-nav-rail-item-min-height: 4rem; /* 64dp collapsed */
    --k3-nav-rail-motion: var(--k3-sys-motion-duration-spatial-default, 500ms);
    /* Collapse destination — decelerate, no overshoot */
    --k3-nav-rail-ease: var(
      --k3-sys-motion-easing-emphasized-decelerate,
      cubic-bezier(0.05, 0.7, 0.1, 1)
    );
    --k3-nav-rail-effects: var(--k3-sys-motion-duration-effects-default, 200ms)
      var(
        --k3-sys-motion-easing-effects,
        var(--k3-sys-motion-easing-expressive-effects)
      );
    background: transparent;
    transition: width var(--k3-nav-rail-motion) var(--k3-nav-rail-ease);
  }

  /* Expanded width — size / expanded / deprecated mode */
  :host(:is([size='large'], [expanded], [mode='expanded'])) {
    --k3-nav-rail-width: 16rem;
    /* Expanded rows are the 56dp indicator height (spacing still 4dp) */
    --k3-nav-rail-item-min-height: 3.5rem; /* 56dp */
    /*
     * Expand destination — Android expressive spatial overshoot
     * PathInterpolator(0.38, 1.21, 0.22, 1). CSS uses the post-change
     * transition, so expand bounces; collapse stays on compact decelerate.
     */
    --k3-nav-rail-ease: var(
      --k3-sys-motion-easing-expressive-spatial,
      cubic-bezier(0.38, 1.21, 0.22, 1)
    );
  }

  .rail {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 100%;
    margin: 0;
    padding: 0.75rem var(--k3-nav-rail-pad-inline) 1rem;
    overflow: visible; /* foot tooltips may paint into the content pane */
    background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface));
    border: 0;
    box-shadow: var(--k3-nav-rail-elevation, var(--k3-sys-elevation-level1));
    /* Longhands only — shorthand does not interpolate with end-radius overrides */
    border-start-start-radius: var(--k3-nav-rail-radius, 0);
    border-start-end-radius: var(--k3-nav-rail-radius, 0);
    border-end-start-radius: var(--k3-nav-rail-radius, 0);
    border-end-end-radius: var(--k3-nav-rail-radius, 0);
    transition:
      background-color var(--k3-nav-rail-motion) var(--k3-nav-rail-ease),
      border-start-start-radius var(--k3-nav-rail-motion) var(--k3-nav-rail-ease),
      border-start-end-radius var(--k3-nav-rail-motion) var(--k3-nav-rail-ease),
      border-end-start-radius var(--k3-nav-rail-motion) var(--k3-nav-rail-ease),
      border-end-end-radius var(--k3-nav-rail-motion) var(--k3-nav-rail-ease),
      box-shadow var(--k3-nav-rail-motion) var(--k3-nav-rail-ease);
  }

  /* Standard expanded — flush beside content (no inset sheet) */
  :host(
    :is([layout='standard'], [appearance='standard']):is(
        [size='large'],
        [expanded],
        [mode='expanded']
      )
  )
    .rail {
    background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface));
    box-shadow: var(--k3-nav-rail-elevation, var(--k3-sys-elevation-level1));
  }

  /*
   * Modal expanded only — flush start, end-side corners.
   * Compact stays non-modal (straight end); longhands ease 28→0 with width.
   */
  :host(
    :is([layout='modal'], [appearance='modal']):is(
        [size='large'],
        [expanded],
        [mode='expanded']
      )
  )
    .rail {
    background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface-container));
    border-start-end-radius: var(
      --k3-nav-rail-radius,
      var(--k3-sys-shape-corner-extra-large, 1.75rem)
    );
    border-end-end-radius: var(
      --k3-nav-rail-radius,
      var(--k3-sys-shape-corner-extra-large, 1.75rem)
    );
    box-shadow: var(--k3-nav-rail-elevation, var(--k3-sys-elevation-level1));
  }

  /* —— Toggle (menu_open) —— centered on compact track (expand baseline) */
  .toggle {
    display: none;
    place-items: center;
    place-content: center;
    align-self: flex-start;
    box-sizing: border-box;
    width: var(--k3-nav-rail-toggle-size);
    height: var(--k3-nav-rail-toggle-size);
    margin-bottom: 0.25rem;
    margin-inline-start: var(--k3-nav-rail-center-toggle);
    margin-inline-end: 0;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    font: inherit;
    perspective: 2.5rem;
  }
  :host([collapsible]) .toggle {
    display: grid;
  }

  .toggle-icon {
    display: block;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-weight: normal;
    font-style: normal;
    font-size: 1.5rem;
    line-height: 1;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    transform: rotateY(0deg);
    transition: transform var(--k3-nav-rail-motion) var(--k3-nav-rail-ease);
  }
  .rail[data-size='compact'] .toggle-icon {
    transform: rotateY(180deg);
  }
  :host(:dir(rtl)) .rail[data-size='large'] .toggle-icon {
    transform: rotateY(180deg);
  }
  :host(:dir(rtl)) .rail[data-size='compact'] .toggle-icon {
    transform: rotateY(0deg);
  }

  /*
   * Header FAB — single k3-extended-fab[data-rail-collapsed] morph.
   * Centered on compact track (same X collapsed ↔ expanded).
   */
  .fab {
    display: none;
    width: 100%;
    margin-bottom: 0.75rem;
    box-sizing: border-box;
    min-height: var(--k3-nav-rail-fab-size);
    padding-inline-start: var(--k3-nav-rail-center-fab);
    padding-inline-end: 0;
  }
  .fab.has {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    justify-items: start;
    align-items: center;
  }

  ::slotted(k3-fab),
  ::slotted(.rail-fab-compact),
  ::slotted(k3-extended-fab),
  ::slotted(.rail-fab-extended) {
    grid-area: 1 / 1;
    justify-self: start;
    display: inline-flex !important;
    box-sizing: border-box !important;
    margin-inline-start: 0;
  }

  /* Prefer extended morph — hide icon-only twin when both are slotted */
  :host:has(k3-extended-fab[slot='fab']) ::slotted(k3-fab),
  :host:has(k3-extended-fab[slot='fab']) ::slotted(.rail-fab-compact),
  :host:has(.rail-fab-extended[slot='fab']) ::slotted(k3-fab),
  :host:has(.rail-fab-extended[slot='fab']) ::slotted(.rail-fab-compact) {
    display: none !important;
  }

  ::slotted(k3-fab),
  ::slotted(.rail-fab-compact) {
    z-index: 1;
  }

  ::slotted(k3-extended-fab),
  ::slotted(.rail-fab-extended) {
    z-index: 1;
    /* Width owned by setRailCollapsed (px morph) — don’t force fit-content */
    max-width: min(100%, var(--k3-nav-rail-fab-max));
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Leading destinations — M3E itemSpacing 4dp */
  .destinations {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--k3-nav-rail-item-gap);
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    background: transparent;
  }
  .destinations[data-position='start'] {
    justify-content: flex-start;
  }
  .destinations[data-position='center'] {
    justify-content: center;
  }
  .destinations[data-position='bottom'] {
    justify-content: flex-end;
  }

  /* Trailing (bottom) + divider */
  .trailing {
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    flex: 0 0 auto;
    margin-top: 0.25rem;
    padding-top: 0.75rem;
    border-block-start: 1px solid var(--k3-sys-color-outline-variant);
  }
  .trailing.has {
    display: flex;
    align-items: center;
  }

  ::slotted(k3-nav-item) {
    flex: 0 0 auto;
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    .rail,
    .toggle,
    .toggle-icon,
    .fab {
      transition: none;
    }
    ::slotted(k3-fab),
    ::slotted(.rail-fab-compact),
    ::slotted(k3-extended-fab),
    ::slotted(.rail-fab-extended) {
      transition: none !important;
    }
  }
`;
