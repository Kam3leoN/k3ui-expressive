import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  emitLifecycle,
  stateLayerStyles,
  hasSlot,
  prefersReducedMotion,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  armNavActive,
  findMarkedNavIndex,
  navItemFromEvent,
  queryNavItems,
  queryNavItemsForLayout,
  type ArmNavHandle,
} from './nav-selection.js';
import { navRailStyles } from './nav-rail.styles.js';
import { NavRailCurve } from './nav-rail-curve.js';
import { isFluidMotionActive } from '../../motion/fluid.js';

/** Width / destination layout */
export type NavRailSize = 'compact' | 'large';
/**
 * Expanded chrome — M3 Expressive
 * (@see https://m3.material.io/components/navigation-rail/specs).
 * - `modal` (default) — overlays content; flush to the start edge; end-side corners only
 * - `standard` — beside content; no inset sheet (flush rail, no inner container radius)
 * - `xr` — spatial / XR orbiter: floating pill, inset from the screen edge
 *   (@see https://m3.material.io/foundations/xr/components/nav-rail)
 */
export type NavRailLayout = 'standard' | 'modal' | 'xr';
/** @deprecated use `layout` */
export type NavRailAppearance = NavRailLayout;
/** Leading destinations group alignment */
export type NavRailPosition = 'start' | 'center' | 'bottom';
/**
 * FAB placement when `layout="xr"`.
 * - `contained` (default) — FAB inside the floating pill
 * - `spatialized` — FAB floats above the pill (separate orbiter)
 */
export type NavRailFabPlacement = 'contained' | 'spatialized';
/** @deprecated use size / expanded */
export type NavRailMode = 'compact' | 'expanded';

/** Fallback if `transitionend` is skipped (tab backgrounded / display:none). */
const WIDTH_SETTLE_FALLBACK_MS = 700;

/**
 * Navigation rail — mid/expanded windows (≥600dp).
 *
 * - **size** `compact` (96dp M3E, icon above label) · `large` (280dp rows, 220–360)
 * - **expanded** mirrors large — toggle via **collapsible** (`menu` / `menu_open`)
 * - **layout** `modal` (default) · `standard` · `xr` (spatial floating pill)
 * - **fab-placement** `contained` · `spatialized` (XR only)
 * - **position** `start` · `center` · `bottom` — leading destinations group
 * - Slots **leading** (or default) · **trailing** (bottom + divider) · **fab**
 *
 * Compact + expanded use elevation level 1 (no end border); XR uses surface
 * color + full pill corners (no 2D shadow — XR elevation is Z-depth / color).
 * Expand/collapse morph mirrors Android NavigationRailView:
 * dual labels crossfade (200ms) + width decelerate (500ms); items stay
 * `layout=horizontal` during collapse flight, then settle to vertical.
 * Extended FAB morphs via `data-rail-collapsed`.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://bug-on-m3.vercel.app/components/navigation-rail
 * @see https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/navigationrail/NavigationRailView.java
 */
export class K3NavRail extends K3Element {
  static override styles = [hostReset, stateLayerStyles, navRailStyles];

  @property({ type: Number }) active = 0;
  /** compact (96dp) · large (280dp expanded, clamped 220–360) */
  @property({ reflect: true }) size: NavRailSize = 'compact';
  /**
   * Collapsed only — use the narrow 80dp token instead of 96dp
   * (`md.comp.nav-rail.collapsed.narrow.container.width`).
   */
  @property({ type: Boolean, reflect: true }) narrow = false;
  /**
   * Chrome: `modal` (default) · `standard` · `xr` (spatial floating pill).
   * Alias attribute value `spatial` maps to `xr`.
   */
  @property({ reflect: true }) layout: NavRailLayout = 'modal';
  /**
   * @deprecated use `layout` — attribute `appearance` still accepted (maps to layout).
   */
  @property({ attribute: 'appearance' }) appearance: NavRailAppearance | null = null;
  /** Leading destinations alignment: start · center · bottom */
  @property({ reflect: true }) position: NavRailPosition = 'start';
  /**
   * XR only — FAB inside the pill (`contained`) or floating above (`spatialized`).
   */
  @property({ reflect: true, attribute: 'fab-placement' })
  fabPlacement: NavRailFabPlacement = 'contained';
  /**
   * Expanded rail (large destinations + extended FAB).
   * Synced with `size="large"` / deprecated `mode="expanded"`.
   */
  @property({ type: Boolean, reflect: true }) expanded = false;
  /** Show menu / menu_open toggle above the FAB. */
  @property({ type: Boolean, reflect: true }) collapsible = false;
  /** @deprecated alias of size — expanded → large */
  @property({ reflect: true }) mode: NavRailMode = 'compact';

