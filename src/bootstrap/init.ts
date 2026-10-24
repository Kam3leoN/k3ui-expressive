import { VERSION } from '../version.js';
import { debug, type DebugLevel } from '../debug/logger.js';
import { i18n, type LocaleCode } from '../i18n/index.js';
import {
  themeApi,
  type ColorMode,
  type MotionScheme,
  type ColorVariant,
  type ContrastLevel,
} from '../theme/apply.js';
import { registry } from '../registry/register.js';
import { haptic } from '../core/haptic.js';
import { dnd } from '../core/dnd.js';
import { gestures, defineGestureElements } from '../core/gestures/index.js';
import { watchIconLigatures } from '../icons/ligature.js';
import { showSnackbar, snackbarQueue } from '../components/feedback/snackbar-queue.js';
// Styles are imported from src/index.ts / playground — keep runtime free of CSS side-effects.

export interface InitOptions {
  locale?: LocaleCode;
  theme?: {
    seed?: string;
    mode?: ColorMode;
    motion?: MotionScheme;
    variant?: ColorVariant;
    contrast?: ContrastLevel;
  };
  debug?: boolean | { level?: DebugLevel };
  components?: 'all' | string[];
  /** Disable haptic feedback globally (mobile vibrate) */
  haptic?: boolean;
}

export interface K3UIGlobal {
  version: string;
  init: typeof init;
  debug: typeof debug;
  i18n: typeof i18n;
  theme: typeof themeApi;
  registry: typeof registry;
  haptic: typeof haptic;
  dnd: typeof dnd;
  gestures: typeof gestures;
  snackbar: {
    show: typeof showSnackbar;
    queue: typeof snackbarQueue;
  };
}

declare global {
  interface Window {
    K3UI?: K3UIGlobal;
    K3UI_OPTIONS?: InitOptions;
    K3UI_MANUAL?: boolean;
  }
}

let initialized = false;
let lastOptions: InitOptions = {};

function mergeOptions(input?: InitOptions): InitOptions {
  const preload =
    typeof window !== 'undefined' && window.K3UI_OPTIONS ? window.K3UI_OPTIONS : {};
  return { ...preload, ...lastOptions, ...input };
}

export async function init(options?: InitOptions): Promise<K3UIGlobal> {
  const opts = mergeOptions(options);
  lastOptions = opts;

  debug.fromUrl();
  if (opts.debug !== undefined) {
    debug.enable(opts.debug);
  }

  if (opts.locale) {
    i18n.setLocale(opts.locale);
  } else if (!initialized) {
    i18n.detect();
  }

  themeApi.apply({
    seed: opts.theme?.seed ?? '#6750A4',
    mode: opts.theme?.mode ?? 'auto',
    motion: opts.theme?.motion ?? 'expressive',
    variant: opts.theme?.variant ?? 'expressive',
    contrast: opts.theme?.contrast ?? 'default',
  });

  await registry.registerAll(opts.components ?? 'all');

  if (opts.haptic !== undefined) {
    haptic.setEnabled(opts.haptic);
  }

  /* Material ligatures — block Chrome / Google Translate from rewriting glyphs */
  if (typeof document !== 'undefined') {
    watchIconLigatures(document);
  }

  defineGestureElements();

  initialized = true;
  debug.info('bootstrap', `init complete v${VERSION}`);

  const api: K3UIGlobal = {
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
    window.K3UI = api;
  }
  return api;
}

export function shouldAutoInit(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.K3UI_MANUAL === true) return false;
  return true;
}

export async function autoBootstrap(): Promise<void> {
  if (!shouldAutoInit()) {
    debug.info('bootstrap', 'manual mode — call K3UI.init() yourself');
    return;
  }
  await init();
}
