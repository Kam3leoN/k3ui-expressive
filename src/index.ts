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
  allowsExpressiveMotion,
  edgeScrollbarStyles,
  attachDrag,
  setAxisTranslate,
  animateAxisTranslate,
  clearAxisTranslate,
  shouldDismissDrag,
  resolveDismissThresholdPx,
  M3_DISMISS_POSITION_DP,
  M3_DISMISS_VELOCITY,
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
  keyboard,
  attachKeyboard,
  bindChord,
  bindChords,
  normalizeKey,
  parseChord,
  matchChord,
  chordId,
  mouse,
  attachMouse,
  normalizeMouseButton,
  buttonsFromBitfield,
  bindMediaHotkeys,
} from './core/index.js';
import { showSnackbar, snackbarQueue } from './components/feedback/snackbar-queue.js';

export {
  sanitizeHTML,
  sanitizeHTMLDetailed,
  sanitizeSVG,
  type SanitizeOptions,
  type SanitizeResult,
  type SanitizeSVGOptions,
} from './core/sanitize.js';
export { VERSION } from './version.js';
export { init, getInitOptions, type InitOptions, type K3UIGlobal } from './bootstrap/init.js';
export { debug } from './debug/logger.js';
export { i18n } from './i18n/index.js';
export {
  themeApi as theme,
  themeCssVars,
  COLOR_ROLES,
  COLOR_ROLE_GROUPS,
  colorRoleToCssVar,
  SEMANTIC_COLOR_ROLES,
  SEMANTIC_SEEDS,
  buildSemanticCssVars,
  type ColorRoleKey,
  type ColorRoleGroup,
  type SemanticName,
  DEFAULT_COLOR_SPEC,
  AUTO_LIGHT_START_H,
  AUTO_LIGHT_END_H,
  type ColorSpecVersion,
  type ContrastPreference,
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
  easings,
  type NamedEasing,
  enterScaleY,
  enterScaleYPopover,
  enterScaleYKeyframes,
  enterDialogBasicKeyframes,
  scrimFade,
  enterSnackbarScaleY,
  enterDialogMotion,
  enterSheetBottom,
  enterSheetSide,
  enterSheetSlide,
  motionSpatialFast,
  motionSpatialDefault,
  motionEffectsFast,
  motionStandardMedium,
  motionSheetEnter,
  motionSheetExit,
  motionDialogEnter,
  morphSize,
  parseMotionToken,
  spatialDefaultTiming,
  spatialFastTiming,
  canWebAnimate,
} from './motion/index.js';export {
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
  LAYOUT_BREAKPOINTS,
  HELPER_SPACE_STEPS,
  HELPER_SPACE_STEPS_RESPONSIVE,
  ELEVATION_TOKENS,
  ICON_SIZE_TOKENS,
  SHAPE_CORNER_TOKENS,
  TYPE_ROLES,
  TYPE_EMPHASIZED_ROLES,
  TYPE_FAMILIES,
  MOTION_DURATION_TOKENS,
  type M3StyleCategory,
} from './tokens/meta.js';
export { K3Element, type Density } from './core/k3-element.js';
export { LayerPortal } from './core/layer-portal.js';
export { isRtl } from './core/rtl.js';
export { attachInternals, setFormValue } from './core/form-associated.js';
export { focusRingStyles } from './core/focus-ring.js';
export { stateLayerStyles } from './core/state-layer.js';
export {
  attachOutsideDismiss,
  type OutsideDismissOptions,
  type OutsideDismissController,
} from './core/outside-dismiss.js';
export { sysColorCssVars } from './theme/css-vars.js';
export {
  GAP_DP,
  LINEAR_WAVE_AMP,
  LINEAR_WAVE_LEN,
  STOP_DP,
  drawFlatBar,
  drawOscillationBars,
  drawStop,
  drawWavyBar,
  indicatorAmplitudeFactor,
} from './components/feedback/progress-draw.js';
export {
  loadWaveformPeaks,
  oscillationBarCount,
  resamplePeaks,
} from './components/media/waveform-pcm.js';
export {
  SLIDER_HANDLE_GAP,
  SLIDER_HANDLE_GAP_PRESSED,
  SLIDER_HANDLE_WIDTH_PRESSED,
} from './components/inputs/slider-tokens.js';
export {
  attachTextMarquee,
  type TextMarqueeHandle,
} from './components/feedback/text-marquee.js';
export {
  emitLifecycle,
  runOpenClose,
  waitForMotion,
  prefersReducedMotion,
  allowsExpressiveMotion,
  edgeScrollbarStyles,
  attachDrag,
  setAxisTranslate,
  animateAxisTranslate,
  clearAxisTranslate,
  shouldDismissDrag,
  resolveDismissThresholdPx,
  M3_DISMISS_POSITION_DP,
  M3_DISMISS_VELOCITY,
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
  keyboard,
  attachKeyboard,
  bindChord,
  bindChords,
  normalizeKey,
  parseChord,
  matchChord,
  chordId,
  mouse,
  attachMouse,
  normalizeMouseButton,
  buttonsFromBitfield,
  bindMediaHotkeys,
};
export type {
  DragAxis,
  DragDetail,
  DragOptions,
  DragController,
  DragSettleMode,
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
  KeyId,
  KeyboardPhase,
  KeyboardKeyDetail,
  KeyboardChordDetail,
  KeyboardController,
  AttachKeyboardOptions,
  BindChordOptions,
  MouseButton,
  MousePhase,
  MousePoint,
  MouseDetail,
  MouseController,
  AttachMouseOptions,
  MediaHotkeyHandlers,
  MediaHotkeyOptions,
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
export {
  K3Coverflow,
  type CoverflowMode,
  type CoverflowOrientation,
  type CoverflowEffect,
} from './components/containment/coverflow.js';
export { K3CoverflowItem } from './components/containment/coverflow-item.js';
export {
  CoverflowSpecs,
  coverflowOffset,
  coverflowPose,
  type CoverflowGeometry,
  type CoverflowPose,
} from './components/containment/coverflow.specs.js';
/* Charts, audio, QR, sound-fx, masonry, iso-filter → companion package `k3ux`. */
export type { K3Lazy } from './components/feedback/lazy.js';
export {
  LazySpecs,
  LAZY_FALLBACKS,
  type LazyFallback,
  type LazyState,
} from './components/feedback/lazy.specs.js';
export {
  whenTriggered,
  pendingCustomElements,
  LAZY_TRIGGERS,
  type LazyTrigger,
  type WhenTriggeredOptions,
} from './core/lazy.js';
export { registerWhen, isKnown } from './registry/register.js';
import { syntax } from './syntax/index.js';
export {
  syntax,
  LANGUAGE_MANIFEST,
  type K3Syntax,
  type SyntaxLanguagePack,
  type SyntaxLanguageInfo,
} from './syntax/index.js';
export type { CodeBlockTheme } from './components/containment/codeblock.js';

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
  keyboard,
  mouse,
  syntax,
  snackbar: { show: showSnackbar, queue: snackbarQueue },
};

if (typeof window !== 'undefined') {
  window.K3UI = K3UI;
  if (window.K3UI_MANUAL !== true) {
    void autoBootstrap();
  }
}

export type { InitOptions as K3InitOptions };
