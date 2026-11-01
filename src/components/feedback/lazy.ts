import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  K3Element,
  emitLifecycle,
  focusRingStyles,
  stateLayerStyles,
} from '../../core/index.js';
import { pendingCustomElements, whenTriggered, type LazyTrigger } from '../../core/lazy.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { isKnown, registerAll } from '../../registry/register.js';
import './skeleton.js';
import type { SkeletonAnimation } from './skeleton.js';
import { LazySpecs, type LazyFallback, type LazyState } from './lazy.specs.js';
import { lazyStyles } from './lazy.styles.js';

export { LazySpecs, LAZY_FALLBACKS, type LazyFallback, type LazyState } from './lazy.specs.js';

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Lazy region — loads its content when needed and shows a placeholder until then.
 *
 * - **When** — `trigger`: `visible` (default, with `root-margin`) · `idle` ·
 *   `interaction` · `eager` · `manual` (call `load()`).
 * - **What** — every k3 element inside that is not defined yet is registered
 *   (with what it renders), then the optional `loader` promise is awaited.
 * - **Meanwhile** — `fallback="skeleton"` wraps the real content in
 *   `k3-skeleton` (same box, no layout shift); `indicator` shows
 *   `k3-loading-indicator` only for loads longer than 150 ms and keeps it
 *   300 ms; a `slot="fallback"` child replaces both.
 *
 * ```html
 * <k3-lazy>
 *   <section>…heavy content, k3 components…</section>
 * </k3-lazy>
 * ```
 *
 * @slot - Content revealed once ready
 * @slot fallback - Custom placeholder (replaces skeleton / indicator)
 * @slot error - Custom error message (default: text + Retry)
 * @fires k3-load-start - `{ source: 'auto' | 'api' }`
 * @fires k3-load-end - `{ ok, tags }` — tags registered for this region
 * @fires k3-error - `{ error }` when the loader or a registration fails
 * @csspart skeleton - Default skeleton wrapper
 * @csspart content - Content wrapper (indicator / custom fallback modes)
 * @csspart fallback - Placeholder layer
 * @csspart error - Error panel
 * @cssprop --k3-lazy-min-block-size - Reserve height before the content exists
 * @cssprop --k3-lazy-fallback-min-block-size - Minimum height of the placeholder layer (4rem)
 */
export class K3Lazy extends K3Element {
  static override styles = [hostReset, stateLayerStyles, focusRingStyles, lazyStyles];

  /** When loading starts. */
  @property({ reflect: true }) trigger: LazyTrigger = LazySpecs.defaultTrigger;
  /** Grows the viewport for `trigger="visible"` (CSS margin syntax). */
  @property({ attribute: 'root-margin' }) rootMargin: string = LazySpecs.defaultRootMargin;
  /** Placeholder while not ready. */
  @property({ reflect: true }) fallback: LazyFallback = LazySpecs.defaultFallback;
  /** Skeleton animation — pulse · wave · none. */
  @property({ reflect: true }) animation: SkeletonAnimation = 'wave';
  /** Indicator anti-flicker delay (ms). */
  @property({ type: Number }) delay: number = LazySpecs.indicatorDelay;
  /** Minimum indicator display once shown (ms). */
  @property({ type: Number, attribute: 'min-duration' }) minDuration: number =
    LazySpecs.indicatorMinDuration;
  /** idle · loading · ready · error (reflected for styling). */
  @property({ reflect: true }) state: LazyState = 'idle';
  /** Optional async work after registration (fetch data, import a module…). */
  @property({ attribute: false }) loader: (() => Promise<unknown>) | null = null;

  @state() private fallbackShown = true;
  @state() private hasCustomFallback = false;

