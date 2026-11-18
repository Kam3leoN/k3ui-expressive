import { css } from 'lit';

export const treeItemStyles = css`
  :host {
    display: block;
    outline: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    min-height: var(--k3-sys-spacing-space500, 2.5rem);
    padding-inline: var(--k3-sys-spacing-space100, 0.5rem);
    border-radius: var(--k3-sys-shape-corner-small, 0.5rem);
    cursor: pointer;
    color: var(--k3-sys-color-on-surface, #1d1b20);
  }
  .row:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary, #6750a4);
    outline-offset: 2px;
  }
  :host([disabled]) .row {
    opacity: 0.38;
    pointer-events: none;
    cursor: default;
  }
  :host([selected]) .row {
    background: color-mix(in srgb, var(--k3-sys-color-primary, #6750a4) 12%, transparent);
  }
  .leading,
  .trailing {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  }
  .label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chevron {
    width: 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--k3-sys-color-on-surface-variant, #49454f);
    transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial);
  }
  .chevron::before {
    content: 'chevron_right';
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
    font-size: 1.25rem;
    font-feature-settings: 'liga';
  }
  :host([expanded]) .chevron {
    transform: rotate(90deg);
  }
  .children {
    padding-inline-start: var(--k3-sys-spacing-space300, 1.5rem);
  }
  .children[hidden] {
    display: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .chevron {
      transition: none;
    }
  }
`;