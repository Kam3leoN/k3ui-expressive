import { css } from 'lit';

/**
 * M3 / M3E Snackbar styles.
 *
 * @see https://m3.material.io/components/snackbar/specs
 */
export const snackbarStyles = css`
  :host {
    position: fixed;
    inset-inline: 0;
    /* Never flush — floor 16 dp even if a bad inline override sneaks in */
    bottom: max(1rem, var(--k3-snackbar-inset-bottom, var(--k3-snackbar-inset, 1rem)));
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
    padding-bottom: 0;
    max-width: 100vw;
  }

  :host([position='start']) {
    justify-content: flex-start;
  }
  :host([position='end']) {
    justify-content: flex-end;
  }
  :host([position='center']),
  :host([position='auto']),
  :host(:not([position])) {
    justify-content: center;
  }

  .bar {
    pointer-events: none;
    box-sizing: border-box;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
    min-height: 3rem; /* 48 dp */
    min-width: 0;
    /* Start 16 · end 8 (M3). Block 0 so 40 dp close centers in 48 dp. */
    padding: 0 0.5rem 0 1rem;
    border-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    background: var(--k3-sys-color-inverse-surface);
    color: var(--k3-sys-color-inverse-on-surface);
    box-shadow: var(--k3-sys-elevation-level3, 0 4px 8px rgb(0 0 0 / 0.2));
    font-family: var(--k3-sys-typescale-body-medium-font, inherit);
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-body-medium-weight, 400);
    letter-spacing: var(--k3-sys-typescale-body-medium-tracking, 0.016rem);
    touch-action: pan-y;
    transform: translateY(calc(100% + 0.5rem)) scale(0.92);
    opacity: 0;
    will-change: transform, opacity;
    transition:
      transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial, ease)),
      opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects, ease));
  }

  /* Compact — nearly full width (fixed 16 dp insets via host padding) */
  @media (max-width: 599.98px) {
    .bar {
      width: 100%;
      max-width: 100%;
    }
  }

  /* Expanded — hug content; wrap measure ~360 dp; hard cap 600 dp */
  @media (min-width: 600px) {
    .bar {
      width: fit-content;
      max-width: min(22.5rem, 100%);
    }
  }

  .bar.open {
    pointer-events: auto;
    transform: none;
    opacity: 1;
  }

  .bar.two-line:not(.stacked) {
    min-height: 4.25rem; /* 68 dp */
    padding-block: 0.5rem;
  }

  /*
   * Stacked (long action > 128 dp / forced): label full row, then action+close
   * end-aligned. flex-basis 100% + no-shrink is required — -webkit-box label
   * otherwise kept trailing on the same row.
   */
  .bar.stacked {
    flex-wrap: wrap;
    align-items: flex-start;
    min-height: 4.25rem;
    padding-block: 0.5rem;
    width: min(37.5rem, 100%);
    max-width: min(37.5rem, 100%);
  }
  .bar.stacked .label {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
    display: block;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .bar.stacked .trailing.has {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
    display: inline-flex;
    justify-content: flex-end;
    margin-inline-start: 0;
    margin-block-start: 0.125rem;
  }

  .label {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .label ::slotted(*) {
    white-space: normal !important;
    display: inline !important;
    max-width: 100% !important;
  }

  .trailing {
    display: none;
    flex-shrink: 0;
    align-items: center;
    gap: 0;
    margin-inline-start: 0.5rem;
  }
  .trailing.has {
    display: inline-flex;
  }

  .action {
    display: none;
    align-items: center;
    min-width: 0;
  }
  .action.has {
    display: inline-flex;
  }

  .action-btn {
    appearance: none;
    border: none;
    margin: 0;
    padding: 0.375rem 0.5rem;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-inverse-primary);
    font: inherit;
    font-weight: 500;
    letter-spacing: 0.006rem;
    text-transform: none;
    cursor: pointer;
    white-space: nowrap;
  }

  ::slotted([slot='action']) {
    color: var(--k3-sys-color-inverse-primary);
  }

  /*
   * Close — M3 IconButton in snackbar: glyph 24 dp · state layer 40 dp
   * (was 48×48 and stretched the 48 dp bar).
   * @see IconButtonTokens.StateLayerSize / Snackbar dismissAction
   */
  .dismiss {
    appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    width: 2.5rem; /* 40 dp */
    height: 2.5rem;
    display: inline-grid;
    place-items: center;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-inverse-on-surface);
    cursor: pointer;
    flex-shrink: 0;
    user-select: none;
    -webkit-user-select: none;
  }
  .dismiss .ms {
    display: block;
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
    font-size: 1.5rem; /* 24 dp */
    line-height: 1;
    width: 1.5rem;
    height: 1.5rem;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    font-feature-settings: 'liga';
  }

  .trailing-slot {
    display: none;
    align-items: center;
  }
  .trailing-slot.has {
    display: inline-flex;
  }

  @media (prefers-reduced-motion: reduce) {
    .bar {
      transition-duration: 1ms;
      transform: none;
    }
  }
`;