  private ready = false;
  private arm: ArmNavHandle | null = null;
  /** True while collapse width spring is in flight (`data-collapsing` reflected). */
  private collapsing = false;
  /** True while expand width spring is in flight (`data-morphing=in`). */
  private expanding = false;
  private collapseTimer = 0;
  /** Fluid: curved opening edge during the width flight (all layouts). */
  private readonly curve = new NavRailCurve(this, () => this.curveSurface());
  /** Slot `fab` content — tracked via slotchange (hasSlot is false on first paint). */
  @state() private hasFab = false;
  /** Slot `trailing` / deprecated `foot`. */
  @state() private hasTrailing = false;

  /** Width spring ms for the active motion scheme (+ buffer). Covers fluid 610ms. */
  private morphSettleMs(): number {
    const raw = getComputedStyle(this).getPropertyValue('--k3-nav-rail-motion').trim();
    const ms = Number.parseFloat(raw);
    if (Number.isFinite(ms) && ms > 0) return Math.ceil(ms + 120);
    return WIDTH_SETTLE_FALLBACK_MS;
  }

  /** Layout width — `size` (+ deprecated `mode`) is the source of truth. */
  private resolvedSize(): NavRailSize {
    return this.mode === 'expanded' || this.size === 'large' ? 'large' : 'compact';
  }

  private isExpanded(): boolean {
    return this.resolvedSize() === 'large';
  }

  private resolvedLayout(): NavRailLayout {
    const raw = (this.layout || 'modal') as string;
    if (raw === 'standard') return 'standard';
    if (raw === 'xr' || raw === 'spatial') return 'xr';
    return 'modal';
  }

  private clearCollapseTimer(): void {
    if (!this.collapseTimer) return;
    window.clearTimeout(this.collapseTimer);
    this.collapseTimer = 0;
  }

  /** Clear expand/collapse flight flags (+ optional width listener). */
  private clearMorphFlags(opts?: { keepCollapsing?: boolean }): void {
    if (!opts?.keepCollapsing) {
      this.collapsing = false;
      this.removeAttribute('data-collapsing');
    }
    this.expanding = false;
    this.removeAttribute('data-stack-in');
    this.removeAttribute('data-expanding');
    this.removeAttribute('data-morphing');
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
  }

  private clearCollapseArm(): void {
    this.clearMorphFlags();
  }

  private onWidthTransitionEnd = (e: TransitionEvent): void => {
    if (e.target !== this || e.propertyName !== 'width') return;
    if (this.collapsing) this.settleCollapse();
    else if (this.expanding) this.settleExpand();
  };

  /** End expand flight — drop fluid jelly / morph flags after width spring. */
  private settleExpand(): void {
    if (!this.expanding) return;
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    this.expanding = false;
    this.removeAttribute('data-morphing');
    this.removeAttribute('data-expanding');
  }

