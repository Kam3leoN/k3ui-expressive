import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  afterPaint,
  runOpenClose,
  waitForMotion,
  attachOutsideDismiss,
  type OutsideDismissController,
} from '../../core/index.js';
import { enterScaleY } from '../../motion/enter.js';
import { hostReset } from '../_shared.js';
import '../containment/menu-item.js';
import { markMenuItemEdges } from '../containment/menu-edges.js';

/**
 * Button menu — trigger + M3 Expressive vertical menu panel.
 *
 * Panel tokens (vertical M3e):
 * - container pad 4 all · corner 16 · surface-container-low
 * - item gap 2 · height 48 · icon↔label 8 · hover 4 · selected 12
 * Prefer slotted `k3-menu-item` (not list items).
 *
 * @see https://m3.material.io/components/menus/specs
 */
export class K3ButtonMenu extends K3Element {
  static override styles = [
    hostReset,
    enterScaleY('.panel', '.panel.open', { origin: 'top left' }),
    css`
      :host {
        position: relative;
        display: inline-block;
      }
      .panel {
        position: absolute;
        inset-inline-start: 0;
        top: calc(100% + 0.25rem); /* 4dp below trigger */
        z-index: 50;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.125rem; /* 2 — M3e vertical item gap */
        min-width: 7rem; /* 112 */
        max-width: min(17.5rem, 90vw); /* 280 */
        width: max-content;
        padding: 0.25rem; /* 4 all */
        background: var(--k3-sys-color-surface-container-low);
        color: var(--k3-sys-color-on-surface);
        border-radius: var(--k3-sys-shape-corner-large); /* 16 */
        box-shadow:
          0 1px 2px rgb(0 0 0 / 0.15),
          0 2px 6px 2px rgb(0 0 0 / 0.1);
        pointer-events: none;
      }
      :host([align='end']) .panel {
        inset-inline-start: auto;
        inset-inline-end: 0;
        transform-origin: top right;
      }
      :host(:dir(rtl)) .panel {
        transform-origin: top right;
      }
      :host(:dir(rtl)[align='end']) .panel {
        transform-origin: top left;
      }
      .panel.open {
        pointer-events: auto;
      }

      ::slotted(k3-menu-item) {
        display: block;
        width: 100%;
        flex-shrink: 0;
      }

      /* Legacy list-item in menu — force vertical-menu metrics */
      ::slotted(k3-list-item) {
        display: block;
        width: 100%;
        --k3-list-menu-reset: 1;
      }

      .chevron {
        font-family: 'Material Symbols Rounded', sans-serif;
        font-size: 1.25rem;
        transition: transform var(--k3-sys-motion-duration-spatial-fast)
          var(--k3-sys-motion-easing-spatial-fast, var(--k3-sys-motion-easing-spatial));
      }
      :host([open]) .chevron {
        transform: rotate(180deg);
      }
    `,
  ];

  @property() label = 'Menu';
  @property({ reflect: true }) variant: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' =
    'tonal';
  @property({ reflect: true }) size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  /** Panel align to trigger start (default) or end (app-bar trailing). */
  @property({ reflect: true }) align: 'start' | 'end' = 'start';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @state() private visible = false;

  override firstUpdated(): void {
    markMenuItemEdges(this);
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    slot?.addEventListener('slotchange', () => markMenuItemEdges(this));
  }

  async show(): Promise<boolean> {
    return runOpenClose(
      this,
      'open',
      async () => {
        markMenuItemEdges(this);
        this.visible = true;
        this.open = false;
        await this.updateComplete;
        await afterPaint();
        this.open = true;
      },
      { source: 'user' },
    );
  }

  async hide(source: 'user' | 'api' | 'escape' | 'auto' = 'api'): Promise<boolean> {
    return runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
        this.visible = false;
        await this.updateComplete;
        const panel = this.shadowRoot?.querySelector('.panel') as HTMLElement | null;
        if (panel) await waitForMotion(panel);
      },
      { source },
    );
  }

  private toggle = (): void => {
    if (this.disabled) return;
    void (this.visible ? this.hide('user') : this.show());
  };

  private onPanelClick = (e: Event): void => {
    const item = (e.target as HTMLElement).closest(
      'k3-menu-item, k3-list-item, [role="menuitem"]',
    );
    if (item && !(item as HTMLElement).hasAttribute('disabled')) void this.hide('user');
  };

  private _outsideDismiss: OutsideDismissController | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._outsideDismiss = attachOutsideDismiss(this, {
      isActive: () => this.visible,
      onDismiss: () => void this.hide('user'),
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._outsideDismiss?.detach();
    this._outsideDismiss = null;
  }

  override render() {
    return html`
      <k3-button
        part="trigger"
        size=${this.size}
        variant=${this.variant}
        ?disabled=${this.disabled}
        @k3-click=${this.toggle}
      >
        <slot name="icon" slot="icon"></slot>
        ${this.label}
        <span
          slot="trailing-icon"
          class="chevron notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="expand_more"
          aria-hidden="true"
        ></span>
      </k3-button>
      <div
        class="panel ${this.open ? 'open' : ''}"
        part="menu"
        role="menu"
        @click=${this.onPanelClick}
      >
        <slot></slot>
      </div>
    `;
  }
}
export default K3ButtonMenu;
