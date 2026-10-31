import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, emitLifecycle, stateLayerStyles, hasSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  armNavActive,
  findMarkedNavIndex,
  navItemFromEvent,
  queryNavItems,
  type ArmNavHandle,
} from './nav-selection.js';

/** Width / destination layout */
export type NavRailSize = 'compact' | 'large';
/** Embedding — standard (inline) · modal (elevated overlay) */
export type NavRailAppearance = 'standard' | 'modal';

/** @deprecated use size / expanded */
export type NavRailMode = 'compact' | 'expanded';

/**
 * Navigation rail — mid/expanded windows (≥600dp).
 *
 * - **size** `compact` (104dp, icon above label) · `large` (expanded rows)
 * - **expanded** mirrors large — toggle via **collapsible** (`menu` / `menu_open`)
 * - **appearance** `standard` (inline, divider) · `modal` (elevated, rounded)
 * - Slot **fab** — optional header FAB (compact) / extended FAB (when expanded)
 *
 * Compact is slightly wider than the M3 80–88dp token so long labels
 * (Components, Containment) stay untruncated at label-medium.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export class K3NavRail extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    css`
      :host {
        display: block;
        height: 100%;
        width: var(--k3-nav-rail-width);
        --k3-nav-rail-width: 6.5rem; /* 104 — fits “Containment” @ 12px */
        background: transparent;
        /*
         * Expand/collapse — M3E spatial spring (scheme-aware).
         * Expressive overshoots; Standard eases in (data-k3-motion).
         */
        transition: width var(--k3-sys-motion-duration-spatial-default, 500ms)
          var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial));
      }
      :host([size='large']),
      :host([expanded]),
      :host([mode='expanded']) {
        --k3-nav-rail-width: 16rem;
      }
      .rail {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        min-height: 100%;
        padding: 0.75rem 0.5rem 1rem;
        /* Visible — foot tooltips (position=end) must paint into the content pane */
        overflow: visible;
        background: var(--k3-nav-rail-bg, var(--k3-sys-color-surface));
        border-inline-end: var(
          --k3-nav-rail-divider,
          1px solid var(--k3-sys-color-outline-variant)
        );
        border-radius: var(--k3-nav-rail-radius, 0);
      }
      :host([appearance='modal']) .rail {
        background: var(--k3-sys-color-surface-container);
        border-inline-end: 0;
        border-radius: var(--k3-sys-shape-corner-extra-large);
        box-shadow: var(--k3-sys-elevation-level2, 0 1px 3px rgb(0 0 0 / 0.15));
        margin: 0;
        height: 100%;
        min-height: 100%;
      }

      /* Menu toggle — 48×48 state layer above FAB (M3 collapsed / expanded) */
      .toggle {
        display: none;
        place-items: center;
        place-content: center;
        align-self: center;
        box-sizing: border-box;
        width: var(--k3-sys-touch-target, 3rem); /* 48dp */
        height: var(--k3-sys-touch-target, 3rem);
        margin-bottom: 0.25rem;
        padding: 0;
        border: 0;
        border-radius: var(--k3-sys-shape-corner-full, 999px);
        background: transparent;
        color: var(--k3-sys-color-on-surface-variant);
        cursor: pointer;
        font: inherit;
        perspective: 2.5rem;
      }
      :host([collapsible]) .toggle {
        display: grid;
      }
      :host([size='large']) .toggle,
      :host([expanded]) .toggle,
      :host([mode='expanded']) .toggle {
        align-self: flex-start;
        margin-inline-start: 0.25rem;
      }
      /*
       * Single glyph (menu_open) — mirrored by expand/collapse + dir.
       * Expanded LTR: chevron ← (collapse) · Collapsed LTR: flip → (expand).
       */
      .toggle-icon {
        display: block;
        font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
        font-weight: normal;
        font-style: normal;
        font-size: 1.5rem;
        line-height: 1;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        transform: rotateY(0deg);
        transition: transform var(--k3-sys-motion-duration-spatial-default, 500ms)
          var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial));
      }
      /* Collapsed — flip so chevron points toward content (expand) */
      .rail[data-size='compact'] .toggle-icon {
        transform: rotateY(180deg);
      }
      /* RTL — invert (rail on the end edge) */
      :host(:dir(rtl)) .rail[data-size='large'] .toggle-icon {
        transform: rotateY(180deg);
      }
      :host(:dir(rtl)) .rail[data-size='compact'] .toggle-icon {
        transform: rotateY(0deg);
      }

      /*
       * Header FAB — morph FAB ↔ extended FAB (width), not scale.
       * Expanded: content-sized (M3 extended FAB) — never full-bleed of the rail.
       */
      .fab {
        --k3-nav-rail-fab-size: 3.5rem; /* 56 — default FAB */
        --k3-nav-rail-fab-max: 17.5rem; /* 280 — M3 extended label cap */
        --k3-nav-rail-fab-motion: var(--k3-sys-motion-duration-spatial-default, 500ms);
        --k3-nav-rail-fab-ease: var(
          --k3-sys-motion-easing-spatial,
          var(--k3-sys-motion-easing-expressive-spatial)
        );
        --k3-nav-rail-fab-fade: var(
          --k3-sys-motion-easing-effects,
          var(--k3-sys-motion-easing-expressive-effects)
        );
        display: none;
        width: 100%;
        margin-bottom: 0.75rem;
        box-sizing: border-box;
        min-height: var(--k3-nav-rail-fab-size);
      }
      .fab.has {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto;
        justify-items: center;
        align-items: center;
      }
      :host([size='large']) .fab.has,
      :host([expanded]) .fab.has,
      :host([mode='expanded']) .fab.has {
        padding-inline: 0.25rem;
        justify-items: start; /* M3 expanded rail — start-aligned, not stretch */
      }

      ::slotted(k3-fab),
      ::slotted(.rail-fab-compact),
      ::slotted(k3-extended-fab),
      ::slotted(.rail-fab-extended) {
        grid-area: 1 / 1;
        display: inline-flex !important;
        box-sizing: border-box !important;
      }

      /* Compact FAB — stays put; only opacity (no transform) */
      ::slotted(k3-fab),
      ::slotted(.rail-fab-compact) {
        z-index: 1;
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition:
          opacity var(--k3-sys-motion-duration-short4, 200ms) var(--k3-nav-rail-fab-fade),
          visibility 0ms linear 0ms;
      }
      :host([size='large']) ::slotted(k3-fab),
      :host([size='large']) ::slotted(.rail-fab-compact),
      :host([expanded]) ::slotted(k3-fab),
      :host([expanded]) ::slotted(.rail-fab-compact),
      :host([mode='expanded']) ::slotted(k3-fab),
      :host([mode='expanded']) ::slotted(.rail-fab-compact) {
        z-index: 0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
          opacity var(--k3-sys-motion-duration-short3, 150ms) var(--k3-nav-rail-fab-fade),
          visibility 0ms linear var(--k3-sys-motion-duration-short3, 150ms);
      }

      /*
       * Extended FAB — morph 56dp ↔ content width (M3 fixed / hug-content).
       * max-width animates; width stays fit-content so it never goes full-rail.
       */
      ::slotted(k3-extended-fab),
      ::slotted(.rail-fab-extended) {
        z-index: 0;
        justify-self: center;
        width: fit-content;
        min-width: var(--k3-nav-rail-fab-size);
        max-width: var(--k3-nav-rail-fab-size);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        overflow: hidden;
        transition:
          max-width var(--k3-nav-rail-fab-motion) var(--k3-nav-rail-fab-ease),
          min-width var(--k3-nav-rail-fab-motion) var(--k3-nav-rail-fab-ease),
          opacity var(--k3-sys-motion-duration-short4, 200ms) var(--k3-nav-rail-fab-fade),
          visibility 0ms linear var(--k3-nav-rail-fab-motion);
      }
      :host([size='large']) ::slotted(k3-extended-fab),
      :host([size='large']) ::slotted(.rail-fab-extended),
      :host([expanded]) ::slotted(k3-extended-fab),
      :host([expanded]) ::slotted(.rail-fab-extended),
      :host([mode='expanded']) ::slotted(k3-extended-fab),
      :host([mode='expanded']) ::slotted(.rail-fab-extended) {
        z-index: 1;
        justify-self: start;
        width: fit-content;
        min-width: var(--k3-nav-rail-fab-size);
        max-width: min(100%, var(--k3-nav-rail-fab-max));
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition:
          max-width var(--k3-nav-rail-fab-motion) var(--k3-nav-rail-fab-ease),
          min-width var(--k3-nav-rail-fab-motion) var(--k3-nav-rail-fab-ease),
          opacity var(--k3-sys-motion-duration-short4, 200ms) var(--k3-nav-rail-fab-fade),
          visibility 0ms linear 0ms;
      }

      .destinations {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
        /* Must not mix visible + auto — CSS coerces x to auto → h-scrollbar */
        overflow-x: hidden;
        overflow-y: auto;
        background: transparent;
      }
      .foot {
        margin-top: auto;
        padding-top: 0.75rem;
      }
      ::slotted(k3-nav-item) {
        flex: 0 0 auto;
        width: 100%;
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }
        .toggle-icon {
          transition: none;
        }
        ::slotted(k3-fab),
        ::slotted(.rail-fab-compact),
        ::slotted(k3-extended-fab),
        ::slotted(.rail-fab-extended) {
          transition: none !important;
        }
      }
    `,
  ];

  @property({ type: Number }) active = 0;
  /** compact (104) · large (expanded row items) */
  @property({ reflect: true }) size: NavRailSize = 'compact';
  /** standard · modal */
  @property({ reflect: true }) appearance: NavRailAppearance = 'standard';
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
  /** Slot `fab` content — tracked via slotchange (hasSlot is false on first paint). */
  @state() private hasFab = false;

  /** Layout width — `size` (+ deprecated `mode`) is the source of truth. */
  private resolvedSize(): NavRailSize {
    return this.mode === 'expanded' || this.size === 'large' ? 'large' : 'compact';
  }

  private isExpanded(): boolean {
    return this.resolvedSize() === 'large';
  }

  /** Flip collapsed ↔ expanded (collapsible toggle). */
  private setExpanded(next: boolean): void {
    if (this.isExpanded() === next) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user', expanded: next })) return;
    this.size = next ? 'large' : 'compact';
    this.expanded = next;
    if (!next && this.mode === 'expanded') this.mode = 'compact';
    emitLifecycle(this, 'change-end', { source: 'user', expanded: next });
    this.emit('k3-expand', { expanded: next });
  }

  /** Reflect `expanded` from resolved size (size/mode win). */
  private syncExpandedAttr(): void {
    const next = this.isExpanded();
    if (this.expanded !== next) this.expanded = next;
  }

  private syncLayout(): void {
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
    this.syncFabMorph();
  };

  /**
   * Drive extended-FAB collapsed chrome (icon-only square) while the rail
   * is compact — enables width morph FAB ↔ extended without scale transforms.
   */
  private syncFabMorph(): void {
    const expanded = this.isExpanded();
    for (const el of this.querySelectorAll<HTMLElement>(':scope > [slot="fab"]')) {
      if (el.localName !== 'k3-extended-fab' && !el.classList.contains('rail-fab-extended')) {
        continue;
      }
      el.toggleAttribute('data-rail-collapsed', !expanded);
    }
  }

  override willUpdate(changed: PropertyValues): void {
    /* Convenience: expanded alone drives size (unless size also changed). */
    if (changed.has('expanded') && !changed.has('size') && this.mode !== 'expanded') {
      this.size = this.expanded ? 'large' : 'compact';
    }
  }

  override firstUpdated(): void {
    const marked = findMarkedNavIndex(queryNavItems(this));
    if (marked >= 0) this.active = marked;
    this.ready = true;
    this.syncFabSlot();
    this.syncExpandedAttr();
    this.syncFabMorph();
    this.syncLayout();
    this.applyActive(true);
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this.ready) return;
    if (changed.has('size') || changed.has('mode') || changed.has('expanded')) {
      this.syncExpandedAttr();
      this.syncFabMorph();
      this.syncLayout();
    }
    if (
      changed.has('active') ||
      changed.has('size') ||
      changed.has('mode') ||
      changed.has('expanded')
    ) {
      this.applyActive(changed.has('active'));
    }
  }

  override disconnectedCallback(): void {
    this.arm?.cancel();
    super.disconnectedCallback();
  }

  override render() {
    const large = this.isExpanded();
    const toggleLabel = large ? 'Collapse navigation' : 'Expand navigation';
    return html`<nav
      class="rail"
      part="container"
      data-size=${this.resolvedSize()}
      data-appearance=${this.appearance}
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
      <div class="destinations" part="destinations">
        <slot></slot>
      </div>
      <div class="foot" part="foot"><slot name="foot"></slot></div>
    </nav>`;
  }
}
export default K3NavRail;

if (!customElements.get('k3-nav-rail')) {
  customElements.define('k3-nav-rail', K3NavRail);
}
