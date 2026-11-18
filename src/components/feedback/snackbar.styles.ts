import { css, unsafeCSS } from 'lit';

/*
 * M3 Expressive spring tokens converted exactly to CSS `linear()` (Compose
 * MotionScheme.expressive): spatial fast 0.6 / 800 (~390 ms), spatial default
 * 0.8 / 380 (~450 ms), effects default 1.0 / 1600 (~240 ms).
 */
const SPRING_SPATIAL_FAST = unsafeCSS(
  'linear(0, 0.0564, 0.1827, 0.3506, 0.5191, 0.6762, 0.816, 0.922, 0.9996, 1.0528, 1.0813, 1.0926, 1.091, 1.0813, 1.0672, 1.0508, 1.0356, 1.0221, 1.0107, 1.0025, 0.9968, 0.9932, 0.9916, 0.9913, 0.992, 0.9932, 0.9946, 0.9962, 0.9975, 0.9986, 0.9995, 1.0001, 1)',
);
const SPRING_SPATIAL_DEFAULT = unsafeCSS(
  'linear(0, 0.0335, 0.1133, 0.2183, 0.333, 0.4472, 0.5541, 0.6498, 0.7326, 0.802, 0.8587, 0.9037, 0.9385, 0.9647, 0.9836, 0.9968, 1.0055, 1.0106, 1.0134, 1.0144, 1.0142, 1.0132, 1.0118, 1.0101, 1.0085, 1.0069, 1.0054, 1.0042, 1.0031, 1.0023, 1.0016, 1.001, 1)',
);
const SPRING_EFFECTS_DEFAULT = unsafeCSS(
  'linear(0, 0.0398, 0.1268, 0.2335, 0.3364, 0.4414, 0.5363, 0.6194, 0.6861, 0.7464, 0.7964, 0.8349, 0.8686, 0.8959, 0.9178, 0.9342, 0.9483, 0.9595, 0.9677, 0.9748, 0.9803, 0.9847, 0.9879, 0.9906, 0.9927, 0.9942, 0.9955, 0.9965, 0.9973, 0.9979, 0.9984, 0.9987, 1)',
);
const FAST_OUT_SLOW_IN = unsafeCSS('cubic-bezier(0.4, 0, 0.2, 1)');
const EMPHASIZED_ACCELERATE = unsafeCSS('cubic-bezier(0.3, 0, 0.8, 0.15)');

/**
 * M3 / M3E Snackbar styles — `standard` (M3 bar) and `expressive` (icon
 * button that stretches from the center). Every shape is full radius except
 * the stacked long-action layout (two rows → extra-large corners).
 *
 * @see https://m3.material.io/components/snackbar/specs
 */
