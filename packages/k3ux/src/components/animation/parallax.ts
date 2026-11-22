import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, i18n, prefersReducedMotion } from 'k3ui';
import { hostReset } from '../_shared.js';
import {
  K3ParallaxSlide,
  type ParallaxSlideState,
} from './parallax/parallax-slide.js';
import { ParallaxSpecs } from './parallax/parallax.specs.js';
import { parallaxStyles } from './parallax/parallax.styles.js';

export { ParallaxSpecs };
export { K3ParallaxSlide, type ParallaxSlideState } from './parallax/parallax-slide.js';

/**
 * Full-page wheel/touch parallax stack — Lit port of
 * [CodePen eehayman/qdGZJr](https://codepen.io/eehayman/pen/qdGZJr).
 *
 * ```html
 * <k3-parallax style="height: 70vh">
 *   <k3-parallax-slide
 *     background="https://…"
 *     heading="Full Page Parallax Effect"
 *     subtitle="Scroll down and up to see the effect!"
 *   ></k3-parallax-slide>
 *   <k3-parallax-slide background="https://…" heading="Second" subtitle="…"></k3-parallax-slide>
 * </k3-parallax>
 * ```
 *
 * @fires k3-parallax-change — `{ index, previousIndex, direction }`
 */
export class K3Parallax extends K3Element {
  static override styles = [hostReset, parallaxStyles];

  /** Wheel delta threshold (higher = less sensitive). */
  @property({ type: Number }) sensitivity = ParallaxSpecs.sensitivity;
  /** Lock duration after a slide change (ms). */
  @property({ type: Number, attribute: 'lock-ms' }) lockMs = ParallaxSpecs.lockMs;
  /** Wheel listener throttle (ms). */
  @property({ type: Number, attribute: 'throttle-ms' }) throttleMs = ParallaxSpecs.throttleMs;
  /** Background translate offset (CSS length). */
  @property({ attribute: 'parallax-offset' }) parallaxOffset = ParallaxSpecs.parallaxOffset;
  /** Content translate when off-screen (CSS length). */
  @property({ attribute: 'content-offset' }) contentOffset = ParallaxSpecs.contentOffset;
  /** Slide transition duration (ms). */
  @property({ type: Number, attribute: 'transition-ms' })
  transitionMs = ParallaxSpecs.transitionMs;
  /** Dark overlay opacity 0–1. */
  @property({ type: Number }) overlay = ParallaxSpecs.overlay;
  /** Disable interaction. */
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Honor `prefers-reduced-motion` (default true). */
  @property({ type: Boolean, attribute: 'disable-for-reduced-motion' })
  disableForReducedMotion = ParallaxSpecs.behaviors.disableForReducedMotion;

  private index = 0;
  private locked = false;
  private unlockTimer = 0;
  private lastWheel = 0;
  private touchStartY: number | null = null;
  private slotEl: HTMLSlotElement | null = null;
  private onWheel = (e: WheelEvent): void => this.handleWheel(e);
  private onKey = (e: KeyboardEvent): void => this.handleKey(e);
  private onTouchStart = (e: TouchEvent): void => {
    this.touchStartY = e.touches[0]?.clientY ?? null;
  };
  private onTouchEnd = (e: TouchEvent): void => {
    if (this.touchStartY == null) return;
    const y = e.changedTouches[0]?.clientY;
    if (y == null) return;
    const dy = this.touchStartY - y;
    this.touchStartY = null;
    if (Math.abs(dy) < 48) return;
    if (dy > 0) this.next();
    else this.previous();
  };

  get currentIndex(): number {
    return this.index;
  }

