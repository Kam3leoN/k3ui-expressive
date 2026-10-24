import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { registry } from '../../registry/register.js';

export type TableDensity = 'default' | 'compact';
export type TableVariant = 'outlined' | 'filled';

/**
 * M3 data table — material.io Resources-style surface.
 * Header tint · horizontal rules only · status pills · end-aligned columns.
 *
 * ```html
 * <k3-table>
 *   <table>
 *     <thead><tr><th>Type</th><th>Resource</th><th class="end">Status</th></tr></thead>
 *     <tbody>…</tbody>
 *   </table>
 * </k3-table>
 * ```
 * Or `columns` + `rows` JSON (+ optional `align` comma list).
 */
export class K3Table extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        width: 100%;
        --k3-table-row-h: 3.5rem; /* 56 */
        --k3-table-pad-inline: 1rem; /* 16 */
        --k3-table-pad-block: 0.75rem; /* 12 */
      }
      :host([density='compact']) {
        --k3-table-row-h: 2.5rem; /* 40 */
        --k3-table-pad-inline: 0.75rem;
        --k3-table-pad-block: 0.5rem;
      }
      .frame {
        width: 100%;
        overflow: auto;
        border-radius: var(--k3-sys-shape-corner-medium); /* 12 — material.io */
        background: var(--k3-sys-color-surface);
        box-sizing: border-box;
      }
      :host([variant='outlined']) .frame {
        box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
      }
      :host([variant='filled']) .frame {
        background: var(--k3-sys-color-surface-container-lowest, var(--k3-sys-color-surface));
        box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
      }
      ::slotted(table),
      table.gen {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        font-family: var(--k3-ref-typeface-plain);
        font-size: var(--k3-sys-typescale-body-medium-size);
        color: var(--k3-sys-color-on-surface);
      }
      ::slotted(table) th,
      ::slotted(table) td,
      table.gen th,
      table.gen td {
        min-height: var(--k3-table-row-h);
        padding: var(--k3-table-pad-block) var(--k3-table-pad-inline);
        text-align: start;
        vertical-align: middle;
        border-block-end: 1px solid var(--k3-sys-color-outline-variant);
        border-inline: 0;
      }
      /* Header — tinted surface-container (material.io) */
      ::slotted(table) thead th,
      table.gen thead th {
        font-size: var(--k3-sys-typescale-title-small-size);
        font-weight: 500;
        color: var(--k3-sys-color-on-surface-variant);
        background: var(--k3-sys-color-surface-container);
        border-block-end: 1px solid var(--k3-sys-color-outline-variant);
      }
      ::slotted(table) tbody tr:hover,
      table.gen tbody tr:hover {
        background: color-mix(in srgb, var(--k3-sys-color-on-surface) 4%, transparent);
      }
      ::slotted(table) tbody tr:last-child td,
      table.gen tbody tr:last-child td {
        border-block-end: 0;
      }
      /* Rowspan labels sit at top (material.io Type column) */
      ::slotted(table) td[rowspan],
      table.gen td[rowspan] {
        vertical-align: top;
      }
      /* End-aligned columns (Status) */
      ::slotted(table) th.end,
      ::slotted(table) td.end,
      ::slotted(table) th[align='end'],
      ::slotted(table) td[align='end'],
      table.gen th.end,
      table.gen td.end {
        text-align: end;
      }
      /* Resource links */
      ::slotted(table) a,
      table.gen a {
        color: var(--k3-sys-color-primary);
        text-decoration: underline;
        text-underline-offset: 0.15em;
      }
      ::slotted(table) a:hover,
      table.gen a:hover {
        text-decoration-thickness: 2px;
      }
      .resource {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .resource .ms {
        font-family: 'Material Symbols Rounded', sans-serif;
        font-size: 1.25rem;
        color: var(--k3-sys-color-on-surface-variant);
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      /* Legacy status spans — prefer <k3-chip status="…"> (see chip docs) */
      .k3-status,
      ::slotted(.k3-status) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-height: 2rem; /* 32 */
        padding: 0 1rem; /* 16 — match k3-chip */
        border-radius: var(--k3-sys-shape-corner-small); /* 8 — match k3-chip */
        font-size: var(--k3-sys-typescale-label-large-size);
        font-weight: 500;
        line-height: 1.25;
        white-space: nowrap;
      }
      .k3-status--available,
      ::slotted(.k3-status--available) {
        background: var(--k3-sys-color-tertiary-container);
        color: var(--k3-sys-color-on-tertiary-container);
      }
      .k3-status--unavailable,
      ::slotted(.k3-status--unavailable) {
        background: var(--k3-sys-color-surface-container-highest);
        color: var(--k3-sys-color-on-surface-variant);
      }
      .caption {
        padding: 0.75rem var(--k3-table-pad-inline);
        font-size: var(--k3-sys-typescale-label-large-size);
        color: var(--k3-sys-color-on-surface-variant);
      }
    `,
  ];

  @property({ reflect: true }) density: TableDensity = 'default';
  @property({ reflect: true }) variant: TableVariant = 'outlined';
  @property() caption = '';
  /** Comma-separated header labels */
  @property() columns = '';
  /** JSON array of row string arrays */
  @property() rows = '';
  /** Comma-separated align per column: start | end | center */
  @property() align = '';

  private parsedColumns(): string[] {
    return this.columns
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private parsedAlign(): Array<'start' | 'end' | 'center'> {
    return this.align
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .map((s) => (s === 'end' || s === 'center' ? s : 'start'));
  }

  private parsedRows(): string[][] {
    if (!this.rows.trim()) return [];
    try {
      const data = JSON.parse(this.rows) as unknown;
      if (!Array.isArray(data)) return [];
      return data.map((r) => (Array.isArray(r) ? r.map(String) : [String(r)]));
    } catch {
      return [];
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    void registry.register('k3-chip');
  }

  private cellContent(raw: string) {
    const key = raw.trim().toLowerCase();
    if (key === 'available') {
      return html`<k3-chip status="available">Available</k3-chip>`;
    }
    if (key === 'unavailable') {
      return html`<k3-chip status="unavailable">Unavailable</k3-chip>`;
    }
    return raw;
  }

  override render() {
    const cols = this.parsedColumns();
    const rows = this.parsedRows();
    const aligns = this.parsedAlign();
    const generated = cols.length > 0;

    return html`<div class="frame" part="container">
      ${this.caption
        ? html`<div class="caption" part="caption">${this.caption}</div>`
        : nothing}
      ${generated
        ? html`<table class="gen" part="table">
            <thead>
              <tr>
                ${cols.map((c, i) => {
                  const a = aligns[i] ?? 'start';
                  return html`<th scope="col" class=${a === 'end' ? 'end' : ''} align=${a}>
                    ${c}
                  </th>`;
                })}
              </tr>
            </thead>
            <tbody>
              ${rows.map(
                (r) => html`<tr>
                  ${cols.map((_, i) => {
                    const a = aligns[i] ?? 'start';
                    return html`<td class=${a === 'end' ? 'end' : ''} align=${a}>
                      ${this.cellContent(r[i] ?? '')}
                    </td>`;
                  })}
                </tr>`,
              )}
            </tbody>
          </table>`
        : html`<slot></slot>`}
    </div>`;
  }
}
export default K3Table;
