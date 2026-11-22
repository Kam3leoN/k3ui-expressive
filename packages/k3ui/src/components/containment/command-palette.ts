import { html, nothing, unsafeCSS, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  runOpenClose,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  commandPaletteDialogCss,
  commandPaletteStyles,
} from './command-palette.styles.js';
import type { K3Dialog } from './dialog.js';
import type { K3ListItem } from './list-item.js';

export interface CommandPaletteItem {
  /** Stable id / value emitted on select. */
  value: string;
  /** Primary label. */
  label: string;
  /** Secondary line. */
  supporting?: string;
  /** Material Symbols ligature for leading icon. */
  icon?: string;
  /** Shortcut shown with `k3-kbd` (e.g. `Ctrl+K`). */
  shortcut?: string;
  /** Optional group heading. */
  group?: string;
  /** Extra search haystack. */
  keywords?: string;
}

function normText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function stemQuery(q: string): string {
  if (q.length > 3 && (q.endsWith('s') || q.endsWith('x')) && !q.endsWith('ss')) {
    return q.slice(0, -1);
  }
  return q;
}

/**
 * Command palette — search + emphasized list hosted in a `k3-dialog`.
 *
 * Light-DOM children should be `k3-list-item` (optional group labels).
 * Or set `items` and the host rebuilds rows into the dialog body.
 *
 * @fires k3-command-select `{ value, item? }`
 * @fires k3-command-close `{ source }`
 * @fires k3-open-start · k3-open-end · k3-close-start · k3-close-end
 */
export class K3CommandPalette extends K3Element {
  static override styles = [hostReset, commandPaletteStyles];

  @property({ type: Boolean, reflect: true }) open = false;
  @property() placeholder = '';
  /** Optional empty-state copy when the query matches nothing. */
  @property({ attribute: 'empty-text' }) emptyText = '';
  /** When set, replaces light-DOM rows (rebuilt on change). */
  @property({ attribute: false }) items: CommandPaletteItem[] | null = null;

  @state() private query = '';
  @state() private activeIndex = 0;
  @state() private matchCount = 0;

  /**
   * Cached before `k3-dialog` elevates to `document.body` — `@query` would
   * miss nodes that left this shadow root.
   */
  private dialogRef: K3Dialog | null = null;
  private searchInput: HTMLInputElement | null = null;
  private resultsEl: HTMLElement | null = null;

