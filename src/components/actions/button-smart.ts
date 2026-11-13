import { html, nothing, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  K3Element,
  emitLifecycle,
  focusRingStyles,
  haptic,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  attachTextMarquee,
  type TextMarqueeHandle,
} from '../feedback/text-marquee.js';
import {
  ButtonSmartDefaultActiveSubtitle,
  ButtonSmartDefaultHapticDuration,
  ButtonSmartGeometryCssVars,
  ButtonSmartGridGapDp,
  ButtonSmartMorphMs,
} from './button-smart.specs.js';
import { buttonSmartStyles } from './button-smart.styles.js';

/**
 * Button Smart — Material You Quick Settings tile (AOSP Compose).
 *
 * OFF: pill · charcoal surface · ON: squircle · `primary-container`.
 * Label marquee via {@link attachTextMarquee} when overflowing.
 *
 * ```html
 * <k3-button-smart label="Wi‑Fi" active>
 *   <span slot="icon" class="ms notranslate" data-k3-icon="wifi" translate="no"></span>
 * </k3-button-smart>
 * ```
 *
 * Parent 2-col grid: adopt `buttonSmartGridStyles` (`.btn-smart-grid`) from
 * `button-smart.styles.js` — see JSDoc there.
 *
 * @fires k3-toggle — `{ active: boolean }` after state change
 */
export class K3ButtonSmart extends K3Element {
  static override styles = [hostReset, focusRingStyles, buttonSmartStyles];

  /** Primary label (also used for aria-label). */
  @property() label = '';

  /**
   * Subtitle when `active`.
   * Default English `'On'` — prefer `i18n.t('switch.on')` for locale (FR: Activé).
   */
  @property({ attribute: 'active-subtitle' })
  activeSubtitle = ButtonSmartDefaultActiveSubtitle;

  /** Optional subtitle when inactive (hidden when empty). */
  @property({ attribute: 'inactive-subtitle' })
  inactiveSubtitle = '';

  /** Toggle state — reflects as `active` attribute. */
  @property({ type: Boolean, reflect: true }) active = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Vibration duration (ms). Default `15`.
   * When `> 0` → `navigator.vibrate(duration)` via `haptic.pulse`;
   * when `0` → `haptic.light()`.
   */
  @property({ type: Number, attribute: 'haptic-duration' })
  hapticDuration = ButtonSmartDefaultHapticDuration;

  @query('.marquee') private marqueeEl?: HTMLElement;

  private marquee: TextMarqueeHandle | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isAnimating = false;
  private morphTimer: ReturnType<typeof setTimeout> | null = null;
  private marqueeRaf = 0;
  private unwatchDpr: (() => void) | null = null;

  /**
   * Lock AOSP geometry to CSS px (= dp) with DPR snap — avoids rem/font
   * scaling and fractional hairlines at Windows 125%.
   */
  private applyGeometryTokens = (): void => {
    for (const [name, dp] of ButtonSmartGeometryCssVars) {
      this.style.setProperty(name, devicePixelSnapCss(dp));
    }
    /* Parent QS grid — qs_tile_margin_horizontal / Compose tile gap (8dp). */
    const grid = this.parentElement;
    if (grid?.classList.contains('btn-smart-grid')) {
      grid.style.setProperty('gap', devicePixelSnapCss(ButtonSmartGridGapDp));
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.applyGeometryTokens();
    this.unwatchDpr?.();
    this.unwatchDpr = watchDevicePixelRatio(this.applyGeometryTokens);
    this.bindMarquee();
  }

  override disconnectedCallback(): void {
    this.unwatchDpr?.();
    this.unwatchDpr = null;
    this.clearMorphTimer();
    this.teardownMarquee();
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('label') ||
      changed.has('active') ||
      changed.has('activeSubtitle') ||
      changed.has('inactiveSubtitle')
    ) {
      this.scheduleMarqueeRefresh();
    }
  }

  /** Toggle active ↔ inactive (no-op while morphing or disabled). */
  toggle(): void {
    if (this.disabled || this.isAnimating) return;
    this.setActive(!this.active);
  }

