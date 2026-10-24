import { html, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  hasNamedSlot,
  afterPaint,
  stateLayerStyles,
  detectGesture,
  swipe,
  phase,
  LayerPortal,
  rootRemPx,
  normalizeLabel,
  type GestureController,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { snackbarStyles } from './snackbar.styles.js';
import {
  snackbarQueue,
  type SnackbarQueueBehavior,
} from './snackbar-queue.js';
import { PauseableTimeout } from './snackbar-timer.js';
import { applyChromeInset } from './snackbar-chrome.js';

export type SnackbarPosition = 'auto' | 'center' | 'start' | 'end';
export type SnackbarDuration = 'short' | 'long' | 'indefinite' | number;

/** M3: action wider than ~128 dp stacks below the label. */
export const SNACKBAR_STACK_ACTION_DP = 128;

export const SNACKBAR_DURATION_MS = {
  short: 4000,
  long: 10000,
  indefinite: 0,
} as const;

/** Resolve duration token / ms → milliseconds (`0` = stay open). */
export function resolveSnackbarDuration(
  duration: SnackbarDuration | undefined,
  hasAction: boolean,
): number {
  if (duration === undefined) {
    return hasAction ? SNACKBAR_DURATION_MS.indefinite : SNACKBAR_DURATION_MS.short;
  }
  if (typeof duration === 'number') return Math.max(0, duration);
  if (duration === 'short') return SNACKBAR_DURATION_MS.short;
  if (duration === 'long') return SNACKBAR_DURATION_MS.long;
  return SNACKBAR_DURATION_MS.indefinite;
}

/** Whether the bar should stack (forced, or action wider than 128 dp). */
export function snackbarShouldStack(
  actionWidthPx: number,
  forced = false,
  remPx = 16,
): boolean {
  if (forced) return true;
  if (actionWidthPx <= 0) return false;
  const threshold = (SNACKBAR_STACK_ACTION_DP / 16) * remPx;
  return actionWidthPx > threshold;
}

function durationConverter(value: string | null): SnackbarDuration {
  if (value === null || value === '') return 'short';
  if (value === 'short' || value === 'long' || value === 'indefinite') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 'short';
}

/**
 * M3 / M3E Snackbar — short process updates at the bottom of the UI.
 *
 * @see https://m3.material.io/components/snackbar/overview
 * @see https://m3.material.io/components/snackbar/specs
 */
export class K3Snackbar extends K3Element {
  static override styles = [hostReset, stateLayerStyles, snackbarStyles];

  /**
   * Auto-dismiss — `short` (4s) · `long` (10s) · `indefinite` / `0`.
   * With an action and no duration set, defaults to indefinite.
   */
  @property({
    converter: {
      fromAttribute: durationConverter,
      toAttribute: (v: SnackbarDuration) => String(v),
    },
  })
  duration: SnackbarDuration = 'short';

  /** Show built-in trailing close (after action). */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /** Text action label (optional). Prefer slot `action` for custom controls. */
  @property({ type: String }) action = '';

  /** Accessible name for the dismiss control. */
  @property({ type: String, attribute: 'close-label' }) closeLabel = '';

  /**
   * Horizontal placement — default `center` (MDC). `start` / `end` opt-in.
   */
  @property({ type: String, reflect: true }) position: SnackbarPosition = 'center';

  /** Force stacked layout (action on its own row). Also auto when action &gt; 128 dp. */
  @property({ type: Boolean, reflect: true }) stacked = false;

  /**
   * Queue behavior when `show()` is called.
   * `queue` (default) · `replace` · `bypass`
   */
  @property({ type: String, attribute: 'queue-behavior', reflect: true })
  queueBehavior: SnackbarQueueBehavior = 'queue';

  /** Nudge above FAB / bottom bar when open (default on). */
  @property({ type: Boolean, attribute: 'chrome-inset' }) chromeInset = true;

  @state() private open = false;
  @state() private hasActionSlot = false;
  @state() private hasTrailingSlot = false;
  @state() private twoLine = false;
  @state() private autoStacked = false;

  @query('.label') private labelEl?: HTMLElement;
  @query('.bar') private barEl?: HTMLElement;
  @query('.action') private actionEl?: HTMLElement;

  private readonly portal = new LayerPortal();
  private readonly dismissTimer = new PauseableTimeout(() => void this.hide('auto'));
  private lineRo?: ResizeObserver;
  private enterPromise: Promise<void> | null = null;
  private swipeCtrl?: GestureController;
  private chromeRo?: ResizeObserver;
  private onWinResize?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.refreshSlots();
  }

  override disconnectedCallback(): void {
    this.teardownChrome();
    this.swipeCtrl?.destroy();
    this.swipeCtrl = undefined;
    this.lineRo?.disconnect();
    this.dismissTimer.clear();
    snackbarQueue.cancel(this);
    if (!this.portal.isElevating) {
      this.portal.clearHome();
    }
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.observeLabelLines();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('action') || changed.has('stacked')) {
      this.measureStack();
    }
  }

  private elevateLayer(): void {
    this.portal.elevate(this);
  }

  private restoreLayer(): void {
    this.portal.restore(this);
  }

  private refreshSlots(): void {
    this.hasActionSlot = hasNamedSlot(this, 'action');
    this.hasTrailingSlot = hasNamedSlot(this, 'trailing');
  }

  private observeLabelLines(): void {
    const el = this.labelEl;
    if (!el || typeof ResizeObserver === 'undefined') return;
    this.lineRo?.disconnect();
    this.lineRo = new ResizeObserver(() => {
      this.updateLineCount();
      this.measureStack();
    });
    this.lineRo.observe(el);
    this.updateLineCount();
    this.measureStack();
  }

  private updateLineCount(): void {
    const el = this.labelEl;
    if (!el) return;
    const styles = getComputedStyle(el);
    const lh = Number.parseFloat(styles.lineHeight) || 20;
    const lines = Math.round(el.scrollHeight / lh);
    const chars = normalizeLabel(this.textContent ?? '').length;
    this.twoLine = lines >= 2 || chars > 40;
  }

  private measureStack(): void {
    if (this.stacked) {
      this.autoStacked = true;
      return;
    }
    const action = this.actionEl;
    if (!action || !this.showAction) {
      this.autoStacked = false;
      return;
    }
    const w = action.getBoundingClientRect().width;
    this.autoStacked = snackbarShouldStack(w, false, rootRemPx());
  }

  private syncChromeInset(): void {
    applyChromeInset(this, this.chromeInset);
  }

  private setupChrome(): void {
    this.syncChromeInset();
    if (typeof ResizeObserver !== 'undefined') {
      this.chromeRo?.disconnect();
      this.chromeRo = new ResizeObserver(() => this.syncChromeInset());
      this.chromeRo.observe(document.documentElement);
    }
    this.onWinResize = () => this.syncChromeInset();
    window.addEventListener('resize', this.onWinResize);
  }

  private teardownChrome(): void {
    this.chromeRo?.disconnect();
    this.chromeRo = undefined;
    if (this.onWinResize) {
      window.removeEventListener('resize', this.onWinResize);
      this.onWinResize = undefined;
    }
    this.style.removeProperty('--k3-snackbar-inset-bottom');
  }

  private setupSwipe(): void {
    this.swipeCtrl?.destroy();
    const bar = this.barEl;
    if (!bar) return;
    this.swipeCtrl = detectGesture(
      bar,
      swipe(
        phase({
          onEnd: (d) => {
            if (
              (d.direction === 'down' || d.direction === 'left' || d.direction === 'right') &&
              d.displacement >= 48
            ) {
              void this.hide('user');
            }
          },
        }),
        {
          directions: ['down', 'left', 'right'],
          minDisplacement: 48,
          pointerTypes: ['touch', 'pen'],
        },
      ),
    );
  }

  private onBarPointerEnter = (): void => this.dismissTimer.pause();
  private onBarPointerLeave = (): void => this.dismissTimer.resume();
  private onBarFocusIn = (): void => this.dismissTimer.pause();
  private onBarFocusOut = (e: FocusEvent): void => {
    const bar = this.barEl;
    const next = e.relatedTarget as Node | null;
    if (bar && next && bar.contains(next)) return;
    this.dismissTimer.resume();
  };

  private bindPauseListeners(): void {
    const bar = this.barEl;
    if (!bar) return;
    bar.addEventListener('pointerenter', this.onBarPointerEnter);
    bar.addEventListener('pointerleave', this.onBarPointerLeave);
    bar.addEventListener('focusin', this.onBarFocusIn);
    bar.addEventListener('focusout', this.onBarFocusOut);
  }

  private unbindPauseListeners(): void {
    const bar = this.barEl;
    if (!bar) return;
    bar.removeEventListener('pointerenter', this.onBarPointerEnter);
    bar.removeEventListener('pointerleave', this.onBarPointerLeave);
    bar.removeEventListener('focusin', this.onBarFocusIn);
    bar.removeEventListener('focusout', this.onBarFocusOut);
  }

  private playEnter(): Promise<void> {
    if (this.open) return Promise.resolve();
    if (this.enterPromise) return this.enterPromise;
    this.enterPromise = (async () => {
      this.elevateLayer();
      this.open = false;
      await this.updateComplete;
      void this.barEl?.offsetWidth;
      await afterPaint();
      this.open = true;
      await this.updateComplete;
      this.measureStack();
      this.updateLineCount();
    })().finally(() => {
      this.enterPromise = null;
    });
    return this.enterPromise;
  }

  /**
   * Open immediately (no queue). Prefer {@link show} for M3 one-at-a-time behavior.
   */
  async showNow(): Promise<boolean> {
    this.refreshSlots();
    const ok = await runOpenClose(
      this,
      'open',
      async () => {
        await this.playEnter();
      },
      { source: 'api' },
    );
    if (ok) {
      await this.updateComplete;
      this.observeLabelLines();
      this.setupChrome();
      this.setupSwipe();
      this.bindPauseListeners();
      const ms = resolveSnackbarDuration(this.duration, this.showAction);
      this.dismissTimer.start(ms);
    }
    return ok;
  }

  /** Open via the global queue (default). */
  async show(): Promise<boolean> {
    return snackbarQueue.request(this, this.queueBehavior);
  }

  async hide(source: 'user' | 'api' | 'auto' = 'api'): Promise<boolean> {
    this.dismissTimer.clear();
    if (!this.open) return true;
    this.unbindPauseListeners();
    this.swipeCtrl?.destroy();
    this.swipeCtrl = undefined;
    const ok = await runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
      },
      { source },
    );
    if (ok) {
      this.teardownChrome();
      this.restoreLayer();
    }
    return ok;
  }

  private onActionClick(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('k3-action', {
        bubbles: true,
        composed: true,
        detail: { source: 'user' },
      }),
    );
    void this.hide('user');
  }

  private onDismissClick(e: Event): void {
    e.stopPropagation();
    void this.hide('user');
  }

  private onSlotChange(): void {
    this.refreshSlots();
    this.updateLineCount();
    this.measureStack();
  }

  private get dismissAria(): string {
    return this.closeLabel.trim() || i18n.t('snackbar.dismiss');
  }

  private get showAction(): boolean {
    return this.hasActionSlot || this.action.trim().length > 0;
  }

  private get showTrailing(): boolean {
    return this.dismissible || this.hasTrailingSlot;
  }

  override render() {
    const stacked = this.stacked || this.autoStacked;
    const trailingVisible = this.showAction || this.showTrailing;
    return html`
      <div
        class=${classMap({
          bar: true,
          open: this.open,
          'two-line': this.twoLine && !stacked,
          stacked,
        })}
        part="container"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="label" part="label" id="k3-snackbar-label">
          <slot @slotchange=${this.onSlotChange}></slot>
        </div>
        <div
          class=${classMap({ trailing: true, has: trailingVisible })}
          part="trailing-group"
        >
          <div class=${classMap({ action: true, has: this.showAction })} part="action">
            ${this.hasActionSlot
              ? html`<slot
                  name="action"
                  @slotchange=${this.onSlotChange}
                  @click=${this.onActionClick}
                ></slot>`
              : this.action.trim()
                ? html`<button
                    type="button"
                    class="action-btn k3-state-layer"
                    part="action-button"
                    aria-describedby="k3-snackbar-label"
                    @click=${this.onActionClick}
                  >
                    ${this.action}
                  </button>`
                : nothing}
          </div>
          <span
            class=${classMap({ 'trailing-slot': true, has: this.hasTrailingSlot })}
            part="trailing"
          >
            <slot name="trailing" @slotchange=${this.onSlotChange}></slot>
          </span>
          ${this.dismissible
            ? html`<button
                type="button"
                class="dismiss k3-state-layer"
                part="dismiss"
                aria-label=${this.dismissAria}
                @click=${this.onDismissClick}
              >
                <span
                  class="ms notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon="close"
                  aria-hidden="true"
                ></span>
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }
}

export { showSnackbar, snackbarQueue } from './snackbar-queue.js';
export type { ShowSnackbarOptions, SnackbarQueueBehavior } from './snackbar-queue.js';
export default K3Snackbar;
