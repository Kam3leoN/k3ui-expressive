import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  afterFrames,
  afterPaint,
  edgeScrollbarStyles,
  runOpenClose,
  waitForMotion,
  handleFocusNavKey,
  resolveFocusNavKey,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import type { K3MenuItem } from './menu-item.js';
import { markMenuTreeEdges } from './menu-edges.js';
import { menuHasGroupSurfaces, normalizeMenuGaps } from './menu-gaps.js';
import {
  clearMenuPanelFit,
  fitMenuPanel,
  layoutBoundingRect,
  sideAnchorRect,
} from './menu-fit.js';
import { menuStyles } from './menu.styles.js';
import {
  canHoverOpen,
  isSideMenuPosition,
  parseMenuDensity,
  parseMenuOpenOn,
  type MenuColor,
  type MenuDensity,
  type MenuOpenOn,
  type MenuPosition,
  type MenuVariant,
} from './menu.types.js';

export type {
  MenuColor,
  MenuDensity,
  MenuOpenOn,
  MenuPosition,
  MenuVariant,
} from './menu.types.js';

/** Swallow the opening key so it cannot also advance to item 2. */
const NAV_LOCK_MS = 100;
/**
 * Ignore document pointerdown right after open — opening clicks (rail / bar
 * hosts that call show() from click) must not dismiss in the same gesture.
 */
const POINTER_IGNORE_MS = 320;
/** Grace before hover-dismiss — covers the gap between trigger and panel. */
const HOVER_CLOSE_MS = 120;
/** Fit passes after open — gap elev / icons / first paint settle. */
const FIT_PASSES = 3;

/** Options for `show` / `hide` — `fast` trims staging / exit wait. */
export type MenuMotionOptions = {
  /**
   * Skip enter staging (paint closed → open) and exit motion wait.
   * Prefer the default expressive path; use for rapid dest switches only.
   */
  fast?: boolean;
};

/**
 * M3 Menu — vertical Expressive (default) + baseline.
 *
 * ## Separators
 * - `<k3-menu-item divider>` → 1dp hairline (band 8 · baseline band 1px)
 * - `<k3-menu-item divider="gap">` → elevated surfaces (vertical only; not baseline)
 *
 * ## Keyboard
 * - Open: click · ↓ ↑ Enter Space on trigger → focus panel (no item highlight)
 * - Navigate: ↓ ↑ Tab Shift+Tab · Home End (wrap within level)
 * - Submenu: → / Enter opens + focuses first child · ← / Escape steps out
 *
 * ## Modules
 * - `menu.styles.ts` — chrome / tokens
 * - `menu-geometry.ts` — layout rects + submenu flyout place
 * - `menu-fit.ts` — root panel viewport edge flip (LTR/RTL)
 * - `menu-gaps.ts` — `divider="gap"` → elev groups
 * - `menu-edges.ts` — first/last hover radii
 * - `menu-item.ts` / `menu-group.ts` — children
 *
 * @see https://m3.material.io/components/menus/specs
 */
export class K3Menu extends K3Element {
  static override styles = [hostReset, edgeScrollbarStyles, menuStyles];

  // ── Public API ────────────────────────────────────────────────────────────

