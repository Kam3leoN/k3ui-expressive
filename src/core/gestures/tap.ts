import {
  allowsPointer,
  localPoint,
  now,
  parseFactoryArgs,
  type GestureListener,
  type GestureOptions,
  type GestureRecognizer,
  type GestureDetail,
} from './types.js';

export interface TapGestureOptions extends GestureOptions {
  pointers?: number;
  maxDuration?: number;
  maxDisplacement?: number;
}

export interface TapGestureDetail extends GestureDetail {
  clientX: number;
  clientY: number;
  localX: number;
  localY: number;
  duration: number;
}

export function tap(): GestureRecognizer<TapGestureDetail>;
export function tap(listener: GestureListener<TapGestureDetail>): GestureRecognizer<TapGestureDetail>;
export function tap(options: Partial<TapGestureOptions>): GestureRecognizer<TapGestureDetail>;
export function tap(
  listener: GestureListener<TapGestureDetail>,
  options: Partial<TapGestureOptions>,
): GestureRecognizer<TapGestureDetail>;
export function tap(
  a?: GestureListener<TapGestureDetail> | Partial<TapGestureOptions>,
  b?: Partial<TapGestureOptions>,
): GestureRecognizer<TapGestureDetail> {
  const { listener, options } = parseFactoryArgs<TapGestureOptions, TapGestureDetail>(a, b);
  const maxDuration = options.maxDuration ?? 180;
  const maxDisplacement = options.maxDisplacement ?? 12;
  const priority = options.priority ?? 1;

  return {
    name: 'tap',
    priority,
    listener,
    bind(el, emit) {
      let pid: number | null = null;
      let sx = 0;
      let sy = 0;
      let t0 = 0;
      let started = false;

      const fire = (phase: TapGestureDetail['phase'], e: PointerEvent) => {
        const loc = localPoint(el, sx, sy);
        const detail: TapGestureDetail = {
          gestureName: 'tap',
          phase,
          inputId: e.pointerId,
          timestamp: now(e),
          clientX: sx,
          clientY: sy,
          localX: loc.localX,
          localY: loc.localY,
          duration: now(e) - t0,
        };
        emit(detail);
      };

      const onDown = (e: PointerEvent) => {
        if (pid != null || !allowsPointer(options, e)) return;
        pid = e.pointerId;
        sx = e.clientX;
        sy = e.clientY;
        t0 = now(e);
        started = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        fire('start', e);
      };

      const onMove = (e: PointerEvent) => {
        if (pid !== e.pointerId || !started) return;
        const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (dist > maxDisplacement || now(e) - t0 > maxDuration) {
          fire('cancel', e);
          started = false;
          pid = null;
        }
      };

      const onUp = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        if (started) {
          const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
          const dur = now(e) - t0;
          if (dist <= maxDisplacement && dur <= maxDuration) fire('end', e);
          else fire('cancel', e);
        }
        started = false;
        pid = null;
      };

      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      return () => {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
      };
    },
  };
}