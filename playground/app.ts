/* Playground app — booted by main.ts after the first paint. */
import { init } from '../src/bootstrap/init.js';
import type { ColorSpecVersion } from '../src/theme/apply.js';
import { registry } from '../src/registry/register.js';
import { yieldToMain } from '../src/core/yield.js';
import { catalog as COMPONENT_CATALOG } from '../src/registry/catalog.js';
import { buildDynamicPalettes } from '../src/theme/palettes.js';
import {
  COLOR_ROLE_GROUPS,
  colorRoleToCssVar,
  type ColorMode,
  type ColorVariant,
  type ContrastLevel,
  type MotionScheme,
} from '../src/theme/apply.js';
import {
  M2_PALETTES,
  M2_PALETTE_NAMES,
  m2PaletteCssVar,
  type M2Tone,
} from '../src/theme/m2-palettes.js';
import {
  contrastGrade,
  contrastPairFor,
  contrastRatio,
  normalizeHex,
  swatchLabelColor,
} from './color-lab.js';
import {
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  SHAPE_CORNER_TOKENS,
  MOTION_DURATION_TOKENS,
  TYPE_ROLES,
  TYPE_EMPHASIZED_ROLES,
  TYPE_FAMILIES,
} from '../src/tokens/meta.js';
import {
  catalogGridHtml,
  componentsInCategory,
  orderedComponents,
  neighborComponents,
  findComponent,
  findComponentAnyProduct,
  resolvePageId,
  getDocProduct,
  setDocProduct,
  type DocProduct,
} from './catalog.js';
import {
  NAV_DESTINATIONS,
  navDestinationsForProduct,
  COMPONENT_MENU_GROUPS,
  RESOURCE_PAGES,
  destinationForPage,
  iconForComponent,
} from './nav-destinations.js';
import { mountMaterialSymbols } from './material-symbols.js';
import { docStore, DocKeys } from './doc-store.js';
import { ariaTabs, installTabKeyboard, selectTab } from './aria-tabs.js';
import {
  DEFAULT_THEME,
  THEME_CACHE_KEY,
  THEME_SEEDS,
  THEME_STORE_KEYS,
  THEME_STORE_PREFIX,
} from './theme-defaults.js';
import { mountSponsors } from './sponsors.js';
import { enhanceAllDemos } from './demo-enhance.js';
import { wireNavRailLab } from './nav-rail-lab.js';
/* API tables + Usage / doc sections — component / style pages → own chunks */
const loadDocTables = () => import('./doc-tables.js');

/** Home: Lighthouse gauges — module loaded when the section nears the viewport. */
function watchLighthouse(): void {
  const root = document.getElementById('lighthouse-root');
  if (!root) return;
  const load = () => void import('./lighthouse.js').then((m) => m.mountLighthouse(root));
  if (typeof IntersectionObserver !== 'function') return load();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      load();
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(root);
}
import {
  isPlaygroundLocale,
  localeMenuEntry,
  mountLocaleFlags,
  playgroundToI18n,
  syncLocaleLeadingFlag,
  type PlaygroundLocale,
} from './locale-flags.js';
import { armNavActive, navItemFromEvent } from '../src/components/navigation/nav-selection.js';
import type { K3NavItem } from '../src/components/navigation/nav-item.js';
import type { DocComponent } from './catalog.js';
/* Engine only — avoid pulling the full k3ux catalog on first paint. */
import { getSoundFx } from '../../k3ux/src/core/sound-fx.js';
import { canHoverOpen } from '../src/components/containment/menu.types.js';

/**
 * Shell-critical custom elements — enough for first paint (home + chrome).
 * Remaining catalog tags register after idle so LCP is not blocked by demos.
 */
const SHELL_COMPONENTS = [
  'k3-theme',
  /* Boot veil — upgrade ASAP so SoftBurst CE replaces the light-DOM stand-in. */
  'k3-loading-indicator',
  'k3-nav-rail',
  'k3-nav-bar',
  'k3-nav-item',
  'k3-fab',
  'k3-extended-fab',
  'k3-fab-menu',
  'k3-fab-menu-item',
  'k3-scroll-to-top',
  'k3-menu',
  'k3-menu-item',
  'k3-icon-button',
  'k3-search',
  'k3-chip',
  'k3-chip-set',
  'k3-split-button',
  'k3-top-app-bar',
  'k3-button',
  'k3-button-group',
] as const;

/** Registered right after first paint — not needed for LCP text. */
/* Off-screen at first paint (dialogs, settings switches, page footer nav) */
const SHELL_DEFERRED = ['k3-tooltip', 'k3-snackbar', 'k3-dialog', 'k3-switch', 'k3-doc-nav'] as const;

const seeds: string[] = [...THEME_SEEDS];
let seedIdx = (() => {
  const idx = docStore.get<number>(DocKeys.themeSeedIdx, DEFAULT_THEME.seedIdx);
  return idx >= 0 && idx < seeds.length ? idx : 0;
})();
/* Restore last picked color into the active slot (picker mutates seeds[seedIdx]). */
{
  const saved = normalizeHex(docStore.get<string>(DocKeys.themeSeed, seeds[seedIdx]!));
  if (saved) seeds[seedIdx] = saved;
}
/** Persisted theme preference — light · dark · auto · system (OS). */
let themeMode: ColorMode = (() => {
  const saved = docStore.get<string>(DocKeys.themeMode, DEFAULT_THEME.mode);
  if (saved === 'light' || saved === 'dark' || saved === 'auto' || saved === 'system') {
    return saved;
  }
  return 'light';
})();
/** Animations on by default — opt out via rail foot (desktop) or app-bar (phone). */
let animationsOn = docStore.get<boolean>(DocKeys.uiAnimations, true);
/** Shell snowfall (settings) — never drives #demo-snow on the Snow page. */
let shellSnowOn = docStore.get<boolean>(DocKeys.uiSnow, false) === true;
/** M3 motion scheme — Expressive (spring) default · Standard (utilitarian). */
/** Material color spec — 2025 (M3 Expressive) or 2021 (legacy hues). */
let colorSpec: ColorSpecVersion = (() => {
  const saved = docStore.get<string>(DocKeys.themeSpec, DEFAULT_THEME.spec);
  return saved === '2021' ? '2021' : '2025';
})();

let motionScheme: MotionScheme = (() => {
  const saved = docStore.get<string>(DocKeys.themeMotion, 'expressive');
  return saved === 'standard' ? 'standard' : 'expressive';
})();
const COLOR_VARIANTS: readonly ColorVariant[] = [
  'tonalspot',
  'vibrant',
  'fidelity',
  'expressive',
  'content',
  'monochrome',
  'neutral',
  'rainbow',
  'fruitsalad',
] as const;

function parseColorVariant(raw: string | null | undefined): ColorVariant {
  return COLOR_VARIANTS.includes(raw as ColorVariant)
    ? (raw as ColorVariant)
    : 'expressive';
}

function parseContrast(raw: string | null | undefined): ContrastLevel {
  return raw === 'medium' || raw === 'high' ? raw : 'default';
}

let colorVariant: ColorVariant = parseColorVariant(
  docStore.get<string>(DocKeys.themeVariant, DEFAULT_THEME.variant),
);
let contrastLevel: ContrastLevel = parseContrast(
  docStore.get<string>(DocKeys.themeContrast, DEFAULT_THEME.contrast),
);

function resolvedIsDark(): boolean {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  if (themeMode === 'auto') {
    const h = new Date().getHours();
    return !(h >= 7 && h < 18);
  }
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** M3 compact &lt;600 · medium 600–839 · expanded ≥840 */
const MQ_COMPACT = '(max-width: 599.98px)';
const MQ_MEDIUM = '(min-width: 600px) and (max-width: 839.98px)';
/** Body max-width (--k3-layout-body-max) — container toggle only then */
const MQ_BODY_CONTAINER = '(min-width: 905px)';

/** Persisted preference — applied only when MQ_BODY_CONTAINER matches */
let containerOn = true;
/** Layout grid overlay — settings sheet */
let gridOn = docStore.get<boolean>(DocKeys.uiGrid, false);

/** Mobile / tablet: no container concept — always full pane + edge gap. */
function applyContainerLayout(): void {
  const main = document.getElementById('doc-main');
  const row = document.getElementById('settings-container-row');
  const sw = document.getElementById('settings-container') as
    | (HTMLElement & { selected?: boolean; disabled?: boolean })
    | null;
  const available = matchMedia(MQ_BODY_CONTAINER).matches;
  if (row) {
    row.hidden = !available;
    row.setAttribute('aria-hidden', available ? 'false' : 'true');
  }
  if (sw) {
    sw.disabled = !available;
    if (available) sw.selected = containerOn;
  }
  if (!main) return;
  if (!available) {
    main.classList.remove('k3-container');
    main.classList.add('k3-container-none');
    return;
  }
  main.classList.toggle('k3-container', containerOn);
  main.classList.toggle('k3-container-none', !containerOn);
}

function t(key: string, vars?: Record<string, string | number>): string {
  return window.K3UI?.i18n.t(key, undefined, vars) ?? key;
}

/** en-US gloss for dual-line nav — omit when locale is EN or L1 === EN. */
function enUs(key: string): string | undefined {
  return window.K3UI?.i18n.enUs?.(key);
}

/** Append M3 supporting-text (smaller · muted) with en-US name when useful. */
function appendEnSupporting(host: HTMLElement, key: string): void {
  const gloss = enUs(key);
  if (!gloss) return;
  const span = document.createElement('span');
  span.slot = 'supporting-text';
  span.lang = 'en';
  span.translate = false;
  span.className = 'notranslate';
  span.textContent = gloss;
  host.append(span);
}

/**
 * Sheet label column — L1 localized + optional L2 en-US (M3 supporting text).
 */
function sheetLabel(key: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'label';
  const primary = document.createElement('span');
  primary.className = 'label-primary';
  primary.textContent = t(key);
  wrap.append(primary);
  const gloss = enUs(key);
  if (gloss) {
    const secondary = document.createElement('span');
    secondary.className = 'label-secondary notranslate';
    secondary.lang = 'en';
    secondary.translate = false;
    secondary.textContent = gloss;
    wrap.append(secondary);
  }
  return wrap;
}

function currentPageId(): string {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const raw = hash === '' ? 'home' : hash;
  return raw === 'home' ? 'home' : resolvePageId(raw);
}

/** Color family — Styles → Color submenu (each is its own page). */
const COLOR_SUBPAGES = [
  ['color-roles', 'doc.color-roles.title'],
  ['color-palettes', 'doc.color-palettes.title'],
  ['color-extras', 'doc.color-extras.title'],
] as const;

const COLOR_CHILD_IDS = new Set<string>(COLOR_SUBPAGES.map(([id]) => id));

/** Keyboard family — Utilities → Keyboard submenu (Basics + Media). */
const KEYBOARD_SUBPAGES = [
  ['keyboard', 'doc.keyboard.nav.basics'],
  ['keyboard-media', 'doc.keyboard.nav.media'],
] as const;

const KEYBOARD_CHILD_IDS = new Set<string>(KEYBOARD_SUBPAGES.map(([id]) => id));

/**
 * Cards family variants (k3ux) — nested under Containment → Cards.
 * k3ui: the main Cards page (`card`) is a normal leaf, no Standard submenu.
 */
const CARD_VARIANT_SUBPAGES = [
  ['card-holo', 'doc.cards.nav.holo'],
  ['card-lenticular', 'doc.cards.nav.lenticular'],
  ['card-scratch', 'doc.cards.nav.scratch'],
] as const;

const CARD_VARIANT_IDS = new Set<string>(CARD_VARIANT_SUBPAGES.map(([id]) => id));

/** Card effect leaves visible for the active docs pack (k3ux only). */
function cardSubpagesForProduct(): readonly (readonly [string, string])[] {
  return CARD_VARIANT_SUBPAGES.filter(([id]) => !!findComponent(id));
}

/** Nested `k3-menu-item` — Containment → Cards → holo / lenticular / scratch. */
function makeCardsFamilyMenuItem(
  pageId: string,
  selectCurrent: boolean,
): HTMLElement {
  const resolved = articlePageId(pageId);
  const cardsParent = document.createElement('k3-menu-item');
  cardsParent.setAttribute('value', 'cards');
  cardsParent.setAttribute('has-submenu', '');
  cardsParent.slot = 'submenu';
  cardsParent.append(menuItemIcon('dashboard'), t('doc.cards.title'));
  appendEnSupporting(cardsParent, 'doc.cards.title');
  if (selectCurrent && isCardFamilyPage(pageId)) {
    cardsParent.setAttribute('selected', '');
  }
  for (const [value, labelKey] of cardSubpagesForProduct()) {
    const child = document.createElement('k3-menu-item');
    child.setAttribute('value', value);
    child.slot = 'submenu';
    child.append(
      menuItemIcon(iconForComponent(value, 'Containment')),
      t(labelKey),
    );
    appendEnSupporting(child, labelKey);
    if (selectCurrent && resolved === value) child.setAttribute('selected', '');
    cardsParent.appendChild(child);
  }
  return cardsParent;
}

/** Resolve legacy hashes → title-aligned slugs (Family-Type). */
function articlePageId(hashId: string): string {
  return resolvePageId(hashId);
}

function isColorFamilyPage(hashId: string): boolean {
  return COLOR_CHILD_IDS.has(articlePageId(hashId));
}

function isKeyboardFamilyPage(hashId: string): boolean {
  return KEYBOARD_CHILD_IDS.has(articlePageId(hashId));
}

function isCardFamilyPage(hashId: string): boolean {
  return CARD_VARIANT_IDS.has(articlePageId(hashId));
}

function setCeProp(el: HTMLElement, prop: string, attr: string, value: string): void {
  const target = el as HTMLElement & Record<string, unknown>;
  if (prop in target) target[prop] = value;
  else el.setAttribute(attr, value);
}

/** Demo PIN — each `[data-pin-code]` validates on complete (success / error). */
function wirePinSuccessDemo(): void {
  type PinDemo = HTMLElement & {
    success: (message?: string) => void;
    error: string;
  };
  document.querySelectorAll<PinDemo>('k3-pin-field[data-pin-code]').forEach((el) => {
    if (el.dataset.pinSuccessWired === '1') return;
    el.dataset.pinSuccessWired = '1';
    const expected = (el.dataset.pinCode ?? '').toUpperCase();
    el.addEventListener('k3-complete', ((e: CustomEvent<{ value: string }>) => {
      const value = (e.detail?.value ?? '').toUpperCase();
      if (value === expected) {
        el.success(t('playground.demo.pin.success.message'));
      } else {
        el.error = t('playground.demo.pin.error.message');
      }
    }) as EventListener);
  });
}

function applyPlaygroundI18n(): void {
  /* Ensure sponsors DOM exists before translating data-i18n nodes */
  mountSponsors();
  watchLighthouse();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key || el.children.length > 0) return;
    const text = t(key);
    if (el.textContent !== text) el.textContent = text;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    setCeProp(el, 'placeholder', 'placeholder', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-label');
    if (!key) return;
    setCeProp(el, 'label', 'label', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt');
    if (!key) return;
    el.setAttribute('alt', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (!key) return;
    el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-content]').forEach((el) => {
    const key = el.getAttribute('data-i18n-content');
    if (!key) return;
    setCeProp(el, 'content', 'content', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    el.setAttribute('title', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-supporting-text]').forEach((el) => {
    const key = el.getAttribute('data-i18n-supporting-text');
    if (!key) return;
    setCeProp(el, 'supportingText', 'supporting-text', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-error]').forEach((el) => {
    const key = el.getAttribute('data-i18n-error');
    if (!key) return;
    setCeProp(el, 'error', 'error', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-success-text]').forEach((el) => {
    const key = el.getAttribute('data-i18n-success-text');
    if (!key) return;
    setCeProp(el, 'successText', 'success-text', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-value]').forEach((el) => {
    const key = el.getAttribute('data-i18n-value');
    if (!key) return;
    setCeProp(el, 'value', 'value', t(key));
  });
  syncLocaleMenu();
  syncThemeControls();
  syncMotionControls();
  syncDirControl();
  syncSettingsSheet();
  buildPrimaryNav();
  buildNavMenu();
  buildCatalogGrid();
  fillScrollbarDemo();
  const page = articlePageId(currentPageId());
  syncDocNav(page);
  if (page === 'color-roles') renderColorRoles();
}

/** Utilities · Scrollbar demo lines (i18n). */
function fillScrollbarDemo(): void {
  const host = document.getElementById('scrollbar-demo');
  if (!host) return;
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= 24; i++) {
    const p = document.createElement('p');
    p.className = 'scrollbar-demo-line';
    p.textContent = t('doc.scrollbar.demo.line', { n: i });
    frag.append(p);
  }
  host.replaceChildren(frag);
}

function currentLocale(): PlaygroundLocale {
  /* Prefer stored menu selection (region tags like nl-BE) over i18n language. */
  const stored = docStore.get(DocKeys.uiLocale, 'fr') as string;
  if (isPlaygroundLocale(stored)) return stored;
  const fromI18n = window.K3UI?.i18n.locale as string | undefined;
  return isPlaygroundLocale(fromI18n ?? '') ? (fromI18n as PlaygroundLocale) : 'fr';
}

/** Locale rows live in the split trail menu (shadow-adopted). */
function localeMenuItems(): HTMLElement[] {
  const menu = document.getElementById('locale-menu')?.shadowRoot?.querySelector('k3-menu');
  return menu ? [...menu.querySelectorAll<HTMLElement>('[data-locale]')] : [];
}

function syncLocaleMenu(): void {
  const locale = currentLocale();
  for (const item of localeMenuItems()) {
    const on = item.getAttribute('data-locale') === locale;
    item.toggleAttribute('selected', on);
    (item as HTMLElement & { selected?: boolean }).selected = on;
  }
  syncLocaleLeadingFlag(locale);
}

/** Set a Material Symbol without a text node (Chrome Translate-safe). */
function setMsIcon(el: HTMLElement | null, name: string): void {
  if (!el) return;
  el.classList.add('ms', 'notranslate');
  el.setAttribute('translate', 'no');
  el.setAttribute('lang', 'zxx');
  el.setAttribute('data-k3-icon', name);
  el.textContent = '';
}

function syncThemeControls(): void {
  syncSettingsSheet();
  syncColorModeButtons();
}

function syncMotionControls(): void {
  syncSettingsSheet();
}

function syncDirControl(): void {
  syncSettingsSheet();
}

function setMotionScheme(scheme: MotionScheme): void {
  motionScheme = scheme;
  applyThemePersist();
  syncSettingsSheet();
}

type SettingsSheet = HTMLElement & {
  show: () => Promise<boolean>;
  hide: (source?: string) => Promise<boolean>;
  open: boolean;
};

function settingsSheet(): SettingsSheet | null {
  return document.getElementById('settings-sheet') as SettingsSheet | null;
}

/** Selected = filled (primary) · idle = tonal — readable toggle in the sheet. */
function syncSettingsToggle(
  el: HTMLElement,
  on: boolean,
): void {
  el.toggleAttribute('selected', on);
  const btn = el as HTMLElement & { selected?: boolean; variant?: string };
  btn.selected = on;
  if ('variant' in btn) btn.variant = on ? 'filled' : 'tonal';
}

