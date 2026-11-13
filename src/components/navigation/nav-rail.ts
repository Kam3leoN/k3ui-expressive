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
  type ArmNavHandle,
} from './nav-selection.js';
import { navRailStyles } from './nav-rail.styles.js';

/** Width / destination layout */
export type NavRailSize = 'compact' | 'large';
/**
 * Expanded chrome — M3 Expressive
 * (@see https://m3.material.io/components/navigation-rail/specs).
 * - `modal` (default) — overlays content; flush to the start edge; end-side corners only
 * - `standard` — beside content; no inset sheet (flush rail, no inner container radius)
 */
export type NavRailLayout = 'standard' | 'modal';
/** @deprecated use `layout` */
export type NavRailAppearance = NavRailLayout;
/** Leading destinations group alignment */
export type NavRailPosition = 'start' | 'center' | 'bottom';
/** @deprecated use size / expanded */
export type NavRailMode = 'compact' | 'expanded';

/** Fallback if `transitionend` is skipped (tab backgrounded / display:none). */
const WIDTH_SETTLE_FALLBACK_MS = 560;

/**
 * Navigation rail — mid/expanded windows (≥600dp).
 *
 * - **size** `compact` (104dp, icon above label) · `large` (expanded rows)
 * - **expanded** mirrors large — toggle via **collapsible** (`menu` / `menu_open`)
 * - **layout** `modal` (default, edge-docked + end radii) · `standard` (flush, no sheet)
 * - **position** `start` · `center` · `bottom` — leading destinations group
 * - Slots **leading** (or default) · **trailing** (bottom + divider) · **fab**
 *
 * Compact + expanded use elevation level 1 (no end border).
 * Expand/collapse: spatial spring on width; destinations go vertical at collapse
 * start (labels stay visible); extended FAB morphs via `data-rail-collapsed`.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export class K3NavRail extends K3Element {
  static override styles = [hostReset, stateLayerStyles, navRailStyles];

  @property({ type: Number }) active = 0;
  /** compact (104) · large (expanded row items) */
  @property({ reflect: true }) size: NavRailSize = 'compact';
  /**
   * Expanded chrome: `modal` (default) · `standard`.
   * Modal = edge-docked, end radii · Standard = flush rail, no inset sheet.
   */
  @property({ reflect: true }) layout: NavRailLayout = 'modal';
  /**
   * @deprecated use `layout` — attribute `appearance` still accepted (maps to layout).
   */
  @property({ attribute: 'appearance' }) appearance: NavRailAppearance | null = null;
  /** Leading destinations alignment: start · center · bottom */
  @property({ reflect: true }) position: NavRailPosition = 'start';
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
  private collapseTimer = 0;
  /** Slot `fab` content — tracked via slotchange (hasSlot is false on first paint). */
  @state() private hasFab = false;
  /** Slot `trailing` / deprecated `foot`. */
  @state() private hasTrailing = false;

  /** Layout width — `size` (+ deprecated `mode`) is the source of truth. */
  private resolvedSize(): NavRailSize {
    return this.mode === 'expanded' || this.size === 'large' ? 'large' : 'compact';
  }

  private isExpanded(): boolean {
    return this.resolvedSize() === 'large';
  }

  private resolvedLayout(): NavRailLayout {
    return this.layout === 'standard' ? 'standard' : 'modal';
  }

  private clearCollapseTimer(): void {
    if (!this.collapseTimer) return;
    window.clearTimeout(this.collapseTimer);
    this.collapseTimer = 0;
  }

  private clearCollapseArm(): void {
    this.collapsing = false;
    this.removeAttribute('data-collapsing');
    this.removeAttribute('data-expanding');
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
  }

  private onWidthTransitionEnd = (e: TransitionEvent): void => {
    if (e.target !== this || e.propertyName !== 'width') return;
    this.settleCollapse();
  };

  /** Finish collapse: clear morph flag after width spring (items already vertical). */
  private settleCollapse(): void {
    if (!this.collapsing) return;
    this.collapsing = false;
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    if (!this.isExpanded()) this.syncItemLayout();
    this.removeAttribute('data-collapsing');
  }

  /**
   * Collapse — vertical destinations immediately (labels stay under icons),
   * then wait for width `transitionend` to clear `data-collapsing`.
   */
  private armCollapseSettle(): void {
    this.collapsing = true;
    this.setAttribute('data-collapsing', '');
    this.removeAttribute('data-expanding');
    this.syncItemLayout();
    if (prefersReducedMotion()) {
      this.settleCollapse();
      return;
    }
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.addEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    this.collapseTimer = window.setTimeout(
      () => this.settleCollapse(),
      WIDTH_SETTLE_FALLBACK_MS,
    );
  }

  /** Expand — horizontal from a tucked start (`data-expanding`), then release. */
  private armExpandMorph(): void {
    this.collapsing = false;
    this.removeAttribute('data-collapsing');
    this.removeEventListener('transitionend', this.onWidthTransitionEnd);
    this.clearCollapseTimer();
    this.setAttribute('data-expanding', '');
    this.size = 'large';
    this.expanded = true;
    this.syncItemLayout();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.isExpanded()) this.removeAttribute('data-expanding');
      });
    });
  }

  /** Flip collapsed ↔ expanded (collapsible toggle). */
  private setExpanded(next: boolean): void {
    if (this.isExpanded() === next) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user', expanded: next })) return;
    if (next) {
      this.armExpandMorph();
    } else {
      this.size = 'compact';
      this.expanded = false;
      if (this.mode === 'expanded') this.mode = 'compact';
      /* Lock FAB px width while still painted expanded — then spring to 56dp. */
      this.syncFabMorph();
      this.armCollapseSettle();
    }
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
    for (const el of queryNavItems(this)) el.layout = layout;
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
   */
  private syncFabMorph(animate = true): void {
    const collapsed = !this.isExpanded();
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
      this.layout = this.appearance;
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
      /* During collapse, items are already vertical from armCollapseSettle. */
      if (this.isExpanded() || !this.collapsing) this.syncItemLayout();
    }
    if (sizeChanged || changed.has('active')) {
      this.applyActive(changed.has('active'));
    }
  }

  override disconnectedCallback(): void {
    this.arm?.cancel();
    this.clearCollapseArm();
    super.disconnectedCallback();
  }

  override render() {
    const large = this.isExpanded();
    const chrome = this.resolvedLayout();
    const toggleLabel = large ? 'Collapse navigation' : 'Expand navigation';
    return html`<nav
      class="rail"
      part="container"
      data-size=${this.resolvedSize()}
      data-layout=${chrome}
      data-appearance=${chrome}
      data-position=${this.position}
      @click=${this.onClick}
    >
      ${this.collapsible
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
        : nothing}
      <div class="fab ${this.hasFab ? 'has' : ''}" part="fab">
        <slot name="fab" @slotchange=${this.syncFabSlot}></slot>
      </div>
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
    </nav>`;
  }
}
export default K3NavRail;

if (!customElements.get('k3-nav-rail')) {
  customElements.define('k3-nav-rail', K3NavRail);
}
