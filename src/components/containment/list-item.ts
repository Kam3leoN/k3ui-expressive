import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  stateLayerStyles,
  focusRingStyles,
  emitLifecycle,
  waitForMotion,
  hasLightSlot,
  attachDrag,
  type DragController,
} from '../../core/index.js';
import { hostReset, dropSlotStyles } from '../_shared.js';
import K3Checkbox from '../inputs/checkbox.js';
import K3Radio from '../inputs/radio.js';
import K3Switch from '../inputs/switch.js';
import { listItemStyles } from './list-item.styles.js';

if (!customElements.get('k3-checkbox')) customElements.define('k3-checkbox', K3Checkbox);
if (!customElements.get('k3-radio')) customElements.define('k3-radio', K3Radio);
if (!customElements.get('k3-switch')) customElements.define('k3-switch', K3Switch);

export type ListItemLines = 'one' | 'two' | 'three' | 'auto';
export type ListItemLeading = '' | 'icon' | 'avatar' | 'image' | 'video';
export type ListItemSelection = 'none' | 'single' | 'multiple' | 'switch';
/** Detected kind of leading / trailing content (`undefined` = empty slot). */
export type ListItemContentType = 'video' | 'image' | 'avatar' | 'icon' | 'text' | undefined;

type DismissSource = 'swipe' | 'menu' | 'api';

const LEADING_SLOTS = ['leading', 'start', 'icon', 'leading-icon'] as const;
const TRAILING_SLOTS = ['trailing', 'end', 'trailing-icon', 'trailing-supporting-text'] as const;
const SELECTION_CONTROLS = new Set(['k3-checkbox', 'k3-radio', 'k3-switch']);
const ICON_SELECTOR = '.ms, .k3-icon, [data-k3-icon], svg, k3-icon';

/** Classify slotted media — video › image › avatar › icon › text. */
function contentTypeOf(els: Element[]): ListItemContentType {
  if (!els.length) return undefined;
  const has = (pred: (el: Element) => boolean) => els.some(pred);
  if (has((el) => el.localName === 'video' || !!el.querySelector?.(':scope > video'))) {
    return 'video';
  }
  if (has((el) => el.localName === 'img' || el.localName === 'picture')) return 'image';
  if (has((el) => el.localName === 'k3-avatar')) return 'avatar';
  if (has((el) => el.matches?.(ICON_SELECTOR))) return 'icon';
  return 'text';
}

/**
 * M3 / M3 Expressive list item.
 *
 * Anatomy: leading · overline · headline · supporting · trailing · optional expand.
 * Leading: icon · avatar · image · video (slot `leading` / `start` / `icon` /
 * `leading-icon`) — media kind is detected from the slotted element when the
 * `leading` attribute is not set.
 * Trailing: meta · icon · checkbox · radio · switch · chevron (slot `trailing` /
 * `end` / `trailing-icon` / `trailing-supporting-text`).
 *
 * Density: one 56 · two 72 · three 88 (or `auto` from slots), minus 4 dp per
 * density step (`density="-1…-3"` or `--k3-list-density-scale`).
 * Selection / dismiss / expand wired via parent `k3-list` or local props.
 * Action row: `href` (+ `target` · `rel` · `download`) renders a link surface.
 * Expand: `expandable` + `expanded` (alias `open`) · slot `expand` / `content`
 * / `items` (nested `k3-list` = folder) · slot `toggle-icon` replaces chevron.
 * Lifecycle: `k3-expand-start` / `k3-collapse-start` (cancelable on user
 * toggle) · `k3-expand-end` / `k3-collapse-end` after motion.
 *
 * @see https://m3.material.io/components/lists/specs
 * @see https://m3.material.io/components/lists/guidelines
 */