/** Mirror all prefs into the settings sheet controls. */
function syncSettingsSheet(): void {
  const tip = document.getElementById('tip-settings') as HTMLElement & {
    content?: string;
  } | null;
  const tipLabel = t('playground.ctrl.settings');
  if (tip) {
    tip.content = tipLabel;
    tip.setAttribute('content', tipLabel);
  }
  const btn = document.getElementById('btn-settings');
  if (btn) btn.setAttribute('label', tipLabel);

  document.querySelectorAll<HTMLElement>('[data-settings-theme]').forEach((el) => {
    syncSettingsToggle(el, el.getAttribute('data-settings-theme') === themeMode);
  });

  const spec = document.getElementById('settings-spec') as (HTMLElement & { value?: string }) | null;
  if (spec && spec.value !== colorSpec) spec.value = colorSpec;

  document.querySelectorAll<HTMLElement>('[data-settings-variant]').forEach((el) => {
    syncSettingsToggle(el, el.getAttribute('data-settings-variant') === colorVariant);
  });

  document.querySelectorAll<HTMLElement>('[data-settings-contrast]').forEach((el) => {
    syncSettingsToggle(el, el.getAttribute('data-settings-contrast') === contrastLevel);
  });

  document.querySelectorAll<HTMLElement>('[data-settings-motion]').forEach((el) => {
    syncSettingsToggle(el, el.getAttribute('data-settings-motion') === motionScheme);
  });

    const dir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
  document.querySelectorAll<HTMLElement>('[data-settings-dir]').forEach((el) => {
    syncSettingsToggle(el, el.getAttribute('data-settings-dir') === dir);
  });

  const anim = document.getElementById('settings-animations') as
    | (HTMLElement & { selected?: boolean })
    | null;
  if (anim) anim.selected = animationsOn;

  const snowSw = document.getElementById('settings-snow') as
    | (HTMLElement & { selected?: boolean })
    | null;
  if (snowSw) snowSw.selected = shellSnowOn;

  const grid = document.getElementById('settings-grid') as
    | (HTMLElement & { selected?: boolean })
    | null;
  if (grid) grid.selected = gridOn;

  const audioSw = document.getElementById('settings-audio') as
    | (HTMLElement & { selected?: boolean })
    | null;
  if (audioSw) audioSw.selected = isAudioEnabled();

  const musicSw = document.getElementById('settings-music') as
    | (HTMLElement & { selected?: boolean })
    | null;
  if (musicSw) musicSw.selected = isMusicEnabled();

  applyContainerLayout();

  const seed = seeds[seedIdx] ?? seeds[0]!;
  const seedNorm = (normalizeHex(seed) ?? seed).toUpperCase();
  document.querySelectorAll<HTMLElement>('[data-settings-seed]').forEach((el) => {
    const hex = normalizeHex(el.getAttribute('data-settings-seed') ?? '') ?? '';
    const on = hex.toUpperCase() === seedNorm;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/** MD2 hue ladder — each family at tone 500 (Material Design 2014 order). */
function mountSettingsMd2SeedPresets(): void {
  const host = document.getElementById('settings-seed-presets');
  if (!host || host.dataset.md2Mounted === '1') return;
  host.dataset.md2Mounted = '1';
  host.innerHTML = M2_PALETTE_NAMES.map((name) => {
    const hex = M2_PALETTES[name]['500'];
    if (!hex) return '';
    const label = name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `<k3-tooltip position="top" content="${label}"><button type="button" class="settings-seed-preset k3-focus-ring" data-settings-seed="${hex}" style="--preset:${hex}" aria-label="${label}" aria-pressed="false"></button></k3-tooltip>`;
  }).join('');
}

async function openSettingsSheet(): Promise<void> {
  await registry.register('k3-sheet');
  await registry.register('k3-card');
  await registry.register('k3-button');
  await registry.register('k3-button-group');
  await registry.register('k3-tooltip');
  await registry.register('k3-switch');
  await registry.register('k3-select');
  mountSettingsMd2SeedPresets();
  syncSettingsSheet();
  applyPlaygroundI18n();
  const sheet = settingsSheet();
  if (sheet && typeof sheet.show === 'function') await sheet.show();
}

function applyAnimationsPreference(): void {
  const root = document.documentElement;
  if (animationsOn) root.removeAttribute('data-k3-reduce-motion');
  else root.setAttribute('data-k3-reduce-motion', '');
  docStore.set(DocKeys.uiAnimations, animationsOn);
  syncMotionControls();
  void applyShellSnow();
}

type ShellSnowHost = HTMLElement & {
  start?: () => void;
  stop?: () => void;
  reset?: () => void;
  teardown?: () => void;
  isRunning?: boolean;
  disableForReducedMotion?: boolean;
};

function shellSnowEl(): ShellSnowHost | null {
  return document.getElementById('shell-snow') as ShellSnowHost | null;
}

/** Demo-only host on the Snow page — never the shell overlay. */
function demoSnowEl(): ShellSnowHost | null {
  return document.getElementById('demo-snow') as ShellSnowHost | null;
}

/** Tear down a snow host (clear + remove lib canvas). */
function teardownSnowHost(host: ShellSnowHost | null): void {
  if (!host) return;
  if (typeof host.teardown === 'function') host.teardown();
  else host.reset?.();
}

/** Remove any leftover fullscreen snow canvases (orphans from races / old sessions). */
function purgeSnowLibCanvases(): void {
  document
    .querySelectorAll('canvas[data-k3-snow="lib"]')
    .forEach((node) => node.remove());
}

/** True only when the Snow article is the visible page. */
function isSnowDemoPageActive(): boolean {
  if (articlePageId(currentPageId()) !== 'snow') return false;
  const page = document.getElementById('page-snow');
  return !!page && !page.hidden;
}

/** Clear page demo snow when leaving the Snow article. */
function pauseDemoSnow(): void {
  teardownSnowHost(demoSnowEl());
  /* Demo must not leave a body canvas behind after navigation. */
  if (!shellSnowOn || !animationsOn) purgeSnowLibCanvases();
}

/**
 * Settings snow → `#shell-snow` on every page except Snow.
 * Never drives `#demo-snow`. When off (or on Snow page), shell is fully torn down.
 */
async function applyShellSnow(
  pageId: string = articlePageId(currentPageId()),
): Promise<void> {
  shellSnowOn = shellSnowOn === true;
  docStore.set(DocKeys.uiSnow, shellSnowOn);
  const onSnowDemoPage = articlePageId(pageId) === 'snow';
  /* Preference can stay ON while browsing Snow — shell overlay is suppressed there. */
  const want = shellSnowOn && animationsOn && !onSnowDemoPage;
  if (want) await ensureK3ux();
  const host = shellSnowEl();
  if (want) {
    if (!host) return;
    await customElements.whenDefined('k3-snow');
    host.disableForReducedMotion = false;
    host.start?.();
    return;
  }
  /* Off / suppressed: tear down shell; also kill a runaway demo if we're not on Snow. */
  teardownSnowHost(host);
  if (!onSnowDemoPage) {
    teardownSnowHost(demoSnowEl());
    purgeSnowLibCanvases();
  }
}

const MUSIC_MUTE_KEY = 'k3-music-muted';

/** Interaction SFX on (Audio true) — inverse of SFX mute. */
function isAudioEnabled(): boolean {
  return !getSoundFx().isMuted();
}

/** Music player on (Music true) — inverse of music mute storage. */
function isMusicEnabled(): boolean {
  try {
    const v = localStorage.getItem(MUSIC_MUTE_KEY);
    return v !== '1' && v !== 'true';
  } catch {
    return true;
  }
}

/** Enable / mute interaction Sound FX (settings Audio). */
function setAudioEnabled(on: boolean): void {
  getSoundFx().setMuted(!on);
  document.querySelectorAll('k3-sound-fx').forEach((el) => {
    const host = el as HTMLElement & { setMuted?: (m: boolean) => void };
    host.setMuted?.(!on);
  });
}

/** Enable / mute music players (settings Music). */
function setMusicEnabled(on: boolean): void {
  try {
    localStorage.setItem(MUSIC_MUTE_KEY, on ? '0' : '1');
  } catch {
    /* private mode */
  }
  document.querySelectorAll('k3-audio-player').forEach((el) => {
    const host = el as HTMLElement & { setMusicMuted?: (m: boolean) => void };
    host.setMusicMuted?.(!on);
  });
}

function setThemeMode(mode: ColorMode): void {
  themeMode = mode;
  applyThemePersist();
  syncThemeControls();
  syncColorModeButtons();
}

function setLocale(locale: PlaygroundLocale): void {
  const meta = localeMenuEntry(locale);
  window.K3UI?.i18n.setLocale(meta.i18n);
  docStore.set(DocKeys.uiLocale, locale);
  document.documentElement.lang = meta.htmlLang;
  syncLocaleMenu();
}

function navMode(): 'bar' | 'rail' {
  // Phone → bar; tablet & desktop → rail (single-pane docs)
  return matchMedia(MQ_COMPACT).matches ? 'bar' : 'rail';
}

function applyAdaptiveShell(): void {
  const app = document.querySelector('.app');
  const mode = navMode();
  const medium = matchMedia(MQ_MEDIUM).matches;
  app?.setAttribute('data-nav', mode);
  app?.setAttribute('data-size', medium ? 'medium' : mode === 'bar' ? 'compact' : 'expanded');

  /* Mirror on <html> — fixed shell chrome is outside .app and needs the inset. */
  const root = document.documentElement;
  if (mode === 'bar') {
    root.style.setProperty(
      '--k3-nav-chrome-inset-block-end',
      'calc(4rem + env(safe-area-inset-bottom, 0px))',
    );
  } else {
    root.style.setProperty('--k3-nav-chrome-inset-block-end', '0px');
  }
  syncShellRailInlineSize();

  /* Phone: only smartphone variant — undock demo sticky toolbar if pinned. */
  if (mode === 'bar') {
    document.querySelectorAll('k3-audio-player[dock-toggle]').forEach((node) => {
      const player = node as HTMLElement & { variant?: string };
      if (player.variant === 'sticky') player.variant = 'toolbar';
    });
  }

  const bar = document.getElementById('nav-bar') as HTMLElement & { layout?: string } | null;
  // Compact phone: vertical items; medium tablet with bar fallback would be horizontal —
  // we use rail on tablet, so bar stays vertical for phone only.
  if (bar) bar.layout = 'vertical';
  syncShellSecondarySurface(mode);
}

/**
 * Publish rail width on <html> so fixed sticky players stay in the content band
 * (compact 104dp · expanded 256dp) — never over the navigation-rail.
 */
function syncShellRailInlineSize(): void {
  const root = document.documentElement;
  if (navMode() === 'bar') {
    root.style.setProperty('--k3-shell-rail-inline-size', '0px');
    return;
  }
  const rail = document.getElementById('nav-rail');
  const w = rail?.getBoundingClientRect().width ?? 0;
  root.style.setProperty('--k3-shell-rail-inline-size', `${Math.round(w)}px`);
}

type ShellNavItem = HTMLElement & {
  icon: string;
  label: string;
  href: string;
  /** M3 badge label on the icon (e.g. component count). */
  badge: string;
  active: boolean;
  /** Secondary menu/sheet open — hover pill without stealing selected. */
  menuOpen: boolean;
  layout: string;
  updateComplete: Promise<boolean>;
};

/** Catalog leaf count under Components (Buttons…Navigation) — rail/bar badge. */
function componentCatalogCount(): number {
  return COMPONENT_MENU_GROUPS.reduce(
    (n, g) => n + componentsInCategory(g.category).length,
    0,
  );
}

/** Leaf count for a destination badge (utilities / animations / styles / resources). */
function destinationCatalogCount(destId: string): number {
  switch (destId) {
    case 'components':
      return componentCatalogCount();
    case 'utilities':
      return componentsInCategory('Utilities').length;
    case 'animations':
      return componentsInCategory('Animation').length;
    case 'styles':
      return componentsInCategory('Styles').length;
    case 'resources':
      return RESOURCE_PAGES.length;
    default:
      return 0;
  }
}

/** Rail expanded → horizontal pills · compact rail / bar → vertical. */
function layoutForNavHost(host: HTMLElement): 'vertical' | 'horizontal' {
  if (host.localName !== 'k3-nav-rail') return 'vertical';
  if (
    host.getAttribute('size') === 'large' ||
    host.hasAttribute('expanded') ||
    host.getAttribute('mode') === 'expanded'
  ) {
    return 'horizontal';
  }
  return 'vertical';
}

/** Keep rail/bar items in place so select pill can scaleX (no destroy/recreate). */
function syncPrimaryItems(host: HTMLElement): ShellNavItem[] {
  const slotted = new Set(
    [...host.querySelectorAll('[slot]')].map((el) => el as Element),
  );
  let items = [...host.querySelectorAll('k3-nav-item')].filter(
    (el) => !slotted.has(el),
  ) as ShellNavItem[];
  const layout = layoutForNavHost(host);

  while (items.length > NAV_DESTINATIONS.length) {
    items.pop()?.remove();
    items = [...host.querySelectorAll('k3-nav-item')].filter(
      (el) => !slotted.has(el),
    ) as ShellNavItem[];
  }
  while (items.length < NAV_DESTINATIONS.length) {
    const el = document.createElement('k3-nav-item') as ShellNavItem;
    el.layout = layout;
    el.active = false;
    host.appendChild(el);
    items.push(el);
  }

  const visible = new Set(navDestinationsForProduct(getDocProduct()).map((d) => d.id));
  NAV_DESTINATIONS.forEach((dest, i) => {
    const el = items[i]!;
    el.hidden = !visible.has(dest.id);
    el.icon = dest.icon;
    el.label = t(dest.labelKey);
    /* Direct pages keep href; menu destinations stay empty (open secondary menu) */
    el.href = dest.href || '';
    const count = destinationCatalogCount(dest.id);
    el.badge = count > 0 ? String(count) : '';
    el.layout = layout;
  });
  return items;
}

function armPrimarySelection(items: ShellNavItem[], activeIdx: number): void {
  armNavActive(items as unknown as K3NavItem[], activeIdx, true);
}

function buildPrimaryNav(): void {
  const rail = document.getElementById('nav-rail');
  const bar = document.getElementById('nav-bar');
  if (!rail || !bar) return;

  const pageId = currentPageId();
  const activeDest = destinationForPage(pageId, (id) => findComponent(id)?.category);
  const activeIdx = activeDest
    ? NAV_DESTINATIONS.findIndex((d) => d.id === activeDest.id)
    : -1;

  const railItems = syncPrimaryItems(rail);
  const barItems = syncPrimaryItems(bar);

  const railHost = rail as HTMLElement & { active: number };
  const barHost = bar as HTMLElement & { active: number };
  const prevIdx = railHost.active;
  const selectionChanged = prevIdx !== activeIdx;
  const needsArm = railItems.some((el, i) => el.active !== (i === activeIdx));

  railHost.active = activeIdx;
  barHost.active = activeIdx;

  /* Parent armActive runs when index changes; otherwise arm after Lit paint */
  if (!selectionChanged && needsArm) {
    armPrimarySelection(railItems, activeIdx);
    armPrimarySelection(barItems, activeIdx);
  }
}

type ShellNavMenu = HTMLElement & {
  show: (
    focus?: 'menu' | 'none',
    opts?: { fast?: boolean },
  ) => Promise<boolean>;
  hide: (source?: string, opts?: { fast?: boolean }) => Promise<boolean>;
  open: boolean;
  position: string;
  updateComplete: Promise<boolean>;
  armDismissGuard?: (ms?: number) => void;
  positioningAnchor?: HTMLElement | null;
  positioningEdge?: HTMLElement | null;
  refit?: () => void;
};

/** Serialize rail menu open/toggle so overlapping clicks cannot fight. */
let shellMenuLock: Promise<void> = Promise.resolve();

type ShellMenuItem = HTMLElement & {
  openSubmenu: (opts?: { focusFirst?: boolean }) => void;
};

/** Live nav-item for positioning the secondary menu (from the clicked / hovered item). */
let pendingMenuAnchor: HTMLElement | null = null;
/** Dest id currently shown in the compact bottom sheet (toggle-to-close). */
let openSheetDestId: string | null = null;
/** Dest id currently shown in the rail secondary menu (toggle-to-close). */
let openMenuDestId: string | null = null;

type ShellNavSheet = HTMLElement & {
  open: boolean;
  show: () => Promise<boolean>;
  hide: (source?: string) => Promise<boolean>;
};

function shellNavMenu(): ShellNavMenu | null {
  return document.getElementById('shell-nav-menu') as ShellNavMenu | null;
}

function shellNavSheet(): ShellNavSheet | null {
  return document.getElementById('shell-nav-sheet') as ShellNavSheet | null;
}

/** Safe CE method call — element may exist before customElements.define. */
function callHide(el: { hide?: (source?: string) => unknown } | null): void {
  if (typeof el?.hide === 'function') void el.hide('user');
}

/**
 * Mirror open secondary menu/sheet onto the matching primary nav-item.
 * Keeps the M3 state-layer pill (not selected) while the flyout is open.
 */
function syncNavMenuOpenHighlight(): void {
  const openId = openMenuDestId ?? openSheetDestId;
  for (const hostId of ['nav-rail', 'nav-bar'] as const) {
    const host = document.getElementById(hostId);
    if (!host) continue;
    const slotted = new Set(
      [...host.querySelectorAll('[slot]')].map((el) => el as Element),
    );
    const items = [...host.querySelectorAll('k3-nav-item')].filter(
      (el) => !slotted.has(el),
    ) as ShellNavItem[];
    NAV_DESTINATIONS.forEach((dest, i) => {
      const el = items[i];
      if (!el) return;
      el.menuOpen = openId === dest.id;
    });
  }
}

function closeShellNavMenu(): void {
  openSheetDestId = null;
  openMenuDestId = null;
  callHide(shellNavMenu());
  callHide(shellNavSheet());
  syncNavMenuOpenHighlight();
}

/**
 * Rail → menu host · bar → sheet host.
 * Prefer [hidden] over CSS display:none on the inactive CE.
 */
function syncShellSecondarySurface(mode: 'bar' | 'rail' = navMode()): void {
  const menu = shellNavMenu();
  const sheet = shellNavSheet();
  let cleared = false;
  if (menu) {
    menu.hidden = mode === 'bar';
    if (mode === 'bar' && menu.open) {
      callHide(menu);
      openMenuDestId = null;
      cleared = true;
    }
  }
  if (sheet) {
    sheet.hidden = mode === 'rail';
    if (mode === 'rail' && sheet.open) {
      callHide(sheet);
      openSheetDestId = null;
      cleared = true;
    }
  }
  if (cleared) syncNavMenuOpenHighlight();
}

/**
 * Bind the shell secondary menu to a rail item + rail edge, then refit.
 * Prefer live `positioningAnchor` / `positioningEdge` over host top/left —
 * `hide()` clears those fields, so callers must re-bind after every show.
 */
function bindShellNavMenuAnchor(item: HTMLElement | null): void {
  const menu = shellNavMenu();
  if (!menu) return;
  menu.position = 'end-start';
  const rail = document.getElementById('nav-rail');
  menu.positioningAnchor = item;
  menu.positioningEdge = rail;
  /* Clear legacy host offsets — panel fit owns placement */
  menu.style.top = '';
  menu.style.left = '';
  menu.style.right = '';
  if (menu.open) menu.refit?.();
}

function sheetNavLink(comp: DocComponent, pageId: string): HTMLElement {
  const a = document.createElement('a');
  a.className = 'shell-sheet-link';
  a.href = `#/${comp.id}`;
  a.dataset.value = comp.id;
  if (comp.id === pageId) {
    a.classList.add('is-active');
    a.setAttribute('aria-current', 'page');
  }
  const icon = document.createElement('span');
  icon.className = 'ms';
  setMsIcon(icon, iconForComponent(comp.id, comp.category));
  a.append(icon, sheetLabel(comp.titleKey));
  return a;
}

function menuItemIcon(name: string): HTMLElement {
  const icon = document.createElement('span');
  icon.slot = 'icon';
  setMsIcon(icon, name);
  return icon;
}

/** Leaf item — selected only when it is the current page (never a “default” pick). */
function leafMenuItem(
  comp: DocComponent,
  pageId: string,
  opts?: { slot?: string; selectCurrent?: boolean; icon?: boolean },
): HTMLElement {
  const item = document.createElement('k3-menu-item');
  item.setAttribute('value', comp.id);
  if (opts?.slot) item.slot = opts.slot;
  const withIcon = opts?.icon !== false;
  if (withIcon) {
    item.append(menuItemIcon(iconForComponent(comp.id, comp.category)));
  }
  item.append(t(comp.titleKey));
  appendEnSupporting(item, comp.titleKey);
  if (opts?.selectCurrent && comp.id === pageId) item.setAttribute('selected', '');
  return item;
}

function resolveSecondaryDest(destId?: string | null): (typeof NAV_DESTINATIONS)[number] {
  const pageId = currentPageId();
  const pageDest = destinationForPage(pageId, (id) => findComponent(id)?.category);
  let id = destId ?? pageDest?.id ?? 'components';
  const candidate = NAV_DESTINATIONS.find((d) => d.id === id);
  if (!candidate || candidate.href) id = 'components';
  return (
    NAV_DESTINATIONS.find((d) => d.id === id) ??
    NAV_DESTINATIONS.find((d) => d.id === 'components')!
  );
}

/**
 * Compact (nav bar): M3 modal bottom sheet for secondary destinations.
 * Categories expand in-place — no flyout above the bar.
 */
async function openShellNavSheet(destId: string): Promise<void> {
  await registry.register('k3-sheet');
  const sheet = shellNavSheet();
  if (!sheet) return;

  if (sheet.open && openSheetDestId === destId) {
    if (typeof sheet.hide === 'function') await sheet.hide('user');
    openSheetDestId = null;
    syncNavMenuOpenHighlight();
    return;
  }

  callHide(shellNavMenu());
  openMenuDestId = null;
  sheet.hidden = false;
  buildNavSheet(destId);
  openSheetDestId = destId;
  syncNavMenuOpenHighlight();
  if (typeof sheet.show === 'function') await sheet.show();
}

/** Fill the compact bottom sheet with Components groups or Styles links. */
function buildNavSheet(destId: string): void {
  const sheet = shellNavSheet();
  const titleEl = document.getElementById('shell-nav-sheet-title');
  const body = document.getElementById('shell-nav-sheet-body');
  if (!sheet || !body) return;

  const openDest = resolveSecondaryDest(destId);
  const pageId = currentPageId();
  const pageDest = destinationForPage(pageId, (id) => findComponent(id)?.category);
  const selectCurrent = pageDest?.id === openDest.id;
  const pageCat =
    selectCurrent && openDest.id === 'components'
      ? findComponent(pageId)?.category
      : undefined;

  const label = t(openDest.labelKey);
  sheet.setAttribute('aria-label', label);
  if (titleEl) titleEl.textContent = label;

  const nav = document.createElement('nav');
  nav.className = 'shell-sheet-nav';
  nav.setAttribute('aria-label', label);

  if (openDest.id === 'components') {
    for (const group of COMPONENT_MENU_GROUPS.filter(
      (g) => componentsInCategory(g.category).length > 0,
    )) {
      const groupEl = document.createElement('div');
      groupEl.className = 'shell-sheet-group';
      groupEl.dataset.category = group.category;
      if (pageCat === group.category) groupEl.classList.add('is-open');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shell-sheet-group-btn';
      btn.setAttribute('aria-expanded', pageCat === group.category ? 'true' : 'false');
      const panelId = `shell-sheet-panel-${group.category.replace(/\s+/g, '-')}`;
      btn.setAttribute('aria-controls', panelId);

      const icon = document.createElement('span');
      icon.className = 'ms';
      setMsIcon(icon, group.icon);
      const name = sheetLabel(group.labelKey);
      const chevron = document.createElement('span');
      chevron.className = 'ms chevron';
      setMsIcon(chevron, 'expand_more');
      btn.append(icon, name, chevron);

      const ul = document.createElement('ul');
      ul.className = 'shell-sheet-children';
      ul.id = panelId;
      ul.hidden = pageCat !== group.category;

      if (group.category === 'Containment' && cardSubpagesForProduct().length) {
        const peers = componentsInCategory('Containment').filter(
          (c) => !CARD_VARIANT_IDS.has(c.id),
        );
        const wrap = document.createElement('li');
        wrap.className = 'shell-sheet-cards-wrap';
        const cardsGroup = document.createElement('div');
        cardsGroup.className = 'shell-sheet-group';
        if (selectCurrent && isCardFamilyPage(pageId)) {
          cardsGroup.classList.add('is-open');
        }
        const cardsPanelId = 'shell-sheet-panel-cards';
        const cardsPanel = document.createElement('ul');
        cardsPanel.className = 'shell-sheet-children';
        cardsPanel.id = cardsPanelId;
        const resolved = articlePageId(pageId);
        for (const [hash, labelKey] of cardSubpagesForProduct()) {
          const cli = document.createElement('li');
          const a = document.createElement('a');
          a.className = 'shell-sheet-link';
          a.href = `#/${hash}`;
          const cardLeafIcon = document.createElement('span');
          cardLeafIcon.className = 'ms';
          setMsIcon(cardLeafIcon, iconForComponent(hash, 'Containment'));
          a.append(cardLeafIcon, sheetLabel(labelKey));
          if (selectCurrent && resolved === hash) {
            a.classList.add('is-active');
            a.setAttribute('aria-current', 'page');
          }
          cli.append(a);
          cardsPanel.append(cli);
        }
        const cardsBtn = document.createElement('button');
        cardsBtn.type = 'button';
        cardsBtn.className = 'shell-sheet-group-btn';
        cardsBtn.setAttribute(
          'aria-expanded',
          selectCurrent && isCardFamilyPage(pageId) ? 'true' : 'false',
        );
        cardsBtn.setAttribute('aria-controls', cardsPanelId);
        const cardsIcon = document.createElement('span');
        cardsIcon.className = 'ms';
        setMsIcon(cardsIcon, 'dashboard');
        cardsBtn.append(cardsIcon, sheetLabel('doc.cards.title'));
        const cardsChevron = document.createElement('span');
        cardsChevron.className = 'ms chevron';
        setMsIcon(cardsChevron, 'expand_more');
        cardsBtn.append(cardsChevron);
        cardsBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const open = !cardsGroup.classList.contains('is-open');
          cardsGroup.classList.toggle('is-open', open);
          cardsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        cardsGroup.append(cardsBtn, cardsPanel);
        wrap.append(cardsGroup);

        let cardsInserted = false;
        for (const c of peers) {
          if (
            !cardsInserted &&
            c.title.localeCompare('Cards', 'en', { sensitivity: 'base' }) > 0
          ) {
            ul.append(wrap);
            cardsInserted = true;
          }
          const li = document.createElement('li');
          li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
          ul.append(li);
        }
        if (!cardsInserted) ul.append(wrap);
      } else {
      for (const c of componentsInCategory(group.category)) {
        const li = document.createElement('li');
        li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
        ul.append(li);
        }
      }
      groupEl.append(btn, ul);
      nav.append(groupEl);
    }
  } else if (openDest.id === 'utilities') {
    const ul = document.createElement('ul');
    ul.className = 'shell-sheet-nav';
    let keyboardGroupDone = false;
    for (const c of componentsInCategory('Utilities')) {
      if (KEYBOARD_CHILD_IDS.has(c.id)) {
        if (keyboardGroupDone) continue;
        keyboardGroupDone = true;
        const groupEl = document.createElement('div');
        groupEl.className = 'shell-sheet-group';
        if (selectCurrent && isKeyboardFamilyPage(pageId)) {
          groupEl.classList.add('is-open');
        }

        const panelId = 'shell-sheet-panel-keyboard';
        const panel = document.createElement('ul');
        panel.id = panelId;
        panel.hidden = !(selectCurrent && isKeyboardFamilyPage(pageId));
        const resolved = articlePageId(pageId);
        for (const [hash, labelKey] of KEYBOARD_SUBPAGES) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.className = 'shell-sheet-link';
          a.href = `#/${hash}`;
          const kIcon = document.createElement('span');
          kIcon.className = 'ms';
          setMsIcon(kIcon, iconForComponent(hash, 'Utilities'));
          a.append(kIcon, sheetLabel(labelKey));
          if (selectCurrent && resolved === hash) {
            a.classList.add('is-active');
            a.setAttribute('aria-current', 'page');
          }
          li.append(a);
          panel.append(li);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shell-sheet-group-btn';
        btn.setAttribute(
          'aria-expanded',
          selectCurrent && isKeyboardFamilyPage(pageId) ? 'true' : 'false',
        );
        btn.setAttribute('aria-controls', panelId);
        const icon = document.createElement('span');
        icon.className = 'ms';
        setMsIcon(icon, 'keyboard');
        const name = sheetLabel('doc.keyboard.title');
        const chevron = document.createElement('span');
        chevron.className = 'ms chevron';
        setMsIcon(chevron, 'expand_more');
        btn.append(icon, name, chevron);
        btn.addEventListener('click', () => {
          const open = !groupEl.classList.contains('is-open');
          groupEl.classList.toggle('is-open', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          panel.hidden = !open;
        });

        groupEl.append(btn, panel);
        nav.append(groupEl);
        continue;
      }
      const li = document.createElement('li');
      li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
      ul.append(li);
    }
    if (ul.childElementCount) nav.append(ul);
  } else if (openDest.id === 'animations') {
    const ul = document.createElement('ul');
    ul.className = 'shell-sheet-nav';
    for (const c of componentsInCategory('Animation')) {
      const li = document.createElement('li');
      li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
      ul.append(li);
    }
    if (ul.childElementCount) nav.append(ul);
  } else if (openDest.id === 'resources') {
    const ul = document.createElement('ul');
    ul.className = 'shell-sheet-nav';
    for (const page of RESOURCE_PAGES) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'shell-sheet-link';
      a.href = `#/${page.id}`;
      a.dataset.value = page.id;
      if (selectCurrent && pageId === page.id) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      const icon = document.createElement('span');
      icon.className = 'ms';
      setMsIcon(icon, page.icon);
      a.append(icon, sheetLabel(page.labelKey));
      li.append(a);
      ul.append(li);
    }
    if (ul.childElementCount) nav.append(ul);
  } else {
    /* Styles — Color expands to Roles / Palettes / Additional */
    const ul = document.createElement('ul');
    ul.className = 'shell-sheet-nav';
    let colorGroupDone = false;
    for (const c of componentsInCategory('Styles')) {
      if (COLOR_CHILD_IDS.has(c.id)) {
        if (colorGroupDone) continue;
        colorGroupDone = true;
        const groupEl = document.createElement('div');
        groupEl.className = 'shell-sheet-group';
        if (selectCurrent && isColorFamilyPage(pageId)) groupEl.classList.add('is-open');

        const panelId = 'shell-sheet-panel-colors';
        const panel = document.createElement('ul');
        panel.id = panelId;
        panel.hidden = !(selectCurrent && isColorFamilyPage(pageId));
        const resolved = articlePageId(pageId);
        for (const [hash, labelKey] of COLOR_SUBPAGES) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.className = 'shell-sheet-link';
          a.href = `#/${hash}`;
          const cIcon = document.createElement('span');
          cIcon.className = 'ms';
          setMsIcon(cIcon, iconForComponent(hash, 'Styles'));
          a.append(cIcon, sheetLabel(labelKey));
          if (selectCurrent && resolved === hash) {
            a.classList.add('is-active');
            a.setAttribute('aria-current', 'page');
          }
          li.append(a);
          panel.append(li);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shell-sheet-group-btn';
        btn.setAttribute(
          'aria-expanded',
          selectCurrent && isColorFamilyPage(pageId) ? 'true' : 'false',
        );
        btn.setAttribute('aria-controls', panelId);
        const icon = document.createElement('span');
        icon.className = 'ms';
        setMsIcon(icon, 'palette');
        const name = sheetLabel('doc.colors.title');
        const chevron = document.createElement('span');
        chevron.className = 'ms chevron';
        setMsIcon(chevron, 'expand_more');
        btn.append(icon, name, chevron);
        btn.addEventListener('click', () => {
          const open = !groupEl.classList.contains('is-open');
          groupEl.classList.toggle('is-open', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          panel.hidden = !open;
        });

        groupEl.append(btn, panel);
        nav.append(groupEl);
        continue;
      }
      const li = document.createElement('li');
      li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
      ul.append(li);
    }
    if (ul.childElementCount) nav.append(ul);
  }

  body.replaceChildren(nav);
}

/** Fill rail secondary menu light DOM (closed). */
function fillNavMenu(destId?: string | null): {
  openDest: ReturnType<typeof resolveSecondaryDest>;
  pageCat: string | undefined;
} {
  const menu = shellNavMenu();
  const openDest = resolveSecondaryDest(destId);
  const pageId = currentPageId();
  builtNavMenuKey = navMenuKey(destId);
  const pageDest = destinationForPage(pageId, (id) => findComponent(id)?.category);
  const selectCurrent = pageDest?.id === openDest.id;
  const pageCat =
    selectCurrent && openDest.id === 'components'
      ? findComponent(pageId)?.category
      : undefined;

  if (!menu) return { openDest, pageCat };

  menu.setAttribute('aria-label', t(openDest.labelKey));

  if (openDest.id === 'components') {
    menu.replaceChildren(
      ...COMPONENT_MENU_GROUPS.filter(
        (group) => componentsInCategory(group.category).length > 0,
      ).map((group) => {
        const parent = document.createElement('k3-menu-item');
        parent.setAttribute('value', `cat-${group.category}`);
        parent.setAttribute('has-submenu', '');
        parent.append(menuItemIcon(group.icon), t(group.labelKey));
        appendEnSupporting(parent, group.labelKey);

        if (group.category === 'Containment' && cardSubpagesForProduct().length) {
          /* Flat peers except card variants → nested flyout under Cartes (k3ux) */
          const peers = componentsInCategory('Containment').filter(
            (c) => !CARD_VARIANT_IDS.has(c.id),
          );
          const cardsItem = makeCardsFamilyMenuItem(pageId, selectCurrent);
          let cardsInserted = false;
          for (const c of peers) {
            /* Keep alpha order: insert Cards before the first title after "Cards" */
            if (!cardsInserted && c.title.localeCompare('Cards', 'en', { sensitivity: 'base' }) > 0) {
              parent.appendChild(cardsItem);
              cardsInserted = true;
            }
            parent.appendChild(
              leafMenuItem(c, pageId, { slot: 'submenu', selectCurrent }),
            );
          }
          if (!cardsInserted) parent.appendChild(cardsItem);
        } else {
          for (const c of componentsInCategory(group.category)) {
            parent.appendChild(
              leafMenuItem(c, pageId, { slot: 'submenu', selectCurrent }),
            );
          }
        }
        return parent;
      }),
    );
  } else if (openDest.id === 'utilities') {
    const links = componentsInCategory('Utilities');
    const resolved = articlePageId(pageId);
    const nodes: HTMLElement[] = [];
    let keyboardGroupDone = false;
    for (const c of links) {
      if (KEYBOARD_CHILD_IDS.has(c.id)) {
        if (keyboardGroupDone) continue;
        keyboardGroupDone = true;
        const parent = document.createElement('k3-menu-item');
        parent.setAttribute('value', 'keyboard');
        parent.setAttribute('has-submenu', '');
        parent.append(menuItemIcon('keyboard'), t('doc.keyboard.title'));
        appendEnSupporting(parent, 'doc.keyboard.title');
        for (const [value, labelKey] of KEYBOARD_SUBPAGES) {
          const child = document.createElement('k3-menu-item');
          child.setAttribute('value', value);
          child.slot = 'submenu';
          child.append(
            menuItemIcon(iconForComponent(value, 'Utilities')),
            t(labelKey),
          );
          appendEnSupporting(child, labelKey);
          if (selectCurrent && resolved === value) child.setAttribute('selected', '');
          parent.appendChild(child);
        }
        nodes.push(parent);
        continue;
      }
      nodes.push(leafMenuItem(c, pageId, { selectCurrent }));
    }
    menu.replaceChildren(...nodes);
  } else if (openDest.id === 'animations') {
    menu.replaceChildren(
      ...componentsInCategory('Animation').map((c) =>
        leafMenuItem(c, pageId, { selectCurrent }),
      ),
    );
  } else if (openDest.id === 'resources') {
    menu.replaceChildren(
      ...RESOURCE_PAGES.map((page) => {
        const item = document.createElement('k3-menu-item');
        item.setAttribute('value', page.id);
        item.append(menuItemIcon(page.icon), t(page.labelKey));
        appendEnSupporting(item, page.labelKey);
        if (selectCurrent && pageId === page.id) item.setAttribute('selected', '');
        return item;
      }),
    );
  } else {
    /* Styles — Color submenu: Roles + Palettes + Additional */
    const links = componentsInCategory('Styles');
    const resolved = articlePageId(pageId);
    const nodes: HTMLElement[] = [];
    let colorGroupDone = false;
    for (const c of links) {
      if (COLOR_CHILD_IDS.has(c.id)) {
        if (colorGroupDone) continue;
        colorGroupDone = true;
        const parent = document.createElement('k3-menu-item');
        parent.setAttribute('value', 'color-roles');
        parent.setAttribute('has-submenu', '');
        parent.append(menuItemIcon('palette'), t('doc.colors.title'));
        appendEnSupporting(parent, 'doc.colors.title');
        for (const [value, labelKey] of COLOR_SUBPAGES) {
          const child = document.createElement('k3-menu-item');
          child.setAttribute('value', value);
          child.slot = 'submenu';
          child.append(
            menuItemIcon(iconForComponent(value, 'Styles')),
            t(labelKey),
          );
          appendEnSupporting(child, labelKey);
          if (selectCurrent && resolved === value) child.setAttribute('selected', '');
          parent.appendChild(child);
        }
        nodes.push(parent);
        continue;
      }
      nodes.push(leafMenuItem(c, pageId, { selectCurrent }));
    }
    menu.replaceChildren(...nodes);
  }
  return { openDest, pageCat };
}

/**
 * Secondary destinations in an M3E menu (rail / tablet+):
 * - Components → parent categories with child pages as submenu
 * - Utilities → flat list; Keyboard expands to Basics / Media
 * - Animations → flat list (text-bounce, icons-burst, …)
 * - Resources → Material Symbols browser (k3ux pack)
 * - Styles → flat list; Color expands to Roles / Palettes / Additional
 * - Components → Containment → Cards is a normal leaf on k3ui; on k3ux it expands to Holo · Lenticular · Scratch
 */
function buildNavMenu(
  opts: { open?: boolean; anchor?: HTMLElement | null; destId?: string | null } = {},
): void {
  if (opts.open) {
    void openShellNavMenu(opts.destId, opts.anchor ?? pendingMenuAnchor);
    pendingMenuAnchor = null;
    return;
  }
  /* Never opened yet: openShellNavMenu() fills it on first use (100+ items off the boot path). */
  if (!shellNavMenu()?.firstElementChild) return;
  /* Locale sync / page changes call this often: rebuild only when its inputs changed. */
  const key = navMenuKey(opts.destId);
  if (key === builtNavMenuKey && shellNavMenu()?.firstElementChild) return;
  fillNavMenu(opts.destId);
}

/** Inputs of fillNavMenu() — destination, page, locale, nav layout. */
let builtNavMenuKey = '';
function navMenuKey(destId?: string | null): string {
  return [
    resolveSecondaryDest(destId).id,
    currentPageId(),
    window.K3UI?.i18n.locale ?? '',
    document.querySelector('.app')?.getAttribute('data-nav') ?? '',
  ].join('|');
}

/**
 * Open (or toggle) the rail secondary menu.
 * Toggle is driven by `openMenuDestId` (not `menu.open`) so a document
 * pointerdown dismiss cannot invert the following click.
 * Hover open passes `{ toggle: false }` — leave closes; same dest stays open.
 */
async function openShellNavMenu(
  destId?: string | null,
  anchorEl: HTMLElement | null = null,
  opts: { toggle?: boolean } = {},
): Promise<void> {
  const toggle = opts.toggle !== false;
  const run = async (): Promise<void> => {
    /* Shell already registers these at boot — only wait if missing */
    if (!customElements.get('k3-menu')) await registry.register('k3-menu');
    if (!customElements.get('k3-menu-item')) await registry.register('k3-menu-item');
    const menu = shellNavMenu();
    if (!menu || typeof menu.show !== 'function') return;

    menu.armDismissGuard?.(320);

    const id = resolveSecondaryDest(destId).id;

    /* Same dest already shown → close on click toggle; keep on hover */
    if (openMenuDestId === id) {
      if (!toggle) {
        bindShellNavMenuAnchor(anchorEl);
        syncNavMenuOpenHighlight();
        if (!menu.open) {
          menu.hidden = false;
          /* hide() clears anchors — re-bind immediately before show */
          bindShellNavMenuAnchor(anchorEl);
          await menu.show('menu', { fast: true });
        }
        return;
      }
      openMenuDestId = null;
      syncNavMenuOpenHighlight();
      if (menu.open) await menu.hide('user', { fast: true });
      return;
    }

    callHide(shellNavSheet());
    openSheetDestId = null;

    /* Fast hide — don't wait for exit opacity when switching dest */
    if (menu.open) await menu.hide('user', { fast: true });

    const { pageCat } = fillNavMenu(destId);
    openMenuDestId = id;
    syncNavMenuOpenHighlight();
    menu.hidden = false;
    /*
     * hide() nulls positioningAnchor/Edge — bind AFTER hide, BEFORE show,
     * so fit uses the live item band × rail edge (not a stale host offset).
     */
    bindShellNavMenuAnchor(anchorEl);

    /* Show immediately — items upgrade while the panel is visible */
    menu.armDismissGuard?.(320);
    const shown = await menu.show('menu', { fast: true });
    if (!shown) {
      openMenuDestId = null;
      syncNavMenuOpenHighlight();
      return;
    }
    /* show() path may clear/rebind fit listeners — ensure anchor sticks */
    bindShellNavMenuAnchor(anchorEl);
    if (!pageCat) return;
    const parent = menu.querySelector<ShellMenuItem>(
      `k3-menu-item[value="cat-${pageCat}"]`,
    );
    parent?.openSubmenu();
  };

  shellMenuLock = shellMenuLock.then(run, run);
  await shellMenuLock;
}

/** Markup currently in #catalog-grid (skips identical rebuilds — locale sync runs it often). */
let catalogHtml: string | null = null;

/** Doc pages whose CEs live in companion package `k3ux`. */
const K3UX_PAGES = new Set([
  'confetti',
  'snow',
  'firework',
  'voice-ring',
  'text-bounce',
  'text-scramble',
  'icons-burst',
  'halftone',
  'card-holo',
  'card-lenticular',
  'card-scratch',
  'countdown',
  'marquee',
  'sound-fx',
  'audio-player',
  'qr-code',
  'charts-bar',
  'charts-line',
  'charts-other',
  'rating',
  'signature',
  'wheel-picker',
  'masonry',
  'iso-filter',
]);

let k3uxReady: Promise<void> | null = null;

type K3uxRegistry = {
  isKnown: (tag: string) => boolean;
  registerAll: (tags: 'all' | string[]) => Promise<void>;
};

/** Load companion UX package once — MANUAL so we register page tags on demand. */
function ensureK3ux(): Promise<void> {
  k3uxReady ??= (async () => {
    (window as Window & { K3UX_MANUAL?: boolean }).K3UX_MANUAL = true;
    await import('k3ux');
  })();
  return k3uxReady;
}

function k3uxRegistry(): K3uxRegistry | null {
  const api = (window as Window & { K3UX?: { registry?: K3uxRegistry } }).K3UX;
  return api?.registry ?? null;
}

/** Collect `k3-*` tags under a page root (light DOM demos). */
function collectPageK3Tags(root: ParentNode | null | undefined): string[] {
  if (!root) return [];
  return [
    ...new Set(
      [...root.querySelectorAll('*')]
        .map((el) => el.tagName.toLowerCase())
        .filter((t) => t.startsWith('k3-')),
    ),
  ];
}

/**
 * Register every `k3-*` on the page that belongs to k3ui and/or k3ux.
 * Present tags are upgraded before interactions — no full-catalog boot.
 */
async function registerPresentK3Tags(tags: string[]): Promise<void> {
  if (!tags.length) return;
  /* Companion tags are unknown to the k3ui catalog until k3ux is loaded. */
  if (tags.some((t) => !registry.isKnown(t))) await ensureK3ux();
  const ux = k3uxRegistry();
  const uiTags = tags.filter((t) => registry.isKnown(t));
  const uxTags = ux ? tags.filter((t) => ux.isKnown(t)) : [];
  if (uiTags.length) await registry.registerAll(uiTags);
  if (uxTags.length) await ux!.registerAll(uxTags);
}

function syncProductSwitchButtons(product: DocProduct): void {
  document.querySelectorAll<HTMLElement>('[data-product-switch]').forEach((btn) => {
    const on = btn.dataset.productSwitch === product;
    if (on) btn.setAttribute('selected', '');
    else btn.removeAttribute('selected');
  });
}

function applyDocProduct(product: DocProduct, opts?: { navigateHome?: boolean }): void {
  const prev = getDocProduct();
  const changed = prev !== product;
  setDocProduct(product);
  docStore.set(DocKeys.docProduct, product);
  document.documentElement.dataset.k3DocProduct = product;
  document.querySelectorAll<HTMLElement>('[data-doc-product]').forEach((el) => {
    el.hidden = el.dataset.docProduct !== product;
  });
  syncProductSwitchButtons(product);
  const title = document.getElementById('home-hero-title');
  if (title) title.textContent = product === 'k3ux' ? 'K3ux' : 'K3ui';
  if (changed) {
    catalogHtml = null;
    const grid = document.getElementById('catalog-grid');
    if (grid) delete grid.dataset.prerendered;
    buildCatalogGrid();
    buildPrimaryNav();
    buildNavMenu();
  } else {
    /* First paint / same pack — still sync switch chrome. */
    buildPrimaryNav();
  }
  if (opts?.navigateHome && changed && currentPageId() !== 'home') {
    location.hash = '#/';
  }
}

function syncProductForPage(pageId: string): void {
  const articleId = articlePageId(pageId);
  const comp = findComponentAnyProduct(articleId);
  if (!comp) return;
  const pack = comp.product ?? 'k3ui';
  if (pack !== getDocProduct()) applyDocProduct(pack);
}

function wireProductSwitch(): void {
  const group = document.getElementById('product-switch');
  const apply = (next: DocProduct | undefined): void => {
    if (!next || (next !== 'k3ui' && next !== 'k3ux') || next === getDocProduct()) return;
    applyDocProduct(next, { navigateHome: true });
    if (next === 'k3ux') void ensureK3ux();
  };
  group?.addEventListener('k3-change', ((e: CustomEvent<{ values?: string[] }>) => {
    apply(e.detail?.values?.[0] as DocProduct | undefined);
  }) as EventListener);
  group?.querySelectorAll<HTMLElement>('[data-product-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      apply(btn.dataset.productSwitch as DocProduct | undefined);
    });
  });
}

function buildCatalogGrid(filter = ''): void {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  const html = catalogGridHtml(t, filter, t('playground.search.placeholder'));
  if (html === catalogHtml) return;
  /* Build-time prerender (default locale): keep those nodes — they are the LCP. */
  if (catalogHtml === null && !filter.trim() && grid.dataset.prerendered === window.K3UI?.i18n.locale) {
    catalogHtml = html;
    return;
  }
  catalogHtml = html;
  grid.innerHTML = html;
}

/** Shell FAB menu — open GitHub repo / profile in a new tab. */
function wireShellGithubMenu(): void {
  const menu = document.getElementById('shell-github-menu');
  if (!menu) return;
  menu.querySelectorAll<HTMLElement>('k3-fab-menu-item[data-href]').forEach((item) => {
    item.addEventListener('k3-click', () => {
      const href = item.getAttribute('data-href');
      if (!href) return;
      window.open(href, '_blank', 'noopener,noreferrer');
      const closer = menu as HTMLElement & { hide?: (source?: string) => void; open?: boolean };
      if (typeof closer.hide === 'function') void closer.hide('user');
      else closer.open = false;
    });
  });
}

/**
 * Warm every component once the visitor shows intent (first pointer, key or
 * scroll), on idle time and never with Save-Data — instead of downloading and
 * upgrading the whole catalog for every page view.
 */
function warmCatalogOnIntent(): void {
  const events = ['pointerdown', 'keydown', 'scroll'] as const;
  const warm = (): void => {
    for (const type of events) window.removeEventListener(type, warm, true);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const idle: (cb: () => void) => void =
      typeof window.requestIdleCallback === 'function'
        ? (cb) => window.requestIdleCallback(() => cb(), { timeout: 4000 })
        : (cb) => window.setTimeout(cb, 200);
    /* One component per task: each definition upgrades every instance on the site. */
    idle(() => {
      void (async () => {
        for (const { tag } of COMPONENT_CATALOG) {
          if (customElements.get(tag)) continue;
          await registry.register(tag);
          await yieldToMain();
        }
      })();
    });
  };
  for (const type of events) window.addEventListener(type, warm, { capture: true, passive: true });
}

function setDocPageLoading(on: boolean): void {
  const el = document.getElementById('doc-page-loading');
  if (!el) return;
  el.hidden = !on;
  el.classList.toggle('is-on', on);
  el.setAttribute('aria-hidden', on ? 'false' : 'true');
  el.setAttribute('aria-busy', on ? 'true' : 'false');
  /* Single K3ui indicator — SoftBurst light-DOM until CE upgrades, then morph CE. */
  const ce = el.querySelector<HTMLElement>('k3-loading-indicator');
  if (ce) ce.hidden = false;
}

/** Wait two frames so the loading veil paints before heavy work. */
function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function showPage(id: string): void {
  const articleId = articlePageId(id);
  syncProductForPage(articleId);
  /* Canonicalize URL when alias / legacy hash was used */
  if (articleId !== id) {
    const next = `#/${articleId}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  }
  const pages = document.querySelectorAll<HTMLElement>('.comp-page');
  let found = false;
  pages.forEach((page) => {
    const match =
      page.dataset.page === articleId || (articleId === 'home' && page.dataset.page === 'home');
    page.hidden = !match;
    page.classList.toggle('is-active', match);
    if (match) found = true;
  });
  if (!found) {
    const home = document.getElementById('page-home');
    if (home) {
      home.hidden = false;
      home.classList.add('is-active');
    }
  }
  const resolvedId = articleId === 'home' || !found ? 'home' : articleId;
  /* Demo snow only on Snow page; shell snow is suppressed there (settings switch ignored). */
  if (resolvedId !== 'snow') pauseDemoSnow();
  void applyShellSnow(resolvedId);
  const ambient = document.getElementById('home-ambient');
  if (ambient) ambient.hidden = resolvedId !== 'home';
  buildPrimaryNav();
  /* Rebuild menu contents (closed) — rail click opens via buildNavMenu({ open: true }) */
  buildNavMenu();
  syncDocNav(resolvedId);
  const scroll = document.querySelector('.shell-scroll');
  if (scroll) scroll.scrollTop = 0;
  else window.scrollTo(0, 0);
}

/**
 * Switch page under the loading veil.
 * Duration tracks real `ensure` work, with a short floor so a warm cache
 * still shows the k3-loading-indicator (otherwise it vanishes in 1 frame).
 * HTML starts with `.is-on` so F5 / cold boot also show the veil before modules finish.
 */
async function navigateDocPage(
  pageId: string,
  ensure: (id: string) => Promise<void>,
): Promise<void> {
  setDocPageLoading(true);
  await waitNextPaint();
  const started = performance.now();
  try {
    showPage(pageId);
    await ensure(pageId);
  } finally {
    const minVisibleMs = 320;
    const elapsed = performance.now() - started;
    if (elapsed < minVisibleMs) {
      await new Promise<void>((r) => {
        window.setTimeout(r, minVisibleMs - elapsed);
      });
    }
    setDocPageLoading(false);
  }
}

function syncDocNav(pageId: string): void {
  type DocNavEl = HTMLElement & {
    previousHref: string;
    previousTitle: string;
    nextHref: string;
    nextTitle: string;
  };
  const docNav = document.getElementById('doc-nav') as DocNavEl | null;
  if (!docNav) return;

  if (pageId === 'home') {
    docNav.previousHref = '';
    docNav.previousTitle = '';
    docNav.nextHref = '#/quick-start';
    docNav.nextTitle = t('doc.quick-start.title');
    return;
  }

  if (pageId === 'quick-start') {
    const first = orderedComponents()[0];
    docNav.previousHref = '#/';
    docNav.previousTitle = t('doc.catalog.title');
    docNav.nextHref = first ? `#/${first.id}` : '';
    docNav.nextTitle = first ? t(first.titleKey) : '';
    return;
  }

  const { prev, next } = neighborComponents(pageId);
  docNav.previousHref = prev ? `#/${prev.id}` : '#/';
  docNav.previousTitle = prev ? t(prev.titleKey) : t('doc.catalog.title');
  docNav.nextHref = next ? `#/${next.id}` : '#/';
  docNav.nextTitle = next ? t(next.titleKey) : t('doc.catalog.title');
}

async function fillShapes(): Promise<void> {
  const grid = document.getElementById('shape-grid');
  if (!grid || grid.childElementCount) return;
  const { MATERIAL_SHAPE_NAMES, MATERIAL_SHAPE_SVG } = await import('../src/shapes/index.js');
  grid.innerHTML = MATERIAL_SHAPE_NAMES.map(
    (name) => `<div class="shape-cell" title="${name}">
      <svg viewBox="0 0 1 1" aria-hidden="true"><path fill="currentColor" d="${MATERIAL_SHAPE_SVG[name]}"/></svg>
      <span>${name}</span>
    </div>`,
  ).join('');
}

/** Pale Material expressive shapes behind the home hero (m3.material.io vibe). */
async function mountHomeAmbient(): Promise<void> {
  const host = document.getElementById('home-ambient');
  if (!host || host.childElementCount) return;
  const { MATERIAL_SHAPE_SVG } = await import('../src/shapes/index.js');
  const slots = [
    { name: 'SoftBurst', slot: 'a' },
    { name: 'Cookie9Sided', slot: 'b' },
    { name: 'Pill', slot: 'c' },
    { name: 'Puffy', slot: 'd' },
  ] as const;
  host.replaceChildren(
    ...slots.map(({ name, slot }) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', `home-ambient__shape home-ambient__shape--${slot}`);
      svg.setAttribute('viewBox', '0 0 1 1');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', MATERIAL_SHAPE_SVG[name]);
      svg.append(path);
      return svg;
    }),
  );
}

