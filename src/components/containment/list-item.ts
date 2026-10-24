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

type DismissSource = 'swipe' | 'menu' | 'api';

/**
 * M3 / M3 Expressive list item.
 *
 * Anatomy: leading · overline · headline · supporting · trailing · optional expand.
 * Leading: icon · avatar · image · video (slot `leading` / `start` / `icon`).
 * Trailing: meta · icon · checkbox · radio · switch · chevron (slot `trailing` / `end`).
 *
 * Density: one 56 · two 72 · three 88 (or `auto` from slots).
 * Selection / dismiss / expand wired via parent `k3-list` or local props.
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
  @property({ type: Boolean, reflect: true }) dragged = false;
  @property({ type: Boolean, reflect: true }) dismissible = false;
  @property({ type: Boolean, reflect: true }) expandable = false;
  @property({ type: Boolean, reflect: true }) expanded = false;
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
  @property({ reflect: true, attribute: 'selection-position' })
  selectionPosition: 'leading' | 'trailing' = 'trailing';
  /** Trailing meta text (time, count…) — or `slot="meta"`. */
  @property() meta = '';
  /** Selection / form value. */
  @property() value = '';
  /** Fraction of width (0–1) to dismiss — default 0.35 */
  @property({ type: Number, attribute: 'dismiss-threshold' }) dismissThreshold = 0.35;
  @property({ type: Number, attribute: 'dismiss-velocity' }) dismissVelocity = 0.55;

  @state() private pressed = false;
  @state() private hasLeading = false;
  @state() private hasOverline = false;
  @state() private hasSupporting = false;
  @state() private hasTrailing = false;
  @state() private hasMetaSlot = false;
  @state() private hasExpand = false;

  private dismissDrag: DragController | null = null;
  private longPressTimer: number | null = null;
  private longPressOrigin: { x: number; y: number } | null = null;

  private syncSlots = (): void => {
    this.hasLeading =
      hasNamedSlot(this, 'leading') ||
      hasNamedSlot(this, 'start') ||
      hasNamedSlot(this, 'icon');
    this.hasOverline = hasNamedSlot(this, 'overline');
    this.hasSupporting =
      hasNamedSlot(this, 'supporting') || hasNamedSlot(this, 'supporting-text');
    this.hasTrailing =
      hasNamedSlot(this, 'trailing') || hasNamedSlot(this, 'end');
    this.hasMetaSlot = hasNamedSlot(this, 'meta');
    this.hasExpand =
      hasNamedSlot(this, 'expand') || hasNamedSlot(this, 'content');
    if (this.hasExpand && !this.expandable) this.expandable = true;
  };

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
    /* Custom trailing/leading control replaces auto indicator */
    if (this.selectionPosition === 'trailing' && this.hasTrailing) return false;
    if (this.selectionPosition === 'leading' && this.hasLeading) return false;
    return true;
  }

  private get isActionable(): boolean {
    return (
      this.interactive ||
      this.selection !== 'none' ||
      this.expandable ||
      this.hasAttribute('interactive')
    );
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
    this.expanded = !this.expanded;
    this.emit('k3-expand', { expanded: this.expanded, item: this });
  }

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
    this.addEventListener('contextmenu', this.onContextMenu);
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.bindDismissDrag();
    this.reflectLinesAttr();
  }

  override updated(changed: Map<string, unknown>): void {
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
    this.removeEventListener('contextmenu', this.onContextMenu);
    super.disconnectedCallback();
  }

  private renderSelIndicator() {
    const show = this.showSelIndicator;
    if (!show) return nothing;
    if (this.selection === 'multiple') {
      return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true">
        <k3-checkbox ?checked=${this.selected} tabindex="-1"></k3-checkbox>
      </span>`;
    }
    if (this.selection === 'switch') {
      return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true">
        <k3-switch ?selected=${this.selected} tabindex="-1"></k3-switch>
      </span>`;
    }
    return html`<span class="sel-indicator has" part="selection-indicator" aria-hidden="true">
      <k3-radio ?checked=${this.selected} tabindex="-1"></k3-radio>
    </span>`;
  }

  override render() {
    const lines = this.resolvedLines;
    const actionable = this.isActionable;
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

    return html`
      <div
        class=${classMap({
          item: true,
          'k3-state-layer': actionable && !this.disabled,
          'k3-focus-ring': actionable && !this.disabled,
        })}
        part="container"
        role=${this.selection === 'none' ? 'listitem' : 'option'}
        tabindex=${actionable && !this.disabled ? 0 : -1}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-selected=${this.selection !== 'none'
          ? this.selected
            ? 'true'
            : 'false'
          : nothing}
        aria-expanded=${this.expandable ? (this.expanded ? 'true' : 'false') : nothing}
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
        <span
          class=${classMap({ leading: true, has: hasLeadingCol })}
          part="leading"
        >
          ${leadingSel ? this.renderSelIndicator() : nothing}
          <slot name="leading" @slotchange=${this.syncSlots}></slot>
          <slot name="start" @slotchange=${this.syncSlots}></slot>
          <slot name="icon" @slotchange=${this.syncSlots}></slot>
        </span>
        <span class="content" part="content">
          <span
            class=${classMap({ overline: true, has: this.hasOverline })}
            part="overline"
          >
            <slot name="overline" @slotchange=${this.syncSlots}></slot>
          </span>
          <span class="headline" part="headline">
            <slot name="headline" @slotchange=${this.syncSlots}></slot>
            <slot></slot>
          </span>
          <span
            class=${classMap({ supporting: true, has: this.hasSupporting })}
            part="supporting"
          >
            <slot name="supporting" @slotchange=${this.syncSlots}></slot>
            <slot name="supporting-text" @slotchange=${this.syncSlots}></slot>
          </span>
        </span>
        <span
          class=${classMap({ trailing: true, has: hasTrailingCol })}
          part="trailing"
        >
          ${this.meta
            ? html`<span class="meta" part="meta">${this.meta}</span>`
            : nothing}
          <slot name="meta" @slotchange=${this.syncSlots}></slot>
          <slot name="trailing" @slotchange=${this.syncSlots}></slot>
          <slot name="end" @slotchange=${this.syncSlots}></slot>
          ${trailingSel ? this.renderSelIndicator() : nothing}
          <span
            class=${classMap({
              chevron: true,
              has: this.expandable,
              open: this.expanded,
            })}
            part="chevron"
            aria-hidden="true"
            >expand_more</span
          >
        </span>
      </div>
      <div
        class=${classMap({
          expand: true,
          has: this.expandable || this.hasExpand,
          open: this.expanded,
        })}
        part="expand"
      >
        <div class="expand-inner">
          <div class="expand-body">
            <slot name="expand" @slotchange=${this.syncSlots}></slot>
            <slot name="content" @slotchange=${this.syncSlots}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

export default K3ListItem;

if (!customElements.get('k3-list-item')) {
  customElements.define('k3-list-item', K3ListItem);
}