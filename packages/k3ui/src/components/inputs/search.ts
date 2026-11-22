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
  @state() private hasSuggestions = false;

  @query('.control') private controlEl!: HTMLInputElement;

  private blurCloseTimer = 0;

  private get showClear(): boolean {
    return this.clearable && !!this.value && !this.disabled;
  }

  private syncSlots = (): void => {
    this.hasTrailing = hasNamedSlot(this, 'trailing');
    this.hasSuggestions = hasNamedSlot(this, 'suggestions');
    if (!this.hasSuggestions && this.open) this.closeSuggestions();
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
    this.shadowRoot
      ?.querySelector('slot[name="suggestions"]')
      ?.addEventListener('slotchange', this.syncSlots);
    /* Non-passive — must preventDefault so shell-scroll does not steal the wheel. */
    this.shadowRoot?.querySelector('.panel')?.addEventListener(
      'wheel',
      this.onSuggestionsWheel as EventListener,
      { passive: false },
    );
    this.syncHostState();
  }

  override disconnectedCallback(): void {
    window.clearTimeout(this.blurCloseTimer);
    super.disconnectedCallback();
  }

  /** Open the suggestions panel (no-op if the slot is empty). */
  openSuggestions(): void {
    this.syncSlots();
    if (!this.hasSuggestions || this.disabled) return;
    void runOpenClose(this, 'open', async () => {
      this.open = true;
    }, { source: 'api' });
  }

  /** Close the suggestions panel. */
  closeSuggestions(): void {
    if (!this.open) return;
    void runOpenClose(this, 'close', async () => {
      this.open = false;
    }, { source: 'api' });
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
    window.clearTimeout(this.blurCloseTimer);
    this.focused = true;
    if (this.hasSuggestions && this.value.trim()) this.openSuggestions();
  };

  private onBlur = (): void => {
    this.focused = false;
    /* Delay so a click inside suggestions can fire first. */
    window.clearTimeout(this.blurCloseTimer);
    this.blurCloseTimer = window.setTimeout(() => this.closeSuggestions(), 150);
  };

  private onInput = (e: Event): void => {
    const v = (e.target as HTMLInputElement).value;
    this.value = v;
    this.emit('k3-input', { value: v });
    this.syncSlots();
    if (this.hasSuggestions && v.trim()) this.openSuggestions();
    else this.closeSuggestions();
  };

  private onChange = (): void => {
    this.emit('k3-change', { value: this.value });
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (this.open) {
        e.preventDefault();
        this.closeSuggestions();
      }
      return;
    }
    if (e.key === 'ArrowDown' && this.hasSuggestions) {
      this.openSuggestions();
    }
  };

  private clearValue = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled) return;
    this.value = '';
    this.emit('k3-input', { value: '' });
    this.emit('k3-change', { value: '' });
    this.emit('k3-clear');
    this.closeSuggestions();
    queueMicrotask(() => this.controlEl?.focus());
  };

  /** Keep focus in the field when clicking a suggestion row. */
  private onSuggestionsMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
  };

  /**
   * Wheel over slotted list items must scroll the suggestions host — not
   * `.shell-scroll` behind the overlay (shadow scrollports + slots are flaky).
   */
  private onSuggestionsWheel = (e: WheelEvent): void => {
    const path = e.composedPath();
    const scrollHost = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement &&
        (n.slot === 'suggestions' || n.id === 'doc-search-suggestions'),
    );
    const el =
      scrollHost ??
      (
        this.shadowRoot?.querySelector('.panel > slot') as HTMLSlotElement | null
      )?.assignedElements()[0];
    if (!(el instanceof HTMLElement)) return;
    const { scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const delta =
      e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * clientHeight : e.deltaY;
    el.scrollTop += delta;
    e.preventDefault();
    e.stopPropagation();
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
          @keydown=${this.onKeyDown}
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

      <div
        class=${classMap({
          panel: true,
          open: this.open && this.hasSuggestions,
          empty: !this.hasSuggestions,
        })}
        part="suggestions"
        @mousedown=${this.onSuggestionsMouseDown}
      >
        <slot name="suggestions" @slotchange=${this.syncSlots}></slot>
      </div>
    `;
  }
}

export default K3Search;

if (!customElements.get('k3-search')) {
  customElements.define('k3-search', K3Search);
}
