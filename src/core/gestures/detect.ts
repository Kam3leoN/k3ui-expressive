import type { GestureController, GestureRecognizer } from './types.js';

/**
 * Bind one or more recognizers to an element (M3E `detectGesture`).
 *
 * ```ts
 * const ctrl = detectGesture(
 *   el,
 *   tap(phase({ onEnd: (d) => console.log('tap', d) })),
 *   swipe(phase({ onEnd: (d) => console.log(d.direction) })),
 * );
 * // later: ctrl.destroy();
 * ```
 */
export function detectGesture(
  element: HTMLElement,
  ...recognizers: readonly GestureRecognizer[]
): GestureController {
  const sorted = [...recognizers].sort((a, b) => b.priority - a.priority);
  let disabled = false;
  const unbinds = sorted.map((r) =>
    r.bind(element, (detail) => {
      if (!disabled) r.listener(detail);
    }),
  );

  return {
    get disabled() {
      return disabled;
    },
    set disabled(v: boolean) {
      disabled = v;
    },
    destroy() {
      disabled = true;
      for (const u of unbinds) u();
      unbinds.length = 0;
    },
  };
}