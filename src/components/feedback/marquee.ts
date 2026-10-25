import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { property, query, state } from 'lit/decorators.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  MarqueeSpecs,
  durationFromSpeed,
  type MarqueeDirection,
  type MarqueeMode,
} from './marquee.specs.js';
import { marqueeStyles } from './marquee.styles.js';

export {
  MarqueeSpecs,
  durationFromSpeed,
  type MarqueeMode,
  type MarqueeDirection,
} from './marquee.specs.js';

/**
 * Horizontal scrolling marquee — infinite loop (duplicated track) or classic pass.
 */
export class K3Marquee extends K3Element {
  static override styles = [hostReset, marqueeStyles];

  @property({ reflect: true }) mode: MarqueeMode = MarqueeSpecs.mode;
  @property({ reflect: true }) direction: MarqueeDirection = MarqueeSpecs.direction;
  @property({ type: Number }) speed: number | null = null;
  @property({ type: Number }) duration = MarqueeSpecs.duration;
  @property({ type: Number }) gap = MarqueeSpecs.gap;
  @property({ type: Boolean, attribute: 'pause-on-hover', reflect: true })
  pauseOnHover = MarqueeSpecs.pauseOnHover;
  @property({ type: Boolean, reflect: true }) autoplay = MarqueeSpecs.autoplay;

  @query('slot') private contentSlot!: HTMLSlotElement;
  @query('.track') private trackEl!: HTMLElement;

  @state() private playing = false;
  @state() private cloneMarkup = '';
  @state() private resolvedDuration = MarqueeSpecs.duration;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.autoplay && !prefersReducedMotion()) {
      queueMicrotask(() => this.play());
    }
  }

  /** Start marquee animation. */
  play(): void {
    if (prefersReducedMotion()) return;
    this.playing = true;
    this.syncDuration();
  }

  /** Pause marquee animation. */
  stop(): void {
    this.playing = false;
  }

  private syncDuration(): void {
    if (this.speed != null && this.trackEl) {
      const width = this.trackEl.scrollWidth / (this.mode === 'infinite' ? 2 : 1);
      this.resolvedDuration = durationFromSpeed(width, this.speed);
    } else {
      this.resolvedDuration = Math.max(0.1, this.duration);
    }
    this.style.setProperty('--k3-marquee-duration', `${this.resolvedDuration}s`);
  }

  private onSlotChange(): void {
    const nodes = this.contentSlot?.assignedNodes({ flatten: true }) ?? [];
    const container = document.createElement('div');
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
        container.appendChild(node.cloneNode(true));
      }
    });
    this.cloneMarkup = container.innerHTML;
    queueMicrotask(() => {
      this.syncDuration();
      if (this.autoplay && !prefersReducedMotion()) this.playing = true;
    });
  }

  override render() {
    const reduced = prefersReducedMotion();
    const state = !this.playing || reduced ? 'paused' : 'playing';

    this.style.setProperty('--k3-marquee-gap', `${this.gap}px`);
    if (!this.speed) {
      this.style.setProperty('--k3-marquee-duration', `${Math.max(0.1, this.duration)}s`);
    }

    return html`
      <div
        class="viewport"
        data-state=${state}
        data-pause-hover=${this.pauseOnHover ? 'true' : 'false'}
      >
        <div
          class=${`track track--${this.mode}`}
          data-direction=${this.direction}
        >
          <div class="set" part="track">
            <slot @slotchange=${this.onSlotChange}></slot>
          </div>
          ${this.mode === 'infinite' && this.cloneMarkup
            ? html`<div class="set" aria-hidden="true">${unsafeHTML(this.cloneMarkup)}</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

export default K3Marquee;

if (!customElements.get('k3-marquee')) {
  customElements.define('k3-marquee', K3Marquee);
}
