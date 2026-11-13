import { html, css, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { K3Element, attachInternals, setFormValue } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import K3Menu from '../containment/menu.js';
import K3MenuItem from '../containment/menu-item.js';
import { markMenuItemEdges } from '../containment/menu-edges.js';
import type { TextFieldVariant } from './field-types.js';
import K3TextField from './text-field.js';

if (!customElements.get('k3-menu')) {
  customElements.define('k3-menu', K3Menu);
}
if (!customElements.get('k3-menu-item')) {
  customElements.define('k3-menu-item', K3MenuItem);
}
if (!customElements.get('k3-text-field')) {
  customElements.define('k3-text-field', K3TextField);
}

/**
 * M3 exposed dropdown / select — trigger is a real `k3-text-field`
 * (outlined · filled · standard) + `k3-menu` of `k3-menu-item`.
 *
 * Opens like Noph Select: menu **match-width** flush with the field,
 * elastic FastSpatial **scaleY** enter from the menu recipe.
 *
 * @see https://m3.material.io/components/menus/guidelines#exposed-dropdown-menu
 *
 * @example
 * ```html
 * <k3-select label="Label" value="2" variant="outlined">
 *   <k3-menu-item value="1">Item 1</k3-menu-item>
 *   <k3-menu-item value="2">Item 2</k3-menu-item>
 * </k3-select>
 * ```
 */
export class K3Select extends K3Element {
  static formAssociated = true;
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        max-width: 22rem;
        overflow: visible;
      }
      /* Stacked fields: open select (and its absolute fallback panel) on top */
      :host([open]) {
        z-index: 1000;
      }
      :host([disabled]) {
        pointer-events: none;
      }

      .dropdown {
        display: block;
        width: 100%;
        max-width: none;
      }

      .trigger {
        display: block;
        width: 100%;
        max-width: none;
        cursor: pointer;
      }
      /* Readonly field still looks interactive */
      .trigger::part(input) {
        cursor: pointer;
        caret-color: transparent;
      }

      .chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
        font-size: 1.5rem;
        line-height: 1;
        width: 1.5rem;
        height: 1.5rem;
        color: var(--k3-sys-color-on-surface-variant);
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        transition: transform var(--k3-sys-motion-duration-spatial-fast)
          var(--k3-sys-motion-easing-expressive-spatial);
        speak: never;
        user-select: none;
      }
      :host([open]) .chevron {
        transform: rotate(180deg);
      }
    `,
  ];

  internals = attachInternals(this);

  @property() label = '';
  @property() name = '';
  @property() value = '';
  @property() placeholder = '';
  @property({ reflect: true }) variant: TextFieldVariant = 'outlined';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) required = false;
  @property() error = '';
  @property({ attribute: 'supporting-text' }) supportingText = '';
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private displayLabel = '';

  @query('.dropdown') private menuEl!: K3Menu;
  @query('.trigger') private triggerEl!: K3TextField;

  /** True while open is mirrored from menu lifecycle (skip host→menu echo). */
  private _mirroringOpen = false;

  private optionItems(): K3MenuItem[] {
    return [...this.querySelectorAll<K3MenuItem>(':scope > k3-menu-item')].filter((i) => {
      if (typeof i.isGapSep === 'boolean' && (i.isGapSep || i.isDividerLine)) return false;
      if (i.hasAttribute('divider') || i.hasAttribute('gap')) return false;
      return true;
    });
  }

  private itemLabel(item: HTMLElement): string {
    const parts: string[] = [];
    for (const n of item.childNodes) {
      // Comments carry Lit part markers (<!--?lit$…$-->) when options are templated
      if (n.nodeType === Node.COMMENT_NODE) continue;
      if (n instanceof HTMLElement && n.hasAttribute('slot')) continue;
      parts.push(n.textContent ?? '');
    }
    return parts.join('').replace(/\s+/g, ' ').trim() || item.getAttribute('value') || '';
  }

  /** Sync checkable + selected flags and trigger text from `value`. */
  syncSelection(): void {
    let label = '';
    for (const item of this.optionItems()) {
      item.checkable = true;
      const on = !!this.value && item.value === this.value;
      item.selected = on;
      if (on) label = this.itemLabel(item);
    }
    this.displayLabel = label;
    markMenuItemEdges(this);
  }

  /**
   * Chevron follows `:host([open])` — set the reflected attribute in the same
   * turn as open-start / close-start so rotation does not wait for menu motion.
   */
  private syncOpenUI(next: boolean): void {
    this._mirroringOpen = true;
    if (this.open !== next) this.open = next;
    this.toggleAttribute('open', next);
    /* Hold through Lit update so updated() does not echo show()/hide(). */
    void this.updateComplete.then(() => {
      this._mirroringOpen = false;
    });
  }

  async show(): Promise<boolean> {
    if (this.disabled) return false;
    this.syncSelection();
    const menu = this.menuEl;
    if (!menu) return false;
    menu.armDismissGuard();
    this.syncOpenUI(true);
    /* Focus stays on the field (Noph combobox model) while the menu opens. */
    const ok = await menu.show('none');
    this.syncOpenUI(menu.open);
    this.triggerEl?.focus();
    return ok;
  }

  async hide(source: 'user' | 'api' | 'escape' | 'auto' = 'api'): Promise<boolean> {
    const menu = this.menuEl;
    if (!menu) return true;
    this.syncOpenUI(false);
    const ok = await menu.hide(source);
    this.syncOpenUI(menu.open);
    return ok;
  }

  private onItemSelect = (e: Event): void => {
    const ce = e as CustomEvent<{ value?: string }>;
    const next = ce.detail?.value ?? '';
    const prev = this.value;
    this.value = next;
    setFormValue(this.internals, this.value || null);
    this.syncSelection();
    if (next !== prev) this.emit('k3-change', { value: this.value });
    /* Menu close-on-select already hides — flip chevron immediately */
    this.syncOpenUI(false);
  };

  /** Block text-field typing / clear while still allowing open. */
  private onFieldInput = (e: Event): void => {
    e.stopPropagation();
    e.preventDefault();
    if (this.triggerEl) this.triggerEl.value = this.displayLabel;
  };

  private onMenuOpenEnd = (): void => {
    this.syncOpenUI(true);
    this.syncSelection();
  };

  private onMenuCloseStart = (): void => {
    this.syncOpenUI(false);
  };

  private onMenuCloseEnd = (): void => {
    this.syncOpenUI(false);
  };

  /** Cancel menu open when disabled; sync chevron + selection before enter. */
  private onMenuOpenStart = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    this.syncOpenUI(true);
    this.syncSelection();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    setFormValue(this.internals, this.value || null);
    this.addEventListener('k3-select', this.onItemSelect as EventListener);
    queueMicrotask(() => this.syncSelection());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('k3-select', this.onItemSelect as EventListener);
    this.unbindMenuLifecycle();
  }

  private bindMenuLifecycle(): void {
    const menu = this.menuEl;
    if (!menu) return;
    menu.addEventListener('k3-open-start', this.onMenuOpenStart);
    menu.addEventListener('k3-open-end', this.onMenuOpenEnd);
    menu.addEventListener('k3-close-start', this.onMenuCloseStart);
    menu.addEventListener('k3-close-end', this.onMenuCloseEnd);
  }

  private unbindMenuLifecycle(): void {
    const menu = this.menuEl;
    if (!menu) return;
    menu.removeEventListener('k3-open-start', this.onMenuOpenStart);
    menu.removeEventListener('k3-open-end', this.onMenuOpenEnd);
    menu.removeEventListener('k3-close-start', this.onMenuCloseStart);
    menu.removeEventListener('k3-close-end', this.onMenuCloseEnd);
  }

  private syncMenuA11y(): void {
    const panel = this.menuEl?.shadowRoot?.querySelector<HTMLElement>('[part="menu"]');
    if (!panel) return;
    const name = this.label || i18n.t('select.placeholder');
    panel.setAttribute('aria-label', name);
  }

  override firstUpdated(): void {
    this.syncSelection();
    this.bindMenuLifecycle();
    this.syncMenuA11y();
    const slot = this.shadowRoot?.querySelector(
      '.dropdown > slot:not([name]), k3-menu > slot:not([name])',
    ) as HTMLSlotElement | null;
    /* Nested select→menu slot lives in select's shadow as child of k3-menu */
    const menuSlot = this.shadowRoot?.querySelector('k3-menu > slot:not([name])') as
      | HTMLSlotElement
      | null;
    menuSlot?.addEventListener('slotchange', () => this.syncSelection());
    slot?.addEventListener('slotchange', () => this.syncSelection());
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    /* Always re-sync — option labels may change with locale (data-i18n) */
    this.syncSelection();
    this.syncMenuA11y();
    if (changed.has('value')) {
      setFormValue(this.internals, this.value || null);
    }
    if (changed.has('value') || changed.has('required')) this.syncValidity();
    if (
      changed.has('open') &&
      !this._mirroringOpen &&
      this.menuEl &&
      this.open !== this.menuEl.open
    ) {
      /* Host API `el.open = …` — defer past this update. */
      queueMicrotask(() => void (this.open ? this.show() : this.hide('api')));
    }
  }

  /** `required` with no value → `valueMissing` (blocks native submit, `:invalid`). */
  private syncValidity(): void {
    if (typeof this.internals.setValidity !== 'function') return;
    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        i18n.t('select.required', 'Please select an item in the list.'),
        this.triggerEl ?? undefined,
      );
    } else {
      this.internals.setValidity({});
    }
  }

  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** `<form>.reset()` — back to the `value` attribute. */
  formResetCallback(): void {
    this.value = this.getAttribute('value') ?? '';
  }

  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override render() {
    const shown = this.displayLabel;
    const ph =
      this.placeholder ||
      (!this.label ? i18n.t('select.placeholder') : '');

    return html`
      <k3-menu
        class="dropdown"
        part="menu-host"
        match-width
        panel-role="listbox"
        position="bottom-start"
        close-on-select
      >
        <k3-text-field
          class="trigger"
          slot="trigger"
          part="container"
          no-form
          readonly
          .label=${this.label}
          .value=${shown}
          .placeholder=${ph}
          .variant=${this.variant}
          .error=${this.error}
          .supportingText=${this.supportingText}
          .disabled=${this.disabled}
          .required=${this.required}
          .passwordToggle=${false}
          aria-haspopup="listbox"
          aria-expanded=${this.open ? 'true' : 'false'}
          @k3-input=${this.onFieldInput}
          @k3-change=${this.onFieldInput}
        >
          <span
            class="chevron notranslate"
            slot="trailing-icon"
            translate="no"
            lang="zxx"
            data-k3-icon="arrow_drop_down"
            aria-hidden="true"
            part="trailing-icon"
          ></span>
        </k3-text-field>
        <slot></slot>
      </k3-menu>
    `;
  }
}

export default K3Select;

if (!customElements.get('k3-select')) {
  customElements.define('k3-select', K3Select);
}
