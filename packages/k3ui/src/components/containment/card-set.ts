import { html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import {
  K3Element,
  devicePixelSnapCss,
  handleFocusNavKey,
  isRtl,
  runWhenConnected,
} from '../../core/index.js';
import { attachSortable, type SortableController } from '../../core/dnd.js';
import { hostReset } from '../_shared.js';
import type { K3Card } from './card.js';
import type { K3Menu } from './menu.js';
import {
  packGridRects,
  parseColSpan,
  resolveConnectedCorners,
  resolveStackConnectedCorners,
  stackPositionLabel,
  type CardRect,
} from './card-set.geometry.js';
import {
  CardSetConnectedGapDp,
  CardSetSpecs,
  type CardSetLayout,
  type CardSetVariant,
} from './card-set.specs.js';
import { cardSetStyles } from './card-set.styles.js';

export type { CardSetLayout, CardSetVariant } from './card-set.specs.js';
export { CardSetSpecs } from './card-set.specs.js';
export {
  detectCardNeighbors,
  cornerFlagsFromNeighbors,
  logicalCornersFromFlags,
  packGridRects,
  parseColSpan,
  resolveConnectedCorners,
  resolveStackConnectedCorners,
  stackPositionLabel,
} from './card-set.geometry.js';

/**
 * M3 card set — groups `k3-card` with optional connected joins, sortable
 * reorder + dismiss a11y.
 *
 * `variant="connected"` — tight gap (2dp) + outer/inner corner radii like
 * button-group connected / M3E card-list (works for stack and bento grids).
 *
 * ```html
 * <k3-card-set variant="connected" layout="grid" columns="3" label="Features">
 *   <k3-card>…</k3-card>
 *   <k3-card col-span="full">…</k3-card>
 * </k3-card-set>
 * ```
 *
 * @see https://m3.material.io/components/cards/guidelines
 * @see ./card-set.specs.ts
 */
export class K3CardSet extends K3Element {
  static override styles = [hostReset, cardSetStyles];

  @property({ reflect: true }) variant: CardSetVariant = 'standard';
  @property({ reflect: true }) layout: CardSetLayout = 'stack';
  /**
   * Fixed column count for `layout="grid"` (especially connected bentos).
   * `0` / omitted → layout tracks (`--k3-layout-columns`).
   */
  @property({
    type: Number,
    reflect: true,
    converter: {
      fromAttribute: (v: string | null) =>
        v == null || v === '' ? 0 : Number(v) || 0,
      toAttribute: (v: number) => (v > 0 ? String(v) : null),
    },
  })
  columns = 0;
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
  private resizeObs: ResizeObserver | null = null;
  private connectedRaf = 0;

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

  // ── Connected corners ─────────────────────────────────────────────────────

  private applyGapToken(): void {
    if (this.variant === 'connected') {
      this.style.setProperty(
        '--k3-card-set-connected-gap',
        devicePixelSnapCss(CardSetConnectedGapDp),
      );
    } else {
      this.style.removeProperty('--k3-card-set-connected-gap');
    }
  }

  private applyColumnsToken(): void {
    if (this.layout === 'grid' && this.columns > 0) {
      this.style.setProperty('--k3-card-set-columns', String(this.columns));
    } else {
      this.style.removeProperty('--k3-card-set-columns');
    }
  }

  private clearConnectedOn(card: HTMLElement): void {
    card.removeAttribute('data-connected');
    card.removeAttribute('data-cs');
    card.style.removeProperty('--k3-card-rss');
    card.style.removeProperty('--k3-card-rse');
    card.style.removeProperty('--k3-card-ree');
    card.style.removeProperty('--k3-card-res');
  }

  private clearAllConnected(): void {
    for (const card of this.querySelectorAll(':scope > k3-card')) {
      this.clearConnectedOn(card as HTMLElement);
    }
  }

  /** Schedule a connected corner sync after layout. */
  private scheduleConnectedSync = (): void => {
    if (this.connectedRaf) cancelAnimationFrame(this.connectedRaf);
    this.connectedRaf = requestAnimationFrame(() => {
      this.connectedRaf = 0;
      this.syncConnectedCorners();
    });
  };

  private syncConnectedCorners(): void {
    this.applyGapToken();
    this.applyColumnsToken();

    const list = this.cards();
    if (this.variant !== 'connected' || !list.length) {
      this.clearAllConnected();
      return;
    }

    const outer = CardSetSpecs.connectedOuterCss;
    const inner = CardSetSpecs.connectedInnerCss;
    const gapCss = devicePixelSnapCss(CardSetConnectedGapDp);
    const gapPx = parseFloat(gapCss) || CardSetConnectedGapDp;

    let corners;
    if (this.layout === 'stack') {
      /* Index-based — no measurement (works in jsdom / before paint). */
      corners = resolveStackConnectedCorners(list.length, outer, inner);
    } else {
      let rects: CardRect[] = list.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          left: r.left,
        };
      });
      const unlaid = rects.every(
        (r) => r.right - r.left < 1 || r.bottom - r.top < 1,
      );
      if (unlaid) {
        const cols = this.columns > 0 ? this.columns : 3;
        const spans = list.map((el) => parseColSpan(el, cols));
        rects = packGridRects(list.length, cols, spans, 100, 40, gapPx);
      }
      corners = resolveConnectedCorners(rects, gapPx, outer, inner, isRtl(this));
    }

    list.forEach((card, i) => {
      const c = corners[i]!;
      card.toggleAttribute('data-connected', true);
      card.setAttribute(
        'data-cs',
        this.layout === 'stack'
          ? stackPositionLabel(i, list.length)
          : 'cell',
      );
      card.style.setProperty('--k3-card-rss', c.rss);
      card.style.setProperty('--k3-card-rse', c.rse);
      card.style.setProperty('--k3-card-ree', c.ree);
      card.style.setProperty('--k3-card-res', c.res);
    });
  }

  private bindResizeObserver(): void {
    this.resizeObs?.disconnect();
    this.resizeObs = null;
    if (this.variant !== 'connected') return;
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObs = new ResizeObserver(() => this.scheduleConnectedSync());
    this.resizeObs.observe(this);
    for (const card of this.cards()) this.resizeObs.observe(card);
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
        this.scheduleConnectedSync();
      },
      onEnd: ({ item, active }) => {
        this.sortingActive = false;
        if (active) this.emit('k3-dnd-end', { item });
        this.scheduleConnectedSync();
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
    this.scheduleConnectedSync();
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
    this.scheduleConnectedSync();
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
    this.bindResizeObserver();
    this.scheduleConnectedSync();
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
      this.bindResizeObserver();
      this.scheduleConnectedSync();
    });
  }

  override firstUpdated(): void {
    this.syncDismissible();
    this.syncDragHandles();
    this.bindSortable();
    this.bindResizeObserver();
    this.scheduleConnectedSync();
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('sortable') ||
      changed.has('layout') ||
      changed.has('dismissible')
    ) {
      this.bindSortable();
    }
    if (changed.has('dismissible')) this.syncDismissible();
    if (
      changed.has('variant') ||
      changed.has('layout') ||
      changed.has('columns')
    ) {
      this.bindResizeObserver();
      this.scheduleConnectedSync();
    }
  }

  override disconnectedCallback(): void {
    if (this.connectedRaf) cancelAnimationFrame(this.connectedRaf);
    this.connectedRaf = 0;
    this.resizeObs?.disconnect();
    this.resizeObs = null;
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

if (!customElements.get('k3-card-set')) {
  customElements.define('k3-card-set', K3CardSet);
}
