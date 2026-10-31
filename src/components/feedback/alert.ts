import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import {
  AlertDefaultIcon,
  AlertSpecs,
  resolveAlertShape,
  resolveAlertVariant,
  type AlertShape,
  type AlertVariant,
} from './alert.specs.js';
import { alertStyles } from './alert.styles.js';

export type { AlertShape, AlertVariant } from './alert.specs.js';
export {
  AlertSpecs,
  AlertDefaultIcon,
  ALERT_VARIANTS,
  ALERT_SHAPES,
  resolveAlertShape,
  resolveAlertVariant,
} from './alert.specs.js';

/**
 * Alert — supporting container for contextual / supplemental information.
 *
 * Inspired by M3E {@link https://matraic.github.io/m3e/#/components/callout.html | Callout}:
 * leading accent bar, icon + label header, body content, rounded/square shapes,
 * and appearance variants. Extra semantic tones (success · warning · info · note)
 * and optional dismiss for alert use-cases.
 *
 * @fires k3-dismiss - when the dismiss control is activated
 *
 * @slot - Body text / content
 * @slot icon - Leading icon (overrides default / `icon` attr)
 * @slot label - Heading (overrides `label` attr)
 * @slot action - Optional trailing action (button, link, …)
 *
 * @see ./alert.specs.ts
 */
export class K3Alert extends K3Element {
  static override styles = [hostReset, alertStyles];

  /**
   * Appearance variant.
   * M3E callout roles + semantic alert tones.
   * @default secondary
   */
  @property({ reflect: true }) variant: AlertVariant = AlertSpecs.defaultVariant;

  /** Corner shape — `rounded` (default) or `square`. */
  @property({ reflect: true }) shape: AlertShape = AlertSpecs.defaultShape;

  /** Heading text when no `label` slot is provided. */
  @property() label = '';

  /**
   * Material Symbol ligature for the default icon.
   * Empty string hides the default icon (slot still works).
   * Omit to use the variant default.
   */
  @property() icon: string | undefined;

  /** Show a dismiss (close) control. */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /** Hide the leading icon entirely (slot + default). */
  @property({ type: Boolean, attribute: 'hide-icon' }) hideIcon = false;

  @state() private hasIconSlot = false;
  @state() private hasLabelSlot = false;
  @state() private hasActionSlot = false;

  override willUpdate(): void {
    this.variant = resolveAlertVariant(this.variant);
    this.shape = resolveAlertShape(this.shape);
  }

  /** Programmatic dismiss — hides the host and emits `k3-dismiss`. */
  dismiss(): void {
    this.hidden = true;
    this.emit('k3-dismiss');
  }

  private resolvedIconName(): string | null {
    if (this.hideIcon) return null;
    if (this.hasIconSlot) return null;
    if (this.icon === '') return null;
    if (this.icon) return this.icon;
    return AlertDefaultIcon[this.variant] ?? AlertSpecs.defaultIcons.secondary;
  }

  private showHeader(): boolean {
    return this.showIcon() || this.showLabel();
  }

  private showIcon(): boolean {
    if (this.hideIcon) return false;
    return this.hasIconSlot || this.resolvedIconName() !== null;
  }

  private showLabel(): boolean {
    return this.hasLabelSlot || this.label.trim().length > 0;
  }

  private onIconSlot = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    this.hasIconSlot = slot.assignedNodes({ flatten: true }).some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return (n.textContent ?? '').trim().length > 0;
    });
  };

  private onLabelSlot = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    this.hasLabelSlot = slot.assignedNodes({ flatten: true }).some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return (n.textContent ?? '').trim().length > 0;
    });
  };

  private onActionSlot = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    this.hasActionSlot = slot.assignedNodes({ flatten: true }).some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return (n.textContent ?? '').trim().length > 0;
    });
  };

  private onDismissClick = (e: Event): void => {
    e.stopPropagation();
    this.dismiss();
  };

  private dismissLabel(): string {
    return i18n.t('alert.dismiss') || 'Dismiss';
  }

  override render() {
    const role = AlertSpecs.accessibility.roleFor(this.variant);
    const iconName = this.resolvedIconName();
    const withHeader = this.showHeader();

    return html`
      <aside
        class=${classMap({
          base: true,
          'base--with-header': withHeader,
        })}
        role=${role}
        aria-live=${role === 'alert' ? 'assertive' : 'polite'}
      >
        <div class="header" ?hidden=${!withHeader}>
          <span
            class="icon notranslate"
            translate="no"
            lang="zxx"
            ?hidden=${!this.showIcon()}
            data-k3-icon=${iconName && !this.hasIconSlot ? iconName : nothing}
            aria-hidden="true"
          >
            <slot name="icon" @slotchange=${this.onIconSlot}></slot>
          </span>
          <div class="label" ?hidden=${!this.showLabel()}>
            <slot name="label" @slotchange=${this.onLabelSlot}
              >${this.hasLabelSlot ? nothing : this.label}</slot
            >
          </div>
        </div>
        <div class="body-row">
          <div class="content"><slot></slot></div>
          <div
            class="actions"
            ?data-has-action=${this.hasActionSlot}
          >
            <slot name="action" @slotchange=${this.onActionSlot}></slot>
            ${this.dismissible
              ? html`
                  <button
                    type="button"
                    class="dismiss notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon="close"
                    aria-label=${this.dismissLabel()}
                    @click=${this.onDismissClick}
                  ></button>
                `
              : nothing}
          </div>
        </div>
      </aside>
    `;
  }
}

export default K3Alert;

if (!customElements.get('k3-alert')) {
  customElements.define('k3-alert', K3Alert);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-alert': K3Alert;
  }
}