  @property({ reflect: true }) variant: MenuVariant = 'vertical';
  @property({ reflect: true }) color: MenuColor = 'standard';
  @property({ reflect: true }) position: MenuPosition = 'bottom-start';
  /**
   * M3 density: `0` (default) · `-1` · `-2` · `-3`.
   * Shortens item height (padding) — label size stays label-large.
   */
  @property({
    reflect: true,
    converter: {
      fromAttribute: parseMenuDensity,
      toAttribute: (v: MenuDensity) => String(v),
    },
  })
  override density: MenuDensity = 0;
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, attribute: 'close-on-select' }) closeOnSelect = true;
  /** Join items into one continuous shape (0 gap) — single-surface menus. */
  @property({ type: Boolean, reflect: true }) connected = false;
  /**
   * Comma-separated selectors — pointerdown on these does not auto-dismiss.
   * Use for owner hosts that toggle the menu themselves (e.g. `#nav-rail,#nav-bar`).
   */
  @property({ attribute: 'dismiss-ignore' }) dismissIgnore = '';
  /**
   * Trigger interaction: `click` (default) or `hover`.
   * Hover needs `(hover: hover) and (pointer: fine)` — else click fallback.
   */
  @property({
    reflect: true,
    attribute: 'open-on',
    converter: { fromAttribute: parseMenuOpenOn },
  })
  openOn: MenuOpenOn = 'click';

  /**
   * Live fit target when there is no slotted trigger (shell nav, context menus).
   * Re-read on every fit / resize — never snapshot a DOMRect at open time.
   */
  positioningAnchor: HTMLElement | null = null;
  /**
   * Side positions (`end-*` / `start-*`): use this host’s content-facing edge as
   * the horizontal origin (e.g. `#nav-rail`) while `positioningAnchor` supplies
   * the vertical band. Avoids gaps when the pill is narrower than the rail.
   */
  positioningEdge: HTMLElement | null = null;

  /** True when open-on=hover is active for this pointer class. */
  get usesHoverOpen(): boolean {
    return this.openOn === 'hover' && canHoverOpen();
  }

  /** Extend outside-click ignore (call synchronously from the opening gesture). */
  armDismissGuard(ms = POINTER_IGNORE_MS): void {
    this._pointerIgnoreUntil = performance.now() + Math.max(0, ms);
    this._navLockedUntil = performance.now() + NAV_LOCK_MS;
  }

  /** Panel rect for submenu anchoring (layout box — ignores visual transform). */
  getPanelRect(): DOMRect | null {
    const panel = this.panelEl();
    return panel ? layoutBoundingRect(panel) : null;
  }

  // ── Internal state ────────────────────────────────────────────────────────

  @state() private visible = false;
  private _motionGate: Promise<unknown> = Promise.resolve();
  private _enterLock = false;
  private _hoverCloseTimer = 0;
  private _normalizing = false;
  private _navLockedUntil = 0;
  private _pointerIgnoreUntil = 0;
  private _fitListening = false;
  private _fitRo: ResizeObserver | null = null;

  // ── DOM helpers ───────────────────────────────────────────────────────────

  private panelEl(): HTMLElement | null {
    return (this.shadowRoot?.querySelector('.panel') as HTMLElement | null) ?? null;
  }

  private isRtl(): boolean {
    return (
      getComputedStyle(this).direction === 'rtl' ||
      document.documentElement.getAttribute('dir') === 'rtl'
    );
  }

  /** Serialize show/hide so overlapping calls cannot fight. */
  private enqueueMotion<T>(run: () => Promise<T>): Promise<T> {
    const next = this._motionGate.then(run, run);
    this._motionGate = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  // ── Item queries ──────────────────────────────────────────────────────────

  private itemFromPath(path: EventTarget[]): K3MenuItem | undefined {
    return path.find(
      (n): n is K3MenuItem => n instanceof HTMLElement && n.localName === 'k3-menu-item',
    );
  }

  private rootActionableItems(): K3MenuItem[] {
    return [...this.querySelectorAll<K3MenuItem>('k3-menu-item')].filter((i) => {
      if (i.isGapSep || i.isDividerLine || i.disabled) return false;
      return i.parentElement?.localName !== 'k3-menu-item';
    });
  }

  private levelItems(focused?: K3MenuItem): K3MenuItem[] {
    const parent = focused?.parentElement;
    if (parent instanceof HTMLElement && parent.localName === 'k3-menu-item') {
      return (parent as K3MenuItem).submenuActionableItems();
    }
    return this.rootActionableItems();
  }

  private openSubmenuItems(): K3MenuItem[] {
    return [...this.querySelectorAll<K3MenuItem>('k3-menu-item[submenu-open]')];
  }

  // ── Gap surfaces ──────────────────────────────────────────────────────────

  private syncGroups(): void {
    this.toggleAttribute('data-has-groups', menuHasGroupSurfaces(this));
    if (this.variant !== 'baseline') markMenuTreeEdges(this);
    this.querySelectorAll('k3-menu-item').forEach((el) => {
      const item = el as K3MenuItem;
      if (typeof item.syncSlots === 'function') item.syncSlots();
    });
  }

  private normalizeGaps(): void {
    normalizeMenuGaps(this, {
      variant: this.variant,
      isNormalizing: () => this._normalizing,
      setNormalizing: (v) => {
        this._normalizing = v;
      },
      onSync: () => this.syncGroups(),
    });
  }

  // ── Open / close ──────────────────────────────────────────────────────────

  /**
   * Open the menu. Focus goes to the panel (not an item) so nothing looks
   * hovered until the user presses ↑↓ / Tab.
   * Resolves after viewport fit settles (safe to open submenus afterwards).
   */
  async show(
    focus: 'menu' | 'none' = 'menu',
    opts?: MenuMotionOptions,
  ): Promise<boolean> {
    const fast = Boolean(opts?.fast);
    return this.enqueueMotion(async () => {
      const now = performance.now();
      this._navLockedUntil = now + NAV_LOCK_MS;
      this._pointerIgnoreUntil = now + POINTER_IGNORE_MS;
      return runOpenClose(
        this,
        'open',
        async () => {
          this.normalizeGaps();
          this.visible = true;
          if (fast) {
            this.open = true;
            await this.updateComplete;
            this._pointerIgnoreUntil = performance.now() + POINTER_IGNORE_MS;
            await this.scheduleFit(1);
          } else {
            /*
             * Fit while closed → open → sync-refit before enter motion paints.
             * Pre-open measure alone can flip-above wrongly (hover flash high).
             */
            this.open = false;
            await this.updateComplete;
            await afterPaint();
            this._pointerIgnoreUntil = performance.now() + POINTER_IGNORE_MS;
            await this.scheduleFit(FIT_PASSES);
            this.open = true;
            await this.updateComplete;
            this.fitPanel();
            this._enterLock = true;
            try {
              const panel = this.panelEl();
              if (panel) await waitForMotion(panel);
            } finally {
              this._enterLock = false;
            }
          }
          if (focus === 'menu') this.focusPanel();
        },
        { source: 'user' },
      );
    });
  }

  async hide(
    source: 'user' | 'api' | 'escape' | 'auto' = 'api',
    opts?: MenuMotionOptions,
  ): Promise<boolean> {
    const fast = Boolean(opts?.fast);
    return this.enqueueMotion(async () =>
      runOpenClose(
        this,
        'close',
        async () => {
          this._enterLock = false;
          this.open = false;
          this.visible = false;
          this.removeAttribute('data-submenu-open');
          this.openSubmenuItems().forEach((i) => i.closeSubmenu());
          await this.updateComplete;
          const panel = this.panelEl();
          if (panel && !fast) await waitForMotion(panel);
          this.clearFit();
          this.positioningAnchor = null;
          this.positioningEdge = null;
          if (fast) return;
          this.focusableTrigger()?.focus?.();
        },
        { source },
      ),
    );
  }

  private toggle = (): void => {
    void (this.visible ? this.hide('user') : this.show('menu'));
  };

  private onTriggerClick = (): void => {
    if (this.usesHoverOpen) {
      if (!this.visible) void this.show('none');
      return;
    }
    this.toggle();
  };

  // ── Hover open ────────────────────────────────────────────────────────────

  private clearHoverClose(): void {
    if (!this._hoverCloseTimer) return;
    window.clearTimeout(this._hoverCloseTimer);
    this._hoverCloseTimer = 0;
  }

  private isInMenuTree(node: EventTarget | Node | null): boolean {
    if (!(node instanceof Node)) return false;
    if (this.contains(node)) return true;
    let el: Element | null = node instanceof Element ? node : node.parentElement;
    while (el) {
      if (el === this) return true;
      const root = el.getRootNode();
      if (root instanceof ShadowRoot) {
        if (root.host === this || this.contains(root.host)) return true;
        el = root.host;
        continue;
      }
      el = el.parentElement;
    }
    return this.openSubmenuItems().some((item) => {
      const flyout = item.shadowRoot?.querySelector('.flyout');
      return flyout instanceof Node && flyout.contains(node);
    });
  }

  private scheduleHoverClose(): void {
    this.clearHoverClose();
    this._hoverCloseTimer = window.setTimeout(() => {
      this._hoverCloseTimer = 0;
      if (!this.usesHoverOpen || !this.visible) return;
      void this.hide('user');
    }, HOVER_CLOSE_MS);
  }

  private onHostPointerEnter = (): void => {
    if (!this.usesHoverOpen) return;
    this.clearHoverClose();
    if (this.visible) return;
    void this.show('none');
  };

  private onHostPointerLeave = (e: PointerEvent): void => {
    if (!this.usesHoverOpen) return;
    if (this._enterLock || !this.visible) return;
    if (this.isInMenuTree(e.relatedTarget)) return;
    this.scheduleHoverClose();
  };

  // ── Viewport fit ──────────────────────────────────────────────────────────

  private focusableTrigger(): HTMLElement | null {
    const slotted = this.querySelector<HTMLElement>('[slot="trigger"]');
    if (slotted) {
      return (
        slotted.shadowRoot?.querySelector<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? slotted
      );
    }
    return (this.shadowRoot?.querySelector('[part="trigger"]') as HTMLElement | null) ?? null;
  }

  private triggerAnchor(): HTMLElement {
    const slotted = this.querySelector<HTMLElement>('[slot="trigger"]');
    if (slotted) return slotted;
    const wrap = this.shadowRoot?.querySelector('[part="trigger"]') as HTMLElement | null;
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      if (r.width >= 1 || r.height >= 1) return wrap;
    }
    return this;
  }

  /**
   * Geometry for fit — live positioningAnchor (+ optional edge for side menus),
   * else slotted / host trigger (app-bar menus).
   */
  private resolveFitTrigger(): HTMLElement | DOMRectReadOnly {
    const anchor = this.positioningAnchor;
    if (!anchor?.isConnected) return this.triggerAnchor();

    const item = layoutBoundingRect(anchor);
    const edge = this.positioningEdge;
    if (isSideMenuPosition(this.position) && edge?.isConnected) {
      return sideAnchorRect(item, layoutBoundingRect(edge), this.position, this.isRtl());
    }
    return item;
  }

  private fitPanel = (): void => {
    if (this._enterLock) return;
    if (!this.visible && !this.open) return;
    const panel = this.panelEl();
    if (!panel) return;
    void panel.offsetWidth;
    fitMenuPanel(panel, this.resolveFitTrigger(), this.position, this.isRtl());
    this.openSubmenuItems().forEach((item) => item.repositionFlyout());
  };

  private async scheduleFit(passes = FIT_PASSES): Promise<void> {
    this.bindFitListeners();
    this.fitPanel();
    const n = Math.max(0, passes);
    for (let i = 0; i < n; i++) {
      await afterFrames(1);
      this.fitPanel();
    }
  }

  private bindFitListeners(): void {
    if (this._fitListening) return;
    this._fitListening = true;
    window.addEventListener('resize', this.fitPanel, { passive: true });
    window.addEventListener('scroll', this.fitPanel, true);
    if (typeof ResizeObserver === 'undefined') return;
    this._fitRo?.disconnect();
    this._fitRo = new ResizeObserver(() => this.fitPanel());
    const panel = this.panelEl();
    if (panel) this._fitRo.observe(panel);
    if (this.positioningAnchor?.isConnected) this._fitRo.observe(this.positioningAnchor);
    if (this.positioningEdge?.isConnected) this._fitRo.observe(this.positioningEdge);
  }

  private unbindFitListeners(): void {
    if (!this._fitListening) return;
    this._fitListening = false;
    window.removeEventListener('resize', this.fitPanel);
    window.removeEventListener('scroll', this.fitPanel, true);
    this._fitRo?.disconnect();
    this._fitRo = null;
  }

  private clearFit(): void {
    this.unbindFitListeners();
    const panel = this.panelEl();
    if (panel) clearMenuPanelFit(panel);
  }

  private focusPanel(): void {
    const panel = this.panelEl();
    if (!panel) return;
    if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1;
    try {
      panel.focus({ preventScroll: true });
    } catch {
      panel.focus();
    }
  }

  // ── Event bridges ─────────────────────────────────────────────────────────

  private onItemSelect = (_e: Event): void => {
    haptic.selection();
    if (this.closeOnSelect) void this.hide('user');
  };

  private onSubmenu = (e: Event): void => {
    const detail = (e as CustomEvent<{ open?: boolean }>).detail;
    if (detail?.open) this.setAttribute('data-submenu-open', '');
    else if (!this.openSubmenuItems().length) {
      this.removeAttribute('data-submenu-open');
    }
  };

  private onDocPointer = (e: MouseEvent): void => {
    if (!this.visible) return;
    if (performance.now() < this._pointerIgnoreUntil) return;
    const path = e.composedPath();
    if (path.includes(this)) return;
    if (this.matchesDismissIgnore(path)) return;
    void this.hide('user');
  };

  private matchesDismissIgnore(path: EventTarget[]): boolean {
    const sels = this.dismissIgnore
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!sels.length) return false;
    for (const n of path) {
      if (!(n instanceof Element)) continue;
      for (const sel of sels) {
        try {
          if (n.matches(sel) || n.closest(sel)) return true;
        } catch {
          /* invalid selector */
        }
      }
    }
    return false;
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────

  private onKeydown = (e: KeyboardEvent): void => {
    if (!this.visible) return;
    const path = e.composedPath() as EventTarget[];
    const focused = this.itemFromPath(path);

    if (e.key === 'Escape') {
      e.preventDefault();
      if (focused?.submenuOpen) {
        focused.closeSubmenu();
        focused.focusItem();
        return;
      }
      const parent = focused?.parentElement;
      if (parent instanceof HTMLElement && parent.localName === 'k3-menu-item') {
        (parent as K3MenuItem).closeSubmenu();
        (parent as K3MenuItem).focusItem();
        return;
      }
      void this.hide('escape');
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const closeKey = this.isRtl() ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === closeKey && focused) {
        const parent = focused.parentElement;
        if (parent instanceof HTMLElement && parent.localName === 'k3-menu-item') {
          e.preventDefault();
          (parent as K3MenuItem).closeSubmenu();
          (parent as K3MenuItem).focusItem();
          return;
        }
      }
    }

    const inSubmenu =
      focused?.parentElement instanceof HTMLElement &&
      focused.parentElement.localName === 'k3-menu-item';
    const list = this.levelItems(focused) as HTMLElement[];
    if (!list.length) return;

    if (performance.now() < this._navLockedUntil) {
      e.preventDefault();
      return;
    }

    if (!inSubmenu) {
      const nav = handleFocusNavKey(e, list, {
        orientation: 'vertical',
        wrap: true,
        homeEnd: true,
        tab: true,
        trigger: this.focusableTrigger(),
        triggerPosition: 'end',
        focusItem: (el) => (el as K3MenuItem).focusItem(),
      });
      if (nav.handled) e.preventDefault();
      return;
    }

    const idx = focused ? list.indexOf(focused) : -1;
    const nav = resolveFocusNavKey(e, idx, list.length, {
      orientation: 'vertical',
      wrap: true,
      homeEnd: true,
      tab: true,
    });
    if (!nav.handled) return;
    e.preventDefault();
    (list[nav.nextIndex] as K3MenuItem | undefined)?.focusItem();
  };

  private onTriggerKeydown = (e: KeyboardEvent): void => {
    if (this.visible) return;
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      e.preventDefault();
      e.stopPropagation();
      void this.show('menu');
    }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('pointerdown', this.onDocPointer, true);
    this.addEventListener('keydown', this.onKeydown);
    this.addEventListener('k3-select', this.onItemSelect as EventListener);
    this.addEventListener('k3-submenu', this.onSubmenu as EventListener);
    this.addEventListener('pointerenter', this.onHostPointerEnter);
    this.addEventListener('pointerleave', this.onHostPointerLeave);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearHoverClose();
    this.clearFit();
    document.removeEventListener('pointerdown', this.onDocPointer, true);
    this.removeEventListener('keydown', this.onKeydown);
    this.removeEventListener('k3-select', this.onItemSelect as EventListener);
    this.removeEventListener('k3-submenu', this.onSubmenu as EventListener);
    this.removeEventListener('pointerenter', this.onHostPointerEnter);
    this.removeEventListener('pointerleave', this.onHostPointerLeave);
  }

  override firstUpdated(): void {
    this.normalizeGaps();
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    slot?.addEventListener('slotchange', () => this.normalizeGaps());
  }

  override render() {
    return html`
      <span part="trigger" @click=${this.onTriggerClick} @keydown=${this.onTriggerKeydown}>
        <slot name="trigger"></slot>
      </span>
      <div
        class=${classMap({
          panel: true,
          open: this.open,
          [this.position]: true,
        })}
        part="menu"
        role="menu"
        tabindex="-1"
      >
        <div class="list k3-scroll" part="list">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

export default K3Menu;