import { css } from 'lit';
import { edgeScrollbarStyles } from '../../core/scrollbar.js';

export const codeblockStyles = [
  edgeScrollbarStyles,
  css`
    :host {
      display: block;
      font-family: var(--k3-ref-typeface-code, ui-monospace, monospace);
      color: var(--k3-sys-color-on-surface);
    }

    .shell {
      width: 100%;
    }

    .header {
      /* Taller first row — room for k3-tabs title */
      --k3-codeblock-header-min: 4.5rem;
    }

    .header::part(container) {
      min-height: var(--k3-codeblock-header-min, 4.5rem);
      align-items: center;
    }

    .title-tabs {
      display: block;
      width: max-content;
      max-width: 100%;
      min-width: 6rem;
    }

    .title-tabs::part(tablist) {
      border-block-end-color: transparent;
    }

    .title-tabs::part(panels) {
      display: none;
    }

    .title-tabs::part(tab) {
      flex: 0 0 auto;
      min-width: 4.5rem;
      padding-inline: 1rem;
      pointer-events: none; /* title only — not a real tab switcher */
    }

    .actions {
      display: inline-flex;
      align-items: center;
      gap: var(--k3-sys-spacing-space50, 0.25rem);
    }

    .body-label {
      font-family: var(--k3-ref-typeface-brand, system-ui, sans-serif);
      font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
      color: var(--k3-sys-color-on-surface-variant);
    }

    /* Non-collapsible — code always open, no chevron / toggle row */
    .body--static::part(chevron) {
      display: none;
    }

    .body--static::part(container) {
      min-height: 0;
      padding-block: 0;
    }

    /*
     * Scroll lives on .code (k3-scroll) — never on <pre>.
     * --x enables horizontal for long lines without Windows native arrows.
     */
    .code.k3-scroll {
      position: relative;
      width: 100%;
      max-block-size: none;
      box-sizing: border-box;
    }

    :host([collapsible]:not([expanded])) .code.k3-scroll {
      max-block-size: var(--k3-codeblock-collapsed-height, 12rem);
    }

    pre {
      margin: 0;
      padding: var(--k3-sys-spacing-space200, 1rem);
      overflow: visible;
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

    ::slotted(pre),
    :host > pre {
      display: none;
    }
  `,
];
