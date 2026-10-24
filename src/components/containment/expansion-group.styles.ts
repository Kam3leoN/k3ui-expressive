import { css } from 'lit';

/**
 * Expansion group layout — gap on `.container` (slotted panels are its flex children).
 * Default 2 dp (M3E segmented list parity); `flush` → 0 + hairlines.
 */
export const expansionGroupStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .container {
    display: flex;
    flex-direction: column;
    gap: var(--k3-expansion-group-gap, 0.125rem);
    width: 100%;
  }
  :host([flush]) {
    --k3-expansion-group-gap: 0;
  }
  :host([flush]) ::slotted(k3-expansion-panel:not(:first-child)) {
    box-shadow: inset 0 1px 0 0 var(--k3-sys-color-outline-variant);
  }
`;