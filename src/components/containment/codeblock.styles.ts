import { css } from 'lit';
import { edgeScrollbarStyles } from '../../core/scrollbar.js';

/**
 * Dark code panel + M3 chrome (tabs + icon actions).
 * Default palette: GitHub-dark inspired token colours on `#24292e`.
 */
export const codeblockStyles = [
  edgeScrollbarStyles,
  css`
    :host {
      display: block;
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

      /* Default = dark panel */
      --k3-code-bg: #24292e;
      --k3-code-fg: #d1d5da;
      --k3-code-comment: #6a737d;
      --k3-code-punctuation: #6a737d;
      --k3-code-tag: #79b8ff;
      --k3-code-attr-name: #ffea7f;
      --k3-code-number: #85e89d;
      --k3-code-string: #85e89d;
      --k3-code-operator: #47ffe7;
      --k3-code-function: #b392f0;
      --k3-code-keyword: #47ffe7;
      --k3-code-regex: #ffab70;
      --k3-code-doctype: #47ffe7;
      --k3-code-selector: #79b8ff;
      --k3-code-property: #79b8ff;
      --k3-code-variable: #79b8ff;
      --k3-code-atrule: #47ffe7;
      --k3-code-builtin: #ffab70;
      --k3-code-boolean: #f692ce;
      --k3-code-inserted: #47ffe7;
      --k3-code-deleted: #85e89d;
      --k3-code-selection: rgb(73 72 62 / 0.9);
      --k3-codeblock-radius: 1rem;
    }

    /* Dark panel aliases (legacy attribute values still paint the same) */
    :host([theme='okaidia']),
    :host([theme='dark']) {
      --k3-code-bg: #24292e;
      --k3-code-fg: #d1d5da;
    }

    /* Adaptive M3 — no forced dark panel */
    :host([theme='material']) {
      --k3-code-bg: var(--k3-sys-color-surface-container-low, #f3f3f3);
      --k3-code-fg: var(--k3-sys-color-on-surface);
      --k3-code-comment: var(--k3-sys-color-on-surface-variant);
      --k3-code-punctuation: var(--k3-sys-color-outline);
      --k3-code-tag: var(--k3-sys-color-error);
      --k3-code-attr-name: var(--k3-sys-color-tertiary);
      --k3-code-number: var(--k3-sys-color-tertiary);
      --k3-code-string: var(--k3-sys-color-tertiary);
      --k3-code-operator: var(--k3-sys-color-on-surface-variant);
      --k3-code-function: var(--k3-sys-color-secondary);
      --k3-code-keyword: var(--k3-sys-color-primary);
      --k3-code-regex: var(--k3-sys-color-tertiary);
      --k3-code-doctype: var(--k3-sys-color-primary);
      --k3-code-selector: var(--k3-sys-color-primary);
      --k3-code-property: var(--k3-sys-color-secondary);
      --k3-code-variable: var(--k3-sys-color-secondary);
      --k3-code-atrule: var(--k3-sys-color-primary);
      --k3-code-builtin: var(--k3-sys-color-tertiary);
      --k3-code-boolean: var(--k3-sys-color-tertiary);
      --k3-code-inserted: var(--k3-sys-color-primary);
      --k3-code-deleted: var(--k3-sys-color-error);
      --k3-code-selection: color-mix(in srgb, var(--k3-sys-color-primary) 24%, transparent);
    }

    .shell {
      display: flex;
      flex-direction: column;
      gap: 2px; /* 2dp between header and code panel */
      width: 100%;
    }

    .chrome {
      display: flex;
      align-items: flex-end; /* sit on the panel seam */
      justify-content: space-between;
      gap: var(--k3-sys-spacing-space100, 0.5rem);
      min-height: 2.5rem;
      /* Outer top = panel radius · inner bottom (facing the code) = 4dp */
      border-radius: var(--k3-codeblock-radius, 1rem) var(--k3-codeblock-radius, 1rem) 4px 4px;
      background: var(
        --k3-codeblock-chrome-bg,
        var(--k3-sys-color-surface-container, var(--k3-sys-color-surface, #fff))
      );
    }

    .title-tabs {
      display: block;
      width: max-content;
      max-width: calc(100% - 5.5rem);
      min-width: 6rem;
    }

    .title-tabs--multi {
      width: auto;
      flex: 1 1 auto;
      max-width: calc(100% - 5.5rem);
    }

    .title-tabs::part(tablist) {
      border-block-end: none;
      margin: 0;
    }

    .title-tabs::part(panels) {
      display: none;
    }

    .title-tabs::part(tab) {
      flex: 0 0 auto;
      min-width: 4.5rem;
      padding-inline: 1rem;
      pointer-events: none; /* single label — not a switcher */
    }

    .title-tabs--multi::part(tab) {
      pointer-events: auto;
      cursor: pointer;
    }

    /* Primary tabs — SVG / MS fallback inherit expressive primary when active */
    .title-tabs::part(icon) {
      color: inherit;
    }

    /* Indicator rests on the panel edge */
    .title-tabs::part(indicator) {
      bottom: 0;
    }

    .actions {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      align-self: center;
      gap: var(--k3-sys-spacing-space50, 0.25rem);
      color: var(--k3-sys-color-on-surface-variant);
    }

    /* Expressive theme colours — standard icon buttons follow primary/on-surface */
    .actions k3-icon-button {
      color: var(--k3-sys-color-primary);
    }

    /* Wraps the code panel + optional Show/Hide chip on the bottom edge */
    .panel-wrap {
      position: relative;
      width: 100%;
    }

    .panel-wrap--toggle {
      /* Room for the half-protruding expand chip */
      margin-block-end: 1.25rem;
    }

    .panel {
      position: relative;
      overflow: hidden;
      /* Inner top (facing header) = 4dp · outer bottom = panel radius */
      border-radius: 4px 4px var(--k3-codeblock-radius, 1rem) var(--k3-codeblock-radius, 1rem);
      background: var(--k3-code-bg);
      color: var(--k3-code-fg);
      color-scheme: dark;
    }

    /* No chrome — keep full outer radius on the code panel alone */
    .shell:not(.shell--chrome) .panel {
      border-radius: var(--k3-codeblock-radius, 1rem);
    }

    .panel--collapsed {
      max-block-size: var(--k3-codeblock-collapsed, 9.375rem);
    }

    .panel--collapsed .code.k3-scroll {
      max-block-size: inherit;
      overflow: hidden;
    }

    /* Soft fade into the panel colour when truncated */
    .fade {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      z-index: 1;
      height: 4.5rem;
      pointer-events: none;
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--k3-code-bg) 0%, transparent),
        var(--k3-code-bg)
      );
    }

    /*
     * Expand / collapse chip — sits on the panel’s bottom edge.
     * Filled primary (Material Expressive theme roles).
     */
    .expand {
      position: absolute;
      left: 50%;
      bottom: 0;
      z-index: 2;
      transform: translate(-50%, 50%);
      box-shadow: var(--k3-sys-elevation-level2, 0 2px 6px rgb(0 0 0 / 0.28));
      border-radius: var(--k3-sys-shape-corner-full, 9999px);
    }

    .expand::part(container) {
      min-height: 2.25rem;
      padding-inline: 1rem;
      gap: var(--k3-sys-spacing-space100, 0.5rem);
      font-weight: 600;
    }

    /* Height spring when switching language tabs (line-count change) */
    .panel--sizing {
      overflow: hidden;
    }

    .panel--animating {
      /* Menu-like overshoot — spatial-fast under expressive scheme */
      transition: block-size var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9))
        );
      will-change: block-size;
    }

    @media (prefers-reduced-motion: reduce) {
      .panel--animating {
        transition: none;
      }
    }

    :host([theme='material']) .panel {
      color-scheme: inherit;
    }

    .code.k3-scroll {
      position: relative;
      width: 100%;
      max-block-size: none;
      box-sizing: border-box;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-variant-ligatures: none;
      --k3-scroll-track-inset: var(--k3-codeblock-radius, 1rem);
    }

    .code ::selection {
      background: var(--k3-code-selection);
    }

    pre,
    code {
      font-family: inherit;
    }

    pre {
      margin: 0;
      padding: 1.25em 1.5em;
      overflow: visible;
      font-size: 0.875rem;
      line-height: 1.375;
      tab-size: 2;
      white-space: pre;
      word-break: break-word;
      background: transparent;
      color: inherit;
    }

    code {
      white-space: pre;
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }

    /* Token colours via --k3-code-* */
    .token.comment,
    .token.prolog,
    .token.cdata {
      color: var(--k3-code-comment);
      font-style: italic;
    }
    .token.doctype {
      color: var(--k3-code-doctype);
    }
    .token.punctuation {
      color: var(--k3-code-punctuation);
    }
    .token.namespace {
      opacity: 0.7;
    }
    .token.tag,
    .token.constant,
    .token.symbol {
      color: var(--k3-code-tag);
    }
    .token.deleted {
      color: var(--k3-code-deleted);
    }
    .token.inserted {
      color: var(--k3-code-inserted);
    }
    .token.boolean {
      color: var(--k3-code-boolean);
    }
    .token.number {
      color: var(--k3-code-number);
    }
    .token.selector {
      color: var(--k3-code-selector);
    }
    .token.attr-name {
      color: var(--k3-code-attr-name);
    }
    .token.string,
    .token.char,
    .token.attr-value,
    .token.builtin {
      color: var(--k3-code-string);
    }
    .token.builtin {
      color: var(--k3-code-builtin);
    }
    .token.operator,
    .token.entity,
    .token.url {
      color: var(--k3-code-operator);
    }
    .token.variable {
      color: var(--k3-code-variable);
    }
    .token.atrule,
    .token.function,
    .token.class-name {
      color: var(--k3-code-function);
    }
    .token.atrule {
      color: var(--k3-code-atrule);
    }
    .token.property {
      color: var(--k3-code-property);
    }
    .token.keyword {
      color: var(--k3-code-keyword);
    }
    .token.regex,
    .token.important,
    .token.hotkey {
      color: var(--k3-code-regex);
    }
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    .token.italic {
      font-style: italic;
    }

    ::slotted(pre),
    :host > pre {
      display: none;
    }
  `,
];
