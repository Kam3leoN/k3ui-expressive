import { html, nothing, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  runOpenClose,
  afterPaint,
  waitForMotion,
  attachOutsideDismiss,
  edgeScrollbarStyles,
  type OutsideDismissController,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import type { TextFieldVariant } from './field-types.js';
import K3TextField from './text-field.js';
import {
  AutocompleteSpecs,
  normalizeAutocompleteOptions,
  type AutocompleteFilterMode,
  type AutocompleteOption,
  type AutocompleteOptionInput,
} from './autocomplete.specs.js';
import { autocompleteStyles } from './autocomplete.styles.js';

if (!customElements.get('k3-text-field')) {
  customElements.define('k3-text-field', K3TextField);
}

function parseOptionsAttr(raw: string | null): AutocompleteOptionInput[] | null {
  if (raw == null || raw.trim() === '') return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as AutocompleteOptionInput[];
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * M3 autocomplete — editable combobox with filterable listbox panel.
 *
 * @fires k3-input — `{ value }` on typing
 * @fires k3-query — `{ term }` on focus / input (lazy-load hook)
 * @fires k3-change — `{ value, label }` when selection commits
 * @fires k3-toggle — `{ open }` panel visibility
 */
export class K3Autocomplete extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, edgeScrollbarStyles, autocompleteStyles];

  internals = attachInternals(this);

  @property() label = '';
  @property() name = '';
  @property() value = '';
  @property() placeholder = '';
  @property({ reflect: true }) variant: TextFieldVariant = 'outlined';
  @property({ reflect: true }) filter: AutocompleteFilterMode =
    AutocompleteSpecs.behaviors.filter;
  @property({ type: Boolean, attribute: 'case-sensitive' }) caseSensitive =
    AutocompleteSpecs.behaviors.caseSensitive;
  @property({ type: Boolean, attribute: 'open-on-focus' }) openOnFocus =
    AutocompleteSpecs.behaviors.openOnFocus;
  @property({ type: Boolean, attribute: 'close-on-select' }) closeOnSelect =
    AutocompleteSpecs.behaviors.closeOnSelect;
  @property({ type: Boolean, attribute: 'hide-no-data' }) hideNoData =
    AutocompleteSpecs.behaviors.hideNoData;
  @property({ type: Boolean, attribute: 'hide-loading' }) hideLoading =
    AutocompleteSpecs.behaviors.hideLoading;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean }) required = false;
  @property() error = '';
  @property({ attribute: 'supporting-text' }) supportingText = '';
  @property({ type: Boolean, reflect: true }) open = false;

  @property({
    attribute: 'options',
    converter: {
      fromAttribute: (v: string | null) => parseOptionsAttr(v),
      toAttribute: () => null,
    },
  })
  optionsAttr: AutocompleteOptionInput[] | null = null;

  @property({ attribute: false })
  options: AutocompleteOptionInput[] = [];

  @state() private panelVisible = false;
  @state() private activeIndex = -1;
  @state() private visibleOptions: AutocompleteOption[] = [];
  @state() private statusMessage = '';

  @query('.field') private fieldEl!: K3TextField;
  @query('.panel') private panelEl!: HTMLElement;

  private allOptions: AutocompleteOption[] = [];
  private committed: AutocompleteOption | null = null;
  private listboxId = `k3-ac-list-${Math.random().toString(36).slice(2, 9)}`;
  private suppressOpenOnFocus = false;
  private _outsideDismiss: OutsideDismissController | null = null;

  private get inputEl(): HTMLInputElement | null {
    return this.fieldEl?.shadowRoot?.querySelector('.control') as HTMLInputElement | null;
  }

  private syncAllOptions(): void {
    const fromProp = this.options.length > 0 ? this.options : (this.optionsAttr ?? []);
    this.allOptions = normalizeAutocompleteOptions(fromProp);
  }

  private normalizeTerm(text: string): string {
    return this.caseSensitive ? text : text.toLocaleLowerCase();
  }

  private optionMatches(option: AutocompleteOption, term: string): boolean {
    if (this.filter === 'none') return true;
    if (!term) return true;
    const hay = this.normalizeTerm(option.label);
    const needle = this.normalizeTerm(term);
    switch (this.filter) {
      case 'starts-with':
        return hay.startsWith(needle);
      case 'ends-with':
        return hay.endsWith(needle);
      case 'contains':
      default:
        return hay.includes(needle);
    }
  }

  private rebuildVisible(): void {
    const term = this.value ?? '';
    if (this.loading && !this.hideLoading) {
      this.visibleOptions = [];
      return;
    }
    this.visibleOptions = this.allOptions.filter((o) => this.optionMatches(o, term));
    if (this.activeIndex >= this.visibleOptions.length) {
      this.activeIndex = -1;
    }
  }

  private shouldShowPanel(): boolean {
    if (this.loading && !this.hideLoading) return true;
    if (this.visibleOptions.length > 0) return true;
    if (!this.loading && !this.hideNoData && (this.value?.length ?? 0) >= 0) return true;
    return false;
  }

  private announce(message: string): void {
    this.statusMessage = message;
  }

  private syncInputAria(): void {
    const input = this.inputEl;
    if (!input) return;
    input.setAttribute('role', AutocompleteSpecs.accessibility.comboboxRole);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-expanded', this.open ? 'true' : 'false');
    input.setAttribute('aria-controls', this.listboxId);
    if (this.activeIndex >= 0 && this.visibleOptions[this.activeIndex]) {
      input.setAttribute(
        'aria-activedescendant',
        `${this.listboxId}-opt-${this.activeIndex}`,
      );
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  private dispatchQuery(): void {
    const term = this.value ?? '';
    this.emit('k3-query', { term });
  }

  /** Opens the suggestion panel when allowed. */
  async openPanel(): Promise<void> {
    if (this.disabled || this.panelVisible) return;
    if (!this.shouldShowPanel()) return;
    await runOpenClose(
      this,
      'open',
      async () => {
        this.rebuildVisible();
        if (!this.shouldShowPanel()) return;
        this.panelVisible = true;
        this.open = false;
        await this.updateComplete;
        await afterPaint();
        this.open = true;
        this.emit('k3-toggle', { open: true });
        this.syncInputAria();
      },
      { source: 'api' },
    );
  }

  /** Closes the suggestion panel. */
  async closePanel(): Promise<void> {
    if (!this.panelVisible) return;
    await runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
        this.panelVisible = false;
        this.activeIndex = -1;
        await this.updateComplete;
        if (this.panelEl) await waitForMotion(this.panelEl);
        this.emit('k3-toggle', { open: false });
        this.syncInputAria();
      },
      { source: 'api' },
    );
  }

  /** Replaces option list and refreshes the panel. */
  setOptions(next: AutocompleteOptionInput[]): void {
    this.options = next;
    this.syncAllOptions();
    this.rebuildVisible();
    this.requestUpdate();
    if (this.panelVisible) {
      if (!this.shouldShowPanel()) void this.closePanel();
    }
  }

  /** Clears committed value and input text. */
  clear(restoreFocus = false): void {
    const had = this.committed !== null || !!this.value;
    this.value = '';
    this.committed = null;
    this.rebuildVisible();
    setFormValue(this.internals, null);
    if (had) this.emit('k3-change', { value: null, label: null });
    if (restoreFocus) {
      this.fieldEl?.focus();
    } else {
      void this.closePanel();
    }
  }

  private focusInputQuiet(): void {
    this.suppressOpenOnFocus = true;
    try {
      this.fieldEl?.focus({ preventScroll: true });
    } finally {
      queueMicrotask(() => {
        this.suppressOpenOnFocus = false;
      });
    }
  }

  private commitOption(option: AutocompleteOption): void {
    if (option.disabled) return;
    this.committed = { ...option };
    this.value = option.label;
    setFormValue(this.internals, option.value);
    this.rebuildVisible();
    this.emit('k3-change', { value: option.value, label: option.label });
    if (this.closeOnSelect) {
      void this.closePanel().then(() => this.focusInputQuiet());
    }
  }

  private moveActive(delta: number): void {
    const enabled = this.visibleOptions
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled);
    if (enabled.length === 0) return;
    let pos = enabled.findIndex(({ i }) => i === this.activeIndex);
    if (pos < 0) pos = delta > 0 ? -1 : 0;
    pos = (pos + delta + enabled.length) % enabled.length;
    this.activeIndex = enabled[pos].i;
    this.syncInputAria();
    this.requestUpdate();
  }

  private onFieldFocus = (): void => {
    if (this.suppressOpenOnFocus) return;
    this.dispatchQuery();
    if (this.openOnFocus) void this.openPanel();
  };

  private onFieldInput = (e: CustomEvent<{ value: string }>): void => {
    this.value = e.detail.value;
    this.emit('k3-input', { value: this.value });
    this.dispatchQuery();
    this.rebuildVisible();
    if (this.visibleOptions.length > 0) {
      this.announce(
        i18n.t('autocomplete.results', '{count} results').replace(
          '{count}',
          String(this.visibleOptions.length),
        ),
      );
    }
    if (!this.panelVisible) void this.openPanel();
    else if (!this.shouldShowPanel()) void this.closePanel();
    else this.requestUpdate();
  };

  private onFieldKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (this.panelVisible) {
        e.preventDefault();
        void this.closePanel().then(() => this.focusInputQuiet());
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.panelVisible) void this.openPanel();
      else this.moveActive(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.panelVisible) void this.openPanel();
      else this.moveActive(-1);
      return;
    }
    if (e.key === 'Enter' && this.panelVisible && this.activeIndex >= 0) {
      const opt = this.visibleOptions[this.activeIndex];
      if (opt && !opt.disabled) {
        e.preventDefault();
        this.commitOption(opt);
      }
    }
  };

  private onOptionClick = (index: number): void => {
    const opt = this.visibleOptions[index];
    if (opt) this.commitOption(opt);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncAllOptions();
    setFormValue(this.internals, (this.committed?.value ?? this.value) || null);
    this._outsideDismiss = attachOutsideDismiss(this, {
      isActive: () => this.panelVisible,
      onDismiss: () => void this.closePanel(),
    });
  }

  override disconnectedCallback(): void {
    this._outsideDismiss?.detach();
    this._outsideDismiss = null;
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncInputAria();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('options') || changed.has('optionsAttr')) {
      this.syncAllOptions();
      this.rebuildVisible();
    }
    if (changed.has('value') || changed.has('filter') || changed.has('caseSensitive')) {
      this.rebuildVisible();
    }
    if (changed.has('open') || changed.has('activeIndex')) {
      this.syncInputAria();
    }
    if (changed.has('value') && this.committed && this.value !== this.committed.label) {
      this.committed = null;
    }
  }

  override render() {
    const loadingRow =
      this.loading && !this.hideLoading
        ? html`<button type="button" class="option meta" disabled role="option">
            ${i18n.t('autocomplete.loading', 'Loading…')}
          </button>`
        : nothing;

    const emptyRow =
      !this.loading &&
      this.visibleOptions.length === 0 &&
      !this.hideNoData
        ? html`<button type="button" class="option meta" disabled role="option">
            ${i18n.t('autocomplete.noData', 'No results')}
          </button>`
        : nothing;

    const optionRows = this.visibleOptions.map(
      (opt, index) => html`
        <button
          type="button"
          id=${`${this.listboxId}-opt-${index}`}
          class=${classMap({
            option: true,
            active: index === this.activeIndex,
          })}
          role="option"
          aria-selected=${index === this.activeIndex ? 'true' : 'false'}
          ?disabled=${!!opt.disabled}
          @click=${() => this.onOptionClick(index)}
        >
          ${opt.label}
        </button>
      `,
    );

    return html`
      <k3-text-field
        class="field"
        part="field"
        .label=${this.label}
        .name=${this.name}
        .value=${this.value}
        .placeholder=${this.placeholder}
        .variant=${this.variant}
        .error=${this.error}
        .supportingText=${this.supportingText}
        .disabled=${this.disabled}
        .required=${this.required}
        autocomplete="off"
        @k3-input=${this.onFieldInput}
        @focus=${this.onFieldFocus}
        @keydown=${this.onFieldKeydown}
      >
        <slot name="leading-icon" slot="leading-icon"></slot>
        <slot name="trailing-icon" slot="trailing-icon"></slot>
      </k3-text-field>

      <div
        class=${classMap({ panel: true, open: this.open, 'k3-scroll': true })}
        part="menu"
        id=${this.listboxId}
        role="listbox"
        aria-label=${ifDefined(this.label || undefined)}
      >
        ${loadingRow} ${emptyRow} ${optionRows}
      </div>

      <div class="status" role="status" aria-live="polite" aria-atomic="true">
        ${this.statusMessage}
      </div>
    `;
  }
}

export default K3Autocomplete;

if (!customElements.get('k3-autocomplete')) {
  customElements.define('k3-autocomplete', K3Autocomplete);
}
