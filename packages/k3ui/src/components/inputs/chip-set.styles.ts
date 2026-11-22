import { css, type CSSResultGroup } from 'lit';
import { sortableSetStyles } from '../_shared.js';

/** Styles for `k3-chip-set` — wrap row + shared sortable host chrome. */
export const chipSetStyles: CSSResultGroup = [
  sortableSetStyles('k3-chip'),
  css`
    :host {
      display: block;
      max-width: 100%;
    }
    .set {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem; /* 8 */
    }
  `,
];
