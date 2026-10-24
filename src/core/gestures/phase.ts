import type { GestureDetail, GestureListener, GesturePhaseHandlers } from './types.js';

/**
 * Dispatch gesture detail to phase-specific handlers (M3E-compatible).
 *
 * ```ts
 * detectGesture(el, tap(phase({ onEnd: (d) => ... })));
 * ```
 */
export function phase<T extends GestureDetail>(
  handlers: GesturePhaseHandlers<T>,
): GestureListener<T> {
  return (detail) => {
    switch (detail.phase) {
      case 'start':
        handlers.onStart?.(detail);
        break;
      case 'update':
        handlers.onUpdate?.(detail);
        break;
      case 'end':
        handlers.onEnd?.(detail);
        break;
      case 'cancel':
        handlers.onCancel?.(detail);
        break;
    }
  };
}