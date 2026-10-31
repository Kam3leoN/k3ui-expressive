import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  stateLayerStyles,
  hasNamedSlot,
  waitForMotion,
  afterFrames,
  isRtl,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { markMenuItemEdges } from './menu-edges.js';
import {
  applyFlyoutPlace,
  clearFlyoutPlace,
  computeSubmenuFlyoutPlace,
  layoutBoundingRect,
  measureContentBox,
  MENU_MIN_H,
  MENU_MIN_W,
} from './menu-geometry.js';
import { menuItemStyles } from './menu-item.styles.js';
import { canHoverOpen } from './menu.types.js';

/**
 * M3 menu item — leading icon, shortcut, supporting text, selected,
 * divider / gap separators, nested submenu flyout.
 *
 * ## Separators
 * - `divider` / `divider=""` → 1dp hairline
 * - `divider="gap"` → surface split (vertical menus only; baseline → line)
 * - boolean `gap` kept for compat (prefer `divider="gap"`)
 *
 * ## Submenu
 * Slot `submenu` + optional `has-submenu`. Open mode follows the root
 * `k3-menu` `open-on` (click vs hover). Flyout is `position:fixed`
 * (`menu-geometry`). Never put `filter`/`transform` on flyout ancestors.
 *
 * @see https://m3.material.io/components/menus/specs
 */
export class K3MenuItem extends K3Element {
  static override styles = [hostReset, stateLayerStyles, menuItemStyles];

  // ── Public API ────────────────────────────────────────────────────────────

  @property() value = '';
  @property() shortcut = '';
  @property({ type: Boolean, reflect: true }) selected = false;
  /**
   * Select / single-choice menus — show a leading `check` when `selected`.
   * Used by `k3-select` (auto) or set manually on menu items.
   */
  @property({ type: Boolean, reflect: true }) checkable = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Separator: `divider` / `divider=""` → 1dp line · `divider="gap"` → surface split.
   */
  @property({
    reflect: true,
    converter: {
      fromAttribute(value: string | null): boolean | 'gap' {
        if (value === null) return false;
        if (value === 'gap') return 'gap';
        return true;
      },
      toAttribute(value: boolean | 'gap'): string | null {
        if (value === false) return null;
        if (value === 'gap') return 'gap';
        return '';
      },
    },
  })
  divider: boolean | 'gap' = false;

  /** @deprecated Prefer `divider="gap"`. */
  @property({ type: Boolean, reflect: true }) gap = false;

  @property({ type: Boolean, reflect: true, attribute: 'has-submenu' }) hasSubmenu = false;
  @property({ type: Boolean, reflect: true, attribute: 'submenu-open' }) submenuOpen = false;

  // ── Internal ──────────────────────────────────────────────────────────────

  @state() private _hasSubSlot = false;
  @state() private hasIcon = false;
  @state() private hasSupporting = false;
  @state() private hasTrailingSlot = false;
  /** Skip updated() re-place when openSubmenu() already scheduled it. */
  private _placeScheduled = false;

  // ── Separator predicates ──────────────────────────────────────────────────

  private get inBaselineMenu(): boolean {
    return this.closest('k3-menu')?.getAttribute('variant') === 'baseline';
  }

  /** Surface-split separator — vertical only (ignored on baseline). */
  get isGapSep(): boolean {
    if (this.inBaselineMenu) return false;
    return this.gap || this.divider === 'gap';
  }

  /** 1dp hairline separator (baseline maps divider="gap" → line). */
  get isDividerLine(): boolean {
    if (this.divider === true) return true;
    if (this.inBaselineMenu && (this.gap || this.divider === 'gap')) return true;
    return false;
  }

  private get showSub(): boolean {
    return this.hasSubmenu || this._hasSubSlot;
  }

  // ── Slot sync ─────────────────────────────────────────────────────────────

