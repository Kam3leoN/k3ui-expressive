import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, hasNamedSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  BubbleSpecs,
  isBubbleColor,
  isBubblePlacement,
  type BubbleColor,
  type BubblePlacement,
} from './bubble.specs.js';
import { bubbleStyles } from './bubble.styles.js';

export type { BubbleColor, BubblePlacement } from './bubble.specs.js';
export { BubbleSpecs } from './bubble.specs.js';

/**
 * Chat bubble row — slots `image`, `header`, default (body), `footer`.
 *
 * ```html
 * <k3-bubble placement="start" color="primary">
 *   <k3-avatar slot="image" …></k3-avatar>
 *   <span slot="header">Name <time datetime="12:45">12:45</time></span>
 *   Hello world
 *   <span slot="footer" muted>Sent</span>
 * </k3-bubble>
 * ```
 */
export class K3Bubble extends K3Element {
  static override styles = [hostReset, bubbleStyles];

  @property({ reflect: true })
  placement: BubblePlacement = BubbleSpecs.defaultPlacement;

  @property({ reflect: true })
  color: BubbleColor = BubbleSpecs.defaultColor;

  @state() private hasImage = false;
  @state() private hasHeader = false;
  @state() private hasFooter = false;

  /** @param placement - start | end */
  setPlacement(placement: BubblePlacement): void {
    if (isBubblePlacement(placement)) this.placement = placement;
  }

  /** @param color - body color variant */
  setColor(color: BubbleColor): void {
    if (isBubbleColor(color)) this.color = color;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', BubbleSpecs.accessibility.role);
    this.addEventListener('slotchange', this.syncSlots, true);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
  }

  private syncSlots = (): void => {
    this.hasImage = hasNamedSlot(this, 'image');
    this.hasHeader = hasNamedSlot(this, 'header');
    this.hasFooter = hasNamedSlot(this, 'footer');
  };

  override render() {
    const bodyColorClass =
      this.color === 'default' ? '' : `bubble__body--${this.color}`;

    return html`
      <div
        class=${classMap({
          bubble: true,
          [`bubble--${this.placement}`]: true,
        })}
        part="root"
      >
        <div class="bubble__image" part="image" ?hidden=${!this.hasImage}>
          <slot name="image" @slotchange=${this.syncSlots}></slot>
        </div>
        <div class="bubble__header" part="header" ?hidden=${!this.hasHeader}>
          <slot name="header" @slotchange=${this.syncSlots}></slot>
        </div>
        <div
          class=${classMap({ bubble__body: true, [bodyColorClass]: !!bodyColorClass })}
          part="body"
        >
          <slot></slot>
        </div>
        <div class="bubble__footer" part="footer" ?hidden=${!this.hasFooter}>
          <slot name="footer" @slotchange=${this.syncSlots}></slot>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('k3-bubble')) {
  customElements.define('k3-bubble', K3Bubble);
}

export default K3Bubble;
