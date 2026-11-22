import type {
  GestureDetail,
  GestureListener,
  GestureOptions,
  GestureRecognizer,
} from './types.js';
import { parseFactoryArgs } from './types.js';

export interface RepeatGestureOptions extends GestureOptions {
  /** Required consecutive completions — default 2 (double). */
  count?: number;
  /** Max ms between nested gesture ends — default 250. */
  maxInterval?: number;
}

export interface RepeatGestureDetail extends GestureDetail {
  details: GestureDetail[];
}

/**
 * Repeat a nested recognizer N times within maxInterval (M3E triple-tap pattern).
 *
 * ```ts
 * detectGesture(el, repeat(phase({ onEnd }), { count: 3, maxInterval: 350 }, tap()));
 * ```
 */
export function repeat(
  listenerOrOpts: GestureListener<RepeatGestureDetail> | Partial<RepeatGestureOptions>,
  optsOrNested?: Partial<RepeatGestureOptions> | GestureRecognizer,
  nested?: GestureRecognizer,
): GestureRecognizer<RepeatGestureDetail> {
  let listener: GestureListener<RepeatGestureDetail>;
  let options: Partial<RepeatGestureOptions>;
  let inner: GestureRecognizer;

  if (typeof listenerOrOpts === 'function') {
    listener = listenerOrOpts;
    if (optsOrNested && 'bind' in optsOrNested) {
      options = {};
      inner = optsOrNested;
    } else {
      options = (optsOrNested as Partial<RepeatGestureOptions>) ?? {};
      inner = nested!;
    }
  } else {
    /* repeat(opts, nested) — less common */
    const parsed = parseFactoryArgs<RepeatGestureOptions, RepeatGestureDetail>(
      listenerOrOpts,
      typeof optsOrNested === 'object' && optsOrNested && !('bind' in optsOrNested)
        ? (optsOrNested as Partial<RepeatGestureOptions>)
        : undefined,
    );
    listener = parsed.listener;
    options = parsed.options;
    inner =
      nested ??
      (optsOrNested && 'bind' in optsOrNested
        ? optsOrNested
        : (undefined as unknown as GestureRecognizer));
  }

  if (!inner) {
    throw new Error('repeat() requires a nested GestureRecognizer');
  }

  const count = options.count ?? 2;
  const maxInterval = options.maxInterval ?? 250;
  const priority = options.priority ?? inner.priority;

  return {
    name: 'repeat',
    priority,
    listener,
    bind(el, emit) {
      const collected: GestureDetail[] = [];
      let lastEnd = 0;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const reset = () => {
        collected.length = 0;
        if (timer != null) clearTimeout(timer);
        timer = null;
      };

      const unbind = inner.bind(el, (d) => {
        if (d.phase !== 'end') return;
        const t = d.timestamp;
        if (collected.length && t - lastEnd > maxInterval) {
          emit({
            gestureName: 'repeat',
            phase: 'cancel',
            inputId: d.inputId,
            timestamp: t,
            details: [...collected],
          });
          reset();
        }

        collected.push(d);
        lastEnd = t;

        if (collected.length === 1) {
          emit({
            gestureName: 'repeat',
            phase: 'start',
            inputId: d.inputId,
            timestamp: t,
            details: [...collected],
          });
        } else if (collected.length < count) {
          emit({
            gestureName: 'repeat',
            phase: 'update',
            inputId: d.inputId,
            timestamp: t,
            details: [...collected],
          });
        }

        if (timer != null) clearTimeout(timer);
        timer = setTimeout(() => {
          if (collected.length > 0 && collected.length < count) {
            emit({
              gestureName: 'repeat',
              phase: 'cancel',
              inputId: collected[collected.length - 1]!.inputId,
              timestamp: performance.now(),
              details: [...collected],
            });
          }
          reset();
        }, maxInterval);

        if (collected.length >= count) {
          emit({
            gestureName: 'repeat',
            phase: 'end',
            inputId: d.inputId,
            timestamp: t,
            details: [...collected],
          });
          reset();
        }
      });

      return () => {
        reset();
        unbind();
      };
    },
  };
}