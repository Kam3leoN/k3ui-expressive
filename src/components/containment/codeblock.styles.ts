import { css } from 'lit';
import { edgeScrollbarStyles } from '../../core/scrollbar.js';

export const codeblockStyles = [
  edgeScrollbarStyles,
  css`
    :host {
      display: block;
      /* JetBrains Mono via type token — explicit fallback if token unset in host tree */
      font-family: var(
        --k3-ref-typeface-code,
        'JetBrains Mono',
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace
      );
      color: var(--k3-sys-color-on-surface);
      /*
       * Adaptive M3 tokens (default) — follow light/dark; no extra code surface.
       * The list / expand row already paints the surface; keep --k3-code-bg transparent.
       */
      --k3-code-bg: transparent;
      --k3-code-fg: var(--k3-sys-color-on-surface);
      --k3-code-comment: var(--k3-sys-color-on-surface-variant);
      --k3-code-punctuation: var(--k3-sys-color-outline);
      --k3-code-tag: var(--k3-sys-color-error);
      --k3-code-number: var(--k3-sys-color-tertiary);
      --k3-code-string: var(--k3-sys-color-tertiary);
      --k3-code-operator: var(--k3-sys-color-on-surface-variant);
      --k3-code-function: var(--k3-sys-color-secondary);
      --k3-code-keyword: var(--k3-sys-color-primary);
      --k3-code-regex: var(--k3-sys-color-tertiary);
      --k3-code-selection: color-mix(in srgb, var(--k3-sys-color-primary) 24%, transparent);
    }

    /* Opt-in Prism Okaidia (fixed dark panel) */
    :host([theme='okaidia']) {
      --k3-code-bg: #272822;
      --k3-code-fg: #f8f8f2;
      --k3-code-comment: #8292a2;
      --k3-code-punctuation: #f8f8f2;
      --k3-code-tag: #f92672;
      --k3-code-number: #ae81ff;
      --k3-code-string: #a6e22e;
      --k3-code-operator: #f8f8f2;
      --k3-code-function: #e6db74;
      --k3-code-keyword: #66d9ef;
      --k3-code-regex: #fd971f;
      --k3-code-selection: rgb(73 72 62 / 0.9);
    }

    /* Alias — same as default (kept for markup already using theme="material") */
    :host([theme='material']) {
      --k3-code-bg: transparent;
      --k3-code-fg: var(--k3-sys-color-on-surface);
      --k3-code-comment: var(--k3-sys-color-on-surface-variant);
      --k3-code-punctuation: var(--k3-sys-color-outline);
      --k3-code-tag: var(--k3-sys-color-error);
      --k3-code-number: var(--k3-sys-color-tertiary);
      --k3-code-string: var(--k3-sys-color-tertiary);
      --k3-code-operator: var(--k3-sys-color-on-surface-variant);
      --k3-code-function: var(--k3-sys-color-secondary);
      --k3-code-keyword: var(--k3-sys-color-primary);
      --k3-code-regex: var(--k3-sys-color-tertiary);
      --k3-code-selection: color-mix(in srgb, var(--k3-sys-color-primary) 24%, transparent);
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
     * Default: no painted background (list surface shows through).
     *
     * Font MUST be set on .code (not only :host): the expand slot flattens into
     * k3-list-item, so inheritance comes from the list body (brand/plain), not
     * from this host — otherwise JetBrains Mono never reaches the source.
     */
    .code.k3-scroll {
      position: relative;
      width: 100%;
      max-block-size: none;
      box-sizing: border-box;
      background: var(--k3-code-bg);
      color: var(--k3-code-fg);
      font-family: var(
        --k3-ref-typeface-code,
        'JetBrains Mono',
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace
      );
      font-variant-ligatures: none;
    }

    :host([theme='okaidia']) .code.k3-scroll {
      color-scheme: dark;
      border-radius: var(--k3-codeblock-code-radius, var(--k3-sys-shape-corner-small, 0.5rem));
    }

    .code ::selection {
      background: var(--k3-code-selection);
    }

    :host([collapsible]:not([expanded])) .code.k3-scroll {
      max-block-size: var(--k3-codeblock-collapsed-height, 12rem);
    }

    pre,
    code {
      font-family: inherit;
    }

    pre {
      margin: 0;
      padding: var(--k3-sys-spacing-space200, 1rem);
      overflow: visible;
      font-size: 0.875rem; /* 14px — was 0.8125rem (13px) */
      line-height: 1.5;
      tab-size: 2;
    }

    code {
      white-space: pre;
    }

    /* Prism token classes — colours from --k3-code-* */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: var(--k3-code-comment);
      font-style: italic;
    }
    .token.punctuation {
      color: var(--k3-code-punctuation);
    }
    .token.namespace {
      opacity: 0.7;
    }
    .token.property,
    .token.tag,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: var(--k3-code-tag);
    }
    .token.boolean,
    .token.number {
      color: var(--k3-code-number);
    }
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: var(--k3-code-string);
    }
    .token.operator,
    .token.entity,
    .token.url,
    .token.variable,
    .language-css .token.string,
    .style .token.string {
      color: var(--k3-code-operator);
    }
    .token.atrule,
    .token.attr-value,
    .token.function,
    .token.class-name {
      color: var(--k3-code-function);
    }
    .token.keyword {
      color: var(--k3-code-keyword);
    }
    .token.regex,
    .token.important {
      color: var(--k3-code-regex);
    }
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    .token.italic {
      font-style: italic;
    }
    .token.entity {
      cursor: help;
    }

    ::slotted(pre),
    :host > pre {
      display: none;
    }
  `,
];
