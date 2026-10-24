import './styles/k3ui.scss';
import { VERSION } from './version.js';
import { init, autoBootstrap, type InitOptions, type K3UIGlobal } from './bootstrap/init.js';
import { debug } from './debug/logger.js';
import { i18n } from './i18n/index.js';
import { themeApi } from './theme/apply.js';
import { registry } from './registry/register.js';
import {
  emitLifecycle,
  runOpenClose,
  waitForMotion,
  prefersReducedMotion,
  edgeScrollbarStyles,
  attachDrag,
  attachSortable,
  attachDraggable,
  attachDroppable,
  dnd,
  haptic,
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
} from './core/index.js';
import { showSnackbar, snackbarQueue } from './components/feedback/snackbar-queue.js';

export { VERSION } from './version.js';
export { init, type InitOptions, type K3UIGlobal } from './bootstrap/init.js';
export { debug } from './debug/logger.js';
export { i18n } from './i18n/index.js';
export {
  themeApi as theme,
  COLOR_ROLES,
  COLOR_ROLE_GROUPS,
  colorRoleToCssVar,
  SEMANTIC_COLOR_ROLES,
  SEMANTIC_SEEDS,
  buildSemanticCssVars,
  type ColorRoleKey,
  type ColorRoleGroup,
  type SemanticName,
} from './theme/apply.js';
export {
  DEFAULT_MOOD_LEGEND,
  DEFAULT_MOOD_YEARS,
  defaultMoodYears,
  MOOD_ORDER,
  generateDemoYear,
  countByMood,
  type MoodEntry,
  type MoodId,
  type MoodMeta,
} from './components/pickers/mood-calendar.js';
export {
  M2_PALETTES,
  M2_PALETTE_NAMES,
  M2_TONES,
  m2PaletteCssVar,
  m2PaletteHex,
  m2PaletteVar,
  type M2PaletteName,
  type M2Tone,
} from './theme/m2-palettes.js';
export { registry } from './registry/register.js';
export {
  springs,
  motionCss,
  enterScaleY,
  enterScaleYPopover,
  enterScaleYKeyframes,
  scrimFade,
  enterSnackbarScaleY,
  enterDialogMotion,
  enterSheetSlide,
  motionSpatialFast,
  motionSpatialDefault,
  motionEffectsFast,
  motionStandardMedium,
  motionSheetEnter,
  motionSheetExit,
  motionDialogEnter,
} from './motion/index.js';
export {
  MATERIAL_SHAPE_NAMES,
  MATERIAL_SHAPE_SVG,
  materialShapeSvg,
  morphMaterialShapes,
  animateMaterialShapeMorph,
  type MaterialShapeName,
} from './shapes/index.js';
export {
  M3_STYLE_CATEGORIES,
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  ICON_SIZE_TOKENS,
  SHAPE_CORNER_TOKENS,
  TYPE_ROLES,
  MOTION_DURATION_TOKENS,
  type M3StyleCategory,
} from './tokens/meta.js';
export {
  emitLifecycle,
  runOpenClose,
  waitForMotion,
  prefersReducedMotion,
  edgeScrollbarStyles,
  attachDrag,
  attachSortable,
  attachDraggable,
  attachDroppable,
  dnd,
  haptic,
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
};
export type {
  DragAxis,
  DragDetail,
  DragOptions,
  DragController,
  DndPayload,
  SortableOptions,
  SortableDetail,
  SortableReorderDetail,
  SortableController,
  DraggableOptions,
  DraggableController,
  DroppableOptions,
  DroppableDetail,
  DroppableController,
  HapticNamed,
  HapticPattern,
  GesturePhase,
  GestureDetail,
  GestureListener,
  GesturePhaseHandlers,
  GestureOptions,
  GestureController,
  GestureRecognizer,
  TapGestureDetail,
  LongPressGestureDetail,
  SwipeGestureDetail,
  PanGestureDetail,
  RotateGestureDetail,
  ScaleGestureDetail,
  RepeatGestureDetail,
  SequenceGestureDetail,
  SwipeDirection,
} from './core/index.js';

export {
  showSnackbar,
  snackbarQueue,
  type ShowSnackbarOptions,
  type SnackbarQueueBehavior,
} from './components/feedback/snackbar-queue.js';
export {
  resolveSnackbarDuration,
  snackbarShouldStack,
  SNACKBAR_DURATION_MS,
  SNACKBAR_STACK_ACTION_DP,
  type SnackbarDuration,
  type SnackbarPosition,
} from './components/feedback/snackbar.js';

export const K3UI: K3UIGlobal = {
  version: VERSION,
  init,
  debug,
  i18n,
  theme: themeApi,
  registry,
  haptic,
  dnd,
  gestures,
  snackbar: { show: showSnackbar, queue: snackbarQueue },
};

if (typeof window !== 'undefined') {
  window.K3UI = K3UI;
  if (window.K3UI_MANUAL !== true) {
    void autoBootstrap();
  }
}

export type { InitOptions as K3InitOptions };
