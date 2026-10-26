import '../src/fonts/fonts-ui.css';
import '../src/styles/k3ui.scss';
import { init } from '../src/bootstrap/init.js';
import { registry } from '../src/registry/register.js';
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
  ICON_SIZE_TOKENS,
  SHAPE_CORNER_TOKENS,
  MOTION_DURATION_TOKENS,
} from '../src/tokens/meta.js';
import {
  componentsByCategory,
  componentsInCategory,
  orderedComponents,
  neighborComponents,
  findComponent,
  resolvePageId,
} from './catalog.js';
import {
  NAV_DESTINATIONS,
  COMPONENT_MENU_GROUPS,
  destinationForPage,
} from './nav-destinations.js';
import { docStore, DocKeys } from './doc-store.js';
import {
  mountDocTables,
  mountTableIn,
  createDocTable,
  INIT_SECTION,
} from './doc-tables.js';
import { enhanceAllDemos } from './demo-enhance.js';
import { mountUsageIfNeeded } from './mount-usage.js';
import {
  isPlaygroundLocale,
  mountLocaleFlags,
  syncLocaleLeadingFlag,
  type PlaygroundLocale,
} from './locale-flags.js';
import { armNavActive, navItemFromEvent } from '../src/components/navigation/nav-selection.js';
import type { K3NavItem } from '../src/components/navigation/nav-item.js';
import type { DocComponent } from './catalog.js';
import { getSoundFx } from '../src/core/sound-fx.js';

/**
 * Shell-critical custom elements — enough for first paint (home + chrome).
 * Remaining catalog tags register after idle so LCP is not blocked by demos.
 */
const SHELL_COMPONENTS = [
  'k3-theme',
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
  'k3-doc-nav',
  'k3-dialog',
  'k3-button',
  'k3-button-group',
  'k3-switch',
] as const;

/** Registered right after first paint — not needed for LCP text. */
const SHELL_DEFERRED = ['k3-tooltip', 'k3-snackbar'] as const;

const seeds = ['#6750A4', '#00639B', '#8B1A4A', '#1B6B4A', '#B35C00'];
let seedIdx = (() => {
  const idx = docStore.get<number>(DocKeys.themeSeedIdx, 0);
  return idx >= 0 && idx < seeds.length ? idx : 0;
})();
/* Restore last picked color into the active slot (picker mutates seeds[seedIdx]). */
{
  const saved = normalizeHex(docStore.get<string>(DocKeys.themeSeed, seeds[seedIdx]!));
  if (saved) seeds[seedIdx] = saved;
}
/** Persisted theme preference — light · dark · auto · system (OS). */
let themeMode: ColorMode = (() => {
  const saved = docStore.get<string>(DocKeys.themeMode, 'light');
  if (saved === 'light' || saved === 'dark' || saved === 'auto' || saved === 'system') {
    return saved;
  }
  return 'light';
})();
/** Animations on by default — opt out via rail foot (desktop) or app-bar (phone). */
let animationsOn = docStore.get<boolean>(DocKeys.uiAnimations, true);
/** M3 motion scheme — Expressive (spring) default · Standard (utilitarian). */
let motionScheme: MotionScheme = (() => {
  const saved = docStore.get<string>(DocKeys.themeMotion, 'expressive');
  return saved === 'standard' ? 'standard' : 'expressive';
})();
const COLOR_VARIANTS: readonly ColorVariant[] = [
  'tonalspot',
  'vibrant',
  'fidelity',
  'expressive',
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
  docStore.get<string>(DocKeys.themeVariant, 'expressive'),
);
let contrastLevel: ContrastLevel = parseContrast(
  docStore.get<string>(DocKeys.themeContrast, 'default'),
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
/** Layout grid overlay — settings dialog */
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

/** Resolve legacy hashes → title-aligned slugs (Family-Type). */
function articlePageId(hashId: string): string {
  return resolvePageId(hashId);
}

function isColorFamilyPage(hashId: string): boolean {
  return COLOR_CHILD_IDS.has(articlePageId(hashId));
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
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key || el.children.length > 0) return;
    el.textContent = t(key);
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
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (!key) return;
    el.setAttribute('aria-label', t(key));
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
  syncSettingsDialog();
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
  const raw = (window.K3UI?.i18n.locale ?? docStore.get(DocKeys.uiLocale, 'fr')) as string;
  return isPlaygroundLocale(raw) ? raw : 'fr';
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
  syncSettingsDialog();
  syncColorModeButtons();
}

