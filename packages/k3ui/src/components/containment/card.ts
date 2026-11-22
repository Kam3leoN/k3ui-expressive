import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  stateLayerStyles,
  focusRingStyles,
  emitLifecycle,
  hasNamedSlot,
  attachDrag,
  type DragController,
} from '../../core/index.js';
import { hostReset, dropSlotStyles } from '../_shared.js';
import K3Chip from '../inputs/chip.js';
import { cardStyles } from './card.styles.js';

if (!customElements.get('k3-chip')) customElements.define('k3-chip', K3Chip);

export type CardVariant = 'filled' | 'outlined' | 'elevated';
export type CardOrientation = 'vertical' | 'horizontal';
/**
 * Media framing (M3 Expressive) — all four corners rounded either way:
 * - `bleed` — edge-flush; radius = container (`--k3-card-radius`)
 * - `inset` — 16dp offset; same 4-corner radius (not edge-straddling)
 */
export type CardMediaLayout = 'bleed' | 'inset';
/** Where media sits in the vertical stack. */
export type CardMediaPosition = 'start' | 'after-header';
export type CardActionsAlign = 'start' | 'end';

type DismissSource = 'swipe' | 'menu' | 'api';

/**
 * M3 / M3 Expressive Card — filled · outlined · elevated.
 *
 * Anatomy: container · media · headline · subhead · supporting · actions ·
 * optional avatar / header-actions (overflow) · tariff (price / was / percent).
 *
 * Orientation: vertical (default) · horizontal (media at start; stacks &lt;600dp).
 * Media always has all four corners rounded (`--k3-card-radius`), bleed or inset.
 *
 * Interactive states: hovered · focused · pressed · dragged · disabled.
 * Corner morph: rest medium 12 → hover large 16 → press large-increased 20.
 *
 * Focus: `k3-focus-ring` (3→6→3 grow-shrink). Tab when `interactive`;
 * Space / Enter → `k3-click`.
 *
 * Drag / dismiss: `dragged` + `dropSlotStyles` for `k3-card-set sortable`.
 * `dismissible` → swipe `k3-dismiss`. Long-press / contextmenu → `k3-actions-request`.
 *
 * @see https://m3.material.io/components/cards/specs
 * @see https://m3.material.io/components/cards/guidelines
 * @see https://m3.material.io/styles/shape
 */
