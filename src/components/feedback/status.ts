import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { statusStyles } from './status.styles.js';

/** Semantic tone of the chip. */
export type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/** Icon circle placement (logical — mirrors with `dir` / `rtl`). */
export type StatusIconPosition = 'leading' | 'trailing';

const VARIANTS = new Set<StatusVariant>([
  'success',
  'error',
  'warning',
  'info',
  'neutral',
]);

const VARIANT_LABELS_EN: Record<StatusVariant, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  neutral: 'Neutral',
};

/** Default Material Symbol ligature per variant (subset-safe names). */
export const STATUS_VARIANT_ICONS: Record<StatusVariant, string> = {
  success: 'check',
  error: 'close',
  warning: 'warning',
  info: 'info',
  neutral: 'remove',
};

/** Resolve `status` attr / property → tone. `true` → success, `false` → error. */
export function resolveStatusVariant(
  status: boolean | StatusVariant | string | null | undefined,
): StatusVariant {
  if (status === true || status === 'true') return 'success';
  if (status === false || status === 'false') return 'error';
  if (typeof status === 'string' && VARIANTS.has(status as StatusVariant)) {
    return status as StatusVariant;
  }
  return 'neutral';
}

function parseStatusAttr(value: string | null): boolean | StatusVariant {
  if (value === null || value === '') return 'neutral';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (VARIANTS.has(value as StatusVariant)) return value as StatusVariant;
  return 'neutral';
}

/**
 * Status chip — tonal pill with optional overhanging icon circle.
 *
 * ```html
 * <k3-status status="false" value="32.3%"></k3-status>
 * <k3-status status="true" value="67.7%"></k3-status>
 * <k3-status status="warning" value="12 pending" position="trailing"></k3-status>
 * <k3-status status="neutral" value="Draft" show-icon="false"></k3-status>
 * <k3-status status="success" value="Off" disabled></k3-status>
 * ```
 *
 * Default glyphs: check · close · warning · info · remove (Material Symbols).
 * Override with `icon="…"` or `<span slot="icon" data-k3-icon="…"></span>`.
 */
export class K3Status extends K3Element {
  static override styles = [hostReset, statusStyles];

  /**
   * Tone: `true` (= success), `false` (= error), or
   * `success` | `error` | `warning` | `info` | `neutral`.
   */
  @property({
    converter: {
      fromAttribute: parseStatusAttr,
      toAttribute: (v: boolean | StatusVariant) => String(v),
    },
  })
  status: boolean | StatusVariant = 'neutral';

  /** Label shown in the pill (also the default slot fallback). */
  @property() value: string | number = '';

  /**
   * Show the overhanging icon circle (default true).
   * Set `show-icon="false"` to hide.
   */
  @property({
    attribute: 'show-icon',
    reflect: true,
    converter: {
      fromAttribute: (v: string | null) => v !== 'false',
      toAttribute: (v: boolean) => (v ? 'true' : 'false'),
    },
  })
  showIcon = true;

  /** Icon on leading (default) or trailing edge. */
  @property({ reflect: true }) position: StatusIconPosition = 'leading';

  /** Force RTL (`dir="rtl"`) — leading/trailing flip with logical insets. */
  @property({ type: Boolean, reflect: true }) rtl = false;

  /** Optional Material Symbol name — overrides the variant default. */
  @property() icon = '';

  /** Non-interactive muted state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Main tone (circle). Text / bg derive from it unless overridden. */
  @property() color = '';
  /** Label color override. */
  @property({ attribute: 'text-color' }) textColor = '';
  /** Pill background override. */
  @property({ attribute: 'bg-color' }) bgColor = '';
  /** Glyph color inside the circle (default white). */
  @property({ attribute: 'icon-color' }) iconColor = '';

  /** Accessible name; default « {state}: {value} ». */
  @property({ attribute: 'accessible-label' }) accessibleLabel = '';

  private get variant(): StatusVariant {
    return resolveStatusVariant(this.status);
  }

  private get iconMode(): 'leading' | 'trailing' | 'none' {
    if (!this.showIcon) return 'none';
    return this.position === 'trailing' ? 'trailing' : 'leading';
  }

  private get resolvedIcon(): string {
    const custom = this.icon.trim();
    if (custom) return custom;
    return STATUS_VARIANT_ICONS[this.variant];
  }

  private computedAriaLabel(): string {
    if (this.accessibleLabel.trim()) return this.accessibleLabel.trim();
    const s = this.status;
    const state =
      typeof s === 'boolean' ? (s ? 'True' : 'False') : VARIANT_LABELS_EN[this.variant];
    const v = String(this.value ?? '').trim();
    const base = v ? `${state}: ${v}` : state;
    return this.disabled ? `${base} (disabled)` : base;
  }

  private syncHostAttrs(): void {
    this.setAttribute('data-variant', this.variant);
    this.setAttribute('data-icon', this.iconMode);
    this.setAttribute('role', 'status');
    this.setAttribute('aria-label', this.computedAriaLabel());
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');

    if (this.rtl) {
      this.setAttribute('dir', 'rtl');
    } else if (this.hasAttribute('dir') && this.getAttribute('dir') === 'rtl') {
      this.removeAttribute('dir');
    }

    const setOrClear = (name: string, val: string) => {
      if (val) this.style.setProperty(name, val);
      else this.style.removeProperty(name);
    };
    setOrClear('--k3-status-color', this.color);
    setOrClear('--k3-status-text-color', this.textColor);
    setOrClear('--k3-status-bg-color', this.bgColor);
    setOrClear('--k3-status-icon-color', this.iconColor);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncHostAttrs();
  }

  override willUpdate(): void {
    this.syncHostAttrs();
  }

  override render() {
    const glyph = this.resolvedIcon;
    return html`
      <span class="chip" part="chip">
        ${this.showIcon
          ? html`
              <span class="icon" part="icon" aria-hidden="true">
                <slot name="icon">
                  <span
                    class="glyph notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon=${glyph}
                  ></span>
                </slot>
              </span>
            `
          : nothing}
        <span class="label" part="label"><slot>${this.value}</slot></span>
      </span>
    `;
  }
}

export default K3Status;

if (!customElements.get('k3-status')) {
  customElements.define('k3-status', K3Status);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-status': K3Status;
  }
}