/** Schedule work after first paint (idle when available). */
function afterFirstPaint(task: () => void): void {
  const run = () => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => task(), { timeout: 1500 });
    } else {
      setTimeout(task, 0);
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Feedback → Lazy loading: simulated latency, one failure then Retry, Replay. */
let lazyReplayWired = false;
function wireLazyDemos(): void {
  const page = document.getElementById('page-lazy');
  if (!page) return;
  type LazyDemo = HTMLElement & { loader: (() => Promise<unknown>) | null; load(): Promise<void> };
  const arm = (el: LazyDemo): void => {
    const latency = Number(el.dataset.latency ?? 1200);
    let failOnce = el.dataset.fail === '1';
    el.loader = () =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (!failOnce) return resolve();
          failOnce = false;
          reject(new Error('Simulated network error'));
        }, latency);
      });
    void customElements.whenDefined('k3-lazy').then(() => el.load());
  };
  const replay = (): void => {
    page.querySelectorAll<LazyDemo>('k3-lazy.lazy-demo').forEach((el) => {
      const fresh = el.cloneNode(true) as LazyDemo;
      /* A clone copies the reflected state — start over from idle */
      fresh.removeAttribute('state');
      fresh.removeAttribute('aria-busy');
      el.replaceWith(fresh);
      arm(fresh);
    });
  };
  if (!lazyReplayWired) {
    lazyReplayWired = true;
    document.getElementById('btn-lazy-replay')?.addEventListener('click', replay);
  }
  replay();
}

type CubicBezier = readonly [number, number, number, number];

/** SVG viewBox for motion curves — must match markup `viewBox="0 -80 100 190"`. */
const MOTION_VB = { x: 0, y: -80, w: 100, h: 190 } as const;

type MotionBead = {
  card: HTMLElement;
  bead: HTMLElement;
  bezier: CubicBezier;
  durationMs: number;
  epoch: number;
};

