export type LifecyclePhase =
  | 'open-start'
  | 'open-end'
  | 'close-start'
  | 'close-end'
  | 'expand-start'
  | 'expand-end'
  | 'collapse-start'
  | 'collapse-end'
  | 'change-start'
  | 'change-end'
  | 'press-start'
  | 'press-end'
  | 'select-start'
  | 'select-end'
  | 'morph-start'
  | 'morph-end';

export interface LifecycleDetail {
  reason?: string;
  source?: 'user' | 'api' | 'escape' | 'backdrop' | 'auto' | 'drag';
  [key: string]: unknown;
}

const CANCELABLE = new Set<LifecyclePhase>([
  'open-start',
  'close-start',
  'expand-start',
  'collapse-start',
  'change-start',
  'select-start',
]);

/**
 * True when OS asks to reduce motion, or when the host sets
 * `data-k3-reduce-motion` (docs / user preference — animations on by default).
 */
export function prefersReducedMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-k3-reduce-motion')) {
    return true;
  }
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Emit a k3-* lifecycle CustomEvent. Returns false if canceled. */
export function emitLifecycle(
  el: EventTarget,
  phase: LifecyclePhase,
  detail: LifecycleDetail = {},
): boolean {
  const event = new CustomEvent(`k3-${phase}`, {
    bubbles: true,
    composed: true,
    cancelable: CANCELABLE.has(phase),
    detail,
  });
  return el.dispatchEvent(event);
}

/**
 * Wait for CSS transitions/animations on `el` (incl. shadow subtree).
 * One frame is yielded first so newly applied classes can start transitioning.
 */
export async function waitForMotion(
  el: HTMLElement,
  timeoutMs = 500,
): Promise<void> {
  if (prefersReducedMotion()) return;
  await afterFrames(1);
  const anims =
    typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : [];
  if (anims.length === 0) {
    /* Fallback — older engines / no WAAPI entry yet */
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        el.removeEventListener('transitionend', onEnd);
        el.removeEventListener('animationend', onEnd);
        resolve();
      };
      const onEnd = (): void => finish();
      el.addEventListener('transitionend', onEnd);
      el.addEventListener('animationend', onEnd);
      window.setTimeout(finish, Math.min(80, timeoutMs));
    });
    return;
  }
  await Promise.race([
    Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

/** Wait N animation frames (layout / paint settle). */
export function afterFrames(count = 1): Promise<void> {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let left = n;
    const step = (): void => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/** Wait two animation frames so closed styles paint before open transitions. */
export function afterPaint(): Promise<void> {
  return afterFrames(2);
}

/** Run open/close (or expand/collapse) sequence with cancelable start. */
export async function runOpenClose(
  el: HTMLElement,
  action: 'open' | 'close',
  apply: () => void | Promise<void>,
  detail: LifecycleDetail = {},
  aliases?: { start: LifecyclePhase; end: LifecyclePhase },
): Promise<boolean> {
  const start = aliases?.start ?? (action === 'open' ? 'open-start' : 'close-start');
  const end = aliases?.end ?? (action === 'open' ? 'open-end' : 'close-end');
  if (!emitLifecycle(el, start, detail)) return false;
  await apply();
  await waitForMotion(el);
  emitLifecycle(el, end, detail);
  return true;
}
