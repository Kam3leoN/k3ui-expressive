import { html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import {
  K3Element,
  handleFocusNavKey,
  runWhenConnected,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { attachSortable, type SortableController } from '../../core/dnd.js';
import { hostReset } from '../_shared.js';
import type { K3ListItem } from './list-item.js';
import K3Menu from './menu.js';
import K3MenuItem from './menu-item.js';
import { listStyles } from './list.styles.js';

/** M3E segmented inter-item gap (logical dp) — snapped to device pixels. */
const SEGMENTED_GAP_DP = 2;

if (!customElements.get('k3-menu')) customElements.define('k3-menu', K3Menu);
if (!customElements.get('k3-menu-item')) customElements.define('k3-menu-item', K3MenuItem);

export type ListVariant = 'standard' | 'segmented';
export type ListSelection = 'none' | 'single' | 'multiple' | 'switch';

/**
 * M3 / M3 Expressive List — groups `k3-list-item`.
 *
 * Variants: `standard` · `segmented` (default, M3E gaps + shape morph).
 * Selection: `none` · `single` (radio) · `multiple` (checkbox) · `switch`.
 * `hide-selection-indicator` keeps selected surface without control chrome.
 * Expand (Google M3E): `k3-list-item expandable` — standard = continuous,
 * segmented = 2 dp gaps. `accordion` = exclusive (one row open). Nested
 * `k3-list` in expand slot = folder. `embedded` = nested radii.
 * DnD / dismiss: `sortable` · `dismissible` + a11y actions menu.
 *
 * @see https://m3.material.io/components/lists/overview
 * @see https://m3.material.io/components/lists/specs
 * @see https://m3.material.io/components/lists/guidelines
 */
export class K3List extends K3Element {
  static override styles = [hostReset, listStyles];

  /** Visual style — segmented is M3 Expressive default. */
  @property({ reflect: true }) variant: ListVariant = 'segmented';
  /** Selection mode for child items. */
  @property({ reflect: true }) selection: ListSelection = 'none';
  /** Hide auto radio/checkbox; keep selected container treatment. */
  @property({ type: Boolean, reflect: true, attribute: 'hide-selection-indicator' })
  hideSelectionIndicator = false;
  /** Exclusive expand among expandable children (one open at a time). */
  @property({ type: Boolean, reflect: true }) accordion = false;
  /**
   * Nested under an expandable header — all corners inner (4);
   * last / only child bottom uses `--k3-list-item-radius-end` (outer).
   */
  @property({ type: Boolean, reflect: true }) embedded = false;
  @property({ type: Boolean, reflect: true }) elevated = false;
  @property({ type: Boolean, reflect: true }) sortable = false;
  @property({ type: Boolean, reflect: true }) dismissible = false;
  @property() label = '';

  @state() private menuItem: K3ListItem | null = null;
  @query('#list-actions-menu') private actionsMenu!: K3Menu | null;

  private sortableCtrl: SortableController | null = null;
  private sortingActive = false;
  private unwatchDpr: (() => void) | null = null;

  private items(): K3ListItem[] {
    return [...this.querySelectorAll(':scope > k3-list-item')].filter(
      (el): el is K3ListItem =>
        el instanceof HTMLElement &&
        el.localName === 'k3-list-item' &&
        !el.hasAttribute('hidden'),
    ) as K3ListItem[];
  }

  /** Snap 2dp gap to integer device pixels (fixes uneven gaps @125% DPI). */
  private applySegmentGapToken(): void {
    const segmented = this.variant === 'segmented' || !this.variant;
    if (!segmented) {
      this.style.removeProperty('--k3-segmented-list-segment-gap');
      return;
    }
    const gap = devicePixelSnapCss(SEGMENTED_GAP_DP);
    this.style.setProperty('--k3-segmented-list-segment-gap', gap);
  }

  private syncChildren(): void {
    const list = this.items();
    const n = list.length;
    const segmented = this.variant === 'segmented' || !this.variant;
    this.applySegmentGapToken();

    list.forEach((item, i) => {
      /* Segment position for shape morph */
      if (segmented) {
        let pos: string;
        if (this.embedded) {
          if (n === 1) pos = 'embedded-only';
          else if (i === 0) pos = 'embedded-first';
          else if (i === n - 1) pos = 'embedded-last';
          else pos = 'embedded-middle';
        } else if (n === 1) pos = 'only';
        else if (i === 0) pos = 'first';
        else if (i === n - 1) pos = 'last';
        else pos = 'middle';
        item.setAttribute('data-seg', pos);

        /*
         * 2dp (DPR-snapped) margin-bottom on every item except last —
         * first / middle / before-last all get the same physical gap.
         */
        const gapCss = devicePixelSnapCss(SEGMENTED_GAP_DP);
        item.segGap = i < n - 1;
        if (i < n - 1) {
          item.style.setProperty('margin-bottom', gapCss, 'important');
        } else {
          item.style.removeProperty('margin-bottom');
        }
        item.style.removeProperty('padding-bottom');

        /*
         * Closed item next to an open expandable — outer edge toward the gap.
         * Prefer reflected attr over Lit `.expanded` so first sync (and
         * microtask after toggle) stays correct even if a sibling isn't
         * fully upgraded yet.
         */
        const isOpen = (el: K3ListItem | undefined): boolean =>
          !!el && (el.expanded || el.hasAttribute('expanded'));
        const prevOpen = i > 0 && isOpen(list[i - 1]);
        const nextOpen = i < n - 1 && isOpen(list[i + 1]);
        const selfOpen = isOpen(item);
        item.toggleAttribute('data-after-open', prevOpen && !selfOpen);
        item.toggleAttribute('data-before-open', nextOpen && !selfOpen);

        /* Nested list in expand slot → embedded (inherits end radius via CSS) */
        this.syncNestedLists(item);
      } else {
        item.removeAttribute('data-seg');
        item.segGap = false;
        item.removeAttribute('data-after-open');
        item.removeAttribute('data-before-open');
        item.style.removeProperty('margin-bottom');
        item.style.removeProperty('padding-bottom');
      }

      /* Selection mode + hide indicator */
      if (item.selection !== this.selection) item.selection = this.selection;
      item.hideSelectionIndicator = this.hideSelectionIndicator;

      if (
        (this.selection === 'single' ||
          this.selection === 'multiple' ||
          this.selection === 'switch') &&
        !item.interactive
      ) {
        item.interactive = true;
      }

      if (this.dismissible && !item.dismissible) item.dismissible = true;
    });

    /* Role on host */
    if (
      this.selection === 'single' ||
      this.selection === 'multiple' ||
      this.selection === 'switch'
    ) {
      this.setAttribute('role', 'listbox');
      this.setAttribute(
        'aria-multiselectable',
        this.selection === 'single' ? 'false' : 'true',
      );
    } else {
      this.setAttribute('role', 'list');
      this.removeAttribute('aria-multiselectable');
    }
  }

  /** Mark expand-slot nested lists as embedded (radii inherit via CSS vars). */
  private syncNestedLists(item: K3ListItem): void {
    for (const child of item.children) {
      if (!(child instanceof HTMLElement) || child.localName !== 'k3-list') continue;
      const slot = child.getAttribute('slot') || '';
      if (slot && slot !== 'expand' && slot !== 'content') continue;
      const nested = child as K3List;
      if (!nested.embedded) nested.embedded = true;
      if (nested.variant !== 'segmented') nested.variant = 'segmented';
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  selectedItems(): K3ListItem[] {
    return this.items().filter((i) => i.selected);
  }

  selectedValues(): string[] {
    return this.selectedItems().map((i) => i.value || i.getAttribute('value') || '');
  }

  private applySelect(item: K3ListItem): void {
    if (this.selection === 'none' || item.disabled) return;

    if (this.selection === 'single') {
      for (const el of this.items()) {
        el.selected = el === item;
      }
    } else if (this.selection === 'multiple' || this.selection === 'switch') {
      item.selected = !item.selected;
    }

    this.emit('k3-select', {
      item,
      value: item.value,
      selected: item.selected,
      values: this.selectedValues(),
    });
    this.emit('k3-change', {
      value: this.selection === 'single' ? item.value : this.selectedValues(),
      values: this.selectedValues(),
    });
  }

  // ── Accordion ─────────────────────────────────────────────────────────────

  private onExpand = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { item?: K3ListItem; expanded?: boolean };
    const item = detail?.item;
    if (this.accordion && item && detail?.expanded) {
      for (const el of this.items()) {
        if (el !== item && el.expandable && el.expanded) el.expanded = false;
      }
    }
    /* Re-sync adjacent-open + nested embedded radii after every expand toggle */
    queueMicrotask(() => this.syncChildren());
  };

  // ── Sortable ──────────────────────────────────────────────────────────────

  private unbindSortable(): void {
    this.sortableCtrl?.destroy();
    this.sortableCtrl = null;
  }

  private bindSortable(): void {
    this.unbindSortable();
    if (!this.sortable) return;

    this.sortableCtrl = attachSortable(this, {
      itemSelector: ':scope > k3-list-item',
      axis: 'y',
      draggingAttr: 'dragged',
      sortingAttr: 'sorting',
      /* Prefer vertical for reorder; horizontal stays available for swipe-dismiss */
      shouldActivate: (d) => Math.abs(d.dy) >= Math.abs(d.dx) * 0.85,
      canStart: (item, e) => {
        const c = item as K3ListItem;
        if (c.disabled) return false;
        for (const n of e.composedPath()) {
          if (!(n instanceof Element)) continue;
          const slot = n.getAttribute?.('slot');
          if (slot === 'trailing' || slot === 'end' || slot === 'leading') {
            const tag = (n as HTMLElement).localName;
            if (
              tag === 'k3-checkbox' ||
              tag === 'k3-radio' ||
              tag === 'k3-switch' ||
              tag === 'k3-icon-button' ||
              tag === 'button'
            ) {
              return false;
            }
          }
        }
        return true;
      },
      onActivate: ({ item }) => {
        this.sortingActive = true;
        this.emit('k3-dnd-start', { item });
      },
      onReorder: ({ from, to, items, item }) => {
        this.syncChildren();
        this.emit('k3-reorder', { from, to, item, items });
      },
      onEnd: ({ item, active }) => {
        this.sortingActive = false;
        this.syncChildren();
        if (active) this.emit('k3-dnd-end', { item });
      },
    });
  }

  moveItem(item: K3ListItem, delta: -1 | 1): boolean {
    const list = this.items();
    const i = list.indexOf(item);
    if (i < 0) return false;
    const j = i + delta;
    if (j < 0 || j >= list.length) return false;
    const ref = delta < 0 ? list[j]! : list[j]!.nextSibling;
    this.insertBefore(item, ref);
    this.syncChildren();
    this.emit('k3-reorder', {
      from: i,
      to: j,
      item,
      items: this.items(),
      source: 'menu',
    });
    this.sortableCtrl?.refresh();
    return true;
  }

  dismissItem(item: K3ListItem, source: 'menu' | 'api' = 'api'): void {
    if (typeof item.dismiss === 'function') item.dismiss(source === 'menu' ? 'menu' : 'api');
    else this.removeItem(item, source);
  }

  private removeItem(item: K3ListItem, source: string): void {
    const list = this.items();
    const idx = list.indexOf(item);
    const ok = this.emit('k3-dismiss', { item, source, index: idx }, true);
    if (!ok) return;
    item.remove();
    const next = list[idx] ?? list[idx - 1];
    const focusEl = next?.shadowRoot?.querySelector('[part="container"]') as
      | HTMLElement
      | null;
    (focusEl ?? next)?.focus?.();
    this.syncChildren();
    this.sortableCtrl?.refresh();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private onSelectRequest = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { item?: K3ListItem };
    const item = (detail?.item ?? e.target) as K3ListItem;
    if (!(item instanceof HTMLElement) || item.localName !== 'k3-list-item') return;
    e.stopPropagation();
    this.applySelect(item);
  };

  private onItemDismiss = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { item?: K3ListItem; source?: string };
    const item = (detail?.item ?? e.target) as K3ListItem;
    if (!(item instanceof HTMLElement) || item.localName !== 'k3-list-item') return;
    e.stopPropagation();
    this.removeItem(item, detail?.source ?? 'swipe');
  };

  private onActionsRequest = (e: Event): void => {
    const detail = (e as CustomEvent).detail as {
      item?: K3ListItem;
      clientX?: number;
      clientY?: number;
    };
    const item = (detail?.item ?? e.target) as K3ListItem;
    if (!(item instanceof HTMLElement) || item.localName !== 'k3-list-item') return;
    if (!this.sortable && !this.dismissible && !item.dismissible) return;
    e.stopPropagation();
    this.menuItem = item;
    void this.updateComplete.then(() => {
      const menu = this.actionsMenu;
      if (!menu) return;
      menu.positioningAnchor = item;
      void menu.show('menu');
    });
  };

  private onMenuSelect = (e: Event): void => {
    const el = e.target as HTMLElement;
    const action = el.getAttribute('data-action');
    const item = this.menuItem;
    this.menuItem = null;
    void this.actionsMenu?.hide('user');
    if (!item || !action) return;
    if (action === 'move-up') this.moveItem(item, -1);
    else if (action === 'move-down') this.moveItem(item, 1);
    else if (action === 'dismiss') this.dismissItem(item, 'menu');
  };

  private onKeydown = (e: KeyboardEvent): void => {
    const hosts = this.items().filter((c) => !c.disabled) as HTMLElement[];
    if (!hosts.length) return;
    const nav = handleFocusNavKey(e, hosts, {
      orientation: 'vertical',
      wrap: false,
      homeEnd: true,
      focusItem: (el) => {
        const surface = el.shadowRoot?.querySelector(
          '[part="container"]',
        ) as HTMLElement | null;
        (surface ?? el).focus?.();
      },
    });
    if (nav.handled) e.preventDefault();
  };

  private onSlotChange = (): void => {
    if (this.sortingActive) return;
    this.syncChildren();
    this.sortableCtrl?.refresh();
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('k3-select-request', this.onSelectRequest);
    this.addEventListener('k3-dismiss', this.onItemDismiss);
    this.addEventListener('k3-actions-request', this.onActionsRequest);
    this.addEventListener('k3-expand', this.onExpand);
    this.addEventListener('keydown', this.onKeydown);
    this.unwatchDpr?.();
    this.unwatchDpr = watchDevicePixelRatio(() => this.syncChildren());
    runWhenConnected(this, () => {
      this.syncChildren();
      this.bindSortable();
    });
  }

  override firstUpdated(): void {
    this.syncChildren();
    this.bindSortable();
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('sortable') ||
      changed.has('variant') ||
      changed.has('selection') ||
      changed.has('hideSelectionIndicator') ||
      changed.has('dismissible') ||
      changed.has('embedded')
    ) {
      this.syncChildren();
    }
    if (changed.has('sortable')) this.bindSortable();
  }

  override disconnectedCallback(): void {
    this.unwatchDpr?.();
    this.unwatchDpr = null;
    this.unbindSortable();
    this.removeEventListener('k3-select-request', this.onSelectRequest);
    this.removeEventListener('k3-dismiss', this.onItemDismiss);
    this.removeEventListener('k3-actions-request', this.onActionsRequest);
    this.removeEventListener('k3-expand', this.onExpand);
    this.removeEventListener('keydown', this.onKeydown);
    super.disconnectedCallback();
  }

  override render() {
    const list = this.menuItem ? this.items() : [];
    const idx = this.menuItem ? list.indexOf(this.menuItem) : -1;
    const canUp = idx > 0;
    const canDown = idx >= 0 && idx < list.length - 1;
    const canDismiss = !!(this.dismissible || this.menuItem?.dismissible);

    return html`
      <div
        class="list"
        part="container"
        role=${this.selection !== 'none' ? 'presentation' : 'presentation'}
        aria-label=${this.label || nothing}
      >
        <slot @slotchange=${this.onSlotChange}></slot>
      </div>
      ${this.sortable || this.dismissible
        ? html`<k3-menu
            id="list-actions-menu"
            variant="vertical"
            @k3-select=${this.onMenuSelect}
          >
            ${this.sortable
              ? html`
                  <k3-menu-item data-action="move-up" ?disabled=${!canUp}
                    >Move up</k3-menu-item
                  >
                  <k3-menu-item data-action="move-down" ?disabled=${!canDown}
                    >Move down</k3-menu-item
                  >
                `
              : nothing}
            ${canDismiss
              ? html`<k3-menu-item data-action="dismiss">Dismiss</k3-menu-item>`
              : nothing}
          </k3-menu>`
        : nothing}
    `;
  }
}

export default K3List;

if (!customElements.get('k3-list')) {
  customElements.define('k3-list', K3List);
}