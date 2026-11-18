import { css } from 'lit';
import { expandCollapseStyles } from './expand-collapse.styles.js';

export const expansionPanelStyles = [
  expandCollapseStyles,
  css`
    :host {
      display: block;
      border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
      background: var(--k3-sys-color-surface-container, #f3edf7);
      color: var(--k3-sys-color-on-surface, #1d1b20);
      overflow: hidden;
    }
    :host([disabled]) {
      opacity: 0.38;
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      gap: var(--k3-sys-spacing-space100, 0.5rem);
      width: 100%;
      min-height: var(--k3-sys-spacing-space600, 3rem);
      padding-inline: var(--k3-sys-spacing-space200, 1rem);
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .header:focus-visible {
      outline: 2px solid var(--k3-sys-color-primary, #6750a4);
      outline-offset: -2px;
    }
    :host([toggle-position='end']) .header {
      flex-direction: row-reverse;
    }
    :host([hide-toggle]) .chevron {
      display: none;
    }
    .titles {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--k3-sys-spacing-space050, 0.25rem);
    }
    .title {
      font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
      font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
    }
    .supporting {
      font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
      color: var(--k3-sys-color-on-surface-variant, #49454f);
    }
    .actions {
      display: inline-flex;
      align-items: center;
      gap: var(--k3-sys-spacing-space100, 0.5rem);
      flex-shrink: 0;
    }
    .body {
      padding-inline: var(--k3-sys-spacing-space200, 1rem);
      padding-block-end: var(--k3-sys-spacing-space200, 1rem);
    }
    .chevron::before {
      content: attr(data-k3-icon);
      font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
      font-size: 1.5rem;
      font-feature-settings: 'liga';
      line-height: 1;
    }
  `,
];