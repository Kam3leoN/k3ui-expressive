import type {
  GestureDetail,
  GestureListener,
  GestureOptions,
  GestureRecognizer,
} from './types.js';

export interface SequenceGestureOptions extends GestureOptions {
  /** Max ms between steps — default 250. Use 0 to disable the timeout. */
  maxInterval?: number;
}

export interface SequenceGestureDetail extends GestureDetail {
  details: GestureDetail[];
}

/**
 * Ordered chain of recognizers (M3E sequence).
 * Only the active step is bound — avoids competing pointer handlers.
 */
export function sequence(
  optionsOrFirst: Partial<SequenceGestureOptions> | GestureRecognizer,
  ...rest: GestureRecognizer[]
): GestureRecognizer<SequenceGestureDetail> {
  let options: Partial<SequenceGestureOptions> = {};
  let steps: GestureRecognizer[];

  if (optionsOrFirst && 'bind' in optionsOrFirst) {
    steps = [optionsOrFirst, ...rest];
  } else {
    options = optionsOrFirst as Partial<SequenceGestureOptions>;
    steps = rest;
  }

  if (steps.length < 1) {
    throw new Error('sequence() requires at least one recognizer');
  }

  const maxInterval = options.maxInterval ?? 250;
  const priority = options.priority ?? Math.max(...steps.map((s) => s.priority));

  return {
    name: 'sequence',
    priority,
    listener: () => undefined,
    bind(el, emit) {
      let index = 0;
      const collected: GestureDetail[] = [];
      let unbindStep: (() => void) | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const clearTimer = () => {
        if (timer != null) clearTimeout(timer);
        timer = null;
      };

      const reset = () => {
        index = 0;
        collected.length = 0;
        clearTimer();
        arm(0);
      };

      const arm = (i: number) => {
        unbindStep?.();
        unbindStep = null;
        const rec = steps[i]!;
        unbindStep = rec.bind(el, (d) => {
          rec.listener(d);
          if (d.phase === 'cancel' && collected.length) {
            emit({
              gestureName: 'sequence',
              phase: 'cancel',
              inputId: d.inputId,
              timestamp: d.timestamp,
              details: [...collected],
            });
            reset();
            return;
          }
          if (d.phase !== 'end') return;

          collected.push(d);

          if (collected.length === 1) {
            emit({
              gestureName: 'sequence',
              phase: 'start',
              inputId: d.inputId,
              timestamp: d.timestamp,
              details: [...collected],
            });
          } else if (i < steps.length - 1) {
            emit({
              gestureName: 'sequence',
              phase: 'update',
              inputId: d.inputId,
              timestamp: d.timestamp,
              details: [...collected],
            });
          }

          if (i >= steps.length - 1) {
            emit({
              gestureName: 'sequence',
              phase: 'end',
              inputId: d.inputId,
              timestamp: d.timestamp,
              details: [...collected],
            });
            index = 0;
            collected.length = 0;
            clearTimer();
            arm(0);
            return;
          }

          index = i + 1;
          clearTimer();
          if (maxInterval > 0) {
            timer = setTimeout(() => {
              emit({
                gestureName: 'sequence',
                phase: 'cancel',
                inputId: d.inputId,
                timestamp: performance.now(),
                details: [...collected],
              });
              reset();
            }, maxInterval);
          }
          arm(index);
        });
      };

      arm(0);

      return () => {
        clearTimer();
        unbindStep?.();
        unbindStep = null;
      };
    },
  };
}

/** Attach a phase listener to a sequence recognizer. */
export function sequenceWithListener(
  listener: GestureListener<SequenceGestureDetail>,
  optionsOrFirst: Partial<SequenceGestureOptions> | GestureRecognizer,
  ...rest: GestureRecognizer[]
): GestureRecognizer<SequenceGestureDetail> {
  const rec = sequence(optionsOrFirst, ...rest);
  return { ...rec, listener };
}