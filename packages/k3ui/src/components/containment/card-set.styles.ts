import { css, type CSSResultGroup } from 'lit';
import { sortableSetStyles } from '../_shared.js';

/** Styles for `k3-card-set` — stack · layout grid · connected joins · sortable. */
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

    /* ── Connected — tight joins · outer/inner corners via card tokens ── */
    :host([variant='connected']) .set {
      gap: var(--k3-card-set-connected-gap, 0.125rem); /* 2dp fallback */
      /* Same physical gap on both axes — avoids uneven cross seams */
      row-gap: var(--k3-card-set-connected-gap, 0.125rem);
      column-gap: var(--k3-card-set-connected-gap, 0.125rem);
    }
    :host([variant='connected'][layout='grid']) .set {
      /* Fixed columns when --k3-card-set-columns is set (JS); else layout tracks */
      grid-template-columns: repeat(
        var(--k3-card-set-columns, var(--k3-layout-columns, 12)),
        minmax(0, 1fr)
      );
      gap: var(--k3-card-set-connected-gap, 0.125rem);
      row-gap: var(--k3-card-set-connected-gap, 0.125rem);
      column-gap: var(--k3-card-set-connected-gap, 0.125rem);
      align-items: stretch;
      justify-items: stretch;
    }
    /*
     * Fill the grid cell — if only the host stretches and .card hugs content,
     * row gutters look broken (taller cards visually “span” into the next row).
     */
    :host([variant='connected'][layout='grid']) ::slotted(k3-card) {
      align-self: stretch;
      justify-self: stretch;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }
    /* Connected grid with explicit columns — unit span (not layout span-4) */
    :host([variant='connected'][layout='grid'][columns]) ::slotted(k3-card) {
      grid-column: span 1;
    }
    :host([variant='connected'][layout='grid'][columns]) ::slotted(k3-card[col-span='2']) {
      grid-column: span 2;
    }
    :host([variant='connected'][layout='grid'][columns]) ::slotted(k3-card[col-span='3']) {
      grid-column: span 3;
    }
    :host([variant='connected'][layout='grid'][columns]) ::slotted(k3-card[col-span='4']) {
      grid-column: span 4;
    }
    :host([variant='connected'][layout='grid'][columns])
      ::slotted(k3-card[col-span='full']),
    :host([variant='connected'][layout='grid'][columns])
      ::slotted(k3-card[col-span='12']) {
      grid-column: 1 / -1;
    }
  `,
];
