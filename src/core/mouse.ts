/**
 * Mouse utility — button press/release, move, click, dblclick, wheel, drag.
 *
 * Button ids: `left` · `middle` · `right` · `back` · `forward`
 */

export type MouseButton = 'left' | 'middle' | 'right' | 'back' | 'forward';

export type MousePhase =
  | 'down'
  | 'up'
  | 'move'
  | 'click'
  | 'dblclick'
  | 'wheel'
  | 'enter'
  | 'leave'
  | 'dragstart'
  | 'drag'
  | 'dragend';

export interface MousePoint {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export interface MouseDetail extends MousePoint {
  phase: MousePhase;
  button: MouseButton | null;
  buttons: ReadonlySet<MouseButton>;
  /** Delta since last move / drag (client coords). */
  dx: number;
  dy: number;
  /** Total delta since dragstart (client coords). */
  totalX: number;
  totalY: number;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  /** Wheel deltas (wheel phase). */
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  event: MouseEvent | WheelEvent | PointerEvent;
}

export interface AttachMouseOptions {
  /** Prefer Pointer Events when available (default true). */
  pointer?: boolean;
  /** Movement threshold before dragstart (px). Default 4. */
  dragThreshold?: number;
  /** Capture pointer on down (default true). */
  capture?: boolean;
  /** When false, ignore events. */
  enabled?: () => boolean;
  /** Prevent context menu on right button (default false). */
  preventContextMenu?: boolean;
}

type MouseHandler = (detail: MouseDetail) => void;

const BUTTON_MAP: Record<number, MouseButton> = {
  0: 'left',
  1: 'middle',
  2: 'right',
  3: 'back',
  4: 'forward',
};

/** Map MouseEvent.button → MouseButton. */
export function normalizeMouseButton(button: number): MouseButton | null {
  return BUTTON_MAP[button] ?? null;
}

/** Decode MouseEvent.buttons bitfield into a set. */
export function buttonsFromBitfield(bits: number): Set<MouseButton> {
  const out = new Set<MouseButton>();
  if (bits & 1) out.add('left');
  if (bits & 2) out.add('right');
  if (bits & 4) out.add('middle');
  if (bits & 8) out.add('back');
  if (bits & 16) out.add('forward');
  return out;
}

export interface MouseController {
  readonly x: number;
  readonly y: number;
  readonly buttons: ReadonlySet<MouseButton>;
  readonly dragging: boolean;
  isDown(button?: MouseButton): boolean;
  on(type: MousePhase, handler: MouseHandler): () => void;
  destroy(): void;
}

/**
 * Attach mouse / pointer tracking to an element (or document).
 */
export function attachMouse(
  target: Document | HTMLElement = document,
  options: AttachMouseOptions = {},
): MouseController {
  const usePointer = options.pointer !== false && typeof PointerEvent !== 'undefined';
  const threshold = options.dragThreshold ?? 4;
  const capture = options.capture !== false;
  const enabled = options.enabled ?? (() => true);
  const buttons = new Set<MouseButton>();
  const handlers = new Map<MousePhase, Set<MouseHandler>>();

  let x = 0;
  let y = 0;
  let lastX = 0;
  let lastY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let dragging = false;
  let dragArmed = false;
  let activeButton: MouseButton | null = null;
  let pointerId: number | null = null;

  const emit = (
    phase: MousePhase,
    e: MouseEvent | WheelEvent | PointerEvent,
    extra: Partial<MouseDetail> = {},
  ) => {
    const set = handlers.get(phase);
    if (!set?.size) return;
    const btn =
      extra.button !== undefined
        ? extra.button
        : 'button' in e
          ? normalizeMouseButton((e as MouseEvent).button)
          : null;
    const detail: MouseDetail = {
      phase,
      button: btn,
      buttons,
      x,
      y,
      clientX: 'clientX' in e ? e.clientX : x,
      clientY: 'clientY' in e ? e.clientY : y,
      pageX: 'pageX' in e ? e.pageX : x,
      pageY: 'pageY' in e ? e.pageY : y,
      dx: x - lastX,
      dy: y - lastY,
      totalX: dragging || phase.startsWith('drag') ? x - dragOriginX : 0,
      totalY: dragging || phase.startsWith('drag') ? y - dragOriginY : 0,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      deltaX: 0,
      deltaY: 0,
      deltaZ: 0,
      event: e,
      ...extra,
    };
    for (const h of set) h(detail);
  };

  const trackPos = (e: { clientX: number; clientY: number }) => {
    lastX = x;
    lastY = y;
    x = e.clientX;
    y = e.clientY;
  };

  const onDown = (e: PointerEvent | MouseEvent) => {
    if (!enabled()) return;
    if ('pointerType' in e && e.pointerType === 'touch') {
      /* Still allow — mouse util tracks any pointer as “mouse-like” */
    }
    const btn = normalizeMouseButton(e.button);
    if (btn) buttons.add(btn);
    activeButton = btn;
    trackPos(e);
    dragArmed = true;
    dragging = false;
    dragOriginX = e.clientX;
    dragOriginY = e.clientY;
    if (capture && 'pointerId' in e && target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
        pointerId = e.pointerId;
      } catch {
        /* ignore */
      }
    }
    emit('down', e, { button: btn, dx: 0, dy: 0 });
  };

