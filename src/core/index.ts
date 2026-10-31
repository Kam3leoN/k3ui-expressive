export { K3Element, type Density } from './k3-element.js';
export {
  getSoundFx,
  SoundFxController,
  resetSoundFxForTests,
  type SoundFxEvent,
  type SoundFxOptions,
} from './sound-fx.js';
export { hasSlot, hasLightSlot, hasNamedSlot, slotHasContent } from './slots.js';
export { LayerPortal } from './layer-portal.js';
export {
  resolveCssLengthPx,
  rootRemPx,
  devicePixelRatioSafe,
  devicePixelSnapPx,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from './css-length.js';
export {
  emitLifecycle,
  waitForMotion,
  afterFrames,
  afterPaint,
  runOpenClose,
  prefersReducedMotion,
  type LifecyclePhase,
  type LifecycleDetail,
} from './lifecycle.js';
export { FocusTrap } from './focus-trap.js';
export {
  annotateFocusNavResult,
  buildFocusNavLoop,
  deepActiveElement,
  focusComposite,
  focusElement,
  handleFocusNavKey,
  indexInFocusNavLoop,
  indexOfFocusedItem,
  isFocusOnTrigger,
  isFocusWithinHost,
  resolveFocusNavKey,
  type FocusNavKind,
  type FocusNavLoopEntry,
  type FocusNavOptions,
  type FocusNavOrientation,
  type FocusNavResult,
  type FocusNavTriggerPosition,
} from './focus-nav.js';
export { stateLayerStyles } from './state-layer.js';
export { focusRingStyles } from './focus-ring.js';
export { selectionTargetStyles, selectionThumbStateStyles } from './selection-target.js';
export { edgeScrollbarStyles } from './scrollbar.js';
export { attachInternals, setFormValue } from './form-associated.js';
export {
  attachDrag,
  setAxisTranslate,
  animateAxisTranslate,
  clearAxisTranslate,
  shouldDismissDrag,
  resolveDismissThresholdPx,
  M3_DISMISS_POSITION_DP,
  M3_DISMISS_VELOCITY,
  type DragAxis,
  type DragDetail,
  type DragOptions,
  type DragController,
  type DragSettleMode,
} from './drag.js';
export {
  dnd,
  attachSortable,
  attachDraggable,
  attachDroppable,
  getActiveDndPayload,
  type DndPayload,
  type SortableOptions,
  type SortableDetail,
  type SortableReorderDetail,
  type SortableController,
  type DraggableOptions,
  type DraggableController,
  type DroppableOptions,
  type DroppableDetail,
  type DroppableController,
} from './dnd.js';
export { haptic, type HapticNamed, type HapticPattern } from './haptic.js';
export {
  keyboard,
  attachKeyboard,
  bindChord,
  bindChords,
  normalizeKey,
  parseChord,
  matchChord,
  chordId,
  type KeyId,
  type KeyboardPhase,
  type KeyboardKeyDetail,
  type KeyboardChordDetail,
  type KeyboardController,
  type AttachKeyboardOptions,
  type BindChordOptions,
} from './keyboard.js';
export {
  mouse,
  attachMouse,
  normalizeMouseButton,
  buttonsFromBitfield,
  type MouseButton,
  type MousePhase,
  type MousePoint,
  type MouseDetail,
  type MouseController,
  type AttachMouseOptions,
} from './mouse.js';
export {
  bindMediaHotkeys,
  type MediaHotkeyHandlers,
  type MediaHotkeyOptions,
} from './media-hotkeys.js';
export {
  gestures,
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
  defineGestureElements,
  type GesturePhase,
  type GestureDetail,
  type GestureListener,
  type GesturePhaseHandlers,
  type GestureOptions,
  type GestureController,
  type GestureRecognizer,
  type TapGestureDetail,
  type LongPressGestureDetail,
  type SwipeGestureDetail,
  type PanGestureDetail,
  type RotateGestureDetail,
  type ScaleGestureDetail,
  type RepeatGestureDetail,
  type SequenceGestureDetail,
  type SwipeDirection,
} from './gestures/index.js';

/* Shared helpers (menus, overlays, pickers, chips, …) */
export { isRtl } from './rtl.js';
export { normalizeLabel } from './text.js';
export { createMotionGate, type MotionGate } from './motion-gate.js';
export { runWhenConnected, type ReconnectHost } from './reconnect.js';
export {
  canHoverOpen,
  pathIncludes,
  pathMatches,
} from './pointer.js';
export {
  attachOutsideDismiss,
  type OutsideDismissOptions,
  type OutsideDismissController,
} from './outside-dismiss.js';
export {
  attachHoverOpen,
  type HoverOpenOptions,
  type HoverOpenController,
} from './hover-open.js';
export {
  VIEWPORT_EDGE,
  ANCHOR_GAP,
  MENU_EDGE,
  MENU_GAP,
  MENU_SUBMENU_OVERLAP,
  MENU_MIN_W,
  MENU_MIN_H,
  layoutBoundingRect,
  measureContentBox,
  type ContentSize,
} from './geometry.js';
export {
  placeVerticalDocked,
  applyVerticalDockStyles,
  placeInlineStartEnd,
  computeDockedPosition,
  applyDockedPosition,
  type VerticalDockResult,
  type DockedPositionResult,
  type VerticalDockOpts,
} from './anchored-position.js';
export {
  SURFACE_COMPACT_MQ,
  resolveSurfaceVariant,
  syncResolvedSurface,
  attachDockedFit,
  type SurfaceVariant,
  type ResolvedSurfaceVariant,
  type DockedFitOptions,
  type DockedFitController,
} from './surface-variant.js';
