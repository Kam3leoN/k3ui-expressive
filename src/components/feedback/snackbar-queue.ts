import { registry } from '../../registry/register.js';
import type {
  K3Snackbar,
  SnackbarEdge,
  SnackbarMode,
  SnackbarVariant,
} from './snackbar.js';

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
  /** Stack mode — set by the queue (0 = front, `null` = one at a time). */
  stackDepth?: number | null;
  /** Stack mode — others stay visible, so the close slides out. */
  stackSlideExit?: boolean;
  style?: CSSStyleDeclaration;
}

interface QueueEntry {
  el: SnackbarQueueTarget;
  resolve: (ok: boolean) => void;
}

interface VisibleEntry extends QueueEntry {
  /** Close started — the rows behind already move forward. */
  leaving: boolean;
  /** Fully open — rows behind may now come in. */
  opened: boolean;
  cleanup: () => void;
}

/** Most snackbars visible at once in stack mode. */
export const SNACKBAR_STACK_MAX = 3;

/**
 * Global snackbar queue — one visible snackbar at a time (M3), or a stack of
 * up to 3 in vertical perspective (`setStack(3)`). FIFO: the oldest is in
 * front; only the front counts down. While the front plays its intro the
 * next ones wait, then come out from behind it.
 * `queue` waits · `replace` dismisses what is shown · `bypass` skips the queue.
 */
class SnackbarQueue {
  private max = 1;
  private visible: VisibleEntry[] = [];
  private pending: QueueEntry[] = [];

  /** Snackbars visible at once (1 = M3 one-at-a-time). */
  get stack(): number {
    return this.max;
  }

  /** Stack mode: 1 (default, M3) to 3 visible at once; the rest wait in line. */
  setStack(count: number): void {
    this.max = Math.min(SNACKBAR_STACK_MAX, Math.max(1, Math.round(count) || 1));
    this.sync();
    this.pump();
  }

  /** Request display — resolves when this snackbar has finished closing. */
  request(el: SnackbarQueueTarget, behavior: SnackbarQueueBehavior = 'queue'): Promise<boolean> {
    if (behavior === 'bypass') {
      return el.showNow();
    }
    return new Promise<boolean>((resolve) => {
      if (behavior === 'replace') {
        for (const e of this.pending) e.resolve(false);
        this.pending = [{ el, resolve }];
        const live = this.visible.filter((v) => !v.leaving);
        if (live.length) {
          for (const v of live) void v.el.hide('api'); /* close-end → pump */
        } else {
          this.pump();
        }
        return;
      }
      this.pending.push({ el, resolve });
      this.pump();
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
    const shown = this.visible.find((v) => v.el === el);
    if (shown) {
      shown.cleanup();
      this.visible = this.visible.filter((v) => v !== shown);
      shown.resolve(false);
      this.sync();
      this.pump();
    }
  }

  private pump(): void {
    for (;;) {
      if (this.visible.length >= this.max) return;
      const front = this.visible.find((v) => !v.leaving);
      if (front && !front.opened) return; /* one intro at a time */
      const next = this.pending.shift();
      if (!next) return;
      this.open(next);
    }
  }

  private open(next: QueueEntry): void {
    const entry: VisibleEntry = { ...next, leaving: false, opened: false, cleanup: () => {} };
    const el = next.el;

    const onOpenEnd = (): void => {
      entry.opened = true;
      this.pump();
    };
    const onCloseStart = (): void => {
      entry.leaving = true;
      el.stackSlideExit = this.max > 1 && this.visible.some((v) => v !== entry && !v.leaving);
      this.sync();
    };
    const remove = (ok: boolean): void => {
      entry.cleanup();
      this.visible = this.visible.filter((v) => v !== entry);
      if (this.max > 1 || el.stackDepth != null) {
        el.stackDepth = null;
        el.stackSlideExit = false;
        el.style?.removeProperty('z-index');
      }
      entry.resolve(ok);
      this.sync();
      this.pump();
    };
    const onCloseEnd = (): void => remove(true);

    el.addEventListener('k3-open-end', onOpenEnd);
    el.addEventListener('k3-close-start', onCloseStart);
    el.addEventListener('k3-close-end', onCloseEnd);
    entry.cleanup = () => {
      el.removeEventListener('k3-open-end', onOpenEnd);
      el.removeEventListener('k3-close-start', onCloseStart);
      el.removeEventListener('k3-close-end', onCloseEnd);
    };

    this.visible.push(entry);
    this.sync(); /* depth known before opening → arrives behind, quietly */
    void el.showNow().then((ok) => {
      if (!ok) remove(false);
    });
  }

  /** Depth + z-order of each visible snackbar; the one leaving stays on top. */
  private sync(): void {
    if (this.max <= 1) {
      for (const v of this.visible) {
        if (v.el.stackDepth != null) v.el.stackDepth = null;
      }
      return;
    }
    let depth = 0;
    for (const v of this.visible) {
      const d = v.leaving ? 0 : depth++;
      v.el.stackDepth = d;
      if (v.el.style) v.el.style.zIndex = String(v.leaving ? 60 : 55 - d);
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
  /** `expressive` (default) · `standard` */
  mode?: SnackbarMode;
  /** `inverse` (default) · `emphasized` · `tonal` · `error` */
  variant?: SnackbarVariant;
  /** `bottom` (default) · `top` */
  edge?: SnackbarEdge;
  /** Leading Material Symbol (SVG for built-in names). */
  icon?: string;
  /** Custom leading SVG path (viewBox `0 -960 960 960`). */
  iconPath?: string;
  /** Round image instead of the icon. */
  avatar?: string;
  /** Brand mark in the circle at opening (expressive). */
  brandIcon?: string;
  /** Second, quieter line. */
  supportingText?: string;
  /** Standard mode without leading icon. */
  hideIcon?: boolean;
  /** Loading indicator in place of the icon — end it with `el.loading = false`. */
  loading?: boolean;
  /**
   * Receives the element right away (the returned promise settles only after
   * the close) — e.g. to end loading: `el.loading = false`.
   */
  onCreate?: (el: K3Snackbar) => void;
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
  if (options.mode) el.mode = options.mode;
  if (options.variant) el.variant = options.variant;
  if (options.edge) el.edge = options.edge;
  if (options.icon) el.icon = options.icon;
  if (options.iconPath) el.iconPath = options.iconPath;
  if (options.avatar) el.avatar = options.avatar;
  if (options.brandIcon) el.brandIcon = options.brandIcon;
  if (options.supportingText) el.supportingText = options.supportingText;
  if (options.hideIcon != null) el.hideIcon = options.hideIcon;
  if (options.loading != null) el.loading = options.loading;
  document.body.appendChild(el);
  const cleanup = (): void => {
    el.removeEventListener('k3-close-end', cleanup);
    el.remove();
  };
  el.addEventListener('k3-close-end', cleanup);
  if (options.onAction) {
    el.addEventListener('k3-action', () => options.onAction?.());
  }
  options.onCreate?.(el);
  await el.show();
  return el;
}
