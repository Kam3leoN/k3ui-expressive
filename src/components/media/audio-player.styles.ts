import { css } from 'lit';

export const audioPlayerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    max-width: 28rem;
    /* Card / compact chrome comes from nested k3-card */
    padding: 0;
    margin: 0;
    border-radius: 0;
    background: transparent;
    color: var(--k3-sys-color-on-surface);
    box-shadow: none;
  }

  :host([hidden]) {
    display: none !important;
  }

  .player-card {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  /* Card body already pads 16/12 — keep content on-surface (not variant mute) */
  .player-card::part(content) {
    color: var(--k3-sys-color-on-surface);
  }

  .player-card::part(body) {
    padding: var(--k3-sys-spacing-space400, 2rem);
    gap: var(--k3-sys-spacing-space200, 1rem);
  }

  /* ── Compact mini card ── */
  :host([variant='compact']) {
    max-width: 20rem;
  }

  :host([variant='compact']) .player-card::part(body) {
    padding: var(--k3-sys-spacing-space300, 1.5rem);
    gap: var(--k3-sys-spacing-space200, 1rem);
  }

  /* ── Toolbar / sticky — host is transparent; pill is .toolbar-bar ── */
  :host([variant='toolbar']),
  :host([variant='sticky']) {
    max-width: none;
    width: 100%;
    padding: 0;
    background: transparent;
    box-shadow: none;
    box-sizing: border-box;
  }

  :host([variant='sticky']) {
    position: fixed;
    /* Float inset from viewport edges (safe + breathing room) */
    inset-inline: var(--k3-sys-spacing-space200, 1rem);
    bottom: calc(
      var(--k3-nav-chrome-inset-block-end, 0px) +
        var(--k3-sys-spacing-space200, 1rem)
    );
    width: auto;
    z-index: 40;
    margin: 0;
    transition:
      bottom var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1)),
      visibility var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .shell {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space200, 1rem);
    min-width: 0;
  }

  :host([variant='compact']) .shell {
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  /* FAB outside left · pill bar to the right */
  .shell--toolbar {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--k3-sys-spacing-space200, 1rem);
  }

  .toolbar-bar {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--k3-sys-spacing-space200, 1rem);
    flex: 1 1 auto;
    min-width: 0;
    padding: var(--k3-sys-spacing-space300, 1.5rem)
      var(--k3-sys-spacing-space400, 2rem);
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    background: var(--k3-sys-color-surface-container);
    box-shadow: var(--k3-sys-elevation-level2);
    box-sizing: border-box;
  }

  :host([variant='sticky']) .toolbar-bar {
    box-shadow: var(--k3-sys-elevation-level3);
  }

  .cover-fab {
    flex-shrink: 0;
    pointer-events: none;
    cursor: default;
  }

  .cover-fab::part(container) {
    cursor: default;
  }

  .row-meta {
    display: flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space200, 1rem);
    min-width: 0;
  }

  :host([variant='toolbar']) .meta,
  :host([variant='sticky']) .meta {
    flex: 0 1 9rem;
    min-width: 5.5rem;
    max-width: 11rem;
  }

  .art {
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    object-fit: cover;
    background: var(--k3-sys-color-surface-container-highest);
  }

  :host([variant='compact']) .art {
    width: 3rem;
    height: 3rem;
  }

  :host([variant='sticky']) .art {
    width: 3.25rem;
    height: 3.25rem;
  }

  .art-fallback {
    display: grid;
    place-items: center;
    color: var(--k3-sys-color-on-surface-variant);
  }

  .art-fallback .ms {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: 1.5rem;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  :host([variant='card']) .meta {
    margin-block-end: 0;
    min-height: 2.5rem;
  }

  .title {
    font: var(--k3-sys-typescale-title-small-font, 0.875rem/1.25rem system-ui);
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .artist {
    font: var(--k3-sys-typescale-body-small-font, 0.75rem/1rem system-ui);
    color: var(--k3-sys-color-on-surface-variant);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    min-width: 0;
  }

  /*
   * Timeline — progress stroke centered with volume slider track;
   * times sit below without shifting the optical center.
   */
  :host([variant='toolbar']) .timeline,
  :host([variant='sticky']) .timeline {
    position: relative;
    flex: 1 1 10rem;
    min-width: 7rem;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    /* Room for absolute times under the 8dp stroke */
    padding-block-end: 1rem;
    box-sizing: border-box;
  }

  .progress {
    display: block;
    width: 100%;
  }

  :host([variant='toolbar']) .progress,
  :host([variant='sticky']) .progress {
    /* Keep wavy canvas optically centered on the volume track */
    flex: 0 0 auto;
  }

  .times {
    display: flex;
    justify-content: space-between;
    font: var(--k3-sys-typescale-label-small-font, 0.6875rem/1rem system-ui);
    color: var(--k3-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  :host([variant='toolbar']) .times,
  :host([variant='sticky']) .times {
    position: absolute;
    inset-inline-start: 0;
    bottom: 0;
    justify-content: flex-start;
    gap: 0.35rem;
  }

  :host([variant='toolbar']) .times .sep,
  :host([variant='sticky']) .times .sep {
    opacity: 0.6;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  :host([variant='compact']) .controls {
    justify-content: space-between;
  }

  :host([variant='toolbar']) .controls,
  :host([variant='sticky']) .controls {
    flex: 0 0 auto;
    flex-wrap: nowrap;
    margin-inline-start: 0;
  }

  .transport {
    display: inline-flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  .transport--ib {
    gap: var(--k3-sys-spacing-space50, 0.25rem);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
    cursor: pointer;
  }

  .btn.ghost {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    min-width: 2.5rem;
    min-height: 2.5rem;
  }

  .btn.primary {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
    min-width: 3.25rem;
    min-height: 3.25rem;
  }

  :host([variant='compact']) .btn.primary,
  :host([variant='sticky']) .btn.primary {
    min-width: 3rem;
    min-height: 3rem;
  }

  .btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }

  .btn .ms,
  .art-fallback .ms {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: 1.35rem;
    line-height: 1;
    font-weight: var(--k3-sys-icon-weight, 400);
    font-style: normal;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' var(--k3-sys-icon-fill, 0),
      'wght' var(--k3-sys-icon-weight, 400),
      'GRAD' var(--k3-sys-icon-grade, 0),
      'opsz' var(--k3-sys-icon-optical-size, 24);
    display: inline-grid;
    place-items: center;
    width: 1em;
    height: 1em;
    overflow: hidden;
    letter-spacing: normal;
    text-transform: none !important;
    speak: never;
  }

  .volume {
    display: inline-flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    margin-inline-start: auto;
    min-width: 7rem;
    flex: 1 1 7rem;
    max-width: 11rem;
  }

  :host([variant='compact']) .volume {
    display: none;
  }

  :host([variant='toolbar']) .volume,
  :host([variant='sticky']) .volume {
    flex: 0 1 9rem;
    margin-inline-start: 0;
    max-width: 10rem;
    align-self: stretch;
    /* Same vertical center as progress stroke (mute + track) */
    min-height: 0;
  }

  .vol-slider {
    flex: 1 1 auto;
    min-width: 4.5rem;
    width: 100%;
    align-self: center;
  }

  /* Slider xs track is 16dp — progress toolbar uses 8dp stroke; center both */
  :host([variant='toolbar']) .vol-slider,
  :host([variant='sticky']) .vol-slider {
    align-self: center;
  }

  /* Hide empty label row if slider still reserves space */
  .vol-slider::part(label) {
    display: none;
  }

  audio {
    display: none;
  }

  @media (max-width: 720px) {
    :host([variant='toolbar']) .volume,
    :host([variant='sticky']) .volume {
      display: none;
    }

    .toolbar-bar {
      flex-wrap: wrap;
      gap: var(--k3-sys-spacing-space100, 0.5rem);
    }

    :host([variant='toolbar']) .timeline,
    :host([variant='sticky']) .timeline {
      order: 3;
      flex-basis: 100%;
    }
  }
`;
