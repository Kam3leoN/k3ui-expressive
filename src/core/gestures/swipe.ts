import {
  allowsPointer,
  localPoint,
  now,
  parseFactoryArgs,
  type GestureDetail,
  type GestureListener,
  type GestureOptions,
  type GestureRecognizer,
  type SwipeDirection,
} from './types.js';

export interface SwipeGestureOptions extends GestureOptions {
  pointers?: number;
  startThreshold?: number;
  minVelocity?: number;
  directions?: SwipeDirection[];
  directionThreshold?: number;
  minDisplacement?: number;
}

export interface SwipeGestureDetail extends GestureDetail {
  direction: SwipeDirection;
  axis: 'x' | 'y';
  startClientX: number;
  startClientY: number;
  startLocalX: number;
  startLocalY: number;
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  displacement: number;
  duration: number;
}

function resolveDir(dx: number, dy: number): SwipeDirection {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export function swipe(): GestureRecognizer<SwipeGestureDetail>;
export function swipe(listener: GestureListener<SwipeGestureDetail>): GestureRecognizer<SwipeGestureDetail>;
export function swipe(options: Partial<SwipeGestureOptions>): GestureRecognizer<SwipeGestureDetail>;
export function swipe(
  listener: GestureListener<SwipeGestureDetail>,
  options: Partial<SwipeGestureOptions>,
): GestureRecognizer<SwipeGestureDetail>;
export function swipe(
  a?: GestureListener<SwipeGestureDetail> | Partial<SwipeGestureOptions>,
  b?: Partial<SwipeGestureOptions>,
): GestureRecognizer<SwipeGestureDetail> {
  const { listener, options } = parseFactoryArgs<SwipeGestureOptions, SwipeGestureDetail>(a, b);
  const startThreshold = options.startThreshold ?? 4;
  const minVelocity = options.minVelocity ?? 0.3;
  const directions = options.directions ?? (['left', 'right', 'up', 'down'] as SwipeDirection[]);
  const minDisplacement = options.minDisplacement ?? 24;
  const priority = options.priority ?? 1;

  return {
    name: 'swipe',
    priority,
    listener,
    bind(el, emit) {
      let pid: number | null = null;
      let sx = 0;
      let sy = 0;
      let t0 = 0;
      let lastT = 0;
      let lastX = 0;
      let lastY = 0;
      let active = false;

      const onDown = (e: PointerEvent) => {
        if (pid != null || !allowsPointer(options, e)) return;
        pid = e.pointerId;
        sx = lastX = e.clientX;
        sy = lastY = e.clientY;
        t0 = lastT = now(e);
        active = false;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        const loc = localPoint(el, sx, sy);
        emit({
          gestureName: 'swipe',
          phase: 'start',
          inputId: e.pointerId,
          timestamp: now(e),
          direction: 'right',
          axis: 'x',
          startClientX: sx,
          startClientY: sy,
          startLocalX: loc.localX,
          startLocalY: loc.localY,
          translationX: 0,
          translationY: 0,
          velocityX: 0,
          velocityY: 0,
          speed: 0,
          displacement: 0,
          duration: 0,
        });
      };

      const sample = (e: PointerEvent) => {
        const tx = e.clientX - sx;
        const ty = e.clientY - sy;
        const dt = Math.max(1, now(e) - lastT);
        const vx = (e.clientX - lastX) / dt;
        const vy = (e.clientY - lastY) / dt;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now(e);
        const disp = Math.hypot(tx, ty);
        const dir = resolveDir(tx, ty);
        const axis: 'x' | 'y' = Math.abs(tx) >= Math.abs(ty) ? 'x' : 'y';
        const loc = localPoint(el, sx, sy);
        return {
          gestureName: 'swipe' as const,
          inputId: e.pointerId,
          timestamp: now(e),
          direction: dir,
          axis,
          startClientX: sx,
          startClientY: sy,
          startLocalX: loc.localX,
          startLocalY: loc.localY,
          translationX: tx,
          translationY: ty,
          velocityX: vx,
          velocityY: vy,
          speed: Math.hypot(vx, vy),
          displacement: disp,
          duration: now(e) - t0,
        };
      };

      const onMove = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        const s = sample(e);
        if (!active && s.displacement >= startThreshold) active = true;
        if (active) emit({ ...s, phase: 'update' });
      };

      const onUp = (e: PointerEvent) => {
        if (pid !== e.pointerId) return;
        const s = sample(e);
        const ok =
          active &&
          s.displacement >= minDisplacement &&
          s.speed >= minVelocity &&
          directions.includes(s.direction);
        emit({ ...s, phase: ok ? 'end' : 'cancel' });
        pid = null;
        active = false;
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