  /** Re-read slot flags (safe before first paint · after gap elev moves). */
  syncSlots(): void {
    this.hasIcon = hasNamedSlot(this, 'icon');
    this.hasSupporting = hasNamedSlot(this, 'supporting-text');
    this.hasTrailingSlot = hasNamedSlot(this, 'trailing');
    /* Drives taller 2-line layout (label + supporting-text) */
    this.toggleAttribute('data-supporting', this.hasSupporting);
    const hasSub = hasNamedSlot(this, 'submenu');
    if (hasSub !== this._hasSubSlot) this._hasSubSlot = hasSub;
    if (hasSub && !this.hasSubmenu) this.hasSubmenu = true;
  }

  // ── Focus helpers ─────────────────────────────────────────────────────────

  /** Focus this item's action button (keyboard roving). */
  focusItem(): void {
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('button.item');
    if (!btn) return;
    try {
      btn.focus({ focusVisible: true } as FocusOptions);
    } catch {
      btn.focus();
    }
  }

  /** Direct actionable children in the submenu slot. */
  submenuActionableItems(): K3MenuItem[] {
    return [...this.querySelectorAll<K3MenuItem>(':scope > k3-menu-item')].filter(
      (i) => !i.isGapSep && !i.isDividerLine && !i.disabled,
    );
  }

  private focusFirstSubItem(): void {
    this.submenuActionableItems()[0]?.focusItem();
  }

  // ── Submenu hover tree ────────────────────────────────────────────────────

