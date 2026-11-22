import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { allowsExpressiveMotion, K3Element, prefersReducedMotion } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { canWebAnimate } from '../../motion/morph.js';
import { onColorFor } from '../../theme/semantic.js';
import { hostReset } from '../_shared.js';
import {
  clearBannerHostSpacer,
  requestBannerOffsetSync,
} from './banner-offset.js';
import {
  BannerDefaultIcon,
  BannerSpecs,
  resolveBannerPosition,
  resolveBannerVariant,
  type BannerPosition,
  type BannerVariant,
} from './banner.specs.js';
import { bannerStyles } from './banner.styles.js';

export type { BannerPosition, BannerVariant } from './banner.specs.js';
export {
  BannerSpecs,
  BannerDefaultIcon,
  BANNER_VARIANTS,
  BANNER_POSITIONS,
  resolveBannerPosition,
  resolveBannerVariant,
} from './banner.specs.js';
export { requestBannerOffsetSync, syncBannerOffset } from './banner-offset.js';

type BannerPhase = 'idle' | 'entering' | 'open' | 'leaving';

/**
 * Site / screen banner — promo, alert, or status strip above sticky app bars.
 *
 * When `position="fixed"` (default), the painted surface is viewport-fixed and
 * the host keeps an in-flow spacer so app bars and content drop below. Stacked
 * banners publish `--k3-banner-offset` on `<html>` for sticky app bars,
 * nav rails, and sheets (top inset / max-height).
 *
 * Enter: scaleY from the top edge (sheet) while the spacer grows and pushes
 * layout. Exit: scaleY collapse + spacer shrink (accelerate).
 *
 * @fires k3-dismiss — dismiss / leave completed
 * @fires k3-enter — enter animation finished
 *
 * @slot - Message body (text, `k3-marquee`, …)
 * @slot icon - Leading icon override
 * @slot action - Trailing action (button, link, …)
 *
 * @cssprop --k3-banner-offset — total stacked height on `:root` (app bars · rails · sheets)
 * @cssprop --k3-banner-z — stacking level (default 40)
 * @cssprop --k3-banner-container — strip fill (overridden by `color`)
 * @cssprop --k3-banner-on-container — strip ink (overridden by `color-on` / auto)
 */
export class K3Banner extends K3Element {
  static override styles = [hostReset, bannerStyles];

  /** Colour role / tone. @default primary */
  @property({ reflect: true }) variant: BannerVariant = BannerSpecs.defaultVariant;

  /**
   * `fixed` — viewport top + layout push · `static` — in-flow only (demos).
   * @default fixed
   */
  @property({ reflect: true }) position: BannerPosition = BannerSpecs.defaultPosition;

  /** Show a dismiss (close) control. */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /**
   * Forced container fill (hex / CSS color) — bypasses theme variants.
   * Pair with `color-on`, or leave empty for auto WCAG ink on `#rrggbb`.
   */
  @property({ reflect: true }) color: string | undefined;

  /** Forced ink / icon / dismiss color when `color` is set. */
  @property({ attribute: 'color-on', reflect: true }) colorOn: string | undefined;

  /** Material Symbol ligature — empty hides default; omit for variant default. */
  @property() icon: string | undefined;

  /** Hide the leading icon entirely (slot + default). */
  @property({ type: Boolean, attribute: 'hide-icon' }) hideIcon = false;

  @state() private hasIconSlot = false;
  @state() private hasActionSlot = false;
  @state() private phase: BannerPhase = 'idle';

