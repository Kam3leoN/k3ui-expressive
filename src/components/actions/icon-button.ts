import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  focusRingStyles,
  emitLifecycle,
  hasNamedSlot,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import K3Ripple from './ripple.js';
import {
  IconButtonSpecs,
  type IconButtonShape,
  type IconButtonSize,
  type IconButtonVariant,
  type IconButtonWidth,
} from './icon-button.specs.js';
import { iconButtonStyles } from './icon-button.styles.js';

export type {
  IconButtonShape,
  IconButtonSize,
  IconButtonVariant,
  IconButtonWidth,
} from './icon-button.specs.js';
export {
  IconButtonSpecs,
  IconButtonSizeDp,
  IconButtonMinTargetDp,
  iconButtonWidthDp,
  iconButtonTargetDp,
} from './icon-button.specs.js';

if (!customElements.get('k3-ripple')) {
  customElements.define('k3-ripple', K3Ripple);
}

/**
 * Material 3 Expressive icon button.
 *
 * Four variants (filled default) · five sizes · round/square · narrow/default/wide
 * · toggle with optional `selected-icon` · ≥48dp target on XS/S.
 *
 * @see ./icon-button.specs.ts
 * @see https://m3.material.io/components/icon-buttons/specs
 * @see https://m3.material.io/components/icon-buttons/accessibility
 */
export class K3IconButton extends K3Element {
  static override styles = [hostReset, focusRingStyles, iconButtonStyles];

  @property({ reflect: true }) variant: IconButtonVariant =
    IconButtonSpecs.defaultVariant;
  @property({ reflect: true }) size: IconButtonSize = IconButtonSpecs.defaultSize;
  @property({ reflect: true }) shape: IconButtonShape =
    IconButtonSpecs.defaultShape;
  @property({ reflect: true }) width: IconButtonWidth =
    IconButtonSpecs.defaultWidth;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Toggle mode — click flips `selected` and emits `k3-change`. */
  @property({ type: Boolean, reflect: true }) toggle = false;
  @property({ type: Boolean, reflect: true }) selected = false;
  /** Single-select button group — `role=radio` + `aria-checked`. */
  @property({ type: Boolean, reflect: true, attribute: 'data-radio' }) radio =
    false;
  /** Accessible name — required (describes the action, not the glyph). */
  @property() label = '';
  @property() value = '';
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  @state() private pressed = false;
  @state() private hasSelectedIcon = false;

  /**
   * Group (`data-bg`) owns selection — do not self-toggle.
   * Standalone `toggle` flips `selected` on click.
   */
  private get ownsToggle(): boolean {
    return this.toggle && !this.hasAttribute('data-bg');
  }

  /** Toggle a11y — self toggle, group child, or radio. */
  private get isToggleControl(): boolean {
    return this.toggle || this.hasAttribute('data-bg') || this.radio;
  }

  private syncSelectedIcon = (): void => {
    this.hasSelectedIcon = hasNamedSlot(this, 'selected-icon');
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSelectedIcon();
  }

  override firstUpdated(): void {
    this.syncSelectedIcon();
    this.shadowRoot
      ?.querySelector('slot[name="selected-icon"]')
      ?.addEventListener('slotchange', this.syncSelectedIcon);
  }

  private onPointerDown = (): void => {
    if (this.disabled) return;
    this.pressed = true;
    this.setAttribute('data-pressed', '');
    emitLifecycle(this, 'press-start', { source: 'user' });
  };

  private onPointerUp = (): void => {
    if (!this.pressed) return;
    this.pressed = false;
    this.removeAttribute('data-pressed');
    emitLifecycle(this, 'press-end', { source: 'user' });
  };

  private onClick = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (this.ownsToggle) {
      this.selected = !this.selected;
      this.emit('k3-change', {
        selected: this.selected,
        value: this.value || undefined,
      });
    }
    this.emit('k3-click', { source: 'user', selected: this.selected });
  };

  /** Select without emitting `k3-change` (API / group). */
  select(): void {
    this.selected = true;
  }

  /** Deselect without emitting `k3-change`. */
  deselect(): void {
    this.selected = false;
  }

  /** Flip selection without emitting `k3-change`. */
  toggleSelected(): void {
    this.selected = !this.selected;
  }

  override render() {
    const name = this.label.trim();
    const a11yLabel = name || undefined;
    return html`
      <button
        part="container"
        class=${classMap({
          btn: true,
          [this.variant]: true,
          'k3-focus-ring': true,
        })}
        ?disabled=${this.disabled}
        type=${this.type}
        value=${ifDefined(this.value || undefined)}
        role=${this.radio ? 'radio' : nothing}
        aria-label=${ifDefined(a11yLabel)}
        aria-checked=${this.radio ? (this.selected ? 'true' : 'false') : nothing}
        aria-pressed=${
          this.isToggleControl && !this.radio
            ? this.selected
              ? 'true'
              : 'false'
            : nothing
        }
        @pointerdown=${this.onPointerDown}
        @pointerup=${this.onPointerUp}
        @pointerleave=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @click=${this.onClick}
      >
        <k3-ripple ?disabled=${this.disabled}></k3-ripple>
        <span
          part="icon"
          class=${classMap({
            icon: true,
            'default-icon': true,
            'has-selected': this.hasSelectedIcon,
          })}
          aria-hidden="true"
        >
          <slot @slotchange=${this.syncSelectedIcon}></slot>
        </span>
        <span
          part="selected-icon"
          class=${classMap({
            icon: true,
            'selected-icon': true,
            has: this.hasSelectedIcon,
          })}
          aria-hidden="true"
        >
          <slot
            name="selected-icon"
            @slotchange=${this.syncSelectedIcon}
          ></slot>
        </span>
      </button>
    `;
  }
}

export default K3IconButton;

if (!customElements.get('k3-icon-button')) {
  customElements.define('k3-icon-button', K3IconButton);
}
