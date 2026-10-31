import { html, css, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  runOpenClose,
  afterPaint,
  waitForMotion,
  attachOutsideDismiss,
  type OutsideDismissController,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import K3MenuItem from '../containment/menu-item.js';
import { markMenuItemEdges } from '../containment/menu-edges.js';
import type { TextFieldVariant } from './field-types.js';
import K3TextField from './text-field.js';

if (!customElements.get('k3-menu-item')) {
  customElements.define('k3-menu-item', K3MenuItem);
}
if (!customElements.get('k3-text-field')) {
  customElements.define('k3-text-field', K3TextField);
}

/**
 * M3 exposed dropdown / select — trigger is a real `k3-text-field`
 * (outlined · filled · standard) + floating menu of `k3-menu-item`.
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
      :host([disabled]) {
        pointer-events: none;
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

      .panel {
        position: absolute;
        z-index: 50;
        inset-inline: 0;
        top: calc(100% + 0.25rem); /* 4 */
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.125rem; /* 2 */
        width: 100%;
        min-width: 7rem;
        max-width: min(17.5rem, 100%);
        padding: 0.25rem; /* 4 */
        background: var(--k3-sys-color-surface-container-low);
        color: var(--k3-sys-color-on-surface);
        border-radius: var(--k3-sys-shape-corner-large); /* 16 */
        box-shadow: var(
          --k3-sys-elevation-level2,
          0 1px 2px rgb(0 0 0 / 0.3),
          0 2px 6px 2px rgb(0 0 0 / 0.15)
        );
        opacity: 0;
        pointer-events: none;
        transform: scale(0.96);
        transform-origin: top center;
        transition:
          opacity var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects),
          transform var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-expressive-spatial);
      }
      .panel.open {
        opacity: 1;
        pointer-events: auto;
        transform: none;
      }

      ::slotted(k3-menu-item) {
        display: block;
        width: 100%;
        flex-shrink: 0;
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
  @state() private visible = false;

  @query('.trigger') private triggerEl!: K3TextField;

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

  async show(): Promise<boolean> {
    if (this.disabled || this.visible) return true;
    return runOpenClose(
      this,
      'open',
      async () => {
        this.syncSelection();
        this.visible = true;
        this.open = false;
        await this.updateComplete;
        await afterPaint();
        this.open = true;
        this.triggerEl?.focus();
      },
      { source: 'user' },
    );
  }

  async hide(source: 'user' | 'api' | 'escape' | 'auto' = 'api'): Promise<boolean> {
    if (!this.visible) return true;
    return runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
        this.visible = false;
        await this.updateComplete;
        const panel = this.shadowRoot?.querySelector('.panel') as HTMLElement | null;
        if (panel) await waitForMotion(panel);
      },
      { source },
    );
  }

  private toggle = (e?: Event): void => {
    if (this.disabled) return;
    e?.preventDefault();
    void (this.visible ? this.hide('user') : this.show());
  };

  private onTriggerKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void this.show();
    } else if (e.key === 'Escape' && this.visible) {
      e.preventDefault();
      void this.hide('escape');
    }
  };

  private onItemSelect = (e: Event): void => {
    const ce = e as CustomEvent<{ value?: string }>;
    const next = ce.detail?.value ?? '';
    const prev = this.value;
    this.value = next;
    setFormValue(this.internals, this.value || null);
    this.syncSelection();
    if (next !== prev) this.emit('k3-change', { value: this.value });
    void this.hide('user');
  };

  /** Block text-field typing / clear while still allowing open. */
  private onFieldInput = (e: Event): void => {
    e.stopPropagation();
    e.preventDefault();
    /* Keep displayed selection label */
    if (this.triggerEl) this.triggerEl.value = this.displayLabel;
  };

  private _outsideDismiss: OutsideDismissController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    setFormValue(this.internals, this.value || null);
    this.addEventListener('k3-select', this.onItemSelect as EventListener);
    this._outsideDismiss = attachOutsideDismiss(this, {
      isActive: () => this.visible,
      onDismiss: () => void this.hide('user'),
    });
    queueMicrotask(() => this.syncSelection());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('k3-select', this.onItemSelect as EventListener);
    this._outsideDismiss?.detach();
    this._outsideDismiss = null;
  }

  override firstUpdated(): void {
    this.syncSelection();
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    slot?.addEventListener('slotchange', () => this.syncSelection());
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    /* Always re-sync — option labels may change with locale (data-i18n) */
    this.syncSelection();
    if (changed.has('value')) {
      setFormValue(this.internals, this.value || null);
    }
  }

  override render() {
    const shown = this.displayLabel;
    const ph =
      this.placeholder ||
      (!this.label ? i18n.t('select.placeholder') : '');

    return html`
      <k3-text-field
        class="trigger"
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
        @click=${this.toggle}
        @keydown=${this.onTriggerKeydown}
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
      <div
        class=${classMap({ panel: true, open: this.open })}
        part="menu"
        role="listbox"
        aria-label=${this.label || i18n.t('select.placeholder')}
      >
        <slot></slot>
      </div>
    `;
  }
}

export default K3Select;
