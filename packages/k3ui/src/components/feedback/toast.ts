import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { K3Element, stateLayerStyles } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import { PauseableTimeout } from './snackbar-timer.js';
import {
  toastManager,
  toast,
  type ToastPosition,
  type ToastRecord,
  type ToastType,
} from './toast-manager.js';
import { toastStyles } from './toast.styles.js';
import { observeToastChrome } from './toast-chrome.js';
import { registry } from '../../registry/register.js';

export type { ToastPosition, ToastType, ToastOptions, ToastAction, ToastApi } from './toast-manager.js';
export { toast, toastManager } from './toast-manager.js';

const TYPE_ICON: Record<Exclude<ToastType, 'loading'>, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

const SWIPE_DISMISS_PX = 64;

interface LiveToast {
  record: ToastRecord;
  entering: boolean;
  leaving: boolean;
  swipeDir: '' | 'down' | 'end';
  swipeX: number;
  swipeY: number;
  timer: PauseableTimeout;
}

/**
 * Toast host — stacked notifications (max 3), fan-out on hover/focus,
 * swipe dismiss, promise loading→result. Auto-mounted by {@link toast}.
 *
 * Inspired by Expressive Toast (MIT) / Base UI toast stacking.
 *
 * @see https://expressive.grenishrai.pro/docs/components/toast
 * @see ./toast-manager.ts
 */
export class K3Toast extends K3Element {
  static override styles = [hostReset, stateLayerStyles, toastStyles];

  /** Corner the stack sits in. */
  @property({ reflect: true }) position: ToastPosition = 'bottom-right';

  /** How many toasts show at once; older ones fade (`data-limited`). */
  @property({ type: Number, reflect: true }) limit = 3;

  /** Default ms before auto-dismiss. */
  @property({ type: Number, reflect: true }) timeout = 5000;

  @state() private expanded = false;
  @state() private live: LiveToast[] = [];