  /** True while `hide()` drives dialog close — skip duplicate close emit. */
  private suppressCloseEmit = false;
  /** Guard against re-entrant show / `open` attribute sync. */
  private opening = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'presentation');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute(
        'aria-label',
        i18n.t('commandPalette.ariaLabel', 'Command palette'),
      );
    }
  }

  override firstUpdated(): void {
    this.cacheDialogParts();
    this.syncDialogWidth();
    this.syncLightChildrenToResults();
    this.applyFilter();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.cacheDialogParts();
    this.syncDialogWidth();
    if (changed.has('items') && this.items) this.rebuildFromItems();
    if (changed.has('open')) {
      const was = changed.get('open');
      /* Attribute-only path — show()/hide() already drive enter/leave. */
      if (this.open && was === false && !this.opening && !this.dialogRef?.open) {
        void this.enterOpen();
      } else if (
        !this.open &&
        was === true &&
        !this.suppressCloseEmit &&
        this.dialogRef?.open
      ) {
        void this.leaveOpen('api');
      }
    }
  }

  /** Snapshot dialog + light mounts before portal elevate. */
  private cacheDialogParts(): void {
    const fromShadow = this.shadowRoot?.querySelector('k3-dialog') as K3Dialog | null;
    if (fromShadow) this.dialogRef = fromShadow;
    const dlg = this.dialogRef;
    if (!dlg) return;
    this.searchInput = dlg.querySelector('.k3-cp__input');
    this.resultsEl = dlg.querySelector('.k3-cp__results');
  }

  /** Open via underlying `k3-dialog` (scrim, focus trap, Escape). */
  async show(): Promise<boolean> {
    this.cacheDialogParts();
    if (this.dialogRef?.open) {
      this.open = true;
      this.searchInput?.focus();
      return true;
    }
    return this.enterOpen();
  }

  /** Close the palette dialog. */
  async hide(source: 'user' | 'api' | 'escape' | 'backdrop' = 'api'): Promise<boolean> {
    if (!this.open && !this.dialogRef?.open) return false;
    return this.leaveOpen(source);
  }

  private syncDialogWidth(): void {
    const dlg = this.dialogRef;
    if (!dlg) return;
    const max =
      getComputedStyle(this).getPropertyValue('--k3-command-palette-max').trim() ||
      '40rem';
    dlg.style.setProperty('--k3-dialog-max-width', max);
  }

  private async enterOpen(): Promise<boolean> {
    if (this.opening) return true;
    this.opening = true;
    try {
      return await runOpenClose(this, 'open', async () => {
        this.open = true;
        this.query = '';
        this.activeIndex = 0;
        await this.updateComplete;
        this.cacheDialogParts();
        if (this.searchInput) this.searchInput.value = '';
        this.syncLightChildrenToResults();
        this.applyFilter();
        const dlg = this.dialogRef;
        if (!dlg) return;
        if (!dlg.open) await dlg.show();
        this.searchInput?.focus();
      });
    } finally {
      this.opening = false;
    }
  }

  private async leaveOpen(
    source: 'user' | 'api' | 'escape' | 'backdrop',
  ): Promise<boolean> {
    this.suppressCloseEmit = true;
    try {
      return await runOpenClose(
        this,
        'close',
        async () => {
          const dlg = this.dialogRef;
          if (dlg?.open) await dlg.hide(source);
          this.open = false;
          this.emit('k3-command-close', { source });
        },
        { source },
      );
    } finally {
      this.suppressCloseEmit = false;
    }
  }

  /** Backdrop / Escape on the dialog — keep host `open` in sync. */
  private onDialogCloseEnd = (e: Event): void => {
    if (this.suppressCloseEmit) return;
    const source =
      ((e as CustomEvent<{ source?: string }>).detail?.source as
        | 'user'
        | 'api'
        | 'escape'
        | 'backdrop'
        | undefined) ?? 'api';
    if (!this.open) return;
    this.suppressCloseEmit = true;
    this.open = false;
    this.emit('k3-command-close', { source });
    queueMicrotask(() => {
      this.suppressCloseEmit = false;
    });
  };

  /** Move host light children into the dialog results mount. */
  private syncLightChildrenToResults(): void {
    const results = this.resultsEl;
    if (!results) return;
    for (const child of [...this.childNodes]) {
      if (child === results) continue;
      results.append(child);
    }
  }

  private itemParent(): HTMLElement {
    return this.resultsEl ?? this;
  }

  private rebuildFromItems(): void {
    const list = this.items ?? [];
    const parent = this.itemParent();
    parent.replaceChildren();
    let lastGroup = '';
    for (const item of list) {
      if (item.group && item.group !== lastGroup) {
        lastGroup = item.group;
        const head = document.createElement('div');
        head.setAttribute('data-command-group', '');
        head.textContent = item.group;
        parent.append(head);
      }
      const row = document.createElement('k3-list-item') as K3ListItem;
      row.setAttribute('interactive', '');
      row.setAttribute('emphasized', '');
      row.setAttribute('lines', item.supporting ? 'two' : 'one');
      row.value = item.value;
      if (item.icon) {
        const icon = document.createElement('span');
        icon.slot = 'leading';
        icon.className = 'ms notranslate';
        icon.setAttribute('translate', 'no');
        icon.setAttribute('lang', 'zxx');
        icon.setAttribute('data-k3-icon', item.icon);
        icon.setAttribute('aria-hidden', 'true');
        row.append(icon);
      }
      const headline = document.createElement('span');
      headline.slot = 'headline';
      headline.textContent = item.label;
      row.append(headline);
      if (item.supporting) {
        const support = document.createElement('span');
        support.slot = 'supporting';
        support.textContent = item.supporting;
        row.append(support);
      }
      if (item.shortcut) {
        const kbd = document.createElement('k3-kbd');
        kbd.slot = 'trailing';
        kbd.setAttribute('keys', item.shortcut);
        kbd.setAttribute('size', 'sm');
        row.append(kbd);
      }
      if (item.keywords) row.dataset.keywords = item.keywords;
      parent.append(row);
    }
    this.applyFilter();
  }

  private visibleItems(): K3ListItem[] {
    const root = this.resultsEl ?? this;
    return [...root.querySelectorAll(':scope > k3-list-item')].filter(
      (el): el is K3ListItem =>
        el instanceof HTMLElement &&
        el.localName === 'k3-list-item' &&
        !el.hasAttribute('hidden'),
    ) as K3ListItem[];
  }

  private applyFilter(): void {
    const root = this.resultsEl ?? this;
    const nq = normText(this.query.trim());
    const stem = stemQuery(nq);

    root.querySelectorAll(':scope > k3-list-item').forEach((node) => {
      const el = node as K3ListItem;
      if (!nq) {
        el.hidden = false;
        return;
      }
      const hay = normText(
        [el.value, el.textContent ?? '', el.dataset.keywords ?? ''].join(' '),
      );
      el.hidden = !(hay.includes(nq) || hay.includes(stem));
    });

    root.querySelectorAll('[data-command-group]').forEach((label) => {
      let next = label.nextElementSibling;
      let any = false;
      while (next && !next.hasAttribute('data-command-group')) {
        if (next.localName === 'k3-list-item' && !next.hasAttribute('hidden')) any = true;
        next = next.nextElementSibling;
      }
      (label as HTMLElement).hidden = !any && !!nq;
    });

    const visible = this.visibleItems();
    this.matchCount = visible.length;
    this.activeIndex = visible.length ? Math.min(this.activeIndex, visible.length - 1) : 0;
    this.syncActive(visible);
  }

  private syncActive(visible = this.visibleItems()): void {
    visible.forEach((el, i) => {
      el.toggleAttribute('selected', i === this.activeIndex);
    });
  }

  private selectIndex(index: number): void {
    const visible = this.visibleItems();
    const item = visible[index];
    if (!item) return;
    const value = item.value || item.getAttribute('value') || '';
    this.emit('k3-command-select', { value, item });
    void this.hide('user');
  }

  private onSearchInput = (e: Event): void => {
    this.query = (e.target as HTMLInputElement).value;
    this.activeIndex = 0;
    this.applyFilter();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const visible = this.visibleItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!visible.length) return;
      this.activeIndex = (this.activeIndex + 1) % visible.length;
      this.syncActive(visible);
      visible[this.activeIndex]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visible.length) return;
      this.activeIndex = (this.activeIndex - 1 + visible.length) % visible.length;
      this.syncActive(visible);
      visible[this.activeIndex]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      this.selectIndex(this.activeIndex);
    }
    /* Escape — handled by k3-dialog / overlayStack */
  };

  private onResultsClick = (e: Event): void => {
    const path = e.composedPath() as EventTarget[];
    const item = path.find(
      (n): n is K3ListItem =>
        n instanceof HTMLElement && n.localName === 'k3-list-item',
    );
    if (!item || item.hasAttribute('hidden')) return;
    const visible = this.visibleItems();
    const idx = visible.indexOf(item);
    if (idx >= 0) this.activeIndex = idx;
    this.selectIndex(this.activeIndex);
  };

  override render() {
    const ph =
      this.placeholder ||
      i18n.t('commandPalette.placeholder', 'Search commands…');
    const empty =
      this.emptyText || i18n.t('commandPalette.empty', 'No matching commands');
    const showEmpty = this.open && !!this.query.trim() && this.matchCount === 0;

    return html`
      <k3-dialog
        variant="basic"
        .closeAction=${false}
        @keydown=${this.onKeyDown}
        @k3-close-end=${this.onDialogCloseEnd}
      >
        <style>
          ${unsafeCSS(commandPaletteDialogCss)}
        </style>
        <div slot="headline" class="k3-cp__search" part="search">
          <span
            class="k3-cp__search-icon ms notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="search"
            aria-hidden="true"
          ></span>
          <input
            class="k3-cp__input"
            part="input"
            type="search"
            .value=${this.query}
            placeholder=${ph}
            autocomplete="off"
            spellcheck="false"
            aria-label=${ph}
            @input=${this.onSearchInput}
          />
          <k3-kbd class="k3-cp__hint" keys="Esc" size="sm"></k3-kbd>
        </div>
        <div
          class="k3-cp__results"
          part="results"
          @click=${this.onResultsClick}
        ></div>
        ${showEmpty
          ? html`<p class="k3-cp__empty" part="empty">${empty}</p>`
          : nothing}
      </k3-dialog>
    `;
  }
}

export default K3CommandPalette;

if (!customElements.get('k3-command-palette')) {
  customElements.define('k3-command-palette', K3CommandPalette);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-command-palette': K3CommandPalette;
  }
}