export class K3Card extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    dropSlotStyles,
    cardStyles,
  ];

  @property({ reflect: true }) variant: CardVariant = 'filled';
  @property({ reflect: true }) orientation: CardOrientation = 'vertical';
  /** Media framing: `bleed` (default) · `inset` (16dp · 4 corners). */
  @property({ reflect: true, attribute: 'media-layout' })
  mediaLayout: CardMediaLayout = 'bleed';
  /**
   * Media placement: `start` (default, before body) · `after-header`
   * (after headline/subhead — overflow-menu / mid-card layouts).
   */
  @property({ reflect: true, attribute: 'media-position' })
  mediaPosition: CardMediaPosition = 'start';
  /** Action row alignment. */
  @property({ reflect: true, attribute: 'actions-align' })
  actionsAlign: CardActionsAlign = 'end';
  /** Actionable — corner morph + state layer + focus ring + `k3-click`. */
  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Dragged state — elevated shadow + 16% state layer (guidelines / sortable). */
  @property({ type: Boolean, reflect: true }) dragged = false;
  /**
   * Leading ⋮⋮ grip — set by `k3-card-set sortable` (or manually).
   * When the set is also `dismissible`, reorder starts from this handle only
   * so horizontal swipe can dismiss.
   */
  @property({ type: Boolean, reflect: true, attribute: 'drag-handle' })
  dragHandle = false;
  /**
   * Swipe horizontally to dismiss (`k3-dismiss`).
   * Pair with a menu action (see `k3-actions-request`) for a11y.
   */
  @property({ type: Boolean, reflect: true }) dismissible = false;
  /** Fraction of width (0–1) to dismiss — default 0.35 */
  @property({ type: Number, attribute: 'dismiss-threshold' }) dismissThreshold = 0.35;
  /** Velocity (px/ms) to dismiss — default 0.55 */
  @property({ type: Number, attribute: 'dismiss-velocity' }) dismissVelocity = 0.55;

  /** Current price (e.g. `$299`). Overridden by `slot="price"`. */
  @property() price = '';
  /** Struck-through was-price (e.g. `$399`). Slot: `price-was`. */
  @property({ attribute: 'price-was' }) priceWas = '';
  /** Discount label rendered as `k3-chip` (e.g. `25% OFF`). Slot: `price-percent`. */
  @property({ attribute: 'price-percent' }) pricePercent = '';

  @state() private pressed = false;
  @state() private hasMedia = false;
  @state() private hasActions = false;
  @state() private hasHeadline = false;
  @state() private hasSubhead = false;
  @state() private hasAvatar = false;
  @state() private hasHeaderActions = false;
  @state() private hasPriceSlot = false;
  @state() private hasPriceWasSlot = false;
  @state() private hasPricePercentSlot = false;

  private dismissDrag: DragController | null = null;
  private longPressTimer: number | null = null;
  private longPressOrigin: { x: number; y: number } | null = null;

  private syncSlots = (): void => {
    this.hasMedia = hasNamedSlot(this, 'media');
    this.hasActions = hasNamedSlot(this, 'actions');
    this.hasHeadline = hasNamedSlot(this, 'headline');
    this.hasSubhead = hasNamedSlot(this, 'subhead');
    this.hasAvatar = hasNamedSlot(this, 'avatar');
    this.hasHeaderActions = hasNamedSlot(this, 'header-actions');
    this.hasPriceSlot = hasNamedSlot(this, 'price');
    this.hasPriceWasSlot = hasNamedSlot(this, 'price-was');
    this.hasPricePercentSlot = hasNamedSlot(this, 'price-percent');
  };

  private get showPrice(): boolean {
    return this.hasPriceSlot || !!this.price.trim();
  }
  private get showPriceWas(): boolean {
    return this.hasPriceWasSlot || !!this.priceWas.trim();
  }
  private get showPricePercent(): boolean {
    return this.hasPricePercentSlot || !!this.pricePercent.trim();
  }
  private get showTariff(): boolean {
    return this.showPrice || this.showPriceWas || this.showPricePercent;
  }

  /** Ignore presses/clicks that originate in action slots (buttons, overflow). */
  private fromActionSlot(e: Event): boolean {
    for (const n of e.composedPath()) {
      if (n === this) break;
      if (!(n instanceof HTMLElement)) continue;
      const slot = n.getAttribute('slot');
      if (slot === 'actions' || slot === 'header-actions') return true;
    }
    return false;
  }

  private clearLongPress(): void {
    if (this.longPressTimer != null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.longPressOrigin = null;
  }

  /** A11y alternative to drag/swipe — open actions menu. */
  private requestActionsMenu(
    source: 'long-press' | 'contextmenu',
    clientX?: number,
    clientY?: number,
  ): void {
    if (this.disabled) return;
    this.emit('k3-actions-request', {
      source,
      dismissible: this.dismissible,
      clientX: clientX ?? 0,
      clientY: clientY ?? 0,
      card: this,
    });
  }

  private clearDismissVisual(): void {
    this.style.transform = '';
    this.style.opacity = '';
  }

  /**
   * Animate out then emit `k3-dismiss`. Shared by swipe / menu / API.
   * Detail extras (dx, velocityX) are merged when provided.
   */
  private playDismissOut(
    source: DismissSource,
    sign: 1 | -1,
    extra?: Record<string, unknown>,
  ): void {
    if (this.hasAttribute('dismissing')) return;
    this.setAttribute('dismissing', '');
    const w = this.offsetWidth || 1;
    this.style.transform = `translateX(${sign * (w + 24)}px)`;
    this.style.opacity = '0';
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      this.removeEventListener('transitionend', settle);
      this.emit('k3-dismiss', { source, card: this, ...extra });
      this.removeAttribute('dismissing');
      this.clearDismissVisual();
    };
    this.addEventListener('transitionend', settle);
    window.setTimeout(settle, 400); /* fallback if no transition */
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.fromActionSlot(e)) return;

    /* Long-press → actions menu (M3: alternative to drag/swipe) */
    this.clearLongPress();
    this.longPressOrigin = { x: e.clientX, y: e.clientY };
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      this.pressed = false;
      this.requestActionsMenu('long-press', e.clientX, e.clientY);
    }, 500);

    if (!this.interactive) return;
    this.pressed = true;
    emitLifecycle(this, 'press-start', { source: 'user' });
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.longPressOrigin) return;
    const dx = e.clientX - this.longPressOrigin.x;
    const dy = e.clientY - this.longPressOrigin.y;
    if (dx * dx + dy * dy > 144) this.clearLongPress(); /* 12dp */
  };

  private onPointerUp = (): void => {
    this.clearLongPress();
    if (!this.pressed) return;
    this.pressed = false;
    emitLifecycle(this, 'press-end', { source: 'user' });
  };

  private onActivate = (e: Event): void => {
    if (!this.interactive || this.disabled) return;
    if (this.fromActionSlot(e)) return;
    this.emit('k3-click', { source: 'user' });
  };

  private onContextMenu = (e: MouseEvent): void => {
    if (this.disabled) return;
    if (this.fromActionSlot(e)) return;
    /* Always offer menu when dismissible or inside a sortable set */
    const inSortable = this.closest('k3-card-set[sortable]');
    if (!this.dismissible && !inSortable) return;
    e.preventDefault();
    this.requestActionsMenu('contextmenu', e.clientX, e.clientY);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.interactive || this.disabled) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.pressed = true;
    this.emit('k3-click', { source: 'user' });
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') this.pressed = false;
  };

  /** Programmatic dismiss (menu / API) — animates out then emits `k3-dismiss`. */
  dismiss(source: DismissSource = 'api'): void {
    if (this.disabled || this.hasAttribute('dismissing')) return;
    this.playDismissOut(source, 1);
  }

  private bindDismissDrag(): void {
    this.dismissDrag?.destroy();
    this.dismissDrag = null;
    if (!this.dismissible || this.disabled) return;

    this.dismissDrag = attachDrag(this, {
      axis: 'x',
      threshold: 10,
      touchAction: 'pan-y',
      disabled: () => this.disabled || this.hasAttribute('dismissing'),
      canStart: (e) => {
        if (this.fromActionSlot(e)) return false;
        /* Don’t fight an active card-set sort */
        if (this.closest('k3-card-set[sorting]')) return false;
        return true;
      },
      /**
       * Inside a sortable set: only claim horizontal swipes so vertical / free
       * drag stays available for attachSortable reorder.
       */
      shouldActivate: (d) => {
        if (!this.closest('k3-card-set[sortable]')) return true;
        if (this.closest('k3-card-set[sorting]')) return false;
        return Math.abs(d.dx) > Math.abs(d.dy) * 1.15;
      },
      onActivate: () => {
        this.clearLongPress();
        this.pressed = false;
      },
      onMove: ({ dx, active }) => {
        if (!active) return;
        if (this.closest('k3-card-set[sorting]')) {
          this.clearDismissVisual();
          return;
        }
        this.style.transform = `translateX(${dx}px)`;
        this.style.opacity = String(
          Math.max(0.35, 1 - Math.abs(dx) / (this.offsetWidth || 1)),
        );
      },
      onEnd: ({ dx, velocityX, active }) => {
        if (!active || this.closest('k3-card-set[sorting]')) {
          this.clearDismissVisual();
          return;
        }
        const w = this.offsetWidth || 1;
        const should =
          Math.abs(dx) / w >= this.dismissThreshold ||
          Math.abs(velocityX) >= this.dismissVelocity;
        if (should) {
          const sign: 1 | -1 =
            dx === 0 ? (velocityX >= 0 ? 1 : -1) : dx > 0 ? 1 : -1;
          this.playDismissOut('swipe', sign, { dx, velocityX });
        } else {
          this.clearDismissVisual();
        }
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSlots();
    this.addEventListener('contextmenu', this.onContextMenu);
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.bindDismissDrag();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('dismissible') || changed.has('disabled')) this.bindDismissDrag();
  }

  override disconnectedCallback(): void {
    this.clearLongPress();
    this.dismissDrag?.destroy();
    this.dismissDrag = null;
    this.removeEventListener('contextmenu', this.onContextMenu);
    super.disconnectedCallback();
  }

  private renderMedia() {
    const inset = this.mediaLayout === 'inset';
    return html`<div
      class=${classMap({
        media: true,
        has: this.hasMedia,
        bleed: !inset,
        inset,
      })}
      part="media"
    >
      <slot name="media" @slotchange=${this.syncSlots}></slot>
    </div>`;
  }

  private renderTariff() {
    return html`<div
      class=${classMap({ tariff: true, has: this.showTariff })}
      part="tariff"
    >
      <div class=${classMap({ price: true, has: this.showPrice })} part="price">
        <slot name="price" @slotchange=${this.syncSlots}
          >${this.price || nothing}</slot
        >
      </div>
      <div
        class=${classMap({ 'price-was': true, has: this.showPriceWas })}
        part="price-was"
      >
        <slot name="price-was" @slotchange=${this.syncSlots}
          >${this.priceWas || nothing}</slot
        >
      </div>
      <div
        class=${classMap({
          'price-percent': true,
          has: this.showPricePercent,
        })}
        part="price-percent"
      >
        <slot name="price-percent" @slotchange=${this.syncSlots}>
          ${this.pricePercent.trim()
            ? html`<k3-chip status="info">${this.pricePercent}</k3-chip>`
            : nothing}
        </slot>
      </div>
    </div>`;
  }

  private renderHeader(hasTitles: boolean) {
    return html`<div
      class=${classMap({
        header: true,
        'has-avatar': this.hasAvatar,
        'has-titles': hasTitles,
        'has-header-actions': this.hasHeaderActions,
        'has-drag-handle': this.dragHandle,
      })}
      part="header"
    >
      ${this.dragHandle
        ? html`<span
            class="drag-handle ms notranslate"
            part="drag-handle"
            aria-hidden="true"
            translate="no"
            lang="zxx"
            data-k3-icon="drag_indicator"
          ></span>`
        : nothing}
      <div
        class=${classMap({ avatar: true, has: this.hasAvatar })}
        part="avatar"
      >
        <slot name="avatar" @slotchange=${this.syncSlots}></slot>
      </div>
      <div class=${classMap({ titles: true, has: hasTitles })} part="titles">
        <div class="headline" part="headline">
          <slot name="headline" @slotchange=${this.syncSlots}></slot>
        </div>
        <div
          class=${classMap({ subhead: true, has: this.hasSubhead })}
          part="subhead"
        >
          <slot name="subhead" @slotchange=${this.syncSlots}></slot>
        </div>
      </div>
      <div
        class=${classMap({
          'header-actions': true,
          has: this.hasHeaderActions,
        })}
        part="header-actions"
      >
        <slot name="header-actions" @slotchange=${this.syncSlots}></slot>
      </div>
    </div>`;
  }

  override render() {
    const horizontal = this.orientation === 'horizontal';
    const inset = this.mediaLayout === 'inset';
    const mediaAfter = this.mediaPosition === 'after-header' && !horizontal;
    const hasTitles = this.hasHeadline || this.hasSubhead;
    const mediaStart = !mediaAfter;

    return html`<div
      class=${classMap({
        card: true,
        vertical: !horizontal,
        horizontal,
        'has-media': this.hasMedia,
        'media-inset': this.hasMedia && inset,
        'media-start': this.hasMedia && mediaStart,
        'media-after': this.hasMedia && mediaAfter,
        'k3-state-layer': this.interactive && !this.disabled,
        'k3-focus-ring': this.interactive && !this.disabled,
      })}
      part="container"
      role=${this.interactive ? 'button' : 'group'}
      tabindex=${this.interactive && !this.disabled ? 0 : -1}
      aria-disabled=${this.interactive && this.disabled ? 'true' : 'false'}
      data-pressed=${this.pressed ? '' : nothing}
      @pointerdown=${this.onPointerDown}
      @pointermove=${this.onPointerMove}
      @pointerup=${this.onPointerUp}
      @pointerleave=${this.onPointerUp}
      @pointercancel=${this.onPointerUp}
      @lostpointercapture=${this.onPointerUp}
      @click=${this.onActivate}
      @keydown=${this.onKeyDown}
      @keyup=${this.onKeyUp}
      @blur=${this.onPointerUp}
    >
      ${mediaStart ? this.renderMedia() : nothing}
      <div class="body" part="body">
        ${this.renderHeader(hasTitles)}
        ${mediaAfter ? this.renderMedia() : nothing}
        ${this.renderTariff()}
        <div class="content" part="content">
          <slot @slotchange=${this.syncSlots}></slot>
        </div>
        <div
          class=${classMap({
            actions: true,
            has: this.hasActions,
            'align-start': this.actionsAlign === 'start',
          })}
          part="actions"
        >
          <slot name="actions" @slotchange=${this.syncSlots}></slot>
        </div>
      </div>
    </div>`;
  }
}

export default K3Card;

if (!customElements.get('k3-card')) {
  customElements.define('k3-card', K3Card);
}
