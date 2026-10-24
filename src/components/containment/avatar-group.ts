import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { avatarGroupStyles } from './avatar.styles.js';
import type { AvatarSize } from './avatar.js';
import type { K3Avatar } from './avatar.js';

export type AvatarGroupLayout = 'stack' | 'grid';

/**
 * Stacked or grid group of `k3-avatar` — optional `max` + overflow count.
 *
 * ```
 * k3-avatar-group
 * ├── k3-avatar
 * ├── k3-avatar
 * └── k3-avatar-group-count  (+N or icon)
 * ```
 */
export class K3AvatarGroup extends K3Element {
  static override styles = [hostReset, avatarGroupStyles];

  @property({ reflect: true }) layout: AvatarGroupLayout = 'stack';
  /** Propagate size to child avatars when they omit size. */
  @property({ reflect: true }) size: AvatarSize = 'md';
  /**
   * Max visible avatars (excluding the count chip).
   * `0` = show all. Overflow → auto `+N` unless a slotted count exists.
   */
  @property({ type: Number }) max = 0;

  @state() private overflow = 0;

  private onSlotChange = (): void => {
    this.applyLimit();
  };

  override firstUpdated(): void {
    this.applyLimit();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('max') || changed.has('size') || changed.has('layout')) {
      this.applyLimit();
    }
  }

  private avatars(): K3Avatar[] {
    return [...this.querySelectorAll<K3Avatar>(':scope > k3-avatar')];
  }

  private applyLimit(): void {
    const items = this.avatars();
    for (const a of items) {
      if (!a.hasAttribute('size')) a.size = this.size;
    }
    const countEl = this.querySelector(':scope > k3-avatar-group-count') as
      | (HTMLElement & { size?: AvatarSize })
      | null;
    if (countEl && !countEl.hasAttribute('size')) countEl.size = this.size;

    if (!this.max || this.max <= 0 || items.length <= this.max) {
      for (const a of items) a.hidden = false;
      this.overflow = 0;
    } else {
      items.forEach((a, i) => {
        a.hidden = i >= this.max;
      });
      this.overflow = items.length - this.max;
    }
    this.applyStackZ();
  }

  /** Ascending z-index so later avatars + count sit above the stack. */
  private applyStackZ(): void {
    const stacked = this.layout === 'stack';
    const visible = this.avatars().filter((a) => !a.hidden);
    visible.forEach((a, i) => {
      a.style.zIndex = stacked ? String(i + 1) : '';
    });
    const countEl = this.querySelector(':scope > k3-avatar-group-count') as
      | HTMLElement
      | null;
    if (countEl) {
      countEl.style.zIndex = stacked ? String(visible.length + 10) : '';
    }
  }

  override render() {
    const hasSlottedCount = Boolean(
      this.querySelector(':scope > k3-avatar-group-count'),
    );
    const showAuto = this.overflow > 0 && !hasSlottedCount;

    return html`<div class="row" part="container" role="group">
      <slot @slotchange=${this.onSlotChange}></slot>
      ${showAuto
        ? html`<span
            class="count"
            part="count"
            dir="ltr"
            aria-label=${`+${this.overflow}`}
            >+${this.overflow}</span
          >`
        : nothing}
    </div>`;
  }
}

export default K3AvatarGroup;
