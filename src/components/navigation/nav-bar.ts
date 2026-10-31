import { html, css, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  armNavActive,
  findMarkedNavIndex,
  navItemFromEvent,
  queryNavItems,
  type ArmNavHandle,
} from './nav-selection.js';

export type NavBarLayout = 'vertical' | 'horizontal';

/**
 * Navigation bar — M3 Expressive (64dp).
 * Vertical: icon above label · Horizontal: 56dp pill wraps icon + label.
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
        background: var(--k3-sys-color-surface-container);
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
    `,
  ];

  @property({ type: Number }) active = 0;
  @property({ reflect: true }) layout: NavBarLayout = 'vertical';

  private ready = false;
  private arm: ArmNavHandle | null = null;

  private syncLayout(): void {
    for (const el of queryNavItems(this)) el.layout = this.layout;
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
    return html`<nav class="bar" part="container" @click=${this.onClick}>
      <slot></slot>
    </nav>`;
  }
}
export default K3NavBar;

if (!customElements.get('k3-nav-bar')) {
  customElements.define('k3-nav-bar', K3NavBar);
}
