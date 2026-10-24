/**
 * Serialize overlapping async show/hide so motions cannot fight.
 */

export interface MotionGate {
  enqueue<T>(run: () => Promise<T>): Promise<T>;
  clear(): void;
}

/** Create a FIFO promise gate (menu open/close, etc.). */
export function createMotionGate(): MotionGate {
  let gate: Promise<unknown> = Promise.resolve();

  return {
    enqueue<T>(run: () => Promise<T>): Promise<T> {
      const next = gate.then(run, run);
      gate = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    },
    clear(): void {
      gate = Promise.resolve();
    },
  };
}