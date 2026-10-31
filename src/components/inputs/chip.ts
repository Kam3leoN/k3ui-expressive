import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  stateLayerStyles,
  emitLifecycle,
  hasNamedSlot,
  haptic,
} from '../../core/index.js';
import { hostReset, dropSlotStyles } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { chipStyles } from './chip.styles.js';

/** Table tones + forced semantic tones. */
export type ChipStatus =
  | 'available'
  | 'unavailable'
  | 'success'
  | 'error'
  | 'info'
  | 'note'
  | 'warning'
  | '';

/** M3 chip type. */
export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion' | '';

const CHIP_STATUS_TONES = new Set<string>([
  'available',
  'unavailable',
  'success',
  'error',
  'info',
  'note',
  'warning',
]);

/**
 * M3 / M3E Chip — assist · filter · input · suggestion · status.
 *
 * Container is a `div` (not `<button>`) so remove / trailing stay valid nested controls.
 *
 * @see https://m3.material.io/components/chips/overview
 */
export class K3Chip extends K3Element {
  static override styles = [hostReset, stateLayerStyles, dropSlotStyles, chipStyles];

  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) removable = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true, attribute: 'disabled-interactive' })
  disabledInteractive = false;
  @property({ type: Boolean, reflect: true }) elevated = false;
  @property({ type: Boolean, reflect: true }) dragged = false;
  /** Leading ⋮⋮ grip — set by `k3-chip-set sortable` or manually. */
  @property({ type: Boolean, reflect: true, attribute: 'drag-handle' })
  dragHandle = false;
  @property() value = '';
  @property({ reflect: true }) variant: ChipVariant = '';
  @property({ reflect: true }) status: ChipStatus = '';

  @property({ type: Boolean, reflect: true, attribute: 'has-icon' })
  hasIcon = false;
  @property({ type: Boolean, reflect: true, attribute: 'has-avatar' })
  hasAvatar = false;
  @property({ type: Boolean, reflect: true, attribute: 'has-trailing' })
  hasTrailing = false;

  @state() private _iconTick = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.syncSlots();
  }

  private syncSlots = () => {
    const avatar = hasNamedSlot(this, 'avatar');
    const leading = hasNamedSlot(this, 'icon');
    const trailing = hasNamedSlot(this, 'trailing');
    const showCheck = this.showFilterCheck;
    const nextIcon = !avatar && (leading || showCheck || this.dragHandle);
    if (nextIcon !== this.hasIcon) this.hasIcon = nextIcon;
    if (avatar !== this.hasAvatar) this.hasAvatar = avatar;
    if (trailing !== this.hasTrailing) this.hasTrailing = trailing;
    this._iconTick++;
  };

  private get isStatus(): boolean {
    return CHIP_STATUS_TONES.has(this.status);
  }

  private get isFilter(): boolean {
    return this.variant === 'filter';
  }

  private get showRemove(): boolean {
    if (this.isStatus) return false;
    return this.removable || this.variant === 'input';
  }

  private get showFilterCheck(): boolean {
    if (this.isStatus || !this.isFilter) return false;
    if (this.dragHandle) return false;
    if (hasNamedSlot(this, 'avatar') || hasNamedSlot(this, 'icon')) return false;
    return this.selected;
  }

  private get isDisabled(): boolean {
    return this.disabled && !this.disabledInteractive;
  }

  private get labelText(): string {
    return (this.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  private get removeLabel(): string {
    const label = this.labelText;
    return label
      ? i18n.t('chip.removeNamed', 'Remove {label}').replace('{label}', label)
      : i18n.t('chip.remove', 'Remove');
  }

  private get trailingLabel(): string {
    const label = this.labelText;
    return label
      ? i18n.t('chip.trailingNamed', '{label} options').replace('{label}', label)
      : i18n.t('chip.trailing', 'Options');
  }

  /** checkbox · radio (exclusive set) · button */
  private get a11yRole(): 'checkbox' | 'radio' | 'button' {
    if (!this.isFilter) return 'button';
    const set = this.closest('k3-chip-set');
    if (set?.getAttribute('selection') === 'single') return 'radio';
    return 'checkbox';
  }

  private onActivate() {
    if (this.isDisabled || this.isStatus) return;
    if (this.disabled && this.disabledInteractive) return;
    if (this.isFilter) {
      this.selected = !this.selected;
      this.syncSlots();
      haptic.selection();
      this.emit('k3-change', { selected: this.selected, value: this.value || this.labelText });
      return;
    }
    haptic.light();
    this.emit('k3-change', { selected: this.selected, value: this.value || this.labelText });
  }

  private onRemove = (e: Event) => {
    e.stopPropagation();
    if (this.isDisabled || (this.disabled && this.disabledInteractive)) return;
    haptic.light();
    this.emit('k3-remove', { value: this.value || this.labelText });
  };

  private onTrailing = (e: Event) => {
    e.stopPropagation();
    if (this.isDisabled || (this.disabled && this.disabledInteractive)) return;
    this.emit('k3-trailing-click', { value: this.value || this.labelText });
  };

  private onChipKeydown = (e: KeyboardEvent) => {
    if (this.isStatus || this.isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.onActivate();
      return;
    }
    if (this.showRemove && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      this.emit('k3-remove', { value: this.value || this.labelText });
    }
  };

  override updated(changed: Map<string, unknown>) {
    if (
      changed.has('selected') ||
      changed.has('variant') ||
      changed.has('status') ||
      changed.has('dragHandle')
    ) {
      this.syncSlots();
    }
  }

  private renderBody() {
    const check = this.showFilterCheck;
    const showAvatar = this.hasAvatar;
    const showLeading = !showAvatar && (check || hasNamedSlot(this, 'icon'));
    const showTrailing = this.hasTrailing;
    const trailingAsButton = showTrailing && this.isFilter;

    return html`
      ${showAvatar
        ? html`<span class="avatar" part="avatar">
            <slot name="avatar" @slotchange=${this.syncSlots}></slot>
          </span>`
        : html`<slot name="avatar" hidden @slotchange=${this.syncSlots}></slot>`}
      ${this.dragHandle
        ? html`<span
            class="icon leading drag-handle ms notranslate"
            part="drag-handle"
            aria-hidden="true"
            translate="no"
            lang="zxx"
            data-k3-icon="drag_indicator"
          ></span>`
        : nothing}
      ${showLeading
        ? html`<span class="icon leading" part="leading-icon">
            ${check
            ? html`<span class="ms check notranslate" aria-hidden="true">check</span>`
            : html`<slot name="icon" @slotchange=${this.syncSlots}></slot>`}
          </span>`
        : html`<slot name="icon" hidden @slotchange=${this.syncSlots}></slot>`}
      <span class="label" part="label"><slot></slot></span>
      ${trailingAsButton
        ? html`<button
            type="button"
            class="trailing-btn"
            part="trailing"
            tabindex="-1"
            aria-label=${this.trailingLabel}
            aria-haspopup="menu"
            ?disabled=${this.isDisabled}
            @click=${this.onTrailing}
          >
            <slot name="trailing" @slotchange=${this.syncSlots}></slot>
          </button>`
        : showTrailing
          ? html`<span class="icon trailing" part="trailing-icon">
              <slot name="trailing" @slotchange=${this.syncSlots}></slot>
            </span>`
          : html`<slot name="trailing" hidden @slotchange=${this.syncSlots}></slot>`}
      ${this.showRemove
        ? html`<button
            type="button"
            class="remove"
            part="remove"
            tabindex="-1"
            aria-label=${this.removeLabel}
            ?disabled=${this.isDisabled}
            @click=${this.onRemove}
          >
            <span class="ms notranslate" aria-hidden="true">close</span>
          </button>`
        : nothing}
    `;
  }

  override render() {
    void this._iconTick;
    if (this.isStatus) {
      return html`<span class="chip" part="container" role="status">${this.renderBody()}</span>`;
    }

    const role = this.a11yRole;
    const tabIndex = this.disabled && !this.disabledInteractive ? -1 : 0;

    return html`<div
      class="chip k3-state-layer"
      part="container"
      role=${role}
      tabindex=${tabIndex}
      aria-disabled=${this.disabled ? 'true' : nothing}
      aria-checked=${role === 'checkbox' || role === 'radio' ? String(this.selected) : nothing}
      aria-pressed=${role === 'button' && this.selected ? 'true' : nothing}
      @keydown=${this.onChipKeydown}
      @pointerdown=${() => {
        if (!this.isDisabled) emitLifecycle(this, 'press-start', { source: 'user' });
      }}
      @pointerup=${() => {
        if (!this.isDisabled) emitLifecycle(this, 'press-end', { source: 'user' });
      }}
      @click=${(e: Event) => {
        const t = e.target as HTMLElement;
        if (t.closest('.remove, .trailing-btn')) return;
        this.onActivate();
      }}
    >
      ${this.renderBody()}
    </div>`;
  }
}

export default K3Chip;

if (!customElements.get('k3-chip')) {
  customElements.define('k3-chip', K3Chip);
}
