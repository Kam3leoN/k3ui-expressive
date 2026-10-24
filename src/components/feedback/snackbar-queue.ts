import { registry } from '../../registry/register.js';

export type SnackbarQueueBehavior = 'queue' | 'replace' | 'bypass';

/** Minimal surface the queue needs from `k3-snackbar`. */
export interface SnackbarQueueTarget {
  showNow: () => Promise<boolean>;
  hide: (source?: 'user' | 'api' | 'auto') => Promise<boolean>;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
}

interface QueueEntry {
  el: SnackbarQueueTarget;
  resolve: (ok: boolean) => void;
}

/**
 * Global snackbar queue — one visible snackbar at a time (M3).
 * `queue` waits · `replace` dismisses the current · `bypass` skips the queue.
 */
class SnackbarQueue {
  private current: SnackbarQueueTarget | null = null;
  private pending: QueueEntry[] = [];

  /** Request display — resolves when this snackbar has finished closing. */
  request(el: SnackbarQueueTarget, behavior: SnackbarQueueBehavior = 'queue'): Promise<boolean> {
    if (behavior === 'bypass') {
      return el.showNow();
    }
    return new Promise<boolean>((resolve) => {
      if (behavior === 'replace') {
        for (const e of this.pending) e.resolve(false);
        this.pending = [];
        this.pending.push({ el, resolve });
        if (this.current) {
          void this.current.hide('api'); /* close-end → pump */
        } else {
          void this.pump();
        }
        return;
      }
      this.pending.push({ el, resolve });
      void this.pump();
    });
  }

  /** Drop a snackbar from the queue (e.g. disconnected). */
  cancel(el: SnackbarQueueTarget): void {
    this.pending = this.pending.filter((e) => {
      if (e.el === el) {
        e.resolve(false);
        return false;
      }
      return true;
    });
    if (this.current === el) this.current = null;
  }

  private async pump(): Promise<void> {
    if (this.current) return;
    const next = this.pending.shift();
    if (!next) return;
    this.current = next.el;
    const onClose = (): void => {
      next.el.removeEventListener('k3-close-end', onClose);
      if (this.current === next.el) this.current = null;
      next.resolve(true);
      void this.pump();
    };
    next.el.addEventListener('k3-close-end', onClose);
    const ok = await next.el.showNow();
    if (!ok) {
      next.el.removeEventListener('k3-close-end', onClose);
      if (this.current === next.el) this.current = null;
      next.resolve(false);
      void this.pump();
    }
  }
}

export const snackbarQueue = new SnackbarQueue();

export interface ShowSnackbarOptions {
  message: string;
  action?: string;
  dismissible?: boolean;
  /** `short` · `long` · `indefinite` · ms */
  duration?: 'short' | 'long' | 'indefinite' | number;
  position?: 'auto' | 'center' | 'start' | 'end';
  stacked?: boolean;
  queue?: SnackbarQueueBehavior;
  onAction?: () => void;
}

/**
 * Imperative helper — creates a transient `k3-snackbar`, shows it via the queue,
 * removes it after close.
 */
export async function showSnackbar(options: ShowSnackbarOptions): Promise<HTMLElement> {
  await registry.register('k3-snackbar');
  const mod = await import('./snackbar.js');
  const el = new mod.K3Snackbar();
  el.textContent = options.message;
  if (options.action) el.action = options.action;
  if (options.dismissible != null) el.dismissible = options.dismissible;
  if (options.duration != null) el.duration = options.duration;
  /* With action + no duration → indefinite (resolveSnackbarDuration default) */
  else if (options.action) el.duration = 'indefinite';
  if (options.position) el.position = options.position;
  if (options.stacked != null) el.stacked = options.stacked;
  if (options.queue) el.queueBehavior = options.queue;
  document.body.appendChild(el);
  const cleanup = (): void => {
    el.removeEventListener('k3-close-end', cleanup);
    el.remove();
  };
  el.addEventListener('k3-close-end', cleanup);
  if (options.onAction) {
    el.addEventListener('k3-action', () => options.onAction?.());
  }
  await el.show();
  return el;
}
