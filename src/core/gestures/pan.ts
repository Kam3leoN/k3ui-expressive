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

export interface PanGestureOptions extends GestureOptions {
  pointers?: number;
  activationMode?: 'press' | 'move';
  minDisplacement?: number;
  lockAxis?: 'none' | 'x' | 'y' | 'auto';
  axisThreshold?: number;
}

export interface PanGestureDetail extends GestureDetail {
  startClientX: number;
  startClientY: number;
  startLocalX: number;
  startLocalY: number;
  clientX: number;
  clientY: number;
  localX: number;
  localY: number;
  deltaX: number;
  deltaY: number;
  displacement: number;
  totalDeltaX: number;
  totalDeltaY: number;
  totalDisplacement: number;
  axis: 'x' | 'y' | '';
  velocityX: number;
  velocityY: number;
  directionX: -1 | 0 | 1;
  directionY: -1 | 0 | 1;
  speed: number;
  angle: number;
  duration: number;
  deltaTime: number;
}

export function pan(): GestureRecognizer<PanGestureDetail>;
export function pan(listener: GestureListener<PanGestureDetail>): GestureRecognizer<PanGestureDetail>;
export function pan(options: Partial<PanGestureOptions>): GestureRecognizer<PanGestureDetail>;
export function pan(
  listener: GestureListener<PanGestureDetail>,
  options: Partial<PanGestureOptions>,
): GestureRecognizer<PanGestureDetail>;
export function pan(
  a?: GestureListener<PanGestureDetail> | Partial<PanGestureOptions>,
  b?: Partial<PanGestureOptions>,
): GestureRecognizer<PanGestureDetail> {
  const { listener, options } = parseFactoryArgs<PanGestureOptions, PanGestureDetail>(a, b);
  const activationMode = options.activationMode ?? 'press';
  const minDisplacement = options.minDisplacement ?? 4;
  const lockAxis = options.lockAxis ?? 'none';
  const axisThreshold = options.axisThreshold ?? 8;
  const priority = options.priority ?? 1;

  return {
    name: 'pan',
    priority,
    listener,
    bind(el, emit) {
      let pid: number | null = null;
      let sx = 0;
      let sy = 0;
      let prevX = 0;
      let prevY = 0;
      let prevT = 0;
      let t0 = 0;
      let active = false;
      let axis: 'x' | 'y' | '' = '';

      const build = (e: PointerEvent, phase: PanGestureDetail['phase']): PanGestureDetail => {
        let dx = e.clientX - prevX;
        let dy = e.clientY - prevY;
        let tdx = e.clientX - sx;
        let tdy = e.clientY - sy;
        if (axis === 'x' || lockAxis === 'x') {
          dy = 0;
          tdy = 0;
        }
        if (axis === 'y' || lockAxis === 'y') {
          dx = 0;
          tdx = 0;
        }
        const dt = Math.max(1, now(e) - prevT);
        const vx = dx / dt;
        const vy = dy / dt;
        const startLoc = localPoint(el, sx, sy);
        const loc = localPoint(el, e.clientX, e.clientY);
        const sign = (n: number): -1 | 0 | 1 => (n < 0 ? -1 : n > 0 ? 1 : 0);
        return {
          gestureName: 'pan',
          phase,
          inputId: e.pointerId,
          timestamp: now(e),
          startClientX: sx,
          startClientY: sy,
          startLocalX: startLoc.localX,
          startLocalY: startLoc.localY,
          clientX: e.clientX,
          clientY: e.clientY,
          localX: loc.localX,
          localY: loc.localY,
          deltaX: dx,
          deltaY: dy,
          displacement: Math.hypot(dx, dy),
          totalDeltaX: tdx,
          totalDeltaY: tdy,
          totalDisplacement: Math.hypot(tdx, tdy),
          axis,
          velocityX: vx,
          velocityY: vy,
          directionX: sign(tdx),
          directionY: sign(tdy),
          speed: Math.hypot(vx, vy),
          angle: Math.atan2(tdy, tdx),
          duration: now(e) - t0,
          deltaTime: dt,
        };
      };

      const onDown = (e: PointerEvent) => {
        if (pid != null || !allowsPointer(options, e)) return;
        pid = e.pointerId;
        sx = prevX = e.clientX;
        sy = prevY = e.clientY;
        t0 = prevT = now(e);
        active = activationMode === 'press';
        axis = lockAxis === 'x' || lockAxis === 'y' ? lockAxis : '';
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        if (active) emit(build(e, 'start'));
      };

      const onMove = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        const dist = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (!active) {
          if (dist < minDisplacement) return;
          active = true;
          if (lockAxis === 'auto' && dist >= axisThreshold) {
            axis = Math.abs(e.clientX - sx) >= Math.abs(e.clientY - sy) ? 'x' : 'y';
          }
          emit(build(e, 'start'));
        } else if (lockAxis === 'auto' && !axis && dist >= axisThreshold) {
          axis = Math.abs(e.clientX - sx) >= Math.abs(e.clientY - sy) ? 'x' : 'y';
        }
        const d = build(e, 'update');
        prevX = e.clientX;
        prevY = e.clientY;
        prevT = now(e);
        emit(d);
      };

      const onUp = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        emit(build(e, active ? 'end' : 'cancel'));
        pid = null;
        active = false;
        axis = '';
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