function parseCubicBezier(value: string): CubicBezier | null {
  const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i.exec(
    value,
  );
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

/** Point on CSS cubic-bezier(x1,y1,x2,y2) in SVG plot space (y up → flipped). */
function cubicBezierPoint(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number } {
  const u = 1 - t;
  const x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
  const y = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
  return { x: x * 100, y: (1 - y) * 100 };
}

/** Sample CSS cubic-bezier as an SVG path (viewBox allows overshoot above y=0). */
function cubicBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const steps = 48;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const { x, y } = cubicBezierPoint(i / steps, x1, y1, x2, y2);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

function formatMotionDuration(cssValue: string): string {
  const s = cssValue.trim();
  if (!s) return '';
  if (s.endsWith('ms')) {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? `${Math.round(n)} ms` : s;
  }
  if (s.endsWith('s')) {
    const n = Number.parseFloat(s) * 1000;
    return Number.isFinite(n) ? `${Math.round(n)} ms` : s;
  }
  return s;
}

function parseDurationMs(cssValue: string): number {
  const s = cssValue.trim();
  if (s.endsWith('ms')) return Number.parseFloat(s) || 500;
  if (s.endsWith('s')) return (Number.parseFloat(s) || 0.5) * 1000;
  return 500;
}

function motionPlaygroundReduced(): boolean {
  return (
    document.documentElement.hasAttribute('data-k3-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Styles → Motion — HTML bead travels the cubic-bezier curve; click replays. */
let motionPlaygroundWired = false;
let motionBeads: MotionBead[] = [];
let motionRaf = 0;

function placeMotionBead(bead: MotionBead, t: number): void {
  const { x, y } = cubicBezierPoint(t, ...bead.bezier);
  /* Map viewBox units → % of the plot box (SVG is stretched with preserveAspectRatio=none). */
  const left = ((x - MOTION_VB.x) / MOTION_VB.w) * 100;
  const top = ((y - MOTION_VB.y) / MOTION_VB.h) * 100;
  bead.bead.style.left = `${left}%`;
  bead.bead.style.top = `${top}%`;
}

function tickMotionPlayground(now: number): void {
  if (motionPlaygroundReduced()) {
    for (const bead of motionBeads) placeMotionBead(bead, 1);
    motionRaf = 0;
    return;
  }
  for (const bead of motionBeads) {
    const cycle = Math.max(bead.durationMs, 1) * 2;
    let elapsed = (now - bead.epoch) % cycle;
    if (elapsed < 0) elapsed += cycle;
    let t = elapsed / bead.durationMs;
    if (t > 1) t = 2 - t; /* alternate */
    placeMotionBead(bead, t);
  }
  motionRaf = requestAnimationFrame(tickMotionPlayground);
}

function ensureMotionPlaygroundRaf(): void {
  if (!motionRaf && motionBeads.length && !motionPlaygroundReduced()) {
    motionRaf = requestAnimationFrame(tickMotionPlayground);
  }
}

function syncMotionPlaygroundCards(): void {
  const root = document.getElementById('motion-playground');
  if (!root) return;
  const probe = document.createElement('div');
  document.body.appendChild(probe);
  const next: MotionBead[] = [];
  const now = performance.now();
  for (const card of root.querySelectorAll<HTMLElement>('.motion-card')) {
    const durVar = card.dataset.durationVar;
    const easeVar = card.dataset.easingVar;
    const beadEl = card.querySelector<HTMLElement>('.motion-card__bead');
    const path = card.querySelector<SVGPathElement>('.motion-card__curve-path');
    if (!beadEl || !path) continue;

    let durationMs = 500;
    if (durVar) {
      probe.style.transitionDuration = `var(${durVar})`;
      const raw = getComputedStyle(probe).transitionDuration;
      const label = card.querySelector<HTMLElement>('[data-motion-ms]');
      if (label) label.textContent = formatMotionDuration(raw);
      durationMs = parseDurationMs(raw);
    }

    let bezier: CubicBezier = [0, 0, 1, 1];
    if (easeVar) {
      probe.style.transitionTimingFunction = `var(${easeVar})`;
      bezier =
        parseCubicBezier(getComputedStyle(probe).transitionTimingFunction) ?? bezier;
    }
    path.setAttribute('d', cubicBezierPath(...bezier));

    const prev = motionBeads.find((b) => b.card === card);
    next.push({
      card,
      bead: beadEl,
      bezier,
      durationMs,
      epoch: prev?.epoch ?? now,
    });
  }
  probe.remove();
  motionBeads = next;
  if (motionPlaygroundReduced()) {
    for (const bead of motionBeads) placeMotionBead(bead, 1);
    if (motionRaf) {
      cancelAnimationFrame(motionRaf);
      motionRaf = 0;
    }
    return;
  }
  ensureMotionPlaygroundRaf();
}

function wireMotionPlayground(): void {
  const root = document.getElementById('motion-playground');
  if (!root) return;
  syncMotionPlaygroundCards();
  if (motionPlaygroundWired) return;
  motionPlaygroundWired = true;

  root.addEventListener('click', (e) => {
    const card = (e.target as Element | null)?.closest?.('.motion-card') as HTMLElement | null;
    if (!card || !root.contains(card)) return;
    const bead = motionBeads.find((b) => b.card === card);
    if (!bead) return;
    bead.epoch = performance.now();
    placeMotionBead(bead, 0);
    ensureMotionPlaygroundRaf();
  });

  document.addEventListener('k3-theme-change', () => syncMotionPlaygroundCards());
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', () => syncMotionPlaygroundCards());
}

const TYPE_EMPHASIZED = new Set<string>(TYPE_EMPHASIZED_ROLES);

/** Read typescale CSS vars for a role (and optional emphasized weight). */
function readTypeScaleAttrs(
  role: string,
  emphasized: boolean,
): { size: string; lineHeight: string; weight: string; tracking: string } {
  const root = getComputedStyle(document.documentElement);
  const v = (suffix: string) =>
    root.getPropertyValue(`--k3-sys-typescale-${role}-${suffix}`).trim() || '—';
  return {
    size: v('size'),
    lineHeight: v('line-height'),
    weight: emphasized ? v('emphasized-weight') : v('weight'),
    tracking: v('tracking'),
  };
}

function buildTypeVariant(role: string, emphasized: boolean): HTMLElement {
  const cls = emphasized ? `k3-${role}-emphasized` : `k3-${role}`;
  const attrs = readTypeScaleAttrs(role, emphasized);
  const variant = document.createElement('div');
  variant.className = 'type-variant';

  const label = document.createElement('code');
  label.className = 'type-variant__label';
  label.textContent = `.${cls}`;

  const sample = document.createElement('p');
  sample.className = `type-variant__sample ${cls}`;
  sample.setAttribute(
    'data-i18n',
    emphasized ? 'doc.typography.sample.emphasized' : 'doc.typography.sample.default',
  );
  sample.textContent = emphasized
    ? t('doc.typography.sample.emphasized')
    : t('doc.typography.sample.default');

  const list = document.createElement('ul');
  list.className = 'type-variant__attrs';
  list.setAttribute('aria-label', t('doc.typography.attrs'));
  for (const [key, value] of [
    ['size', attrs.size],
    ['line-height', attrs.lineHeight],
    ['weight', attrs.weight],
    ['tracking', attrs.tracking],
  ] as const) {
    const li = document.createElement('li');
    li.className = 'type-variant__attr';
    const k = document.createElement('span');
    k.className = 'type-variant__attr-key';
    k.textContent = key;
    li.append(k, document.createTextNode(` ${value}`));
    list.append(li);
  }

  variant.append(label, sample, list);
  return variant;
}

/** Styles → Typography — live type scale (roles × default/emphasized). */
function mountTypographyPlayground(): void {
  const root = document.getElementById('typography-playground');
  if (!root || root.dataset.mounted === '1') return;
  root.dataset.mounted = '1';
  root.replaceChildren();

  for (const family of TYPE_FAMILIES) {
    const section = document.createElement('section');
    section.className = 'type-family';
    section.setAttribute('aria-labelledby', `type-family-${family.id}`);

    const title = document.createElement('h3');
    title.id = `type-family-${family.id}`;
    title.className = 'type-family__title';
    title.setAttribute('data-i18n', `doc.typography.family.${family.id}`);
    title.textContent = t(`doc.typography.family.${family.id}`);
    section.append(title);

    const frame = document.createElement('div');
    frame.className = 'type-family__roles stack gap-md';

    for (const role of family.roles) {
      const card = document.createElement('article');
      card.className = 'type-role';
      card.dataset.role = role;

      const head = document.createElement('div');
      head.className = 'type-role__head';
      const name = document.createElement('span');
      name.className = 'type-role__name';
      name.setAttribute('data-i18n', `doc.typography.role.${role}`);
      name.textContent = t(`doc.typography.role.${role}`);
      head.append(name);
      card.append(head);

      const variants = document.createElement('div');
      variants.className = 'type-role__variants k3-layout-grid k3-demo-cols-2';
      variants.append(buildTypeVariant(role, false));
      if (TYPE_EMPHASIZED.has(role)) {
        variants.append(buildTypeVariant(role, true));
      } else {
        const empty = document.createElement('div');
        empty.className = 'type-variant type-variant--empty';
        empty.setAttribute('data-i18n', 'doc.typography.emphasized.none');
        empty.textContent = t('doc.typography.emphasized.none');
        variants.append(empty);
      }
      card.append(variants);
      frame.append(card);
    }

    section.append(frame);
    root.append(section);
  }
}

/** Styles → Grid — live column strip + status chips. */
function syncGridPlayground(): void {
  const root = document.getElementById('page-grid');
  if (!root || root.hidden) return;

  const cs = getComputedStyle(document.documentElement);
  const cols = Number(cs.getPropertyValue('--k3-layout-columns').trim() || '4') || 4;
  const main = document.getElementById('doc-main');
  const containerActive = main?.classList.contains('k3-container') ?? true;
  const w = window.innerWidth;
  const bp = w >= 1440 ? 'xl' : w >= 1240 ? 'lg' : w >= 905 ? 'md' : w >= 600 ? 'sm' : 'xs';

  const elCols = document.getElementById('grid-live-columns');
  const elGutter = document.getElementById('grid-live-gutter');
  const elBp = document.getElementById('grid-live-bp');
  const elContainer = document.getElementById('grid-live-container');
  if (elCols) elCols.textContent = String(cols);
  if (elGutter) elGutter.textContent = '8dp';
  if (elBp) elBp.textContent = bp;
  if (elContainer) {
    elContainer.textContent =
      w < 905 ? 'N/A' : containerActive ? 'ON' : 'OFF';
  }

  const row = document.getElementById('grid-demo-columns-row');
  if (row && Number(row.dataset.cols ?? '0') !== cols) {
    row.dataset.cols = String(cols);
    row.replaceChildren();
    for (let i = 1; i <= cols; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell k3-col-span-1';
      cell.textContent = String(i);
      row.append(cell);
    }
  }
}

let gridPlaygroundWired = false;

function wireGridPlayground(): void {
  syncGridPlayground();
  if (gridPlaygroundWired) return;
  gridPlaygroundWired = true;
  window.addEventListener('resize', () => syncGridPlayground(), { passive: true });
  document.addEventListener('k3-theme-change', () => syncGridPlayground());
  /* Container toggle lives in settings — reuse store changes via class MutationObserver */
  const main = document.getElementById('doc-main');
  if (main) {
    new MutationObserver(() => syncGridPlayground()).observe(main, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
}

let typographyPlaygroundWired = false;

function wireTypographyPlayground(): void {
  mountTypographyPlayground();
  if (typographyPlaygroundWired) return;
  typographyPlaygroundWired = true;
  /* Remount on locale so samples + labels refresh (attrs stay token-driven). */
  document.addEventListener('k3-locale-change', () => {
    const root = document.getElementById('typography-playground');
    if (!root) return;
    root.dataset.mounted = '0';
    mountTypographyPlayground();
  });
}

/** Styles token pages — `<k3-table>` Specs (Token / Value / Notes). */
async function fillStyleTokenDemos(): Promise<void> {
  const { mountTableIn } = await loadDocTables();
  const spacing = document.getElementById('spacing-scale');
  if (spacing && !spacing.querySelector('k3-table')) {
    mountTableIn(spacing, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: SPACING_TOKENS.map((s) => [s.token, `${s.dp} dp`, s.css]),
    });
  }

  const elev = document.getElementById('elevation-scale');
  if (elev && !elev.querySelector('k3-table')) {
    mountTableIn(elev, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: ELEVATION_TOKENS.map((e) => [
        `level${e.level}`,
        e.css,
        `box-shadow · .k3-elevation-${e.level}`,
      ]),
    });
  }

  const grid = document.getElementById('grid-scale');
  if (grid && !grid.querySelector('k3-table')) {
    mountTableIn(grid, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: [
        ['--k3-layout-columns', '4 · 8 · 12', 'breakpoint tracks'],
        ['--k3-layout-gutter', 'space100 · 8dp', '.k3-layout-grid gap'],
        ['--k3-layout-full-gap', '20dp', 'edge inset'],
        ['--k3-layout-body-max', 'none → 840 → fluid → 1280', '.k3-container'],
        ['.k3-layout-grid', 'display: grid', 'column tracks + gutter'],
        ['.k3-container / .k3-container-none', 'body max vs full-bleed', '≥905 only'],
        ['.k3-col-span-1…12', 'grid-column: span N', 'uneven packs'],
        ['.k3-col-start-1…12', 'grid-column-start: N', 'absolute offsets'],
        ['.k3-col-full', '1 / -1', 'full row'],
        ['.k3-demo-cols-2|3|4', 'equal share of columns', 'demo frames'],
        ['.k3-layout-grid-overlay', 'viz tracks', 'Settings → Grid'],
      ],
    });
  }

  wireMotionPlayground();
  wireTypographyPlayground();
  wireGridPlayground();

  const motion = document.getElementById('motion-scale');
  if (motion && !motion.querySelector('k3-table')) {
    mountTableIn(motion, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: MOTION_DURATION_TOKENS.map((name) => [
        `duration-${name}`,
        `var(--k3-sys-motion-duration-${name})`,
        '',
      ]),
    });
  }

  const corners = document.getElementById('shape-corners');
  if (corners && !corners.querySelector('k3-table')) {
    mountTableIn(corners, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: [
        ...SHAPE_CORNER_TOKENS.map((c) => [
          c.name,
          c.dp == null ? 'full' : `${c.dp} dp`,
          c.css,
        ]),
        ['catalog', '35 unit SVG paths', ''],
        ['morph', 'feature-matched', ''],
      ],
    });
  }

  const type = document.getElementById('type-scale');
  if (type && !type.querySelector('k3-table')) {
    const rows: string[][] = [];
    for (const role of TYPE_ROLES) {
      rows.push([
        role,
        `.k3-${role}`,
        `size · line-height · weight · tracking`,
      ]);
      if (TYPE_EMPHASIZED.has(role)) {
        rows.push([
          `${role} · emphasized`,
          `.k3-${role}-emphasized`,
          `var(--k3-sys-typescale-${role}-emphasized-weight)`,
        ]);
      }
    }
    mountTableIn(type, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows,
    });
  }
}

function rebuildGridOverlay(): void {
  const overlay = document.getElementById('grid-overlay');
  const main = document.getElementById('doc-main');
  if (!overlay) return;
  const containerOn = main?.classList.contains('k3-container') ?? true;
  const root = getComputedStyle(document.documentElement);
  const cols = Number(root.getPropertyValue('--k3-layout-columns').trim() || '12');
  overlay.innerHTML = Array.from({ length: cols }, () => '<span></span>').join('');
  overlay.dataset.container = containerOn ? 'on' : 'off';
  /* Keep column count in sync with breakpoint (margin-inline is CSS-only) */
  overlay.style.setProperty('--k3-layout-columns', String(cols));
}

function setDocumentDir(dir: 'ltr' | 'rtl'): void {
  document.documentElement.dir = dir;
  document.body.dir = dir;
  docStore.set(DocKeys.uiDir, dir);
  syncDirControl();
}

/**
 * <k3-theme> applies its own attributes when it upgrades: give it the saved
 * settings first, so it never overrides the theme init() just applied
 * (that override made the colours flip at load for customised themes).
 */
function syncThemeElement(seed: string): void {
  const theme = document.getElementById('theme');
  if (!theme) return;
  theme.setAttribute('primary-seed', seed);
  theme.setAttribute('color-mode', themeMode);
  theme.setAttribute('color-variant', colorVariant);
  theme.setAttribute('contrast', contrastLevel);
  theme.setAttribute('motion', motionScheme);
  theme.setAttribute('spec-version', colorSpec);
}

/**
 * Remember the CSS variables the theme API just wrote (and the resolved mode):
 * the pre-paint script in <head> replays them on the next load, so returning
 * visitors with a customised theme get their colours from the first frame.
 */
function cacheAppliedTheme(): void {
  try {
    const root = document.documentElement;
    const vars: Record<string, string> = {};
    for (let i = 0; i < root.style.length; i++) {
      const name = root.style[i]!;
      if (name.startsWith('--k3-')) vars[name] = root.style.getPropertyValue(name);
    }
    localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({
        settings: JSON.stringify(THEME_STORE_KEYS.map((k) => localStorage.getItem(THEME_STORE_PREFIX + k))),
        mode: root.dataset.k3ColorMode ?? '',
        scheme: root.style.colorScheme,
        vars,
      }),
    );
  } catch {
    /* storage unavailable (private mode / quota) — next load just skips the cache */
  }
}

function applyThemePersist(): void {
  const seed = seeds[seedIdx] ?? seeds[0]!;
  docStore.set(DocKeys.themeSeed, seed);
  docStore.set(DocKeys.themeSeedIdx, seedIdx);
  docStore.set(DocKeys.themeMode, themeMode);
  docStore.set(DocKeys.themeVariant, colorVariant);
  docStore.set(DocKeys.themeContrast, contrastLevel);
  docStore.set(DocKeys.themeMotion, motionScheme);
  docStore.set(DocKeys.themeSpec, colorSpec);
  const theme = document.getElementById('theme') as HTMLElement & {
    primarySeed: string;
    colorMode: string;
    colorVariant?: string;
    contrast?: ContrastLevel;
    motion?: MotionScheme;
  } | null;
  if (theme) {
    /* Attribute forces Lit update even when property was already equal */
    theme.setAttribute('primary-seed', seed);
    theme.primarySeed = seed;
    theme.colorMode = themeMode;
    if ('colorVariant' in theme) theme.colorVariant = colorVariant;
    if ('contrast' in theme) theme.contrast = contrastLevel;
    if ('motion' in theme) theme.motion = motionScheme;
    if ('specVersion' in theme) (theme as unknown as { specVersion: ColorSpecVersion }).specVersion = colorSpec;
  }
  window.K3UI?.theme.apply({
    seed,
    mode: themeMode,
    motion: motionScheme,
    variant: colorVariant,
    contrast: contrastLevel,
    specVersion: colorSpec,
  });
  refreshColorDocs(seed);
  syncSettingsSheet();
  cacheAppliedTheme();
}

/** Marquee lab — live options playground. */
let marqueeDemosWired = false;
function wireMarqueeDemos(): void {
  type Mq = HTMLElement & {
    direction: string;
    mode: string;
    pauseOnHover: boolean;
    pauseAtItems: boolean;
    itemPause: number;
    gap: number;
    speed: number;
    restart(): void;
    replaceContent(items: ReadonlyArray<string | Node>, options?: { html?: boolean }): void;
    textSize: string | number | null;
    textFont: string | null;
    drag: boolean;
    pauseOnScroll: boolean;
    variant: string;
    html: string | null;
  };
  const marquee = document.getElementById('mq-lab') as Mq | null;
  const stage = document.getElementById('mq-stage');
  if (!marquee || !stage || marqueeDemosWired) return;
  marqueeDemosWired = true;

  const dir = document.getElementById('mq-dir') as (HTMLElement & { value?: string }) | null;
  const continuous = document.getElementById('mq-continuous') as (HTMLElement & { selected?: boolean }) | null;
  const content = document.getElementById('mq-content') as (HTMLElement & { value?: string }) | null;
  const hover = document.getElementById('mq-hover') as (HTMLElement & { selected?: boolean }) | null;
  const pauseItems = document.getElementById('mq-pause-items') as (HTMLElement & { selected?: boolean }) | null;
  const fade = document.getElementById('mq-fade') as (HTMLElement & { selected?: boolean }) | null;
  const bgCustom = document.getElementById('mq-bg-custom') as (HTMLElement & { selected?: boolean }) | null;
  const bgHex = document.getElementById('mq-bg-hex') as (HTMLElement & { value?: string; hidden?: boolean }) | null;
  const fgCustom = document.getElementById('mq-fg-custom') as (HTMLElement & { selected?: boolean }) | null;
  const fgHex = document.getElementById('mq-fg-hex') as (HTMLElement & { value?: string; hidden?: boolean }) | null;
  const textSize = document.getElementById('mq-text-size') as (HTMLElement & { value?: number; hidden?: boolean }) | null;
  const font = document.getElementById('mq-font') as (HTMLElement & { value?: string; hidden?: boolean }) | null;
  const drag = document.getElementById('mq-drag') as (HTMLElement & { selected?: boolean }) | null;
  const pauseScroll = document.getElementById('mq-pause-scroll') as (HTMLElement & { selected?: boolean }) | null;
  const variant = document.getElementById('mq-variant') as (HTMLElement & { value?: string }) | null;
  const badge = document.getElementById('mq-label') as (HTMLElement & { selected?: boolean }) | null;
  const note = document.getElementById('mq-sanitize-note');

  const FONTS: Record<string, string> = {
    theme: '"Google Sans", "Google Sans Text", system-ui, sans-serif',
    system: 'system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Google Sans Code", ui-monospace, monospace',
  };
  const esc = (text: string): string =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  /* Rich HTML + a deliberately hostile tail — the sanitizer strips it (see the note) */
  const htmlSample = (): string =>
    `<strong>k3ui</strong> · <em>${esc(t('doc.marquee.html.rich'))}</em> · <mark>${esc(t('doc.marquee.html.safe'))}</mark> · ` +
    `<a href="https://github.com/Kam3leoN/k3ui-expressive" target="_blank">GitHub</a> · ` +
    `<img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)<\/script>` +
    `<a href="javascript:alert(1)" onclick="alert(1)">${esc(t('doc.marquee.html.trap'))}</a>`;

  marquee.addEventListener('k3-sanitize', (e) => {
    if (!note) return;
    const removed = ((e as CustomEvent<{ removed: string[] }>).detail?.removed ?? []).join(', ');
    note.textContent = t('doc.marquee.lab.sanitized', { list: removed });
    note.hidden = false;
  });

  const LOGOS = ['nova', 'orbit', 'pixel', 'lumen', 'vertex', 'quanta'] as const;

  const textNodes = (): HTMLElement[] =>
    ['item1', 'item2', 'item3', 'item4'].map((id) => {
      const span = document.createElement('span');
      span.dataset.i18n = `doc.marquee.text.${id}`;
      span.textContent = t(span.dataset.i18n);
      return span;
    });

  const imageNodes = (): HTMLElement[] =>
    LOGOS.map((name) => {
      const img = document.createElement('img');
      img.src = `/logos/${name}.svg`;
      img.alt = name[0]!.toUpperCase() + name.slice(1);
      img.height = 36;
      img.loading = 'lazy';
      img.decoding = 'async';
      return img;
    });

  const normalizeHex = (raw: string): string | null => {
    const v = raw.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) return v;
    if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) return `#${v}`;
    return null;
  };

  const apply = (): void => {
    const direction = dir?.value === 'right' ? 'right' : 'left';
    const loop = continuous?.selected !== false;
    const kind = content?.value === 'image' ? 'image' : content?.value === 'html' ? 'html' : 'text';
    const fadeOn = fade?.selected !== false;
    const useBgCustom = !!bgCustom?.selected;
    const useFgCustom = !!fgCustom?.selected;
    marquee.direction = direction;
    marquee.mode = loop ? 'infinite' : 'classic';
    marquee.pauseOnHover = !!hover?.selected;
    marquee.pauseAtItems = !!pauseItems?.selected;
    marquee.itemPause = 1.5;
    marquee.gap = kind === 'image' ? 56 : 48;
    marquee.speed = loop ? 80 : 110;
    marquee.style.setProperty('--k3-marquee-fade', fadeOn ? '8%' : '0%');
    marquee.setAttribute('data-fade', fadeOn ? 'on' : 'off');
    stage.dataset.fade = fadeOn ? 'on' : 'off';
    /* Text version: size / font (26 px by default, like the page sample) */
    const textual = kind !== 'image';
    if (textSize) textSize.hidden = !textual;
    if (font) font.hidden = !textual;
    marquee.textSize = textual ? Number(textSize?.value ?? 26) : null;
    marquee.textFont = textual ? (FONTS[font?.value ?? 'theme'] ?? null) : null;
    marquee.drag = !!drag?.selected;
    marquee.pauseOnScroll = !!pauseScroll?.selected;
    marquee.variant = variant?.value ?? 'plain';
    if (note && kind !== 'html') note.hidden = true;
    if (kind === 'html') {
      marquee.html = null;
      marquee.html = htmlSample();
    } else {
      marquee.html = null;
      marquee.replaceContent(kind === 'image' ? imageNodes() : textNodes());
    }
    marquee.querySelector('[slot="label"]')?.remove();
    if (badge?.selected) {
      const live = document.createElement('span');
      live.slot = 'label';
      live.dataset.i18n = 'doc.marquee.label.live';
      live.textContent = t(live.dataset.i18n);
      marquee.prepend(live);
    }

    /* BG: custom + valid hex → hex; otherwise Material surface-container */
    if (bgHex) bgHex.hidden = !useBgCustom;
    const bgColor = useBgCustom ? normalizeHex(bgHex?.value ?? '') : null;
    if (bgColor) {
      stage.dataset.bg = 'custom';
      stage.style.setProperty('--mq-lab-bg', bgColor);
    } else {
      stage.dataset.bg = 'material';
      stage.style.removeProperty('--mq-lab-bg');
    }

    /* Text: custom only for text content; empty hex → Material on-surface */
    const showFg = kind === 'text' && useFgCustom;
    if (fgCustom) fgCustom.hidden = kind !== 'text';
    if (fgHex) fgHex.hidden = !showFg;
    const fgColor = showFg ? normalizeHex(fgHex?.value ?? '') : null;
    if (fgColor) {
      stage.dataset.fg = 'custom';
      stage.style.setProperty('--mq-lab-fg', fgColor);
    } else {
      stage.dataset.fg = 'material';
      stage.style.removeProperty('--mq-lab-fg');
    }

    marquee.restart();
  };

  dir?.addEventListener('k3-change', apply);
  continuous?.addEventListener('k3-change', apply);
  content?.addEventListener('k3-change', apply);
  hover?.addEventListener('k3-change', apply);
  pauseItems?.addEventListener('k3-change', apply);
  fade?.addEventListener('k3-change', apply);
  bgCustom?.addEventListener('k3-change', apply);
  bgHex?.addEventListener('k3-change', apply);
  bgHex?.addEventListener('k3-input', apply);
  fgCustom?.addEventListener('k3-change', apply);
  fgHex?.addEventListener('k3-change', apply);
  fgHex?.addEventListener('k3-input', apply);
  textSize?.addEventListener('k3-input', apply);
  textSize?.addEventListener('k3-change', apply);
  font?.addEventListener('k3-change', apply);
  drag?.addEventListener('k3-change', apply);
  pauseScroll?.addEventListener('k3-change', apply);
  variant?.addEventListener('k3-change', apply);
  badge?.addEventListener('k3-change', apply);
  apply();
}

/** Code block gallery — one sample per language. */
let codeblockGalleryWired = false;
async function wireCodeblockGallery(): Promise<void> {
  const select = document.getElementById('codeblock-lang') as (HTMLElement & { value?: string }) | null;
  const block = document.getElementById('codeblock-gallery') as
    | (HTMLElement & { language: string; label: string; code: string })
    | null;
  if (!select || !block || codeblockGalleryWired) return;
  codeblockGalleryWired = true;
  const { CODE_SAMPLES } = await import('./code-samples.js');
  select.replaceChildren(
    ...CODE_SAMPLES.map((sample, i) => {
      const item = document.createElement('k3-menu-item');
      item.setAttribute('value', String(i));
      item.textContent = sample.title;
      return item;
    }),
  );
  const show = (i: number): void => {
    const sample = CODE_SAMPLES[i];
    if (!sample) return;
    block.language = sample.language;
    block.label = sample.title;
    block.code = sample.code;
  };
  select.addEventListener('k3-change', (e) => {
    if (e.target !== select) return;
    show(Number((e as CustomEvent<{ value?: string }>).detail?.value));
  });
  const start = Math.max(0, CODE_SAMPLES.findIndex((sample) => sample.language === 'php'));
  select.value = String(start);
  show(start);
}

/** Refresh the active Color family page after theme seed/variant change. */
function refreshColorDocs(seed: string): void {
  const page = articlePageId(currentPageId());
  updateColorHct(seed);
  if (page === 'color-roles') renderColorRoles();
  if (page === 'color-palettes') renderColorPalettes(seed);
}

function updateColorHct(seed: string): void {
  try {
    const data = buildDynamicPalettes(seed);
    const text = `HCT  h=${data.hct.hue.toFixed(1)}  c=${data.hct.chroma.toFixed(1)}  t=${data.hct.tone.toFixed(1)}  ·  variant=${colorVariant}`;
    document.querySelectorAll<HTMLElement>('.color-hct').forEach((el) => {
      el.textContent = text;
    });
  } catch {
    /* ignore invalid seed while typing */
  }
}

/** Specs / Properties / Methods / … — always `<k3-table>` (current page only). */
async function ensureDocTables(pageId?: string): Promise<void> {
  const [{ createDocTable, INIT_SECTION }, { mountDocPage }] = await Promise.all([
    loadDocTables(),
    import('./mount-doc-page.js'),
  ]);
  const id = pageId ?? currentPageId();
  if (id === 'home') {
    const home = document.getElementById('page-home');
    if (home && !home.querySelector('[data-doc-table="init"]')) {
      await registry.register('k3-table');
      const host = home.querySelector('.doc-tables') ?? document.createElement('div');
      host.className = 'doc-tables';
      if (!host.isConnected) home.appendChild(host);
      host.append(createDocTable(INIT_SECTION));
    }
    return;
  }
  if (id === 'quick-start') return;
  const page = document.querySelector<HTMLElement>(`.comp-page[data-page="${id}"]`);
  if (!page) return;
  await Promise.all([registry.register('k3-table'), registry.register('k3-codeblock')]);
  mountDocPage(page, id);
  applyPlaygroundI18n();
}

