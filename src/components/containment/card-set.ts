import { html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import {
  K3Element,
  handleFocusNavKey,
  runWhenConnected,
} from '../../core/index.js';
import { attachSortable, type SortableController } from '../../core/dnd.js';
import { hostReset } from '../_shared.js';
import type { K3Card } from './card.js';
import type { K3Menu } from './menu.js';
import { cardSetStyles } from './card-set.styles.js';

export type CardSetLayout = 'stack' | 'grid';

/**
 * M3 card set — groups `k3-card` with optional sortable reorder + dismiss a11y.
 *
 * Dragging / dismissing (guidelines): gestures need a single-pointer alternative.
 * Long-press or context-menu on a card opens an actions menu (Move up / down /
 * Dismiss) when `sortable` and/or child `dismissible` cards are present.
 *
 * ```html
 * <k3-card-set sortable dismissible label="Payment methods">
 *   <k3-card dismissible orientation="horizontal" media-layout="inset">…</k3-card>
 * </k3-card-set>
 * ```
 *
 * @see https://m3.material.io/components/cards/guidelines
 */
export class K3CardSet extends K3Element {
  static override styles = [hostReset, cardSetStyles];

  @property({ reflect: true }) layout: CardSetLayout = 'stack';
  @property() label = '';
  /** Enable reorder via pointer drag (shared K3 DnD). */
  @property({ type: Boolean, reflect: true }) sortable = false;
  /**
   * Propagate `dismissible` onto child cards and remove them on `k3-dismiss`
   * (unless `cancelable` listener calls `preventDefault`).
   */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  @state() private menuCard: K3Card | null = null;

  @query('#card-actions-menu') private actionsMenu!: K3Menu | null;

  private sortableCtrl: SortableController | null = null;
  private sortingActive = false;

  private cards(): K3Card[] {
    return [...this.querySelectorAll(':scope > k3-card')].filter(
      (el): el is K3Card => el instanceof HTMLElement && !el.hasAttribute('hidden'),
    ) as K3Card[];
  }

  private syncDismissible(): void {
    if (!this.dismissible) return;
    for (const card of this.cards()) {
      if (!card.dismissible) card.dismissible = true;
    }
  }

  /** Affordance ⋮⋮ on each card while the set is sortable. */
  private syncDragHandles(): void {
    for (const card of this.cards()) {
      if (card.dragHandle !== this.sortable) card.dragHandle = this.sortable;
    }
  }

  // ── Sortable ──────────────────────────────────────────────────────────────

  private unbindSortable(): void {
    this.sortableCtrl?.destroy();
    this.sortableCtrl = null;
  }

  private bindSortable(): void {
    this.unbindSortable();
    this.syncDragHandles();
    if (!this.sortable) return;

    this.sortableCtrl = attachSortable(this, {
      itemSelector: ':scope > k3-card',
      axis: this.layout === 'grid' ? 'both' : 'y',
      draggingAttr: 'dragged',
      sortingAttr: 'sorting',
      canStart: (item, e) => {
        const c = item as K3Card;
        if (c.disabled) return false;
        for (const n of e.composedPath()) {
          if (!(n instanceof Element)) continue;
          if (n.getAttribute?.('slot') === 'actions') return false;
          if (n.getAttribute?.('slot') === 'header-actions') return false;
        }
        /*
         * dismissible + sortable: reorder from the drag handle only so a
         * horizontal swipe on the body can dismiss (same idea as chip grip).
         */
        if (this.dismissible) {
          for (const n of e.composedPath()) {
            if (!(n instanceof Element)) continue;
            if (
              n.getAttribute('part') === 'drag-handle' ||
              n.classList.contains('drag-handle')
            ) {
              return true;
            }
          }
          return false;
        }
        return true;
      },
      onActivate: ({ item }) => {
        this.sortingActive = true;
        this.emit('k3-dnd-start', { item });
      },
      onReorder: ({ from, to, items, item }) => {
        this.emit('k3-reorder', { from, to, item, items });
      },
      onEnd: ({ item, active }) => {
        this.sortingActive = false;
        if (active) this.emit('k3-dnd-end', { item });
      },
    });
  }

  // ── Move / dismiss API (a11y menu + programmatic) ─────────────────────────

  moveCard(card: K3Card, delta: -1 | 1): boolean {
    const list = this.cards();
    const i = list.indexOf(card);
    if (i < 0) return false;
    const j = i + delta;
    if (j < 0 || j >= list.length) return false;
    const ref = delta < 0 ? list[j]! : list[j]!.nextSibling;
    this.insertBefore(card, ref);
    this.emit('k3-reorder', {
      from: i,
      to: j,
      item: card,
      items: this.cards(),
      source: 'menu',
    });
    this.sortableCtrl?.refresh();
    return true;
  }

  dismissCard(card: K3Card, source: 'menu' | 'api' = 'api'): void {
    if (typeof card.dismiss === 'function') card.dismiss(source === 'menu' ? 'menu' : 'api');
    else this.removeCard(card, source);
  }

  private removeCard(card: K3Card, source: string): void {
    const list = this.cards();
    const idx = list.indexOf(card);
    const ok = this.emit('k3-dismiss', { card, source, index: idx }, true);
    if (!ok) return;
    card.remove();
    const next = list[idx] ?? list[idx - 1];
    const focusEl = next?.shadowRoot?.querySelector('[part="container"]') as
      | HTMLElement
      | null;
    (focusEl ?? next)?.focus?.();
    this.sortableCtrl?.refresh();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private onCardDismiss = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { card?: K3Card; source?: string } | undefined;
    const card = (detail?.card ?? e.target) as K3Card;
    if (!(card instanceof HTMLElement) || card.localName !== 'k3-card') return;
    e.stopPropagation();
    this.removeCard(card, detail?.source ?? 'swipe');
  };

  private onActionsRequest = (e: Event): void => {
    const detail = (e as CustomEvent).detail as {
      card?: K3Card;
      clientX?: number;
      clientY?: number;
    };
    const card = (detail?.card ?? e.target) as K3Card;
    if (!(card instanceof HTMLElement) || card.localName !== 'k3-card') return;
    if (!this.sortable && !this.dismissible && !card.dismissible) return;
    e.stopPropagation();
    this.menuCard = card;
    void this.updateComplete.then(() => {
      const menu = this.actionsMenu;
      if (!menu) return;
      menu.positioningAnchor = card;
      void menu.show('menu');
    });
  };

  private onMenuSelect = (e: Event): void => {
    const item = e.target as HTMLElement;
    const action = item.getAttribute('data-action');
    const card = this.menuCard;
    this.menuCard = null;
    void this.actionsMenu?.hide('user');
    if (!card || !action) return;
    if (action === 'move-up') this.moveCard(card, -1);
    else if (action === 'move-down') this.moveCard(card, 1);
    else if (action === 'dismiss') this.dismissCard(card, 'menu');
  };

  private onKeydown = (e: KeyboardEvent): void => {
    const list = this.cards().filter((c) => c.interactive && !c.disabled) as HTMLElement[];
    if (!list.length) return;
    /* Focus surfaces are inside shadow — map to hosts */
    const hosts = list;
    const active = document.activeElement;
    const current =
      hosts.find((h) => h === active || h.shadowRoot?.activeElement != null) ?? null;
    if (!current) return;
    const nav = handleFocusNavKey(e, hosts, {
      orientation: 'vertical',
      wrap: false,
      homeEnd: true,
    });
    if (nav.handled) {
      e.preventDefault();
      const next = hosts[nav.itemIndex];
      const surface = next?.shadowRoot?.querySelector(
        '[part="container"]',
      ) as HTMLElement | null;
      surface?.focus?.();
    }
  };

  private onSlotChange = (): void => {
    if (this.sortingActive) return;
    this.syncDismissible();
    this.syncDragHandles();
    this.sortableCtrl?.refresh();
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('k3-dismiss', this.onCardDismiss);
    this.addEventListener('k3-actions-request', this.onActionsRequest);
    this.addEventListener('keydown', this.onKeydown);
    runWhenConnected(this, () => {
      this.syncDismissible();
      this.bindSortable();
    });
  }

  override firstUpdated(): void {
    this.syncDismissible();
    this.syncDragHandles();
    this.bindSortable();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('sortable') || changed.has('layout') || changed.has('dismissible')) {
      this.bindSortable();
    }
    if (changed.has('dismissible')) this.syncDismissible();
  }

  override disconnectedCallback(): void {
    this.unbindSortable();
    this.removeEventListener('k3-dismiss', this.onCardDismiss);
    this.removeEventListener('k3-actions-request', this.onActionsRequest);
    this.removeEventListener('keydown', this.onKeydown);
    super.disconnectedCallback();
  }

  override render() {
    const list = this.menuCard ? this.cards() : [];
    const idx = this.menuCard ? list.indexOf(this.menuCard) : -1;
    const canUp = idx > 0;
    const canDown = idx >= 0 && idx < list.length - 1;
    const canDismiss = !!(this.dismissible || this.menuCard?.dismissible);

    return html`
      <div
        class="set"
        part="container"
        role="group"
        aria-label=${this.label || nothing}
      >
        <slot @slotchange=${this.onSlotChange}></slot>
      </div>
      ${this.sortable || this.dismissible
        ? html`<k3-menu
            id="card-actions-menu"
            variant="vertical"
            @k3-select=${this.onMenuSelect}
          >
            ${this.sortable
              ? html`
                  <k3-menu-item
                    data-action="move-up"
                    ?disabled=${!canUp}
                    >Move up</k3-menu-item
                  >
                  <k3-menu-item
                    data-action="move-down"
                    ?disabled=${!canDown}
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

export default K3CardSet;