/**
 * Imperative toast manager — Expressive-compatible API.
 * Stack limit 3 · FIFO · promise loading→result.
 *
 * @see https://expressive.grenishrai.pro/docs/components/toast
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export type ToastPosition = 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  /** Picks the icon and its color. Omit for a plain toast. */
  type?: ToastType;
  action?: ToastAction;
  /** ms before auto-dismiss; `0` keeps it open. Defaults to the host timeout. */
  timeout?: number;
}

export interface ToastRecord {
  id: string;
  title: string;
  description: string;
  type?: ToastType;
  action?: ToastAction;
  /** Resolved timeout for this toast (`0` = indefinite). */
  timeout: number;
  createdAt: number;
}

type Shorthand = Omit<ToastOptions, 'title' | 'type'>;
type PromiseState<T> =
  | string
  | ((value: T) => string)
  | (ToastOptions & { title?: string });

export interface ToastHostConfig {
  position: ToastPosition;
  limit: number;
  timeout: number;
}

type Listener = () => void;

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `k3-toast-${idSeq}`;
}

/**
 * Global toast store — host CE subscribes and paints the stack.
 * Max visible = `limit` (default 3); older entries stay queued behind
 * (`data-limited`) until a slot frees.
 */
export class ToastManager {
  private items: ToastRecord[] = [];
  private listeners = new Set<Listener>();
  private config: ToastHostConfig = {
    position: 'bottom-right',
    limit: 3,
    timeout: 5000,
  };

  get position(): ToastPosition {
    return this.config.position;
  }
  get limit(): number {
    return this.config.limit;
  }
  get timeout(): number {
    return this.config.timeout;
  }

  /** Snapshot — newest first (index 0 = front of stack). */
  get toasts(): readonly ToastRecord[] {
    return this.items;
  }

  configure(partial: Partial<ToastHostConfig>): void {
    if (partial.position) this.config.position = partial.position;
    if (partial.limit != null) {
      this.config.limit = Math.max(1, Math.min(8, Math.round(partial.limit) || 3));
    }
    if (partial.timeout != null) {
      this.config.timeout = Math.max(0, Math.round(partial.timeout) || 0);
    }
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private resolveTimeout(options: ToastOptions): number {
    if (options.timeout != null) return Math.max(0, options.timeout);
    if (options.type === 'loading') return 0;
    return this.config.timeout;
  }

  show(options: ToastOptions): string {
    const id = nextId();
    const record: ToastRecord = {
      id,
      title: options.title?.trim() ?? '',
      description: options.description?.trim() ?? '',
      type: options.type,
      action: options.action,
      timeout: this.resolveTimeout(options),
      createdAt: Date.now(),
    };
    this.items = [record, ...this.items];
    this.emit();
    return id;
  }

  update(id: string, options: ToastOptions): void {
    const i = this.items.findIndex((t) => t.id === id);
    if (i < 0) return;
    const prev = this.items[i]!;
    const next: ToastRecord = {
      ...prev,
      title: options.title != null ? String(options.title).trim() : prev.title,
      description:
        options.description != null
          ? String(options.description).trim()
          : prev.description,
      type: options.type !== undefined ? options.type : prev.type,
      action: options.action !== undefined ? options.action : prev.action,
      timeout:
        options.timeout != null
          ? Math.max(0, options.timeout)
          : options.type === 'loading'
            ? 0
            : options.type
              ? this.config.timeout
              : prev.timeout,
    };
    this.items = [...this.items];
    this.items[i] = next;
    this.emit();
  }

  /** Close one toast, or all when `id` is omitted. */
  dismiss(id?: string): void {
    if (id == null) {
      if (!this.items.length) return;
      this.items = [];
      this.emit();
      return;
    }
    const next = this.items.filter((t) => t.id !== id);
    if (next.length === this.items.length) return;
    this.items = next;
    this.emit();
  }

  private typed(type: ToastType) {
    return (title: string, options: Shorthand = {}): string =>
      this.show({ ...options, title, type });
  }

  info = this.typed('info');
  success = this.typed('success');
  warning = this.typed('warning');
  error = this.typed('error');

  /**
   * Loading toast that becomes success / error when `promise` settles.
   * Returns the toast id (stable across the transition).
   */
  promise<T>(
    promise: Promise<T>,
    states: {
      loading: PromiseState<void>;
      success: PromiseState<T>;
      error: PromiseState<unknown>;
    },
  ): string {
    const resolveState = <V,>(
      value: PromiseState<V>,
      type: ToastType,
      result?: V,
    ): ToastOptions => {
      if (typeof value === 'function') {
        return { title: (value as (v: V) => string)(result as V), type };
      }
      if (value && typeof value === 'object') {
        return { type, ...(value as ToastOptions) };
      }
      return { title: String(value ?? ''), type };
    };

    const id = this.show(resolveState(states.loading, 'loading'));
    void promise.then(
      (result) => {
        this.update(id, resolveState(states.success, 'success', result));
      },
      (err) => {
        this.update(id, resolveState(states.error, 'error', err));
      },
    );
    return id;
  }
}

export const toastManager = new ToastManager();

/** Public imperative API (Expressive `useToast()` surface). */
export const toast = {
  show: (options: ToastOptions) => toastManager.show(options),
  info: (title: string, options?: Shorthand) => toastManager.info(title, options),
  success: (title: string, options?: Shorthand) =>
    toastManager.success(title, options),
  warning: (title: string, options?: Shorthand) =>
    toastManager.warning(title, options),
  error: (title: string, options?: Shorthand) => toastManager.error(title, options),
  promise: <T,>(
    p: Promise<T>,
    states: {
      loading: PromiseState<void>;
      success: PromiseState<T>;
      error: PromiseState<unknown>;
    },
  ) => toastManager.promise(p, states),
  dismiss: (id?: string) => toastManager.dismiss(id),
  get manager() {
    return toastManager;
  },
};

export type ToastApi = typeof toast;
