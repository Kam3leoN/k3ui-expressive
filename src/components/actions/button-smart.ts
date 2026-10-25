import { html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  emitLifecycle,
  focusRingStyles,
  haptic,
  prefersReducedMotion,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonSmartDefaultActiveSubtitle,
  ButtonSmartDefaultHapticDuration,
  ButtonSmartFadeDp,
  ButtonSmartGlyphDp,
  ButtonSmartGridGapDp,
  ButtonSmartHeightDp,
  ButtonSmartIconBoxDp,
  ButtonSmartInsetDp,
  ButtonSmartLabelGapDp,
  ButtonSmartLabelSizeDp,
  ButtonSmartMarqueeDelayMs,
  ButtonSmartMarqueeRestartDelayMs,
  ButtonSmartMorphMs,
  ButtonSmartPadInlineEndDp,
  ButtonSmartPadInlineStartDp,
  ButtonSmartRadiusOnDp,
  ButtonSmartSpecs,
  ButtonSmartSubtitleSizeDp,
} from './button-smart.specs.js';
import { buttonSmartStyles } from './button-smart.styles.js';

/**
 * Button Smart — Material You Quick Settings tile (AOSP).
 *
 * OFF: pill · charcoal surface · ON: squircle · `primary-container`.
 * Label marquee scrolls with a ghost clone when overflowing (Web Animations API).
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

  /** Drives marquee mask + ghost visibility (must survive Lit re-render). */
  @state() private scrolling = false;

  @query('.marquee') private marqueeEl?: HTMLElement;
  @query('.track') private trackEl?: HTMLElement;
  @query('.label:not(.ghost)') private labelEl?: HTMLElement;

  private animation: Animation | null = null;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private resizeObserver: ResizeObserver | null = null;
  private isAnimating = false;
  private marqueeRaf = 0;
  private _unwatchDpr: (() => void) | null = null;

  /**
   * Lock AOSP geometry to CSS px (= dp) with DPR snap — avoids rem/font
   * scaling and fractional hairlines at Windows 125%.
   */
  private applyGeometryTokens = (): void => {
    const set = (name: string, dp: number): void => {
      this.style.setProperty(name, devicePixelSnapCss(dp));
    };
    set('--k3-button-smart-height', ButtonSmartHeightDp);
    set('--k3-button-smart-inset', ButtonSmartInsetDp);
    set('--k3-button-smart-pad-inline-start', ButtonSmartPadInlineStartDp);
    set('--k3-button-smart-pad-inline-end', ButtonSmartPadInlineEndDp);
    set('--k3-button-smart-icon-size', ButtonSmartIconBoxDp);
    set('--k3-button-smart-glyph', ButtonSmartGlyphDp);
    set('--k3-button-smart-radius-on', ButtonSmartRadiusOnDp);
    set('--k3-button-smart-fade', ButtonSmartFadeDp);
    set('--k3-button-smart-label-gap', ButtonSmartLabelGapDp);
    set('--k3-button-smart-label-size', ButtonSmartLabelSizeDp);
    set('--k3-button-smart-subtitle-size', ButtonSmartSubtitleSizeDp);
    /* Parent QS grid — AOSP qs_tile_margin_horizontal (8dp). */
    const grid = this.parentElement;
    if (grid?.classList.contains('btn-smart-grid')) {
      grid.style.setProperty('gap', devicePixelSnapCss(ButtonSmartGridGapDp));
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.applyGeometryTokens();
    this._unwatchDpr?.();
    this._unwatchDpr = watchDevicePixelRatio(this.applyGeometryTokens);
    this.setupMarqueeObserver();
    this.scheduleMarquee();
  }

  override disconnectedCallback(): void {
    this._unwatchDpr?.();
    this._unwatchDpr = null;
    this.stopMarquee();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.marqueeRaf) {
      cancelAnimationFrame(this.marqueeRaf);
      this.marqueeRaf = 0;
    }
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
      this.scheduleMarquee();
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

    window.setTimeout(() => {
      this.isAnimating = false;
      emitLifecycle(this, active ? 'open-end' : 'close-end', {
        source: 'user',
      });
    }, ButtonSmartMorphMs);
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

  private setupMarqueeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.scheduleMarquee());
    /* Observe after first paint — marquee may not exist yet */
    void this.updateComplete.then(() => {
      if (this.marqueeEl && this.resizeObserver) {
        this.resizeObserver.observe(this.marqueeEl);
      }
    });
  }

  private scheduleMarquee(): void {
    if (this.marqueeRaf) cancelAnimationFrame(this.marqueeRaf);
    this.marqueeRaf = requestAnimationFrame(() => {
      this.marqueeRaf = requestAnimationFrame(() => {
        this.marqueeRaf = 0;
        void this.setupMarquee();
      });
    });
  }

  private cancelMarqueeAnimation(): void {
    this.animation?.cancel();
    this.animation = null;
    if (this.restartTimer !== undefined) {
      clearTimeout(this.restartTimer);
      this.restartTimer = undefined;
    }
    if (this.trackEl) {
      this.trackEl.style.transform = '';
      this.trackEl.style.removeProperty('--k3-button-smart-marquee-gap');
    }
  }

  /**
   * AOSP TextView.Marquee — track = [label][gap][ghost];
   * translate by (textWidth + gap). Skip when reduced-motion → ellipsis.
   */
  private async setupMarquee(): Promise<void> {
    const marquee = this.marqueeEl;
    const textEl = this.labelEl;
    if (!marquee || !textEl) return;

    this.cancelMarqueeAnimation();

    const containerWidth = marquee.clientWidth;
    const prevMaxWidth = textEl.style.maxWidth;
    textEl.style.maxWidth = 'none';
    const textWidth = textEl.scrollWidth;
    textEl.style.maxWidth = prevMaxWidth;

    if (containerWidth <= 0 || textWidth <= 0) {
      this.scrolling = false;
      return;
    }

    const overflow = textWidth - containerWidth;
    if (overflow <= 0 || prefersReducedMotion()) {
      this.scrolling = false;
      return;
    }

    if (!this.scrolling) this.scrolling = true;
    await this.updateComplete;

    const track = this.trackEl;
    if (!track || !this.scrolling) return;

    const gap = Math.max(containerWidth, 24);
    track.style.setProperty('--k3-button-smart-marquee-gap', `${gap}px`);
    void track.offsetWidth;

    const distance = textWidth + gap;
    const durationMs =
      (distance / ButtonSmartSpecs.behaviors.marqueeDpPerSecond) * 1000;

    const rtl = getComputedStyle(track).direction === 'rtl';
    const shift = rtl ? distance : -distance;

    const play = (): void => {
      this.animation = track.animate(
        [
          { transform: 'translateX(0)' },
          { transform: `translateX(${shift}px)` },
        ],
        {
          delay: ButtonSmartMarqueeDelayMs,
          duration: durationMs,
          easing: 'linear',
          fill: 'none',
        },
      );
      this.animation.onfinish = () => {
        this.restartTimer = setTimeout(
          play,
          ButtonSmartMarqueeRestartDelayMs,
        );
      };
    };
    play();
  }

  private stopMarquee(): void {
    this.cancelMarqueeAnimation();
    this.scrolling = false;
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
          <span
            class=${classMap({ marquee: true, scrolling: this.scrolling })}
            part="marquee"
          >
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

/** Re-export for tree-shaking-friendly grid helper consumers. */
export { buttonSmartGridStyles } from './button-smart.styles.js';
