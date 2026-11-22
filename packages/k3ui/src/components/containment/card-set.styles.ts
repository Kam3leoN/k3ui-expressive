import { css, type CSSResultGroup } from 'lit';
import { sortableSetStyles } from '../_shared.js';

/** Styles for `k3-card-set` — stack · layout grid · shared sortable host chrome. */
export const cardSetStyles: CSSResultGroup = [
  sortableSetStyles('k3-card'),
  css`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
    }
    .set {
      display: flex;
      flex-direction: column;
      gap: 0.5rem; /* 8 dp max between cards (M3) */
      margin: 0;
      padding: 0;
      min-width: 0;
    }
    /* Same tracks + gutter as playground grid-3 / layout overlay */
    :host([layout='grid']) .set {
      display: grid;
      grid-template-columns: repeat(var(--k3-layout-columns, 12), minmax(0, 1fr));
      gap: var(--k3-layout-gutter, 0.5rem);
    }
    :host([layout='grid']) ::slotted(k3-card) {
      grid-column: span 4; /* 4-col → 1/row · 8-col → 2/row · 12-col → 3/row */
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
  `,
];