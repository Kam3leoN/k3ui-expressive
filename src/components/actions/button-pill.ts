import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonPillDefaultLayout,
  type ButtonPillLayout,
} from './button-pill.specs.js';
import { buttonPillStyles } from './button-pill.styles.js';

/**
 * Button Pill — isolated destination control (nav-rail / nav-bar chrome).
 *
 * - **vertical** (default): icon inside a 56×32 pill; label below
 * - **horizontal**: 56dp pill wraps icon + label (inline)
 *
 * Selected / hover / `menu-open` use the same scaleX spring as former `k3-nav-item`.
 * Not wired into nav yet — drop-in ready for rail / bar.
 *
 * ```html
 * <k3-button-pill icon="home" label="Home"></k3-button-pill>
 * <k3-button-pill layout="horizontal" icon="explore" label="Explore" selected></k3-button-pill>
 * ```
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export class K3ButtonPill extends K3Element {
  static override styles = [hostReset, buttonPillStyles];

  /** Selected / current destination — active indicator (::after). */
  @property({ type: Boolean, reflect: true }) selected = false;

  /**
   * Secondary menu / sheet open — keeps the hover pill (state layer)
   * without stealing the selected indicator.
   */
  @property({ type: Boolean, reflect: true, attribute: 'menu-open' })
  menuOpen = false;

  /** vertical = icon pill + label below · horizontal = icon+label row pill */
  @property({ reflect: true }) layout: ButtonPillLayout = ButtonPillDefaultLayout;

  /** Full-width host + shell (rail expanded rows). */
  @property({ type: Boolean, reflect: true }) stretch = false;

  @property() icon = '';
  @property() label = '';
  @property() href = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Internal — drives ::after scaleX after a collapsed paint frame. */
  @state() private selectedArmed = false;
  /** Internal — drives ::before when menu-open. */
  @state() private highlight = false;
  @state() private pillResetSelected = false;
  @state() private pillResetHighlight = false;

  private selectGen = 0;
  private highlightGen = 0;

  private onActivate = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    if (!emitLifecycle(this, 'press-start', { source: 'user' })) return;
    this.emit('k3-activate', { href: this.href, label: this.label, selected: this.selected });
    emitLifecycle(this, 'press-end', { source: 'user' });
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

  private armSelectedPill(on: boolean): Promise<void> {
    return this.armPillClass(on, {
      gen: () => this.selectGen,
      bump: () => ++this.selectGen,
      apply: (v) => {
        this.selectedArmed = v;
      },
      setReset: (v) => {
        this.pillResetSelected = v;
      },
      stillWanted: () => this.selected,
    });
  }

  private armHighlightPill(on: boolean): Promise<void> {
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
    if (changed.has('selected')) {
      queueMicrotask(() => void this.armSelectedPill(this.selected));
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

  private body() {
    const label = html`<span class="label" part="label">${this.label}<slot></slot></span>`;
    const row = this.layout === 'horizontal';
    return html`
      <span
        class=${classMap({
      shell: true,
      selected: this.selectedArmed,
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
        ${row ? label : nothing}
      </span>
      ${row ? nothing : label}
    `;
  }

  override render() {
    const current = this.selected ? 'page' : nothing;
    if (this.href) {
      return html`<a
        class="item"
        part="container"
        href=${this.href}
        aria-current=${current}
        aria-disabled=${this.disabled ? 'true' : nothing}
        tabindex=${this.disabled ? -1 : nothing}
        @click=${this.onActivate}
        >${this.body()}</a
      >`;
    }
    return html`<button
      type="button"
      class="item"
      part="container"
      ?disabled=${this.disabled}
      aria-current=${current}
      aria-expanded=${this.menuOpen ? 'true' : nothing}
      aria-haspopup=${this.menuOpen ? 'menu' : nothing}
      @click=${this.onActivate}
    >
      ${this.body()}
    </button>`;
  }
}

export default K3ButtonPill;

if (!customElements.get('k3-button-pill')) {
  customElements.define('k3-button-pill', K3ButtonPill);
}
