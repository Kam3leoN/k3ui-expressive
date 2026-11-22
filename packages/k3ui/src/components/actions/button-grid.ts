import { html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  haptic,
  prefersReducedMotion,
  stateLayerStyles,
  focusRingStyles,
  devicePixelSnapCss,
  devicePixelSnapPx,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  BUTTON_GRID_CELLS,
  BUTTON_GRID_DEFAULT_LABELS,
  ButtonGridCellDp,
  ButtonGridGapDp,
  ButtonGridSpecs,
  normalizeButtonGridLabels,
  parseButtonGridLabelsAttr,
  type ButtonGridVariant,
} from './button-grid.specs.js';
import { buttonGridStyles } from './button-grid.styles.js';

export type { ButtonGridVariant, ButtonGridPosition, ButtonGridCellDef } from './button-grid.specs.js';
export {
  ButtonGridSpecs,
  BUTTON_GRID_CELLS,
  BUTTON_GRID_DEFAULT_LABELS,
  ButtonGridCellDp,
  ButtonGridGapDp,
  ButtonGridSizeDp,
} from './button-grid.specs.js';

const labelsConverter = {
  fromAttribute: (value: string | null): string[] => parseButtonGridLabelsAttr(value),
  toAttribute: (value: string[]): string | null =>
    value?.length ? value.join(',') : null,
};

/**
 * Default-true boolean — Lit's Boolean converter treats a missing attribute as
 * false, which would flip the FAB default off. Absent / empty / "true" / "1"
 * → true; "false" / "0" → false.
 */
const triggerFabConverter = {
  fromAttribute: (value: string | null): boolean => {
    if (value === null) return true;
    if (value === 'false' || value === '0') return false;
    return true;
  },
  toAttribute: (value: boolean): string | null => (value ? '' : 'false'),
};

/**
 * Material 3 Expressive 3×3 button grid — FAB reveal or always-open pad.
 *
 * - Variants: `filled` · `tonal` · `outlined`
 * - `trigger-fab` (default true) — also accepts `data-trigger="fab|pad"`
 * - `labels` CSV attribute → 9 strings (default `"1,2,3,4,5,6,7,8,9"`)
 * - Reduced motion forces pad mode
 *
 * @fires k3-select - `{ index: 0–8, label }` — **0-based** index (Lit API;
 *   v1 used 1-based `onSelect`)
 *
 * @see ./button-grid.specs.ts
 */
