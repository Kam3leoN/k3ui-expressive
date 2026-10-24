import { html, css, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, runOpenClose } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { expandCollapseStyles } from './expand-collapse.styles.js';

/**
 * M3 Expansion panel — header + collapsible body.
 * Chevron = Material `expand_more`, rotates when open.
 *
 * Parent `<k3-expansion-group exclusive>` collapses siblings (accordion).
 */
export class K3ExpansionPanel extends K3Element {
  static override styles = [
    hostReset,
    expandCollapseStyles,
    css`
      :host {
        display: block;
        overflow: hidden;
        border-radius: var(--k3-sys-shape-corner-medium);
        background: var(--k3-sys-color-surface-container-low);
        color: var(--k3-sys-color-on-surface);
      }
      :host([flush]) {
        border-radius: 0;
        background: transparent;
        overflow: visible;
      }
      .header {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        min-height: 3.5rem; /* 56 */
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;
        border-radius: inherit;
      }
      .header:focus-visible {
        outline: 2px solid var(--k3-sys-color-secondary);
        outline-offset: -2px;
      }
      .leading:not(.has) {
        display: none;
      }
      .leading {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: center;
        width: 1.5rem;
        height: 1.5rem;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--k3-sys-color-on-surface-variant);
        flex-shrink: 0;
      }
      ::slotted([slot='icon']) {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        font-family: var(
          --k3-sys-icon-font-family,
          'Material Symbols Rounded',
          sans-serif
        );
        font-size: 1.5rem;
        line-height: 1;
        font-feature-settings: 'liga';
      }
      .titles {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .headline {
        font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
        font-weight: 500;
        color: var(--k3-sys-color-on-surface);
      }
      .supporting {
        font-size: var(--k3-sys-typescale-body-medium-size);
        color: var(--k3-sys-color-on-surface-variant);
      }
      .supporting:not(.has) {
        display: none;
      }
      .chevron {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        font-family: var(
          --k3-sys-icon-font-family,
          'Material Symbols Rounded',
          sans-serif
        );
        font-size: 1.5rem;
        font-feature-settings: 'liga';
        font-variation-settings:
          'FILL' 0,
          'wght' 300,
          'GRAD' 0,
          'opsz' 24;
        color: var(--k3-sys-color-on-surface-variant);
        transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
          var(--k3-sys-motion-easing-expressive-spatial);
        transform: rotate(0deg);
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      /* Body chrome — motion from expandCollapseStyles (.expand / .expand-inner) */
      .expand-body {
        padding: 0 1rem 1rem;
        font-size: var(--k3-sys-typescale-body-medium-size);
        color: var(--k3-sys-color-on-surface-variant);
      }
      .expand-body.has-icon {
        padding-inline-start: calc(1rem + 1.5rem + 1rem);
      }
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none !important;
        }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) open = false;
  /** Flat style (no filled surface) — nav-like */
  @property({ type: Boolean, reflect: true }) flush = false;
  @state() private expanded = false;
  @state() private hasIcon = false;
  @state() private hasSupporting = false;

  private syncSlots = (): void => {
    this.hasIcon = this.hasSlot('icon');
    this.hasSupporting = this.hasSlot('supporting-text');
  };

  async expand(source: 'user' | 'api' = 'api'): Promise<boolean> {
    if (this.expanded || this.open) return true;
    const ok = await runOpenClose(
      this,
      'open',
      async () => {
        this.open = true;
        this.expanded = true;
      },
      { source },
      { start: 'expand-start', end: 'expand-end' },
    );
    if (ok) this.emit('k3-expand', { source });
    return ok;
  }

  async collapse(source: 'user' | 'api' = 'api'): Promise<boolean> {
    if (!this.expanded && !this.open) return true;
    const ok = await runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
        this.expanded = false;
      },
      { source },
      { start: 'collapse-start', end: 'collapse-end' },
    );
    if (ok) this.emit('k3-collapse', { source });
    return ok;
  }

  async toggle(source: 'user' | 'api' = 'user'): Promise<boolean> {
    return this.expanded || this.open ? this.collapse(source) : this.expand(source);
  }

  private onHeaderClick = (): void => {
    void this.toggle('user');
  };

  /** Sync mirrored state in willUpdate so it batches (no change-in-update). */
  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('open') && this.open !== this.expanded) {
      this.expanded = this.open;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.open) this.expanded = true;
    queueMicrotask(() => this.syncSlots());
  }

  override firstUpdated(): void {
    this.syncSlots();
  }

  override render() {
    const isOpen = this.expanded || this.open;
    return html`
      <button
        type="button"
        class="header"
        part="header"
        aria-expanded=${String(isOpen)}
        @click=${this.onHeaderClick}
      >
        <span class=${classMap({ leading: true, has: this.hasIcon })} part="icon">
          <slot name="icon" @slotchange=${this.syncSlots}></slot>
        </span>
        <span class="titles">
          <span class="headline" part="headline"
            ><slot name="headline" @slotchange=${this.syncSlots}></slot
          ></span>
          <span
            class=${classMap({ supporting: true, has: this.hasSupporting })}
            part="supporting-text"
          >
            <slot name="supporting-text" @slotchange=${this.syncSlots}></slot>
          </span>
        </span>
        <span
          class=${classMap({ chevron: true, open: isOpen, notranslate: true })}
          part="indicator"
          translate="no"
          lang="zxx"
          data-k3-icon="expand_more"
          aria-hidden="true"
        ></span>
      </button>
      <div class=${classMap({ expand: true, open: isOpen })} part="body">
        <div class="expand-inner">
          <div
            class=${classMap({ 'expand-body': true, 'has-icon': this.hasIcon })}
            part="content"
          >
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
export default K3ExpansionPanel;