  const onMove = (e: PointerEvent | MouseEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('move', e);
    if (!dragArmed || dragging) {
      if (dragging) emit('drag', e);
      return;
    }
    const dist = Math.hypot(e.clientX - dragOriginX, e.clientY - dragOriginY);
    if (dist >= threshold) {
      dragging = true;
      emit('dragstart', e, {
        dx: e.clientX - dragOriginX,
        dy: e.clientY - dragOriginY,
        totalX: e.clientX - dragOriginX,
        totalY: e.clientY - dragOriginY,
      });
      emit('drag', e);
    }
  };

  const onUp = (e: PointerEvent | MouseEvent) => {
    if (!enabled()) return;
    const btn = normalizeMouseButton(e.button);
    if (btn) buttons.delete(btn);
    trackPos(e);
    if (dragging) {
      emit('dragend', e);
    }
    emit('up', e, { button: btn });
    dragging = false;
    dragArmed = false;
    activeButton = null;
    if (
      pointerId != null &&
      'pointerId' in e &&
      target instanceof HTMLElement
    ) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      pointerId = null;
    }
  };

  const onClick = (e: MouseEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('click', e, { button: normalizeMouseButton(e.button) });
  };

  const onDblClick = (e: MouseEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('dblclick', e, { button: normalizeMouseButton(e.button) });
  };

  const onWheel = (e: WheelEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('wheel', e, {
      button: null,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaZ: e.deltaZ,
    });
  };

  const onEnter = (e: MouseEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('enter', e, { button: null, dx: 0, dy: 0 });
  };

  const onLeave = (e: MouseEvent) => {
    if (!enabled()) return;
    trackPos(e);
    emit('leave', e, { button: null, dx: 0, dy: 0 });
  };

  const onContextMenu = (e: Event) => {
    if (options.preventContextMenu) e.preventDefault();
  };

  const downEvt = usePointer ? 'pointerdown' : 'mousedown';
  const moveEvt = usePointer ? 'pointermove' : 'mousemove';
  const upEvt = usePointer ? 'pointerup' : 'mouseup';

  target.addEventListener(downEvt, onDown as EventListener);
  target.addEventListener(moveEvt, onMove as EventListener);
  target.addEventListener(upEvt, onUp as EventListener);
  target.addEventListener('click', onClick as EventListener);
  target.addEventListener('dblclick', onDblClick as EventListener);
  target.addEventListener('wheel', onWheel as EventListener, { passive: true });
  if (target instanceof HTMLElement) {
    target.addEventListener('mouseenter', onEnter as EventListener);
    target.addEventListener('mouseleave', onLeave as EventListener);
  }
  if (options.preventContextMenu) {
    target.addEventListener('contextmenu', onContextMenu);
  }

  return {
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get buttons() {
      return buttons;
    },
    get dragging() {
      return dragging;
    },
    isDown(button: MouseButton = 'left') {
      return buttons.has(button);
    },
    on(type, handler) {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      set.add(handler);
      return () => set!.delete(handler);
    },
    destroy() {
      target.removeEventListener(downEvt, onDown as EventListener);
      target.removeEventListener(moveEvt, onMove as EventListener);
      target.removeEventListener(upEvt, onUp as EventListener);
      target.removeEventListener('click', onClick as EventListener);
      target.removeEventListener('dblclick', onDblClick as EventListener);
      target.removeEventListener('wheel', onWheel as EventListener);
      if (target instanceof HTMLElement) {
        target.removeEventListener('mouseenter', onEnter as EventListener);
        target.removeEventListener('mouseleave', onLeave as EventListener);
      }
      target.removeEventListener('contextmenu', onContextMenu);
      handlers.clear();
      buttons.clear();
    },
  };
}

/** Namespace for `K3UI.mouse`. */
export const mouse = {
  attach: attachMouse,
  normalizeButton: normalizeMouseButton,
  buttonsFromBitfield,
} as const;