function syncMotionControls(): void {
  syncSettingsDialog();
}

function syncDirControl(): void {
  syncSettingsDialog();
}

function setMotionScheme(scheme: MotionScheme): void {
  motionScheme = scheme;
  applyThemePersist();
  syncSettingsDialog();
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
function syncSettingsDialog(): void {
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
  const seedHex = document.getElementById('settings-seed-hex');
  if (seedHex) seedHex.textContent = seed;
  const swatch = document.getElementById('settings-seed');
  if (swatch) {
    swatch.style.background = seed;
    swatch.setAttribute('title', seed);
  }
  const picker = document.getElementById('settings-seed-picker') as HTMLInputElement | null;
  if (picker && document.activeElement !== picker) {
    picker.value = normalizeHex(seed) ?? seed;
    picker.setAttribute('aria-label', `${t('playground.ctrl.seed')} ${seed}`);
  }
  const seedNorm = (normalizeHex(seed) ?? seed).toUpperCase();
  document.querySelectorAll<HTMLElement>('[data-settings-seed]').forEach((el) => {
    const hex = normalizeHex(el.getAttribute('data-settings-seed') ?? '') ?? '';
    const on = hex.toUpperCase() === seedNorm;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

async function openSettingsSheet(): Promise<void> {
  await registry.register('k3-sheet');
  await registry.register('k3-button');
  await registry.register('k3-button-group');
  await registry.register('k3-switch');
  syncSettingsDialog();
  const sheet = settingsSheet();
  if (sheet && typeof sheet.show === 'function') await sheet.show();
}

function applyAnimationsPreference(): void {
  const root = document.documentElement;
  if (animationsOn) root.removeAttribute('data-k3-reduce-motion');
  else root.setAttribute('data-k3-reduce-motion', '');
  docStore.set(DocKeys.uiAnimations, animationsOn);
  syncMotionControls();
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
  window.K3UI?.i18n.setLocale(locale);
  docStore.set(DocKeys.uiLocale, locale);
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

  const bar = document.getElementById('nav-bar') as HTMLElement & { layout?: string } | null;
  // Compact phone: vertical items; medium tablet with bar fallback would be horizontal —
  // we use rail on tablet, so bar stays vertical for phone only.
  if (bar) bar.layout = 'vertical';
  syncShellSecondarySurface(mode);
}

type ShellNavItem = HTMLElement & {
  icon: string;
  label: string;
  href: string;
  active: boolean;
  /** Secondary menu/sheet open — hover pill without stealing selected. */
  menuOpen: boolean;
  layout: string;
  updateComplete: Promise<boolean>;
};

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

  NAV_DESTINATIONS.forEach((dest, i) => {
    const el = items[i]!;
    el.icon = dest.icon;
    el.label = t(dest.labelKey);
    /* Direct pages keep href; menu destinations stay empty (open secondary menu) */
    el.href = dest.href || '';
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
};

/** Serialize rail menu open/toggle so overlapping clicks cannot fight. */
let shellMenuLock: Promise<void> = Promise.resolve();

type ShellMenuItem = HTMLElement & {
  openSubmenu: (opts?: { focusFirst?: boolean }) => void;
};

/** Anchor rect for positioning the secondary menu (from the clicked nav-item). */
let pendingMenuAnchor: DOMRect | null = null;
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

/** Position the M3E menu next to the rail item (tablet / desktop only). */
function positionShellNavMenu(anchor: DOMRect | null): void {
  const menu = shellNavMenu();
  if (!menu) return;
  const rtl = document.documentElement.getAttribute('dir') === 'rtl';

  if (!anchor) {
    menu.style.top = '';
    menu.style.left = '';
    menu.style.right = '';
    return;
  }

  /*
   * Rail: open toward content with end-start (LTR → right · RTL → left).
   * Horizontal anchor = rail’s content-facing edge — NOT the nav-item.
   * Expanded pills are narrower than the rail and start-aligned, so using
   * item.left in RTL left a visible gap between menu and rail.
   */
  menu.position = 'end-start';
  menu.style.top = `${anchor.top}px`;
  menu.style.right = '';
  const rail = document.getElementById('nav-rail');
  const railRect = rail?.getBoundingClientRect();
  if (railRect && railRect.width > 0) {
    menu.style.left = `${rtl ? railRect.left : railRect.right}px`;
  } else {
    menu.style.left = `${rtl ? anchor.left : anchor.right}px`;
  }
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
  a.append(sheetLabel(comp.titleKey));
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
  opts?: { slot?: string; selectCurrent?: boolean },
): HTMLElement {
  const item = document.createElement('k3-menu-item');
  item.setAttribute('value', comp.id);
  if (opts?.slot) item.slot = opts.slot;
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
    for (const group of COMPONENT_MENU_GROUPS) {
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
      for (const c of componentsInCategory(group.category)) {
        const li = document.createElement('li');
        li.append(sheetNavLink(c, selectCurrent ? pageId : ''));
        ul.append(li);
      }
      groupEl.append(btn, ul);
      nav.append(groupEl);
    }
  } else if (openDest.id === 'utilities') {
    const flatIcons: Record<string, string> = {
      gestures: 'gesture',
      dnd: 'drag_indicator',
      scrollbar: 'swap_vert',
    };
    const ul = document.createElement('ul');
    ul.className = 'shell-sheet-nav';
    for (const c of componentsInCategory('Utilities')) {
      const li = document.createElement('li');
      const link = sheetNavLink(c, selectCurrent ? pageId : '');
      const icon = document.createElement('span');
      icon.className = 'ms';
      setMsIcon(icon, flatIcons[c.id] ?? 'tune');
      link.prepend(icon);
      li.append(link);
      ul.append(li);
    }
    nav.append(ul);
  } else {
    /* Styles — Color expands to Roles / Palettes / Additional */
    const flatIcons: Record<string, string> = {
      elevation: 'layers',
      icons: 'mood',
      motion: 'animation',
      shapes: 'shapes',
      spacing: 'space_bar',
      typography: 'match_case',
    };
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
          a.append(sheetLabel(labelKey));
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
      const link = sheetNavLink(c, selectCurrent ? pageId : '');
      const icon = document.createElement('span');
      icon.className = 'ms';
      setMsIcon(icon, flatIcons[c.id] ?? 'palette');
      link.prepend(icon);
      li.append(link);
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
      ...COMPONENT_MENU_GROUPS.map((group) => {
        const parent = document.createElement('k3-menu-item');
        parent.setAttribute('value', `cat-${group.category}`);
        parent.setAttribute('has-submenu', '');
        parent.append(menuItemIcon(group.icon), t(group.labelKey));
        appendEnSupporting(parent, group.labelKey);
        for (const c of componentsInCategory(group.category)) {
          parent.appendChild(
            leafMenuItem(c, pageId, { slot: 'submenu', selectCurrent }),
          );
        }
        return parent;
      }),
    );
  } else if (openDest.id === 'utilities') {
    const utilIcons: Record<string, string> = {
      gestures: 'gesture',
      dnd: 'drag_indicator',
      scrollbar: 'swap_vert',
    };
    const links = componentsInCategory('Utilities');
    menu.replaceChildren(
      ...links.map((c) => {
        const item = leafMenuItem(c, pageId, { selectCurrent });
        item.prepend(menuItemIcon(utilIcons[c.id] ?? 'tune'));
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
        parent.append(t('doc.colors.title'));
        appendEnSupporting(parent, 'doc.colors.title');
        for (const [value, labelKey] of COLOR_SUBPAGES) {
          const child = document.createElement('k3-menu-item');
          child.setAttribute('value', value);
          child.slot = 'submenu';
          child.append(t(labelKey));
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
 * - Utilities → flat list (gestures, dnd, scrollbar)
 * - Styles → flat list; Color expands to Roles / Palettes / Additional
 */
function buildNavMenu(
  opts: { open?: boolean; anchor?: DOMRect | null; destId?: string | null } = {},
): void {
  if (opts.open) {
    void openShellNavMenu(opts.destId, opts.anchor ?? pendingMenuAnchor);
    pendingMenuAnchor = null;
    return;
  }
  fillNavMenu(opts.destId);
}

/**
 * Open (or toggle) the rail secondary menu.
 * Toggle is driven by `openMenuDestId` (not `menu.open`) so a document
 * pointerdown dismiss cannot invert the following click.
 */
async function openShellNavMenu(
  destId?: string | null,
  anchor: DOMRect | null = null,
): Promise<void> {
  const run = async (): Promise<void> => {
    /* Shell already registers these at boot — only wait if missing */
    if (!customElements.get('k3-menu')) await registry.register('k3-menu');
    if (!customElements.get('k3-menu-item')) await registry.register('k3-menu-item');
    const menu = shellNavMenu();
    if (!menu || typeof menu.show !== 'function') return;

    menu.armDismissGuard?.(320);

    const id = resolveSecondaryDest(destId).id;

    /* Same dest already shown → close (parity with bottom sheet) */
    if (openMenuDestId === id) {
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
    positionShellNavMenu(anchor);

    /* Show immediately — items upgrade while the panel is visible */
    menu.armDismissGuard?.(320);
    const shown = await menu.show('menu', { fast: true });
    if (!shown) {
      openMenuDestId = null;
      syncNavMenuOpenHighlight();
      return;
    }
    if (!pageCat) return;
    const parent = menu.querySelector<ShellMenuItem>(
      `k3-menu-item[value="cat-${pageCat}"]`,
    );
    parent?.openSubmenu();
  };

  shellMenuLock = shellMenuLock.then(run, run);
  await shellMenuLock;
}

function buildCatalogGrid(filter = ''): void {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  const q = filter.trim().toLowerCase();
  const byCat = componentsByCategory();
  const blocks: string[] = [];
  for (const [cat, comps] of byCat) {
    const visible = q
      ? comps.filter((c) => {
        const title = t(c.titleKey).toLowerCase();
        const blurb = t(c.blurbKey).toLowerCase();
        return title.includes(q) || blurb.includes(q) || c.id.includes(q) || cat.toLowerCase().includes(q);
      })
      : comps;
    if (!visible.length) continue;
    blocks.push(`<section class="catalog-cat">
      <h2 class="catalog-cat-title">${cat}</h2>
      <div class="catalog-cards">
        ${visible
          .map(
            (c) => `<a class="catalog-card" href="#/${c.id}">
            <span class="catalog-card-title">${t(c.titleKey)}</span>
            <span class="catalog-card-blurb">${t(c.blurbKey)}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`);
  }
  grid.innerHTML =
    blocks.join('') ||
    `<p class="hint">${t('playground.search.placeholder')}</p>`;
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

function showPage(id: string): void {
  const articleId = articlePageId(id);
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
  buildPrimaryNav();
  /* Rebuild menu contents (closed) — rail click opens via buildNavMenu({ open: true }) */
  buildNavMenu();
  syncDocNav(resolvedId);
  const scroll = document.querySelector('.shell-scroll');
  if (scroll) scroll.scrollTop = 0;
  else window.scrollTo(0, 0);
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

/** Styles token pages — `<k3-table>` Specs (Token / Value / Notes). */
function fillStyleTokenDemos(): void {
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

  const icons = document.getElementById('icons-scale');
  if (icons && !icons.querySelector('k3-table')) {
    mountTableIn(icons, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: ICON_SIZE_TOKENS.map((i) => [i.name, `${i.dp} dp`, `${i.css} · opsz ${i.opsz}`]),
    });
  }

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
    mountTableIn(type, {
      id: 'specs',
      title: 'Specs',
      columns: 'Token, Value, Notes',
      rows: [
        ['roles', 'display · headline · title · body · label', ''],
        ['attrs', 'size · line-height · weight · tracking', ''],
        ['emphasized', 'Expressive weight steps', ''],
      ],
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

function applyThemePersist(): void {
  const seed = seeds[seedIdx] ?? seeds[0]!;
  docStore.set(DocKeys.themeSeed, seed);
  docStore.set(DocKeys.themeSeedIdx, seedIdx);
  docStore.set(DocKeys.themeMode, themeMode);
  docStore.set(DocKeys.themeVariant, colorVariant);
  docStore.set(DocKeys.themeContrast, contrastLevel);
  docStore.set(DocKeys.themeMotion, motionScheme);
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
  }
  window.K3UI?.theme.apply({
    seed,
    mode: themeMode,
    motion: motionScheme,
    variant: colorVariant,
    contrast: contrastLevel,
  });
  refreshColorDocs(seed);
  syncSettingsDialog();
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
  await registry.register('k3-table');
  mountDocTables(page, id);
  mountUsageIfNeeded(page, id);
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
      <h3>${label}</h3>
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
              return `<button type="button" class="color-swatch color-copy-target" style="background:${hex};color:${s.onHex}" data-copy-hex="${hex}" title="${hex}">
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

async function boot(): Promise<void> {
  const app = document.querySelector('.app');
  const errBox = document.getElementById('boot-error');

  try {
    window.K3UI_MANUAL = true;
    const savedSeed = seeds[seedIdx] ?? seeds[0]!;
    const savedLocale = docStore.get(DocKeys.uiLocale, 'fr');
    const api = await init({
      locale: savedLocale,
      theme: {
        seed: savedSeed,
        mode: themeMode,
        motion: motionScheme,
        variant: colorVariant,
        contrast: contrastLevel,
      },
      debug: false,
      components: [...SHELL_COMPONENTS],
    });

    const ver = document.getElementById('ver');
    if (ver) ver.textContent = `v${api.version}`;

    applyAdaptiveShell();
    containerOn = docStore.get(DocKeys.uiContainer, true);
    applyContainerLayout();
    buildPrimaryNav();
    buildNavMenu();
    buildCatalogGrid();
    rebuildGridOverlay();
    setDocumentDir(docStore.get(DocKeys.uiDir, 'ltr'));
    applyAnimationsPreference();
    /* Re-apply persisted theme (seed already restored into seeds[seedIdx]) */
    applyThemePersist();
    /* After CE upgrade + adoptMenuItems (flags live in split shadow menu) */
    const paintLocaleFlags = (): void => mountLocaleFlags(currentLocale());
    paintLocaleFlags();
    queueMicrotask(paintLocaleFlags);
    requestAnimationFrame(paintLocaleFlags);
    applyPlaygroundI18n();
    document.addEventListener('k3-locale-change', () => applyPlaygroundI18n());
    wireShellGithubMenu();
    wireQuickStartTabs();
    wireCodeSamples();
    /* Demo frames → equal cases + horizontal nums (skip matrix / fab-menu) */
    enhanceAllDemos();
    /* Usage HTML/CSS/JS before Specs — every component page */
    document.querySelectorAll<HTMLElement>('.comp-page[data-page]').forEach((page) => {
      const id = page.getAttribute('data-page');
      if (id) mountUsageIfNeeded(page, id);
    });
    applyPlaygroundI18n();

    /** Register only CE tags present on a page (avoids upgrading every demo at boot). */
    const ensurePageComponents = async (pageId: string): Promise<void> => {
      const articleId = articlePageId(pageId);
      const page =
        document.querySelector<HTMLElement>(`.comp-page[data-page="${articleId}"]`) ??
        (articleId === 'home' ? document.getElementById('page-home') : null);
      if (!page) return;
      const tags = [
        ...new Set(
          [...page.querySelectorAll('*')]
            .map((el) => el.tagName.toLowerCase())
            .filter((t) => t.startsWith('k3-')),
        ),
      ];
      if (tags.length) await registry.registerAll(tags);
      if (articleId === 'quick-start' || page.querySelector('pre, code')) {
        void import('../src/fonts/fonts-code.css');
      }
      if (articleId === 'shapes') await fillShapes();
      if (
        articleId === 'spacing' ||
        articleId === 'elevation' ||
        articleId === 'icons' ||
        articleId === 'motion' ||
        articleId === 'shapes' ||
        articleId === 'typography' ||
        isColorFamilyPage(articleId)
      ) {
        await registry.register('k3-table');
        fillStyleTokenDemos();
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
      if (articleId !== 'home' && articleId !== 'quick-start') {
        await ensureDocTables(articleId);
        wirePinSuccessDemo();
      }
    };

    const initialPage = currentPageId();
    showPage(initialPage);
    /* Home has no demo CE — skip. Other deep-links register only that page. */
    if (initialPage !== 'home') {
      await ensurePageComponents(initialPage);
    }

    window.addEventListener('hashchange', () => {
      void (async () => {
        const page = currentPageId();
        await ensurePageComponents(page);
        showPage(page);
      })();
    });

    afterFirstPaint(() => {
      void registry.registerAll([...SHELL_DEFERRED]);
      /* Warm the rest of the catalog well after Lighthouse's quiet window */
      window.setTimeout(() => {
        void registry.registerAll('all');
      }, 8000);
    });

    /*
     * Primary nav:
     * - destination with href → navigate (Quick Start)
     * - otherwise → open secondary menu (Components / Styles)
     * Capture + stopPropagation so the rail/bar does not steal `active`
     * before we resolve the destination.
     */
    const onPrimaryClick = (e: Event): void => {
      const host = e.currentTarget as HTMLElement;
      const item = navItemFromEvent(e, host);
      if (!item) return;
      const slotted = new Set([...host.querySelectorAll('[slot]')].map((el) => el as Element));
      const items = [...host.querySelectorAll('k3-nav-item')].filter((el) => !slotted.has(el));
      const idx = items.indexOf(item as (typeof items)[number]);
      const dest = NAV_DESTINATIONS[idx];
      if (idx < 0 || !dest) return;
      e.preventDefault();
      e.stopPropagation();
      if (dest.href) {
        closeShellNavMenu();
        if (location.hash === dest.href || location.hash === dest.href.replace(/^#/, '#')) {
          showPage(dest.id);
          buildPrimaryNav();
        } else {
          location.hash = dest.href;
        }
        return;
      }
      /*
       * Use data-nav (source of truth after applyAdaptiveShell), not a fresh
       * matchMedia — avoids bar/rail disagreeing mid-gesture.
       */
      const mode =
        (document.querySelector('.app')?.getAttribute('data-nav') as 'bar' | 'rail' | null) ??
        navMode();
      if (mode === 'bar') {
        void openShellNavSheet(dest.id);
        return;
      }
      /* Guard before any await — pointerdown must not dismiss mid-open */
      shellNavMenu()?.armDismissGuard?.(320);
      void openShellNavMenu(dest.id, item.getBoundingClientRect());
    };
    document.getElementById('nav-rail')?.addEventListener('click', onPrimaryClick, true);
    document.getElementById('nav-bar')?.addEventListener('click', onPrimaryClick, true);

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
      if (location.hash === next) showPage(value);
      else location.hash = next;
    });

    /* Rail header FAB → home */
    const goHome = (): void => {
      closeShellNavMenu();
      if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
        showPage('home');
      } else {
        location.hash = '#/';
      }
    };
    document.getElementById('rail-fab')?.addEventListener('k3-click', goHome);
    document.getElementById('rail-efab')?.addEventListener('k3-click', goHome);

    /* Secondary menu leaf items → navigate then close (ignore category parents) */
    document.getElementById('shell-nav-menu')?.addEventListener('k3-select', (e) => {
      const value = (e as CustomEvent<{ value?: string }>).detail?.value;
      if (!value || value.startsWith('cat-')) return;
      const next = `#/${value}`;
      closeShellNavMenu();
      if (location.hash === next) {
        showPage(value);
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
  } catch (err) {
    console.error(err);
    if (errBox) {
      errBox.hidden = false;
      errBox.textContent = `K3ui init failed: ${err instanceof Error ? err.message : String(err)}`;
    }
    return;
  }

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

  wireShellChrome();
  wireDemoPages();
}

/** App-bar chrome — locale + settings dialog (theme / motion / layout / seed). */
function wireShellChrome(): void {
  document.getElementById('locale-menu')?.addEventListener('k3-select', (e) => {
    const v = (e as CustomEvent<{ value?: string }>).detail?.value;
    if (v === 'fr' || v === 'en') setLocale(v);
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
  syncSettingsDialog();
  queueMicrotask(syncSettingsDialog);
  requestAnimationFrame(syncSettingsDialog);

  const openSettings = (): void => {
    void openSettingsSheet();
  };
  document.getElementById('btn-settings')?.addEventListener('k3-click', openSettings);

  document.getElementById('settings-theme-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const mode = btn?.getAttribute('data-settings-theme');
    if (mode === 'light' || mode === 'dark' || mode === 'auto' || mode === 'system') {
      setThemeMode(mode);
    }
  });

  document.getElementById('settings-variant-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const v = parseColorVariant(btn?.getAttribute('data-settings-variant'));
    colorVariant = v;
    syncColorVariantButtons();
    applyThemePersist();
  });

  document.getElementById('settings-contrast-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    contrastLevel = parseContrast(btn?.getAttribute('data-settings-contrast'));
    applyThemePersist();
  });

  document.getElementById('settings-motion-group')?.addEventListener('k3-change', (e) => {
    const btn = (e as CustomEvent<{ selected?: HTMLElement }>).detail?.selected;
    const scheme = btn?.getAttribute('data-settings-motion');
    if (scheme === 'expressive' || scheme === 'standard') {
      setMotionScheme(scheme);
    }
  });

  document.getElementById('settings-dir-group')?.addEventListener('k3-click', (e) => {
    const t = e.target as HTMLElement | null;
    const btn =
      t?.closest?.('[data-settings-dir]') ??
      (t?.hasAttribute?.('data-settings-dir') ? t : null);
    const dir = btn?.getAttribute('data-settings-dir');
    if (dir === 'ltr' || dir === 'rtl') setDocumentDir(dir);
  });

  document.getElementById('settings-animations')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    animationsOn = selected;
    applyAnimationsPreference();
  });

  document.getElementById('settings-container')?.addEventListener('k3-change', (e) => {
    if (!matchMedia(MQ_BODY_CONTAINER).matches) return;
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    containerOn = selected;
    docStore.set(DocKeys.uiContainer, containerOn);
    applyContainerLayout();
    rebuildGridOverlay();
    syncSettingsDialog();
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
    syncSettingsDialog();
  });

  document.getElementById('settings-audio')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    setAudioEnabled(selected);
    syncSettingsDialog();
  });

  document.getElementById('settings-music')?.addEventListener('k3-change', (e) => {
    const selected = (e as CustomEvent<{ selected?: boolean }>).detail?.selected;
    if (typeof selected !== 'boolean') return;
    setMusicEnabled(selected);
    syncSettingsDialog();
  });

  const seedPicker = document.getElementById('settings-seed-picker') as HTMLInputElement | null;
  /** Big bubble = custom picker only. */
  const onSeedPick = (): void => {
    if (!seedPicker) return;
    const next = normalizeHex(seedPicker.value);
    if (!next) return;
    applySeedHex(next);
    syncSettingsDialog();
  };
  seedPicker?.addEventListener('input', onSeedPick);
  seedPicker?.addEventListener('change', onSeedPick);

  /** 6 presets — apply + persist (same localStorage as custom seed). */
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
      syncSettingsDialog();
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
        tabs.querySelectorAll('.qs-tab').forEach((b) => b.classList.toggle('is-active', b === btn));
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
      tabs.querySelectorAll('.qs-tab').forEach((b) => b.classList.toggle('is-active', b === tab));
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
      const text = panel?.querySelector('code')?.textContent ?? panel?.textContent ?? '';
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
  wireConfettiDemo();
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

/** Buttons Arrow / Pad / Grid — live value labels on demo pages. */
function wireArrowPadGridDemos(): void {
  const arrowVal = document.getElementById('arrow-val');
  document.querySelectorAll('k3-button-arrow').forEach((el) => {
    el.addEventListener('k3-change', ((e: CustomEvent<{ value?: string }>) => {
      if (arrowVal && e.detail?.value != null) arrowVal.textContent = e.detail.value;
    }) as EventListener);
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
    const indeterminate = behavior === 'indeterminate';

    el.variant = variant;
    el.shape = shape;
    el.wavy = shape === 'wavy';
    el.indeterminate = indeterminate;
    el.thickness = thickness;
    el.size = Number.isFinite(sizeRaw) ? sizeRaw : 0;
    el.showStop = stopOn && variant === 'linear' && !indeterminate;
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
    if (el.size > 0) el.setAttribute('size', String(el.size));
    else el.removeAttribute('size');
    /* Keep attributes in sync without remove→null (use empty string). */
    if (labelOn) el.setAttribute('label', el.label);
    else el.setAttribute('label', '');
    if (supportingOn) el.setAttribute('supporting-text', el.supportingText);
    else el.setAttribute('supporting-text', '');

    if (stopField) (stopField as HTMLElement).hidden = variant !== 'linear' || indeterminate;
    if (layoutField) (layoutField as HTMLElement).hidden = variant !== 'linear';
    if (sizeField) (sizeField as HTMLElement).hidden = variant !== 'circular';
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

/** Slider page — H | V frames + size / stops / inset / label / VI / ±. */
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

  const sliderH = document.getElementById('slider-lab-h') as SliderEl | null;
  const sliderV = document.getElementById('slider-lab-v') as SliderEl | null;
  const sliders = [sliderH, sliderV].filter(Boolean) as SliderEl[];
  const sizeGroup = document.getElementById('sl-size') as GroupEl | null;
  const variantGroup = document.getElementById('sl-variant') as GroupEl | null;
  const colorGroup = document.getElementById('sl-color') as GroupEl | null;

  const switchOn = (id: string): boolean => {
    const sw = document.getElementById(id) as SwitchEl | null;
    return sw?.selected === true;
  };

  const iconField = document.getElementById('slider-lab-icon-field');

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
    const isRange = variant === 'range';
    const isCentered = variant === 'centered';
    const stopsOn = switchOn('sl-sw-stops');
    const iconOn = switchOn('sl-sw-icon');
    const labelOn = switchOn('sl-sw-label');
    const viOn = switchOn('sl-sw-vi');
    const pmOn = switchOn('sl-sw-pm');
    const disabledOn = switchOn('sl-sw-disabled');
    const ttbOn = switchOn('sl-sw-ttb');
    /* Inset icon: standard · md+ only (M3 — not centered / range). */
    const canIcon =
      variant === 'standard' && (size === 'md' || size === 'lg' || size === 'xl');

    if (iconField) iconField.hidden = !canIcon;

    sliders.forEach((el) => {
      const isVertical = el.id === 'slider-lab-v';
      /* Range = horizontal only — disable the vertical demo. */
      const forceDisabled = disabledOn || (isRange && isVertical);
      const elVariant = isRange && isVertical ? 'standard' : variant;
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

      if (isCentered) {
        if (prevVariant !== 'centered' || el.min !== -50 || el.max !== 50) {
          el.min = -50;
          el.max = 50;
          el.value = 0;
        }
      } else if (isRange && !isVertical) {
        if (prevVariant !== 'range' || el.min !== 0 || el.max !== 100) {
          el.min = 0;
          el.max = 100;
          el.valueStart = 20;
          el.valueEnd = 70;
          el.setAttribute('value-start', '20');
          el.setAttribute('value-end', '70');
        }
      } else if (prevVariant === 'centered' || prevVariant === 'range' || el.min !== 0 || el.max !== 100) {
        el.min = 0;
        el.max = 100;
        el.value = 40;
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
