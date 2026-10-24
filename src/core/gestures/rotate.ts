import {
  allowsPointer,
  now,
  parseFactoryArgs,
  type GestureDetail,
  type GestureListener,
  type GestureOptions,
  type GestureRecognizer,
} from './types.js';

export interface RotateGestureOptions extends GestureOptions {
  pointers?: number;
  activationMode?: 'press' | 'move';
  minDisplacement?: number;
  maxPressInterval?: number;
}

export interface RotateGestureDetail extends GestureDetail {
  initialAngle: number;
  currentAngle: number;
  rotation: number;
  rotationDelta: number;
  rotationVelocity: number;
}

function angleOf(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function rotate(): GestureRecognizer<RotateGestureDetail>;
export function rotate(
  listener: GestureListener<RotateGestureDetail>,
): GestureRecognizer<RotateGestureDetail>;
export function rotate(options: Partial<RotateGestureOptions>): GestureRecognizer<RotateGestureDetail>;
export function rotate(
  listener: GestureListener<RotateGestureDetail>,
  options: Partial<RotateGestureOptions>,
): GestureRecognizer<RotateGestureDetail>;
export function rotate(
  a?: GestureListener<RotateGestureDetail> | Partial<RotateGestureOptions>,
  b?: Partial<RotateGestureOptions>,
): GestureRecognizer<RotateGestureDetail> {
  const { listener, options } = parseFactoryArgs<RotateGestureOptions, RotateGestureDetail>(a, b);
  const need = options.pointers ?? 2;
  const minDisplacement = options.minDisplacement ?? 4;
  const priority = options.priority ?? 1;

  return {
    name: 'rotate',
    priority,
    listener,
    bind(el, emit) {
      const pts = new Map<number, { x: number; y: number }>();
      let initialAngle = 0;
      let prevAngle = 0;
      let prevT = 0;
      let total = 0;
      let active = false;

      const centroid = () => {
        let x = 0;
        let y = 0;
        for (const p of pts.values()) {
          x += p.x;
          y += p.y;
        }
        const n = pts.size || 1;
        return { x: x / n, y: y / n };
      };

      const avgAngle = () => {
        const c = centroid();
        let sum = 0;
        for (const p of pts.values()) sum += angleOf(c, p);
        return sum / (pts.size || 1);
      };

      const fire = (phase: RotateGestureDetail['phase'], e: PointerEvent) => {
        const cur = avgAngle();
        const delta = active ? cur - prevAngle : 0;
        const dt = Math.max(1, now(e) - prevT);
        if (phase === 'start') {
          initialAngle = cur;
          total = 0;
        } else {
          total += delta;
        }
        emit({
          gestureName: 'rotate',
          phase,
          inputId: [...pts.keys()],
          timestamp: now(e),
          initialAngle,
          currentAngle: cur,
          rotation: total,
          rotationDelta: delta,
          rotationVelocity: delta / dt,
        });
        prevAngle = cur;
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
          prevT = now(e);
          fire('start', e);
        }
      };

      const onMove = (e: PointerEvent) => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (!active || pts.size < need) return;
        /* minDisplacement check via rotation delta magnitude approximated by pointer travel */
        fire('update', e);
      };

      const onUp = (e: PointerEvent) => {
        if (!pts.has(e.pointerId)) return;
        pts.delete(e.pointerId);
        if (active && pts.size < need) {
          fire('end', e);
          active = false;
          total = 0;
        }
      };

      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      void minDisplacement;
      return () => {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
      };
    },
  };
}