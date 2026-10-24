import { html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { skeletonStyles } from './skeleton.styles.js';
import { inferSkeletonShapeFromRadius } from './skeleton-shape.js';

/**
 * Skeleton animation — M3E parity.
 * @see https://matraic.github.io/m3e/#/components/skeleton.html
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Skeleton shape — M3E parity.
 * - `auto` → rounded (or first slotted child’s border-radius when present)
 * - `circular` · `rounded` · `square`
 */
export type SkeletonShape = 'circular' | 'rounded' | 'square' | 'auto';

/**
 * Material 3 skeleton — loading placeholder that preserves layout.
 *
 * Mirrors [`m3e-skeleton`](https://github.com/matraic/m3e/tree/main/packages/web/src/skeleton):
 * `animation` · `shape` · `loaded` + default slot for content to mimic.
 *
 * Standalone bone (no slot):
 * ```html
 * <k3-skeleton animation="wave" style="width:12rem;height:1rem"></k3-skeleton>
 * <k3-skeleton shape="circular" style="width:2.5rem;height:2.5rem"></k3-skeleton>
 * ```
 *
 * Content mimic:
 * ```html
 * <k3-skeleton animation="pulse">
 *   <k3-card>…</k3-card>
 * </k3-skeleton>
 * ```
 */
export class K3Skeleton extends K3Element {
  static override styles = [hostReset, skeletonStyles];

  /** pulse · wave (default) · none — M3E */
  @property({ reflect: true }) animation: SkeletonAnimation = 'wave';
  /** circular · rounded · square · auto (default) */
  @property({ reflect: true }) shape: SkeletonShape = 'auto';
  /** Content ready — bone fades out, slot becomes interactive */
  @property({ type: Boolean, reflect: true }) loaded = false;
  /** Stretch to full width of parent */
  @property({ type: Boolean, reflect: true }) block = false;

  @state() private hasContent = false;

  private onSlotChange = (): void => {
    /* Defer past this update — avoid Lit change-in-update */
    queueMicrotask(() => {
      const slot = this.renderRoot?.querySelector('slot');
      const assigned = slot?.assignedElements({ flatten: true }) ?? [];
      this.hasContent = assigned.length > 0;
      this.toggleAttribute('has-content', this.hasContent);
      if (this.shape === 'auto' && assigned[0] instanceof HTMLElement) {
        this.syncAutoShape(assigned[0]);
      } else {
        this.classList.remove('circular', 'square');
      }
    });
  };

  /** Best-effort: pick circular vs square from first child’s radius. */
  private syncAutoShape(el: HTMLElement): void {
    this.classList.remove('circular', 'square');
    const kind = inferSkeletonShapeFromRadius(getComputedStyle(el).borderRadius);
    if (kind) this.classList.add(kind);
  }

  private effectiveAnimation(): SkeletonAnimation {
    const a = this.animation;
    if (a === 'pulse' || a === 'wave' || a === 'none') return a;
    return 'wave';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
  }

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.setAttribute('aria-busy', this.loaded ? 'false' : 'true');
    this.setAttribute(
      'aria-label',
      this.loaded ? i18n.t('skeleton.loaded') : i18n.t('skeleton.loading'),
    );
  }

  override firstUpdated(): void {
    this.onSlotChange();
  }

  override render() {
    const anim = this.effectiveAnimation();
    const motionOff = prefersReducedMotion() || anim === 'none' || this.loaded;
    return html`
      <div
        class=${classMap({
          bone: true,
          pulse: !motionOff && anim === 'pulse',
          wave: !motionOff && anim === 'wave',
        })}
        part="bone"
        aria-hidden="true"
      ></div>
      <div class="content" part="content">
        <slot
          ?inert=${!this.loaded}
          @slotchange=${this.onSlotChange}
        ></slot>
      </div>
    `;
  }
}

export default K3Skeleton;
