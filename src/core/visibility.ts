/**
 * Shared "is it worth animating?" signal for continuous animation loops.
 *
 * One `IntersectionObserver` for every subscriber (instead of one per
 * component instance) plus the page `visibilitychange` event. A loop that
 * subscribes pauses while its element is off-screen or the tab is hidden and
 * resumes when both become true again.
 *
 * Environments without `IntersectionObserver` (SSR, jsdom) always report
 * "on screen" — loops behave as before.
 */

type Listener = (active: boolean) => void;

interface Entry {
  listeners: Set<Listener>;
  onScreen: boolean;
}

const entries = new Map<Element, Entry>();
let observer: IntersectionObserver | null = null;
let docListening = false;

function pageVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}

function notify(entry: Entry): void {
  const active = entry.onScreen && pageVisible();
  for (const fn of [...entry.listeners]) fn(active);
}

function onDocVisibility(): void {
  for (const entry of entries.values()) notify(entry);
}

function ensureObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver !== 'function') return observer;
  observer = new IntersectionObserver(
    (records) => {
      for (const r of records) {
        const entry = entries.get(r.target);
        if (!entry || entry.onScreen === r.isIntersecting) continue;
        entry.onScreen = r.isIntersecting;
        notify(entry);
      }
    },
    /* Small margin: resume just before the element scrolls in. */
    { rootMargin: '64px' },
  );
  return observer;
}

/** True when `el` is subscribed, on screen and the page is visible. */
export function isActivelyVisible(el: Element): boolean {
  const entry = entries.get(el);
  return (entry?.onScreen ?? true) && pageVisible();
}

/**
 * Call `listener(active)` whenever `el` starts / stops being worth animating.
 * Returns the unsubscribe function — call it from `disconnectedCallback`.
 */
export function observeActiveVisibility(el: Element, listener: Listener): () => void {
  let entry = entries.get(el);
  if (!entry) {
    entry = { listeners: new Set(), onScreen: true };
    entries.set(el, entry);
    ensureObserver()?.observe(el);
  }
  entry.listeners.add(listener);
  if (!docListening && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onDocVisibility);
    docListening = true;
  }
  return () => {
    const current = entries.get(el);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size > 0) return;
    entries.delete(el);
    observer?.unobserve(el);
    if (entries.size === 0) {
      observer?.disconnect();
      observer = null;
      if (docListening && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onDocVisibility);
        docListening = false;
      }
    }
  };
}

/** Subscribed elements — diagnostics / tests. */
export function activeVisibilityCount(): number {
  return entries.size;
}
