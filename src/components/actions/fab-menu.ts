import { html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  annotateFocusNavResult,
  buildFocusNavLoop,
  deepActiveElement,
  focusElement,
  indexInFocusNavLoop,
  isFocusWithinHost,
  resolveFocusNavKey,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import './fab.js';
import K3FabMenuItem from './fab-menu-item.js';
import {
  FabMenuSpecs,
  fabMenuClipBounds,
  fabMenuEstimateHeightDp,
  fabMenuFindClipElement,
  fabMenuIsTrailingRight,
  fabMenuItemDelayMs,
  fabMenuMaxDurationMs,
  fabMenuResolvePhase,
  fabMenuResolveSide,
  fabMenuSlotRem,
  type FabMenuPhase,
  type FabMenuPlacement,
  type FabMenuSide,
  type FabMenuSize,
  type FabMenuVariant,
} from './fab-menu.specs.js';
import { fabMenuStyles } from './fab-menu.styles.js';

export type {
  FabMenuPhase,
  FabMenuPlacement,
  FabMenuSide,
  FabMenuSize,
  FabMenuVariant,
} from './fab-menu.specs.js';
export { FabMenuSpecs } from './fab-menu.specs.js';

/**
 * Material 3 Expressive FAB menu — labeled pills from the trailing edge.
 *
 * - Host footprint = FAB only; menu is absolute (trigger never layout-shifts)
 * - Collision flip on open / resize (natural height — never clamp into the FAB)
 * - Trigger retracts toward pills (pin top if menu above, pin bottom if below)
 * - Exclusive open; outside click / Escape dismiss
 *
 * @see https://m3.material.io/components/fab-menu/overview
 * @see ./fab-menu.specs.ts
 */
export class K3FabMenu extends K3Element {
  static override styles = [hostReset, fabMenuStyles];

  /** At most one open menu — opening another dismisses the current. */
  private static activeMenu: K3FabMenu | null = null;

  private static nextFrame(): Promise<void> {
    return new Promise((r) => requestAnimationFrame(() => r()));
  }

  // ── Public API ──────────────────────────────────────────────────────────

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ reflect: true }) variant: FabMenuVariant = 'primary';
  /** Closed trigger: `default` 56 · `medium` 80 · `large` 96. */
  @property({ reflect: true }) size: FabMenuSize = 'default';
  /** Trailing = `*-end` (LTR right / RTL left). */
  @property({ reflect: true }) placement: FabMenuPlacement = 'bottom-end';
  @property({ type: Boolean, reflect: true }) fixed = false;
  @property({ type: Boolean, reflect: true }) contained = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  // ── Internal state ──────────────────────────────────────────────────────

  @state() private phase: FabMenuPhase = 'closed';
  @state() private menuSide: FabMenuSide = 'above';

  private bootstrapped = false;
  private motionGen = 0;
  private flipReplayGen = 0;
  private phaseTimer: number | null = null;
  private phaseWaitResolve: (() => void) | null = null;
  private dirObserver?: MutationObserver;
  private onDocPointer?: (e: Event) => void;
  private onKey?: (e: KeyboardEvent) => void;
  private onLayout?: () => void;
  private layoutClipEl: HTMLElement | null = null;
  /** Roving: `0..n-1` items, `n` = FAB, `-1` = not in loop yet. */
  private focusIndex = -1;
  private restoreFocusEl: HTMLElement | null = null;
  private itemCountWarned = false;

  private readonly onHostKeydown = (e: KeyboardEvent): void => this.handleArrowNav(e);
  private readonly onFocusIn = (): void => {
    if (!this.menuOpen) return;
    const idx = this.resolveFocusIndex();
    if (idx >= 0 && idx !== this.focusIndex) {
      this.focusIndex = idx;
      this.syncRovingTab();
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  private get menuOpen(): boolean {
    return this.phase !== 'closed';
  }

  /** Close affordance (56 / round / X) while open or opening — morphs back on closing. */
  private get triggerExpanded(): boolean {
    return this.phase === 'open' || this.phase === 'opening';
  }

  private get triggerSize(): FabMenuSize {
    return this.triggerExpanded ? FabMenuSpecs.closeSize : this.size;
  }

  private get items(): K3FabMenuItem[] {
    return [...this.querySelectorAll<K3FabMenuItem>('k3-fab-menu-item')];
  }

  private get enabledItems(): K3FabMenuItem[] {
    return this.items.filter((el) => !el.disabled);
  }

  private get rtl(): boolean {
    return getComputedStyle(this).direction === 'rtl';
  }

  private get bottomPlacement(): boolean {
    return this.placement.startsWith('bottom');
  }

  private get fabEl(): HTMLElement | null {
    return this.renderRoot.querySelector('k3-fab');
  }

  /** Items + close FAB (trigger at end) — shared focus-nav loop. */
  private focusLoop() {
    const fab = this.fabEl;
    return buildFocusNavLoop(
      this.enabledItems as HTMLElement[],
      fab,
      'end',
    );
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onHostKeydown);
    this.addEventListener('focusin', this.onFocusIn);
    this.attachDismiss();
    this.dirObserver = new MutationObserver(() => this.resync());
    this.dirObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });
  }

  override firstUpdated(): void {
    this.bootstrapped = true;
    queueMicrotask(() => this.syncItems(this.open ? 'open' : 'closed'));
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this.bootstrapped) return;
    if (changed.has('open') && this.open !== this.menuOpen) {
      void (this.open ? this.show() : this.hide('api'));
    }
    if (changed.has('placement') || changed.has('size')) {
      queueMicrotask(() => this.resync());
    }
  }

  override disconnectedCallback(): void {
    this.clearPhaseTimer();
    this.removeEventListener('keydown', this.onHostKeydown);
    this.removeEventListener('focusin', this.onFocusIn);
    this.dirObserver?.disconnect();
    this.dirObserver = undefined;
    this.detachDismiss();
    this.detachLayoutWatch();
    this.releaseActive();
    super.disconnectedCallback();
  }

  // ── Public open / close ─────────────────────────────────────────────────

  async show(): Promise<boolean> {
    if (this.phase === 'open' || this.phase === 'opening') return true;
    this.claimActive();
    const gen = ++this.motionGen;
    this.clearPhaseTimer();
    return runOpenClose(
      this,
      'open',
      async () => {
        this.focusIndex = -1;
        /*
         * Pin toward menu while FAB still fills the slot (align no-ops visually),
         * then morph — avoids first-paint jump and retracts toward the pills.
         */
        this.applyMenuSide(this.computeMenuSide());
        await this.updateComplete;
        if (gen !== this.motionGen) return;
        await K3FabMenu.nextFrame();
        if (gen !== this.motionGen) return;
        this.open = true;
        await this.playEnterMotion(() => gen === this.motionGen);
        if (gen !== this.motionGen) return;
        /* Re-measure after pills laid out — flip if estimate was short */
        const settled = this.computeMenuSide();
        if (settled !== this.menuSide) {
          this.applyMenuSide(settled);
          await this.playEnterMotion(() => gen === this.motionGen);
          if (gen !== this.motionGen) return;
        }
        this.attachLayoutWatch();
      },
      { source: 'user' },
    );
  }

  async hide(source: 'user' | 'api' | 'escape' | 'auto' = 'api'): Promise<boolean> {
    if (this.phase === 'closed' || this.phase === 'closing') return true;
    this.detachLayoutWatch();
    this.flipReplayGen += 1;
    const gen = ++this.motionGen;
    this.clearPhaseTimer();
    this.rememberFocus();
    return runOpenClose(
      this,
      'close',
      async () => {
        this.syncItems('closing');
        await this.updateComplete;
        if (gen !== this.motionGen) return;
        this.pulseSpring('close');
        await this.waitPhase(fabMenuMaxDurationMs('closing', this.items.length));
        if (gen !== this.motionGen) return;
        await K3FabMenu.nextFrame();
        if (gen !== this.motionGen) return;
        this.settleClosed(source !== 'auto');
      },
      { source },
    );
  }

  // ── Enter motion (shared by show + live flip) ───────────────────────────

  /** Opening phase → spring → wait → settle open. `alive` gates interrupts. */
  private async playEnterMotion(alive: () => boolean): Promise<void> {
    this.syncItems('opening');
    await this.updateComplete;
    if (!alive()) return;
    this.pulseSpring('open');
    this.syncRovingTab();
    await this.waitPhase(fabMenuMaxDurationMs('opening', this.items.length));
    if (!alive()) return;
    await K3FabMenu.nextFrame();
    if (!alive()) return;
    this.syncItems('open');
    this.clearSpring();
  }

  private async replayOpenAfterFlip(): Promise<void> {
    const flip = ++this.flipReplayGen;
    const motion = ++this.motionGen;
    this.clearPhaseTimer();
    await this.playEnterMotion(
      () => flip === this.flipReplayGen && motion === this.motionGen,
    );
  }

  // ── Collision / flip ────────────────────────────────────────────────────

  private collisionClip(): { top: number; bottom: number; el: HTMLElement | null } {
    /* Ancestor (demo-frame / overflow) ∩ viewport — restores off-screen flip. */
    const el = fabMenuFindClipElement(this);
    const clipEl = el && el !== this ? el : null;
    const { top, bottom } = fabMenuClipBounds(clipEl);
    return { top, bottom, el: clipEl };
  }

  private menuHeightPx(): number {
    const menu = this.renderRoot.querySelector('.menu');
    if (menu instanceof HTMLElement && this.menuOpen) {
      const h = menu.scrollHeight;
      if (h > 0) return h;
    }
    return fabMenuEstimateHeightDp(this.items.length);
  }

  private computeMenuSide(): FabMenuSide {
    const rect = this.getBoundingClientRect();
    const clip = this.collisionClip();
    return fabMenuResolveSide(
      this.bottomPlacement,
      rect.top,
      rect.bottom,
      this.menuHeightPx(),
      FabMenuSpecs.fabGapDp,
      clip.top,
      clip.bottom,
    );
  }

  private applyMenuSide(side: FabMenuSide): void {
    this.menuSide = side;
    this.setAttribute('data-menu-side', side);
  }

  private clearMenuSide(): void {
    this.menuSide = this.bottomPlacement ? 'above' : 'below';
    this.removeAttribute('data-menu-side');
  }

  private attachLayoutWatch(): void {
    if (this.onLayout) return;
    this.onLayout = () => this.checkFlipWhileOpen();
    window.addEventListener('resize', this.onLayout, { passive: true });
    window.addEventListener('scroll', this.onLayout, { passive: true, capture: true });
    const { el } = this.collisionClip();
    this.layoutClipEl = el;
    el?.addEventListener('scroll', this.onLayout, { passive: true });
  }

  private detachLayoutWatch(): void {
    if (!this.onLayout) return;
    window.removeEventListener('resize', this.onLayout);
    window.removeEventListener('scroll', this.onLayout, true);
    this.layoutClipEl?.removeEventListener('scroll', this.onLayout);
    this.layoutClipEl = null;
    this.onLayout = undefined;
  }

  private checkFlipWhileOpen(): void {
    if (this.phase !== 'open') return;
    const next = this.computeMenuSide();
    if (next === this.menuSide) return;
    /* Flip side only — natural height, no max-height clamp into the FAB. */
    this.applyMenuSide(next);
    void this.replayOpenAfterFlip();
  }

  // ── Phase sync / spring ─────────────────────────────────────────────────

  private syncItems(phase: FabMenuPhase): void {
    const list = this.items;
    const n = list.length;
    this.warnItemCountIfNeeded();
    const origin = fabMenuIsTrailingRight(this.placement, this.rtl)
      ? 'right center'
      : 'left center';
    const menuAbove = this.menuSide === 'above';

    /* *-start → icon at end of line (outer edge); *-end → icon at inline-start */
    const iconAtEnd = this.placement.endsWith('start');

    for (let i = 0; i < n; i++) {
      const el = list[i]!;
      el.style.setProperty('--k3-fab-menu-origin', origin);
      if (phase === 'opening' || phase === 'closing') {
        el.style.setProperty(
          '--k3-fab-menu-item-delay',
          `${fabMenuItemDelayMs(phase, i, n, menuAbove)}ms`,
        );
      } else {
        el.style.removeProperty('--k3-fab-menu-item-delay');
      }
      el.toggleAttribute('data-icon-end', iconAtEnd);
      el.setAttribute('data-phase', phase);
    }

    this.phase = phase;
    this.style.setProperty('--k3-fab-slot-size', fabMenuSlotRem(this.size));
    this.syncRovingTab();
  }

  private resync(): void {
    this.syncItems(fabMenuResolvePhase(this.menuOpen, this.phase));
  }

  private pulseSpring(kind: 'open' | 'close'): void {
    const fab = this.fabEl;
    if (!fab) return;
    fab.removeAttribute('data-spring');
    void fab.offsetWidth;
    fab.setAttribute('data-spring', kind === 'close' ? 'close' : 'open');
  }

  private clearSpring(): void {
    this.fabEl?.removeAttribute('data-spring');
  }

  private warnItemCountIfNeeded(): void {
    const n = this.items.length;
    if (this.itemCountWarned || n === 0) return;
    if (n < FabMenuSpecs.minItems || n > FabMenuSpecs.maxItems) {
      this.itemCountWarned = true;
      console.warn(
        `[k3-fab-menu] M3 recommends ${FabMenuSpecs.minItems}–${FabMenuSpecs.maxItems} items (got ${n}).`,
      );
    }
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer != null) {
      window.clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    const resolve = this.phaseWaitResolve;
    this.phaseWaitResolve = null;
    resolve?.();
  }

  private waitPhase(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.phaseWaitResolve = resolve;
      this.phaseTimer = window.setTimeout(() => {
        this.phaseTimer = null;
        this.phaseWaitResolve = null;
        resolve();
      }, ms);
    });
  }

  // ── Exclusive open / settle ─────────────────────────────────────────────

  private claimActive(): void {
    const prev = K3FabMenu.activeMenu;
    if (prev && prev !== this) void prev.hide('auto');
    K3FabMenu.activeMenu = this;
  }

  private releaseActive(): void {
    if (K3FabMenu.activeMenu === this) K3FabMenu.activeMenu = null;
  }

  private settleClosed(restoreFocus = true): void {
    this.open = false;
    this.focusIndex = -1;
    this.clearSpring();
    this.clearMenuSide();
    this.syncItems('closed');
    this.releaseActive();
    if (restoreFocus) this.restoreFocus();
    else this.restoreFocusEl = null;
  }

  private rememberFocus(): void {
    this.restoreFocusEl = this.fabEl;
  }

  private restoreFocus(): void {
    const fab = this.restoreFocusEl ?? this.fabEl;
    this.restoreFocusEl = null;
    const btn = fab?.shadowRoot?.querySelector<HTMLElement>('button');
    const target = btn ?? fab;
    if (!target) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }

  // ── Focus / keyboard ────────────────────────────────────────────────────

  private fabButton(): HTMLButtonElement | null {
    return this.fabEl?.shadowRoot?.querySelector('button') ?? null;
  }

  private syncRovingTab(): void {
    const loop = this.focusLoop();
    const inLoop = this.menuOpen && this.focusIndex >= 0;
    const entry = inLoop ? loop[this.focusIndex] : undefined;
    const onFab = entry?.type === 'trigger';
    this.enabledItems.forEach((el, i) => {
      const onItem = inLoop && !onFab && entry?.type === 'item' && entry.itemIndex === i;
      el.setItemTabIndex(onItem ? 0 : -1);
    });
    this.items.forEach((el) => {
      if (el.disabled) el.setItemTabIndex(-1);
    });
    const fabBtn = this.fabButton();
    if (fabBtn) {
      fabBtn.tabIndex = !this.menuOpen || onFab || this.focusIndex < 0 ? 0 : -1;
    }
  }

  private focusAt(index: number, moveFocus = true): void {
    const loop = this.focusLoop();
    const total = loop.length;
    if (total <= 0) return;
    this.focusIndex = ((index % total) + total) % total;
    this.syncRovingTab();
    if (!moveFocus) return;
    const entry = loop[this.focusIndex];
    if (!entry) return;
    if (entry.type === 'trigger') {
      focusElement(this.fabButton() ?? undefined);
    } else {
      (entry.el as { focusItem?: () => void }).focusItem?.();
    }
  }

  private resolveFocusIndex(): number {
    const loop = this.focusLoop();
    const idx = indexInFocusNavLoop(loop, deepActiveElement());
    return idx >= 0 ? idx : this.focusIndex;
  }

  /** Arrows / Tab / Home / End — shared focus-nav (items + close FAB trigger). */
  private handleArrowNav(e: KeyboardEvent): void {
    /* Host + menu + document all listen — only navigate once per event */
    const mark = e as KeyboardEvent & { __k3FocusNav?: boolean };
    if (mark.__k3FocusNav) return;
    if (!this.menuOpen || this.disabled) return;
    const loop = this.focusLoop();
    if (!loop.length) return;
    if (!isFocusWithinHost(this, deepActiveElement())) return;

    let cur = this.resolveFocusIndex();
    if (cur < 0) cur = loop.length - 1; /* default: trigger (close FAB) */

    const nav = annotateFocusNavResult(
      resolveFocusNavKey(e, cur, loop.length, {
        orientation: 'both',
        wrap: true,
        homeEnd: true,
        tab: true,
      }),
      loop,
    );
    if (!nav.handled) return;

    mark.__k3FocusNav = true;
    e.preventDefault();
    e.stopPropagation();
    this.focusAt(nav.nextIndex, true);
  }

  // ── Dismiss ─────────────────────────────────────────────────────────────

  private eventFromSelf(e: Event): boolean {
    return e.composedPath().some((n) => n === this);
  }

  private attachDismiss(): void {
    if (this.onDocPointer) return;
    this.onDocPointer = (e: Event) => {
      if (!this.menuOpen) return;
      if (!this.eventFromSelf(e)) void this.hide('user');
    };
    this.onKey = (e: KeyboardEvent) => {
      if (!this.menuOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        void this.hide('escape');
        return;
      }
      this.handleArrowNav(e);
    };
    document.addEventListener('pointerdown', this.onDocPointer, true);
    document.addEventListener('keydown', this.onKey, true);
  }

  private detachDismiss(): void {
    if (this.onDocPointer) document.removeEventListener('pointerdown', this.onDocPointer, true);
    if (this.onKey) document.removeEventListener('keydown', this.onKey, true);
    this.onDocPointer = undefined;
    this.onKey = undefined;
  }

  private toggle = (): void => {
    if (this.disabled) return;
    void (this.triggerExpanded ? this.hide('user') : this.show());
  };

  private onMenuClick = (e: Event): void => {
    if ((e.target as HTMLElement).closest('k3-fab-menu-item')) void this.hide('user');
  };

  private onMenuKeydown = (e: KeyboardEvent): void => {
    this.handleArrowNav(e);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  override render() {
    const { menuOpen, triggerExpanded, triggerSize, phase } = this;
    return html`
      <div
        class=${classMap({
      menu: true,
      open: menuOpen,
      closing: phase === 'closing',
    })}
        part="menu"
        role="menu"
        aria-orientation="vertical"
        @click=${this.onMenuClick}
        @keydown=${this.onMenuKeydown}
      >
        <slot @slotchange=${() => queueMicrotask(() => this.resync())}></slot>
      </div>
      <div class="fab-slot" part="fab-slot">
        <k3-fab
          part="fab"
          size=${triggerSize}
          variant=${this.variant}
          ?round=${triggerExpanded}
          ?disabled=${this.disabled}
          aria-expanded=${String(menuOpen)}
          aria-haspopup="menu"
          @k3-click=${this.toggle}
        >
          <span class="trigger-icon" slot="icon" part="trigger-icon">
            <span
              class=${classMap({
      'icon-rotator': true,
      expanded: triggerExpanded,
      opening: phase === 'opening',
      closing: phase === 'closing',
    })}
              part="icon-rotator"
            >
              <span class="icon-face plus" aria-hidden=${String(triggerExpanded)}>
                <slot name="icon"
                  ><span
                    class="notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon="add"
                    aria-hidden="true"
                  ></span
                ></slot>
              </span>
              <span
                class="icon-face close notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon="close"
                aria-hidden=${String(!triggerExpanded)}
              ></span>
            </span>
          </span>
          <span class="sr-only">${i18n.t('fab.menu')}</span>
      </k3-fab>
      </div>
    `;
  }
}

export default K3FabMenu;
