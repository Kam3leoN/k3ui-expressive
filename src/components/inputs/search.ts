import { html, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  hasNamedSlot,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { searchStyles } from './search.styles.js';

/**
 * Google-style search — pill (shape full) · leading icon · clearable.
 *
 * Optional `trailing` slot (after a divider) for mic / lens / actions.
 * Suggestions panel via `suggestions` slot.
 *
 * @fires k3-input · k3-change · k3-clear
 */
export class K3Search extends K3Element {
  static override styles = [hostReset, searchStyles];

  @property() value = '';
  @property() placeholder = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Show trailing clear when there is a value (default on). */
  @property({ type: Boolean, reflect: true }) clearable = true;

  @state() private open = false;
  @state() private focused = false;
  @state() private hasTrailing = false;

  @query('.control') private controlEl!: HTMLInputElement;

  private get showClear(): boolean {
    return this.clearable && !!this.value && !this.disabled;
  }

  private syncSlots = (): void => {
    this.hasTrailing = hasNamedSlot(this, 'trailing');
  };

  private syncHostState(): void {
    this.toggleAttribute('data-focused', this.focused);
    this.toggleAttribute('data-populated', !!this.value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    queueMicrotask(() => {
      this.syncSlots();
      this.syncHostState();
    });
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.shadowRoot?.querySelector('slot[name="trailing"]')?.addEventListener(
      'slotchange',
      this.syncSlots,
    );
    this.syncHostState();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('value') ||
      changed.has('focused') ||
      changed.has('clearable') ||
      changed.has('disabled')
    ) {
      this.syncHostState();
    }
  }

  /** Focus the inner input. */
  focus(options?: FocusOptions): void {
    this.controlEl?.focus(options);
  }

  private onFocus = (): void => {
    this.focused = true;
  };

  private onBlur = (): void => {
    this.focused = false;
  };

  private onInput = (e: Event): void => {
    const v = (e.target as HTMLInputElement).value;
    this.value = v;
    this.emit('k3-input', { value: v });
    void runOpenClose(this, 'open', async () => {
      this.open = true;
    }, { source: 'user' });
  };

  private onChange = (): void => {
    this.emit('k3-change', { value: this.value });
  };

  private clearValue = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled) return;
    this.value = '';
    this.emit('k3-input', { value: '' });
    this.emit('k3-change', { value: '' });
    this.emit('k3-clear');
    queueMicrotask(() => this.controlEl?.focus());
  };

  override render() {
    const ph = this.placeholder || i18n.t('search.placeholder', 'Search');

    return html`
      <div class="field" part="field">
        <span class="leading" part="leading-icon" aria-hidden="true">
          <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="search"></span>
        </span>

        <input
          class="control"
          part="input"
          type="search"
          .value=${this.value}
          placeholder=${ph}
          ?disabled=${this.disabled}
          autocomplete="off"
          spellcheck="false"
          aria-label=${ph}
          @input=${this.onInput}
          @change=${this.onChange}
          @focus=${this.onFocus}
          @blur=${this.onBlur}
        />

        <button
          type="button"
          class=${classMap({ clear: true, has: this.showClear })}
          part="clear"
          tabindex=${this.showClear ? 0 : -1}
          aria-label=${i18n.t('search.clear', 'Clear search')}
          aria-hidden=${this.showClear ? 'false' : 'true'}
          ?disabled=${this.disabled}
          @mousedown=${(e: Event) => e.preventDefault()}
          @click=${this.clearValue}
        >
          <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="close"></span>
        </button>

        <span class=${classMap({ divider: true, has: this.hasTrailing })} part="divider"></span>
        <span
          class=${classMap({ trailing: true, has: this.hasTrailing })}
          part="trailing"
        >
          <slot name="trailing" @slotchange=${this.syncSlots}></slot>
        </span>
      </div>

      <div class=${classMap({ panel: true, open: this.open })} part="suggestions">
        <slot name="suggestions"></slot>
      </div>
    `;
  }
}

export default K3Search;