  private resizeObserver: ResizeObserver | null = null;
  private animGen = 0;
  private hostAnim: Animation | null = null;
  private surfaceAnim: Animation | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.position = resolveBannerPosition(this.position);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.phase === 'entering' || this.phase === 'leaving') return;
        requestBannerOffsetSync();
      });
    }
  }

  override firstUpdated(): void {
    this.applyForcedColors();
    const surface = this.renderRoot?.querySelector('.surface');
    if (surface && this.resizeObserver) this.resizeObserver.observe(surface);
    if (this.position === 'fixed' && !this.hidden) {
      void this.playEnter();
    } else {
      this.phase = 'open';
      requestBannerOffsetSync();
    }
  }

  override disconnectedCallback(): void {
    this.cancelAnims();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    clearBannerHostSpacer(this);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('color') || changed.has('colorOn')) {
      this.applyForcedColors();
    }
    if (
      changed.has('position') ||
      changed.has('dismissible') ||
      changed.has('variant')
    ) {
      if (this.phase === 'open') requestBannerOffsetSync();
    }
  }

  override willUpdate(): void {
    this.variant = resolveBannerVariant(this.variant);
    this.position = resolveBannerPosition(this.position);
  }

  /** Apply / clear forced `color` + `color-on` onto container CSS vars. */
  private applyForcedColors(): void {
    const bg = (this.color ?? '').trim();
    const on = (this.colorOn ?? '').trim();
    if (!bg) {
      this.style.removeProperty('--k3-banner-container');
      this.style.removeProperty('--k3-banner-on-container');
      this.removeAttribute('data-forced-color');
      return;
    }
    this.style.setProperty('--k3-banner-container', bg);
    const ink = on || (isHexColor(bg) ? onColorFor(expandHex(bg)) : '#ffffff');
    this.style.setProperty('--k3-banner-on-container', ink);
    this.setAttribute('data-forced-color', '');
  }

  /**
   * Used by the offset coordinator.
   * Prefer offsetHeight so scaleY enter/leave transforms do not collapse the measure.
   */
  measureSurfaceHeight(): number {
    const surface = this.renderRoot?.querySelector('.surface') as HTMLElement | null;
    if (!surface) return 0;
    return surface.offsetHeight || Math.round(surface.getBoundingClientRect().height);
  }

  /** Used by the offset coordinator for stacked fixed banners. */
  applyStackTop(px: number): void {
    this.style.setProperty(BannerSpecs.cssVarStackTop, `${Math.max(0, px)}px`);
  }

  /**
   * Open like a top sheet: scaleY from the top edge (no gap) + grow the
   * in-flow spacer so app bar / content are pushed down.
   * Surface = expressive spatial-fast (edge-pinned) · spacer = decelerate (no overshoot).
   */
  async playEnter(): Promise<void> {
    if (this.hidden) this.hidden = false;
    if (this.position !== 'fixed' || prefersReducedMotion() || !canWebAnimate(this)) {
      this.phase = 'open';
      this.dataset.phase = 'open';
      requestBannerOffsetSync();
      this.emit('k3-enter');
      return;
    }

    const gen = ++this.animGen;
    const surface = this.renderRoot?.querySelector<HTMLElement>('.surface');
    if (!surface) return;

    this.phase = 'entering';
    this.dataset.phase = 'entering';
    this.style.height = 'auto';
    surface.style.transformOrigin = 'top center';
    surface.style.transform = 'scaleY(0)';
    await this.updateComplete;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (gen !== this.animGen) return;

    const target = Math.max(0, Math.round(this.measureSurfaceHeight()));
    this.style.height = '0px';
    requestBannerOffsetSync();
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (gen !== this.animGen) return;

    const surfaceMotion = this.motionEnter();
    const pushMotion = this.motionPush();
    this.cancelAnims();
    /* Spacer: no overshoot — avoids white elastic gap under the strip */
    this.hostAnim = this.animate([{ height: '0px' }, { height: `${target}px` }], {
      duration: pushMotion.duration,
      easing: pushMotion.easing,
      fill: 'forwards',
    });
    /* Surface: sheet-style scaleY, top edge stays pinned */
    this.surfaceAnim = surface.animate(
      [
        { transform: 'scaleY(0)', opacity: 0 },
        { transform: 'scaleY(1)', opacity: 1 },
      ],
      {
        duration: surfaceMotion.duration,
        easing: surfaceMotion.easing,
        fill: 'forwards',
      },
    );

    const tick = (): void => {
      if (gen !== this.animGen) return;
      requestBannerOffsetSync();
      if (this.phase === 'entering') requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try {
      await Promise.all([
        this.hostAnim.finished.catch(() => undefined),
        this.surfaceAnim.finished.catch(() => undefined),
      ]);
    } catch {
      /* cancelled */
    }
    if (gen !== this.animGen) return;

    this.style.height = `${target}px`;
    surface.style.transform = '';
    surface.style.opacity = '';
    this.cancelAnims();
    this.phase = 'open';
    this.dataset.phase = 'open';
    requestBannerOffsetSync();
    this.emit('k3-enter');
  }

  /**
   * Collapse like a top sheet + shrink spacer, then hide (and optionally remove).
   */
  async leave(opts?: { remove?: boolean }): Promise<void> {
    if (this.phase === 'leaving') return;
    const gen = ++this.animGen;

    if (
      this.position !== 'fixed' ||
      prefersReducedMotion() ||
      !canWebAnimate(this) ||
      this.hidden
    ) {
      this.hidden = true;
      clearBannerHostSpacer(this);
      this.phase = 'idle';
      this.dataset.phase = 'idle';
      this.emit('k3-dismiss');
      requestBannerOffsetSync();
      if (opts?.remove) this.remove();
      return;
    }

    const surface = this.renderRoot?.querySelector<HTMLElement>('.surface');
    const from = Math.max(
      0,
      Math.round(this.getBoundingClientRect().height || this.measureSurfaceHeight()),
    );
    this.phase = 'leaving';
    this.dataset.phase = 'leaving';

    const { duration, easing } = this.motionExit();
    this.cancelAnims();
    this.hostAnim = this.animate([{ height: `${from}px` }, { height: '0px' }], {
      duration,
      easing,
      fill: 'forwards',
    });
    if (surface) {
      surface.style.transformOrigin = 'top center';
      this.surfaceAnim = surface.animate(
        [
          { transform: 'scaleY(1)', opacity: 1 },
          { transform: 'scaleY(0)', opacity: 0 },
        ],
        { duration, easing, fill: 'forwards' },
      );
    }

    const tick = (): void => {
      if (gen !== this.animGen) return;
      requestBannerOffsetSync();
      if (this.phase === 'leaving') requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try {
      await Promise.all([
        this.hostAnim.finished.catch(() => undefined),
        this.surfaceAnim?.finished.catch(() => undefined) ?? Promise.resolve(),
      ]);
    } catch {
      /* cancelled */
    }
    if (gen !== this.animGen) return;

    this.cancelAnims();
    this.hidden = true;
    clearBannerHostSpacer(this);
    this.phase = 'idle';
    this.dataset.phase = 'idle';
    if (surface) {
      surface.style.transform = '';
      surface.style.opacity = '';
    }
    this.emit('k3-dismiss');
    requestBannerOffsetSync();
    if (opts?.remove) this.remove();
  }

  /** Programmatic dismiss — animated leave when fixed. */
  dismiss(): void {
    void this.leave();
  }

  /** Show again after dismiss (replays enter when fixed). */
  show(): void {
    this.hidden = false;
    void this.playEnter();
  }

  /** Surface enter — sheet FastSpatial (edge-pinned scale can overshoot safely). */
  private motionEnter(): { duration: number; easing: string } {
    const cs = getComputedStyle(document.documentElement);
    const duration = parseMs(
      cs.getPropertyValue('--k3-sys-motion-duration-spatial-fast'),
      350,
    );
    if (allowsExpressiveMotion()) {
      const easing =
        cs.getPropertyValue('--k3-sys-motion-easing-expressive-spatial-fast').trim() ||
        cs.getPropertyValue('--k3-sys-motion-easing-spatial-fast').trim() ||
        'cubic-bezier(0.42, 1.67, 0.21, 0.9)';
      return { duration, easing };
    }
    const easing =
      cs.getPropertyValue('--k3-sys-motion-easing-standard').trim() ||
      cs.getPropertyValue('--k3-sys-motion-easing-spatial-fast').trim() ||
      'cubic-bezier(0.2, 0, 0, 1)';
    return { duration, easing };
  }

  /** Spacer / layout push — decelerate only (never overshoot height). */
  private motionPush(): { duration: number; easing: string } {
    const cs = getComputedStyle(document.documentElement);
    const duration = parseMs(
      cs.getPropertyValue('--k3-sys-motion-duration-spatial-fast'),
      350,
    );
    const easing =
      cs.getPropertyValue('--k3-sys-motion-easing-emphasized-decelerate').trim() ||
      cs.getPropertyValue('--k3-sys-motion-easing-standard-decelerate').trim() ||
      cs.getPropertyValue('--k3-sys-motion-easing-standard').trim() ||
      'cubic-bezier(0.05, 0.7, 0.1, 1)';
    return { duration, easing };
  }

  private motionExit(): { duration: number; easing: string } {
    const cs = getComputedStyle(document.documentElement);
    const duration = parseMs(
      cs.getPropertyValue('--k3-sys-motion-duration-short4'),
      200,
    );
    const easing =
      cs.getPropertyValue('--k3-sys-motion-easing-emphasized-accelerate').trim() ||
      cs.getPropertyValue('--k3-sys-motion-easing-standard-accelerate').trim() ||
      'cubic-bezier(0.3, 0, 0.8, 0.15)';
    return { duration, easing };
  }

  private cancelAnims(): void {
    this.hostAnim?.cancel();
    this.surfaceAnim?.cancel();
    this.hostAnim = null;
    this.surfaceAnim = null;
  }

  private resolvedIconName(): string | null {
    if (this.hideIcon) return null;
    if (this.hasIconSlot) return null;
    if (this.icon === '') return null;
    if (this.icon) return this.icon;
    return BannerDefaultIcon[this.variant] ?? BannerSpecs.defaultIcons.primary;
  }

  private showIcon(): boolean {
    if (this.hideIcon) return false;
    return this.hasIconSlot || this.resolvedIconName() !== null;
  }

  private onIconSlot = (e: Event): void => {
    const slot = e.target as HTMLSlotElement;
    this.hasIconSlot = slot.assignedNodes({ flatten: true }).some((n) => {
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
    return i18n.t('banner.dismiss', 'Dismiss banner');
  }

  override render() {
    const role = BannerSpecs.accessibility.roleFor(this.variant);
    const iconName = this.resolvedIconName();

    return html`
      <div
        class="surface"
        part="surface"
        role=${role}
        aria-live=${role === 'alert' ? 'assertive' : 'polite'}
      >
        <span
          class="icon notranslate"
          part="icon"
          translate="no"
          lang="zxx"
          ?hidden=${!this.showIcon()}
          data-k3-icon=${iconName && !this.hasIconSlot ? iconName : nothing}
          aria-hidden="true"
        >
          <slot name="icon" @slotchange=${this.onIconSlot}></slot>
        </span>
        <div class="body" part="body"><slot></slot></div>
        <div
          class="actions"
          part="actions"
          ?data-has-action=${this.hasActionSlot}
          ?data-dismiss=${this.dismissible}
        >
          <slot name="action" @slotchange=${this.onActionSlot}></slot>
          ${this.dismissible
            ? html`
                <button
                  type="button"
                  class="dismiss notranslate"
                  part="dismiss"
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
    `;
  }
}

function parseMs(raw: string, fallback: number): number {
  const v = raw.trim();
  if (!v) return fallback;
  if (v.endsWith('ms')) return Number.parseFloat(v) || fallback;
  if (v.endsWith('s')) return (Number.parseFloat(v) || 0) * 1000 || fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/** `#rgb` / `#rrggbb` — enough for {@link onColorFor} auto ink. */
function isHexColor(raw: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim());
}

function expandHex(raw: string): string {
  const v = raw.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(v);
  if (short?.[1]) {
    const [r, g, b] = short[1];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return v.startsWith('#') ? v : `#${v}`;
}

export default K3Banner;

if (!customElements.get('k3-banner')) {
  customElements.define('k3-banner', K3Banner);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-banner': K3Banner;
  }
}
