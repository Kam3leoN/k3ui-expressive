import { html, css, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  armNavActive,
  findMarkedNavIndex,
  navItemFromEvent,
  queryNavItems,
  queryNavItemsForLayout,
  type ArmNavHandle,
} from './nav-selection.js';

/** Destination arrangement — icon above label · or short horizontal pill. */
export type NavBarLayout = 'vertical' | 'horizontal';
/**
 * Chrome — M3 / Android XR
 * (@see https://m3.material.io/foundations/xr/components/nav-bar)
 * - `standard` (default) — docked full-width bar (home space / 2D)
 * - `xr` — bottom-centered spatial orbiter (full space); alias `spatial`
 */
export type NavBarAppearance = 'standard' | 'xr';

/**
 * Navigation bar — M3 Expressive compact (&lt;600dp).
 *
 * - **layout** `vertical` (64dp, icon above label) · `horizontal` (short pill)
 * - **appearance** `standard` · `xr` (spatial floating orbiter; alias `spatial`)
 *
 * XR maps to Android `SpatialNavigationBar` / `SpatialShortNavigationBar`
 * (bottom-aligned orbiter, 24dp inset, elevated surface-container pill).
 *
 * @see https://m3.material.io/components/navigation-bar
 * @see https://developer.android.com/develop/xr/jetpack-xr-sdk/material-design
 */
export class K3NavBar extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
      .bar {
        display: flex;
        justify-content: space-around;
        align-items: stretch;
        gap: 0;
        box-sizing: border-box;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        height: 4rem;
        min-height: 4rem;
        padding: 0 0.5rem calc(0px + env(safe-area-inset-bottom, 0px));
        background: var(--k3-nav-bar-bg, var(--k3-sys-color-surface-container));
        border-block-start: 1px solid var(--k3-sys-color-outline-variant);
        overflow: visible;
      }
      :host([layout='horizontal']) .bar {
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        height: auto;
        min-height: 4rem;
        padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
      }
      ::slotted(k3-nav-item) {
        flex: 1 1 0;
        min-width: 0;
        max-width: 100%;
      }
      :host([layout='horizontal']) ::slotted(k3-nav-item) {
        flex: 0 0 auto;
        width: auto;
        align-self: center;
      }

      /*
       * XR / Spatial — elevated floating orbiter (bottom-centered)
       * (@see https://m3.material.io/foundations/xr/components/nav-bar)
       * (@see SpatialNavigationBar / SpatialShortNavigationBar — 24dp offset,
       *      ShortNavigationBar padding around items 32dp)
       */
      :host(:is([appearance='xr'], [appearance='spatial'])) {
        --k3-nav-bar-xr-inset: 1.5rem; /* 24dp offset from panel edge */
        --k3-nav-bar-xr-radius: 3rem; /* 48dp pill */
        --k3-nav-bar-xr-pad-inline: 2rem; /* 32dp */
        width: fit-content;
        max-width: calc(100% - 2 * var(--k3-nav-bar-xr-inset));
        margin-inline: auto;
        margin-block-end: var(--k3-nav-bar-xr-inset);
      }

      :host(:is([appearance='xr'], [appearance='spatial'])) .bar {
        width: auto;
        max-width: 100%;
        /* SpatialNavigationBar — keep 64dp so FAB 16dp clearance stays predictable */
        height: 4rem;
        min-height: 4rem;
        justify-content: center;
        align-items: stretch;
        gap: var(--k3-sys-spacing-space50, 0.25rem);
        padding: 0 var(--k3-nav-bar-xr-pad-inline);
        background: var(--k3-nav-bar-bg, var(--k3-sys-color-surface-container));
        border-block-start: none;
        border-radius: var(--k3-nav-bar-radius, var(--k3-nav-bar-xr-radius));
        box-shadow: var(--k3-nav-bar-elevation, var(--k3-sys-elevation-level3));
      }

      /* SpatialShortNavigationBar — short horizontal items, auto height + 8dp pad */
      :host(
          [layout='horizontal']:is([appearance='xr'], [appearance='spatial'])
        )
        .bar {
        height: auto;
        min-height: 3.5rem; /* 56dp short bar */
        align-items: center;
        padding: var(--k3-sys-spacing-space100, 0.5rem) var(--k3-nav-bar-xr-pad-inline);
      }

      :host(:is([appearance='xr'], [appearance='spatial'])) ::slotted(k3-nav-item) {
        flex: 0 1 auto;
        width: auto;
        min-width: 0;
      }
    `,
  ];

  @property({ type: Number }) active = 0;
  /** vertical (icon above label) · horizontal (short pill) */
  @property({ reflect: true }) layout: NavBarLayout = 'vertical';
  /**
   * Chrome: `standard` (docked) · `xr` (spatial orbiter).
   * Alias attribute value `spatial` maps to `xr`.
   */
  @property({ reflect: true }) appearance: NavBarAppearance = 'standard';

  private ready = false;
  private arm: ArmNavHandle | null = null;

  private resolvedAppearance(): NavBarAppearance {
    const raw = (this.appearance || 'standard') as string;
    if (raw === 'xr' || raw === 'spatial') return 'xr';
    return 'standard';
  }

  private syncLayout(): void {
    for (const el of queryNavItemsForLayout(this)) el.layout = this.layout;
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

  override firstUpdated(): void {
    const marked = findMarkedNavIndex(queryNavItems(this));
    if (marked >= 0) this.active = marked;
    this.ready = true;
    this.syncLayout();
    this.applyActive(true);
  }

  override willUpdate(changed: PropertyValues): void {
    /* Accept appearance="spatial" as an XR alias (before paint). */
    if (changed.has('appearance') && (this.appearance as string) === 'spatial') {
      this.appearance = 'xr';
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!this.ready) return;
    if (changed.has('layout')) this.syncLayout();
    if (changed.has('active') || changed.has('layout')) {
      this.applyActive(changed.has('active'));
    }
  }

  override disconnectedCallback(): void {
    this.arm?.cancel();
    super.disconnectedCallback();
  }

  override render() {
    const chrome = this.resolvedAppearance();
    return html`<nav
      class="bar"
      part="container"
      data-appearance=${chrome}
      @click=${this.onClick}
    >
      <slot></slot>
    </nav>`;
  }
}
export default K3NavBar;

if (!customElements.get('k3-nav-bar')) {
  customElements.define('k3-nav-bar', K3NavBar);
}
