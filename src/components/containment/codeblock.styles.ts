import { css } from 'lit';

export const codeblockStyles = css`
  :host {
    display: block;
    font-family: var(--k3-ref-typeface-code, ui-monospace, monospace);
    color: var(--k3-sys-color-on-surface);
  }

  .card {
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    background: var(--k3-sys-color-surface-container-low);
    border: 1px solid var(--k3-sys-color-outline-variant);
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--k3-sys-spacing-space200, 1rem);
    padding: var(--k3-sys-spacing-space100, 0.5rem) var(--k3-sys-spacing-space200, 1rem);
    background: var(--k3-sys-color-surface-container);
    border-block-end: 1px solid var(--k3-sys-color-outline-variant);
  }

  .label {
    font-family: var(--k3-ref-typeface-brand, system-ui, sans-serif);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    color: var(--k3-sys-color-on-surface-variant);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    margin-inline-start: auto;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
  }

  .action:hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .action:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }

  .content {
    position: relative;
    overflow: auto;
    max-height: none;
  }

  :host([collapsible]) .content {
    max-height: var(--k3-codeblock-collapsed-height, 150px);
    overflow: hidden;
  }

  :host([collapsible][expanded]) .content {
    max-height: var(--k3-codeblock-full-height, none);
    overflow: auto;
  }

  pre {
    margin: 0;
    padding: var(--k3-sys-spacing-space200, 1rem);
    overflow-x: auto;
    font-size: 0.8125rem;
    line-height: 1.5;
    tab-size: 2;
  }

  code {
    font-family: inherit;
    white-space: pre;
  }

  .token--keyword {
    color: var(--k3-sys-color-primary);
  }

  .token--string {
    color: var(--k3-sys-color-tertiary);
  }

  .token--comment {
    color: var(--k3-sys-color-on-surface-variant);
    font-style: italic;
  }

  .token--tag {
    color: var(--k3-sys-color-error);
  }

  .token--attr {
    color: var(--k3-sys-color-secondary);
  }

  .token--constant {
    color: var(--k3-sys-color-tertiary);
  }

  .token--number {
    color: var(--k3-sys-color-tertiary);
  }

  .expand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    width: 100%;
    padding: var(--k3-sys-spacing-space150, 0.75rem);
    border: 0;
    border-block-start: 1px solid var(--k3-sys-color-outline-variant);
    background: var(--k3-sys-color-surface-container);
    color: var(--k3-sys-color-primary);
    font-family: var(--k3-ref-typeface-brand, system-ui, sans-serif);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    cursor: pointer;
  }

  .expand:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: -2px;
  }

  .icon {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-weight: 400;
    font-style: normal;
    font-size: 1.25rem;
    line-height: 1;
    letter-spacing: normal;
    font-feature-settings: 'liga';
  }

  ::slotted(pre),
  :host > pre {
    display: none;
  }
`;