function readCssColorVar(cssVar: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) return '';
  if (raw.startsWith('#')) return raw.length === 7 ? raw.toUpperCase() : raw;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((x) => x!.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function contrastBadgeHtml(role: string): string {
  const pair = contrastPairFor(role);
  if (!pair) return '';
  const bgHex = readCssColorVar(colorRoleToCssVar(pair.bg));
  const fgHex = readCssColorVar(colorRoleToCssVar(pair.fg));
  if (!bgHex || !fgHex) return '';
  const ratio = contrastRatio(bgHex, fgHex);
  const grade = contrastGrade(ratio);
  const gradeClass =
    grade === 'fail' ? 'is-fail' : grade === 'AA Large' ? 'is-large' : 'is-pass';
  const vs = role === pair.bg ? pair.fg : pair.bg;
  return `<span class="color-contrast ${gradeClass}" title="${bgHex} / ${fgHex}">${ratio.toFixed(1)}:1 ${grade} · ${vs}</span>`;
}

/** Text color on a role swatch = paired on/bg token (not luminance guess). */
function roleSwatchForeground(role: string, hex: string): string {
  if (hex === 'transparent') return 'inherit';
  const pair = contrastPairFor(role);
  if (pair) {
    const mate = role === pair.bg ? pair.fg : pair.bg;
    const mateHex = readCssColorVar(colorRoleToCssVar(mate));
    if (mateHex) return mateHex;
  }
  return swatchLabelColor(hex);
}

function renderColorRoles(): void {
  const host = document.getElementById('color-roles');
  if (!host) return;
  host.innerHTML = COLOR_ROLE_GROUPS.map((group) => {
    const cards = group.roles
      .map((role) => {
        const cssVar = colorRoleToCssVar(role);
        const hex = readCssColorVar(cssVar) || 'transparent';
        const fg = roleSwatchForeground(role, hex);
        const label = role.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
        const contrast = hex === 'transparent' ? '' : contrastBadgeHtml(role);
        return `<button type="button" class="color-role-swatch color-copy-target" style="background:${hex};color:${fg}" data-copy-hex="${hex}" data-copy-var="${cssVar}" title="${t('doc.color-lab.copy-hint')}">
          <span class="color-role-name">${label}</span>
          <span class="color-role-hex code-inline">${hex}</span>
          <span class="color-role-var code-inline">${cssVar}</span>
          ${contrast}
        </button>`;
      })
      .join('');
    return `<div class="color-role-group" id="color-group-${group.id}">
      <h3>${t(group.labelKey)}</h3>
      <div class="color-role-grid">${cards}</div>
    </div>`;
  }).join('');
}

function renderExtraPalettes(): void {
  const host = document.getElementById('color-extras-palettes');
  if (!host) return;
  const toneOrder = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    'A100',
    'A200',
    'A400',
    'A700',
  ] as const satisfies readonly M2Tone[];
  host.innerHTML = M2_PALETTE_NAMES.map((name) => {
    const swatches = M2_PALETTES[name];
    const cells = toneOrder
      .filter((tone) => swatches[tone])
      .map((tone) => {
        const hex = swatches[tone]!;
        const cssVar = m2PaletteCssVar(name, tone);
        const fg = swatchLabelColor(hex);
        const hexUp = hex.toUpperCase();
        return `<button type="button" class="color-swatch color-m2-swatch color-copy-target" style="background:var(${cssVar});color:${fg}" data-copy-hex="${hexUp}" data-copy-var="${cssVar}" title="${hexUp}">
          <span>${tone}</span>
        </button>`;
      })
      .join('');
    const label = name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `<div class="color-palette-block">
      <h2>${label}</h2>
      <div class="color-tone-row color-m2-row">${cells}</div>
    </div>`;
  }).join('');
}

function renderColorPalettes(seed: string): void {
  const host = document.getElementById('color-palettes');
  if (!host) return;
  try {
    const data = buildDynamicPalettes(seed);
    updateColorHct(seed);
    host.innerHTML = Object.entries(data.palettes)
      .map(
        ([name, swatches]) => `<div class="color-palette-block">
        <h3>${name}</h3>
        <div class="color-tone-row">
          ${swatches
            .map((s) => {
              const hex = s.hex.toUpperCase();
              return `<button type="button" class="color-swatch color-copy-target" style="background:${hex};color:${swatchLabelColor(hex)}" data-copy-hex="${hex}" title="${hex}">
              <span>${s.tone}</span>
            </button>`;
            })
            .join('')}
        </div>
      </div>`,
      )
      .join('');
  } catch (err) {
    console.error(err);
  }
}


/** Custom elements upgraded (and first-rendered) per task while stamping pages. */
const UPGRADES_PER_TASK = 6;

const isCustom = (el: Element): boolean => el.localName.includes('-');
const customCount = (el: Element): number =>
  (isCustom(el) ? 1 : 0) + [...el.querySelectorAll('*')].filter(isCustom).length;

/**
 * Append `nodes` to `parent` like the HTML parser streams a page: plain
 * containers holding many components go in first, then their children, and
 * the main thread is released every few component upgrades. A custom
 * element always arrives with its children (no partial slot content).
 */
async function streamInto(parent: Node, nodes: Node[], state: { upgrades: number }): Promise<void> {
  for (const node of nodes) {
    if (node instanceof Element) {
      const count = customCount(node);
      if (!isCustom(node) && count > UPGRADES_PER_TASK) {
        const children = [...node.childNodes];
        node.replaceChildren();
        parent.appendChild(node);
        await streamInto(node, children, state);
        continue;
      }
      parent.appendChild(node);
      state.upgrades += count;
    } else {
      parent.appendChild(node);
    }
    if (state.upgrades >= UPGRADES_PER_TASK) {
      state.upgrades = 0;
      await yieldToMain();
    }
  }
}

/** Page bodies moved out of index.html at build (playground/vite.config.ts). */
async function fetchDocPages(): Promise<Record<string, string>> {
  const url = document.querySelector<HTMLMetaElement>('meta[name="k3-doc-pages"]')?.content;
  if (!url) return {};
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as Record<string, string>;
    } catch {
      /* offline blip — retry below */
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
  console.error(`[playground] could not load ${url}`);
  return {};
}

/**
 * index.html ships the shell and the home page only; the other doc pages are
 * fetched and put back here — the requested page first — one page per task,
 * so component upgrades never pile up into one long task. Everything that
 * wires demos runs afterwards, on the same DOM as before.
 */
async function stampDocPages(firstPageId?: string): Promise<void> {
  const pages = await fetchDocPages();
  const ids = Object.keys(pages);
  const first = ids.indexOf(firstPageId ?? '');
  if (first > 0) ids.unshift(...ids.splice(first, 1));
  for (const id of ids) {
    const article = document.querySelector<HTMLElement>(`.comp-page[data-page="${CSS.escape(id)}"]`);
    if (article && !article.firstElementChild) {
      const tpl = document.createElement('template');
      tpl.innerHTML = pages[id]!;
      await streamInto(article, [...tpl.content.childNodes], { upgrades: 0 });
    }
    await yieldToMain();
  }
}

async function boot(): Promise<void> {
  const app = document.querySelector('.app');
  const errBox = document.getElementById('boot-error');

  try {
    window.K3UI_MANUAL = true;
    const savedSeed = seeds[seedIdx] ?? seeds[0]!;
    const savedLocaleRaw = docStore.get(DocKeys.uiLocale, 'fr') as string;
    const savedLocale: PlaygroundLocale = isPlaygroundLocale(savedLocaleRaw)
      ? savedLocaleRaw
      : 'fr';
    syncThemeElement(savedSeed);
    const api = await init({
      locale: playgroundToI18n(savedLocale),
      theme: {
        seed: savedSeed,
        mode: themeMode,
        motion: motionScheme,
        variant: colorVariant,
        contrast: contrastLevel,
        specVersion: colorSpec,
      },
      debug: false,
      components: [...SHELL_COMPONENTS],
    });

    cacheAppliedTheme();
    const ver = document.getElementById('ver');
    if (ver) ver.textContent = `v${api.version}`;
    /* Boot in short tasks: each step's component renders stay in its own task. */
    await yieldToMain();
    /* Hero morph ASAP — CSS d keyframes must start on first home paint. */
    void import('./hero-morph/mount.js').then((m) => m.mountHomeHeroMorph());

    applyAdaptiveShell();
    containerOn = docStore.get(DocKeys.uiContainer, true);
    applyContainerLayout();
    const savedProduct = docStore.get<DocProduct>(DocKeys.docProduct, 'k3ui');
    applyDocProduct(savedProduct === 'k3ux' ? 'k3ux' : 'k3ui');
    if (getDocProduct() === 'k3ux') void ensureK3ux();
    wireProductSwitch();
    buildPrimaryNav();
    await yieldToMain();
    buildNavMenu();
    await yieldToMain();
    buildCatalogGrid();
    void mountHomeAmbient();
    document.querySelectorAll<HTMLElement>('[data-nav="quick-start"]').forEach((btn) => {
      if (btn.dataset.wiredNav) return;
      btn.dataset.wiredNav = '1';
      btn.addEventListener('click', () => {
        void navigateDocPage('quick-start', ensurePageComponents);
      });
    });
    rebuildGridOverlay();
    setDocumentDir(docStore.get(DocKeys.uiDir, 'ltr'));
    applyAnimationsPreference();
    /* Re-apply persisted theme (seed already restored into seeds[seedIdx]) */
    applyThemePersist();
    await yieldToMain();
    /* Restore region tag (nl-BE / de-AT…) + html lang after init’s language code */
    document.documentElement.lang = localeMenuEntry(savedLocale).htmlLang;
    /* After CE upgrade + adoptMenuItems (flags live in split shadow menu) */
    const paintLocaleFlags = (): void => mountLocaleFlags(currentLocale());
    paintLocaleFlags();
    queueMicrotask(paintLocaleFlags);
    requestAnimationFrame(paintLocaleFlags);
    applyPlaygroundI18n();
    document.addEventListener('k3-locale-change', () => applyPlaygroundI18n());
    wireShellGithubMenu();
    /* Shell + home are interactive — now the deferred doc pages (short tasks). */
    await yieldToMain();
    /* Defined before the pages arrive: their dialogs / tooltips / switches upgrade
       in the same small batches as the rest of each page. */
    await registry.registerAll([...SHELL_DEFERRED]);
    await stampDocPages(articlePageId(currentPageId()));
    wireQuickStartTabs();
    wireCodeSamples();
    ariaTabs();
    installTabKeyboard();
    await yieldToMain();
    /* Demo frames → equal cases + horizontal nums (skip matrix / fab-menu) — page by page */
    for (const page of document.querySelectorAll<HTMLElement>('.comp-page')) {
      enhanceAllDemos(page);
      await yieldToMain();
    }
    /* Usage HTML/CSS/JS mounts with the page (ensureDocTables) — not 97 pages at boot */
    applyPlaygroundI18n();
    await yieldToMain();

    /** Register only CE tags present on a page (avoids upgrading every demo at boot). */
    const ensurePageComponents = async (pageId: string): Promise<void> => {
      const articleId = articlePageId(pageId);
      const page =
        document.querySelector<HTMLElement>(`.comp-page[data-page="${articleId}"]`) ??
        (articleId === 'home' ? document.getElementById('page-home') : null);
      if (!page) return;
      /* Load k3ux module when visiting a UX page (even before scanning tags). */
      if (K3UX_PAGES.has(articleId) || getDocProduct() === 'k3ux') {
        await ensureK3ux();
      }
      const tags = collectPageK3Tags(page);
      /* k3ui + k3ux: only tags present on this page, so demos work without refresh. */
      await registerPresentK3Tags(tags);
      /* JetBrains Mono — needed for k3-codeblock + any light-DOM pre/code */
      if (
        articleId === 'codeblock' ||
        articleId === 'quick-start' ||
        tags.includes('k3-codeblock') ||
        page.querySelector('pre, code')
      ) {
        void import('../src/fonts/fonts-code.css');
      }
      if (articleId === 'shapes') await fillShapes();
      if (articleId === 'lazy') wireLazyDemos();
      if (articleId === 'material-symbols') await mountMaterialSymbols();
      if (articleId === 'codeblock') void wireCodeblockGallery();
      if (articleId === 'navigation-rail') wireNavRailLab();
      if (articleId === 'marquee') wireMarqueeDemos();
      if (
        articleId === 'spacing' ||
        articleId === 'elevation' ||
        articleId === 'grid' ||
        articleId === 'motion' ||
        articleId === 'shapes' ||
        articleId === 'typography' ||
        isColorFamilyPage(articleId)
      ) {
        await registry.register('k3-table');
        await fillStyleTokenDemos();
      }
      const seed = seeds[seedIdx] ?? savedSeed;
      if (articleId === 'color-roles') {
        syncColorSeedInputs(seed);
        renderColorRoles();
        updateColorHct(seed);
      }
      if (articleId === 'color-palettes') {
        syncColorSeedInputs(seed);
        renderColorPalettes(seed);
      }
      if (articleId === 'color-extras') renderExtraPalettes();
      if (
        articleId !== 'home' &&
        articleId !== 'quick-start' &&
        articleId !== 'material-symbols'
      ) {
        await ensureDocTables(articleId);
        wirePinSuccessDemo();
      }
      /* Labs that need upgraded CEs — wire after registerAll for this page. */
      if (articleId === 'countdown') wireCountdownLab();
      if (articleId === 'carousel') wireCarouselLab();
      if (articleId === 'coverflow') wireCoverflowDemo();
      if (articleId === 'halftone') wireHalftoneLab();
      if (articleId === 'text-bounce') wireTextBounceDemo();
      if (articleId === 'text-scramble') wireTextScrambleDemo();
      if (articleId === 'confetti') wireConfettiDemo();
      if (articleId === 'snow') wireSnowDemo();
      if (articleId === 'firework') wireFireworkDemo();
      if (articleId === 'voice-ring') wireVoiceRingDemo();
      if (articleId === 'index-list') wireIndexListDemo();
      if (articleId === 'card-holo') {
        /* Sibling package source (playground alias also maps k3ux/holo-effects.css). */
        await import('../../k3ux/addons/holo-effects/holo-effects.scss');
        wireHoloCardDemo();
      }
      if (articleId === 'card-scratch') wireScratchCardDemo();
      if (
        articleId === 'charts-bar' ||
        articleId === 'charts-line' ||
        articleId === 'charts-other'
      ) {
        await wireChartDemos();
      }
      if (articleId === 'iso-filter') await wireIsoFilterDemo();
      if (articleId === 'masonry') await wireMasonryDemo();
    };

    const initialPage = currentPageId();
    /* Deep link: upgrade the page's components behind the veil, before it is shown —
       otherwise they resize in view (CLS). Page wiring still runs once visible. */
    const initialArticle = articlePageId(initialPage);
    if (initialArticle !== 'home') {
      if (K3UX_PAGES.has(initialArticle)) await ensureK3ux();
      const page = document.querySelector(`.comp-page[data-page="${CSS.escape(initialArticle)}"]`);
      await registerPresentK3Tags(collectPageK3Tags(page));
    }
    /* Veil already on from first paint (data-k3-booting) — finish under it, then lift. */
    await navigateDocPage(initialPage, ensurePageComponents);
    document.documentElement.removeAttribute('data-k3-deeplink');
    document.documentElement.removeAttribute('data-k3-booting');

    window.addEventListener('hashchange', () => {
      void navigateDocPage(currentPageId(), ensurePageComponents);
    });

    afterFirstPaint(() => {
      /* Material Symbols variable fonts (several MB, Google CDN) load on demand
         when their pages open — never prefetched for every visitor. */
      warmCatalogOnIntent();
    });

    /*
     * Primary nav:
     * - destination with href → navigate (Quick Start)
     * - otherwise → open secondary menu (Components / Styles)
     * Rail + fine pointer: open on hover (submenus follow open-on=hover).
     * Compact bar / coarse pointer: keep click.
     * Capture + stopPropagation so the rail/bar does not steal `active`
     * before we resolve the destination.
     */
    const resolvePrimaryDest = (
      host: HTMLElement,
      e: Event,
    ): { item: Element; dest: (typeof NAV_DESTINATIONS)[number] } | null => {
      const item = navItemFromEvent(e, host);
      if (!item) return null;
      const slotted = new Set([...host.querySelectorAll('[slot]')].map((el) => el as Element));
      const items = [...host.querySelectorAll('k3-nav-item')].filter((el) => !slotted.has(el));
      const idx = items.indexOf(item as (typeof items)[number]);
      const dest = NAV_DESTINATIONS[idx];
      if (idx < 0 || !dest) return null;
      return { item, dest };
    };

    const shellNavMode = (): 'bar' | 'rail' =>
      (document.querySelector('.app')?.getAttribute('data-nav') as 'bar' | 'rail' | null) ??
      navMode();

    const onPrimaryClick = (e: Event): void => {
      const host = e.currentTarget as HTMLElement;
      const hit = resolvePrimaryDest(host, e);
      if (!hit) return;
      const { item, dest } = hit;
      e.preventDefault();
      e.stopPropagation();
      if (dest.href) {
        closeShellNavMenu();
        if (location.hash === dest.href || location.hash === dest.href.replace(/^#/, '#')) {
          void navigateDocPage(dest.id, ensurePageComponents).then(() => buildPrimaryNav());
        } else {
          location.hash = dest.href;
        }
        return;
      }
      const mode = shellNavMode();
      if (mode === 'bar') {
        void openShellNavSheet(dest.id);
        return;
      }
      /* Hover mode: click opens without toggle-close (leave dismisses) */
      const hover = canHoverOpen();
      shellNavMenu()?.armDismissGuard?.(320);
      void openShellNavMenu(dest.id, item as HTMLElement, { toggle: !hover });
    };

    /** Grace before closing when the pointer leaves rail item ↔ menu. */
    const RAIL_HOVER_CLOSE_MS = 160;
    let railHoverCloseTimer = 0;
    const clearRailHoverClose = (): void => {
      if (!railHoverCloseTimer) return;
      window.clearTimeout(railHoverCloseTimer);
      railHoverCloseTimer = 0;
    };
    const scheduleRailHoverClose = (): void => {
      clearRailHoverClose();
      railHoverCloseTimer = window.setTimeout(() => {
        railHoverCloseTimer = 0;
        if (!canHoverOpen() || shellNavMode() !== 'rail') return;
        const menu = shellNavMenu();
        /*
         * Keep open only while the pointer is on the menu.
         * Staying on rail chrome (padding / divider / empty) must dismiss —
         * do NOT gate on rail:hover (that left flyouts stuck until content).
         */
        if (menu?.matches(':hover')) return;
        closeShellNavMenu();
      }, RAIL_HOVER_CLOSE_MS);
    };

    const onRailPointerOver = (e: PointerEvent): void => {
      if (!canHoverOpen() || shellNavMode() !== 'rail') return;
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const rail = e.currentTarget as HTMLElement;
      const hit = resolvePrimaryDest(rail, e);
      if (!hit) {
        /* Rail surface without a dest item — dismiss secondary */
        if (openMenuDestId) scheduleRailHoverClose();
        return;
      }
      clearRailHoverClose();
      const { item, dest } = hit;
      if (dest.href) {
        /* Leaf destination — close any open secondary while hovering it */
        if (openMenuDestId) scheduleRailHoverClose();
        return;
      }
      const menu = shellNavMenu();
      menu?.armDismissGuard?.(320);
      void openShellNavMenu(dest.id, item as HTMLElement, { toggle: false });
    };

    const onRailPointerLeave = (e: PointerEvent): void => {
      if (!canHoverOpen() || shellNavMode() !== 'rail') return;
      const related = e.relatedTarget;
      const menu = shellNavMenu();
      if (related === menu) return;
      if (related instanceof Element && related.closest('#shell-nav-menu')) return;
      if (related instanceof Node && menu?.contains(related)) return;
      if (related instanceof Element) {
        const root = related.getRootNode();
        if (root instanceof ShadowRoot && (root.host === menu || menu?.contains(root.host))) {
          return;
        }
      }
      scheduleRailHoverClose();
    };

    document.getElementById('nav-rail')?.addEventListener('click', onPrimaryClick, true);
    document.getElementById('nav-bar')?.addEventListener('click', onPrimaryClick, true);
    document.getElementById('nav-rail')?.addEventListener('pointerover', onRailPointerOver);
    document.getElementById('nav-rail')?.addEventListener('pointerleave', onRailPointerLeave);
    document.getElementById('shell-nav-menu')?.addEventListener('pointerenter', () => {
      clearRailHoverClose();
    });
    document.getElementById('shell-nav-menu')?.addEventListener('pointerleave', () => {
      if (!canHoverOpen() || shellNavMode() !== 'rail') return;
      scheduleRailHoverClose();
    });

    /* Keep sticky audio dock + modal app-bar bleed in sync with rail width. */
    const shellRail = document.getElementById('nav-rail');
    const syncRailSizeSoon = (): void => {
      syncShellRailInlineSize();
      requestAnimationFrame(() => syncShellRailInlineSize());
    };
    shellRail?.addEventListener('k3-expand', syncRailSizeSoon);
    if (shellRail && typeof ResizeObserver === 'function') {
      const railRo = new ResizeObserver(() => syncShellRailInlineSize());
      railRo.observe(shellRail);
    }
    if (shellRail && typeof MutationObserver === 'function') {
      new MutationObserver(syncRailSizeSoon).observe(shellRail, {
        attributes: true,
        attributeFilter: ['size', 'expanded', 'layout', 'mode'],
      });
    }

    /* Outside dismiss / Escape — keep toggle state in sync */
    document.getElementById('shell-nav-menu')?.addEventListener('k3-close-end', () => {
      openMenuDestId = null;
      syncNavMenuOpenHighlight();
    });
    document.getElementById('shell-nav-sheet')?.addEventListener('k3-close-end', () => {
      openSheetDestId = null;
      syncNavMenuOpenHighlight();
    });

    /* Compact sheet: accordion toggle + leaf navigate */
    document.getElementById('shell-nav-sheet-body')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const groupBtn = target.closest<HTMLButtonElement>('.shell-sheet-group-btn');
      if (groupBtn) {
      e.preventDefault();
        e.stopPropagation();
        const group = groupBtn.closest<HTMLElement>('.shell-sheet-group');
        const body = document.getElementById('shell-nav-sheet-body');
        if (!group || !body) return;
        const willOpen = !group.classList.contains('is-open');
        /* Accordion: one open section at a time */
        body.querySelectorAll<HTMLElement>('.shell-sheet-group.is-open').forEach((g) => {
          if (g === group) return;
          g.classList.remove('is-open');
          const b = g.querySelector<HTMLButtonElement>('.shell-sheet-group-btn');
          const p = g.querySelector<HTMLElement>('.shell-sheet-children');
          if (b) b.setAttribute('aria-expanded', 'false');
          if (p) p.hidden = true;
        });
        group.classList.toggle('is-open', willOpen);
        groupBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        const panel = group.querySelector<HTMLElement>('.shell-sheet-children');
        if (panel) panel.hidden = !willOpen;
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a.shell-sheet-link');
      if (!link) return;
      const value = link.dataset.value;
      if (!value) return;
      e.preventDefault();
      const next = `#/${value}`;
      closeShellNavMenu();
      if (location.hash === next) void navigateDocPage(value, ensurePageComponents);
      else location.hash = next;
    });

    /* Rail header FAB → home */
    const goHome = (): void => {
      closeShellNavMenu();
      if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
        void navigateDocPage('home', ensurePageComponents);
      } else {
        location.hash = '#/';
      }
    };
    document.getElementById('rail-fab')?.addEventListener('k3-click', goHome);

    /* Secondary menu leaf items → navigate then close (ignore category parents) */
    document.getElementById('shell-nav-menu')?.addEventListener('k3-select', (e) => {
      const value = (e as CustomEvent<{ value?: string }>).detail?.value;
      if (!value || value.startsWith('cat-')) return;
      const next = `#/${value}`;
      closeShellNavMenu();
      if (location.hash === next) {
        void navigateDocPage(value, ensurePageComponents);
      } else {
        location.hash = next;
      }
    });

    const onResize = (): void => {
      const prev = document.querySelector('.app')?.getAttribute('data-nav');
      applyAdaptiveShell();
      applyContainerLayout();
      buildPrimaryNav();
      rebuildGridOverlay();
      /* Crossing compact ↔ rail: dismiss the wrong secondary surface */
      const next = document.querySelector('.app')?.getAttribute('data-nav');
      if (prev && next && prev !== next) closeShellNavMenu();
    };
    matchMedia(MQ_COMPACT).addEventListener('change', onResize);
    matchMedia(MQ_MEDIUM).addEventListener('change', onResize);
    matchMedia(MQ_BODY_CONTAINER).addEventListener('change', onResize);

    app?.classList.add('is-ready');
    document.documentElement.classList.add('k3-ready');
    document.documentElement.removeAttribute('data-k3-booting');
  } catch (err) {
    console.error(err);
    document.documentElement.removeAttribute('data-k3-deeplink');
    document.documentElement.removeAttribute('data-k3-booting');
    setDocPageLoading(false);
    if (errBox) {
      errBox.hidden = false;
      errBox.textContent = `K3ui init failed: ${err instanceof Error ? err.message : String(err)}`;
    }
    return;
  }
  await yieldToMain();

  type SnackEl = HTMLElement & {
    show: () => Promise<boolean>;
    hide: (source?: 'user' | 'api' | 'auto') => Promise<boolean>;
  };
  const snackIds = ['snack', 'snack-action', 'snack-dismiss', 'snack-twoline', 'snack-stacked'] as const;
  const showSnack = (id: (typeof snackIds)[number]): void => {
    const el = document.getElementById(id) as SnackEl | null;
    void el?.show();
  };
  document.getElementById('btn-snack')?.addEventListener('click', () => showSnack('snack'));
  document.getElementById('btn-snack-action')?.addEventListener('click', () => showSnack('snack-action'));
  document
    .getElementById('btn-snack-dismiss')
    ?.addEventListener('click', () => showSnack('snack-dismiss'));
  document
    .getElementById('btn-snack-twoline')
    ?.addEventListener('click', () => showSnack('snack-twoline'));
  document
    .getElementById('btn-snack-stacked')
    ?.addEventListener('click', () => showSnack('snack-stacked'));
  document.getElementById('btn-snack-api')?.addEventListener('click', () => {
    void window.K3UI?.snackbar.show({
      message: 'Queued via K3UI.snackbar.show()',
      action: 'Undo',
      dismissible: true,
      duration: 'short',
      queue: 'replace',
    });
  });

  type DialogEl = HTMLElement & {
    show: () => Promise<boolean>;
    hide: () => Promise<boolean>;
  };
  const dlg = document.getElementById('dlg') as DialogEl | null;
  const dlgFs = document.getElementById('dlg-fs') as DialogEl | null;
  document.getElementById('btn-dialog')?.addEventListener('click', () => void dlg?.show());
  document.getElementById('btn-dialog-fs')?.addEventListener('click', () => void dlgFs?.show());

  document.getElementById('btn-skeleton-toggle')?.addEventListener('click', () => {
    /* Only skeletons that wrap real content — empty bones have nothing to reveal */
    const bones = document.querySelectorAll<HTMLElement & { loaded: boolean }>('.skel-reveal');
    const next = ![...bones].some((el) => el.loaded);
    bones.forEach((el) => {
      el.loaded = next;
    });
  });
  document.getElementById('dlg-ok')?.addEventListener('k3-click', () => void dlg?.hide());
  document.getElementById('dlg-cancel')?.addEventListener('k3-click', () => void dlg?.hide());
  document.getElementById('dlg-fs-save')?.addEventListener('k3-click', () => void dlgFs?.hide());

  type SheetEl = HTMLElement & { show: () => Promise<boolean>; hide: () => Promise<boolean> };
  const sheetBottom = document.getElementById('sheet-bottom') as SheetEl | null;
  const sheetBottomFull = document.getElementById('sheet-bottom-full') as SheetEl | null;
  const sheetSide = document.getElementById('sheet-side') as SheetEl | null;
  const sheetStart = document.getElementById('sheet-start') as SheetEl | null;
  document
    .getElementById('btn-sheet-bottom')
    ?.addEventListener('click', () => void sheetBottom?.show());
  document
    .getElementById('btn-sheet-bottom-full')
    ?.addEventListener('click', () => void sheetBottomFull?.show());
  document.getElementById('btn-sheet-side')?.addEventListener('click', () => void sheetSide?.show());
  document.getElementById('btn-sheet-start')?.addEventListener('click', () => void sheetStart?.show());
  document
    .getElementById('sheet-bottom-close')
    ?.addEventListener('click', () => void sheetBottom?.hide());
  document
    .getElementById('sheet-bottom-full-close')
    ?.addEventListener('click', () => void sheetBottomFull?.hide());
  document.getElementById('sheet-side-close')?.addEventListener('click', () => void sheetSide?.hide());
  document.getElementById('sheet-start-close')?.addEventListener('click', () => void sheetStart?.hide());

  await yieldToMain();
  wireShellChrome();
  await yieldToMain();
  wireDemoPages();
  /* Demo wiring must never leave snow running when the settings toggle is off. */
  void applyShellSnow(articlePageId(currentPageId()));
}

