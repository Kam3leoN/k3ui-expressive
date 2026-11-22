import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { carouselItemStyles } from './carousel.styles.js';

/**
 * `k3-carousel-item` — one masked slide of a `k3-carousel`.
 *
 * Slots:
 * - default — media (img / video / any content, laid out at the large width)
 * - `label` — text label, shown on large items only (M3), fades while masked
 *
 * Events: `k3-click` `{ index }` (pointer or Enter / Space).
 *
 * @csspart mask    - clipping surface (shape, state layer, focus ring)
 * @csspart content - unmasked content (keeps large width → parallax)
 * @csspart label   - label scrim
 */
export class K3CarouselItem extends K3Element {
  static override styles = [carouselItemStyles];

  /** Accessible name; falls back to the label slot text. */
  @property() label = '';
  /** Optional link — item activates as a link. */
  @property() href = '';

  @state() private hasLabel = false;

  /** Set by k3-carousel. */
  index = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.setAttribute('aria-roledescription', 'slide');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    super.disconnectedCallback();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.target !== this) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.activate();
    }
  };

  private activate(): void {
    const ok = this.emit('k3-click', { index: this.index }, true);
    if (ok && this.href) window.location.assign(this.href);
  }

  private onLabelSlot(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.hasLabel = slot
      .assignedNodes({ flatten: true })
      .some((n) => n.nodeType === Node.ELEMENT_NODE || !!n.textContent?.trim());
  }

  override render() {
    return html`
      <div class="mask" part="mask" @click=${this.activate}>
        <div class="content" part="content"><slot></slot></div>
        <div class="label ${this.hasLabel ? 'has-label' : ''}" part="label">
          <slot name="label" @slotchange=${this.onLabelSlot}></slot>
        </div>
      </div>
    `;
  }
}

export default K3CarouselItem;

if (!customElements.get('k3-carousel-item')) {
  customElements.define('k3-carousel-item', K3CarouselItem);
}
