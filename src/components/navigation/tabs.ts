import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { K3Element, emitLifecycle, waitForMotion, isRtl } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';

export type TabsVariant = 'primary' | 'secondary';

/**
 * Material 3 tabs — [overview](https://m3.material.io/components/tabs/overview)
 * - **primary**: icon + label, short centered pill indicator
 * - **secondary**: label only, indicator = full tab cell width
 */
export class K3Tabs extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
      }
      .tabs {
        display: flex;
        position: relative;
        border-block-end: 1px solid var(--k3-sys-color-outline-variant);
      }
      .tab {
        flex: 1 1 0;
        min-width: 0;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        min-height: var(--k3-sys-touch-target);
        padding: 0.75rem 1rem;
        color: var(--k3-sys-color-on-surface-variant);
        font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
        font-weight: 500;
        text-align: center;
        position: relative;
        background: transparent;
        border: 0;
        cursor: pointer;
        font-family: inherit;
      }
      .tab[active] {
        color: var(--k3-sys-color-primary);
        font-weight: var(--k3-sys-typescale-title-medium-emphasized-weight, 600);
      }
      .tab[active] .icon {
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .icon {
        display: none;
        font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
        font-weight: normal;
        font-style: normal;
        font-size: 1.5rem;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none !important;
        width: 1.5rem;
        height: 1.5rem;
        overflow: hidden;
        speak: never;
        -webkit-font-smoothing: antialiased;
        font-feature-settings: 'liga';
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      .icon[data-k3-icon]::before {
        content: attr(data-k3-icon);
        font-family: inherit;
        font-size: inherit;
        font-variation-settings: inherit;
        font-feature-settings: 'liga';
        text-transform: none !important;
        speak: never;
      }
      :host([variant='primary']) .icon {
        display: block;
      }
      :host([variant='primary']) .tab {
        min-height: 4rem;
        padding-block: 0.875rem 0.75rem;
      }
      .label {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .content {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        max-width: 100%;
      }
      .indicator {
        position: absolute;
        bottom: 0;
        inset-inline-start: 0;
        height: 0.1875rem; /* 3dp — primary token */
        background: var(--k3-sys-color-primary);
        pointer-events: none;
        transition:
          inset-inline-start var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-expressive-spatial),
          width var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-expressive-spatial);
      }
      /*
       * Primary active indicator shape token: 3, 3, 0, 0 (dp)
       * Top corners 3dp — bottom flush against the divider (0).
       * @see https://m3.material.io/components/tabs/specs
       */
      :host([variant='primary']) .indicator {
        height: 0.1875rem;
        border-radius: var(--k3-sys-shape-corner-indicator);
        bottom: 0;
      }
      /* Secondary: 2dp height, full cell, same top-only radius token */
      :host([variant='secondary']) .indicator {
        height: 0.125rem; /* 2dp */
        border-radius: var(--k3-sys-shape-corner-indicator);
      }
      .panels {
        padding-block-start: 1rem;
      }
    `,
  ];

  /** primary = icon+label + short pill; secondary = label + full-cell underline */
  @property({ reflect: true }) variant: TabsVariant = 'secondary';
  @property({ type: Number }) index = 0;
  /** Comma-separated labels */
  @property() labels = 'Tab 1,Tab 2';
  /** Comma-separated Material Symbol ligatures (primary) */
  @property() icons = '';

  @state() private current = 0;
  @state() private indLeft = 0;
  @state() private indWidth = 0;

  private ro?: ResizeObserver;

  override firstUpdated(): void {
    const list = this.renderRoot.querySelector('.tabs');
    if (typeof ResizeObserver !== 'undefined' && list) {
      this.ro = new ResizeObserver(() => this.syncIndicator());
      this.ro.observe(list);
    }
    queueMicrotask(() => this.syncIndicator());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.ro?.disconnect();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('index') && this.index !== this.current) {
      this.current = this.index;
    }
    // Defer measure — avoid Lit “change-in-update” when setting indicator state
    queueMicrotask(() => this.syncIndicator());
  }

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private syncIndicator(): void {
    const row = this.renderRoot.querySelector<HTMLElement>('.tabs');
    const tabs = this.renderRoot.querySelectorAll<HTMLElement>('.tab');
    const active = tabs[this.current];
    if (!active || !row) return;

    let nextWidth: number;
    let physicalLeft: number;

    if (this.variant === 'primary') {
      // Short pill centered on the tab content (icon + label), not full cell
      const content = active.querySelector<HTMLElement>('.content');
      const contentW = content?.offsetWidth ?? 24;
      // M3 primary indicator ≈ content width, min 24dp
      nextWidth = Math.max(24, Math.min(contentW, active.offsetWidth - 16));
      physicalLeft = active.offsetLeft + (active.offsetWidth - nextWidth) / 2;
    } else {
      // Secondary: full tab cell
      physicalLeft = active.offsetLeft;
      nextWidth = active.offsetWidth;
    }

    // inset-inline-start is logical — convert from physical left for RTL
    const rtl = isRtl(row);
    const nextLeft = rtl
      ? row.clientWidth - physicalLeft - nextWidth
      : physicalLeft;

    if (nextLeft === this.indLeft && nextWidth === this.indWidth) return;
    this.indLeft = nextLeft;
    this.indWidth = nextWidth;
  }

  private async select(i: number): Promise<void> {
    if (i === this.current) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user' })) return;
    this.current = i;
    this.index = i;
    await this.updateComplete;
    this.syncIndicator();
    await waitForMotion(this);
    emitLifecycle(this, 'change-end', { source: 'user', index: i });
    this.emit('k3-change', { index: i });
  }

  override render() {
    const labels = this.parseList(this.labels || this.getAttribute('labels') || 'Tab 1,Tab 2');
    const icons = this.parseList(this.icons || this.getAttribute('icons') || '');
    const primary = this.variant === 'primary';

    return html`
      <div
        class=${classMap({ tabs: true, primary, secondary: !primary })}
        part="tablist"
        role="tablist"
        aria-label=${i18n.t('tabs.list')}
      >
        ${labels.map(
          (label, i) => html`
            <button
              type="button"
              class="tab"
              part="tab"
              role="tab"
              ?active=${i === this.current}
              aria-selected=${String(i === this.current)}
              @click=${() => this.select(i)}
            >
              <span class="content" part="content">
                ${primary && icons[i]
                  ? html`<span
                      class="icon notranslate"
                      part="icon"
                      translate="no"
                      lang="zxx"
                      data-k3-icon=${icons[i]!}
                      aria-hidden="true"
                    ></span>`
                  : nothing}
                <span class="label" part="label">${label}</span>
              </span>
            </button>
          `,
        )}
        <div
          class="indicator"
          part="indicator"
          style=${styleMap({
            insetInlineStart: `${this.indLeft}px`,
            width: `${this.indWidth}px`,
          })}
        ></div>
      </div>
      <div class="panels" part="panels"><slot></slot></div>
    `;
  }
}
export default K3Tabs;
