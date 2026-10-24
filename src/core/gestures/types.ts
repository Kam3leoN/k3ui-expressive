/** Gesture lifecycle phase — mirrors M3E. */
export type GesturePhase = 'start' | 'update' | 'end' | 'cancel';

/** Base semantic detail for every recognizer. */
export interface GestureDetail {
  readonly gestureName: string;
  readonly phase: GesturePhase;
  readonly inputId: number | readonly number[];
  readonly timestamp: number;
}

export type GestureListener<T extends GestureDetail = GestureDetail> = (detail: T) => void;

export interface GesturePhaseHandlers<T extends GestureDetail = GestureDetail> {
  onStart?: GestureListener<T>;
  onUpdate?: GestureListener<T>;
  onEnd?: GestureListener<T>;
  onCancel?: GestureListener<T>;
}

export type PointerButtonName = 'primary' | 'secondary' | 'middle' | 'back' | 'forward';

export interface GestureOptions {
  /** Competition priority (higher wins) — default 1 */
  priority?: number;
  /** Allowed buttons — default `['primary']` */
  buttons?: PointerButtonName[];
  /** Allowed pointer types — default all */
  pointerTypes?: Array<'mouse' | 'pen' | 'touch'>;
  inputFilter?: (e: PointerEvent) => boolean;
}

export interface GestureController {
  disabled: boolean;
  destroy(): void;
}

/** Recognizer contract used by {@link detectGesture}. */
export interface GestureRecognizer<T extends GestureDetail = GestureDetail> {
  readonly name: string;
  readonly priority: number;
  readonly listener: GestureListener<T>;
  bind(el: HTMLElement, emit: GestureListener<T>): () => void;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

function buttonName(button: number): PointerButtonName {
  switch (button) {
    case 1:
      return 'middle';
    case 2:
      return 'secondary';
    case 3:
      return 'back';
    case 4:
      return 'forward';
    default:
      return 'primary';
  }
}

export function allowsPointer(opt: GestureOptions | undefined, e: PointerEvent): boolean {
  const buttons = opt?.buttons ?? ['primary'];
  const types = opt?.pointerTypes;
  if (types?.length && !types.includes(e.pointerType as 'mouse' | 'pen' | 'touch')) {
    return false;
  }
  if (e.pointerType === 'mouse' && !buttons.includes(buttonName(e.button))) return false;
  if (opt?.inputFilter && !opt.inputFilter(e)) return false;
  return true;
}

export function localPoint(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  return { localX: clientX - r.left, localY: clientY - r.top };
}

export function now(e?: Event): number {
  return e && 'timeStamp' in e ? (e as Event).timeStamp : performance.now();
}

/** Parse overloaded factory args: listener and/or options. */
export function parseFactoryArgs<TOpt extends object, TDetail extends GestureDetail>(
  a?: GestureListener<TDetail> | Partial<TOpt>,
  b?: Partial<TOpt>,
): { listener: GestureListener<TDetail>; options: Partial<TOpt> } {
  if (typeof a === 'function') {
    return { listener: a, options: (b ?? {}) as Partial<TOpt> };
  }
  return { listener: () => undefined, options: (a ?? {}) as Partial<TOpt> };
}