  private waiting?: AbortController;
  private running?: Promise<void>;
  private shownAt = 0;
  private children$?: MutationObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomFallback();
    this.children$ = new MutationObserver(() => this.syncCustomFallback());
    this.children$.observe(this, { childList: true });
    if (this.hasUpdated) this.arm();
  }

  override disconnectedCallback(): void {
    this.children$?.disconnect();
    this.waiting?.abort();
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('fallback')) {
      if (this.fallback === 'indicator') void import('./loading-indicator.js');
      if (this.state !== 'loading') this.fallbackShown = this.placeholderAtRest();
    }
  }

  override firstUpdated(): void {
    this.arm();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('state')) {
      this.toggleAttribute('aria-busy', this.state === 'idle' || this.state === 'loading');
    }
    const rearm = (key: 'trigger' | 'rootMargin') => changed.has(key) && changed.get(key) !== undefined;
    if (rearm('trigger') || rearm('rootMargin')) this.arm();
  }

  /** Start loading now (any trigger). Resolves once ready (or failed). */
  load(): Promise<void> {
    if (this.state === 'ready') return Promise.resolve();
    if (this.state === 'loading' && this.running) return this.running;
    this.waiting?.abort();
    this.running = this.run();
    return this.running;
  }

  /** Try again after an error. */
  retry(): Promise<void> {
    if (this.state !== 'error') return this.load();
    this.state = 'idle';
    this.fallbackShown = this.placeholderAtRest();
    return this.load();
  }

  /* ── internals ─────────────────────────────────────────────────────── */

  /** Placeholder visible before loading starts (indicator waits for a load). */
  private placeholderAtRest(): boolean {
    return this.hasCustomFallback || this.fallback === 'skeleton';
  }

  private syncCustomFallback(): void {
    const has = !!this.querySelector(':scope > [slot="fallback"]');
    if (has !== this.hasCustomFallback) {
      this.hasCustomFallback = has;
      if (this.state !== 'loading' && this.state !== 'ready') this.fallbackShown = this.placeholderAtRest();
    }
  }

  /** Wait for the trigger (except `manual`), then load. */
  private arm(): void {
    if (this.state !== 'idle' || this.trigger === 'manual' || !this.isConnected) return;
    this.waiting?.abort();
    const ctrl = new AbortController();
    this.waiting = ctrl;
    whenTriggered(this, this.trigger, { rootMargin: this.rootMargin, signal: ctrl.signal }).then(
      () => {
        if (!ctrl.signal.aborted) void this.run('auto');
      },
      () => {
        /* aborted: disconnected, trigger changed or load() called */
      },
    );
  }

  private async run(source: 'auto' | 'api' = 'api'): Promise<void> {
    this.state = 'loading';
    emitLifecycle(this, 'load-start', { source });
    let indicatorTimer: ReturnType<typeof setTimeout> | undefined;
    if (!this.placeholderAtRest() && this.fallback === 'indicator') {
      this.fallbackShown = false;
      indicatorTimer = setTimeout(() => {
        this.fallbackShown = true;
        this.shownAt = performance.now();
      }, Math.max(0, this.delay));
    }
    try {
      const tags = pendingCustomElements(this).filter(isKnown);
      await registerAll(tags);
      await this.loader?.();
      clearTimeout(indicatorTimer);
      if (this.fallback === 'indicator' && this.fallbackShown && !this.hasCustomFallback) {
        const left = this.minDuration - (performance.now() - this.shownAt);
        if (left > 0) await wait(left);
      }
      this.state = 'ready';
      this.fallbackShown = false;
      emitLifecycle(this, 'load-end', { ok: true, tags });
    } catch (error) {
      clearTimeout(indicatorTimer);
      this.state = 'error';
      this.fallbackShown = false;
      this.emit('k3-error', { error });
      emitLifecycle(this, 'load-end', { ok: false, tags: [] });
    }
  }

  override render() {
    const t = (key: keyof typeof LazySpecs.accessibility, i18nKey: string) =>
      i18n.t(i18nKey, LazySpecs.accessibility[key]);
    const status = html`<span class="sr-only" role="status"
      >${this.state === 'loading' && this.fallbackShown ? t('loadingLabel', 'lazy.loading') : ''}</span
    >`;

    if (this.state === 'error') {
      return html`${status}
        <div class="error" part="error" role="alert">
          <slot name="error">
            <p class="error-text">${t('errorLabel', 'lazy.error')}</p>
            <button type="button" class="retry k3-state-layer k3-focus-ring" @click=${() => void this.retry()}>
              ${t('retryLabel', 'lazy.retry')}
            </button>
          </slot>
        </div>`;
    }

    const ready = this.state === 'ready';
    /* Default: the real content sits under a k3-skeleton bone — same box, no CLS */
    if (this.fallback === 'skeleton' && !this.hasCustomFallback) {
      return html`${status}
        <k3-skeleton part="skeleton" block ?loaded=${ready} animation=${this.animation}>
          <slot></slot>
        </k3-skeleton>`;
    }

    const overlay = !ready && this.fallbackShown;
    return html`${status}
      <div class="stack">
        <div class="content" part="content" ?data-hidden=${!ready} ?inert=${!ready}>
          <slot></slot>
        </div>
        ${overlay
          ? html`<div class="overlay" part="fallback">
              <slot name="fallback"
                >${this.fallback === 'indicator'
                  ? html`<k3-loading-indicator contained></k3-loading-indicator>`
                  : nothing}</slot
              >
            </div>`
          : nothing}
      </div>`;
  }
}

export default K3Lazy;

if (!customElements.get('k3-lazy')) {
  customElements.define('k3-lazy', K3Lazy);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-lazy': K3Lazy;
  }
}
