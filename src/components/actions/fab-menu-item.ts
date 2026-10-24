import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, stateLayerStyles, focusRingStyles, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { fabMenuIconMirrors, type FabMenuVariant } from './fab-menu.specs.js';
import { fabMenuItemStyles } from './fab-menu-item.styles.js';

/**
 * Material 3 Expressive FAB menu item — one-size pill (icon + label).
 *
 * Parent `k3-fab-menu` drives `data-phase`, stagger, and `data-icon-end`
 * (start-edge menus: icon last / outer — LTR & RTL).
 * Colors inherit `*-container` / `on-*-container` unless `tone` overrides.
 *
 * @see https://m3.material.io/components/fab-menu/specs
 * @see ./fab-menu.specs.ts
 */
export class K3FabMenuItem extends K3Element {
  static override styles = [hostReset, stateLayerStyles, focusRingStyles, fabMenuItemStyles];

  @property() icon = '';
  /** Optional override; empty inherits parent menu containers. */
  @property({ reflect: true }) tone: FabMenuVariant | '' = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Roving tabindex — set by parent `k3-fab-menu`. */
  setItemTabIndex(value: number): void {
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('button.item');
    if (btn) btn.tabIndex = value;
  }

  /** Focus this item's action button (keyboard roving — shows :focus-visible). */
  focusItem(): void {
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('button.item');
    if (!btn || this.disabled) return;
    try {
      btn.focus({ preventScroll: true, focusVisible: true } as FocusOptions);
    } catch {
      btn.focus({ preventScroll: true });
    }
  }

  override firstUpdated(): void {
    this.setItemTabIndex(-1);
  }

  override render() {
    const tone = this.tone;
    return html`
      <button
        type="button"
        part="container"
        role="menuitem"
        tabindex="-1"
        class=${classMap({
          item: true,
          'k3-state-layer': true,
          'k3-focus-ring': true,
          primary: tone === 'primary',
          secondary: tone === 'secondary',
          tertiary: tone === 'tertiary',
          surface: tone === 'surface',
        })}
        ?disabled=${this.disabled}
        @pointerdown=${() => {
          if (!this.disabled) emitLifecycle(this, 'press-start', { source: 'user' });
        }}
        @pointerup=${() => emitLifecycle(this, 'press-end', { source: 'user' })}
        @click=${() => this.emit('k3-click')}
      >
        <span class="icon" part="icon">
          ${this.icon
            ? html`<span
                class="icon-ligature notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon=${this.icon}
                aria-hidden="true"
                ?data-mirror=${fabMenuIconMirrors(this.icon)}
              ></span>`
            : html`<slot name="icon"></slot>`}
        </span>
        <span class="label" part="label"><slot></slot></span>
      </button>
    `;
  }
}

export default K3FabMenuItem;