  /** Set active state; emits `k3-toggle` when the value changes. */
  setActive(active: boolean): void {
    if (this.disabled) return;
    if (this.active === active) return;

    this.isAnimating = true;
    this.active = active;

    this.triggerHaptic();
    emitLifecycle(this, active ? 'open-start' : 'close-start', {
      source: 'user',
    });

    this.emit('k3-toggle', { active: this.active });

    this.clearMorphTimer();
    this.morphTimer = setTimeout(() => {
      this.morphTimer = null;
      this.isAnimating = false;
      emitLifecycle(this, active ? 'open-end' : 'close-end', {
        source: 'user',
      });
    }, ButtonSmartMorphMs);
  }

  private clearMorphTimer(): void {
    if (this.morphTimer != null) {
      clearTimeout(this.morphTimer);
      this.morphTimer = null;
    }
  }

  private onActivate = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!emitLifecycle(this, 'press-start', { source: 'user' })) return;
    this.toggle();
    emitLifecycle(this, 'press-end', { source: 'user' });
  };

  private triggerHaptic(): void {
    if (this.hapticDuration > 0) {
      haptic.pulse(this.hapticDuration);
      return;
    }
    haptic.light();
  }

  private resolvedSubtitle(): string {
    if (this.active) {
      return this.activeSubtitle || ButtonSmartDefaultActiveSubtitle;
    }
    return this.inactiveSubtitle;
  }

  private computeAriaLabel(): string {
    const sub = this.resolvedSubtitle();
    return this.label + (sub ? `, ${sub}` : '');
  }

  private bindMarquee(): void {
    this.teardownMarquee();
    void this.updateComplete.then(() => {
      if (!this.isConnected || !this.marqueeEl) return;
      this.marquee = attachTextMarquee(this.marqueeEl);
      this.setupMarqueeObserver();
      this.scheduleMarqueeRefresh();
    });
  }

  private teardownMarquee(): void {
    if (this.marqueeRaf) {
      cancelAnimationFrame(this.marqueeRaf);
      this.marqueeRaf = 0;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.marquee?.stop();
    this.marquee = null;
  }

  private setupMarqueeObserver(): void {
    if (typeof ResizeObserver === 'undefined' || !this.marqueeEl) return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.scheduleMarqueeRefresh());
    this.resizeObserver.observe(this.marqueeEl);
  }

  private scheduleMarqueeRefresh(): void {
    if (this.marqueeRaf) cancelAnimationFrame(this.marqueeRaf);
    this.marqueeRaf = requestAnimationFrame(() => {
      this.marqueeRaf = requestAnimationFrame(() => {
        this.marqueeRaf = 0;
        this.marquee?.refresh();
      });
    });
  }

  override render() {
    const subtitle = this.resolvedSubtitle();
    const label = this.label;

    return html`
      <button
        type="button"
        class="tile k3-focus-ring"
        part="container"
        ?disabled=${this.disabled}
        aria-pressed=${this.active ? 'true' : 'false'}
        aria-label=${this.computeAriaLabel() || nothing}
        @click=${this.onActivate}
      >
        <span
          class="icon notranslate"
          part="icon"
          translate="no"
          lang="zxx"
          aria-hidden="true"
        >
          <slot name="icon"></slot>
        </span>
        <span class="text" part="text">
          <span class="marquee" part="marquee">
            <span class="track" part="track">
              <span class="label" part="label">${label}</span>
              <span class="label ghost" aria-hidden="true">${label}</span>
            </span>
          </span>
          <span
            class="subtitle"
            part="subtitle"
            ?hidden=${!subtitle}
          >${subtitle}</span>
        </span>
      </button>
    `;
  }
}

export default K3ButtonSmart;

if (!customElements.get('k3-button-smart')) {
  customElements.define('k3-button-smart', K3ButtonSmart as CustomElementConstructor);
}

export { ButtonSmartSpecs } from './button-smart.specs.js';
/** Re-export for tree-shaking-friendly grid helper consumers. */
export { buttonSmartGridStyles } from './button-smart.styles.js';
