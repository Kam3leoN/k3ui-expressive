import {
  allowsPointer,
  localPoint,
  now,
  parseFactoryArgs,
  type GestureDetail,
  type GestureListener,
  type GestureOptions,
  type GestureRecognizer,
} from './types.js';

export interface LongPressGestureOptions extends GestureOptions {
  pointers?: number;
  /** Continuous (default): start on down, end after minDuration. Discrete: start after minDuration, end on up. */
  discrete?: boolean;
  minDuration?: number;
  maxDisplacement?: number;
}

export interface LongPressGestureDetail extends GestureDetail {
  clientX: number;
  clientY: number;
  localX: number;
  localY: number;
  duration: number;
}

export function longPress(): GestureRecognizer<LongPressGestureDetail>;
export function longPress(
  listener: GestureListener<LongPressGestureDetail>,
): GestureRecognizer<LongPressGestureDetail>;
export function longPress(
  options: Partial<LongPressGestureOptions>,
): GestureRecognizer<LongPressGestureDetail>;
export function longPress(
  listener: GestureListener<LongPressGestureDetail>,
  options: Partial<LongPressGestureOptions>,
): GestureRecognizer<LongPressGestureDetail>;
export function longPress(
  a?: GestureListener<LongPressGestureDetail> | Partial<LongPressGestureOptions>,
  b?: Partial<LongPressGestureOptions>,
): GestureRecognizer<LongPressGestureDetail> {
  const { listener, options } = parseFactoryArgs<LongPressGestureOptions, LongPressGestureDetail>(
    a,
    b,
  );
  const minDuration = options.minDuration ?? 500;
  const maxDisplacement = options.maxDisplacement ?? 12;
  const discrete = options.discrete ?? false;
  const priority = options.priority ?? 1;

  return {
    name: 'long-press',
    priority,
    listener,
    bind(el, emit) {
      let pid: number | null = null;
      let sx = 0;
      let sy = 0;
      let t0 = 0;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let started = false;
      let completed = false;

      const detail = (phase: LongPressGestureDetail['phase'], e: PointerEvent): LongPressGestureDetail => {
        const loc = localPoint(el, sx, sy);
        return {
          gestureName: 'long-press',
          phase,
          inputId: e.pointerId,
          timestamp: now(e),
          clientX: sx,
          clientY: sy,
          localX: loc.localX,
          localY: loc.localY,
          duration: now(e) - t0,
        };
      };

      const clear = () => {
        if (timer != null) clearTimeout(timer);
        timer = null;
      };

      const cancel = (e: PointerEvent) => {
        if (!started && discrete) {
          /* silent cancel before start */
        } else if (started && !completed) {
          emit(detail('cancel', e));
        }
        clear();
        started = false;
        completed = false;
        pid = null;
      };

      const onDown = (e: PointerEvent) => {
        if (pid != null || !allowsPointer(options, e)) return;
        pid = e.pointerId;
        sx = e.clientX;
        sy = e.clientY;
        t0 = now(e);
        completed = false;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }

        if (!discrete) {
          started = true;
          emit(detail('start', e));
        }

        timer = setTimeout(() => {
          if (pid == null) return;
          if (discrete) {
            started = true;
            emit(
              detail('start', {
                pointerId: pid,
                timeStamp: performance.now(),
                clientX: sx,
                clientY: sy,
              } as PointerEvent),
            );
          } else {
            completed = true;
            emit(
              detail('end', {
                pointerId: pid,
                timeStamp: performance.now(),
                clientX: sx,
                clientY: sy,
              } as PointerEvent),
            );
          }
        }, minDuration);
      };

      const onMove = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > maxDisplacement) cancel(e);
      };

      const onUp = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        if (discrete && started && !completed) {
          completed = true;
          emit(detail('end', e));
          clear();
          started = false;
          pid = null;
          return;
        }
        if (!completed) cancel(e);
        else {
          clear();
          started = false;
          pid = null;
        }
      };

      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      return () => {
        clear();
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
      };
    },
  };
}