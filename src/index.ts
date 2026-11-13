/*
 * Full bundle entry (`k3ui` → dist/k3ui.js): the shared API from base.ts plus
 * the exports that statically pull component code. For on-demand loading use
 * `k3ui/lazy` (src/lazy.ts) — same API without these extras.
 */
import { bootstrapGlobal } from './base.js';

export * from './base.js';
export {
  MATERIAL_SHAPE_NAMES,
  MATERIAL_SHAPE_SVG,
  materialShapeSvg,
  morphMaterialShapes,
  animateMaterialShapeMorph,
  type MaterialShapeName,
} from './shapes/index.js';
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

bootstrapGlobal();