  private unsub?: () => void;
  private chromeStop?: () => void;
  private expandDepth = 0;
  private pointerId: number | null = null;
  private swipeToastId: string | null = null;
  private swipeStartX = 0;
  private swipeStartY = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', i18n.t('toast.region', 'Notifications'));
    this.syncConfig();
    this.unsub = toastManager.subscribe(() => this.syncFromManager());
    this.chromeStop = observeToastChrome(this);
    this.syncFromManager();
  }

  override disconnectedCallback(): void {
    this.unsub?.();
    this.unsub = undefined;
    this.chromeStop?.();
    this.chromeStop = undefined;
    for (const t of this.live) t.timer.clear();
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('position') || changed.has('limit') || changed.has('timeout')) {
      this.syncConfig();
    }
    this.toggleAttribute('data-expanded', this.expanded);
    if (changed.has('live') || changed.has('expanded')) {
      queueMicrotask(() => this.syncStackGeometry());
    }
  }

  private syncConfig(): void {
    if (
      toastManager.position === this.position &&
      toastManager.limit === this.limit &&
      toastManager.timeout === this.timeout
    ) {
      return;
    }
    toastManager.configure({
      position: this.position,
      limit: this.limit,
      timeout: this.timeout,
    });
  }

  private syncFromManager(): void {
    const records = toastManager.toasts;
    const byId = new Map(this.live.map((t) => [t.record.id, t]));
    const next: LiveToast[] = [];

    for (const record of records) {
      const prev = byId.get(record.id);
      if (prev) {
        const typeChanged = prev.record.type !== record.type;
        const wasLoading = prev.record.type === 'loading';
        prev.record = record;
        if (typeChanged || wasLoading) {
          this.rearmTimer(prev);
        }
        next.push(prev);
        byId.delete(record.id);
      } else {
        const live: LiveToast = {
          record,
          entering: true,
          leaving: false,
          swipeDir: '',
          swipeX: 0,
          swipeY: 0,
          timer: new PauseableTimeout(() => this.beginLeave(record.id)),
        };
        next.push(live);
        requestAnimationFrame(() => {
          live.entering = false;
          this.live = [...this.live];
          this.armTimer(live);
        });
      }
    }

    for (const orphan of byId.values()) {
      orphan.timer.clear();
    }

    this.live = next;
    this.pauseOrResumeTimers();
  }

  private armTimer(live: LiveToast): void {
    live.timer.clear();
    const ms = live.record.timeout;
    if (ms <= 0 || live.leaving) return;
    const index = this.stackIndex(live.record.id);
    if (index >= this.limit || this.expanded) {
      live.timer.prime(ms);
      if (this.expanded) live.timer.pause();
      return;
    }
    live.timer.start(ms);
  }

  private rearmTimer(live: LiveToast): void {
    this.armTimer(live);
    this.pauseOrResumeTimers();
  }

  private pauseOrResumeTimers(): void {
    const limit = this.limit;
    this.live.forEach((t) => {
      if (t.leaving || t.record.timeout <= 0) return;
      const i = this.stackIndex(t.record.id);
      if (this.expanded || i >= limit) {
        if (t.timer.running) t.timer.pause();
        else if (!t.timer.remaining && !t.timer.running) this.armTimer(t);
        else t.timer.pause();
      } else {
        if (!t.timer.running) {
          if (t.timer.remaining > 0) t.timer.resume(500);
          else this.armTimer(t);
        }
      }
    });
  }

  /**
   * Stack slot among non-leaving toasts — so siblings reindex immediately
   * when one starts leaving (smooth settle via CSS transform).
   */
  private stackIndex(id: string): number {
    let n = 0;
    for (const t of this.live) {
      if (t.leaving) continue;
      if (t.record.id === id) return n;
      n++;
    }
    return 0;
  }

  private beginLeave(id: string, swipe: '' | 'down' | 'end' = ''): void {
    const live = this.live.find((t) => t.record.id === id);
    if (!live || live.leaving) return;
    live.timer.clear();
    live.leaving = true;
    live.swipeDir = swipe;
    /* Reindex peers now — they transition down while this one exits */
    this.live = [...this.live];
    queueMicrotask(() => this.syncStackGeometry());
    /* Match spatial-default so exit + settle finish together */
    const ms = 480;
    window.setTimeout(() => {
      toastManager.dismiss(id);
    }, ms);
  }

  private dismissLabel(): string {
    return i18n.t('toast.dismiss', i18n.t('snackbar.dismiss', 'Dismiss'));
  }

  private onExpandEnter = (): void => {
    this.expandDepth += 1;
    this.expanded = true;
    this.pauseOrResumeTimers();
  };

  private onExpandLeave = (): void => {
    this.expandDepth = Math.max(0, this.expandDepth - 1);
    if (this.expandDepth === 0) {
      this.expanded = false;
      this.pauseOrResumeTimers();
    }
  };

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      const front = this.live.find((t) => !t.leaving && !t.entering);
      if (front) {
        e.preventDefault();
        this.beginLeave(front.record.id);
      }
    }
  };

  private onAction = (id: string, record: ToastRecord): void => {
    record.action?.onClick();
    this.beginLeave(id);
  };

  private onPointerDown = (e: PointerEvent, id: string): void => {
    if (e.button !== 0) return;
    /* Close / action — ne pas démarrer le swipe ni capturer le pointeur */
    const t = e.target as Element | null;
    if (t?.closest?.('button, a, [role="button"]')) return;
    const live = this.live.find((t) => t.record.id === id);
    if (!live || live.leaving) return;
    this.pointerId = e.pointerId;
    this.swipeToastId = id;
    this.swipeStartX = e.clientX;
    this.swipeStartY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent, id: string): void => {
    if (this.pointerId !== e.pointerId || this.swipeToastId !== id) return;
    const live = this.live.find((t) => t.record.id === id);
    if (!live) return;
    const dx = e.clientX - this.swipeStartX;
    const dy = e.clientY - this.swipeStartY;
    live.swipeX = Math.max(0, dx);
    live.swipeY = Math.max(0, dy);
    this.live = [...this.live];
  };

  private onPointerUp = (e: PointerEvent, id: string): void => {
    if (this.pointerId !== e.pointerId || this.swipeToastId !== id) return;
    const live = this.live.find((t) => t.record.id === id);
    this.pointerId = null;
    this.swipeToastId = null;
    if (!live) return;
    const dismissX = live.swipeX >= SWIPE_DISMISS_PX;
    const dismissY = live.swipeY >= SWIPE_DISMISS_PX;
    if (dismissX || dismissY) {
      this.beginLeave(id, dismissY ? 'down' : 'end');
      return;
    }
    live.swipeX = 0;
    live.swipeY = 0;
    this.live = [...this.live];
  };

  /** Write stack CSS vars on the DOM — no Lit state (avoids update loops). */
  private syncStackGeometry(): void {
    requestAnimationFrame(() => {
      const roots = [
        ...this.renderRoot.querySelectorAll<HTMLElement>('.toast:not([data-leaving])'),
      ];
      /* Order by stack index (DOM may still list leaving toasts) */
      roots.sort(
        (a, b) =>
          Number(a.style.getPropertyValue('--k3-toast-index') || a.dataset.index || 0) -
          Number(b.style.getPropertyValue('--k3-toast-index') || b.dataset.index || 0),
      );
      const heights = roots.map((el) => {
        const content = el.querySelector('.content') as HTMLElement | null;
        return content?.offsetHeight || el.offsetHeight || 72;
      });
      const front = heights[0] || 72;
      let offset = 0;
      roots.forEach((el, i) => {
        const h = heights[i] || front;
        el.style.setProperty('--k3-toast-own-h', `${h}px`);
        el.style.setProperty('--k3-toast-front-h', `${front}px`);
        el.style.setProperty('--k3-toast-offset-y', `${offset}px`);
        offset += h + 8;
      });
    });
  }

  private renderIcon(type?: ToastType) {
    if (!type) return nothing;
    if (type === 'loading') {
      return html`<span class="icon" data-type="loading" aria-hidden="true"
        ><span class="spin"></span
      ></span>`;
    }
    const name = TYPE_ICON[type];
    return html`<span class="icon" data-type=${type} aria-hidden="true">
      <span
        class="ms notranslate"
        translate="no"
        lang="zxx"
        data-k3-icon=${name}
      ></span>
    </span>`;
  }

  private renderToast(live: LiveToast) {
    const { record } = live;
    /* Leaving toasts leave the stack slot — peers settle smoothly */
    const index = live.leaving ? 0 : this.stackIndex(record.id);
    const activeCount = this.live.filter((t) => !t.leaving).length;
    const limited = !live.leaving && index >= this.limit;
    const behind = !live.leaving && index > 0 && !this.expanded;
    const swiping = this.swipeToastId === record.id && this.pointerId != null;

    return html`
      <div
        class="toast"
        part="toast"
        data-toast-id=${record.id}
        data-index=${String(index)}
        data-typed=${record.type ? '' : nothing}
        data-limited=${limited ? '' : nothing}
        data-behind=${behind ? '' : nothing}
        data-entering=${live.entering ? '' : nothing}
        data-leaving=${live.leaving ? '' : nothing}
        data-swiping=${swiping ? '' : nothing}
        data-swipe=${live.swipeDir || nothing}
        style="
          --k3-toast-index: ${index};
          --k3-toast-stack-count: ${activeCount};
          --k3-toast-swipe-x: ${live.swipeX}px;
          --k3-toast-swipe-y: ${live.swipeY}px;
        "
        @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, record.id)}
        @pointermove=${(e: PointerEvent) => this.onPointerMove(e, record.id)}
        @pointerup=${(e: PointerEvent) => this.onPointerUp(e, record.id)}
        @pointercancel=${(e: PointerEvent) => this.onPointerUp(e, record.id)}
      >
        <div class="content" part="content">
          ${this.renderIcon(record.type)}
          <div class="body">
            ${record.title
              ? html`<p class="title" part="title">${record.title}</p>`
              : nothing}
            ${record.description
              ? html`<p class="description" part="description">${record.description}</p>`
              : nothing}
            ${record.action
              ? html`<button
                  type="button"
                  class="action k3-state-layer"
                  part="action"
                  @pointerdown=${(e: PointerEvent) => e.stopPropagation()}
                  @click=${(e: MouseEvent) => {
                    e.stopPropagation();
                    this.onAction(record.id, record);
                  }}
                >
                  ${record.action.label}
                </button>`
              : nothing}
          </div>
          <button
            type="button"
            class="close k3-state-layer"
            part="close"
            aria-label=${this.dismissLabel()}
            @pointerdown=${(e: PointerEvent) => e.stopPropagation()}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              this.beginLeave(record.id);
            }}
          >
            <span
              class="ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="close"
              aria-hidden="true"
            ></span>
          </button>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      <div
        class="viewport"
        part="viewport"
        tabindex="-1"
        @focusin=${this.onExpandEnter}
        @focusout=${this.onExpandLeave}
        @pointerenter=${this.onExpandEnter}
        @pointerleave=${this.onExpandLeave}
        @keydown=${this.onKeydown}
      >
        ${repeat(
          this.live,
          (t) => t.record.id,
          (t) => this.renderToast(t),
        )}
      </div>
    `;
  }
}

