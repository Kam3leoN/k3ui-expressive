import { VERSION } from '../version.js';
import { debug, type DebugLevel } from '../debug/logger.js';
import { i18n, normalizeLocale, type LocaleCode } from '../i18n/index.js';
import { syntax, type K3Syntax } from '../syntax/index.js';
import {
  themeApi,
  type ColorMode,
  type MotionScheme,
  type ColorVariant,
  type ContrastPreference,
  type ColorSpecVersion,
  type ThemeOptions,
} from '../theme/apply.js';
import { registry } from '../registry/register.js';
import { haptic } from '../core/haptic.js';
import { dnd } from '../core/dnd.js';
import { gestures, defineGestureElements } from '../core/gestures/index.js';
import { keyboard } from '../core/keyboard.js';
import { mouse } from '../core/mouse.js';
import { overlayStack } from '../core/overlay-stack.js';
import { yieldToMain } from '../core/yield.js';
import { watchIconLigatures } from '../icons/ligature.js';
import { showSnackbar, snackbarQueue } from '../components/feedback/snackbar-queue.js';
// Styles are imported from src/index.ts / playground — keep runtime free of CSS side-effects.

/**
 * `K3UI.init()` options. Every call **deep-merges** into the previous ones, so
 * `init({ theme: { mode: 'dark' } })` later on keeps the seed, locale, etc.
 * Unknown keys and invalid values are reported with `console.warn` and ignored.
 */
export interface InitOptions {
  /** Catalog code or BCP 47 tag (`fr-FR` → `fr`). Detected from the browser when omitted. */
  locale?: LocaleCode | (string & {});
  /** Writes `dir` on `<html>` — components mirror their layout (menus, sheets, tabs…). */
  direction?: 'ltr' | 'rtl';
  theme?: {
    /** Source colour, `#rgb` or `#rrggbb`. */
    seed?: string;
    mode?: ColorMode;
    motion?: MotionScheme;
    variant?: ColorVariant;
    /** `auto` follows the OS `prefers-contrast` setting. */
    contrast?: ContrastPreference;
    /** Material color spec — `2025` (default) or `2021`. */
    specVersion?: ColorSpecVersion;
  };
  motion?: {
    /**
     * `system` (default) follows `prefers-reduced-motion`; `always` turns
     * motion down for everyone (`<html data-k3-reduce-motion>`). The OS
     * preference can never be overridden upwards.
     */
    reduce?: 'system' | 'always';
  };
  interaction?: {
    /** Press ripples (default `true`). */
    ripple?: boolean;
  };
  overlays?: {
    /** Lock page scroll while a modal dialog / sheet is open (default `false`). */
    scrollLock?: boolean;
  };
  debug?: boolean | { level?: DebugLevel };
  /**
   * Elements to define. `'all'` — the whole catalog (default of `k3ui`);
   * `'auto'` — only the k3 elements present in the document, then any added
   * later (default of `k3ui/lazy`); or an explicit list of tags. Children a
   * component renders always come along.
   */
  components?: 'all' | 'auto' | string[];
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
  keyboard: typeof keyboard;
  mouse: typeof mouse;
  snackbar: {
    show: typeof showSnackbar;
    queue: typeof snackbarQueue;
  };
  /** Syntax highlighting (private Prism instance, Okaidia tokens). */
  syntax: K3Syntax;
}

declare global {
  interface Window {
    K3UI?: K3UIGlobal;
    K3UI_OPTIONS?: InitOptions;
    K3UI_MANUAL?: boolean;
  }
}

/* ── Validation ───────────────────────────────────────────────────────── */

type Schema = { readonly [key: string]: Schema | ((v: unknown) => boolean) };

const oneOf =
  (...values: readonly unknown[]) =>
  (v: unknown): boolean =>
    values.includes(v);
const isBool = (v: unknown): boolean => typeof v === 'boolean';

const SCHEMA: Schema = {
  locale: (v) => typeof v === 'string' && normalizeLocale(v) != null,
  direction: oneOf('ltr', 'rtl'),
  theme: {
    seed: (v) => typeof v === 'string' && /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v),
    mode: oneOf('light', 'dark', 'auto', 'system'),
    motion: oneOf('expressive', 'standard'),
    variant: oneOf('tonalspot', 'vibrant', 'fidelity', 'expressive', 'monochrome', 'neutral', 'rainbow', 'fruitsalad'),
    contrast: oneOf('default', 'medium', 'high', 'auto'),
    specVersion: oneOf('2021', '2025'),
  },
  motion: { reduce: oneOf('system', 'always') },
  interaction: { ripple: isBool },
  overlays: { scrollLock: isBool },
  debug: (v) => typeof v === 'boolean' || (typeof v === 'object' && v !== null),
  components: (v) => v === 'all' || v === 'auto' || (Array.isArray(v) && v.every((t) => typeof t === 'string')),
  haptic: isBool,
};

