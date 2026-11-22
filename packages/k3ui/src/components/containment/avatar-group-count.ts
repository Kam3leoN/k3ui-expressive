import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import type { AvatarSize } from './avatar.js';
import type { K3AvatarGroup } from './avatar-group.js';

/**
 * Overflow chip in an avatar group — text (`+3`) or Material Symbol `icon`.
 */
export class K3AvatarGroupCount extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        /* Inherit group size when nested; fallback md */
        --k3-avatar-size: 2.5rem;
        position: relative;
        z-index: 100;
        display: inline-grid;
        place-items: center;
        box-sizing: border-box;
        width: var(--k3-avatar-size);
        height: var(--k3-avatar-size);
        border-radius: var(--k3-sys-shape-corner-full);
        background: var(--k3-sys-color-surface-container-highest);
        color: var(--k3-sys-color-on-surface);
        font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
        font-weight: 600;
        line-height: 1;
        flex-shrink: 0;
        direction: ltr;
        unicode-bidi: isolate;
      }
      :host([size='sm']) {
        --k3-avatar-size: 2rem;
        font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
      }
      :host([size='md']) {
        --k3-avatar-size: 2.5rem;
      }
      :host([size='lg']) {
        --k3-avatar-size: 3.5rem;
        font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
      }
      .icon {
        font-family: 'Material Symbols Rounded', sans-serif;
        font-size: calc(var(--k3-avatar-size) * 0.45);
        font-variation-settings:
          'FILL' 0,
          'wght' 500,
          'GRAD' 0,
          'opsz' 24;
      }
    `,
  ];

  @property({ reflect: true }) size: AvatarSize = 'md';
  /** Material Symbol ligature — preferred over a slotted icon. */
  @property() icon = '';

  override connectedCallback(): void {
    super.connectedCallback();
    const group = this.closest('k3-avatar-group') as K3AvatarGroup | null;
    if (group && !this.hasAttribute('size')) this.size = group.size;
  }

  override render() {
    const text = this.textContent?.trim() ?? '';
    const label = this.icon ? this.icon : text || 'More';
    return html`<span part="label" role="img" aria-label=${label} dir="ltr">
      ${this.icon
        ? html`<span
            class="icon notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon=${this.icon}
            aria-hidden="true"
          ></span>`
        : this.hasSlot('icon')
          ? html`<span class="icon"><slot name="icon"></slot></span>`
          : html`<slot></slot>`}
    </span>`;
  }
}

export default K3AvatarGroupCount;

if (!customElements.get('k3-avatar-group-count')) {
  customElements.define('k3-avatar-group-count', K3AvatarGroupCount);
}
