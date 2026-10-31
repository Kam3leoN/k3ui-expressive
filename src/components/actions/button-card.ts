import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, hasNamedSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { buttonCardStyles } from './button-card.styles.js';

export { ButtonCardSpecs } from './button-card.specs.js';

/**
 * Compact action / link card — tonal icon well + uppercase label + subtitle.
 *
 * ```html
 * <k3-button-card label="Platform" subtitle="@handle" href="#">
 *   <span slot="icon" class="ms" data-k3-icon="share"></span>
 * </k3-button-card>
 * ```
 *
 * Brand tint: `--k3-button-card-icon-bg` · `--k3-button-card-icon-fg`
 *
 * @fires k3-activate — `{ label, subtitle, href }`
 */
export class K3ButtonCard extends K3Element {
  static override styles = [hostReset, buttonCardStyles];

  /** Primary line (rendered uppercase). */
  @property()
  label = '';

  /** Secondary line (e.g. @handle). */
  @property()
  subtitle = '';

  /** When set, the card is an anchor. */
  @property()
  href = '';

  /** Material Symbols ligature when no `slot="icon"`. */
  @property()
  icon = '';

  /** Open link in a new tab when href is set. */
  @property({ type: Boolean, attribute: 'external' })
  external = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Stretch to parent width. */
  @property({ type: Boolean, reflect: true })
  stretch = false;

  @state() private hasIconSlot = false;

  /** @param label - Primary text */
  setLabel(label: string): void {
    this.label = label;
  }

  /** @param subtitle - Secondary text */
  setSubtitle(subtitle: string): void {
    this.subtitle = subtitle;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('slotchange', this.syncSlots, true);
    this.syncSlots();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  private syncSlots = (): void => {
    const next = hasNamedSlot(this, 'icon');
    if (next !== this.hasIconSlot) this.hasIconSlot = next;
  };

  private onActivate = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    this.emit('k3-activate', {
      label: this.label,
      subtitle: this.subtitle,
      href: this.href || null,
    });
    if (!this.href) e.preventDefault();
  };

  private body() {
    const showIconFallback = !this.hasIconSlot && !!this.icon.trim();
    const subtitle = this.subtitle.trim();
    const showIcon = this.hasIconSlot || showIconFallback;

    return html`
      <span class="icon" part="icon" ?hidden=${!showIcon}>
        <slot name="icon" @slotchange=${this.syncSlots}></slot>
        ${showIconFallback
          ? html`<span
              class="icon__glyph notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon=${this.icon}
              aria-hidden="true"
            ></span>`
          : nothing}
      </span>
      <span class="text" part="text">
        <span class="label" part="label">${this.label || nothing}</span>
        <span class="subtitle" part="subtitle">${subtitle || nothing}</span>
      </span>
    `;
  }

  override render() {
    const ariaLabel = this.label
      ? `${this.label}${this.subtitle.trim() ? ` ${this.subtitle.trim()}` : ''}`
      : nothing;

    if (this.href && !this.disabled) {
      return html`<a
        class="card"
        part="card"
        href=${this.href}
        target=${this.external ? '_blank' : nothing}
        rel=${this.external ? 'noopener noreferrer' : nothing}
        aria-label=${ariaLabel}
        @click=${this.onActivate}
        >${this.body()}</a
      >`;
    }

    return html`<button
      type="button"
      class="card"
      part="card"
      ?disabled=${this.disabled}
      aria-label=${ariaLabel}
      aria-disabled=${this.disabled ? 'true' : nothing}
      @click=${this.onActivate}
    >
      ${this.body()}
    </button>`;
  }
}

if (!customElements.get('k3-button-card')) {
  customElements.define('k3-button-card', K3ButtonCard);
}

export default K3ButtonCard;
