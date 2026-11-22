import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  stateLayerStyles,
  focusRingStyles,
  hasNamedSlot,
  hasSlot,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import '../containment/menu.js';
import '../containment/menu-item.js';
import { markMenuTreeEdges } from '../containment/menu-edges.js';
import type { K3Menu } from '../containment/menu.js';
import {
  SplitButtonGapDp,
  SplitButtonSpecs,
  type SplitButtonSize,
  type SplitButtonVariant,
} from './split-button.specs.js';
import { splitButtonStyles } from './split-button.styles.js';

export type { SplitButtonSize, SplitButtonVariant } from './split-button.specs.js';
export { SplitButtonSpecs, SplitButtonSizeDp, SplitButtonGapDp } from './split-button.specs.js';

/**
 * Material 3 Expressive split button — leading label + trailing menu.
 *
 * Leading is not clickable (label surface). Trailing opens the menu, owns
 * focus, and drives the inner-corner morph on the leading segment.
 *
 * @see ./split-button.specs.ts
 * @see https://m3.material.io/components/split-button/guidelines
 * @see https://m3.material.io/components/split-button/specs
 */
export class K3SplitButton extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    splitButtonStyles,
  ];

  @property({ reflect: true }) size: SplitButtonSize = SplitButtonSpecs.defaultSize;
  @property({ reflect: true }) variant: SplitButtonVariant =
    SplitButtonSpecs.defaultVariant;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) open = false;
  /** Accessible name for the menu trigger (trailing). */
  @property() label = '';

  @state() private hasIcon = false;
  @state() private hasLabel = false;
  private _menuMo: MutationObserver | null = null;
  private _openMo: MutationObserver | null = null;
  private _unwatchDpr: (() => void) | null = null;

  /**
   * Snap the 2dp leading↔trailing gap to integer device pixels.
   * At Windows 125% DPI, raw `2px` → 2.5 physical and flex-gap rounds unevenly
   * (hairline seam looks thicker / thinner). Same helper as segmented lists.
   */
  private applyGapToken = (): void => {
    this.style.setProperty('--k3-sb-gap', devicePixelSnapCss(SplitButtonGapDp));
  };

  private syncLeadingContent = (): void => {
    this.hasIcon = hasNamedSlot(this, 'icon');
    this.hasLabel = hasSlot(this) || this.hasDefaultLightLabel();
    const mode =
      this.hasIcon && this.hasLabel ? 'both' : this.hasIcon ? 'icon' : 'label';
    if (this.getAttribute('data-leading') !== mode) {
      this.setAttribute('data-leading', mode);
    }
  };

  /** Text / unlabeled nodes in the default slot (not icon / menu). */
  private hasDefaultLightLabel(): boolean {
    for (const n of this.childNodes) {
      if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim()) return true;
      if (
        n instanceof HTMLElement &&
        !n.slot &&
        n.localName !== 'k3-menu-item'
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Move `slot="menu"` items into the nested `k3-menu` light DOM so edges,
   * keyboard, fit, and hover morph work (nested `<slot>` alone is not enough).
   */
  private adoptMenuItems = (): void => {
    const menu = this.menuEl();
    if (!menu) return;
    const incoming = [
      ...this.querySelectorAll<HTMLElement>(':scope > [slot="menu"]'),
    ];
    if (!incoming.length) return;
    for (const el of incoming) {
      el.removeAttribute('slot');
      menu.appendChild(el);
    }
    /* first + last (or only) — required for 2-item menus */
    markMenuTreeEdges(menu);
  };

  private trailEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.trailing') as HTMLElement | null;
  }

  private onTrailPointerDown = (): void => {
    if (this.disabled) return;
    this.trailEl()?.setAttribute('data-pressed', '');
  };

  private onTrailPointerUp = (): void => {
    this.trailEl()?.removeAttribute('data-pressed');
  };

  private menuEl(): K3Menu | null {
    return this.shadowRoot?.querySelector('k3-menu') as K3Menu | null;
  }

  async openMenu(): Promise<boolean> {
    const menu = this.menuEl();
    if (!menu) return false;
    const ok = await menu.show('menu');
    if (ok) this.open = true;
    return ok;
  }

  async closeMenu(source: 'user' | 'api' | 'escape' = 'api'): Promise<boolean> {
    const menu = this.menuEl();
    if (!menu) return false;
    const ok = await menu.hide(source);
    if (ok) this.open = false;
    return ok;
  }

  async toggleMenu(): Promise<void> {
    if (this.open) await this.closeMenu('user');
    else await this.openMenu();
  }

  /** Mirror nested menu open → host `[open]` (aria + API). */
  private syncOpenFromMenu = (): void => {
    const menu = this.menuEl();
    if (!menu) return;
    const next = menu.hasAttribute('open') || menu.open === true;
    if (this.open !== next) this.open = next;
  };

  private onMenuOpenStart = (): void => {
    this.open = true;
  };

  private onMenuCloseStart = (): void => {
    this.open = false;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.applyGapToken();
    this._unwatchDpr?.();
    this._unwatchDpr = watchDevicePixelRatio(this.applyGapToken);
    this.syncLeadingContent();
    queueMicrotask(() => {
      this.syncLeadingContent();
      this.adoptMenuItems();
    });
    this._menuMo?.disconnect();
    this._menuMo = new MutationObserver(() => {
      this.adoptMenuItems();
      this.syncLeadingContent();
    });
    this._menuMo.observe(this, { childList: true });
  }

  override firstUpdated(): void {
    this.applyGapToken();
    this.syncLeadingContent();
    this.adoptMenuItems();
    const root = this.shadowRoot;
    root
      ?.querySelector('slot:not([name])')
      ?.addEventListener('slotchange', this.syncLeadingContent);
    root
      ?.querySelector('slot[name="icon"]')
      ?.addEventListener('slotchange', this.syncLeadingContent);
    const menu = this.menuEl();
    if (!menu) return;
    menu.addEventListener('k3-open-start', this.onMenuOpenStart);
    menu.addEventListener('k3-close-start', this.onMenuCloseStart);
    menu.addEventListener('k3-open-end', this.syncOpenFromMenu);
    menu.addEventListener('k3-close-end', this.syncOpenFromMenu);
    this._openMo?.disconnect();
    this._openMo = new MutationObserver(this.syncOpenFromMenu);
    this._openMo.observe(menu, { attributes: true, attributeFilter: ['open'] });
  }

  override disconnectedCallback(): void {
    this._unwatchDpr?.();
    this._unwatchDpr = null;
    this._menuMo?.disconnect();
    this._menuMo = null;
    this._openMo?.disconnect();
    this._openMo = null;
    const menu = this.menuEl();
    menu?.removeEventListener('k3-open-start', this.onMenuOpenStart);
    menu?.removeEventListener('k3-close-start', this.onMenuCloseStart);
    menu?.removeEventListener('k3-open-end', this.syncOpenFromMenu);
    menu?.removeEventListener('k3-close-end', this.syncOpenFromMenu);
    super.disconnectedCallback();
  }

  override render() {
    const v = this.variant;
    return html`
      <div class="row" part="container">
        <div
          class=${classMap({ leading: true, [v]: true })}
          part="action"
          aria-hidden="true"
        >
          <span class="icon ${this.hasIcon ? 'has' : ''}" part="icon">
            <slot name="icon" @slotchange=${this.syncLeadingContent}></slot>
          </span>
          <span class="label ${this.hasLabel ? 'has' : ''}" part="label"
            ><slot @slotchange=${this.syncLeadingContent}></slot
          ></span>
        </div>
        <!--
          Menu items are adopted from slot=menu into this k3-menu's light DOM
          (see adoptMenuItems) so first/last edges + nav work with ≥2 items.
        -->
        <k3-menu
          class="trail-menu"
          part="menu"
          position="bottom-end"
          close-on-select
        >
          <button
            slot="trigger"
            type="button"
            class=${classMap({
              trailing: true,
              'k3-state-layer': true,
              'k3-focus-ring': true,
              [v]: true,
            })}
            part="menu-button"
            ?disabled=${this.disabled}
            aria-label=${this.label.trim() || i18n.t('menu.open')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="menu"
            @pointerdown=${this.onTrailPointerDown}
            @pointerup=${this.onTrailPointerUp}
            @pointerleave=${this.onTrailPointerUp}
            @pointercancel=${this.onTrailPointerUp}
          >
            <span
              class="chev notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="expand_more"
              aria-hidden="true"
            ></span>
          </button>
        </k3-menu>
      </div>
    `;
  }
}

export default K3SplitButton;

if (!customElements.get('k3-split-button')) {
  customElements.define('k3-split-button', K3SplitButton);
}
