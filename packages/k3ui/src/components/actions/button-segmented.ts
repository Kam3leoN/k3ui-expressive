import { html, nothing, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, haptic } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonSegmentedSpecs,
  clampSelectedIndices,
  parseIndicesAttr,
  parseSegmentsAttr,
  type ButtonSegmentedSegment,
  type ButtonSegmentedShape,
} from './button-segmented.specs.js';
import { buttonSegmentedStyles } from './button-segmented.styles.js';
import { i18n } from '../../i18n/index.js';

export type { ButtonSegmentedSegment, ButtonSegmentedShape } from './button-segmented.specs.js';
export {
  ButtonSegmentedSpecs,
  clampSelectedIndices,
  parseSegmentsAttr,
} from './button-segmented.specs.js';

/**
 * M3 Expressive segmented button — JSON `segments`, optional multi-select + check mark.
 *
 * @fires k3-change — `{ indices, values }` after user selection
 *
 * @see ./button-segmented.specs.ts
 */
export class K3ButtonSegmented extends K3Element {
  static override styles = [hostReset, buttonSegmentedStyles];

  @property({
    attribute: 'segments',
    converter: {
      fromAttribute: parseSegmentsAttr,
      toAttribute: (v: ButtonSegmentedSegment[]) =>
        v.length ? JSON.stringify(v) : null,
    },
  })
  segments: ButtonSegmentedSegment[] = [];

  @property({ reflect: true })
  shape: ButtonSegmentedShape = ButtonSegmentedSpecs.defaultShape;

  @property({ type: Boolean, attribute: 'multi-select', reflect: true })
  multiSelect = ButtonSegmentedSpecs.defaultMultiSelect;

  @property({ type: Boolean, attribute: 'show-check', reflect: true })
  showCheck = ButtonSegmentedSpecs.defaultShowCheck;

  @property({
    attribute: 'selected-indices',
    converter: {
      fromAttribute: parseIndicesAttr,
      toAttribute: (v: number[]) => JSON.stringify(v),
    },
  })
  selectedIndices: number[] = [...ButtonSegmentedSpecs.defaultSelectedIndices];

  /** Initial selection when `selected-indices` is omitted (v1 `default-selected`). */
  @property({
    attribute: 'default-selected',
    converter: {
      fromAttribute: parseIndicesAttr,
      toAttribute: (v: number[]) => JSON.stringify(v),
    },
  })
  defaultSelected: number[] = [...ButtonSegmentedSpecs.defaultSelectedIndices];

  @property({ attribute: 'aria-label' })
  ariaLabel = '';

  @state() private _selected: number[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._selected = this.resolveInitialSelection();
    this.syncHostRole();
  }

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    /* External `selectedIndices` writes (property or attribute) drive the selection */
    if (changed.has('selectedIndices') && changed.get('selectedIndices') !== undefined) {
      let next = clampSelectedIndices(this.selectedIndices, this.segments.length);
      if (!this.multiSelect) next = next.slice(0, 1);
      if (next.join(',') !== this._selected.join(',')) this._selected = next;
    }
    if (changed.has('segments')) {
      this._selected = clampSelectedIndices(this._selected, this.segments.length);
      if (
        this._selected.length === 0 &&
        this.segments.length > 0 &&
        !this.multiSelect
      ) {
        this._selected = clampSelectedIndices(
          this.selectedIndices.length ? this.selectedIndices : this.defaultSelected,
          this.segments.length,
        );
      }
    }
    if (changed.has('multiSelect')) {
      this.syncHostRole();
      if (!this.multiSelect && this._selected.length > 1) {
        this._selected = this._selected.slice(0, 1);
      }
    }
  }

  /** Currently selected segment indices (sorted). */
  getSelectedIndices(): number[] {
    return [...this._selected];
  }

  /**
   * Programmatic selection — does not emit `k3-change`.
   * @param indices - Segment indices to select
   */
  setSelectedIndices(indices: number[]): void {
    this._selected = clampSelectedIndices(indices, this.segments.length);
    this.selectedIndices = [...this._selected];
    this.requestUpdate();
  }

  private resolveInitialSelection(): number[] {
    const fromAttr = this.selectedIndices;
    const base =
      fromAttr.length > 0 ? fromAttr : this.defaultSelected.length ? this.defaultSelected : [0];
    return clampSelectedIndices(base, this.segments.length);
  }

  private syncHostRole(): void {
    this.setAttribute(
      'role',
      this.multiSelect
        ? ButtonSegmentedSpecs.accessibility.roleMulti
        : ButtonSegmentedSpecs.accessibility.roleSingle,
    );
  }

  private segmentValue(index: number): string {
    const seg = this.segments[index];
    if (!seg) return '';
    if (seg.value != null && seg.value !== '') return seg.value;
    return seg.label;
  }

  private selectedValues(): string[] {
    return this._selected.map((i) => this.segmentValue(i));
  }

  private emitChange(): void {
    const indices = this.getSelectedIndices();
    this.selectedIndices = [...indices];
    this.emit('k3-change', { indices, values: this.selectedValues() });
  }

  private toggle(index: number): void {
    haptic.selection();
    if (this.multiSelect) {
      const next = new Set(this._selected);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      this._selected = [...next].sort((a, b) => a - b);
    } else {
      this._selected = [index];
    }
    this.emitChange();
  }

  private renderSegment(seg: ButtonSegmentedSegment, index: number) {
    const active = this._selected.includes(index);
    const disabled =
      seg.attributes?.disabled === 'true' || seg.attributes?.disabled === '';

    return html`<button
      type="button"
      class=${classMap({
        'button-segmented__btn': true,
        'button-segmented__btn--active': active,
      })}
      part="segment"
      data-index=${String(index)}
      data-value=${ifDefined(seg.value)}
      role=${this.multiSelect ? 'checkbox' : 'radio'}
      aria-checked=${active ? 'true' : 'false'}
      ?disabled=${disabled}
      @click=${() => this.toggle(index)}
    >
      <span class="button-segmented__pill" aria-hidden="true"></span>
      <span class="button-segmented__overlay" aria-hidden="true"></span>
      <span class="button-segmented__content">
        ${this.showCheck
          ? html`<span class="button-segmented__leading-icon" aria-hidden="true"
              ><span
                class="button-segmented__icon ms notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon=${ButtonSegmentedSpecs.checkIcon}
              ></span
            ></span>`
          : nothing}
        ${seg.icon
          ? html`<span class="button-segmented__icon ms notranslate" translate="no" lang="zxx" data-k3-icon=${seg.icon} aria-hidden="true"></span>`
          : nothing}
        <span class="button-segmented__label">${seg.label}</span>
      </span>
    </button>`;
  }

  override render() {
    if (this.segments.length === 0) {
      return html`<div class="button-segmented" part="root" aria-hidden="true"></div>`;
    }

    return html`
      <div
        class="button-segmented"
        part="root"
        aria-label=${this.ariaLabel || i18n.t('segmented.ariaLabel', ButtonSegmentedSpecs.accessibility.defaultLabel)}
      >
        ${this.segments.map((seg, i) => this.renderSegment(seg, i))}
      </div>
    `;
  }
}

if (!customElements.get('k3-button-segmented')) {
  customElements.define('k3-button-segmented', K3ButtonSegmented);
}

export default K3ButtonSegmented;
