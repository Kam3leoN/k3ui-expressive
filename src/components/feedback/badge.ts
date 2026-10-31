import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { badgeStyles } from './badge.styles.js';

/**
 * Corner of the anchor — logical (`*-start` / `*-end`, RTL-aware)
 * or physical (`*-left` / `*-right`).
 */
export type BadgePosition =
  | 'top-end'
  | 'top-start'
  | 'bottom-end'
  | 'bottom-start'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

/** Cap numeric labels (M3 max 4 characters including `+`). */
export const BADGE_DEFAULT_MAX = 999;

/** Format count / label for a large badge — numbers above `max` → `{max}+`. */
export function formatBadgeLabel(value: string | number, max = BADGE_DEFAULT_MAX): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const n = Number(raw);
  if (raw !== '' && Number.isFinite(n) && !Number.isNaN(n)) {
    const v = Math.trunc(n);
    if (v > max) return `${max}+`;
    return String(v);
  }
  /* Non-numeric — hard cap 4 characters (M3) */
  return raw.length > 4 ? `${raw.slice(0, 3)}+` : raw;
}

/**
 * M3 Badge — notification dot or count on an anchor.
 *
 * ```
 * k3-badge value="3"          → large "3" at top-end
 * k3-badge dot                → 6dp dot
 * k3-badge value="1200" max   → "999+"
 * k3-badge position="bottom-start"
 * ```
 *
 * @see https://m3.material.io/components/badges/specs
 */
export class K3Badge extends K3Element {
  static override styles = [hostReset, badgeStyles];

  /** Count or short label (large badge). Ignored when `dot`. */
  @property() value = '';
  /** Above this number → `{max}+`. Default 999. */
  @property({ type: Number }) max = BADGE_DEFAULT_MAX;
  /** Small 6dp notification dot (no label). */
  @property({ type: Boolean, reflect: true }) dot = false;
  /**
   * Corner on the anchor.
   * Logical default `top-end` (M3 upper trailing). Physical `*-left`/`*-right` ignore RTL.
   */
  @property({ reflect: true }) position: BadgePosition = 'top-end';
  /** Show large badge when value is `0` (hidden by default). */
  @property({ type: Boolean, attribute: 'show-zero' }) showZero = false;

  private get label(): string {
    if (this.dot) return '';
    return formatBadgeLabel(this.value, this.max);
  }

  private get size(): 'dot' | 'large' {
    return this.dot ? 'dot' : 'large';
  }

  private get visible(): boolean {
    if (this.dot) return true;
    if (this.label === '') return false;
    if (!this.showZero && this.label === '0') return false;
    return true;
  }

  override render() {
    const label = this.label;
    const show = this.visible;
    return html`
      <slot></slot>
      <span
        class="badge"
        part="badge"
        data-size=${this.size}
        ?hidden=${!show}
        role=${this.dot ? nothing : 'status'}
        aria-hidden=${this.dot || !show ? 'true' : 'false'}
        aria-label=${!this.dot && show ? label : nothing}
        >${this.dot ? nothing : label}<slot name="badge"></slot
      ></span>
    `;
  }
}

export default K3Badge;

if (!customElements.get('k3-badge')) {
  customElements.define('k3-badge', K3Badge);
}