  private flyoutEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.flyout') as HTMLElement | null;
  }

  /**
   * Submenus mirror root `k3-menu` open-on:
   * hover (+ fine pointer) → open/close on pointerenter/leave;
   * click → toggle on click only (no leave dismiss).
   */
  private submenuUsesHoverOpen(): boolean {
    const menu = this.closest('k3-menu') as
      | (HTMLElement & { usesHoverOpen?: boolean })
      | null;
    if (!menu) return canHoverOpen();
    return menu.usesHoverOpen === true;
  }

  /** True if node is in this item, its flyout, or any nested open flyout. */
  private isInSubmenuTree(node: EventTarget | Node | null): boolean {
    if (!(node instanceof Node)) return false;
    if (this.contains(node)) return true;
    const flyout = this.flyoutEl();
    if (flyout?.contains(node)) return true;
    let el: Element | null = node instanceof Element ? node : node.parentElement;
    while (el) {
      if (el === this || this.contains(el)) return true;
      const root = el.getRootNode();
      if (root instanceof ShadowRoot) {
        const host = root.host;
        if (host === this || this.contains(host)) return true;
        el = host;
        continue;
      }
      el = el.parentElement;
    }
    return false;
  }

  private onHostPointerLeave = (e: PointerEvent): void => {
    if (!this.submenuOpen || !this.submenuUsesHoverOpen()) return;
    if (this.isInSubmenuTree(e.relatedTarget)) return;
    window.setTimeout(() => {
      if (!this.submenuOpen || !this.submenuUsesHoverOpen()) return;
      const hovered = document.elementFromPoint?.(e.clientX, e.clientY);
      if (this.isInSubmenuTree(hovered)) return;
      this.closeSubmenu();
    }, 80);
  };

  // ── Flyout positioning ────────────────────────────────────────────────────

  /** Anchor surface: parent flyout (nested) · group · root menu panel. */
  private resolveAnchorRect(itemR: DOMRect): DOMRect {
    const parentItem = this.parentElement;
    if (parentItem instanceof HTMLElement && parentItem.localName === 'k3-menu-item') {
      const parentFlyout = (parentItem as K3MenuItem).flyoutEl();
      if (parentFlyout) {
        const r = layoutBoundingRect(parentFlyout);
        if (r.width > 0) return r;
      }
    }
    const group = this.closest('k3-menu-group') as HTMLElement | null;
    if (group) return layoutBoundingRect(group);
    const menu = this.closest('k3-menu') as
      | (HTMLElement & { getPanelRect?: () => DOMRect | null })
      | null;
    return menu?.getPanelRect?.() ?? itemR;
  }

  private submenuDepth(): number {
    let depth = 0;
    let el: Element | null = this.parentElement;
    while (el) {
      if (el.localName === 'k3-menu-item') depth++;
      el = el.parentElement;
    }
    return depth;
  }

  /** Resize / scroll / parent-fit — keep revealed; skip no-op to avoid mid-anim jumps. */
  repositionFlyout = (): void => {
    this.placeFlyout(true);
  };

  /**
   * Place open flyout.
   * @param reveal set data-placed (start enter motion). Measure-only keeps opacity 0.
   */
  private placeFlyout(reveal: boolean): void {
    if (!this.submenuOpen) return;
    const btn = this.shadowRoot?.querySelector('.item') as HTMLElement | null;
    const flyout = this.flyoutEl();
    if (!btn || !flyout) return;

    const itemR = layoutBoundingRect(btn);
    const panelR = this.resolveAnchorRect(itemR);
    const rtl = isRtl(this);
    const { w: flyoutW, h: flyoutH } = measureContentBox(flyout, {
      w: MENU_MIN_W,
      h: MENU_MIN_H,
    });

    applyFlyoutPlace(
      flyout,
      computeSubmenuFlyoutPlace({
        itemRect: itemR,
        panelRect: panelR,
        flyoutW,
        flyoutH,
        rtl,
        depth: this.submenuDepth(),
      }),
      reveal,
    );
  }

  /**
   * Wait for parent panel motion, measure once hidden, reveal once at final coords.
   * No multi-pass “jump into place” after the flyout is visible.
   */
  private scheduleFlyoutPlace(opts?: { focusFirst?: boolean }): void {
    const focusFirst = opts?.focusFirst === true;
    void (async () => {
      const menu = this.closest('k3-menu');
      const panel = menu?.shadowRoot?.querySelector('.panel') as HTMLElement | null;
      if (panel) await waitForMotion(panel);
      await this.updateComplete;
      await afterFrames(1);
      if (!this.submenuOpen) return;
      this.placeFlyout(false);
      const flyout = this.flyoutEl();
      if (flyout) void flyout.offsetWidth;
      await afterFrames(1);
      if (!this.submenuOpen) return;
      this.placeFlyout(true);
      if (focusFirst) this.focusFirstSubItem();
    })();
  }

  // ── Submenu open / close ──────────────────────────────────────────────────

  /** Open nested submenu flyout. */
  openSubmenu(opts?: { focusFirst?: boolean }): void {
    if (!this.showSub) return;
    const parent = this.parentElement;
    if (parent) {
      for (const el of parent.querySelectorAll<K3MenuItem>(':scope > k3-menu-item[submenu-open]')) {
        if (el !== this) el.closeSubmenu();
      }
    }
    this._placeScheduled = true;
    this.submenuOpen = true;
    markMenuItemEdges(this);
    this.emit('k3-submenu', { value: this.value, open: true });
    this.scheduleFlyoutPlace(opts);
  }

  /** Close nested submenu and any deeper open children. */
  closeSubmenu(): void {
    if (!this.submenuOpen) return;
    this.querySelectorAll<K3MenuItem>(':scope > k3-menu-item[submenu-open]').forEach((el) => {
      el.closeSubmenu();
    });
    this._placeScheduled = false;
    this.submenuOpen = false;
    this.emit('k3-submenu', { value: this.value, open: false });
    /* Keep top/left while exit scale/fade runs, then clear */
    const flyout = this.flyoutEl();
    void waitForMotion(flyout ?? this).then(() => {
      if (flyout) clearFlyoutPlace(flyout);
    });
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  private onClick = (e: Event): void => {
    if (this.disabled || this.isGapSep || this.isDividerLine) return;
    if (this.showSub) {
      e.stopPropagation();
      if (this.submenuOpen) this.closeSubmenu();
      else this.openSubmenu();
      return;
    }
    this.emit('k3-select', { value: this.value });
  };

  private onItemKeydown = (e: KeyboardEvent): void => {
    const rtl = isRtl(this);
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (this.showSub && (e.key === openKey || e.key === 'Enter')) {
      e.preventDefault();
      e.stopPropagation();
      this.openSubmenu({ focusFirst: true });
    } else if (e.key === closeKey && this.submenuOpen) {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubmenu();
      this.focusItem();
    }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSlots();
    queueMicrotask(() => this.syncSlots());
    this.addEventListener('pointerleave', this.onHostPointerLeave);
    window.addEventListener('resize', this.repositionFlyout, { passive: true });
    window.addEventListener('scroll', this.repositionFlyout, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerleave', this.onHostPointerLeave);
    window.removeEventListener('resize', this.repositionFlyout);
    window.removeEventListener('scroll', this.repositionFlyout, true);
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.shadowRoot?.querySelectorAll('slot').forEach((slot) => {
      slot.addEventListener('slotchange', () => {
        this.syncSlots();
        markMenuItemEdges(this);
      });
    });
    markMenuItemEdges(this);
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!changed.has('submenuOpen') || !this.submenuOpen) return;
    if (this._placeScheduled) {
      this._placeScheduled = false;
      return;
    }
    /* Attribute / external submenu-open without openSubmenu() */
    this.scheduleFlyoutPlace();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  override render() {
    if (this.isGapSep) {
      return html`<div class="gap" part="gap" role="separator" aria-hidden="true"></div>`;
    }
    if (this.isDividerLine) {
      return html`<hr class="divider" part="divider" role="separator" />`;
    }

    const showSub = this.showSub;
    const hasTrailing = this.hasTrailingSlot || !!this.shortcut || showSub;
    const showCheck = this.checkable && this.selected;
    const showIcon = showCheck || this.hasIcon;

    return html`
      <button
        type="button"
        class=${classMap({ item: true, 'k3-state-layer': true })}
        part="container"
        role=${this.checkable ? 'menuitemradio' : 'menuitem'}
        ?disabled=${this.disabled}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-haspopup=${showSub ? 'menu' : nothing}
        aria-expanded=${showSub ? String(this.submenuOpen) : nothing}
        aria-checked=${this.checkable ? (this.selected ? 'true' : 'false') : nothing}
        @click=${this.onClick}
        @pointerenter=${() => {
          if (showSub && this.submenuUsesHoverOpen()) this.openSubmenu();
        }}
        @keydown=${this.onItemKeydown}
      >
        <span class="icon ${showIcon ? 'has' : ''}" part="icon"
          >${showCheck
        ? html`<span
                class="check notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon="check"
                aria-hidden="true"
              ></span>`
        : html`<slot name="icon"></slot>`}</span
        >
        <span class="label" part="label">
          <span><slot></slot></span>
          <span class="supporting ${this.hasSupporting ? 'has' : ''}" part="supporting-text">
            <slot name="supporting-text"></slot>
          </span>
        </span>
        <span class="trailing ${hasTrailing ? 'has' : ''}" part="trailing">
          ${this.shortcut
        ? html`<span class="shortcut" part="shortcut">${this.shortcut}</span>`
        : nothing}
          <slot name="trailing"></slot>
          ${showSub
        ? html`<span
                class="chevron notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon="chevron_right"
                aria-hidden="true"
              ></span>`
        : nothing}
        </span>
      </button>
      <div
        class="flyout"
        part="submenu"
        role="menu"
        @pointerenter=${() => {
          if (this.submenuUsesHoverOpen()) this.openSubmenu();
        }}
        @pointerleave=${() => {
          if (this.submenuUsesHoverOpen()) this.closeSubmenu();
        }}
      >
        <slot name="submenu"></slot>
      </div>
    `;
  }
}

export default K3MenuItem;

if (!customElements.get('k3-menu-item')) {
  customElements.define('k3-menu-item', K3MenuItem);
}
