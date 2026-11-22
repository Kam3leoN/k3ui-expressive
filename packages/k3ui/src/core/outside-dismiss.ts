/**
 * Document-level outside pointerdown → dismiss overlay.
 */

import { pathIncludes, pathMatches } from './pointer.js';

export interface OutsideDismissOptions {
  onDismiss: (e: Event) => void;
  /** When false, listener no-ops. Default: always active. */
  isActive?: () => boolean;
  /** Extra nodes that count as “inside”. */
  ignoreNodes?: () => Iterable<EventTarget | null | undefined>;
  /** Comma-separated or list of CSS selectors (matches / closest on path). */
  ignoreSelectors?: string | (() => string);
  /** Ignore pointerdowns until this timestamp (`performance.now()`). */
  getIgnoreUntil?: () => number;
  /** Capture phase. Default true. */
  capture?: boolean;
}

export interface OutsideDismissController {
  detach: () => void;
}

/** Attach capture `pointerdown` outside-dismiss on `document`. */
export function attachOutsideDismiss(
  host: EventTarget,
  options: OutsideDismissOptions,
): OutsideDismissController {
  const capture = options.capture !== false;

  const onPointer = (e: Event): void => {
    if (options.isActive && !options.isActive()) return;
    const until = options.getIgnoreUntil?.() ?? 0;
    if (until && performance.now() < until) return;
    const path = e.composedPath();
    if (pathIncludes(path, host)) return;
    if (options.ignoreNodes) {
      for (const n of options.ignoreNodes()) {
        if (pathIncludes(path, n)) return;
      }
    }
    const sels =
      typeof options.ignoreSelectors === 'function'
        ? options.ignoreSelectors()
        : (options.ignoreSelectors ?? '');
    if (sels && pathMatches(path, sels)) return;
    options.onDismiss(e);
  };

  document.addEventListener('pointerdown', onPointer, capture);
  return {
    detach: () => document.removeEventListener('pointerdown', onPointer, capture),
  };
}