  get slideCount(): number {
    return this.slides().length;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', ParallaxSpecs.accessibility.role);
    }
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', i18n.t('parallax.ariaLabel', 'Parallax slides'));
    }
    this.tabIndex = this.tabIndex < 0 ? 0 : this.tabIndex;
    this.addEventListener('wheel', this.onWheel, { passive: false });
    this.addEventListener('keydown', this.onKey);
    this.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.addEventListener('touchend', this.onTouchEnd, { passive: true });
    this.syncReducedMotionAttr();
    void this.updateComplete.then(() => this.refreshSlides(true));
  }

  override disconnectedCallback(): void {
    this.removeEventListener('wheel', this.onWheel);
    this.removeEventListener('keydown', this.onKey);
    this.removeEventListener('touchstart', this.onTouchStart);
    this.removeEventListener('touchend', this.onTouchEnd);
    window.clearTimeout(this.unlockTimer);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('parallaxOffset') ||
      changed.has('contentOffset') ||
      changed.has('transitionMs') ||
      changed.has('overlay')
    ) {
      this.applyCssVars();
    }
    if (changed.has('disableForReducedMotion')) this.syncReducedMotionAttr();
  }

  /** Go to the next slide (wheel down). */
  next(): void {
    this.goTo(this.index + 1, 'down');
  }

  /** Go to the previous slide (wheel up). */
  previous(): void {
    this.goTo(this.index - 1, 'up');
  }

  /** Jump to a slide index (clamped). */
  goTo(index: number, direction: 'down' | 'up' | 'jump' = 'jump'): void {
    if (this.disabled) return;
    const slides = this.slides();
    if (!slides.length) return;
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (next === this.index && direction !== 'jump') return;
    if (this.locked && direction !== 'jump') return;

    const previousIndex = this.index;
    this.index = next;
    this.applySlideStates();
    if (direction !== 'jump') this.lock();
    this.emitChange(previousIndex, direction === 'jump' ? (next > previousIndex ? 'down' : 'up') : direction);
  }

  private slides(): K3ParallaxSlide[] {
    const root = this.slotEl ?? this;
    const assigned =
      this.slotEl?.assignedElements({ flatten: true }) ??
      [...this.children].filter((c) => c instanceof HTMLElement);
    return assigned.filter((el): el is K3ParallaxSlide => el instanceof K3ParallaxSlide);
  }

  private refreshSlides(resetIndex = false): void {
    this.applyCssVars();
    const slides = this.slides();
    const n = slides.length;
    slides.forEach((slide, i) => {
      slide.setStackIndex(n - i);
    });
    if (resetIndex) this.index = 0;
    this.index = Math.max(0, Math.min(n - 1, this.index));
    this.applySlideStates();
    this.setAttribute('aria-roledescription', i18n.t('parallax.role', 'parallax'));
  }

  private applySlideStates(): void {
    const slides = this.slides();
    slides.forEach((slide, i) => {
      let state: ParallaxSlideState;
      if (i < this.index) state = 'passed';
      else if (i === this.index) state = 'current';
      else state = 'upcoming';
      slide.setState(state);
    });
  }

  private applyCssVars(): void {
    this.style.setProperty('--k3-parallax-offset', this.parallaxOffset);
    this.style.setProperty('--k3-parallax-content-offset', this.contentOffset);
    const ms = Math.max(0, this.transitionMs);
    this.style.setProperty('--k3-parallax-transition', `${ms}ms`);
    this.style.setProperty('--k3-parallax-content-transition', `${ms + 500}ms`);
    this.style.setProperty('--k3-parallax-easing', ParallaxSpecs.easing);
    const o = Math.min(1, Math.max(0, this.overlay));
    this.style.setProperty('--k3-parallax-overlay', String(o));
  }

  private syncReducedMotionAttr(): void {
    const reduce = this.disableForReducedMotion && prefersReducedMotion();
    if (reduce) this.setAttribute('data-reduced-motion', '');
    else this.removeAttribute('data-reduced-motion');
  }

  private lock(): void {
    window.clearTimeout(this.unlockTimer);
    const ms = Math.max(0, this.lockMs);
    if (ms === 0) {
      this.locked = false;
      return;
    }
    this.locked = true;
    this.unlockTimer = window.setTimeout(() => {
      this.locked = false;
    }, ms);
  }

  private handleWheel(e: WheelEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    const now = performance.now();
    if (now - this.lastWheel < this.throttleMs) return;
    this.lastWheel = now;
    if (this.locked) return;

    const delta = e.deltaY;
    const sens = Math.max(1, this.sensitivity);
    if (delta >= sens) this.next();
    else if (delta <= -sens) this.previous();
  }

  private handleKey(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      this.previous();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.goTo(0, 'jump');
    } else if (e.key === 'End') {
      e.preventDefault();
      this.goTo(this.slideCount - 1, 'jump');
    }
  }

  private emitChange(
    previousIndex: number,
    direction: 'down' | 'up',
  ): void {
    this.dispatchEvent(
      new CustomEvent('k3-parallax-change', {
        bubbles: true,
        composed: true,
        detail: { index: this.index, previousIndex, direction },
      }),
    );
  }

  private onSlotChange = (): void => {
    this.refreshSlides(false);
  };

  override render() {
    return html`
      <div class="viewport" part="viewport">
        <slot @slotchange=${this.onSlotChange}></slot>
      </div>
    `;
  }

  protected override firstUpdated(): void {
    this.slotEl = this.renderRoot.querySelector('slot');
    this.refreshSlides(true);
  }
}

export default K3Parallax;

if (!customElements.get('k3-parallax')) {
  customElements.define('k3-parallax', K3Parallax);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-parallax': K3Parallax;
  }
}
