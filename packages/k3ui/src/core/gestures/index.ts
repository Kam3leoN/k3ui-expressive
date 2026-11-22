/**
 * K3ui gesture recognition — M3E-compatible API surface.
 *
 * @see https://matraic.github.io/m3e/#/components/gestures.html
 */

export { phase } from './phase.js';
export { detectGesture } from './detect.js';
export { tap, type TapGestureDetail, type TapGestureOptions } from './tap.js';
export {
  longPress,
  type LongPressGestureDetail,
  type LongPressGestureOptions,
} from './long-press.js';
export { swipe, type SwipeGestureDetail, type SwipeGestureOptions } from './swipe.js';
export { pan, type PanGestureDetail, type PanGestureOptions } from './pan.js';
export { rotate, type RotateGestureDetail, type RotateGestureOptions } from './rotate.js';
export { scale, type ScaleGestureDetail, type ScaleGestureOptions } from './scale.js';
export { repeat, type RepeatGestureDetail, type RepeatGestureOptions } from './repeat.js';
export {
  sequence,
  sequenceWithListener,
  type SequenceGestureDetail,
  type SequenceGestureOptions,
} from './sequence.js';
export {
  defineGestureElements,
  K3TapGesture,
  K3LongPressGesture,
  K3SwipeGesture,
  K3PanGesture,
  K3RotateGesture,
  K3ScaleGesture,
  K3RepeatGesture,
  K3SequenceGesture,
} from './elements.js';
export type {
  GesturePhase,
  GestureDetail,
  GestureListener,
  GesturePhaseHandlers,
  GestureOptions,
  GestureController,
  GestureRecognizer,
  SwipeDirection,
  PointerButtonName,
} from './types.js';

import { detectGesture } from './detect.js';
import { phase } from './phase.js';
import { tap } from './tap.js';
import { longPress } from './long-press.js';
import { swipe } from './swipe.js';
import { pan } from './pan.js';
import { rotate } from './rotate.js';
import { scale } from './scale.js';
import { repeat } from './repeat.js';
import { sequence } from './sequence.js';
import { defineGestureElements } from './elements.js';

export const gestures = {
  detectGesture,
  phase,
  tap,
  longPress,
  swipe,
  pan,
  rotate,
  scale,
  repeat,
  sequence,
  defineElements: defineGestureElements,
};

export default gestures;