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
    /*
     * M3 Expressive widths
     * (@see https://m3.material.io/components/navigation-rail/specs)
     * (@see md.comp.nav-rail.collapsed.container.width = 96dp)
     * (@see md.comp.nav-rail.expanded.container.width = 220–360dp, default 280)
     * (@see material-components-android NavigationRail.md — 80→96dp)
     */
    --k3-nav-rail-compact: 6rem; /* 96dp */
    --k3-nav-rail-narrow: 5rem; /* 80dp — collapsed.narrow */
    --k3-nav-rail-expanded: 17.5rem; /* 280dp default */
    --k3-nav-rail-expanded-min: 13.75rem; /* 220dp */
    --k3-nav-rail-expanded-max: 22.5rem; /* 360dp */
    --k3-nav-rail-width: var(--k3-nav-rail-compact);
    --k3-nav-rail-pad-inline: 0.5rem; /* 8dp */
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
    /* Collapse — soft decelerate (no overshoot); scheme-aware under fluid/standard */
    --k3-nav-rail-ease: var(
      --k3-sys-motion-easing-effects,
      var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1))
    );
    --k3-nav-rail-effects: var(--k3-sys-motion-duration-effects-default, 200ms)
      var(
        --k3-sys-motion-easing-effects,
        var(--k3-sys-motion-easing-expressive-effects)
      );
    background: transparent;
    transition: width var(--k3-nav-rail-motion) var(--k3-nav-rail-ease);
  }

  /* Optional narrow collapsed (80dp) — md.comp.nav-rail.collapsed.narrow */
  :host([narrow]:not(:is([size='large'], [expanded], [mode='expanded']))) {
    --k3-nav-rail-compact: var(--k3-nav-rail-narrow);
    --k3-nav-rail-width: var(--k3-nav-rail-narrow);
  }

  /* Expanded width — size / expanded / deprecated mode */
  :host(:is([size='large'], [expanded], [mode='expanded'])) {
    --k3-nav-rail-width: clamp(
      var(--k3-nav-rail-expanded-min),
      var(--k3-nav-rail-expanded),
      var(--k3-nav-rail-expanded-max)
    );
    /* Expanded rows are the 56dp indicator height (spacing still 4dp) */
    --k3-nav-rail-item-min-height: 3.5rem; /* 56dp */
    /*
     * Expand destination — Android expressive spatial overshoot
     * PathInterpolator(0.38, 1.21, 0.22, 1). CSS uses the post-change
     * transition, so expand bounces; collapse stays on compact decelerate.
     */
    --k3-nav-rail-ease: var(
      --k3-sys-motion-easing-spatial,
      var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.38, 1.21, 0.22, 1))
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

  /*
   * XR / Spatial — elevated floating orbiter
   * (@see https://m3.material.io/foundations/xr/components/nav-rail)
   * (@see https://bug-on-m3.vercel.app/components/navigation-rail)
   *
   * Offset uses logical inline-start (mirrors in RTL). Not flush to the edge.
   * Shell playground may zero host margin and set inset-inline-start itself.
   */
  :host(:is([layout='xr'], [appearance='xr'], [appearance='spatial'])) {
    --k3-nav-rail-xr-inset: 1.5rem; /* 24dp offset from panel edge */
    --k3-nav-rail-xr-radius: 3rem; /* 48dp pill */
    height: fit-content;
    max-height: calc(
      100dvh - var(--k3-banner-offset, 0px) - 2 * var(--k3-nav-rail-xr-inset)
    );
    align-self: center;
    margin-block: var(--k3-nav-rail-xr-inset);
    margin-inline-start: var(--k3-nav-rail-xr-inset);
    margin-inline-end: 0;
  }

  :host(:is([layout='xr'], [appearance='xr'], [appearance='spatial'])) .rail {
    height: fit-content;
    max-height: 100%;
    min-height: 0;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    padding: var(--k3-sys-spacing-space200, 0.75rem) var(--k3-nav-rail-pad-inline);
    background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface-container));
    box-shadow: var(--k3-nav-rail-elevation, var(--k3-sys-elevation-level3));
    border-start-start-radius: var(--k3-nav-rail-radius, var(--k3-nav-rail-xr-radius));
    border-start-end-radius: var(--k3-nav-rail-radius, var(--k3-nav-rail-xr-radius));
    border-end-start-radius: var(--k3-nav-rail-radius, var(--k3-nav-rail-xr-radius));
    border-end-end-radius: var(--k3-nav-rail-radius, var(--k3-nav-rail-xr-radius));
  }

  :host(:is([layout='xr'], [appearance='xr'], [appearance='spatial'])) .destinations {
    flex: 1 1 auto;
    min-height: 0;
  }

  .xr-shell {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--k3-nav-rail-item-gap);
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    max-height: 100%;
  }

  /*
   * Spatialized FAB — destinations pill only; FAB floats above as its own orbiter.
   */
  :host(
      :is([layout='xr'], [appearance='xr'], [appearance='spatial'])[fab-placement='spatialized']
    )
    .rail {
    background: transparent;
    box-shadow: none;
    padding: 0;
    gap: var(--k3-sys-spacing-space200, 0.75rem);
  }

  :host(
      :is([layout='xr'], [appearance='xr'], [appearance='spatial'])[fab-placement='spatialized']
    )
    .xr-shell {
    padding: var(--k3-sys-spacing-space200, 0.75rem) var(--k3-nav-rail-pad-inline);
    background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface-container));
    box-shadow: var(--k3-nav-rail-elevation, var(--k3-sys-elevation-level3));
    border-radius: var(--k3-nav-rail-radius, var(--k3-nav-rail-xr-radius));
  }

  :host(
      :is([layout='xr'], [appearance='xr'], [appearance='spatial'])[fab-placement='spatialized']
    )
    .fab.has,
  :host(
      :is([layout='xr'], [appearance='xr'], [appearance='spatial'])[fab-placement='spatialized']
    )
    .toggle {
    margin-bottom: 0;
  }

  /*
   * Toggle (menu_open) — truly centered when collapsed (same axis as items).
   * Expanded / morph: pin to compact track so it does not slide with width.
   */
  .toggle {
    display: none;
    place-items: center;
    place-content: center;
    align-self: center;
    box-sizing: border-box;
    width: var(--k3-nav-rail-toggle-size);
    height: var(--k3-nav-rail-toggle-size);
    margin-block-end: 0.25rem;
    margin-inline: auto;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    font: inherit;
    perspective: 2.5rem;
  }
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    .toggle {
    align-self: flex-start;
    margin-inline-start: var(--k3-nav-rail-center-toggle);
    margin-inline-end: 0;
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
   * Header FAB — centered when collapsed; pinned to compact track when expanded
   * (same expand baseline as toggle / destinations).
   */
  .fab {
    display: none;
    width: 100%;
    margin-bottom: 0.75rem;
    box-sizing: border-box;
    min-height: var(--k3-nav-rail-fab-size);
    padding-inline: 0;
  }
  .fab.has {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    justify-items: center;
    align-items: center;
  }
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    .fab {
    padding-inline-start: var(--k3-nav-rail-center-fab);
    padding-inline-end: 0;
  }
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    .fab.has {
    justify-items: start;
  }

  ::slotted(k3-fab),
  ::slotted(.rail-fab-compact),
  ::slotted(k3-extended-fab),
  ::slotted(.rail-fab-extended) {
    grid-area: 1 / 1;
    justify-self: center;
    display: inline-flex !important;
    box-sizing: border-box !important;
    margin-inline-start: 0;
  }
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    ::slotted(k3-fab),
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    ::slotted(.rail-fab-compact),
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    ::slotted(k3-extended-fab),
  :host(
      :is(
        [size='large'],
        [expanded],
        [mode='expanded'],
        [data-collapsing],
        [data-expanding]
      )
    )
    ::slotted(.rail-fab-extended) {
    justify-self: start;
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

  /*
   * Fluid gooey — all layouts (modal / standard / xr).
   * Tied to data-morphing (full width spring), not the 1-frame data-expanding tuck.
   * Animate ONE surface only: .rail normally; .xr-shell when spatialized
   * (avoid double-scale — shell lives inside .rail).
   * Both keyframes settle at identity so clearing data-morphing never snaps.
   */
  :host-context([data-k3-motion='fluid']):host([data-morphing='in']:not([fab-placement='spatialized']))
    .rail {
    transform-origin: left center;
    animation: k3-nav-rail-fluid-in var(--k3-nav-rail-motion) var(--k3-nav-rail-ease) both;
  }
  :host-context([data-k3-motion='fluid']):host([data-morphing='out']:not([fab-placement='spatialized']))
    .rail {
    transform-origin: left center;
    animation: k3-nav-rail-fluid-out var(--k3-nav-rail-motion) var(--k3-nav-rail-ease) both;
  }
  :host-context([data-k3-motion='fluid']):host([fab-placement='spatialized'][data-morphing='in'])
    .xr-shell {
    transform-origin: left center;
    animation: k3-nav-rail-fluid-in var(--k3-nav-rail-motion) var(--k3-nav-rail-ease) both;
  }
  :host-context([data-k3-motion='fluid']):host([fab-placement='spatialized'][data-morphing='out'])
    .xr-shell {
    transform-origin: left center;
    animation: k3-nav-rail-fluid-out var(--k3-nav-rail-motion) var(--k3-nav-rail-ease) both;
  }
  :host-context([data-k3-motion='fluid']):host(:dir(rtl)):host([data-morphing]:not([fab-placement='spatialized']))
    .rail,
  :host-context([data-k3-motion='fluid']):host(:dir(rtl)):host([fab-placement='spatialized'][data-morphing])
    .xr-shell {
    transform-origin: right center;
  }
  @keyframes k3-nav-rail-fluid-in {
    from {
      transform: scale(0.88, 1.04);
    }
    to {
      transform: scale(1, 1);
    }
  }
  /* Collapse jelly — peak mid-flight, settle at rest (no end snap). */
  @keyframes k3-nav-rail-fluid-out {
    0% {
      transform: scale(1, 1);
    }
    40% {
      transform: scale(0.92, 1.04);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    .rail,
    .toggle,
    .toggle-icon,
    .fab {
      transition: none;
    }
    :host-context([data-k3-motion='fluid']):host([data-morphing]) .rail,
    :host-context([data-k3-motion='fluid']):host([data-morphing]) .xr-shell {
      animation: none !important;
      transform: none;
    }
    ::slotted(k3-fab),
    ::slotted(.rail-fab-compact),
    ::slotted(k3-extended-fab),
    ::slotted(.rail-fab-extended) {
      transition: none !important;
    }
  }
`;