export const snackbarStyles = css`
  :host {
    --k3-snackbar-height: 3rem; /* 48 dp single line */
    --k3-snackbar-icon-button: 3.5rem; /* 56 dp expressive circle */
    --k3-snackbar-icon-size: 1.75rem; /* 28 dp leading icon */
    --k3-snackbar-brand-size: 2.75rem; /* 44 dp brand mark in the circle */
    --k3-snackbar-avatar-size: 3rem; /* 48 dp avatar (expressive) */
    --k3-snackbar-standard-avatar-size: 2.5rem; /* 40 dp avatar (standard) */
    --k3-snackbar-icon-gap: 1rem;
    --k3-snackbar-avatar-gap: 0.75rem;
    --k3-snackbar-stack-peek: 0.75rem; /* 12 dp per stacked row */
    --k3-snackbar-stack-scale-step: 0.05;
    --k3-snackbar-stack-opacity-step: 0.3;

    /* Edge distance — same vars as before (playground / app chrome) */
    --_inset-bottom: max(
      1rem,
      var(
        --k3-snackbar-inset-bottom,
        calc(var(--k3-snackbar-inset, 1rem) + env(safe-area-inset-bottom, 0px))
      )
    );
    --_inset-top: max(
      1rem,
      var(
        --k3-snackbar-inset-top,
        calc(var(--k3-snackbar-inset, 1rem) + env(safe-area-inset-top, 0px))
      )
    );

    position: fixed;
    inset-inline: 0;
    top: auto;
    bottom: var(--_inset-bottom);
    z-index: 50;
    display: flex;
    justify-content: center;
    pointer-events: none;
    box-sizing: border-box;
    padding-inline-start: var(
      --k3-snackbar-inset-inline-start,
      var(--k3-snackbar-inset-inline, var(--k3-snackbar-inset, 1rem))
    );
    padding-inline-end: var(
      --k3-snackbar-inset-inline-end,
      var(--k3-snackbar-inset-inline, var(--k3-snackbar-inset, 1rem))
    );
    max-width: 100vw;
  }

  :host([edge='top']) {
    top: var(--_inset-top);
    bottom: auto;
  }

  :host([position='start']) {
    justify-content: flex-start;
  }
  :host([position='end']) {
    justify-content: flex-end;
  }

  /* ── Stack (queue with up to 3 visible) — vertical perspective ── */
  :host([data-depth]) {
    transform: translateY(calc(var(--_depth, 0) * var(--k3-snackbar-stack-peek) * -1))
      scale(calc(1 - var(--_depth, 0) * var(--k3-snackbar-stack-scale-step)));
    transform-origin: center bottom;
    opacity: calc(1 - var(--_depth, 0) * var(--k3-snackbar-stack-opacity-step));
    transition:
      transform 450ms ${SPRING_SPATIAL_DEFAULT},
      opacity 240ms ${SPRING_EFFECTS_DEFAULT};
  }
  :host([data-depth][edge='top']) {
    transform: translateY(calc(var(--_depth, 0) * var(--k3-snackbar-stack-peek)))
      scale(calc(1 - var(--_depth, 0) * var(--k3-snackbar-stack-scale-step)));
    transform-origin: center top;
  }

  /* ── Bar — shared ───────────────────────────────────────── */
  .bar {
    --_container: var(--k3-sys-color-inverse-surface, #322f35);
    --_on-container: var(--k3-sys-color-inverse-on-surface, #f5eff7);
    --_icon: var(--k3-sys-color-inverse-on-surface, #f5eff7);
    --_action: var(--k3-sys-color-inverse-primary, #d0bcff);
    --_max: var(--k3-snackbar-max-width, 37.5rem);
    --_expanded-width: min(100%, var(--_max));
    /* Start / end of the slide: just off-screen on the anchored edge */
    --_from: calc(100% + var(--_inset-bottom) + 1rem);

    position: relative;
    pointer-events: none;
    box-sizing: border-box;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-start;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    background: var(--_container);
    color: var(--_on-container);
    box-shadow: var(
      --k3-sys-elevation-level3,
      0 1px 3px 0 rgb(0 0 0 / 0.3),
      0 4px 8px 3px rgb(0 0 0 / 0.15)
    );
    font-family: var(--k3-sys-typescale-body-medium-font, inherit);
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-body-medium-weight, 400);
    letter-spacing: var(--k3-sys-typescale-body-medium-tracking, 0.016rem);
    transform-origin: center;
    translate: 0 var(--_from);
    touch-action: none;
  }

  :host([edge='top']) .bar {
    --_from: calc(-100% - var(--_inset-top) - 1rem);
  }

  /* Wide windows hug the content (measured before the stretch) */
  @media (min-width: 600px) {
    .bar {
      --_expanded-width: min(var(--_hug, 100%), 100%, var(--_max));
    }
  }

  .bar[data-phase='expanded'],
  .bar[data-phase='icon'],
  .bar[data-phase='collapsing'] {
    pointer-events: auto;
  }

  .bar[data-variant='emphasized'] {
    --_container: var(--k3-sys-color-primary, #6750a4);
    --_on-container: var(--k3-sys-color-on-primary, #ffffff);
    --_icon: var(--k3-sys-color-on-primary, #ffffff);
    --_action: var(--k3-sys-color-primary-container, #eaddff);
  }
  .bar[data-variant='tonal'] {
    --_container: var(--k3-sys-color-primary-container, #eaddff);
    --_on-container: var(--k3-sys-color-on-primary-container, #4f378b);
    --_icon: var(--k3-sys-color-on-primary-container, #4f378b);
    --_action: var(--k3-sys-color-primary, #6750a4);
  }
  .bar[data-variant='error'] {
    --_container: var(--k3-sys-color-error-container, #f9dedc);
    --_on-container: var(--k3-sys-color-on-error-container, #8c1d18);
    --_icon: var(--k3-sys-color-on-error-container, #8c1d18);
    --_action: var(--k3-sys-color-error, #b3261e);
  }

  /* ── Standard mode ─────────────────────────────────────── */
  .bar[data-mode='standard'] {
    width: var(--_expanded-width);
    min-height: var(--k3-snackbar-height);
    padding: 0 0.5rem 0 1rem; /* M3: 16 dp label side · 8 dp action side */
    opacity: 0;
    transform: scale(0.8);
    transition:
      translate 450ms ${SPRING_SPATIAL_DEFAULT},
      opacity 150ms linear,
      transform 150ms ${FAST_OUT_SLOW_IN};
  }
  .bar[data-mode='standard'][data-leading='avatar'] {
    padding-inline-start: calc(
      (var(--k3-snackbar-height) - var(--k3-snackbar-standard-avatar-size)) / 2
    );
  }
  .bar[data-mode='standard'][data-leading='avatar'] .avatar {
    width: var(--k3-snackbar-standard-avatar-size);
    height: var(--k3-snackbar-standard-avatar-size);
  }
  .bar[data-mode='standard'][data-phase='expanded'] {
    opacity: 1;
    transform: none;
    translate: 0 0;
  }
  .bar[data-mode='standard'][data-phase='leaving'] {
    opacity: 0;
    transform: none;
    transition:
      translate 200ms ${EMPHASIZED_ACCELERATE},
      opacity 150ms linear 50ms;
  }
  /* Label alone (no supporting line): up to 2 lines (68 dp) */
  .bar[data-mode='standard'] .text:not(.has-supporting) .label {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .bar[data-mode='standard'].two-line:not(.stacked) {
    min-height: 4.25rem; /* 68 dp */
  }

  /* Long action (> 128 dp) / forced: label row, then action row */
  .bar.stacked {
    flex-wrap: wrap;
    align-items: flex-start;
    min-height: 4.25rem;
    padding-block: 0.5rem;
    border-radius: var(--k3-sys-shape-corner-extra-large, 1.75rem);
    width: min(37.5rem, 100%);
  }
  .bar.stacked .text {
    flex: 0 0 100%;
    padding-block: 0.375rem;
  }
  .bar.stacked .trailing.has {
    flex: 0 0 100%;
    justify-content: flex-end;
  }

  /* ── Expressive mode ───────────────────────────────────── */
  .bar[data-mode='expressive'] {
    width: var(--k3-snackbar-icon-button);
    height: var(--k3-snackbar-icon-button);
    /* Leading icon stays centered while width = circle diameter */
    padding: 0 0.5rem 0 calc((var(--k3-snackbar-icon-button) - var(--k3-snackbar-icon-size)) / 2);
    opacity: 0;
    transform: scale(0.3);
    will-change: width, transform;
    transition:
      translate 450ms ${SPRING_SPATIAL_DEFAULT},
      width 450ms ${SPRING_SPATIAL_DEFAULT},
      transform 390ms ${SPRING_SPATIAL_FAST},
      opacity 240ms ${SPRING_EFFECTS_DEFAULT};
  }
  .bar[data-mode='expressive'][data-leading='avatar'] {
    padding-inline-start: calc(
      (var(--k3-snackbar-icon-button) - var(--k3-snackbar-avatar-size)) / 2
    );
  }
  /* The circle rises from the edge (or drops from the top) while growing */
  .bar[data-mode='expressive'][data-phase='icon'],
  .bar[data-mode='expressive'][data-phase='expanded'],
  .bar[data-mode='expressive'][data-phase='collapsing'] {
    opacity: 1;
    transform: scale(1);
    translate: 0 0;
  }
  .bar[data-mode='expressive'][data-phase='expanded'] {
    width: var(--_expanded-width);
  }
  /* …and leaves through the edge it came from */
  .bar[data-mode='expressive'][data-phase='leaving'] {
    opacity: 0;
    transform: scale(0.6);
    transition:
      translate 250ms ${EMPHASIZED_ACCELERATE},
      transform 250ms ${EMPHASIZED_ACCELERATE},
      opacity 150ms linear 100ms;
  }

  /* Icon / avatar scales into the circle once it has arrived */
  .bar[data-mode='expressive'] .leading {
    transform: scale(0);
    transition:
      transform 390ms ${SPRING_SPATIAL_FAST},
      opacity 150ms linear;
  }
  .bar[data-mode='expressive'][data-phase='icon'] .leading,
  .bar[data-mode='expressive'][data-phase='expanded'] .leading,
  .bar[data-mode='expressive'][data-phase='collapsing'] .leading {
    transform: scale(1);
    transition-delay: 220ms;
  }

  /* Brand mark: opening only — then yields to the icon / avatar for good */
  .bar[data-mode='expressive'][data-brand] .leading {
    opacity: 0;
    transform: scale(0.6);
    transition-delay: 0ms;
  }
  .bar[data-mode='expressive'][data-brand][data-phase='expanded'] .leading,
  .bar[data-mode='expressive'][data-brand][data-phase='collapsing'] .leading {
    opacity: 1;
    transform: scale(1);
    transition:
      transform 390ms ${SPRING_SPATIAL_FAST},
      opacity 240ms ${SPRING_EFFECTS_DEFAULT};
    transition-delay: 120ms;
  }
  .bar[data-mode='expressive'] .brand {
    transform: scale(0);
    transition:
      transform 390ms ${SPRING_SPATIAL_FAST},
      opacity 150ms linear;
  }
  .bar[data-mode='expressive'][data-phase='icon'] .brand {
    transform: scale(1);
    transition-delay: 220ms;
  }
  .bar[data-mode='expressive'][data-phase='expanded'] .brand,
  .bar[data-mode='expressive'][data-phase='collapsing'] .brand,
  .bar[data-mode='expressive'][data-phase='leaving'] .brand {
    opacity: 0;
    transform: scale(0.6);
  }

  /* Text and actions show once stretched */
  .bar[data-mode='expressive'] .text {
    padding-block: 0;
  }
  .bar[data-mode='expressive'] .text,
  .bar[data-mode='expressive'] .trailing {
    opacity: 0;
    transition: opacity 100ms linear;
  }
  .bar[data-mode='expressive'][data-phase='expanded'] .text,
  .bar[data-mode='expressive'][data-phase='expanded'] .trailing {
    opacity: 1;
    transition: opacity 240ms ${SPRING_EFFECTS_DEFAULT};
    transition-delay: 150ms;
  }

  /* ── Content ───────────────────────────────────────────── */
  .leading {
    flex: none;
    transform-origin: center;
  }

  .icon {
    display: grid;
    place-items: center;
    width: var(--k3-snackbar-icon-size);
    height: var(--k3-snackbar-icon-size);
    color: var(--_icon);
  }
  .icon svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
  /* Ligature fallback (names outside SNACKBAR_ICONS) */
  .icon .ms {
    display: block;
    width: var(--k3-snackbar-icon-size);
    height: calc(var(--k3-snackbar-icon-size) * 1.2);
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
    font-size: var(--k3-snackbar-icon-size);
    line-height: 1.2;
    text-align: center;
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    font-feature-settings: 'liga';
  }
  .icon ::slotted(*) {
    max-width: 100%;
    max-height: 100%;
  }

  .avatar {
    display: block;
    width: var(--k3-snackbar-avatar-size);
    height: var(--k3-snackbar-avatar-size);
    border-radius: 50%;
    object-fit: cover;
  }

  .loader {
    display: grid;
    place-items: center;
    width: var(--k3-snackbar-icon-size);
    height: var(--k3-snackbar-icon-size);
  }
  .loader k3-loading-indicator {
    --k3-loading-size: calc(var(--k3-snackbar-icon-size) / 0.79166);
    /* The indicator paints with primary — follow the snackbar action role */
    --k3-sys-color-primary: var(--k3-snackbar-loader-color, var(--_action));
    flex: none;
  }

  /* End of loading: the icon pops in with the fast spatial spring */
  .leading[data-pop] {
    animation: k3-snackbar-pop 390ms ${SPRING_SPATIAL_FAST} both;
  }
  @keyframes k3-snackbar-pop {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }

  .brand {
    position: absolute;
    inset-block: 0;
    left: calc((var(--k3-snackbar-icon-button) - var(--k3-snackbar-brand-size)) / 2);
    width: var(--k3-snackbar-brand-size);
    height: var(--k3-snackbar-brand-size);
    margin-block: auto;
    object-fit: contain;
    pointer-events: none;
    transform-origin: center;
  }

  .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-block: 0.875rem;
    padding-inline: 0 0.5rem;
  }
  .leading + .text {
    padding-inline-start: var(--k3-snackbar-icon-gap);
  }
  .avatar.leading + .text {
    padding-inline-start: var(--k3-snackbar-avatar-gap);
  }

  .label,
  .supporting {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .label ::slotted(*) {
    display: inline !important;
  }
  .supporting {
    opacity: 0.8;
  }

  .trailing {
    display: none;
    flex: none;
    align-items: center;
  }
  .trailing.has {
    display: inline-flex;
  }
  .action {
    display: none;
    align-items: center;
  }
  .action.has {
    display: inline-flex;
  }
  ::slotted([slot='action']) {
    color: var(--_action);
  }
  .trailing-slot {
    display: none;
    align-items: center;
  }
  .trailing-slot.has {
    display: inline-flex;
  }

  /* Text button — label large 14/20 · 500 · 0.1 */
  .action-btn {
    height: 2.5rem;
    padding: 0 0.75rem;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    background: transparent;
    color: var(--_action);
    font-family: var(--k3-sys-typescale-label-large-font, inherit);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    letter-spacing: 0.00625rem;
    white-space: nowrap;
  }

  /* Close — M3 icon button: glyph 24 dp · state layer 40 dp */
  .dismiss {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    margin-inline-start: 0.25rem;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    background: transparent;
    color: var(--_on-container);
  }
  .dismiss svg {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }

  .action-btn:focus-visible,
  .dismiss:focus-visible {
    outline: 2px solid var(--_on-container);
    outline-offset: 2px;
  }

  /* ── Stack: quiet arrivals, hidden content behind, smooth exits ── */
  /* Only the front snackbar plays the expressive intro; arrivals behind are
     already stretched and come out from behind the front one. */
  .bar[data-enter='behind'] {
    width: var(--_expanded-width);
    transform: none;
    translate: 0 var(--k3-snackbar-stack-peek);
    opacity: 0;
    transition:
      translate 450ms ${SPRING_SPATIAL_DEFAULT},
      opacity 240ms ${SPRING_EFFECTS_DEFAULT};
    transition-delay: calc(max(var(--_depth, 1) - 1, 0) * 90ms);
  }
  .bar[data-enter='behind'][data-phase='expanded'] {
    translate: 0 0;
    opacity: 1;
  }
  :host([edge='top']) .bar[data-enter='behind']:not([data-phase='expanded']) {
    translate: 0 calc(var(--k3-snackbar-stack-peek) * -1);
  }

  /* Front leaves while others wait: slide out, same direction as the stack */
  .bar[data-exit='slide'][data-phase='leaving'] {
    width: var(--_expanded-width);
    transform: none;
    translate: 0 var(--_from);
    opacity: 0;
    transition:
      translate 300ms ${EMPHASIZED_ACCELERATE},
      opacity 200ms linear 100ms;
  }

  /* Rows behind: only the edges show, like a deck of cards */
  :host([data-depth]:not([data-depth='0'])) .bar[data-phase] .leading,
  :host([data-depth]:not([data-depth='0'])) .bar[data-phase] .text,
  :host([data-depth]:not([data-depth='0'])) .bar[data-phase] .trailing {
    opacity: 0;
  }
  :host([data-depth]) .bar[data-mode='standard'] .leading,
  :host([data-depth]) .bar[data-mode='standard'] .text,
  :host([data-depth]) .bar[data-mode='standard'] .trailing {
    transition: opacity 200ms linear;
  }

  /* ── Swipe to dismiss (touch / pen) ────────────────────── */
  .bar[data-mode][data-phase='expanded'][data-drag] {
    translate: var(--_drag-x, 0px) var(--_drag-y, 0px);
    opacity: var(--_drag-opacity, 1);
  }
  .bar[data-mode][data-phase][data-drag='active'] {
    transition: none;
  }
  .bar[data-exit='swipe'][data-phase='leaving'] {
    width: var(--_expanded-width);
    transform: none;
    translate: var(--_drag-x, 0px) var(--_drag-y, 0px);
    opacity: 0;
    transition:
      translate 220ms ${EMPHASIZED_ACCELERATE},
      opacity 220ms linear;
  }
  .bar[data-mode][data-exit='slide'] .leading,
  .bar[data-mode][data-exit='slide'] .text,
  .bar[data-mode][data-exit='slide'] .trailing,
  .bar[data-mode][data-exit='swipe'] .leading,
  .bar[data-mode][data-exit='swipe'] .text,
  .bar[data-mode][data-exit='swipe'] .trailing {
    opacity: 1;
    transform: none;
    transition: none;
  }

  /* ── Reduced motion (OS or data-k3-reduce-motion) ──────── */
  :host([data-reduce]) .bar,
  :host([data-reduce]) .leading,
  :host([data-reduce]) .brand,
  :host([data-reduce]) .text,
  :host([data-reduce]) .trailing {
    transition: opacity 150ms linear !important;
    transform: none !important;
    translate: none !important;
  }
  :host([data-reduce]) .leading[data-pop] {
    animation: none;
  }
  :host([data-reduce][data-depth]) {
    transition: none;
  }
  :host([data-reduce]) .bar[data-mode][data-phase='expanded'][data-drag='active'] {
    translate: var(--_drag-x, 0px) var(--_drag-y, 0px) !important;
  }
`;
