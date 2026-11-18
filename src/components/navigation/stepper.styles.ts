import { css } from 'lit';

export const stepperStyles = css`
  :host {
    display: block;
    color: var(--k3-sys-color-on-surface, #1d1b20);
  }
  .header {
    display: flex;
    align-items: flex-start;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }
  :host([orientation='vertical']) .header {
    flex-direction: column;
    align-items: stretch;
  }
  .step-btn {
    display: flex;
    align-items: flex-start;
    gap: var(--k3-sys-spacing-space150, 0.75rem);
    flex: 1 1 0;
    min-width: 0;
    padding: var(--k3-sys-spacing-space100, 0.5rem);
    border: 0;
    border-radius: var(--k3-sys-shape-corner-small, 0.5rem);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  :host([orientation='vertical']) .step-btn {
    width: 100%;
  }
  .step-btn:disabled {
    cursor: not-allowed;
    opacity: 0.38;
  }
  .step-btn:not(:disabled):hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface, #1d1b20) 8%, transparent);
  }
  .step-btn[aria-selected='true'] {
    color: var(--k3-sys-color-primary, #6750a4);
  }
  .step-btn[aria-selected='true'] .indicator {
    background: var(--k3-sys-color-primary, #6750a4);
    color: var(--k3-sys-color-on-primary, #fff);
  }
  .step-btn[data-completed] .indicator {
    background: var(--k3-sys-color-primary, #6750a4);
    color: var(--k3-sys-color-on-primary, #fff);
  }
  .step-btn[data-error] .indicator {
    background: var(--k3-sys-color-error, #b3261e);
    color: var(--k3-sys-color-on-error, #fff);
  }
  .indicator {
    flex-shrink: 0;
    width: var(--k3-sys-spacing-space300, 1.5rem);
    height: var(--k3-sys-spacing-space300, 1.5rem);
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: 500;
    background: var(--k3-sys-color-surface-container-high, #ece6f0);
    color: var(--k3-sys-color-on-surface-variant, #49454f);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space050, 0.25rem);
    min-width: 0;
  }
  .label {
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-title-small-weight, 500);
  }
  .supporting {
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    color: var(--k3-sys-color-on-surface-variant, #49454f);
  }
  .connector {
    flex: 0 0 var(--k3-sys-spacing-space500, 2.5rem);
    align-self: center;
    height: 2px;
    margin-block-start: var(--k3-sys-spacing-space200, 1rem);
    background: var(--k3-sys-color-outline-variant, #cac4d0);
  }
  :host([orientation='vertical']) .connector {
    display: none;
  }
  .bodies {
    min-width: 0;
  }
  .steps-slot {
    display: none;
  }
`;