/** App-bar chrome — locale + settings sheet (theme / motion / layout / seed). */
function wireShellChrome(): void {
  document.getElementById('locale-menu')?.addEventListener('k3-select', (e) => {
    const v = (e as CustomEvent<{ value?: string }>).detail?.value;
    if (typeof v === 'string' && isPlaygroundLocale(v)) setLocale(v);
  });

  /* Chip version badge — never toggle selected */
  document.getElementById('ver')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  containerOn = docStore.get(DocKeys.uiContainer, true);
  gridOn = docStore.get(DocKeys.uiGrid, false);
  const overlay = document.getElementById('grid-overlay');

  applyContainerLayout();
  if (overlay) overlay.hidden = !gridOn;
  if (gridOn) rebuildGridOverlay();
  syncSettingsSheet();
  queueMicrotask(syncSettingsSheet);
  requestAnimationFrame(syncSettingsSheet);

  const openSettings = (): void => {
    void openSettingsSheet();
  };
  document.getElementById('btn-settings')?.addEventListener('k3-click', openSettings);

  const flashToggle = (labelKey: string, on: boolean): void => {
    void showFlash(
      t('playground.settings.flash.toggle', {
        label: t(labelKey),
        state: t(on ? 'playground.settings.flash.on' : 'playground.settings.flash.off'),
      }),
    );
  };

  document.getElementById('settings-theme-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const mode = btn?.getAttribute('data-settings-theme');
    if (mode === 'light' || mode === 'dark' || mode === 'auto' || mode === 'system') {
      setThemeMode(mode);
      void showFlash(
        t('playground.settings.flash.theme', { value: t(`playground.ctrl.theme.${mode}`) }),
      );
    }
  });

  /* Color spec — applied on the fly (theme API is synchronous; no re-init) */
  document.getElementById('settings-spec')?.addEventListener('k3-change', (e) => {
    if (e.target !== e.currentTarget) return;
    const v = (e as CustomEvent<{ value?: string }>).detail?.value;
    if (v !== '2021' && v !== '2025') return;
    if (v === colorSpec) return;
    colorSpec = v;
    applyThemePersist();
    void showFlash(t('playground.settings.flash.spec', { value: t(`playground.ctrl.spec.${v}`) }));
  });

  /* Color variant (settings sheet) — was missing: UI toggled but theme stayed on expressive */
  document.getElementById('settings-variant-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const next = parseColorVariant(btn?.getAttribute('data-settings-variant'));
    if (next === colorVariant) return;
    colorVariant = next;
    applyThemePersist();
    void showFlash(
      t('playground.settings.flash.variant', {
        value: t(`playground.ctrl.variant.${next}`),
      }),
    );
  });

  document.getElementById('settings-contrast-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    contrastLevel = parseContrast(btn?.getAttribute('data-settings-contrast'));
    applyThemePersist();
    void showFlash(
      t('playground.settings.flash.contrast', {
        value: t(`playground.ctrl.contrast.${contrastLevel}`),
      }),
    );
  });

  document.getElementById('settings-motion-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const scheme = btn?.getAttribute('data-settings-motion');
    if (scheme === 'expressive' || scheme === 'standard') {
      setMotionScheme(scheme);
      void showFlash(
        t('playground.settings.flash.motion', {
          value: t(`playground.ctrl.motion.${scheme}`),
        }),
      );
    }
  });

  document.getElementById('settings-dir-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const next = btn?.getAttribute('data-settings-dir');
    if (next === 'ltr' || next === 'rtl') {
    setDocumentDir(next);
      void showFlash(
        t('playground.settings.flash.dir', { value: t(`playground.ctrl.dir.${next}`) }),
      );
    }
  });

  document.getElementById('settings-animations')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    animationsOn = selected;
    applyAnimationsPreference();
    void showFlash(t(selected ? 'playground.ctrl.motion.on' : 'playground.ctrl.motion.off'));
  });

  document.getElementById('settings-snow')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    shellSnowOn = selected;
    void applyShellSnow().then(() => {
      syncSettingsSheet();
      flashToggle('playground.ctrl.snow', selected);
    });
  });

  document.getElementById('settings-container')?.addEventListener('k3-change', (e) => {
    if (!matchMedia(MQ_BODY_CONTAINER).matches) return;
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    containerOn = selected;
    docStore.set(DocKeys.uiContainer, containerOn);
    applyContainerLayout();
    rebuildGridOverlay();
    syncSettingsSheet();
    flashToggle('playground.ctrl.container', selected);
  });

  document.getElementById('settings-grid')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    gridOn = selected;
    docStore.set(DocKeys.uiGrid, gridOn);
    if (overlay) {
      overlay.hidden = !gridOn;
      if (gridOn) rebuildGridOverlay();
    }
    syncSettingsSheet();
    flashToggle('playground.ctrl.grid', selected);
  });

  document.getElementById('settings-audio')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    setAudioEnabled(selected);
    syncSettingsSheet();
    flashToggle('playground.ctrl.audio', selected);
  });

  document.getElementById('settings-music')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    setMusicEnabled(selected);
    syncSettingsSheet();
    flashToggle('playground.ctrl.music', selected);
  });

  mountSettingsMd2SeedPresets();

  /** MD2 500 presets — apply + persist. */
  document.getElementById('settings-seed-presets')?.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as HTMLElement | null)?.closest?.(
        '.settings-seed-preset[data-settings-seed]',
      );
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const hex = btn.getAttribute('data-settings-seed');
      if (!hex) return;
      applySeedHex(hex);
      syncSettingsSheet();
      const tip = btn.closest('k3-tooltip') as HTMLElement & { content?: string } | null;
      const label =
        (typeof tip?.content === 'string' && tip.content.trim()) ||
        btn.getAttribute('aria-label') ||
        hex;
      void showFlash(t('playground.settings.flash.color', { value: label }));
    },
    true,
  );

  const docSearch = document.getElementById('doc-search') as HTMLElement & {
    value?: string;
    placeholder?: string;
  } | null;
  if (docSearch) docSearch.placeholder = t('playground.search.placeholder');
  docSearch?.addEventListener('k3-input', ((e: CustomEvent<{ value: string }>) => {
    const q = e.detail?.value ?? '';
    if (currentPageId() !== 'home') {
      location.hash = '#/';
      window.setTimeout(() => buildCatalogGrid(q), 0);
      return;
    }
    buildCatalogGrid(q);
  }) as EventListener);
}

/** npm / pnpm toggle on Quick Start install card. */
function wireQuickStartTabs(): void {
  document.querySelectorAll<HTMLElement>('.qs-tabs').forEach((tabs) => {
    const card = tabs.closest('.qs-card');
    if (!card) return;
    tabs.querySelectorAll<HTMLButtonElement>('.qs-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.qsTab;
        if (!id) return;
        selectTab(tabs, btn);
        card.querySelectorAll<HTMLElement>('[data-qs-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.qsPanel !== id;
        });
      });
    });
  });
}

/**
 * HTML / CSS / JS code samples — event delegation so dynamically mounted
 * Usage blocks (mountUsageIfNeeded) work without re-binding.
 */
function wireCodeSamples(): void {
  document.addEventListener('click', (ev) => {
    const tab = (ev.target as Element | null)?.closest?.<HTMLButtonElement>('[data-code-tab]');
    if (tab) {
      const root = tab.closest<HTMLElement>('.code-sample');
      const tabs = root?.querySelector<HTMLElement>('.qs-tabs');
      const id = tab.dataset.codeTab;
      if (!root || !tabs || !id) return;
      selectTab(tabs, tab);
      root.querySelectorAll<HTMLElement>('[data-code-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.codePanel !== id;
      });
      return;
    }

    const copyBtn = (ev.target as Element | null)?.closest?.<HTMLButtonElement>('.code-copy');
    if (!copyBtn) return;
    const root = copyBtn.closest<HTMLElement>('.code-sample');
    if (!root) return;
    void (async () => {
      const panel = root.querySelector<HTMLElement>('[data-code-panel]:not([hidden])');
      const fromCodeblock =
        panel?.getAttribute('code') ||
        (panel as HTMLElement & { code?: string } | null)?.code ||
        '';
      const text =
        fromCodeblock ||
        panel?.querySelector('code')?.textContent ||
        panel?.textContent ||
        '';
      if (!text.trim()) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return;
      }
      const prev = copyBtn.textContent;
      copyBtn.textContent = t('doc.usage.copied');
      window.setTimeout(() => {
        copyBtn.textContent = prev || t('doc.usage.copy');
      }, 1600);
    })();
  });
}

function syncColorSeedInputs(seed: string): void {
  const hex = normalizeHex(seed) ?? seed;
  document.querySelectorAll<HTMLInputElement>('.color-seed-input').forEach((input) => {
    input.value = hex;
  });
  document.querySelectorAll<HTMLInputElement>('.color-hex-input').forEach((input) => {
    if (document.activeElement === input) return;
    input.value = hex;
    input.classList.remove('is-invalid');
  });
}

function syncColorVariantButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-color-variant]').forEach((btn) => {
    const v = btn.getAttribute('data-color-variant');
    (btn as HTMLElement & { selected?: boolean }).selected = v === colorVariant;
  });
}

function syncColorModeButtons(): void {
  const selected: 'light' | 'dark' =
    themeMode === 'dark' || themeMode === 'light'
      ? themeMode
      : resolvedIsDark()
        ? 'dark'
        : 'light';
  document.querySelectorAll<HTMLElement>('[data-color-mode]').forEach((btn) => {
    const v = btn.getAttribute('data-color-mode');
    (btn as HTMLElement & { selected?: boolean }).selected = v === selected;
  });
}

/**
 * Ephemeral playground feedback — always use snackbar (not custom toasts / alert).
 * @see .cursor/rules/playground-snackbar-flash.mdc
 */
async function showFlash(message: string, durationMs = 2000): Promise<void> {
  if (window.K3UI?.snackbar?.show) {
    await window.K3UI.snackbar.show({
      message,
      dismissible: true,
      duration: durationMs,
      queue: 'replace',
    });
    return;
  }
  await registry.register('k3-snackbar');
  const el = document.getElementById('app-snackbar') as
    | (HTMLElement & {
      duration: number | string;
      dismissible: boolean;
      action: string;
      queueBehavior?: string;
      show: () => Promise<boolean>;
    })
    | null;
  if (!el || typeof el.show !== 'function') return;
  el.textContent = message;
  el.duration = durationMs;
  el.dismissible = true;
  el.action = '';
  if (el.queueBehavior !== undefined) el.queueBehavior = 'replace';
  await el.show();
}

async function copyColorValue(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* still acknowledge — value may be selected manually */
  }
  await showFlash(t('doc.color-lab.copied', { value }));
}

function applySeedHex(hex: string): void {
  const next = normalizeHex(hex);
  if (!next) return;
  seeds[seedIdx] = next;
  /* Persist immediately so a reload mid-frame still keeps the pick */
  docStore.set(DocKeys.themeSeed, next);
  docStore.set(DocKeys.themeSeedIdx, seedIdx);
  syncColorSeedInputs(next);
    applyThemePersist();
}

function wireColorLab(): void {
  syncColorSeedInputs(seeds[seedIdx] ?? '#6750A4');
  syncColorVariantButtons();
  syncColorModeButtons();

  document.querySelectorAll<HTMLInputElement>('.color-seed-input').forEach((input) => {
    if (input.dataset.wired === '1') return;
    input.dataset.wired = '1';
    input.addEventListener('input', () => applySeedHex(input.value));
  });

  document.querySelectorAll<HTMLInputElement>('.color-hex-input').forEach((input) => {
    if (input.dataset.wired === '1') return;
    input.dataset.wired = '1';
    const commit = () => {
      const next = normalizeHex(input.value);
      if (!next) {
        input.classList.add('is-invalid');
        return;
      }
      input.classList.remove('is-invalid');
      applySeedHex(next);
    };
    input.addEventListener('change', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      }
    });
    input.addEventListener('input', () => {
      const next = normalizeHex(input.value);
      input.classList.toggle('is-invalid', input.value.trim().length > 0 && !next);
      if (next) applySeedHex(next);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-color-variant]').forEach((btn) => {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      const v = parseColorVariant(btn.getAttribute('data-color-variant'));
      colorVariant = v;
      syncColorVariantButtons();
      applyThemePersist();
    });
  });

  document.querySelectorAll<HTMLElement>('[data-color-mode]').forEach((btn) => {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-color-mode');
      if (mode !== 'light' && mode !== 'dark') return;
      setThemeMode(mode);
      syncColorModeButtons();
    });
  });

  if (!document.documentElement.dataset.colorCopyWired) {
    document.documentElement.dataset.colorCopyWired = '1';
    document.addEventListener('click', (e) => {
      const target = (e.target as Element | null)?.closest?.('.color-copy-target') as
        | HTMLElement
        | null;
      if (!target) return;
      e.preventDefault();
      const preferVar = (e as MouseEvent).altKey;
      const value = preferVar
        ? (target.dataset.copyVar ?? target.dataset.copyHex ?? '')
        : (target.dataset.copyHex ?? target.dataset.copyVar ?? '');
      if (value) void copyColorValue(value);
    });
  }
}

/** Per-page demo wiring (sheets, dialogs, colors variants, …). */
function wireDemoPages(): void {
  void import('./gestures-demo.js').then((m) => m.wireUtilityDemos());
  wireColorLab();
  wireButtonPillDemos();
  wireMeetToolbarDemo();
  wireArrowPadGridDemos();
  wireDatePickerDemo();

  const wireToggle = (id: string): void => {
    const el = document.getElementById(id) as (HTMLElement & { selected: boolean }) | null;
    el?.addEventListener('k3-click', () => {
      el.selected = !el.selected;
    });
  };
  wireToggle('btn-toggle');
  wireToggle('btn-toggle-square');
  wireSliderLab();
  wireProgressLab();
  wireCountdownLab();
  wireCarouselLab();
  wireConfettiDemo();
  wireSnowDemo();
  wireFireworkDemo();
  wireTextBounceDemo();
  wireTextScrambleDemo();
  wireChartDemos();
  wireAudioPlayerDemoRights();
}

/** Date picker demos — modal open, year bounds, weekday blackout (Noph coverage). */
function wireDatePickerDemo(): void {
  const page = document.getElementById('page-date-picker');
  if (!page || page.dataset.dpWired) return;
  page.dataset.dpWired = '1';

  type DpEl = HTMLElement & {
    show: (anchor?: HTMLElement | null) => Promise<boolean>;
    value: string;
    minDate: string;
    maxDate: string;
    blackoutDates: ((d: { year: number; month: number; day: number }) => boolean) | null;
  };

  const y = new Date().getFullYear();
  const bound = document.getElementById('dp-bound') as DpEl | null;
  if (bound) {
    bound.minDate = `${y}-01-01`;
    bound.maxDate = `${y}-12-31`;
  }

  const blackout = document.getElementById('dp-blackout') as DpEl | null;
  if (blackout) {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    blackout.minDate = iso;
    blackout.blackoutDates = (d) => {
      const wd = new Date(d.year, d.month - 1, d.day).getDay();
      return wd === 0 || wd === 6;
    };
  }

  const modal = document.getElementById('dp-modal') as DpEl | null;
  const openBtn = document.getElementById('dp-modal-open');
  const valueEl = document.getElementById('dp-modal-value');
  openBtn?.addEventListener('k3-click', () => void modal?.show(openBtn));
  openBtn?.addEventListener('click', () => void modal?.show(openBtn));
  modal?.addEventListener('k3-change', ((e: CustomEvent<{ value?: string }>) => {
    if (valueEl) valueEl.textContent = e.detail?.value || '—';
  }) as EventListener);
}

/** Coverflow playground — one stage; connected opts + lightbox/flip mode. */
function wireCoverflowDemo(): void {
  const page = document.getElementById('page-coverflow');
  if (!page || page.dataset.coverflowWired) return;

  type FlowEl = HTMLElement & {
    arrows: boolean;
    bullets: boolean;
    noReflection: boolean;
    mode: 'loop' | 'bounded';
    lightbox: boolean;
    fullWidth: boolean;
    effect: 'coverflow' | 'slide';
    orientation: 'horizontal' | 'vertical';
    index: number;
  };
  type GroupEl = HTMLElement & { selectedValues: () => string[] };

  const flow = document.getElementById('coverflow-demo') as FlowEl | null;
  const opts = document.getElementById('cf-opts') as GroupEl | null;
  const mode = document.getElementById('cf-mode') as GroupEl | null;
  const width = document.getElementById('cf-width') as GroupEl | null;
  const effect = document.getElementById('cf-effect') as GroupEl | null;
  const orient = document.getElementById('cf-orient') as GroupEl | null;
  if (!flow || !opts || !mode || !width || !effect || !orient) return;
  page.dataset.coverflowWired = '1';

  const scenes = [
    { id: 'alpine-dawn', alt: 'Alpine dawn' },
    { id: 'coffee', alt: 'Espresso cup' },
    { id: 'night-aurora', alt: 'Northern lights' },
    { id: 'desert-dunes', alt: 'Desert dunes' },
    { id: 'cat', alt: 'Tabby cat' },
    { id: 'ocean-dusk', alt: 'Sunset over the ocean' },
    { id: 'misty-forest', alt: 'Misty pine forest' },
    { id: 'rocket', alt: 'Rocket on the launch pad' },
    { id: 'lake-reflection', alt: 'Mountain lake' },
    { id: 'deep-field', alt: 'Hubble deep field' },
  ] as const;

  const thumb = (id: string) => `/coverflow/${id}.webp`;
  const full = (id: string) => `/coverflow/full/${id}.webp`;

  const fill = (kind: 'lightbox' | 'flip'): void => {
    const keep = flow.index;
    const nodes = scenes.map((scene, i) => {
      const item = document.createElement('k3-coverflow-item');
      const front = document.createElement('img');
      front.decoding = 'async';
      front.width = 448;
      front.height = 448;
      front.alt = scene.alt;
      front.src = thumb(scene.id);
      if (i === 0) front.fetchPriority = 'high';
      else front.loading = 'lazy';
      item.append(front);
      if (kind === 'lightbox') {
        item.setAttribute('href', full(scene.id));
      } else {
        item.setAttribute('flip', '');
        const back = document.createElement('img');
        back.slot = 'back';
        back.loading = 'lazy';
        back.decoding = 'async';
        back.width = 448;
        back.height = 448;
        back.alt = '';
        const next = scenes[(i + 1) % scenes.length]!;
        back.src = thumb(next.id);
        item.append(back);
      }
      return item;
    });
    flow.replaceChildren(...nodes);
    flow.lightbox = kind === 'lightbox';
    flow.index = Math.min(keep, scenes.length - 1);
  };

  const applyOpts = (): void => {
    const values = new Set(opts.selectedValues());
    flow.arrows = values.has('arrows');
    flow.bullets = values.has('bullets');
    flow.noReflection = !values.has('shadow');
    flow.mode = values.has('loop') ? 'loop' : 'bounded';
  };

  const applyWidth = (): void => {
    flow.fullWidth = width.selectedValues().includes('full');
  };

  const applyEffect = (): void => {
    const slide = effect.selectedValues().includes('slide');
    flow.classList.toggle('coverflow-slide-demo', slide);
    flow.effect = slide ? 'slide' : 'coverflow';
  };

  const applyOrient = (): void => {
    const vertical = orient.selectedValues().includes('vertical');
    flow.classList.toggle('coverflow-vertical-demo', vertical);
    flow.orientation = vertical ? 'vertical' : 'horizontal';
  };

  const applyMode = (): void => {
    const values = mode.selectedValues();
    fill(values.includes('flip') ? 'flip' : 'lightbox');
    applyOpts();
    applyWidth();
    applyEffect();
    applyOrient();
  };

  opts.addEventListener('k3-change', applyOpts);
  mode.addEventListener('k3-change', applyMode);
  width.addEventListener('k3-change', applyWidth);
  effect.addEventListener('k3-change', applyEffect);
  orient.addEventListener('k3-change', applyOrient);
  applyMode();
}

/**
 * Carousel multi-browse demo — selector sets how many items are visible at once
 * (3 / 4 / 5 / 6 / all) by tuning `item-width`. All slides stay in the pool so
 * loop / arrows / indicators keep working.
 */
function wireCarouselLab(): void {
  const page = document.getElementById('page-carousel');
  if (!page || page.dataset.carouselWired) return;

  type SelectEl = HTMLElement & { value: string };
  type CarouselEl = HTMLElement & { itemWidth: number; index: number };
  const select = document.getElementById('carousel-count-select') as SelectEl | null;
  const carousel = document.getElementById('carousel-multi-demo') as CarouselEl | null;
  if (!select || !carousel) return;
  page.dataset.carouselWired = '1';

  const DEFAULT_ITEM_WIDTH = 186;
  const GAP = 8;

  const viewportWidth = (): number => {
    const scroller = carousel.shadowRoot?.querySelector('.scroller') as HTMLElement | null;
    const w = scroller?.clientWidth || carousel.clientWidth;
    return Math.max(1, w);
  };

  /** Preferred large width so ~`slots` keyline items fill the multi-browse viewport. */
  const itemWidthForSlots = (slots: number): number => {
    const vw = viewportWidth();
    /* multi-browse ≈ N-2 larges + 1 medium + 1 small (fallback: N-1 larges + 1 small). */
    const small = 48;
    const largeCount = Math.max(1, slots - 2);
    const width = (vw - small - largeCount * GAP) / largeCount;
    return Math.round(Math.max(72, Math.min(vw * 0.9, width)));
  };

  const apply = (): void => {
    const raw = select.value || 'all';
    if (raw === 'all') {
      carousel.itemWidth = DEFAULT_ITEM_WIDTH;
    } else {
      const slots = Math.max(3, Math.min(6, Number(raw) || 3));
      carousel.itemWidth = itemWidthForSlots(slots);
    }
    carousel.index = 0;
  };

  select.addEventListener('k3-change', apply);
  window.addEventListener('resize', () => {
    if ((select.value || 'all') !== 'all') apply();
  });
}

/** Humanize a pattern id for tooltips (`circle-zebra` → `Circle zebra`, `frame14` → `Frame 14`). */
function wireCountdownLab(): void {
  const page = document.getElementById('page-countdown');
  if (!page || page.dataset.countdownWired) return;
  page.dataset.countdownWired = '1';

  type FieldEl = HTMLElement & { value: string };
  type CountdownEl = HTMLElement & {
    endDate: string | null;
    reset: () => void;
    start: () => void;
  };

  const field = document.getElementById('countdown-end-input') as FieldEl | null;
  const countdown = document.getElementById('countdown-lab') as CountdownEl | null;
  if (!field || !countdown) return;

  const pad = (n: number): string => String(n).padStart(2, '0');
  const toLocalValue = (d: Date): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const applyEnd = (localValue: string, start = true): void => {
    if (!localValue) return;
    const ts = new Date(localValue).getTime();
    if (!Number.isFinite(ts)) return;
    countdown.endDate = new Date(ts).toISOString();
    /* The lab boots before its page registers k3-countdown — start once upgraded */
    if (start) void customElements.whenDefined('k3-countdown').then(() => countdown.start());
  };

  /* Default target: +2 hours from now */
  const initial = new Date(Date.now() + 2 * 60 * 60 * 1000);
  field.value = toLocalValue(initial);
  applyEnd(field.value, true);

  const onField = (): void => applyEnd(field.value, true);
  field.addEventListener('k3-input', onField);
  field.addEventListener('k3-change', onField);
  field.addEventListener('input', onField);
  field.addEventListener('change', onField);
}

/**
 * Demo-only: block share / download (copyright) and flash a snackbar instead.
 * Component still emits cancelable `k3-share` / `k3-download`.
 */
function wireAudioPlayerDemoRights(): void {
  const page = document.getElementById('page-audio-player');
  if (!page || page.dataset.audioRightsWired) return;
  page.dataset.audioRightsWired = '1';

  const block = (kind: 'share' | 'download') => (e: Event) => {
    e.preventDefault();
    void showFlash(
      kind === 'share'
        ? t('doc.audio-player.demo.shareDisabled')
        : t('doc.audio-player.demo.downloadDisabled'),
      2800,
    );
  };

  page.querySelectorAll('k3-audio-player').forEach((player) => {
    player.addEventListener('k3-share', block('share'));
    player.addEventListener('k3-download', block('download'));
  });
}

/** Text bounce — loop switch + replay. */
function wireTextBounceDemo(): void {
  const page = document.getElementById('page-text-bounce');
  if (!page || page.dataset.textBounceWired) return;
  page.dataset.textBounceWired = '1';
  const bounce = document.getElementById('demo-text-bounce') as
    | (HTMLElement & { loop: boolean; play: () => void; restart: () => void })
    | null;
  const loopSw = document.getElementById('text-bounce-loop') as
    | (HTMLElement & { selected: boolean })
    | null;
  const replay = document.getElementById('text-bounce-replay');
  loopSw?.addEventListener('k3-change', ((e: CustomEvent<{ selected?: boolean }>) => {
    if (!bounce) return;
    bounce.loop = !!e.detail?.selected;
    bounce.play();
  }) as EventListener);
  replay?.addEventListener('k3-click', () => bounce?.restart());
}

/** Halftone lab — every control drives the live print (bound on first visit). */
let halftoneLabWired = false;
function wireHalftoneLab(): void {
  const lab = document.getElementById('halftone-lab') as
    | (HTMLElement & Record<string, unknown> & { download(name?: string): Promise<void> })
    | null;
  if (!lab || halftoneLabWired) return;
  halftoneLabWired = true;
  const on = (id: string, type: string, apply: (detail: Record<string, unknown>) => void): void => {
    const el = document.getElementById(id);
    el?.addEventListener(type, (e) => {
      if (e.target !== el) return;
      apply(((e as CustomEvent).detail ?? {}) as Record<string, unknown>);
    });
  };
  const value = (prop: string) => (d: Record<string, unknown>) => {
    if (d.value !== undefined) lab[prop] = d.value;
  };
  const num = (prop: string) => (d: Record<string, unknown>) => {
    const n = Number(d.value);
    if (Number.isFinite(n)) lab[prop] = n;
  };
  on('ht-preset', 'k3-change', value('preset'));
  on('ht-shape', 'k3-change', value('shape'));
  for (const [id, prop] of [
    ['ht-size', 'size'],
    ['ht-contrast', 'contrast'],
    ['ht-misregistration', 'misregistration'],
    ['ht-angle', 'angle'],
    ['ht-grain', 'grain'],
    ['ht-dotgain', 'dotGain'],
  ] as const) {
    on(id, 'k3-input', num(prop));
    on(id, 'k3-change', num(prop));
  }
  on('ht-animated', 'k3-change', (d) => void (lab.animated = !!d.selected));
  on('ht-light', 'k3-change', (d) => void (lab.tone = d.selected ? 'light' : 'dark'));
  document.getElementById('ht-download')?.addEventListener('k3-click', () => void lab.download('k3ui-halftone.png'));
}