export class K3ListItem extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    dropSlotStyles,
    listItemStyles,
  ];

  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) interactive = false;
  /** Emphasized typography (M3 Expressive) — also inherited from parent `k3-list[emphasized]`. */
  @property({ type: Boolean, reflect: true }) emphasized = false;
  @property({ type: Boolean, reflect: true }) dragged = false;
  @property({ type: Boolean, reflect: true }) dismissible = false;
  @property({ type: Boolean, reflect: true }) expandable = false;
  @property({ type: Boolean, reflect: true }) expanded = false;
  /** Alias of `expanded` — both stay in sync. */
  @property({ type: Boolean, reflect: true }) open = false;
  /** Non-last segmented item marker (spacing = parent list flex gap). */
  @property({ type: Boolean, reflect: true, attribute: 'data-seg-gap' })
  segGap = false;
  /** Hide auto radio/checkbox while keeping selected surface (M3 hide indicator). */
  @property({ type: Boolean, reflect: true, attribute: 'hide-selection-indicator' })
  hideSelectionIndicator = false;
  /** Visual density — `auto` derives from overline / supporting slots. */
  @property({ reflect: true }) lines: ListItemLines = 'auto';
  /** Leading media size cue. */
  @property({ reflect: true }) leading: ListItemLeading = '';
  /** Selection mode inherited from list, or set locally. */
  @property({ reflect: true }) selection: ListItemSelection = 'none';
  /** Where auto selection control renders. */
  /** Where auto selection control renders — M3 default = trailing (end). */
  @property({ reflect: true, attribute: 'selection-position' })
  selectionPosition: 'leading' | 'trailing' = 'trailing';
  /** Trailing meta text (time, count…) — or `slot="meta"`. */
  @property() meta = '';
  /** Selection / form value. */
  @property() value = '';
  /** Fraction of width (0–1) to dismiss — default 0.35 */
  @property({ type: Number, attribute: 'dismiss-threshold' }) dismissThreshold = 0.35;
  @property({ type: Number, attribute: 'dismiss-velocity' }) dismissVelocity = 0.55;
  /** Action row — URL the row points to (renders a link surface). */
  @property() href = '';
  /** Link target (`_blank`…) — with `href`. */
  @property() target = '';
  /** Link relationship — with `href`. */
  @property() rel = '';
  /** Download the linked resource (optional file name) — with `href`. */
  @property() download?: string;

  @state() private pressed = false;
  @state() private hasLeading = false;
  @state() private hasOverline = false;
  @state() private hasSupporting = false;
  @state() private hasTrailing = false;
  @state() private hasMetaSlot = false;
  @state() private hasExpand = false;
  @state() private hasTrailingControl = false;
  @state() private hasDefaultSlot = false;
  @state() private leadingType: ListItemContentType = undefined;
  @state() private trailingType: ListItemContentType = undefined;
  @state() private focusVisible = false;

  private lightDomObserver: MutationObserver | null = null;
  private dismissDrag: DragController | null = null;
  private longPressTimer: number | null = null;
  private longPressOrigin: { x: number; y: number } | null = null;
  /** Expand toggled by the user (start event already emitted, cancelable). */
  private expandFromUser = false;
  private expandMotionToken = 0;

  /** Light-DOM children assigned to one of `names`. */
  private slotted(names: readonly string[]): Element[] {
    return [...this.children].filter((c) => names.includes(c.getAttribute('slot') ?? ''));
  }

  private syncSlots = (): void => {
    this.hasLeading = LEADING_SLOTS.some((n) => hasLightSlot(this, n));
    this.hasOverline = hasLightSlot(this, 'overline');
    this.hasSupporting =
      hasLightSlot(this, 'supporting') || hasLightSlot(this, 'supporting-text');
    this.hasTrailing = TRAILING_SLOTS.some((n) => hasLightSlot(this, n));
    this.hasMetaSlot = hasLightSlot(this, 'meta');
    this.hasDefaultSlot = [...this.children].some((c) => {
      if (!(c instanceof HTMLElement)) return false;
      const slot = c.getAttribute('slot');
      return slot === null || slot === '';
    });
    this.hasExpand =
      hasLightSlot(this, 'expand') ||
      hasLightSlot(this, 'content') ||
      hasLightSlot(this, 'items');
    if (this.hasExpand && !this.expandable) this.expandable = true;

    const trailing = this.slotted(TRAILING_SLOTS);
    this.hasTrailingControl = trailing.some((el) => SELECTION_CONTROLS.has(el.localName));

    const prevLeading = this.leadingType;
    this.leadingType = contentTypeOf(this.slotted(LEADING_SLOTS));
    this.trailingType = contentTypeOf(trailing);
    if (prevLeading !== this.leadingType) this.notifyParentList();
    this.syncExpandMode();
  };

  private bindLightDomObserver(): void {
    this.lightDomObserver?.disconnect();
    this.lightDomObserver = new MutationObserver(() => this.syncSlots());
    this.lightDomObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  /** Parent `k3-list` re-measures leading alignment (direct children only). */
  private notifyParentList(): void {
    const parent = this.parentElement as (HTMLElement & { requestSync?: () => void }) | null;
    if (parent?.localName === 'k3-list') parent.requestSync?.();
  }

  /** Detected kind of leading content (slot `leading` / `start` / `icon` / `leading-icon`). */
  get leadingContentType(): ListItemContentType {
    return this.leadingType;
  }

  /** Detected kind of trailing content (slot `trailing` / `end` / `trailing-*`). */
  get trailingContentType(): ListItemContentType {
    return this.trailingType;
  }

  /** Leading media kind used for sizing — explicit `leading` wins over detection. */
  get resolvedLeading(): ListItemLeading {
    if (this.leading) return this.leading;
    const t = this.leadingType;
    return t === 'video' || t === 'image' || t === 'avatar' || t === 'icon' ? t : '';
  }

  /**
   * M3E folder expand = nested `k3-list` in expand slot (separate segments).
   * Otherwise unified body — revealed content shares the trigger surface.
   * Attr drives CSS (:host(:has()) is unreliable across shadow boundaries).
   */
  private syncExpandMode(): void {
    const folder = [...this.children].some(
      (c) =>
        c instanceof HTMLElement &&
        c.localName === 'k3-list' &&
        (!c.getAttribute('slot') ||
          c.getAttribute('slot') === 'expand' ||
          c.getAttribute('slot') === 'content' ||
          c.getAttribute('slot') === 'items'),
    );
    this.toggleAttribute('data-expand-folder', folder);
  }

  /** Resolved line count for layout. */
  get resolvedLines(): 'one' | 'two' | 'three' {
    if (this.lines !== 'auto') return this.lines;
    if (this.hasOverline && this.hasSupporting) return 'three';
    if (this.hasOverline || this.hasSupporting) return 'two';
    return 'one';
  }

  private get showSelIndicator(): boolean {
    if (this.hideSelectionIndicator) return false;
    if (
      this.selection !== 'single' &&
      this.selection !== 'multiple' &&
      this.selection !== 'switch'
    ) {
      return false;
    }
    /*
     * A slotted checkbox / radio / switch IS the indicator. Other trailing
     * content (icons, meta) gives way to the auto indicator instead.
     */
    if (this.selectionPosition === 'trailing' && this.hasTrailingControl) return false;
    if (this.selectionPosition === 'leading' && this.hasLeading) return false;
    return true;
  }

  private get isActionable(): boolean {
    return (
      this.interactive ||
      this.selection !== 'none' ||
      this.expandable ||
      !!this.href ||
      this.hasAttribute('interactive')
    );
  }

  /** Action row rendered as a link. */
  private get isLink(): boolean {
    return !!this.href;
  }

  private fromInteractiveSlot(e: Event): boolean {
    for (const n of e.composedPath()) {
      if (n === this) break;
      if (!(n instanceof HTMLElement)) continue;
      const slot = n.getAttribute('slot');
      if (slot === 'trailing' || slot === 'end' || slot === 'leading' || slot === 'start') {
        const tag = n.localName;
        if (
          tag === 'k3-checkbox' ||
          tag === 'k3-radio' ||
          tag === 'k3-switch' ||
          tag === 'k3-icon-button' ||
          tag === 'k3-button' ||
          tag === 'button' ||
          tag === 'a' ||
          tag === 'input'
        ) {
          return true;
        }
      }
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
      item: this,
    });
  }

  private clearDismissVisual(): void {
    this.style.transform = '';
    this.style.opacity = '';
  }

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
      this.emit('k3-dismiss', { source, item: this, ...extra });
      this.removeAttribute('dismissing');
      this.clearDismissVisual();
    };
    this.addEventListener('transitionend', settle);
    window.setTimeout(settle, 400);
  }

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
        if (this.fromInteractiveSlot(e)) return false;
        if (this.closest('k3-list[sorting]')) return false;
        return true;
      },
      /* List sort is axis=y — only arm dismiss on horizontal-dominant swipes. */
      shouldActivate: (d) => {
        if (!this.closest('k3-list[sortable]')) return true;
        if (this.closest('k3-list[sorting]')) return false;
        return Math.abs(d.dx) > Math.abs(d.dy) * 1.15;
      },
      onActivate: () => {
        this.clearLongPress();
        this.pressed = false;
      },
      onMove: ({ dx, active }) => {
        if (!active) return;
        if (this.closest('k3-list[sorting]')) {
          this.clearDismissVisual();
          return;
        }
        this.style.transform = `translateX(${dx}px)`;
        this.style.opacity = String(
          Math.max(0.35, 1 - Math.abs(dx) / (this.offsetWidth || 1)),
        );
      },
      onEnd: ({ dx, velocityX, active }) => {
        if (!active || this.closest('k3-list[sorting]')) {
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

  private onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.fromInteractiveSlot(e)) return;

    this.clearLongPress();
    this.longPressOrigin = { x: e.clientX, y: e.clientY };
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      this.pressed = false;
      this.requestActionsMenu('long-press', e.clientX, e.clientY);
    }, 500);

    if (!this.isActionable) return;
    this.pressed = true;
    emitLifecycle(this, 'press-start', { source: 'user' });
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.longPressOrigin) return;
    const dx = e.clientX - this.longPressOrigin.x;
    const dy = e.clientY - this.longPressOrigin.y;
    if (dx * dx + dy * dy > 144) this.clearLongPress();
  };

  private onPointerUp = (): void => {
    this.clearLongPress();
    if (!this.pressed) return;
    this.pressed = false;
    emitLifecycle(this, 'press-end', { source: 'user' });
  };

  private toggleExpand(): void {
    const next = !this.expanded;
    const phase = next ? 'expand-start' : 'collapse-start';
    if (!emitLifecycle(this, phase, { source: 'user', item: this })) return;
    this.expandFromUser = true;
    this.expanded = next;
    this.emit('k3-expand', { expanded: this.expanded, item: this });
  }

  /** `*-start` (API changes) then `*-end` once the expand motion settles. */
  private runExpandLifecycle(): void {
    const expanded = this.expanded;
    const source = this.expandFromUser ? 'user' : 'api';
    if (!this.expandFromUser) {
      emitLifecycle(this, expanded ? 'expand-start' : 'collapse-start', { source, item: this });
    }
    this.expandFromUser = false;
    const token = ++this.expandMotionToken;
    const body = this.renderRoot.querySelector('.expand') as HTMLElement | null;
    void waitForMotion(body ?? this).then(() => {
      if (token !== this.expandMotionToken || !this.isConnected) return;
      emitLifecycle(this, expanded ? 'expand-end' : 'collapse-end', { source, item: this });
    });
  }

  private onFocusIn = (e: FocusEvent): void => {
    const t = e.target as Element | null;
    if (t !== e.currentTarget && !t?.classList?.contains('link')) return;
    let visible = false;
    try {
      visible = !!t?.matches(':focus-visible');
    } catch {
      visible = false;
    }
    this.focusVisible = visible;
  };

  private onFocusOut = (): void => {
    this.focusVisible = false;
  };

  private onActivate = (e: Event): void => {
    if (this.disabled) return;
    if (this.fromInteractiveSlot(e)) return;

    if (this.expandable) {
      this.toggleExpand();
    }

    if (
      this.selection === 'single' ||
      this.selection === 'multiple' ||
      this.selection === 'switch'
    ) {
      this.emit('k3-select-request', {
        item: this,
        value: this.value,
        selected: this.selected,
        selection: this.selection,
      });
    }

    this.emit('k3-click', {
      selected: this.selected,
      value: this.value,
      expanded: this.expanded,
    });
  };

  private onContextMenu = (e: MouseEvent): void => {
    if (this.disabled) return;
    if (this.fromInteractiveSlot(e)) return;
    const inSortable = this.closest('k3-list[sortable]');
    if (!this.dismissible && !inSortable) return;
    e.preventDefault();
    this.requestActionsMenu('contextmenu', e.clientX, e.clientY);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled || !this.isActionable) return;
    /* Link rows — Enter is handled natively by the anchor */
    if (this.isLink) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.pressed = true;
    this.onActivate(e);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') this.pressed = false;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSlots();
    this.bindLightDomObserver();
    this.addEventListener('contextmenu', this.onContextMenu);
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.bindDismissDrag();
    this.reflectLinesAttr();
  }

  /** Keep `open` ⇄ `expanded` in sync (no extra render). */
  override willUpdate(changed: Map<string, unknown>): void {
    const o = changed.has('open');
    const x = changed.has('expanded');
    if (o && x) {
      if (this.open !== this.expanded) {
        /* First render: either attribute opens the row. */
        const first = changed.get('open') === undefined && changed.get('expanded') === undefined;
        const v = first ? this.open || this.expanded : this.expanded;
        this.open = v;
        this.expanded = v;
      }
    } else if (o && this.expanded !== this.open) {
      this.expanded = this.open;
    } else if (x && this.open !== this.expanded) {
      this.open = this.expanded;
    }
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('expanded') && changed.get('expanded') !== undefined) {
      this.runExpandLifecycle();
    }
    this.toggleAttribute('data-actionable', this.isActionable && !this.disabled);
    this.toggleAttribute('data-pressed', this.pressed);
    this.toggleAttribute('data-focus-visible', this.focusVisible);
    const media = this.resolvedLeading;
    if (media) this.setAttribute('data-leading', media);
    else this.removeAttribute('data-leading');
    if (changed.has('dismissible') || changed.has('disabled')) this.bindDismissDrag();
    if (
      changed.has('lines') ||
      changed.has('hasOverline') ||
      changed.has('hasSupporting')
    ) {
      this.reflectLinesAttr();
    }
  }

  private reflectLinesAttr(): void {
    const r = this.resolvedLines;
    if (this.getAttribute('lines') !== r && this.lines === 'auto') {
      /* Keep visual lines via data attr without fighting user `lines` prop */
      this.setAttribute('data-lines', r);
    } else if (this.lines !== 'auto') {
      this.removeAttribute('data-lines');
    }
    /* When auto, also set lines attribute for CSS :host([lines=…]) */
    if (this.lines === 'auto') {
      this.setAttribute('lines', r);
      /* Restore auto after paint so property stays auto for next sync */
      queueMicrotask(() => {
        if (!this.hasOverline && !this.hasSupporting) {
          /* keep one */
        }
        /* property stays 'auto' in JS; attribute drives CSS */
        (this as { lines: ListItemLines }).lines = 'auto';
        this.setAttribute('lines', r);
      });
    }
  }

  override disconnectedCallback(): void {
    this.clearLongPress();
    this.dismissDrag?.destroy();
    this.dismissDrag = null;
    this.lightDomObserver?.disconnect();
    this.lightDomObserver = null;
    this.removeEventListener('contextmenu', this.onContextMenu);
    super.disconnectedCallback();
  }

  private renderSelIndicator() {
    const show = this.showSelIndicator;
    if (!show) return nothing;
    if (this.selection === 'multiple') {
      return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true" inert>
        <k3-checkbox ?checked=${this.selected} ?disabled=${this.disabled} tabindex="-1"></k3-checkbox>
      </span>`;
    }
    if (this.selection === 'switch') {
      return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true" inert>
        <k3-switch ?selected=${this.selected} ?disabled=${this.disabled} tabindex="-1"></k3-switch>
      </span>`;
    }
    return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true" inert>
      <k3-radio ?checked=${this.selected} ?disabled=${this.disabled} tabindex="-1"></k3-radio>
    </span>`;
  }

  private renderLink() {
    if (!this.isLink) return nothing;
    return html`<a
      class="link"
      part="link"
      href=${this.disabled ? nothing : this.href}
      target=${this.target || nothing}
      rel=${this.rel || nothing}
      download=${ifDefined(this.download ?? undefined)}
      aria-labelledby="content"
      aria-disabled=${this.disabled ? 'true' : nothing}
    ></a>`;
  }

  /** Empty leading column for sibling alignment (parent `data-leading-reserve`). */
  private wantsLeadingSpacer(): boolean {
    const list = this.closest('k3-list');
    return !!list?.hasAttribute('data-leading-reserve');
  }

  private slotIf(name: string): typeof nothing | ReturnType<typeof html> {
    return hasLightSlot(this, name) ? html`<slot name=${name}></slot>` : nothing;
  }

  private renderLeading(leadingSel: boolean, hasLeadingCol: boolean) {
    const show = hasLeadingCol || this.wantsLeadingSpacer();
    if (!show) return nothing;
    return html`<span
      class=${classMap({ leading: true, has: hasLeadingCol })}
      part="leading"
    >
      ${leadingSel ? this.renderSelIndicator() : nothing}
      ${this.slotIf('leading')}
      ${this.slotIf('start')}
      ${this.slotIf('icon')}
      ${this.slotIf('leading-icon')}
    </span>`;
  }

  private renderOverline() {
    if (!this.hasOverline) return nothing;
    return html`<span class="overline has" part="overline">${this.slotIf('overline')}</span>`;
  }

  private renderHeadline() {
    const showHeadlineSlot = hasLightSlot(this, 'headline');
    if (!showHeadlineSlot && !this.hasDefaultSlot) return nothing;
    return html`<span class="headline" part="headline">
      ${showHeadlineSlot ? html`<slot name="headline"></slot>` : nothing}
      ${this.hasDefaultSlot ? html`<slot></slot>` : nothing}
    </span>`;
  }

  private renderSupporting() {
    if (!this.hasSupporting) return nothing;
    return html`<span class="supporting has" part="supporting">
      ${this.slotIf('supporting')}
      ${this.slotIf('supporting-text')}
    </span>`;
  }

  private renderToggle() {
    if (!this.expandable) return nothing;
    return html`<span
      class=${classMap({ toggle: true, has: true, open: this.expanded })}
      part="toggle"
      aria-hidden="true"
    >
      <slot name="toggle-icon"
        ><span
          class=${classMap({ chevron: true, has: true, open: this.expanded })}
          part="chevron"
          >expand_more</span
        ></slot
      >
    </span>`;
  }

  private renderTrailing(trailingSel: boolean, hasTrailingCol: boolean) {
    if (!hasTrailingCol) return nothing;
    return html`<span
      class=${classMap({
        trailing: true,
        has: true,
        'sel-replaces': trailingSel,
      })}
      part="trailing"
    >
      ${this.meta
        ? html`<span class="meta" part="meta">${this.meta}</span>`
        : nothing}
      ${this.hasMetaSlot ? this.slotIf('meta') : nothing}
      ${this.slotIf('trailing-supporting-text')}
      ${this.slotIf('trailing')}
      ${this.slotIf('end')}
      ${this.slotIf('trailing-icon')}
      ${trailingSel ? this.renderSelIndicator() : nothing}
      ${this.renderToggle()}
    </span>`;
  }

  private renderExpandSection() {
    const show = this.expandable || this.hasExpand || this.expanded;
    if (!show) return nothing;
    return html`<div
      class=${classMap({
        expand: true,
        has: this.expandable || this.hasExpand,
        open: this.expanded,
      })}
      part="expand"
      id="expand"
    >
      <div class="expand-inner">
        <div class="expand-body">
          ${this.slotIf('expand')}
          ${this.slotIf('content')}
          ${this.slotIf('items')}
        </div>
      </div>
    </div>`;
  }

  override render() {
    const lines = this.resolvedLines;
    const actionable = this.isActionable;
    const link = this.isLink;
    const leadingSel =
      this.showSelIndicator && this.selectionPosition === 'leading';
    const trailingSel =
      this.showSelIndicator && this.selectionPosition === 'trailing';
    const hasLeadingCol = this.hasLeading || leadingSel || !!this.leading;
    const hasTrailingCol =
      this.hasTrailing ||
      this.hasMetaSlot ||
      !!this.meta ||
      trailingSel ||
      this.expandable;

    /* Ensure lines attr for CSS when auto */
    if (this.lines === 'auto' && this.getAttribute('lines') !== lines) {
      this.setAttribute('lines', lines);
    }

    /* Link rows: the anchor is the tab stop, the row is not focusable. */
    const tabindex = link ? nothing : actionable && !this.disabled ? 0 : -1;

    return html`
      <div
        class=${classMap({
          item: true,
          'k3-state-layer': actionable && !this.disabled,
          'k3-focus-ring': actionable && !this.disabled && !link,
        })}
        part="container"
        role=${this.selection === 'none' ? 'listitem' : 'option'}
        tabindex=${tabindex}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-selected=${this.selection !== 'none'
          ? this.selected
            ? 'true'
            : 'false'
          : nothing}
        aria-expanded=${this.expandable ? (this.expanded ? 'true' : 'false') : nothing}
        aria-controls=${this.expandable ? 'expand' : nothing}
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
        @focusin=${this.onFocusIn}
        @focusout=${this.onFocusOut}
      >
        ${this.renderLink()}
        ${this.renderLeading(leadingSel, hasLeadingCol)}
        <span class="content" part="content" id="content">
          ${this.renderOverline()}
          ${this.renderHeadline()}
          ${this.renderSupporting()}
        </span>
        ${this.renderTrailing(trailingSel, hasTrailingCol)}
      </div>
      ${this.renderExpandSection()}
    `;
  }
}

export default K3ListItem;

if (!customElements.get('k3-list-item')) {
  customElements.define('k3-list-item', K3ListItem);
}