export default K3Toast;

if (!customElements.get('k3-toast')) {
  customElements.define('k3-toast', K3Toast);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-toast': K3Toast;
  }
}

/** Ensure a host is in the document, then run the toast API. */
export async function ensureToastHost(): Promise<K3Toast> {
  await registry.register('k3-toast');
  let host = document.querySelector('k3-toast') as K3Toast | null;
  if (!host) {
    host = document.createElement('k3-toast') as K3Toast;
    document.body.appendChild(host);
  }
  return host;
}

/** Show helpers that auto-mount `<k3-toast>`. */
export const showToast = Object.assign(
  async (options: Parameters<typeof toast.show>[0]) => {
    await ensureToastHost();
    return toast.show(options);
  },
  {
    info: async (title: string, options?: Parameters<typeof toast.info>[1]) => {
      await ensureToastHost();
      return toast.info(title, options);
    },
    success: async (title: string, options?: Parameters<typeof toast.success>[1]) => {
      await ensureToastHost();
      return toast.success(title, options);
    },
    warning: async (title: string, options?: Parameters<typeof toast.warning>[1]) => {
      await ensureToastHost();
      return toast.warning(title, options);
    },
    error: async (title: string, options?: Parameters<typeof toast.error>[1]) => {
      await ensureToastHost();
      return toast.error(title, options);
    },
    promise: async <T,>(
      p: Promise<T>,
      states: Parameters<typeof toast.promise<T>>[1],
    ) => {
      await ensureToastHost();
      return toast.promise(p, states);
    },
    dismiss: (id?: string) => toast.dismiss(id),
  },
);
