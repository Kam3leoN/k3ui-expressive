import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { ScrollToTopSpecs } from './scroll-to-top.specs.js';
import { scrollToTopStyles } from './scroll-to-top.styles.js';

/**
 * Floating scroll-to-top — shows after `threshold`, optional SVG progress ring.
 *
 * @fires k3-scroll-top — after scroll animation completes (if enabled)
 */
export class K3ScrollToTop extends K3Element {
  static override styles = [hostReset, scrollToTopStyles];

  @property({ type: Number }) threshold = ScrollToTopSpecs.behaviors.threshold;
  @property({ type: Number }) size = ScrollToTopSpecs.behaviors.size;
  @property({ type: Number, attribute: 'stroke-width' }) strokeWidth =
    ScrollToTopSpecs.behaviors.strokeWidth;
  @property({ type: Number, attribute: 'right-offset' }) rightOffset =
    ScrollToTopSpecs.behaviors.rightOffset;
  @property({ type: Number, attribute: 'bottom-offset' }) bottomOffset =
    ScrollToTopSpecs.behaviors.bottomOffset;
  @property({ type: Boolean, attribute: 'show-progress' }) showProgress =
    ScrollToTopSpecs.behaviors.showProgress;
  @property({ type: Number, attribute: 'scroll-duration' }) scrollDuration =
    ScrollToTopSpecs.motion.scrollDuration;
  /**
   * CSS selector for a scrollable element (e.g. `.shell-scroll`).
   * Empty = `window`.
   */
  @property({ attribute: 'scroll-container' }) scrollContainer = '';
  /** Material icon ligature for the inner glyph. */
  @property() icon = ScrollToTopSpecs.behaviors.icon;
  /** Dispatch `k3-scroll-top` when scroll-to-top animation finishes. */
  @property({ type: Boolean, attribute: 'emit-on-complete' }) emitOnComplete = true;

  @state() private visible = false;
  @state() private pressed = false;
  @state() private progressOffset = 0;

  private circumference = 0;
  private rafId: number | null = null;
  private scrollRoot: Window | HTMLElement = window;
  private onScrollBound = (): void => this.updateFromScroll();

  private applyCssVars(): void {
    this.style.setProperty('--k3-scroll-to-top-size', `${this.size}px`);
    this.style.setProperty('--k3-scroll-to-top-right', `${this.rightOffset}px`);
    this.style.setProperty('--k3-scroll-to-top-bottom', `${this.bottomOffset}px`);
  }

  private computeCircumference(): number {
    const stroke = Math.max(2, this.strokeWidth);
    const radius = (Math.max(36, this.size) - stroke) / 2;
    return 2 * Math.PI * radius;
  }

  private resolveScrollRoot(): Window | HTMLElement {
    if (!this.scrollContainer.trim()) return window;
    const el = document.querySelector(this.scrollContainer);
    return el instanceof HTMLElement ? el : window;
  }

  /** Vitest/jsdom: `instanceof Window` can fail across realms — prefer identity. */
  private isWindowRoot(root: Window | HTMLElement): root is Window {
    return root === window || !(root instanceof Element);
  }

  private bindScrollRoot(root: Window | HTMLElement): void {
    this.unbindScrollRoot();
    this.scrollRoot = root;
    if (this.isWindowRoot(root)) {
      /* jsdom + some browsers: scroll may surface on window or document */
      window.addEventListener('scroll', this.onScrollBound, { passive: true });
      document.addEventListener('scroll', this.onScrollBound, { passive: true });
    } else {
      root.addEventListener('scroll', this.onScrollBound, { passive: true });
    }
    window.addEventListener('resize', this.onScrollBound, { passive: true });
  }

  private unbindScrollRoot(): void {
    const root = this.scrollRoot;
    if (this.isWindowRoot(root)) {
      window.removeEventListener('scroll', this.onScrollBound);
      document.removeEventListener('scroll', this.onScrollBound);
    } else {
      root.removeEventListener('scroll', this.onScrollBound);
    }
    window.removeEventListener('resize', this.onScrollBound);
  }