  private async waitNavItemsPainted(): Promise<void> {
    await this.updateComplete;
    await Promise.all(
      queryNavItemsForLayout(this).map((el) =>
        'updateComplete' in el
          ? (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete
          : Promise.resolve(),
      ),
    );
  }

  /**
   * Finish collapse: flip to vertical while `data-collapsing` still holds the
   * tucked geometry, wait for Lit to reflect `layout`, then clear the flag —
   * avoids one frame of horizontal padding/shell (vertical jump).
   */
  private settleCollapse(): void {
    if (!this.collapsing) return;
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    void this.finishCollapseLayout();
  }

  private async finishCollapseLayout(): Promise<void> {
    if (!this.isExpanded()) {
      this.syncItemLayout();
      await this.waitNavItemsPainted();
    }
    if (this.isExpanded()) return;
    this.collapsing = false;
    this.removeAttribute('data-collapsing');
    this.removeAttribute('data-stack-in');
    this.removeAttribute('data-morphing');
  }

  /**
   * Collapse flight — keep items horizontal for dual-label crossfade
   * (Android: fade expanded → fade collapsed, then ChangeBounds).
   * `data-stack-in` releases the stack-label rise after one tucked paint.
   */
  private armCollapseSettle(): void {
    if (prefersReducedMotion()) {
      this.clearMorphFlags();
      this.syncItemLayout();
      return;
    }
    this.setAttribute('data-morphing', 'out');
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.addEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    this.collapseTimer = window.setTimeout(
      () => this.settleCollapse(),
      this.morphSettleMs(),
    );
    this.removeAttribute('data-stack-in');
    void this.offsetWidth;
    requestAnimationFrame(() => {
      if (this.collapsing) this.setAttribute('data-stack-in', '');
    });
  }

  /**
   * Expand flight — paint tucked start (`data-expanding` + horizontal),
   * commit Lit, then release tuck so width spring + label crossfade run.
   * `data-morphing=in` lasts the full width spring (fluid jelly / scheme settle).
   */
  private async armExpandMorph(): Promise<void> {
    this.clearMorphFlags();
    this.expanding = true;
    this.setAttribute('data-morphing', 'in');
    this.setAttribute('data-expanding', '');
    this.size = 'large';
    this.expanded = true;
    this.syncItemLayout();
    this.syncFabMorph(true, false);
    if (prefersReducedMotion()) {
      this.settleExpand();
      return;
    }
    await this.waitNavItemsPainted();
    void this.offsetWidth;
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.addEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    this.collapseTimer = window.setTimeout(
      () => this.settleExpand(),
      this.morphSettleMs(),
    );
    requestAnimationFrame(() => {
      /* Release tuck frame — morphing stays until width spring ends. */
      if (this.isExpanded()) this.removeAttribute('data-expanding');
    });
  }

  /** Element painting the rail surface — `.xr-shell` when spatialized, else `.rail`. */
  private curveSurface(): HTMLElement | null {
    const spatialized =
      this.resolvedLayout() === 'xr' && this.fabPlacement === 'spatialized';
    return this.renderRoot.querySelector<HTMLElement>(spatialized ? '.xr-shell' : '.rail');
  }

  /** Fluid scheme: opening edge curves (outward on expand, inward on collapse). */
  private startCurve(): void {
    if (!isFluidMotionActive()) return;
    this.curve.start(this.morphSettleMs() + 200);
  }

  /** Flip collapsed ↔ expanded (collapsible toggle). */
  private setExpanded(next: boolean): void {
    if (this.isExpanded() === next) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user', expanded: next })) return;
    if (next) {
      void this.armExpandMorph();
    } else {
      /* Arm collapsing before size change so updated() skips vertical sync. */
      this.expanding = false;
      this.collapsing = true;
      this.removeAttribute('data-stack-in');
      this.removeAttribute('data-expanding');
      this.removeAttribute('data-morphing');
      this.setAttribute('data-collapsing', '');
      /* Lock FAB from the still-expanded paint, then shrink the rail. */
      this.syncFabMorph(true, true);
      this.size = 'compact';
      this.expanded = false;
      if (this.mode === 'expanded') this.mode = 'compact';
      this.armCollapseSettle();
    }
    this.startCurve();
    emitLifecycle(this, 'change-end', { source: 'user', expanded: next });
    this.emit('k3-expand', { expanded: next });
  }

  /** Reflect `expanded` from resolved size (size/mode win). */
  private syncExpandedAttr(): void {
    const next = this.isExpanded();
    if (this.expanded !== next) this.expanded = next;
  }

  private syncItemLayout(): void {
    const layout = this.resolvedSize() === 'large' ? 'horizontal' : 'vertical';
    /* Include data-nav-aux — excluded from selection, not from layout */
    for (const el of queryNavItemsForLayout(this)) el.layout = layout;
  }

  private applyActive(animate: boolean): void {
    this.arm?.cancel();
    this.arm = armNavActive(queryNavItems(this), this.active, animate);
  }

  private onClick = (e: Event): void => {
    const t = navItemFromEvent(e, this);
    if (!t) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user' })) return;
    const idx = queryNavItems(this).indexOf(t);
    if (idx < 0 || idx === this.active) return;
    this.active = idx;
    emitLifecycle(this, 'change-end', { source: 'user', index: this.active });
    this.emit('k3-change', { index: this.active });
  };

  private onToggle = (e: Event): void => {
    e.stopPropagation();
    e.preventDefault();
    this.setExpanded(!this.isExpanded());
  };

  private syncFabSlot = (): void => {
    this.hasFab = hasSlot(this, 'fab');
    /* Animate only after boot — first paint must be instant compact/expanded */
    this.syncFabMorph(this.ready);
  };

  private syncTrailingSlot = (): void => {
    this.hasTrailing = hasSlot(this, 'trailing') || hasSlot(this, 'foot');
  };

  /** True for the extended FAB that owns the rail pill↔square morph. */
  private isRailMorphFab(el: HTMLElement): boolean {
    return el.localName === 'k3-extended-fab' || el.classList.contains('rail-fab-extended');
  }

  /**
   * Drive extended-FAB rail morph (pill ↔ square) via setRailCollapsed.
   * @param animate false on first paint so compact boot isn’t a flash morph
   * @param collapsed override — pass explicitly during expand/collapse flight
   *   before `size` flips (FAB must measure while still painted expanded)
   */
  private syncFabMorph(animate = true, collapsed = !this.isExpanded()): void {
    for (const el of this.querySelectorAll<HTMLElement>(':scope > [slot="fab"]')) {
      if (!this.isRailMorphFab(el)) continue;
      const fab = el as HTMLElement & {
        setRailCollapsed?: (c: boolean, a?: boolean) => void;
      };
      if (typeof fab.setRailCollapsed === 'function') {
        fab.setRailCollapsed(collapsed, animate);
      } else {
        el.toggleAttribute('data-rail-collapsed', collapsed);
      }
    }
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('expanded') && !changed.has('size') && this.mode !== 'expanded') {
      this.size = this.expanded ? 'large' : 'compact';
    }
    if (changed.has('appearance') && !changed.has('layout') && this.appearance) {
      this.layout = this.appearance === 'spatial' ? 'xr' : this.appearance;
    }
    /* Accept layout="spatial" as an XR alias. */
    if (changed.has('layout') && (this.layout as string) === 'spatial') {
      this.layout = 'xr';
    }
  }

