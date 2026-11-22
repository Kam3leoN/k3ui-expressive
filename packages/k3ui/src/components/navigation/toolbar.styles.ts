import { css, type CSSResultGroup } from 'lit';
import { enterScaleY } from '../../motion/enter.js';

/**
 * M3E Toolbar styles — docked / floating · standard / vibrant · H/V.
 *
 * Tokens live as host CSS vars so layout variants can override gaps/pads.
 * Expand panel (`slot=expand`) uses the same scaleY enter as menus.
 */
export const toolbarStyles: CSSResultGroup = [
  /* Bottom origin — strip grows upward (toolbars sit at screen bottom). */
  enterScaleY('.expand-surface', ':host([expanded]) .expand-surface', {
    origin: 'bottom center',
    openTransform: 'scaleY(1)',
  }),
  css`
    :host {
      /* Specs — 64 · 12/8 · 4 · 16 · 32 */
      --k3-toolbar-height: 4rem; /* 64 */
      --k3-toolbar-pad-inline: 0.75rem; /* 12 floating */
      --k3-toolbar-pad-block: 0.5rem; /* 8 floating */
      --k3-toolbar-pad: var(--k3-toolbar-pad-inline); /* legacy alias */
      --k3-toolbar-gap: 0.25rem; /* 4 floating default */
      --k3-toolbar-expand-gap: 0.5rem; /* 8 between expand + actions */
      --k3-toolbar-fab-gap: 0.5rem; /* 8 */
      --k3-toolbar-radius: var(--k3-sys-shape-corner-full);
      --k3-toolbar-bg: var(--k3-sys-color-surface-container);
      --k3-toolbar-fg: var(--k3-sys-color-on-surface);
      --k3-toolbar-elev: var(--k3-sys-elevation-level2);
      display: inline-flex;
      max-width: 100%;
      vertical-align: middle;
      color: var(--k3-toolbar-fg);
    }

    /* —— Floating (default) —— */
    :host([variant='floating']) {
      --k3-toolbar-pad-inline: 0.75rem; /* 12 */
      --k3-toolbar-pad-block: 0.5rem; /* 8 */
      --k3-toolbar-pad: var(--k3-toolbar-pad-inline);
      --k3-toolbar-gap: 0.25rem; /* 4 */
      --k3-toolbar-radius: var(--k3-sys-shape-corner-full);
    }
    /* Meet-like flatter capsule — Extra large 28dp */
    :host([variant='floating'][shape='rounded']) {
      --k3-toolbar-radius: var(--k3-sys-shape-corner-extra-large, 1.75rem);
    }
    :host([variant='floating'][shape='full']),
    :host([variant='floating']:not([shape])) {
      --k3-toolbar-radius: var(--k3-sys-shape-corner-full);
    }

    /* —— Docked — full-width bottom strip (replaces bottom app bar) —— */
    :host([variant='docked']) {
      display: flex;
      width: 100%;
      --k3-toolbar-pad-inline: 1rem; /* 16 outside */
      --k3-toolbar-pad-block: 0;
      --k3-toolbar-pad: var(--k3-toolbar-pad-inline);
      --k3-toolbar-gap: 2rem; /* 32 cluster */
      --k3-toolbar-radius: 0;
      --k3-toolbar-elev: var(--k3-sys-elevation-level0);
    }
    :host([variant='docked'][layout='spread']) {
      --k3-toolbar-gap: 0;
    }
    :host([variant='docked'][sticky]) {
      position: sticky;
      bottom: 0;
      z-index: 10;
    }

    /* —— Color —— */
    :host([color='standard']) {
      --k3-toolbar-bg: var(--k3-sys-color-surface-container);
      --k3-toolbar-fg: var(--k3-sys-color-on-surface);
    }
    :host([color='vibrant']) {
      --k3-toolbar-bg: var(--k3-sys-color-primary-container);
      --k3-toolbar-fg: var(--k3-sys-color-on-primary-container);
    }

    /* —— Orientation (floating vertical pill) —— */
    :host([orientation='vertical']) {
      flex-direction: column;
      align-items: center;
    }
    :host([orientation='vertical']) .shell {
      flex-direction: column;
      align-items: center;
    }
    :host([orientation='vertical']) .bar {
      flex-direction: column;
      align-items: center;
      width: var(--k3-toolbar-height);
      min-width: var(--k3-toolbar-height);
      max-width: var(--k3-toolbar-height);
      min-height: 0;
      height: auto;
      padding: var(--k3-toolbar-pad-inline);
    }
    :host([orientation='vertical']) .actions,
    :host([orientation='vertical']) .middle,
    :host([orientation='vertical']) .leading,
    :host([orientation='vertical']) .trailing {
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    :host([orientation='vertical']) .fab {
      margin-block-start: var(--k3-toolbar-fab-gap);
      margin-inline-start: 0;
    }

    .shell {
      display: inline-flex;
      /* Bottom-align FAB when expand grows the bar upward */
      align-items: flex-end;
      gap: var(--k3-toolbar-fab-gap);
      max-width: 100%;
    }
    :host([variant='docked']) .shell {
      display: flex;
      width: 100%;
    }

    .bar {
      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      box-sizing: border-box;
      min-height: var(--k3-toolbar-height);
      padding: var(--k3-toolbar-pad-block) var(--k3-toolbar-pad-inline);
      background: var(--k3-toolbar-bg);
      color: var(--k3-toolbar-fg);
      border-radius: var(--k3-toolbar-radius);
      box-shadow: var(--k3-toolbar-elev);
      max-width: 100%;
      /* Clip press-morph; open allows menu scaleY spring overshoot */
      overflow: hidden;
      gap: 0;
    }
    :host([expanded]) .bar {
      gap: var(--k3-toolbar-expand-gap);
      overflow: visible;
    }
    :host([variant='docked']) .bar {
      display: flex;
      width: 100%;
      padding-inline: var(--k3-toolbar-pad-inline);
      padding-block: 0;
      padding-block-end: env(safe-area-inset-bottom, 0);
      border-radius: 0;
      box-shadow: none;
    }
    :host([variant='docked'][elevated]) .bar {
      box-shadow: var(--k3-sys-elevation-level2);
    }

    /*
     * Expand panel (Meet reactions strip) — grid 0fr→1fr grows the bar;
     * inner surface uses menu-identical scaleY enter (enterScaleY above).
     */
    .expand {
      display: grid;
      grid-template-rows: 0fr;
      /* Grow bar without bounce — strip itself uses enterScaleY (menu spring). */
      transition: grid-template-rows var(--k3-sys-motion-duration-spatial-fast, 350ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
    }
    :host([expanded]) .expand {
      grid-template-rows: 1fr;
    }
    .expand:not(.has) {
      display: none;
    }
    .expand-clip {
      overflow: hidden;
      min-height: 0;
    }
    /* Let spatial-fast bounce past 1 (same as menus) at end of enter */
    :host([expanded]) .expand-clip {
      overflow: visible;
    }
    .expand-surface {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      width: 100%;
    }

    .actions {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--k3-toolbar-gap);
      min-width: 0;
      flex: 1 1 auto;
    }
    :host([variant='floating']) .actions {
      flex: 0 1 auto;
    }
    :host([variant='docked'][layout='spread']) .actions {
      justify-content: space-between;
      width: 100%;
    }

    .leading,
    .middle,
    .trailing {
      display: inline-flex;
      align-items: center;
      gap: var(--k3-toolbar-gap);
      min-width: 0;
    }
    :host([variant='docked'][layout='spread']) .leading,
    :host([variant='docked'][layout='spread']) .trailing {
      flex: 0 0 auto;
    }
    :host([variant='docked'][layout='spread']) .middle {
      flex: 1 1 auto;
      justify-content: center;
    }
    .leading:not(.has),
    .trailing:not(.has) {
      display: none;
    }
    /* Cluster / floating — single default slot lives in .middle */
    :host(:not([layout='spread'])) .leading,
    :host(:not([layout='spread'])) .trailing {
      display: none;
    }
    :host(:not([layout='spread'])) .middle {
      display: inline-flex;
      flex: 0 1 auto;
    }

    .fab {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
    }
    .fab:not(.has) {
      display: none;
    }

    /* Soften child chrome color on vibrant surface */
    :host([color='vibrant']) ::slotted(k3-icon-button),
    :host([color='vibrant']) ::slotted(k3-button) {
      --k3-sys-color-primary: var(--k3-sys-color-on-primary-container);
      --k3-sys-color-on-surface: var(--k3-sys-color-on-primary-container);
      --k3-sys-color-on-surface-variant: var(--k3-sys-color-on-primary-container);
    }

    @media (prefers-reduced-motion: reduce) {
      .bar,
      .expand {
        transition: none;
      }
      :host([expanded]) .expand {
        transition: none;
      }
    }
  `,
];
