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
 * - Vertical: 56×32 indicator on the icon; stack label below
 * - Horizontal: 56dp pill wraps icon + row label (bar + rail large)
 * - Rail expand/collapse: dual labels always mounted (Android labelGroup +
 *   expandedLabelGroup) — 200ms crossfade + 500ms decelerate; no DOM teleport
 *
 * Layers (scaleX centre→sides):
 * - Hover (::before) — on-surface state layer 8%
 * - Pressed (::before, above indicator) — on-surface / on-secondary-container 12%
 * - Menu-open (::before) — soft secondary-container tint (“semi-selected”);
 *   not the active indicator (M3: one active destination = current page)
 * - Selected (::after) — secondary-container; scaleX(0.4)→1 + opacity (M3)
 *
 * `menu-open` keeps the pill while a secondary menu/sheet is open and the
 * pointer has left the item.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/navigationrail/NavigationRailView.java
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
        /*
         * Width morph — collapse = decelerate; expand overridden below with
         * expressive spatial overshoot (Android PathInterpolator 0.38,1.21,0.22,1).
         */
        --k3-nav-pill-motion: var(--k3-sys-motion-duration-spatial-default, 500ms)
          var(
            --k3-sys-motion-easing-emphasized-decelerate,
            cubic-bezier(0.05, 0.7, 0.1, 1)
          );
        /*
         * Active indicator appear (click) — M3: jump ~40% then spring to 100%
         * + fast opacity; not the 500ms width morph.
         */
        --k3-nav-indicator-motion: var(--k3-sys-motion-duration-medium2, 300ms)
          var(
            --k3-sys-motion-easing-expressive-spatial,
            cubic-bezier(0.38, 1.21, 0.22, 1)
          );
        --k3-nav-indicator-fade: var(--k3-sys-motion-duration-short2, 100ms) linear;
        --k3-nav-pill-effects: var(--k3-sys-motion-duration-effects-default, 200ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
        /* Label crossfade — effects default (smoother than Android’s 100ms snap) */
        --k3-nav-label-fade: var(--k3-sys-motion-duration-effects-default, 200ms)
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
        /* Morph = horizontal only (width / gap / pad-inline) — never height */
        transition:
          width var(--k3-nav-pill-motion),
          max-width var(--k3-nav-pill-motion),
          gap var(--k3-nav-pill-motion),
          padding-inline var(--k3-nav-pill-motion);
      }

      .shell::before,
      .shell::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background-color: transparent;
        transform: scaleX(0.4);
        opacity: 0;
        transform-origin: 50% 50%;
        pointer-events: none;
        transition:
          transform var(--k3-nav-indicator-motion),
          opacity var(--k3-nav-indicator-fade),
          background-color var(--k3-nav-pill-effects);
      }

      /* One paint at M3 40% scale + faded before arming the spring */
      .shell.pill-reset-highlight::before,
      .shell.pill-reset-selected::after {
        transition: none !important;
        transform: scaleX(0.4) !important;
        opacity: 0 !important;
        background-color: transparent !important;
      }

      .shell::before {
        z-index: -2;
      }
      /*
       * Hover / focus / menu-open — M3 state layer on the indicator shape
       * (on-surface @ hover 8%). Not secondary-container — reserved for active.
       */
      .item:hover .shell::before,
      .item:focus-visible .shell::before,
      .shell.highlight::before {
        transform: scaleX(1);
        opacity: 1;
        /* state.hover — --k3-sys-state-hover-opacity 8% */
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-surface) 8%,
          transparent
        );
      }
      /*
       * Pressed — M3 state.pressed 12% (--k3-sys-state-pressed-opacity).
       * Lift above ::after so it reads on the active indicator too
       * (Android ripple sits on the pill).
       */
      .item:active .shell::before {
        z-index: 0;
        transform: scaleX(1);
        opacity: 1;
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-surface) 12%,
          transparent
        );
        transition-duration: 0ms;
      }
      :host([active]) .item:active .shell::before {
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-secondary-container) 12%,
          transparent
        );
      }
      /*
       * Menu open (not current page) — soft secondary-container tint
       * (semi-selected); full secondary-container stays on selected only.
       */
      :host([menu-open]:not([active])) .shell.highlight::before {
        background-color: color-mix(
          in srgb,
          var(--k3-sys-color-secondary-container) 55%,
          transparent
        );
      }
      :host([menu-open][active]) .shell.highlight::before {
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
        opacity: 1;
        background-color: var(--k3-sys-color-secondary-container);
      }

      /* First match springs from 40% + faded (M3 indicator enter) */
      @starting-style {
        .item:hover .shell::before,
        .item:focus-visible .shell::before,
        .shell.highlight::before {
          transform: scaleX(0.4);
          opacity: 0;
          background-color: transparent;
        }
        .shell.selected::after {
          transform: scaleX(0.4);
          opacity: 0;
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

      /*
       * M3 large badge — lives on the glyph (.icon), not the shell, so expand /
       * collapse shell growth never reanchors it (no jump).
       */
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

      /*
       * Dual labels (Android NavigationRailView):
       * - .label--stack = collapsed group (under icon)
       * - .label--row = expanded group (inside shell)
       * Crossfade via --k3-nav-label-fade; geometry 500ms decelerate.
       * Never remount / teleport a single label between shell and item.
       */
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
        transition:
          color var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
          opacity var(--k3-nav-label-fade),
          max-width var(--k3-nav-pill-motion),
          font-size var(--k3-nav-label-fade);
      }
      :host([active]) .label {
        color: var(--k3-sys-color-secondary);
        font-weight: 600;
      }

      /*
       * Row label tucked when vertical — absolute so it does not create a
       * second grid cell inside the compact shell (icon stays centered).
       */
      .label--row {
        position: absolute;
        max-width: 0;
        width: 0;
        height: 0;
        opacity: 0;
        margin: 0;
        padding: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .label--stack {
        opacity: 1;
        max-height: 2rem;
        transform: translateY(0);
        /* Same fade token as row — balanced crossfade expand ↔ collapse */
        transition:
          color var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
          opacity var(--k3-nav-label-fade),
          transform var(--k3-nav-label-fade),
          max-width var(--k3-nav-pill-motion),
          font-size var(--k3-nav-label-fade);
      }

      @media (prefers-reduced-motion: reduce) {
        .label,
        .label--stack {
          transition: color var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
          transform: none;
        }
      }

      /* Horizontal — icon + row label inside the 56dp pill (bar + rail expanded) */
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
        transition:
          width var(--k3-nav-pill-motion),
          max-width var(--k3-nav-pill-motion),
          gap var(--k3-nav-pill-motion),
          padding-inline var(--k3-nav-pill-motion);
      }
      :host([layout='horizontal']) .label--row {
        position: relative;
        display: flex;
        align-items: center;
        width: auto;
        height: 1.5rem;
        font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
        line-height: 1;
        text-align: start;
        max-width: 12rem;
        opacity: 1;
        overflow: hidden;
        pointer-events: auto;
      }
      :host([layout='horizontal']) .label--stack {
        opacity: 0;
        height: 0;
        max-height: 0;
        margin: 0;
        padding: 0;
        pointer-events: none;
        overflow: hidden;
      }
      :host([layout='horizontal'][active]) .label {
        color: var(--k3-sys-color-on-secondary-container);
      }

      /*
       * Rail destinations — collapsed baseline = centered in the compact
       * content track. Same inset when expanded so expand only grows the
       * shell / fades labels (no L/R slide).
       */
      :host([layout='horizontal']):host-context(k3-nav-rail),
      :host([layout='vertical']):host-context(k3-nav-rail) {
        --k3-nav-icon-track: var(
          --k3-nav-rail-content,
          calc(var(--k3-nav-rail-compact, 6.5rem) - 1rem)
        );
        --k3-nav-icon-inset: max(
          0px,
          calc((var(--k3-nav-icon-track) - var(--k3-nav-pill-w)) / 2)
        );
        width: 100%;
        align-self: stretch;
        display: flex;
        justify-content: flex-start;
      }
      /*
       * Expand morph — Android expressive spatial overshoot on width only.
       * Collapse keeps host decelerate (no bounce).
       */
      :host([layout='horizontal']):host-context(
          k3-nav-rail:is([size='large'], [expanded], [mode='expanded']):not([data-collapsing])
        ) {
        --k3-nav-pill-motion: var(--k3-sys-motion-duration-spatial-default, 500ms)
          var(
            --k3-sys-motion-easing-expressive-spatial,
            cubic-bezier(0.38, 1.21, 0.22, 1)
          );
      }
      :host([layout='horizontal']):host-context(k3-nav-rail) .item,
      :host([layout='vertical']):host-context(k3-nav-rail) .item {
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        width: 100%;
        max-width: none;
        /* M3E collapsedItemMinHeight 64dp · expanded 56dp (via rail token) */
        min-height: var(--k3-nav-rail-item-min-height, 4rem);
        margin-inline: 0;
        gap: 0.25rem; /* 4dp icon→label inside destination */
        padding-block: 0;
        padding-inline-start: var(--k3-nav-icon-inset);
        padding-inline-end: var(--k3-nav-icon-inset);
        box-sizing: border-box;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail) .shell,
      :host([layout='vertical']):host-context(k3-nav-rail) .shell {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }
      :host([layout='vertical']):host-context(k3-nav-rail) .shell {
        width: var(--k3-nav-pill-w);
        height: var(--k3-nav-pill-h); /* collapsed indicator 56×32 */
        padding-inline: 0;
        gap: 0;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail) .shell {
        width: auto;
        max-width: calc(100% - var(--k3-nav-icon-inset));
        height: var(--k3-nav-pill-h-row); /* expanded pill 56 tall */
        padding-inline: 0 1.5rem;
      }
      /* Center glyph in the 56dp indicator — same X when the pill grows */
      :host([layout='horizontal']):host-context(k3-nav-rail) .icon,
      :host([layout='vertical']):host-context(k3-nav-rail) .icon {
        margin-inline-start: calc((var(--k3-nav-pill-w) - 1.5rem) / 2);
      }
      /*
       * Stack label — full compact track, centered on the 56dp pill
       * (same axis as icon). One line; ellipsis only if still too long.
       */
      :host([layout='vertical']):host-context(k3-nav-rail) .label--stack,
      :host([layout='horizontal']):host-context(k3-nav-rail) .label--stack {
        box-sizing: border-box;
        width: var(--k3-nav-icon-track);
        max-width: var(--k3-nav-icon-track);
        margin-inline-start: calc(
          (var(--k3-nav-pill-w) - var(--k3-nav-icon-track)) / 2
        );
        margin-inline-end: 0;
        padding-inline: 0.125rem;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: normal;
        line-height: 1rem;
        max-height: 1rem;
      }
      :host([layout='vertical']):host-context(k3-nav-rail) .label--stack {
        opacity: 1;
        height: 1rem;
        max-height: 1rem;
        transform: translateY(0); /* resting = final position */
      }

      /*
       * Two width-only morphs (height snaps, never transitions):
       * - expand: start at collapsed 32h box → release to expanded 56h + width
       * - collapse: snap to collapsed 32h immediately, then tuck width
       */
      :host([layout='horizontal']):host-context(k3-nav-rail[data-expanding]) .shell,
      :host([layout='horizontal']):host-context(k3-nav-rail[data-collapsing]) .shell {
        width: var(--k3-nav-pill-w);
        max-width: var(--k3-nav-pill-w);
        height: var(--k3-nav-pill-h);
        padding-inline: 0;
        gap: 0;
        justify-content: flex-start;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail[data-expanding]) .label--row,
      :host([layout='horizontal']):host-context(k3-nav-rail[data-collapsing]) .label--row {
        max-width: 0;
        width: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
        pointer-events: none;
      }
      /*
       * Collapsed stack — real box during morph (horizontal otherwise height:0).
       * Expand: visible at final Y. Collapse: start 4dp below + faded, then
       * data-stack-in (rail arms after one paint) rises to final Y.
       */
      :host([layout='horizontal']):host-context(k3-nav-rail[data-expanding]) .label--stack,
      :host([layout='horizontal']):host-context(k3-nav-rail[data-collapsing]) .label--stack {
        height: 1rem;
        max-height: 1rem;
        margin: 0;
        margin-inline-start: calc(
          (var(--k3-nav-pill-w) - var(--k3-nav-icon-track)) / 2
        );
        padding-inline: 0.125rem;
        pointer-events: none;
        overflow: hidden;
      }
      :host([layout='horizontal']):host-context(k3-nav-rail[data-expanding]) .label--stack {
        opacity: 1;
        transform: translateY(0);
      }
      :host([layout='horizontal']):host-context(k3-nav-rail[data-collapsing]) .label--stack {
        opacity: 0;
        transform: translateY(0.25rem);
      }
      :host([layout='horizontal']):host-context(k3-nav-rail[data-collapsing][data-stack-in])
        .label--stack {
        opacity: 1;
        transform: translateY(0);
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
    /* Dual labels always mounted (Android labelGroup + expandedLabelGroup). */
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
        >
          ${this.icon ? nothing : html`<slot name="icon"></slot>`}
          <span
            class="badge"
            part="badge"
            ?hidden=${!count}
            role=${count ? 'status' : nothing}
            aria-hidden=${count ? 'false' : 'true'}
            aria-label=${count || nothing}
            >${count || nothing}</span
          >
        </span>
        <span class="label label--row" part="label" aria-hidden=${row ? 'false' : 'true'}
          >${this.label}</span
        >
      </span>
      <span class="label label--stack" part="label" aria-hidden=${row ? 'true' : 'false'}
        >${this.label}<slot></slot
      ></span>
    `;
  }

  override render() {
    const current = this.active ? 'page' : nothing;
    const expanded = this.menuOpen ? 'true' : this.href ? nothing : 'false';
    const count = this.badgeLabel;
    /* Name comes from the visible content (badge + label) — an aria-label in another
       order would not contain the visible text (WCAG 2.5.3 label in name). */
    const ariaLabel = nothing;
    void count;
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

if (!customElements.get('k3-nav-item')) {
  customElements.define('k3-nav-item', K3NavItem);
}
