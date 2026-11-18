import { css } from 'lit';

export const treeStyles = css`
  :host {
    display: block;
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    padding: var(--k3-sys-spacing-space100, 0.5rem);
    background: var(--k3-sys-color-surface-container, #f3edf7);
    color: var(--k3-sys-color-on-surface, #1d1b20);
  }
  :host(:focus) {
    outline: none;
  }
  :host(:focus-visible) {
    outline: 2px solid var(--k3-sys-color-primary, #6750a4);
    outline-offset: 2px;
  }
  .tree {
    display: block;
  }
`;