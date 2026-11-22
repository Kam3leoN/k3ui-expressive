import { html, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, stateLayerStyles, emitLifecycle, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { fabHide, fabShow, fabVisibilityCss } from './fab-visibility.js';
import { extendedFabStyles } from './extended-fab.styles.js';

/** Match nav-rail width spring (+ buffer) — clear inline px after morph. */
const RAIL_MORPH_MS = 520;

/**
 * Extended FAB — icon + label (always expanded).
 * Separate from `k3-fab` (icon-only sizes).
 *
 * Visibility: {@link show} / {@link hide} (scale + fade).
 * Nav-rail: {@link setRailCollapsed} springs host width (pill ↔ square).
 */
export class K3ExtendedFab extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    unsafeCSS(fabVisibilityCss),
    extendedFabStyles,
  ];

  @property({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ reflect: true }) variant: 'primary' | 'surface' | 'secondary' | 'tertiary' =
    'primary';
  @property({ type: Boolean, reflect: true }) disabled = false;

  private visibilityGen = 0;
  private railMorphTimer = 0;

  private clearRailMorphTimer(): void {
    if (!this.railMorphTimer) return;
    window.clearTimeout(this.railMorphTimer);
    this.railMorphTimer = 0;
  }

  private clearRailMorphInline(): void {
    this.style.removeProperty('width');
    this.style.removeProperty('max-width');
    this.style.removeProperty('transition');
    this.railMorphTimer = 0;
  }

  private railSquarePx(): number {
    const h = Math.round(this.getBoundingClientRect().height);
    return h > 0 ? h : 56;
  }

  private measurePillWidth(from: number): number {
    const fabBtn = this.renderRoot?.querySelector('.fab') as HTMLElement | null;
    return (
      Math.max(
        Math.round(this.getBoundingClientRect().width),
        Math.round(this.scrollWidth),
        fabBtn ? Math.round(fabBtn.scrollWidth) : 0,
      ) || from
    );
  }

  private springWidth(_from: number, to: number): void {
    this.style.width = `${to}px`;
    this.style.maxWidth = `${to}px`;
    this.railMorphTimer = window.setTimeout(() => this.clearRailMorphInline(), RAIL_MORPH_MS);
  }

  /**
   * Nav-rail morph — icon-only square ↔ extended pill.
   * Both directions spring on explicit px widths (fit-content alone snaps).
   * Locks max-width during flight so collapsed CSS (`max-width: h`) doesn’t clip the glide.
   * @param animate false = instant (boot / reduced-motion)
   */
  setRailCollapsed(collapsed: boolean, animate = true): void {
    const isCollapsed = this.hasAttribute('data-rail-collapsed');
    if (collapsed === isCollapsed) return;

    this.clearRailMorphTimer();
    const runAnimate = animate && !prefersReducedMotion();

    if (!runAnimate) {
      this.clearRailMorphInline();
      this.toggleAttribute('data-rail-collapsed', collapsed);
      return;
    }

    const from = Math.round(this.getBoundingClientRect().width) || this.railSquarePx();

    if (collapsed) {
      /* pill → square — label stays put; host clip hides it */
      const to = this.railSquarePx();
      this.style.width = `${from}px`;
      this.style.maxWidth = `${from}px`;
      void this.offsetWidth;
      this.setAttribute('data-rail-collapsed', '');
      this.springWidth(from, to);
      return;
    }

    /* square → pill — measure full pill, then spring width (host clip reveals label) */
    this.style.transition = 'none';
    this.removeAttribute('data-rail-collapsed');
    this.style.width = 'auto';
    this.style.maxWidth = 'none';
    void this.offsetWidth;
    const to = this.measurePillWidth(from);
    this.style.width = `${from}px`;
    this.style.maxWidth = `${Math.max(from, to)}px`;
    void this.offsetWidth;
    this.style.removeProperty('transition');
    void this.offsetWidth;
    this.springWidth(from, to);
  }

  /** Animate in (M3 FAB show). */
  async show(): Promise<boolean> {
    const gen = ++this.visibilityGen;
    await fabShow(this);
    return gen === this.visibilityGen;
  }

  /** Animate out then `hidden` (M3 FAB hide). */
  async hide(): Promise<boolean> {
    const gen = ++this.visibilityGen;
    await fabHide(this);
    return gen === this.visibilityGen;
  }

  override disconnectedCallback(): void {
    this.clearRailMorphTimer();
    this.clearRailMorphInline();
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <button
        part="container"
        type="button"
        class=${classMap({
          fab: true,
          'k3-state-layer': true,
          [this.variant]: true,
        })}
        ?disabled=${this.disabled}
        @pointerdown=${() => {
          if (this.disabled) return;
          this.setAttribute('data-pressed', '');
          emitLifecycle(this, 'press-start', { source: 'user' });
        }}
        @pointerup=${() => {
          this.removeAttribute('data-pressed');
          emitLifecycle(this, 'press-end', { source: 'user' });
        }}
        @pointerleave=${() => this.removeAttribute('data-pressed')}
        @click=${() => this.emit('k3-click')}
      >
        <span part="icon" class="icon"><slot name="icon"></slot></span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }
}
export default K3ExtendedFab;

if (!customElements.get('k3-extended-fab')) {
  customElements.define('k3-extended-fab', K3ExtendedFab);
}
