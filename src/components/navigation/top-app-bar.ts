import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/** M3 Expressive app bar sizes */
export type AppBarSize = 'small' | 'medium' | 'large';
export type AppBarAlign = 'start' | 'center';

/**
 * Top app bar — small · medium flexible · large flexible (M3 Expressive).
 * `sticky` pins to the top of the scrollport.
 */
export class K3TopAppBar extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        z-index: 10;
        --k3-appbar-h: 4rem; /* 64 small */
        --k3-appbar-title-size: var(--k3-sys-typescale-title-large-size);
        --k3-appbar-title-weight: 400;
      }
      :host([size='medium']) {
        --k3-appbar-h: 7rem; /* 112 flexible */
        --k3-appbar-title-size: var(--k3-sys-typescale-headline-small-size, 1.5rem);
        --k3-appbar-title-weight: 400;
      }
      :host([size='large']) {
        --k3-appbar-h: 7.5rem; /* 120 flexible */
        --k3-appbar-title-size: var(--k3-sys-typescale-headline-medium-size, 1.75rem);
        --k3-appbar-title-weight: 400;
      }
      :host([sticky]) {
        position: sticky;
        top: 0;
      }
      .bar {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto auto;
        align-items: center; /* M3: icon buttons + headline share one vertical center */
        column-gap: 0.25rem; /* 4dp — IconButton padding already yields ~16dp to glyph */
        min-height: var(--k3-appbar-h);
        padding-inline: 0.25rem; /* 4dp → 16dp to icon with 48dp touch target */
        padding-block: 0;
        padding-top: env(safe-area-inset-top, 0px);
        background: var(--k3-sys-color-surface);
        color: var(--k3-sys-color-on-surface);
        box-sizing: border-box;
      }
      :host([size='small']) .bar {
        grid-template-rows: 1fr;
        min-height: 4rem; /* 64dp */
      }
      :host([size='medium']) .bar,
      :host([size='large']) .bar {
        /* Row 1 = 64dp icon strip (centered); row 2 = flexible titles */
        grid-template-rows: 4rem auto;
      }
      :host([elevated]) .bar,
      :host([scrolled]) .bar {
        background: var(--k3-sys-color-surface-container);
        box-shadow: none; /* M3: fill, not drop shadow */
      }
      :host([sticky]) .bar {
        background: color-mix(
          in srgb,
          var(--k3-sys-color-surface) 92%,
          transparent
        );
        backdrop-filter: blur(12px);
      }
      :host([sticky][elevated]) .bar,
      :host([sticky][scrolled]) .bar {
        background: color-mix(
          in srgb,
          var(--k3-sys-color-surface-container) 92%,
          transparent
        );
      }
      .leading {
        grid-column: 1;
        grid-row: 1;
        display: inline-flex;
        align-items: center;
        align-self: center;
        gap: 0;
        min-height: 3rem; /* 48dp row with icons */
      }
      .trailing {
        grid-column: 3;
        grid-row: 1;
        display: inline-flex;
        align-items: center;
        align-self: center;
        justify-self: end;
        gap: 0; /* actions sit in 48dp targets; 8dp optical via button padding */
        min-height: 3rem;
      }
      .titles {
        grid-column: 2;
        grid-row: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-self: center;
        gap: 0.125rem;
        /* Spec: ~24dp from leading edge of bar to title when nav icon present
           (4dp pad + 48dp button + ~4dp gap ≈ title start) — tighten with padding */
        padding-inline-start: 0.25rem;
      }
      :host([size='medium']) .titles,
      :host([size='large']) .titles {
        grid-column: 1 / -1;
        grid-row: 2;
        padding-inline: 1rem;
        padding-block-end: 0.75rem;
        align-self: end;
      }
      :host([size='small'][align='center']) .titles {
        grid-column: 1 / -1;
        grid-row: 1;
        text-align: center;
        align-items: center;
        pointer-events: none;
      }
      :host([size='small'][align='center']) .leading,
      :host([size='small'][align='center']) .trailing {
        z-index: 1;
      }
      :host([align='center']:not([size='small'])) .titles {
        text-align: center;
        align-items: center;
      }
      .headline {
        font-size: var(--k3-appbar-title-size);
        font-weight: var(--k3-appbar-title-weight);
        line-height: var(--k3-sys-typescale-title-large-line-height, 1.75rem); /* 28dp */
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      :host([size='medium']) .headline,
      :host([size='large']) .headline {
        white-space: normal;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .subtitle {
        font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
        color: var(--k3-sys-color-on-surface-variant);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .subtitle:not(.has) {
        display: none;
      }
      :host([size='medium'][data-subtitle]),
      :host([size='large'][data-subtitle]) {
        --k3-appbar-h: 8.5rem; /* +subtitle */
      }
    `,
  ];

  @property({ reflect: true }) size: AppBarSize = 'small';
  @property({ reflect: true }) align: AppBarAlign = 'start';
  @property({ type: Boolean, reflect: true }) elevated = false;
  @property({ type: Boolean, reflect: true }) sticky = false;
  /** Optional subtitle (medium / large flexible) */
  @property() subtitle = '';

  override willUpdate(): void {
    const hasSubtitle = !!this.subtitle || this.hasSlot('subtitle');
    this.toggleAttribute('data-subtitle', hasSubtitle);
  }

  override render() {
    const hasSubtitle = !!this.subtitle || this.hasSlot('subtitle');
    return html`<header
      class=${classMap({ bar: true })}
      part="container"
    >
      <div class="leading" part="leading"><slot name="leading"></slot></div>
      <div class="titles" part="titles">
        <div class="headline" part="headline">
          <slot name="headline"></slot><slot></slot>
        </div>
        <div class="subtitle ${hasSubtitle ? 'has' : ''}" part="subtitle">
          ${this.subtitle || nothing}<slot name="subtitle"></slot>
        </div>
      </div>
      <div class="trailing" part="trailing"><slot name="trailing"></slot></div>
    </header>`;
  }
}
export default K3TopAppBar;

if (!customElements.get('k3-top-app-bar')) {
  customElements.define('k3-top-app-bar', K3TopAppBar);
}
