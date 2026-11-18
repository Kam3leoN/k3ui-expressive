import { css } from 'lit';

export const stepStyles = css`
  :host {
    display: none;
  }
  :host([active]) {
    display: block;
  }
  .panel {
    padding-block-start: var(--k3-sys-spacing-space300, 1.5rem);
  }
`;