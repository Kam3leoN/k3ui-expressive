import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, emitLifecycle, waitForMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';

export class K3Carousel extends K3Element {
  static override styles = [hostReset, css`
    :host { display: block; position: relative; overflow: hidden; --k3-carousel-dir: -1; }
    :host(:dir(rtl)) { --k3-carousel-dir: 1; }
    .track { display: flex; transition: transform var(--k3-sys-motion-duration-spatial-default) var(--k3-sys-motion-easing-expressive-spatial); }
    .nav { position: absolute; inset-block: 0; display: grid; place-items: center; }
    .prev { inset-inline-start: 0.25rem; } .next { inset-inline-end: 0.25rem; }
  `];
  @property({ type: Number }) index = 0;
  @state() private current = 0;

  private async go(delta: number): Promise<void> {
    if (!emitLifecycle(this, 'change-start', { source: 'user' })) return;
    this.current = Math.max(0, this.current + delta);
    this.index = this.current;
    await waitForMotion(this);
    emitLifecycle(this, 'change-end', { source: 'user', index: this.current });
    this.emit('k3-change', { index: this.current });
  }

  override render() {
    /* Logical slide: negative in LTR, positive in RTL (dir flips via CSS var) */
    return html`
      <div
        class="track"
        part="track"
        style="transform: translateX(calc(var(--k3-carousel-dir, -1) * ${this.current} * 100%))"
      >
        <slot></slot>
      </div>
      <k3-icon-button class="nav prev" label=${i18n.t('carousel.prev')} @k3-click=${() => this.go(-1)}
        >‹</k3-icon-button
      >
      <k3-icon-button class="nav next" label=${i18n.t('carousel.next')} @k3-click=${() => this.go(1)}
        >›</k3-icon-button
      >
    `;
  }
}
export default K3Carousel;