/** Holo card — connected group switches foil model (prism + add-on foils; Golden/Silver use secret). */
let holoCardDemoWired = false;
function wireHoloCardDemo(): void {
  if (holoCardDemoWired) return;
  holoCardDemoWired = true;

  type HoloModel = {
    effect: string;
    layout: 'portrait' | 'landscape';
    maxRotate: number;
    src: string;
    width: number;
    height: number;
    altKey: string;
  };

  const cardModel = (
    effect: string,
    src = '/cards/cristal-aurore.svg',
    altKey = 'doc.card-holo.alt.crystal',
  ): HoloModel => ({ effect, layout: 'portrait', maxRotate: 15, src, width: 630, height: 880, altKey });

  /* prism is built in; the other foils come from addons/holo-effects (secret = Golden / Silver art) */
  const models: Record<string, HoloModel> = {
    'prism-card': cardModel('prism'),
    ...Object.fromEntries(
      ['holo', 'reverse', 'cosmos', 'rainbow', 'rainbow-alt', 'v', 'vmax', 'vstar', 'full-art', 'shiny', 'radiant', 'full-art-wave'].map(
        (effect) => [`${effect}-card`, cardModel(effect)],
      ),
    ),
    'golden-card': cardModel('secret', '/cards/cristal-or.svg', 'doc.card-holo.alt.gold'),
    'silver-card': cardModel('secret', '/cards/cristal-argent.svg', 'doc.card-holo.alt.silver'),
  };

  const card = document.getElementById('demo-holo-card') as
    | (HTMLElement & { effect: string; maxRotate: number })
    | null;
  const img = document.getElementById('demo-holo-img') as HTMLImageElement | null;
  const group = document.getElementById('demo-holo-model');
  if (!card || !img || !group) return;

  const apply = (id: string): void => {
    const model = models[id] ?? models['prism-card'];
    if (!model) return;
    card.effect = model.effect;
    card.maxRotate = model.maxRotate;
    card.classList.toggle('demo-card--portrait', model.layout === 'portrait');
    card.classList.toggle('demo-card--landscape', model.layout === 'landscape');
    img.src = model.src;
    img.width = model.width;
    img.height = model.height;
    img.setAttribute('data-i18n-alt', model.altKey);
    img.alt = t(model.altKey);
  };

  group.addEventListener('k3-change', (e) => {
    const d = (e as CustomEvent<{ values?: string[]; selected?: HTMLElement }>).detail;
    const v = d?.values?.[0] ?? d?.selected?.getAttribute('value') ?? null;
    if (v && models[v]) apply(v);
  });

  const selected = group.querySelector<HTMLElement>('k3-button[selected], k3-button[value="prism-card"]');
  apply(selected?.getAttribute('value') || 'prism-card');
}

/** Scratch card — connected groups for brush / metal + reset. */
let scratchCardDemoWired = false;
function wireScratchCardDemo(): void {
  if (scratchCardDemoWired) return;
  scratchCardDemoWired = true;

  const card = document.getElementById('demo-scratch-card') as
    | (HTMLElement & {
        type: string;
        cover: string;
        radius: number;
        revealDuration: number;
        reset(): void;
      })
    | null;
  if (!card) return;

  const groupValue = (e: Event): string | null => {
    const d = (e as CustomEvent<{ values?: string[]; selected?: HTMLElement }>).detail;
    return d?.values?.[0] ?? d?.selected?.getAttribute('value') ?? null;
  };

  document.getElementById('demo-scratch-type')?.addEventListener('k3-change', (e) => {
    const v = groupValue(e);
    if (v !== 'line' && v !== 'spray' && v !== 'brush') return;
    card.type = v;
    card.radius = v === 'spray' ? 50 : 30;
    card.revealDuration = v === 'brush' ? 400 : 0;
    card.reset();
  });

  document.getElementById('demo-scratch-cover')?.addEventListener('k3-change', (e) => {
    const v = groupValue(e);
    if (v !== 'silver' && v !== 'gold') return;
    card.cover = v;
  });

  document.getElementById('demo-scratch-reset')?.addEventListener('k3-click', () => {
    card.reset();
  });

  /* Live progress, left of the reset button */
  const progress = document.getElementById('demo-scratch-progress');
  let percent = 0;
  const showProgress = (): void => {
    if (progress) progress.textContent = t('doc.card-scratch.progress', { percent: Math.round(percent) });
  };
  card.addEventListener('k3-scratch', ((e: CustomEvent<{ percent: number }>) => {
    percent = e.detail?.percent ?? 0;
    showProgress();
  }) as EventListener);
  document.addEventListener('k3-locale-change', showProgress);
  showProgress();
}

/** Iso filter — periodic-table tiles + group chips. */
async function wireIsoFilterDemo(): Promise<void> {
  const page = document.getElementById('page-iso-filter');
  const host = document.getElementById('demo-iso-filter') as
    | (HTMLElement & { refresh?: () => void; filter: string })
    | null;
  const chipSet = document.getElementById('demo-iso-filters');
  if (!page || !host || !chipSet) return;

  const data = await import('./periodic-table-data.js');
  await customElements.whenDefined('k3-iso-filter');
  await customElements.whenDefined('k3-chip');

  const fill = (): void => {
    chipSet.replaceChildren(
      ...data.ELEMENT_GROUPS.map((g) => {
        const chip = document.createElement('k3-chip');
        chip.setAttribute('variant', 'filter');
        chip.setAttribute('value', g.id);
        if (g.id === (host.filter || '*')) chip.setAttribute('selected', '');
        chip.textContent = t(g.labelKey);
        return chip;
      }),
    );
    for (const el of [...host.children]) {
      if (el.getAttribute('slot') === 'filters') continue;
      el.remove();
    }
    for (const el of data.PERIODIC_ELEMENTS) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = `periodic-tile periodic-tile--${el.group} periodic-tile--w${el.weight}`;
      tile.dataset.filter = el.group;
      tile.title = `${el.name} (${el.z})`;
      tile.innerHTML =
        `<span class="periodic-z">${el.z}</span>` +
        `<span class="periodic-symbol">${el.symbol}</span>` +
        `<span class="periodic-name">${el.name}</span>`;
      host.append(tile);
    }
    host.refresh?.();
  };

  fill();
  if (!page.dataset.isoWired) {
    page.dataset.isoWired = '1';
    document.addEventListener('k3-locale-change', () => {
      if (page.hidden) return;
      fill();
    });
  }
}

/** Masonry — ensure pack after CE upgrade / page show. */
async function wireMasonryDemo(): Promise<void> {
  const el = document.getElementById('demo-masonry') as
    | (HTMLElement & { layout?: () => void })
    | null;
  if (!el) return;
  await customElements.whenDefined('k3-masonry');
  el.layout?.();
}

/** Chart demos — assign data/options after k3-chart upgrades. */
async function wireChartDemos(): Promise<void> {
  const data = await import('./charts-demo-data.js');
  type ChartEl = HTMLElement & {
    data: unknown;
    options: unknown;
    updateComplete?: Promise<unknown>;
  };
  const assign = async (
    id: string,
    chartData: unknown,
    options?: unknown,
  ): Promise<void> => {
    const el = document.getElementById(id) as ChartEl | null;
    if (!el) return;
    await customElements.whenDefined('k3-chart');
    await el.updateComplete;
    el.data = chartData;
    if (options !== undefined) el.options = options;
  };

  await Promise.all([
    assign('demo-bar-vertical', data.barVertical),
    assign('demo-bar-horizontal', data.barHorizontal, data.barHorizontalOpts),
    assign('demo-bar-stacked', data.barStacked, data.barStackedOpts),
    assign('demo-bar-grouped', data.barGrouped),
    assign('demo-line-simple', data.lineSimple),
    assign('demo-line-multi', data.lineMulti),
    assign('demo-line-smooth', data.lineSmooth),
    assign('demo-line-area', data.lineArea),
    assign('demo-other-pie', data.pieData),
    assign('demo-other-doughnut', data.doughnutData),
    assign('demo-other-radar', data.radarData),
    assign('demo-other-polar', data.polarData),
    assign('demo-other-bubble', data.bubbleData),
    assign('demo-other-scatter', data.scatterData),
  ]);
}

/** Text scramble — change-text button + braille/blocks/numbers presets. */
function wireTextScrambleDemo(): void {
  const page = document.getElementById('page-text-scramble');
  if (!page || page.dataset.textScrambleWired) return;
  page.dataset.textScrambleWired = '1';

  type ScrambleEl = HTMLElement & {
    chars: string;
    play: (text?: string) => Promise<void>;
  };

  const blurbPhrases = [
    'scrambleText() reveals text via a smooth randomized character scramble.',
    'Reveal any string with a smooth randomized character scramble.',
    'Noise glyphs settle into readable copy, character by character.',
  ];
  let blurbIdx = 0;
  const blurbEl = document.getElementById('demo-scramble-loop') as ScrambleEl | null;
  document.getElementById('demo-scramble-normal-btn')?.addEventListener('k3-click', () => {
    if (!blurbEl) return;
    blurbIdx = (blurbIdx + 1) % blurbPhrases.length;
    blurbEl.chars = 'default';
    void blurbEl.play(blurbPhrases[blurbIdx]);
  });
  document.getElementById('demo-scramble-upper-btn')?.addEventListener('k3-click', () => {
    if (!blurbEl) return;
    blurbIdx = (blurbIdx + 1) % blurbPhrases.length;
    blurbEl.chars = 'uppercase';
    void blurbEl.play(blurbPhrases[blurbIdx]!.toUpperCase());
  });

  const phrases = [
    'Hello World!',
    'Goodbye Moon!',
    'Scramble done!',
    'k3-text-scramble',
  ];
  let phraseIdx = 0;
  const changeEl = document.getElementById('demo-scramble-change') as ScrambleEl | null;
  document.getElementById('demo-scramble-change-btn')?.addEventListener('k3-click', () => {
    phraseIdx = (phraseIdx + 1) % phrases.length;
    void changeEl?.play(phrases[phraseIdx]);
  });

  const charsEl = document.getElementById('demo-scramble-chars') as ScrambleEl | null;
  page.addEventListener('k3-click', ((e: Event) => {
    const path = e.composedPath() as EventTarget[];
    const btn = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement && n.hasAttribute('data-scramble-chars'),
    );
    if (!btn || !charsEl) return;
    const set = btn.getAttribute('data-scramble-chars');
    if (!set) return;
    charsEl.chars = set;
    void charsEl.play();
  }) as EventListener);
}

/** Confetti playground — preset buttons → `k3-confetti#demo-confetti`. */
function wireConfettiDemo(): void {
  const page = document.getElementById('page-confetti');
  if (!page || page.dataset.confettiWired) return;
  page.dataset.confettiWired = '1';
  page.addEventListener('k3-click', ((e: Event) => {
    const path = e.composedPath() as EventTarget[];
    const btn = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement && n.hasAttribute('data-confetti-preset'),
    );
    if (!btn) return;
    const preset = btn.getAttribute('data-confetti-preset');
    const host = document.getElementById('demo-confetti') as
      | (HTMLElement & { presetFire?: (id: string) => void; fire?: () => void })
      | null;
    if (!host || !preset) return;
    if (typeof host.presetFire === 'function') host.presetFire(preset);
    else if (typeof host.fire === 'function') host.fire();
  }) as EventListener);
}

type SnowHost = HTMLElement & {
  start?: () => void;
  stop?: () => void;
  reset?: () => void;
  snowflakeCount?: number;
  color?: string;
  speed?: [number, number];
  wind?: [number, number];
  radius?: [number, number];
  images?: CanvasImageSource[] | undefined;
  disableForReducedMotion?: boolean;
  isRunning?: boolean;
};

type SnowRangeSlider = HTMLElement & {
  valueStart?: number;
  valueEnd?: number;
  value?: number;
  label?: string;
};
type SnowSwitchEl = HTMLElement & { selected?: boolean };
type SnowFieldEl = HTMLElement & { value?: string };
type SnowDialogEl = HTMLElement & {
  show?: () => Promise<boolean>;
  hide?: () => Promise<boolean>;
};

/** Tiny SVG snowflake images for the “Use Images” toggle. */
function makeSnowDemoImages(): HTMLImageElement[] {
  const svgs = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="#dee4fd" stroke-width="4" stroke-linecap="round"><path d="M32 4v56M8 18l48 28M8 46l48-28"/><path d="M32 16l-8-6M32 16l8-6M32 48l-8 6M32 48l8 6M16 22l-10 0M16 22l-4 8M48 42l10 0M48 42l4-8M16 42l-10 0M16 42l-4-8M48 22l10 0M48 22l4 8"/></g></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="6" fill="#dee4fd"/><g fill="none" stroke="#dee4fd" stroke-width="3" stroke-linecap="round"><path d="M32 6v52M10 20l44 24M10 44l44-24"/><path d="M32 14l-6-5M32 14l6-5M32 50l-6 5M32 50l6 5"/></g></svg>`,
  ];
  return svgs.map((svg) => {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return img;
  });
}

function formatSnowNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Restart Snow page demo (safe after shell teardown / leaving the page). */
async function ensureDemoSnowRunning(): Promise<void> {
  /* Never start from boot wiring / races while another page is visible. */
  if (!isSnowDemoPageActive()) return;
  await ensureK3ux();
  await customElements.whenDefined('k3-snow');
  if (!isSnowDemoPageActive()) return;
  const host = demoSnowEl();
  if (!host) return;
  host.disableForReducedMotion = false;
  if (!host.isRunning) host.start?.();
  const btn = document.getElementById('snow-toggle') as
    | (HTMLElement & { variant?: string })
    | null;
  if (btn) {
    btn.textContent = t('doc.snow.action.stop');
    btn.variant = 'filled';
  }
}

/** Snow playground — fullscreen overlay + options dialog. */
function wireSnowDemo(): void {
  const page = document.getElementById('page-snow');
  if (!page) return;

  /* Re-enter: listeners already bound — restart only when Snow is visible. */
  if (page.dataset.snowWired) {
    if (isSnowDemoPageActive()) void ensureDemoSnowRunning();
    return;
  }
  page.dataset.snowWired = '1';

  /* Always #demo-snow — never #shell-snow (settings overlay). */
  const snow = () => document.getElementById('demo-snow') as SnowHost | null;
  const toggleBtn = () => document.getElementById('snow-toggle');
  const dialog = () =>
    document.getElementById('snow-options-dialog') as SnowDialogEl | null;
  const snowImages = makeSnowDemoImages();
  /** Color picker only overrides theme default after the user edits it. */
  let snowColorCustomized = false;

  const readOnSurfaceHex = (): string => {
    try {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--k3-sys-color-on-surface')
        .trim();
      if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
      if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
        const r = raw[1]!;
        const g = raw[2]!;
        const b = raw[3]!;
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
      }
      /* rgb(r, g, b) → hex for <input type="color"> */
      const m = raw.match(
        /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
      );
      if (m) {
        const hex = (n: string) =>
          Number(n).toString(16).padStart(2, '0');
        return `#${hex(m[1]!)}${hex(m[2]!)}${hex(m[3]!)}`;
      }
    } catch {
      /* ignore */
    }
    return '#1c1b1f';
  };

  const syncColorFieldsFromTheme = (): void => {
    if (snowColorCustomized) return;
    const hex = readOnSurfaceHex();
    const colorInput = document.getElementById('snow-color') as HTMLInputElement | null;
    const colorHex = document.getElementById('snow-color-hex') as SnowFieldEl | null;
    if (colorInput) colorInput.value = hex;
    if (colorHex) colorHex.value = hex;
  };

  const el = snow();
  if (el) {
    el.disableForReducedMotion = false;
    /* Theme default — do not pin a hardcoded flake color. */
    el.color = '';
  }

  const syncToggleLabel = (): void => {
    const btn = toggleBtn() as (HTMLElement & { variant?: string }) | null;
    const host = snow();
    if (!btn) return;
    const running = !!host?.isRunning;
    btn.textContent = running ? t('doc.snow.action.stop') : t('doc.snow.action.start');
    btn.variant = running ? 'filled' : 'tonal';
  };

  const syncSliderLabels = (): void => {
    const count = document.getElementById('snow-count') as SnowRangeSlider | null;
    const speed = document.getElementById('snow-speed') as SnowRangeSlider | null;
    const wind = document.getElementById('snow-wind') as SnowRangeSlider | null;
    const radius = document.getElementById('snow-radius') as SnowRangeSlider | null;
    if (count && count.value != null) {
      count.label = `${t('doc.snow.knob.count')} · ${formatSnowNum(count.value)}`;
    }
    if (speed && speed.valueStart != null && speed.valueEnd != null) {
      speed.label = `${t('doc.snow.knob.speed')} · ${formatSnowNum(speed.valueStart)} – ${formatSnowNum(speed.valueEnd)}`;
    }
    if (wind && wind.valueStart != null && wind.valueEnd != null) {
      wind.label = `${t('doc.snow.knob.wind')} · ${formatSnowNum(wind.valueStart)} – ${formatSnowNum(wind.valueEnd)}`;
    }
    if (radius && radius.valueStart != null && radius.valueEnd != null) {
      radius.label = `${t('doc.snow.knob.radius')} · ${formatSnowNum(radius.valueStart)} – ${formatSnowNum(radius.valueEnd)}`;
    }
  };

  const syncSnow = (): void => {
    const host = snow();
    if (!host) return;
    const count = document.getElementById('snow-count') as SnowRangeSlider | null;
    const speed = document.getElementById('snow-speed') as SnowRangeSlider | null;
    const wind = document.getElementById('snow-wind') as SnowRangeSlider | null;
    const radius = document.getElementById('snow-radius') as SnowRangeSlider | null;
    const images = document.getElementById('snow-use-images') as SnowSwitchEl | null;
    const colorInput = document.getElementById('snow-color') as HTMLInputElement | null;

    if (count?.value != null) host.snowflakeCount = count.value;
    if (speed?.valueStart != null && speed.valueEnd != null) {
      host.speed = [speed.valueStart, speed.valueEnd];
    }
    if (wind?.valueStart != null && wind.valueEnd != null) {
      host.wind = [wind.valueStart, wind.valueEnd];
    }
    if (radius?.valueStart != null && radius.valueEnd != null) {
      host.radius = [radius.valueStart, radius.valueEnd];
    }
    if (snowColorCustomized && colorInput?.value) host.color = colorInput.value;
    else host.color = '';
    host.images = images?.selected ? snowImages : undefined;
    syncSliderLabels();
  };

  const ensureRunning = (): void => {
    if (!isSnowDemoPageActive()) return;
    const host = snow();
    if (!host) return;
    syncSnow();
    if (!host.isRunning) host.start?.();
    syncToggleLabel();
  };

  page.addEventListener('k3-click', ((e: Event) => {
    const path = e.composedPath() as EventTarget[];
    const btn = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement && n.hasAttribute('data-snow-action'),
    );
    if (!btn) return;
    const action = btn.getAttribute('data-snow-action');
    const host = snow();
    if (!action) return;

    if (action === 'options') {
      syncColorFieldsFromTheme();
      void dialog()?.show?.();
      return;
    }
    if (!host) return;
    if (action === 'toggle') {
      if (host.isRunning) host.stop?.();
      else {
        syncSnow();
        host.start?.();
      }
      syncToggleLabel();
      return;
    }
    if (action === 'reset') {
      host.reset?.();
      syncSnow();
      host.start?.();
      syncToggleLabel();
    }
  }) as EventListener);

  document.getElementById('snow-options-done')?.addEventListener('k3-click', () => {
    void dialog()?.hide?.();
  });

  for (const id of ['snow-count', 'snow-speed', 'snow-wind', 'snow-radius']) {
    const node = document.getElementById(id);
    node?.addEventListener('k3-input', () => {
      syncSnow();
    });
    node?.addEventListener('k3-change', () => {
      syncSnow();
    });
  }

  document.getElementById('snow-use-images')?.addEventListener('k3-change', () => {
    syncSnow();
  });

  const colorInput = document.getElementById('snow-color') as HTMLInputElement | null;
  const colorHex = document.getElementById('snow-color-hex') as SnowFieldEl | null;
  colorInput?.addEventListener('input', () => {
    snowColorCustomized = true;
    if (colorHex && colorInput.value) colorHex.value = colorInput.value;
    syncSnow();
  });
  colorHex?.addEventListener('k3-change', () => {
    const v = (colorHex.value || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v) && colorInput) {
      snowColorCustomized = true;
      colorInput.value = v;
      syncSnow();
    }
  });
  syncColorFieldsFromTheme();

  /*
   * Boot also calls wireSnowDemo via wireDemoPages — only auto-start when the
   * Snow article is actually visible (not while buried under [hidden]).
   */
  void (async () => {
    const host = snow();
    if (!host) return;
    await customElements.whenDefined('k3-snow');
    await (host as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
    if (!isSnowDemoPageActive()) {
      teardownSnowHost(host);
      return;
    }
    ensureRunning();
  })();
}

type FireworkHost = HTMLElement & {
  start?: () => void;
  pause?: () => void;
  stop?: () => void;
  reset?: () => void;
  launchBurst?: (n: number) => void;
  celebrate?: () => void;
  playSequence?: (salvos: Array<{ finale?: boolean; finaleCount?: number }>) => void;
  enableSound?: () => void;
  quality?: number;
  size?: number;
  scaleFactor?: number;
  shell?: string;
  soundEnabled?: boolean;
  trails?: boolean;
  autoLaunch?: boolean;
  finale?: boolean;
  isRunning?: boolean;
  disableForReducedMotion?: boolean;
};

type FireworkDialogEl = HTMLElement & {
  show?: () => Promise<boolean>;
  hide?: () => Promise<boolean>;
};

/** Firework playground — fullscreen overlay + salvos + options dialog. */
function wireFireworkDemo(): void {
  const page = document.getElementById('page-firework');
  if (!page || page.dataset.fwWired) return;
  page.dataset.fwWired = '1';

  const fw = () => document.getElementById('demo-firework') as FireworkHost | null;
  const toggleBtn = () =>
    document.getElementById('fw-toggle') as (HTMLElement & { variant?: string }) | null;
  const dialog = () =>
    document.getElementById('fw-options-dialog') as FireworkDialogEl | null;

  const host0 = fw();
  if (host0) host0.disableForReducedMotion = false;

  const syncToggleLabel = (): void => {
    const btn = toggleBtn();
    const host = fw();
    if (!btn) return;
    const running = !!host?.isRunning;
    btn.textContent = running
      ? t('doc.firework.action.stop')
      : t('doc.firework.action.start');
    btn.variant = running ? 'filled' : 'tonal';
  };

  const formatNum = (n: number): string => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  const syncSliderLabels = (): void => {
    type S = HTMLElement & { value?: number; label?: string };
    const quality = document.getElementById('fw-quality') as S | null;
    const size = document.getElementById('fw-size') as S | null;
    const scale = document.getElementById('fw-scale') as S | null;
    if (quality?.value != null) {
      quality.label = `${t('doc.firework.knob.quality')} · ${formatNum(quality.value)}`;
    }
    if (size?.value != null) {
      size.label = `${t('doc.firework.knob.size')} · ${formatNum(size.value)}`;
    }
    if (scale?.value != null) {
      scale.label = `${t('doc.firework.knob.scale')} · ${formatNum(scale.value)}`;
    }
  };

  const syncFw = (): void => {
    const host = fw();
    if (!host) return;
    type S = HTMLElement & { value?: number };
    type Sw = HTMLElement & { selected?: boolean };
    type Sel = HTMLElement & { value?: string };
    const quality = document.getElementById('fw-quality') as S | null;
    const size = document.getElementById('fw-size') as S | null;
    const scale = document.getElementById('fw-scale') as S | null;
    const shell = document.getElementById('fw-shell') as Sel | null;
    const sound = document.getElementById('fw-sound') as Sw | null;
    const trails = document.getElementById('fw-trails') as Sw | null;
    const auto = document.getElementById('fw-auto') as Sw | null;
    const finale = document.getElementById('fw-finale-mode') as Sw | null;
    if (quality?.value != null) host.quality = Math.round(quality.value) as 1 | 2 | 3;
    if (size?.value != null) host.size = size.value;
    if (scale?.value != null) host.scaleFactor = scale.value;
    if (shell?.value) host.shell = shell.value;
    if (sound) {
      host.soundEnabled = !!sound.selected;
      if (sound.selected) host.enableSound?.();
    }
    if (trails) host.trails = !!trails.selected;
    if (auto) host.autoLaunch = !!auto.selected;
    if (finale) host.finale = !!finale.selected;
    syncSliderLabels();
  };

  page.addEventListener('k3-click', ((e: Event) => {
    const path = e.composedPath() as EventTarget[];
    const btn = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement && n.hasAttribute('data-fw-action'),
    );
    if (!btn) return;
    const action = btn.getAttribute('data-fw-action');
    const host = fw();
    if (!action) return;

    if (action === 'options') {
      void dialog()?.show?.();
      return;
    }
    if (!host) return;

    if (action === 'toggle') {
      if (host.isRunning) host.pause?.();
      else {
        syncFw();
        host.start?.();
      }
      syncToggleLabel();
      return;
    }
    if (action === 'reset') {
      host.reset?.();
      syncFw();
      host.start?.();
      syncToggleLabel();
      return;
    }
    syncFw();
    if (!host.isRunning) host.start?.();
    if (action === 'burst') {
      const n = Number(btn.getAttribute('data-fw-count') || '2');
      host.launchBurst?.(n);
    } else if (action === 'finale') {
      host.playSequence?.([{ finale: true, finaleCount: 24 }]);
    } else if (action === 'celebrate') {
      host.celebrate?.();
    }
    syncToggleLabel();
  }) as EventListener);

  document.getElementById('fw-options-done')?.addEventListener('k3-click', () => {
    void dialog()?.hide?.();
  });

  for (const id of ['fw-quality', 'fw-size', 'fw-scale']) {
    const node = document.getElementById(id);
    node?.addEventListener('k3-input', () => syncFw());
    node?.addEventListener('k3-change', () => syncFw());
  }
  for (const id of ['fw-sound', 'fw-trails', 'fw-auto', 'fw-finale-mode', 'fw-shell']) {
    document.getElementById(id)?.addEventListener('k3-change', () => syncFw());
  }

  void (async () => {
    const host = fw();
    if (!host) return;
    await customElements.whenDefined('k3-firework');
    await (host as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
    syncFw();
    host.start?.();
    syncToggleLabel();
  })();
}