  private getScrollState(): { top: number; max: number } {
    const root = this.scrollRoot;
    if (this.isWindowRoot(root)) {
      const top =
        Number(root.scrollY) ||
        Number(document.documentElement.scrollTop) ||
        Number(document.body?.scrollTop) ||
        0;
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - root.innerHeight,
      );
      return { top, max };
    }
    return {
      top: root.scrollTop,
      max: Math.max(0, root.scrollHeight - root.clientHeight),
    };
  }

  private setScrollTop(value: number): void {
    const root = this.scrollRoot;
    if (this.isWindowRoot(root)) root.scrollTo(0, value);
    else root.scrollTop = value;
  }

  private updateFromScroll(): void {
    const { top, max } = this.getScrollState();
    const progress = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
    this.progressOffset = this.circumference * (1 - progress);
    const shouldShow = top > this.threshold;
    if (shouldShow !== this.visible) {
      this.visible = shouldShow;
      this.toggleAttribute('data-visible', shouldShow);
    }
  }

  /** Smooth-scrolls the active scroll root to the top. */
  scrollToTop(): void {
    const { top } = this.getScrollState();
    if (top <= 0) return;

    if (prefersReducedMotion() || this.scrollDuration <= 0) {
      this.setScrollTop(0);
      if (this.emitOnComplete) this.emit('k3-scroll-top', {});
      return;
    }

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const startTop = top;
    const startTime = performance.now();
    const minDuration = ScrollToTopSpecs.motion.minScrollDuration;
    const maxDuration = Math.max(minDuration, this.scrollDuration);
    const viewport = this.isWindowRoot(this.scrollRoot)
      ? this.scrollRoot.innerHeight
      : this.scrollRoot.clientHeight;
    const travelRatio = Math.min(1, startTop / Math.max(1, viewport * 2));
    const duration = Math.round(minDuration + (maxDuration - minDuration) * travelRatio);

    const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

    const step = (now: number): void => {
      const t = Math.min((now - startTime) / duration, 1);
      const nextTop = Math.max(0, startTop * (1 - easeOutExpo(t)));
      this.setScrollTop(nextTop);
      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
        return;
      }
      this.rafId = null;
      if (this.emitOnComplete) this.emit('k3-scroll-top', {});
    };

    this.rafId = requestAnimationFrame(step);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.circumference = this.computeCircumference();
    this.progressOffset = this.circumference;
    this.applyCssVars();
    this.bindScrollRoot(this.resolveScrollRoot());
    queueMicrotask(() => this.updateFromScroll());
  }

  override disconnectedCallback(): void {
    this.unbindScrollRoot();
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('scrollContainer')) {
      this.bindScrollRoot(this.resolveScrollRoot());
      this.updateFromScroll();
    }
    if (
      changed.has('size') ||
      changed.has('strokeWidth') ||
      changed.has('rightOffset') ||
      changed.has('bottomOffset')
    ) {
      this.circumference = this.computeCircumference();
      this.applyCssVars();
      this.updateFromScroll();
    }
  }

  override render() {
    const stroke = Math.max(2, this.strokeWidth);
    const box = Math.max(36, this.size);
    const radius = (box - stroke) / 2;
    const cx = box / 2;

    return html`
      <button
        type="button"
        class=${classMap({ btn: true, 'is-pressed': this.pressed })}
        part="button"
        aria-label=${i18n.t(
          'scrollToTop.ariaLabel',
          ScrollToTopSpecs.accessibility.ariaLabel,
        )}
        @click=${() => this.scrollToTop()}
        @pointerdown=${() => {
          this.pressed = true;
        }}
        @pointerup=${() => {
          this.pressed = false;
        }}
        @pointerleave=${() => {
          this.pressed = false;
        }}
      >
        ${this.showProgress
          ? html`
              <svg class="ring" viewBox="0 0 ${box} ${box}" aria-hidden="true">
                <circle
                  class="ring-base"
                  cx=${cx}
                  cy=${cx}
                  r=${radius}
                  stroke-width=${stroke}
                ></circle>
                <circle
                  class="ring-progress"
                  cx=${cx}
                  cy=${cx}
                  r=${radius}
                  stroke-width=${stroke}
                  stroke-dasharray=${this.circumference}
                  stroke-dashoffset=${this.progressOffset}
                ></circle>
              </svg>
            `
          : nothing}
        <span
          class="icon ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${this.icon}
          aria-hidden="true"
        ></span>
      </button>
    `;
  }
}

export default K3ScrollToTop;

if (!customElements.get('k3-scroll-to-top')) {
  customElements.define('k3-scroll-to-top', K3ScrollToTop);
}