/** Keys that must never be copied from user / JSON input (prototype pollution). */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[k3ui:init] ${message}`);
}

/** Copy of `input` with only known keys and valid values (warns about the rest). */
function validate(input: unknown, schema: Schema, path = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!isPlainObject(input)) return out;
  for (const [key, value] of Object.entries(input)) {
    const where = path ? `${path}.${key}` : key;
    const rule = Object.hasOwn(schema, key) && !FORBIDDEN_KEYS.has(key) ? schema[key] : undefined;
    if (value === undefined) continue;
    if (!rule) {
      warnOnce(`unknown option "${where}" ignored`);
      continue;
    }
    if (typeof rule === 'function') {
      if (rule(value)) out[key] = value;
      else warnOnce(`invalid value for "${where}": ${JSON.stringify(value)} — ignored`);
      continue;
    }
    if (!isPlainObject(value)) {
      warnOnce(`"${where}" must be an object — ignored`);
      continue;
    }
    out[key] = validate(value, rule, where);
  }
  return out;
}

/** Deep merge of validated option objects (arrays and primitives replace). */
function mergeDeep<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const prev = out[key];
    out[key] = isPlainObject(prev) && isPlainObject(value) ? mergeDeep(prev, value) : value;
  }
  return out as T;
}

/* ── Bootstrap ────────────────────────────────────────────────────────── */


let initialized = false;
/** What the first `init()` registers when `components` is omitted. */
let defaultComponents: 'all' | 'auto' = 'all';

/** Entry-level default for `components` (`k3ui/lazy` sets `'auto'`). Call before `init()`. */
export function setDefaultComponents(mode: 'all' | 'auto'): void {
  defaultComponents = mode;
}
let lastOptions: InitOptions = {};
/** Serializes `init()` calls — the auto-bootstrap and an app call often overlap. */
let queue: Promise<unknown> = Promise.resolve();

function applyDocumentSettings(patch: InitOptions): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (patch.direction) root.dir = patch.direction;
  if (patch.motion?.reduce === 'always') root.setAttribute('data-k3-reduce-motion', '');
  else if (patch.motion?.reduce === 'system') root.removeAttribute('data-k3-reduce-motion');
  if (patch.interaction?.ripple === false) root.dataset.k3Ripple = 'off';
  else if (patch.interaction?.ripple === true) delete root.dataset.k3Ripple;
}

async function runInit(input?: InitOptions): Promise<K3UIGlobal> {
  const preload =
    !initialized && typeof window !== 'undefined' && window.K3UI_OPTIONS ? window.K3UI_OPTIONS : {};
  /* What this call changes: preload (first call only) + the caller's options. */
  const patch = mergeDeep(validate(preload, SCHEMA), validate(input ?? {}, SCHEMA)) as InitOptions;
  const opts = mergeDeep(lastOptions as Record<string, unknown>, patch as Record<string, unknown>) as InitOptions;
  lastOptions = opts;

  debug.fromUrl();
  if (patch.debug !== undefined) {
    debug.enable(patch.debug);
  }

  if (patch.locale) {
    i18n.setLocale(patch.locale);
  } else if (!initialized) {
    i18n.detect();
  }

  applyDocumentSettings(initialized ? patch : opts);

  /*
   * Theme: first call applies everything (themeApi fills the defaults); later
   * calls only forward what they change — a re-init for the locale no longer
   * resets a theme set with `K3UI.theme.apply()`.
   */
  if (!initialized || patch.theme) {
    const theme = { ...(initialized ? patch.theme : opts.theme) } as ThemeOptions;
    /* Cold MCU computation in slices, then a synchronous (cached) write. */
    await themeApi.prepare(theme, yieldToMain);
    themeApi.apply(theme);
  }

  if (patch.overlays?.scrollLock !== undefined) overlayStack.setScrollLock(patch.overlays.scrollLock);

  /* Let the browser breathe between the colour scheme and the component upgrades. */
  await yieldToMain();
  const components = patch.components ?? (initialized ? [] : defaultComponents);
  if (components === 'auto') {
    /* Elements already in the page are defined before init() resolves. */
    if (typeof document !== 'undefined') await registry.observe(document).ready;
  } else {
    await registry.registerAll(components);
  }

  if (patch.haptic !== undefined) {
    haptic.setEnabled(patch.haptic);
  }

  /* Material ligatures — block Chrome / Google Translate from rewriting glyphs (idempotent) */
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
    keyboard,
    mouse,
    syntax,
    snackbar: { show: showSnackbar, queue: snackbarQueue },
  };

  if (typeof window !== 'undefined') {
    window.K3UI = api;
  }
  return api;
}

/**
 * Boot K3UI — locale, theme, registration of the components, global settings.
 * Safe to call again (hot update): options deep-merge, calls run one after
 * the other, and only what changed is re-applied.
 */
export function init(options?: InitOptions): Promise<K3UIGlobal> {
  const run = queue.then(
    () => runInit(options),
    () => runInit(options),
  );
  queue = run.catch(() => undefined);
  return run;
}

/** Options in effect after the last `init()` (deep copy). */
export function getInitOptions(): InitOptions {
  return structuredClone(lastOptions);
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
