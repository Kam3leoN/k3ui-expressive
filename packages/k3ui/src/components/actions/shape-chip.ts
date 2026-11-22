import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  emitLifecycle,
  focusRingStyles,
  hasNamedSlot,
  stateLayerStyles,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  MATERIAL_SHAPE_SVG,
  type MaterialShapeName,
} from '../../shapes/index.js';
import {
  ShapeChipDefaultShape,
  ShapeChipDefaultSize,
  type ShapeChipPlacement,
  type ShapeChipSize,
} from './shape-chip.specs.js';
import { shapeChipStyles } from './shape-chip.styles.js';

/**
 * Shape Chip — informative pill + Material shape on leading or trailing edge.
 *
 * Custom K3ui **Actions** control — not an M3 Chip / Input. Default is static
 * (legend / label). Pass `toggle` only when selection is needed.
 *
 * Sizes xs→xl match the Buttons height ladder; shape/icon scale with the pill.
 *
 * ```html
 * <k3-shape-chip shape="Cookie7Sided" style="--k3-shape-chip-color:#e91e63">
 *   Special
 * </k3-shape-chip>
 * <k3-shape-chip size="lg" placement="trailing" style="--k3-shape-chip-color:#26a69a">
 *   <span class="ms" slot="icon" data-k3-icon="bookmark"></span>
 *   Bookmark
 * </k3-shape-chip>
 * ```
 *
 * Tokens: `--k3-shape-chip-color` · `--k3-shape-chip-shape` · `--k3-shape-chip-pill-h`
 */
export class K3ShapeChip extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    shapeChipStyles,
  ];

  /** Material shape name (default Cookie7Sided). */
  @property({ reflect: true })
  shape: MaterialShapeName = ShapeChipDefaultShape;

  /** xs 32 · sm 40 (default) · md 56 · lg 96 · xl 136 — same as Buttons. */
  @property({ reflect: true })
  size: ShapeChipSize = ShapeChipDefaultSize;

  /** Shape on leading (default) or trailing edge of the pill. */
  @property({ reflect: true })
  placement: ShapeChipPlacement = 'leading';

  /** Selected visual — only meaningful with `toggle`. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Opt-in interactive toggle (default: static / informative). */
  @property({ type: Boolean, reflect: true }) toggle = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Optional value for listeners when interactive. */
  @property() value = '';

  @property({ type: Boolean, reflect: true, attribute: 'has-icon' })
  hasIcon = false;

  @state() private _slotTick = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.syncSlots();
  }

  private syncSlots = () => {
    const next = hasNamedSlot(this, 'icon');
    if (next !== this.hasIcon) this.hasIcon = next;
    this._slotTick++;
  };

  private get pathD(): string {
    return (
      MATERIAL_SHAPE_SVG[this.shape] ??
      MATERIAL_SHAPE_SVG[ShapeChipDefaultShape]
    );
  }

  private onActivate(): void {
    if (this.disabled || !this.toggle) return;
    this.selected = !this.selected;
    emitLifecycle(this, 'select-end', { source: 'user' });
    this.emit('k3-change', { selected: this.selected, value: this.value });
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (!this.toggle || this.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.onActivate();
    }
  };

  private renderShape() {
    void this._slotTick;
    return html`
      <span class="shape" part="shape" aria-hidden="true">
        <svg viewBox="0 0 1 1" width="100%" height="100%" focusable="false">
          <path d=${this.pathD} fill="currentColor" />
        </svg>
        <span class="shape-icon" part="icon">
          <slot name="icon" @slotchange=${this.syncSlots}></slot>
        </span>
      </span>
    `;
  }

  override render() {
    const label = html`<span class="label" part="label"><slot></slot></span>`;

    if (!this.toggle) {
      /* Static legend — no focus, no press */
      return html`
        <div class="pill" part="container">
          ${this.renderShape()}${label}
        </div>
      `;
    }

    return html`
      <button
        type="button"
        class="pill k3-state-layer k3-focus-ring"
        part="container"
        ?disabled=${this.disabled}
        aria-pressed=${String(this.selected)}
        .value=${this.value}
        @keydown=${this.onKeydown}
        @click=${() => this.onActivate()}
        @pointerdown=${() => {
          if (!this.disabled) emitLifecycle(this, 'press-start', { source: 'user' });
        }}
        @pointerup=${() => {
          if (!this.disabled) emitLifecycle(this, 'press-end', { source: 'user' });
        }}
      >
        ${this.renderShape()}${label}
      </button>
    `;
  }
}

export default K3ShapeChip;

if (!customElements.get('k3-shape-chip')) {
  customElements.define('k3-shape-chip', K3ShapeChip);
}