  override firstUpdated(): void {
    const marked = findMarkedNavIndex(queryNavItems(this));
    if (marked >= 0) this.active = marked;
    this.syncFabSlot();
    this.syncTrailingSlot();
    this.syncExpandedAttr();
    this.syncFabMorph(false);
    this.syncItemLayout();
    this.applyActive(true);
    this.ready = true;
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this.ready) return;
    const sizeChanged =
      changed.has('size') || changed.has('mode') || changed.has('expanded');
    if (sizeChanged) {
      this.syncExpandedAttr();
      this.syncFabMorph();
      /* During collapse flight, keep horizontal so dual-label morph can run. */
      if (this.isExpanded() || !this.collapsing) this.syncItemLayout();
    }
    if (sizeChanged || changed.has('active')) {
      this.applyActive(changed.has('active'));
    }
  }

  override disconnectedCallback(): void {
    this.arm?.cancel();
    this.clearCollapseArm();
    this.curve.stop();
    super.disconnectedCallback();
  }

  override render() {
    const large = this.isExpanded();
    const chrome = this.resolvedLayout();
    const xr = chrome === 'xr';
    const fabPlacement = xr ? this.fabPlacement : 'contained';
    const spatialized = xr && fabPlacement === 'spatialized';
    const toggleLabel = large ? 'Collapse navigation' : 'Expand navigation';
    const toggle = this.collapsible
      ? html`<button
          type="button"
          class="toggle k3-state-layer"
          part="toggle"
          aria-label=${toggleLabel}
          aria-expanded=${large ? 'true' : 'false'}
          @click=${this.onToggle}
        >
          <span
            class="toggle-icon notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="menu_open"
            aria-hidden="true"
          ></span>
        </button>`
      : nothing;
    const destinations = html`
      <div
        class="destinations"
        part="destinations"
        data-position=${this.position}
      >
        <slot name="leading"></slot>
        <slot></slot>
      </div>
      <div
        class="trailing ${this.hasTrailing ? 'has' : ''}"
        part="trailing"
      >
        <slot name="trailing" @slotchange=${this.syncTrailingSlot}></slot>
        <slot name="foot" @slotchange=${this.syncTrailingSlot}></slot>
      </div>
    `;
    const fab = html`
      <div class="fab ${this.hasFab ? 'has' : ''}" part="fab">
        <slot name="fab" @slotchange=${this.syncFabSlot}></slot>
      </div>
    `;
    /* Fluid curved edge — lives in the element that paints the surface */
    const edge = html`<span class="edge" aria-hidden="true"></span>`;
    /* Spatialized: FAB orbiter above the pill; toggle stays inside the shell. */
    const body = spatialized
      ? html`${fab}<div class="xr-shell" part="xr-shell">${edge}${toggle}${destinations}</div>`
      : xr
        ? html`${edge}${toggle}${fab}<div class="xr-shell" part="xr-shell">${destinations}</div>`
        : html`${edge}${toggle}${fab}${destinations}`;
    return html`<nav
      class="rail"
      part="container"
      data-size=${this.resolvedSize()}
      data-layout=${chrome}
      data-appearance=${chrome}
      data-position=${this.position}
      data-fab-placement=${xr ? fabPlacement : nothing}
      @click=${this.onClick}
    >
      ${body}
    </nav>`;
  }
}
export default K3NavRail;

if (!customElements.get('k3-nav-rail')) {
  customElements.define('k3-nav-rail', K3NavRail);
}
