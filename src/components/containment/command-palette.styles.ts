import { css } from 'lit';

/**
 * Host chrome for `k3-command-palette`.
 * Panel/search/results CSS lives in `commandPaletteDialogCss` (injected as a
 * `<style>` light child of `k3-dialog` so it survives LayerPortal elevate).
 */
export const commandPaletteStyles = css`
  :host {
    display: contents;
    --k3-command-palette-max: 40rem;
  }
`;

/**
 * Prefixed rules for dialog light-DOM content (search + results).
 * Applied via an inline `<style>` so styles travel with the elevated dialog.
 */
export const commandPaletteDialogCss = `
  .k3-cp__search {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  .k3-cp__search-icon {
    flex: 0 0 auto;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.5rem;
    color: var(--k3-sys-color-on-surface-variant);
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-feature-settings: 'liga';
  }
  .k3-cp__search-icon[data-k3-icon]::before {
    content: attr(data-k3-icon);
  }

  .k3-cp__input {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--k3-sys-color-on-surface);
    font: inherit;
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: var(--k3-sys-typescale-title-medium-emphasized-weight, 600);
    line-height: var(--k3-sys-typescale-title-medium-line-height, 1.5rem);
  }
  .k3-cp__input::placeholder {
    color: var(--k3-sys-color-on-surface-variant);
    font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
  }

  .k3-cp__hint {
    flex: 0 0 auto;
  }

  .k3-cp__results {
    box-sizing: border-box;
    margin: -1rem -1.5rem;
    padding: 0.5rem;
    min-height: 4rem;
  }

  .k3-cp__results k3-list-item {
    --k3-list-item-radius-start: 1.5rem;
    --k3-list-item-radius-inner: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    --k3-list-item-radius-hover: var(--k3-sys-shape-corner-medium, 0.75rem);
    --k3-list-item-radius-selected: 1.5rem;
  }

  .k3-cp__results [data-command-group] {
    display: block;
    padding: 0.75rem 1rem 0.25rem;
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-emphasized-weight, 600);
    color: var(--k3-sys-color-on-surface-variant);
  }

  .k3-cp__empty {
    margin: -0.5rem -1.5rem 0;
    padding: 1.5rem 1rem 2rem;
    text-align: center;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
  }
`;
