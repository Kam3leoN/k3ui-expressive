/**
 * Lazy-loading primitives — framework-agnostic, no UI.
 *
 * - `whenTriggered(el, trigger)` resolves when `el` should start loading:
 *   `visible` (IntersectionObserver + rootMargin) · `idle` · `interaction` ·
 *   `eager` · `manual` (only an abort — or the caller's own code — ends it).
 * - `pendingCustomElements(root)` lists custom elements of a subtree that are
 *   not defined yet: what a lazy region needs before it can reveal itself.
 *
 * `registry.registerWhen()` combines both for k3 tags; `<k3-lazy>` adds the
 * skeleton / loading-indicator states on top.
 */

export type LazyTrigger = 'visible' | 'idle' | 'interaction' | 'eager' | 'manual';

export const LAZY_TRIGGERS: readonly LazyTrigger[] = ['visible', 'idle', 'interaction', 'eager', 'manual'];

export interface WhenTriggeredOptions {
  /** Grows the viewport for `visible` (CSS margin syntax). Default `200px`. */
  rootMargin?: string;
  /** Stops waiting — the promise rejects with an `AbortError`. */
  signal?: AbortSignal;
  /** Upper bound for `idle`, in ms. Default 2000. */
  idleTimeout?: number;
}

/** Events that count as intent for the `interaction` trigger. */
const INTERACTION_EVENTS = ['pointerenter', 'pointerdown', 'focusin', 'keydown', 'touchstart'] as const;

function abortError(): DOMException {
  return new DOMException('Lazy trigger aborted', 'AbortError');
}

/** Resolve when `el` should load, according to `trigger`. */
export function whenTriggered(
  el: Element,
  trigger: LazyTrigger,
  options: WhenTriggeredOptions = {},
): Promise<void> {
  const { signal, rootMargin = '200px', idleTimeout = 2000 } = options;
  if (signal?.aborted) return Promise.reject(abortError());

  return new Promise<void>((resolve, reject) => {
    let release = (): void => {};
    const onAbort = (): void => {
      release();
      reject(abortError());
    };
    const settle = (): void => {
      release();
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    if (trigger === 'manual') return;

    if (trigger === 'visible' && typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) settle();
        },
        { rootMargin },
      );
      io.observe(el);
      release = () => io.disconnect();
      return;
    }

    if (trigger === 'idle') {
      if (typeof requestIdleCallback === 'function') {
        const id = requestIdleCallback(() => settle(), { timeout: idleTimeout });
        release = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(settle, 1);
        release = () => clearTimeout(id);
      }
      return;
    }

    if (trigger === 'interaction') {
      const onIntent = (): void => settle();
      for (const type of INTERACTION_EVENTS) {
        el.addEventListener(type, onIntent, { once: true, passive: true });
      }
      release = () => {
        for (const type of INTERACTION_EVENTS) el.removeEventListener(type, onIntent);
      };
      return;
    }

    /* `eager` — or `visible` without IntersectionObserver (old engines, SSR tests) */
    queueMicrotask(settle);
  });
}

/**
 * Tag names (unique, lower-case) of custom elements under `root` that are not
 * defined yet. Light DOM only — shadow roots belong to their own component.
 */
export function pendingCustomElements(root: ParentNode): string[] {
  const tags = new Set<string>();
  for (const el of root.querySelectorAll('*')) {
    const name = el.localName;
    if (name.includes('-') && !customElements.get(name)) tags.add(name);
  }
  return [...tags];
}