type VoiceRingHost = HTMLElement & {
  state?: string;
  emotion?: string;
  direction?: number;
  start?: () => void;
  stop?: () => void;
  listen?: () => Promise<MediaStream>;
  detachStream?: () => void;
  setLevel?: (n: number | (() => number) | undefined) => void;
  disableForReducedMotion?: boolean;
  updateComplete?: Promise<unknown>;
};

/** Voice ring playground — state / mic / emotion / direction. */
function wireVoiceRingDemo(): void {
  const page = document.getElementById('page-voice-ring');
  if (!page || page.dataset.vrWired) return;
  page.dataset.vrWired = '1';

  const vr = () =>
    document.getElementById('demo-voice-ring') as VoiceRingHost | null;

  const host0 = vr();
  if (host0) host0.disableForReducedMotion = false;

  const syncDirectionLabel = (): void => {
    type S = HTMLElement & { value?: number; label?: string };
    const dir = document.getElementById('vr-direction') as S | null;
    if (dir?.value != null) {
      const n = Math.round(dir.value * 100) / 100;
      dir.label = `${t('doc.voice-ring.knob.direction')} · ${n}`;
    }
  };

  const applyControls = (): void => {
    const host = vr();
    if (!host) return;
    type Sel = HTMLElement & { value?: string };
    type S = HTMLElement & { value?: number };
    const emotion = document.getElementById('vr-emotion') as Sel | null;
    const dir = document.getElementById('vr-direction') as S | null;
    if (emotion) host.emotion = emotion.value ?? '';
    if (dir?.value != null) host.direction = dir.value;
    syncDirectionLabel();
  };

  page.addEventListener('k3-click', ((e: Event) => {
    const path = e.composedPath() as EventTarget[];
    const btn = path.find(
      (n): n is HTMLElement =>
        n instanceof HTMLElement &&
        (n.hasAttribute('data-vr-state') || n.hasAttribute('data-vr-action')),
    );
    if (!btn) return;
    const host = vr();
    if (!host) return;

    const state = btn.getAttribute('data-vr-state');
    if (state) {
      host.state = state;
      page.querySelectorAll<HTMLElement>('[data-vr-state]').forEach((el) => {
        (el as HTMLElement & { variant?: string }).variant =
          el === btn ? 'filled' : 'tonal';
      });
      return;
    }

    const action = btn.getAttribute('data-vr-action');
    if (action === 'mic') {
      void (async () => {
        try {
          host.state = 'listening';
          await host.listen?.();
        } catch {
          /* permission denied / insecure context */
        }
      })();
      return;
    }
    if (action === 'mic-stop') {
      host.detachStream?.();
      host.setLevel?.(undefined);
      host.state = 'idle';
    }
  }) as EventListener);

  document.getElementById('vr-emotion')?.addEventListener('k3-change', () => {
    applyControls();
  });
  document.getElementById('vr-direction')?.addEventListener('k3-input', () => {
    applyControls();
  });
  document.getElementById('vr-direction')?.addEventListener('k3-change', () => {
    applyControls();
  });

  void (async () => {
    const host = vr();
    if (!host) return;
    await customElements.whenDefined('k3-voice-ring');
    await host.updateComplete;
    applyControls();
    host.start?.();
  })();
}

/** Practical contact directory — dense A–Z (K3ui v1 symbols + annuaire usable). */
const INDEX_LIST_DEMO_CONTACTS = [
  '#Support K3UI',
  '@social',
  '-Legacy Systems',
  '_internal',
  '—Note spéciale',
  '0123 Numéro',
  '42 Answer Ltd',
  '7-Eleven',
  'Alice Dupont',
  'Amélie Bernard',
  'Antoine Lefèvre',
  'Aurore Marchand',
  'Bob Martin',
  'Bruno Costa',
  'Béatrice Noel',
  'Camille Roux',
  'Claire Dubois',
  'Corentin Vidal',
  'David Nguyen',
  'Diane Moreau',
  'Dylan Pereira',
  'Élodie Martin',
  'Emma Garcia',
  'Estelle Fabre',
  'François Petit',
  'Fatima Benali',
  'Félix Garnier',
  'Gabriel Simon',
  'Gisèle Renault',
  'Guillaume Petit',
  'Hélène Blanc',
  'Hugo Leroy',
  'Hamza Belkacem',
  'Inès Morel',
  'Isabelle Caron',
  'Ivan Petrov',
  'Julien Fabre',
  'Jade Fontaine',
  'Jacques Perrin',
  'Karim Haddad',
  'Karen Davis',
  'Kevin Marchal',
  'Léa Girard',
  'Lucas Bernard',
  'Louise Mercier',
  'Marie Curie',
  'Marc Antoine',
  'Manon Lefebvre',
  'Nicolas Roux',
  'Nora Benali',
  'Noémie Pascal',
  'Olivia Chevalier',
  'Olivier Deschamps',
  'Omar Said',
  'Paul Durand',
  'Pauline Roy',
  'Pierre Lambert',
  'Quentin Vidal',
  'Quincy Adams',
  'Rachel Cohen',
  'Romain Gerard',
  'Rita Oliveira',
  'Sophie Lambert',
  'Samuel Petit',
  'Sarah Nguyen',
  'Thomas Garnier',
  'Théo Marchand',
  'Tina Robinson',
  'Ursula Becker',
  'Ulysse Moreau',
  'Victor Hugo',
  'Valérie Simon',
  'Vincent Blanc',
  'Wendy Hall',
  'William Scott',
  'Xavier Young',
  'Xia Li',
  'Yasmine Said',
  'Yoann Petit',
  'Yvonne Marchal',
  'Zoe Zen',
  'Zacharie Noel',
  'Zineb Amrani',
] as const;

type IndexListHost = HTMLElement & {
  setItems?: (items: Array<{ label: string }>) => void;
  items?: Array<{ label: string }>;
  getActiveKey?: () => string | null;
  disableForReducedMotion?: boolean;
  updateComplete?: Promise<unknown>;
};

/** Index list playground — long contacts + active section readout. */
function wireIndexListDemo(): void {
  const page = document.getElementById('page-index-list');
  if (!page || page.dataset.indexListWired) return;
  page.dataset.indexListWired = '1';

  const host = () =>
    document.getElementById('demo-index-list') as IndexListHost | null;
  const activeEl = () => document.getElementById('demo-index-list-active');

  const syncActive = (key?: string | null): void => {
    const el = activeEl();
    if (!el) return;
    el.textContent = key && key.length ? key : '—';
  };

  page.addEventListener('k3-section-change', ((e: Event) => {
    const detail = (e as CustomEvent<{ key?: string }>).detail;
    if (detail?.key != null) syncActive(detail.key);
  }) as EventListener);

  void (async () => {
    const list = host();
    if (!list) return;
    await customElements.whenDefined('k3-index-list');
    await list.updateComplete;
    const items = INDEX_LIST_DEMO_CONTACTS.map((label) => ({ label }));
    if (typeof list.setItems === 'function') list.setItems(items);
    else list.items = items;
    await list.updateComplete;
    /* Open on A so the letter directory is immediately visible (symbols stay above). */
    const scrollable = list as IndexListHost & {
      scrollToKey?: (key: string, fromUser?: boolean) => void;
    };
    scrollable.scrollToKey?.('A', false);
    await list.updateComplete;
    syncActive(list.getActiveKey?.() ?? 'A');
  })();
}

/** Buttons Group arrows / Pad / Grid — live value labels on demo pages. */
function wireArrowPadGridDemos(): void {
  /* Connected chevron pairs — full NATO / US military phonetic alphabet */
  const arrowVal = document.getElementById('arrow-val');
  const arrowList = [
    'Alpha',
    'Bravo',
    'Charlie',
    'Delta',
    'Echo',
    'Foxtrot',
    'Golf',
    'Hotel',
    'India',
    'Juliet',
    'Kilo',
    'Lima',
    'Mike',
    'November',
    'Oscar',
    'Papa',
    'Quebec',
    'Romeo',
    'Sierra',
    'Tango',
    'Uniform',
    'Victor',
    'Whiskey',
    'X-ray',
    'Yankee',
    'Zulu',
  ];
  let arrowIndex = 0;
  const syncArrowVal = (): void => {
    if (arrowVal) arrowVal.textContent = arrowList[arrowIndex] ?? '';
  };
  document.querySelectorAll<HTMLElement>('[data-arrow-step]').forEach((btn) => {
    btn.addEventListener('k3-click', () => {
      const step = Number(btn.getAttribute('data-arrow-step') || '0');
      if (!step || !arrowList.length) return;
      arrowIndex = ((arrowIndex + step) % arrowList.length + arrowList.length) % arrowList.length;
      syncArrowVal();
    });
  });

  const padVal = document.getElementById('pad-val');
  document.querySelectorAll('k3-button-pad').forEach((el) => {
    el.addEventListener('k3-navigate', ((e: CustomEvent<{ direction?: string }>) => {
      if (padVal && e.detail?.direction != null) padVal.textContent = e.detail.direction;
    }) as EventListener);
  });

  const gridVal = document.getElementById('grid-val');
  document.querySelectorAll('k3-button-grid').forEach((el) => {
    el.addEventListener('k3-select', ((e: CustomEvent<{ index?: number; label?: string }>) => {
      if (!gridVal) return;
      const { index, label } = e.detail ?? {};
      gridVal.textContent =
        label != null ? `${label}${index != null ? ` (#${index})` : ''}` : '—';
    }) as EventListener);
  });
}

function wireProgressLab(): void {
  const lab = document.getElementById('progress-lab');
  const el = document.getElementById('progress-lab-el') as
    | (HTMLElement & {
        variant: string;
        shape: string;
        indeterminate: boolean;
        thickness: number;
        showStop: boolean;
        showPercent: boolean;
        showLabel: boolean;
        percentPosition: string;
        layout: string;
        label: string;
        supportingText: string;
        value: number;
        size: number;
        wavy: boolean;
        src: string;
      })
    | null;
  if (!lab || !el || lab.dataset.progressWired) return;
  lab.dataset.progressWired = '1';

  type RadioEl = HTMLElement & { value: string; checked: boolean; name: string; localName: string };
  type SwitchEl = HTMLElement & { selected: boolean; localName: string };
  const radioValue = (name: string): string => {
    const radios = [...lab.querySelectorAll<RadioEl>(`k3-radio[name="${name}"]`)];
    const on = radios.find((r) => !!r.checked);
    return on?.value ?? radios[0]?.value ?? '';
  };
  const switchOn = (id: string): boolean => {
    const sw = document.getElementById(id) as SwitchEl | null;
    /* Property only — hasAttribute lags Lit reflect and can stick “on”. */
    return sw?.selected === true;
  };

  const valueWrap = document.getElementById('progress-lab-value-wrap');
  const stopField = document.getElementById('progress-lab-stop-field');
  const layoutField = document.getElementById('progress-lab-layout-field');
  const pctPosField = document.getElementById('progress-lab-pct-pos-field');
  const sizeField = document.getElementById('progress-lab-size-field');
  const srcField = document.getElementById('progress-lab-src-field');
  const pctLabel = document.getElementById('progress-lab-value-pct');
  const slider = document.getElementById('progress-lab-slider') as
    | (HTMLElement & { value: number; disabled: boolean })
    | null;

  const sync = (): void => {
    const variant = radioValue('prog-variant') || 'linear';
    const shape = radioValue('prog-shape') || 'flat';
    const behavior = radioValue('prog-behavior') || 'determinate';
    const thickness = Number(radioValue('prog-thickness') || '4');
    const stopOn = radioValue('prog-stop') === 'on';
    const layout = radioValue('prog-layout') || 'default';
    const pctPos = radioValue('prog-pct-pos') || 'trailing';
    const sizeRaw = Number(radioValue('prog-size') || '0');
    /* Three independent chrome toggles — never couple label ↔ value %. */
    const labelOn = switchOn('prog-sw-label');
    const percentOn = switchOn('prog-sw-percent');
    const supportingOn = switchOn('prog-sw-supporting');
    const pcmSrcOn = switchOn('prog-sw-src');
    const indeterminate = behavior === 'indeterminate';
    const oscillation = shape === 'oscillation' && variant === 'linear';

    el.variant = variant;
    el.shape = shape;
    el.wavy = shape === 'wavy';
    el.src = oscillation && pcmSrcOn ? '/sounds/hello.mp3' : '';
    el.indeterminate = indeterminate;
    el.thickness = thickness;
    el.size = Number.isFinite(sizeRaw) ? sizeRaw : 0;
    el.showStop = stopOn && variant === 'linear' && !indeterminate && !oscillation;
    el.layout = layout;
    el.percentPosition = pctPos;
    /*
     * String props only via JS — do NOT removeAttribute('label'): Lit then
     * sets the property to null, render's .trim() throws, and the old
     * caption stays on screen (Value % is fine: boolean show-percent).
     */
    el.label = labelOn ? 'Downloading' : '';
    el.supportingText = supportingOn ? 'About 2 minutes left' : '';
    el.showPercent = percentOn && !indeterminate;
    el.showLabel = false;
    el.setAttribute('variant', variant);
    el.setAttribute('shape', shape);
    el.setAttribute('layout', layout);
    el.setAttribute('percent-position', pctPos);
    el.toggleAttribute('wavy', shape === 'wavy');
    el.toggleAttribute('indeterminate', indeterminate);
    el.toggleAttribute('show-stop', el.showStop);
    el.toggleAttribute('show-percent', el.showPercent);
    el.removeAttribute('show-label');
    if (el.src) el.setAttribute('src', el.src);
    else el.setAttribute('src', '');
    if (el.size > 0) el.setAttribute('size', String(el.size));
    else el.removeAttribute('size');
    /* Keep attributes in sync without remove→null (use empty string). */
    if (labelOn) el.setAttribute('label', el.label);
    else el.setAttribute('label', '');
    if (supportingOn) el.setAttribute('supporting-text', el.supportingText);
    else el.setAttribute('supporting-text', '');

    if (stopField) {
      (stopField as HTMLElement).hidden =
        variant !== 'linear' || indeterminate || oscillation;
    }
    if (layoutField) (layoutField as HTMLElement).hidden = variant !== 'linear';
    if (sizeField) (sizeField as HTMLElement).hidden = variant !== 'circular';
    if (srcField) (srcField as HTMLElement).hidden = !oscillation;
    if (pctPosField) {
      (pctPosField as HTMLElement).hidden = variant !== 'circular' || !percentOn || indeterminate;
    }
    if (valueWrap) (valueWrap as HTMLElement).hidden = indeterminate;
    if (slider) {
      slider.disabled = indeterminate;
      if (!indeterminate) el.value = Math.min(1, Math.max(0, (slider.value ?? 65) / 100));
    }
    if (pctLabel && slider) pctLabel.textContent = `${Math.round(slider.value)}%`;
  };

  lab.querySelectorAll<RadioEl>('k3-radio').forEach((radio) => {
    radio.addEventListener('k3-change', () => {
      queueMicrotask(sync);
    });
  });
  lab.querySelectorAll<SwitchEl>('k3-switch').forEach((sw) => {
    sw.addEventListener('k3-change', () => {
      queueMicrotask(sync);
    });
  });
  lab.addEventListener('k3-change', (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.localName === 'k3-slider') sync();
  });
  lab.addEventListener('k3-input', (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.localName === 'k3-slider') sync();
  });
  sync();
}

/** Slider page — H | V frames + size / stops / inset / label / VI / ± / toolbar. */
function wireSliderLab(): void {
  const lab = document.getElementById('slider-lab');
  if (!lab) return;

  type SliderEl = HTMLElement & {
    value: number;
    valueStart: number;
    valueEnd: number;
    min: number;
    max: number;
    step: number;
    size: string;
    variant: string;
    color: string;
    topToBottom: boolean;
    stops: boolean;
    stopLabels: string;
    insetIcon: boolean;
    valueIndicator: boolean;
    label: string;
    disabled: boolean;
  };
  type SwitchEl = HTMLElement & { selected: boolean };
  type GroupEl = HTMLElement & { selectedValues: () => string[] };
  type MuteBtn = HTMLElement & { selected: boolean; disabled: boolean; label: string };

  const sliderH = document.getElementById('slider-lab-h') as SliderEl | null;
  const sliderV = document.getElementById('slider-lab-v') as SliderEl | null;
  const sliders = [sliderH, sliderV].filter(Boolean) as SliderEl[];
  const sizeGroup = document.getElementById('sl-size') as GroupEl | null;
  const variantGroup = document.getElementById('sl-variant') as GroupEl | null;
  const colorGroup = document.getElementById('sl-color') as GroupEl | null;
  const stageH = document.getElementById('slider-lab-stage-h');
  const caseV = document.getElementById('slider-lab-case-v');
  const guideHLabel = document.getElementById('slider-lab-guide-h-label');
  const guideV = document.getElementById('slider-lab-guide-v');
  const muteBtn = document.getElementById('slider-lab-mute') as MuteBtn | null;
  const muteIcon = muteBtn?.querySelector<HTMLElement>('[data-k3-icon]');

  let toolbarMuted = false;
  let toolbarVolBeforeMute = 40;

  const switchOn = (id: string): boolean => {
    const sw = document.getElementById(id) as SwitchEl | null;
    return sw?.selected === true;
  };

  const iconField = document.getElementById('slider-lab-icon-field');
  const labelField = document.getElementById('slider-lab-label-field');

  const setMuteChrome = (): void => {
    if (!muteBtn || !sliderH) return;
    const v = toolbarMuted ? 0 : sliderH.value;
    const glyph = v === 0 ? 'volume_off' : v < 45 ? 'volume_down' : 'volume_up';
    muteBtn.selected = toolbarMuted;
    muteBtn.toggleAttribute('selected', toolbarMuted);
    muteBtn.label = toolbarMuted
      ? t('doc.slider.control.unmute')
      : t('doc.slider.control.mute');
    if (muteIcon) muteIcon.setAttribute('data-k3-icon', glyph);
  };

  muteBtn?.addEventListener('k3-click', () => {
    if (!sliderH) return;
    if (toolbarMuted) {
      toolbarMuted = false;
      sliderH.value = toolbarVolBeforeMute;
    } else {
      toolbarVolBeforeMute = sliderH.value > 0 ? sliderH.value : 40;
      toolbarMuted = true;
      sliderH.value = 0;
    }
    sliderH.dispatchEvent(
      new CustomEvent('k3-change', {
        bubbles: true,
        composed: true,
        detail: { value: sliderH.value },
      }),
    );
    setMuteChrome();
  });

  sliderH?.addEventListener('k3-input', () => {
    if (!sliderH) return;
    if (sliderH.value > 0) toolbarMuted = false;
    setMuteChrome();
  });
  sliderH?.addEventListener('k3-change', () => {
    if (!sliderH) return;
    if (sliderH.value > 0) toolbarMuted = false;
    setMuteChrome();
  });

  const nudge = (slider: SliderEl, dir: -1 | 1): void => {
    if (slider.variant === 'range') return;
    const step = slider.step > 0 ? slider.step : 1;
    const next = Math.min(slider.max, Math.max(slider.min, slider.value + dir * step));
    slider.value = next;
    slider.dispatchEvent(
      new CustomEvent('k3-change', {
        bubbles: true,
        composed: true,
        detail: { value: next },
      }),
    );
  };

  sliders.forEach((slider) => {
    slider
      .querySelector('.sl-pm[data-pm-slot="start"]')
      ?.addEventListener('click', () => nudge(slider, -1));
    slider
      .querySelector('.sl-pm[data-pm-slot="end"]')
      ?.addEventListener('click', () => nudge(slider, 1));
  });

  const setSlot = (el: HTMLElement, name: string, on: boolean): void => {
    if (on) {
      el.slot = name;
      el.hidden = false;
    } else {
      el.removeAttribute('slot');
      el.hidden = true;
    }
  };

  const sync = (): void => {
    const size = sizeGroup?.selectedValues()?.[0] || 'xs';
    const variant = variantGroup?.selectedValues()?.[0] || 'standard';
    const color = colorGroup?.selectedValues()?.[0] || 'primary';
    const isToolbar = variant === 'toolbar';
    const isRange = variant === 'range';
    const isCentered = variant === 'centered';
    const sliderVariant = isToolbar ? 'standard' : variant;
    const stopsOn = switchOn('sl-sw-stops');
    const iconOn = switchOn('sl-sw-icon');
    /* Toolbar chrome never shows a label — option is unavailable. */
    const labelOn = !isToolbar && switchOn('sl-sw-label');
    const viOn = switchOn('sl-sw-vi');
    const pmOn = switchOn('sl-sw-pm') && !isToolbar;
    const disabledOn = switchOn('sl-sw-disabled');
    const ttbOn = switchOn('sl-sw-ttb');
    /* Inset icon: standard · md+ only (M3 — not centered / range / toolbar). */
    const canIcon =
      sliderVariant === 'standard' &&
      !isToolbar &&
      (size === 'md' || size === 'lg' || size === 'xl');

    if (iconField) iconField.hidden = !canIcon;
    if (labelField) labelField.hidden = isToolbar;
    stageH?.classList.toggle('slider-lab-stage--toolbar', isToolbar);
    if (muteBtn) {
      muteBtn.hidden = !isToolbar;
      muteBtn.disabled = disabledOn;
      muteBtn.toggleAttribute('disabled', disabledOn);
    }
    if (caseV) caseV.hidden = isToolbar;
    if (guideV) guideV.hidden = isToolbar;
    if (guideHLabel) {
      guideHLabel.setAttribute(
        'data-i18n',
        isToolbar ? 'doc.slider.variant.toolbar' : 'doc.slider.demo.horizontal',
      );
      guideHLabel.textContent = isToolbar
        ? t('doc.slider.variant.toolbar')
        : t('doc.slider.demo.horizontal');
    }
    if (isToolbar) setMuteChrome();

    sliders.forEach((el) => {
      const isVertical = el.id === 'slider-lab-v';
      /* Range = horizontal only — disable the vertical demo. */
      const forceDisabled = disabledOn || (isRange && isVertical) || (isToolbar && isVertical);
      const elVariant =
        isToolbar || (isRange && isVertical) ? 'standard' : sliderVariant;
      const prevVariant = el.variant;

      el.size = size;
      el.setAttribute('size', size);
      el.variant = elVariant;
      el.setAttribute('variant', elVariant);
      el.color = color;
      el.setAttribute('color', color);
      el.topToBottom = isVertical && ttbOn;
      el.toggleAttribute('top-to-bottom', el.topToBottom);
      el.stops = stopsOn;
      el.toggleAttribute('stops', stopsOn);
      el.step = stopsOn ? 10 : 1;
      el.valueIndicator = viOn;
      el.toggleAttribute('value-indicator', viOn);
      el.insetIcon = iconOn && canIcon;
      el.toggleAttribute('inset-icon', el.insetIcon);
      el.disabled = forceDisabled;
      el.toggleAttribute('disabled', forceDisabled);
      el.label = labelOn ? 'Volume' : '';

      if (isCentered && !isToolbar) {
        if (prevVariant !== 'centered' || el.min !== -50 || el.max !== 50) {
          el.min = -50;
          el.max = 50;
          el.value = 0;
        }
      } else if (isRange && !isVertical && !isToolbar) {
        if (prevVariant !== 'range' || el.min !== 0 || el.max !== 100) {
          el.min = 0;
          el.max = 100;
          el.valueStart = 20;
          el.valueEnd = 70;
          el.setAttribute('value-start', '20');
          el.setAttribute('value-end', '70');
        }
      } else if (
        prevVariant === 'centered' ||
        prevVariant === 'range' ||
        el.min !== 0 ||
        el.max !== 100
      ) {
        el.min = 0;
        el.max = 100;
        if (!isToolbar || el.id !== 'slider-lab-h' || toolbarMuted) {
          el.value = isToolbar && toolbarMuted ? 0 : 40;
        } else if (el.value < 0 || el.value > 100) {
          el.value = 40;
        }
      }

      el.querySelectorAll<HTMLElement>('.sl-inset-icon').forEach((node) => {
        setSlot(node, 'icon', el.insetIcon);
      });
      el.querySelectorAll<HTMLElement>('.sl-inset-icon-min').forEach((node) => {
        setSlot(node, 'icon-min', el.insetIcon);
      });
      el.querySelectorAll<HTMLElement>('.sl-pm').forEach((btn) => {
        const showPm = pmOn && !forceDisabled && !isRange;
        setSlot(btn, btn.dataset.pmSlot ?? '', showPm);
        if ('disabled' in btn) {
          (btn as HTMLElement & { disabled: boolean }).disabled = forceDisabled;
        }
      });
    });
  };

  sizeGroup?.addEventListener('k3-change', () => queueMicrotask(sync));
  variantGroup?.addEventListener('k3-change', () => queueMicrotask(sync));
  colorGroup?.addEventListener('k3-change', () => queueMicrotask(sync));
  lab.querySelectorAll<SwitchEl>('k3-switch').forEach((sw) => {
    sw.addEventListener('k3-change', () => queueMicrotask(sync));
  });
  sync();
}

/** Buttons Pill demos — single-select within each group; lone pills toggle. */
function wireButtonPillDemos(): void {
  const page = document.querySelector<HTMLElement>('[data-page="buttons-pill"]');
  if (!page) return;

  type Pill = HTMLElement & { selected: boolean };
  const setSelected = (pill: Pill, on: boolean): void => {
    pill.selected = on;
    pill.toggleAttribute('selected', on);
  };

  page.querySelectorAll<HTMLElement>('[data-button-pill-group]').forEach((group) => {
    group.addEventListener('k3-activate', (e) => {
      const t = (e.target as HTMLElement | null)?.closest('k3-button-pill') as Pill | null;
      if (!t || !group.contains(t)) return;
      group.querySelectorAll<Pill>('k3-button-pill').forEach((p) => setSelected(p, p === t));
    });
  });

  /* Selected section — standalone pills toggle on / off */
  page.querySelectorAll<Pill>('k3-button-pill').forEach((pill) => {
    if (pill.closest('[data-button-pill-group]')) return;
    pill.addEventListener('k3-activate', () => setSelected(pill, !pill.selected));
  });
}

/**
 * Meet call bar — Reactions toggles `slot=expand` (click again to hide).
 * Strip scaleY opens upward (bottom origin) for bottom-of-screen toolbars.
 */
function wireMeetToolbarDemo(): void {
  const toolbar = document.getElementById('meet-call-toolbar') as
    | (HTMLElement & { expanded: boolean })
    | null;
  const group = document.getElementById('meet-call-actions');
  if (!toolbar || !group || group.dataset.meetWired) return;
  group.dataset.meetWired = '1';

  group.addEventListener('k3-change', (e) => {
    const values = (e as CustomEvent<{ values?: string[] }>).detail?.values ?? [];
    const open = values.includes('reactions');
    toolbar.expanded = open;
    toolbar.toggleAttribute('expanded', open);
  });
}

void boot();