export class K3ButtonGrid extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    buttonGridStyles,
  ];

  @property({ reflect: true })
  variant: ButtonGridVariant = ButtonGridSpecs.defaultVariant;

  /**
   * When true, show a centred FAB that expands into the 3×3 grid.
   * Forced off when `prefers-reduced-motion` or `data-trigger="pad"`.
   */
  @property({
    reflect: true,
    attribute: 'trigger-fab',
    converter: triggerFabConverter,
  })
  triggerFab: boolean = ButtonGridSpecs.defaultTriggerFab;

  /** Nine cell labels (default 1–9). Attribute: comma-separated CSV. */
  @property({ converter: labelsConverter })
  labels: string[] = [...BUTTON_GRID_DEFAULT_LABELS];

  /** Expanded grid visible (FAB mode only). */
  @state() private expanded = false;

  private _unwatchDpr: (() => void) | null = null;

  /**
   * Snap the 2dp cell gap (and total 3×3 size) to integer device pixels.
   * At Windows 125% DPI, raw `2px` → 2.5 physical and CSS grid-gap rounds
   * unevenly — same helper as split-button / segmented lists.
   */
  private applyGapToken = (): void => {
    const gapPx = devicePixelSnapPx(ButtonGridGapDp);
    this.style.setProperty('--k3-btn-grid-gap', devicePixelSnapCss(ButtonGridGapDp));
    /* 3×48 + 2×snapped-gap — keep host / .grid box in sync with hairlines. */
    this.style.setProperty(
      '--k3-btn-grid-size',
      `${3 * ButtonGridCellDp + 2 * gapPx}px`,
    );
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    if (!this.useFabTrigger || !this.expanded) return;
    e.preventDefault();
    this.collapse();
  };

  /** Effective FAB mode after reduced-motion / data-trigger overrides. */
  private get useFabTrigger(): boolean {
    if (ButtonGridSpecs.accessibility.autoPadForReducedMotion && prefersReducedMotion()) {
      return false;
    }
    const dataTrigger = this.getAttribute('data-trigger');
    if (dataTrigger === 'pad') return false;
    if (dataTrigger === 'fab') return true;
    return this.triggerFab !== false;
  }

  private resolvedLabels(): string[] {
    return normalizeButtonGridLabels(this.labels);
  }

  /** Whether the FAB grid is currently expanded. */
  get isExpanded(): boolean {
    return this.useFabTrigger && this.expanded;
  }

  /** Expand the grid (FAB mode only). */
  expand(): void {
    if (!this.useFabTrigger) return;
    this.expanded = true;
  }

  /** Collapse back to the FAB. */
  collapse(): void {
    if (!this.useFabTrigger) return;
    this.expanded = false;
  }

  /**
   * Select a cell by **0-based** index (0–8).
   * Emits `k3-select` with `{ index, label }` and collapses FAB mode.
   */
  select(index: number): void {
    if (index < 0 || index > 8) return;
    const labels = this.resolvedLabels();
    const label = labels[index] ?? String(index + 1);
    haptic.medium();
    this.emit('k3-select', { index, label });
    if (this.useFabTrigger) this.collapse();
  }

  private onFabClick = (e: Event): void => {
    e.preventDefault();
    this.expand();
  };

  private onCellClick = (e: Event): void => {
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    const raw = btn.dataset.index;
    const index = raw != null ? Number(raw) : NaN;
    if (Number.isFinite(index)) this.select(index);
  };

  private syncHostAttrs(): void {
    const fab = this.useFabTrigger;
    this.setAttribute('data-trigger', fab ? 'fab' : 'pad');
    if (fab) {
      this.setAttribute('data-state', this.expanded ? 'expanded' : 'collapsed');
    } else {
      this.removeAttribute('data-state');
      this.expanded = false;
    }
    if (this.getAttribute('role') !== ButtonGridSpecs.accessibility.role) {
      this.setAttribute('role', ButtonGridSpecs.accessibility.role);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    /* Honour data-trigger written before upgrade. */
    const dt = this.getAttribute('data-trigger');
    if (dt === 'pad') this.triggerFab = false;
    else if (dt === 'fab') this.triggerFab = true;
    this.syncHostAttrs();
    this.applyGapToken();
    this._unwatchDpr?.();
    this._unwatchDpr = watchDevicePixelRatio(this.applyGapToken);
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    this._unwatchDpr?.();
    this._unwatchDpr = null;
    this.removeEventListener('keydown', this.onKeyDown);
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('labels')) {
      this.labels = normalizeButtonGridLabels(this.labels);
    }
    if (changed.has('variant')) {
      const v = this.variant;
      if (v !== 'filled' && v !== 'tonal' && v !== 'outlined') {
        this.variant = ButtonGridSpecs.defaultVariant;
      }
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncHostAttrs();
  }

  override render() {
    const labels = this.resolvedLabels();
    const fab = this.useFabTrigger;

    return html`
      ${fab
        ? html`
            <button
              type="button"
              class="fab k3-state-layer k3-focus-ring"
              part="fab"
              aria-label=${i18n.t('buttonGrid.open', ButtonGridSpecs.accessibility.fabLabel)}
              aria-expanded=${this.expanded ? 'true' : 'false'}
              @click=${this.onFabClick}
            >
              <span
                class="icon notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon="apps"
                aria-hidden="true"
              ></span>
            </button>
          `
        : null}
      <div class="grid" part="grid">
        ${BUTTON_GRID_CELLS.map((meta, i) => {
          const label = labels[i] ?? String(i + 1);
          return html`
            <button
              type="button"
              class=${classMap({
                cell: true,
                [`cell--${meta.position}`]: true,
                'k3-state-layer': true,
                'k3-focus-ring': true,
              })}
              part="cell"
              data-d=${String(meta.staggerDistance)}
              data-index=${String(i)}
              aria-label=${label}
              @click=${this.onCellClick}
            >
              ${label}
            </button>
          `;
        })}
      </div>
    `;
  }
}

export default K3ButtonGrid;

if (!customElements.get('k3-button-grid')) {
  customElements.define('k3-button-grid', K3ButtonGrid);
}
