import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { formatBadgeLabel } from '../feedback/badge.js';

export type NavItemLayout = 'vertical' | 'horizontal';

/**
 * Nav destination pill — M3 Expressive.
 *
 * - Vertical: 56×32 indicator on the icon; label below
 * - Horizontal: 56dp pill wraps icon + label (bar + rail large)
 *
 * Layers (both spring scaleX centre→sides, spatial expressive):
 * - Hover (::before) — on-surface state layer 8%
 * - Menu-open (::before) — soft secondary-container tint (“semi-selected”);
 *   not the active indicator (M3: one active destination = current page)
 * - Selected (::after) — full secondary-container active indicator
 *
 * `menu-open` keeps the pill while a secondary menu/sheet is open and the
 * pointer has left the item.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://m3.material.io/foundations/interaction/states/state-layers
 * @see https://m3.material.io/blog/m3-expressive-motion-theming
 */
export class K3NavItem extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        --k3-nav-pill-w: 3.5rem; /* 56 */
        --k3-nav-pill-h: 2rem; /* 32 — vertical icon indicator */
        --k3-nav-pill-h-row: 3.5rem; /* 56 — horizontal icon+label */
        --k3-nav-pill-gap: 0.75rem;
        --k3-nav-pill-pad-inline: 1rem 1.5rem;
        /* Scheme-aware spatial spring (Expressive bounce · Standard ease) */
        --k3-nav-pill-motion: var(--k3-sys-motion-duration-spatial-default, 500ms)
          var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial));
        --k3-nav-pill-effects: var(--k3-sys-motion-duration-effects-default, 200ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
        display: block;
        box-sizing: border-box;
        width: auto;
        min-width: 0;
        flex: 1 1 0;
        align-self: stretch;
      }
      :host([layout='horizontal']) {
        flex: 0 0 auto;
        align-self: center;
        width: auto;
      }

      .item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        box-sizing: border-box;
        width: 100%;
        min-height: 3rem;
        padding: 0.375rem 0.25rem;
        border: 0;
        margin: 0;
        background: transparent;
        color: var(--k3-sys-color-on-surface-variant);
        font: inherit;
        cursor: pointer;
        text-decoration: none;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        z-index: 0;
      }
      .item:focus,
      .item:focus-visible {
        outline: none;
      }
      .item:hover,
      :host([menu-open]) .item {
        color: var(--k3-sys-color-on-surface);
      }

      .shell {
        position: relative;
        z-index: 0;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        width: var(--k3-nav-pill-w);
        height: var(--k3-nav-pill-h);
        flex-shrink: 0;
        border-radius: var(--k3-sys-shape-corner-full);
      }

      .shell::before,
      .shell::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background-color: transparent;
        transform: scaleX(0);
        transform-origin: 50% 50%;
        pointer-events: none;
        transition:
          transform var(--k3-nav-pill-motion),
          background-color var(--k3-nav-pill-effects);
      }

      /* One paint at scaleX(0) with transitions off before arming spring */
      .shell.pill-reset-highlight::before,
      .shell.pill-reset-selected::after {
        transition: none !important;
        transform: scaleX(0) !important;
        background-color: transparent !important;
      }

      .shell::before {
        z-index: -2;
      }
      /*
       * Hover / focus / menu-open — M3 state layer on the indicator shape
       * (on-surface @ hover 8% · pressed 12% while submenu open).
       * Not secondary-container — that role is reserved for the current page.
       */
      .item:hover .shell::before,
      .item:focus-visible .shell::before,
      .shell.highlight::before {
        transform: scaleX(1);
        /* state.hover 8% — token --k3-sys-state-hover-opacity */
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-surface) 8%,
          transparent
        );
      }
      /*
       * Menu open (not current page) — soft secondary-container tint
       * (semi-selected) so the parent stays readable while the flyout
       * is used; full secondary-container stays on selected only.
       */
      :host([menu-open]:not([active])) .shell.highlight::before {
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-secondary-container) 55%,
          transparent
        );
      }
      :host([menu-open][active]) .shell.highlight::before {
        /* Already selected — pressed state layer on top of indicator */
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-secondary-container) 12%,
          transparent
        );
      }

      .shell::after {
        z-index: -1;
      }
      .shell.selected::after {
        transform: scaleX(1);
        background-color: var(--k3-sys-color-secondary-container);
      }

      /* First :hover / .highlight / .selected match still springs from scaleX(0) */
      @starting-style {
        .item:hover .shell::before,
        .item:focus-visible .shell::before,
        .shell.highlight::before {
          transform: scaleX(0);
          background-color: transparent;
        }
        .shell.selected::after {
          transform: scaleX(0);
          background-color: transparent;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .shell::before,
        .shell::after {
          transition: none;
        }
      }

      .icon {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        flex-shrink: 0;
        font-family: 'Material Symbols Rounded', sans-serif;
        font-size: 1.5rem;
        line-height: 1;
        font-weight: normal;
        speak: never;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        transition:
          font-variation-settings var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
          color var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }
      :host([active]) .icon {
        font-variation-settings:
          'FILL' 1,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        color: var(--k3-sys-color-on-secondary-container);
      }

      /* M3 large badge — anchors on the indicator pill (.shell), not the glyph */
      .badge {
        position: absolute;
        z-index: 2;
        box-sizing: border-box;
        display: grid;
        place-items: center;
        min-width: 1rem;
        height: 1rem;
        padding-inline: 0.25rem;
        inset-block-start: -0.25rem;
        inset-inline-end: -0.125rem;
        pointer-events: none;
        background: var(--k3-sys-color-error);
        color: var(--k3-sys-color-on-error);
        border-radius: var(--k3-sys-shape-corner-full);
        font-family: var(--k3-ref-typeface-plain, inherit);
        font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
        font-weight: var(--k3-sys-typescale-label-small-weight, 500);
        letter-spacing: var(--k3-sys-typescale-label-small-tracking, 0.03rem);
        line-height: 1;
        white-space: nowrap;
      }
      .badge[hidden] {
        display: none;
      }
      /* Horizontal pill — keep badge on the icon’s trailing corner of the shell */
      :host([layout='horizontal']) .badge {
        inset-block-start: 0.5rem;
        inset-inline-end: auto;
        inset-inline-start: calc(1rem + 1.5rem - 0.75rem);
      }

      .label {
        position: relative;
        z-index: 1;
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
        font-weight: 500;
        line-height: 1rem;
        text-align: center;
        color: inherit;
        transition: color var(--k3-sys-motion-duration-short4)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }
      :host([active]) .label {
        color: var(--k3-sys-color-secondary);
        font-weight: 600;
      }

      /* Horizontal — icon + label inside the 56dp pill */
      :host([layout='horizontal']) .item {
        flex-direction: row;
        align-items: center;
        min-height: 0;
        padding: 0;
        width: auto;
      }
      :host([layout='horizontal']) .shell {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: var(--k3-nav-pill-gap);
        width: auto;
        height: var(--k3-nav-pill-h-row);
        padding: 0;
        padding-inline: var(--k3-nav-pill-pad-inline);
      }
      :host([layout='horizontal']) .label {
        display: flex;
        align-items: center;
        height: 1.5rem;
        font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
        line-height: 1;
        text-align: start;
        max-width: none;
      }
      :host([layout='horizontal'][active]) .label {
        color: var(--k3-sys-color-on-secondary-container);
      }

      /* Rail large — full-width destination row */
      :host([layout='horizontal']):host-context(k3-nav-rail) {
        width: 100%;
        align-self: stretch;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail) .item {
        width: 100%;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail) .shell {
        width: 100%;
        justify-content: flex-start;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) active = false;
  /**
   * Secondary menu / sheet open for this destination — keeps the hover pill
   * (state layer) without stealing the selected active indicator.
   */
  @property({ type: Boolean, reflect: true, attribute: 'menu-open' }) menuOpen = false;
  @property({ reflect: true }) layout: NavItemLayout = 'vertical';
  @property() icon = '';
  @property() label = '';
  @property() href = '';
  /**
   * Count / short label for an M3 large badge on the icon
   * (e.g. component catalog size on the Components destination).
   * Empty → no badge. Numbers above 999 → `999+`.
   */
  @property() badge = '';

  /** Internal — drives ::after scaleX after a collapsed paint frame. */
  @state() private selected = false;
  /** Internal — drives ::before when menu-open (survives pointer leaving the item). */
  @state() private highlight = false;
  @state() private pillResetSelected = false;
  @state() private pillResetHighlight = false;

  private selectGen = 0;
  private highlightGen = 0;

  private onClick = (e: Event): void => {
    this.emit('k3-nav-select', { href: this.href, label: this.label });
    if (!this.href) e.preventDefault();
  };

  /** Collapse → paint → arm a spring class (selected / highlight independently). */
  private async armPillClass(
    on: boolean,
    opts: {
      gen: () => number;
      bump: () => number;
      apply: (v: boolean) => void;
      setReset: (v: boolean) => void;
      stillWanted: () => boolean;
    },
  ): Promise<void> {
    const gen = opts.bump();
    if (!on) {
      opts.apply(false);
      opts.setReset(false);
      return;
    }

    opts.apply(false);
    opts.setReset(true);
    await this.updateComplete;
    if (gen !== opts.gen()) return;

    const shell = this.renderRoot.querySelector<HTMLElement>('.shell');
    if (shell) void shell.offsetWidth;

    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (gen !== opts.gen() || !opts.stillWanted()) return;

    opts.setReset(false);
    opts.apply(true);
  }

  /** Collapse → paint → arm `.selected` (same spring as hover / highlight). */
  private armSelectedPill(on: boolean): Promise<void> {
    return this.armPillClass(on, {
      gen: () => this.selectGen,
      bump: () => ++this.selectGen,
      apply: (v) => {
        this.selected = v;
      },
      setReset: (v) => {
        this.pillResetSelected = v;
      },
      stillWanted: () => this.active,
    });
  }

  /** Collapse → paint → arm `.highlight` for menu-open state layer. */
  private armHighlightPill(on: boolean): Promise<void> {
    /*
     * If the pointer is already over the item, ::before is painted by :hover.
     * Skip the reset frame so opening the menu does not collapse the pill.
     */
    if (on) {
      const item = this.renderRoot.querySelector('.item');
      if (item?.matches(':hover') || item?.matches(':focus-visible')) {
        this.highlightGen++;
        this.pillResetHighlight = false;
        this.highlight = true;
        return Promise.resolve();
      }
    }
    return this.armPillClass(on, {
      gen: () => this.highlightGen,
      bump: () => ++this.highlightGen,
      apply: (v) => {
        this.highlight = v;
      },
      setReset: (v) => {
        this.pillResetHighlight = v;
      },
      stillWanted: () => this.menuOpen,
    });
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('active')) {
      /* Defer @state writes past this update cycle */
      queueMicrotask(() => void this.armSelectedPill(this.active));
    }
    if (changed.has('menuOpen')) {
      queueMicrotask(() => void this.armHighlightPill(this.menuOpen));
    }
  }

  override disconnectedCallback(): void {
    this.selectGen++;
    this.highlightGen++;
    super.disconnectedCallback();
  }

  private get badgeLabel(): string {
    return formatBadgeLabel(this.badge);
  }

  private body() {
    const label = html`<span class="label" part="label">${this.label}<slot></slot></span>`;
    const row = this.layout === 'horizontal';
    const count = this.badgeLabel;
    return html`
      <span
        class=${classMap({
          shell: true,
          selected: this.selected,
          highlight: this.highlight,
          'pill-reset-selected': this.pillResetSelected,
          'pill-reset-highlight': this.pillResetHighlight,
        })}
        part="indicator"
      >
        <span
          class="icon notranslate"
          part="icon"
          translate="no"
          lang="zxx"
          aria-hidden="true"
          data-k3-icon=${this.icon || nothing}
          >${this.icon ? nothing : html`<slot name="icon"></slot>`}</span
        >
        <span
          class="badge"
          part="badge"
          ?hidden=${!count}
          role=${count ? 'status' : nothing}
          aria-hidden=${count ? 'false' : 'true'}
          aria-label=${count || nothing}
          >${count || nothing}</span
        >
        ${row ? label : nothing}
      </span>
      ${row ? nothing : label}
    `;
  }

  override render() {
    const current = this.active ? 'page' : nothing;
    const expanded = this.menuOpen ? 'true' : this.href ? nothing : 'false';
    const count = this.badgeLabel;
    const ariaLabel = count ? `${this.label}, ${count}` : nothing;
    if (this.href) {
      return html`<a
        class="item"
        part="container"
        href=${this.href}
        aria-current=${current}
        aria-label=${ariaLabel}
        @click=${this.onClick}
        >${this.body()}</a
      >`;
    }
    return html`<button
      type="button"
      class="item"
      part="container"
      aria-current=${current}
      aria-expanded=${expanded}
      aria-haspopup="menu"
      aria-label=${ariaLabel}
      @click=${this.onClick}
    >
      ${this.body()}
    </button>`;
  }
}
export default K3NavItem;
