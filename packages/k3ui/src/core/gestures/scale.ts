import {
  allowsPointer,
  now,
  parseFactoryArgs,
  type GestureDetail,
  type GestureListener,
  type GestureOptions,
  type GestureRecognizer,
} from './types.js';

export interface ScaleGestureOptions extends GestureOptions {
  pointers?: number;
  minDisplacement?: number;
  maxPressInterval?: number;
}

export interface ScaleGestureDetail extends GestureDetail {
  initialDistance: number;
  currentDistance: number;
  scale: number;
  scaleDelta: number;
  scaleVelocity: number;
}

export function scale(): GestureRecognizer<ScaleGestureDetail>;
export function scale(
  listener: GestureListener<ScaleGestureDetail>,
): GestureRecognizer<ScaleGestureDetail>;
export function scale(options: Partial<ScaleGestureOptions>): GestureRecognizer<ScaleGestureDetail>;
export function scale(
  listener: GestureListener<ScaleGestureDetail>,
  options: Partial<ScaleGestureOptions>,
): GestureRecognizer<ScaleGestureDetail>;
export function scale(
  a?: GestureListener<ScaleGestureDetail> | Partial<ScaleGestureOptions>,
  b?: Partial<ScaleGestureOptions>,
): GestureRecognizer<ScaleGestureDetail> {
  const { listener, options } = parseFactoryArgs<ScaleGestureOptions, ScaleGestureDetail>(a, b);
  const need = options.pointers ?? 2;
  const priority = options.priority ?? 1;

  return {
    name: 'scale',
    priority,
    listener,
    bind(el, emit) {
      const pts = new Map<number, { x: number; y: number }>();
      let initialDistance = 0;
      let prevScale = 1;
      let prevT = 0;
      let active = false;

      const avgDist = () => {
        if (pts.size < 2) return 0;
        const arr = [...pts.values()];
        let cx = 0;
        let cy = 0;
        for (const p of arr) {
          cx += p.x;
          cy += p.y;
        }
        cx /= arr.length;
        cy /= arr.length;
        let d = 0;
        for (const p of arr) d += Math.hypot(p.x - cx, p.y - cy);
        return d / arr.length;
      };

      const fire = (phase: ScaleGestureDetail['phase'], e: PointerEvent) => {
        const cur = avgDist();
        const s = initialDistance > 0 ? cur / initialDistance : 1;
        const delta = s - prevScale;
        const dt = Math.max(1, now(e) - prevT);
        emit({
          gestureName: 'scale',
          phase,
          inputId: [...pts.keys()],
          timestamp: now(e),
          initialDistance,
          currentDistance: cur,
          scale: s,
          scaleDelta: delta,
          scaleVelocity: delta / dt,
        });
        prevScale = s;
        prevT = now(e);
      };

      const onDown = (e: PointerEvent) => {
        if (!allowsPointer(options, e)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        if (pts.size >= need && !active) {
          active = true;
          initialDistance = Math.max(1, avgDist());
          prevScale = 1;
          prevT = now(e);
          fire('start', e);
        }
      };

      const onMove = (e: PointerEvent) => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (active && pts.size >= need) fire('update', e);
      };

      const onUp = (e: PointerEvent) => {
        if (!pts.has(e.pointerId)) return;
        pts.delete(e.pointerId);
        if (active && pts.size < need) {
          fire('end', e);
          active = false;
        }
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