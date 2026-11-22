import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from 'k3ui';
import { hostReset } from '../../_shared.js';
import { parallaxSlideStyles } from './parallax.styles.js';

export type ParallaxSlideState = 'current' | 'upcoming' | 'passed' | 'up';

/**
 * One full-bleed slide for {@link K3Parallax}.
 *
 * ```html
 * <k3-parallax-slide background="https://…/hero.jpg" title="Hello" subtitle="Scroll">
 * </k3-parallax-slide>
 * ```
 *
 * Or project custom markup via default / named slots (`title`, `subtitle`).
 */
export class K3ParallaxSlide extends K3Element {
  static override styles = [hostReset, parallaxSlideStyles];

  /** CSS background image URL or any `background-image` value. */
  @property() background = '';
  /** Plain-text heading when not using the `title` slot (avoids HTML `title` tooltip). */
  @property() heading = '';
  /** Plain-text subtitle when not using the `subtitle` slot. */
  @property() subtitle = '';
  /** Motion state driven by the parent `k3-parallax`. */
  @property({ attribute: 'data-state', reflect: true })
  state: ParallaxSlideState = 'upcoming';

  /** Stacking order (higher = further back in the CodePen recipe). */
  setStackIndex(z: number): void {
    this.style.setProperty('--k3-parallax-z', String(z));
  }

  setState(state: ParallaxSlideState): void {
    this.state = state;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('background')) this.applyBackground();
  }

  private applyBackground(): void {
    const bg = this.background.trim();
    if (!bg) {
      this.style.removeProperty('background-image');
      return;
    }
    if (bg.startsWith('url(') || bg.includes('gradient(')) {
      this.style.backgroundImage = bg;
      return;
    }
    this.style.backgroundImage = `url(${JSON.stringify(bg)})`;
  }

  override render() {
    return html`
      <div class="content" part="content">
        <slot name="title">
          ${this.heading ? html`<p class="title" part="title">${this.heading}</p>` : null}
        </slot>
        <slot name="subtitle">
          ${this.subtitle
            ? html`<p class="subtitle" part="subtitle">${this.subtitle}</p>`
            : null}
        </slot>
        <slot></slot>
      </div>
    `;
  }
}

export default K3ParallaxSlide;

if (!customElements.get('k3-parallax-slide')) {
  customElements.define('k3-parallax-slide', K3ParallaxSlide);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-parallax-slide': K3ParallaxSlide;
  }
}
