/**
 * Resources → Material Symbols browser (Material Symbols New axes).
 * Catalog = names/groups; glyphs = variable font (FILL · wght · GRAD · opsz).
 */
import { registry } from '../src/registry/register.js';
import { showSnackbar } from '../src/components/feedback/snackbar-queue.js';
import { i18n } from '../src/i18n/index.js';

export type MsStyle = 'outlined' | 'rounded' | 'sharp';

interface MsCatalog {
  groups: string[];
  icons: Record<string, string[]>;
}

const STYLES: MsStyle[] = ['outlined', 'rounded', 'sharp'];
const STYLE_LABEL_KEYS = [
  'doc.material-symbols.style.outlined',
  'doc.material-symbols.style.rounded',
  'doc.material-symbols.style.sharp',
] as const;
const STYLE_ICONS = ['change_history', 'mood', 'apps'] as const;
const STYLE_FAMILY: Record<MsStyle, string> = {
  outlined: 'Material Symbols Outlined',
  rounded: 'Material Symbols Rounded',
  sharp: 'Material Symbols Sharp',
};

const CHUNK = 80;
const VF_LINK_ID = 'k3-ms-variable-fonts';

const DEFAULT_AXES = {
  fill: 0,
  wght: 400,
  grad: 0,
  opsz: 48,
} as const;

function t(key: string, vars?: Record<string, string | number>): string {
  return i18n.t(key, undefined, vars);
}

let catalog: MsCatalog | null = null;
let catalogPromise: Promise<MsCatalog> | null = null;
let fontsPromise: Promise<void> | null = null;

let mounted = false;
let style: MsStyle = 'rounded';
let fill = DEFAULT_AXES.fill;
let wght = DEFAULT_AXES.wght;
let grad = DEFAULT_AXES.grad;
let opsz = DEFAULT_AXES.opsz;
let groupIndex = 0;
let query = '';
let searchTimer = 0;
let renderGen = 0;
let gridWired = false;

async function loadCatalog(): Promise<MsCatalog> {
  if (catalog) return catalog;
  if (!catalogPromise) {
    catalogPromise = fetch('/json/material-symbols.json')
      .then((r) => {
        if (!r.ok) throw new Error(`material-symbols catalog ${r.status}`);
        return r.json() as Promise<MsCatalog>;
      })
      .then((data) => {
        catalog = data;
        return data;
      })
      .catch((err) => {
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

/** Warm full axis range so the playground icon_names subset doesn’t win alone. */
async function warmVariableAxes(): Promise<void> {
  if (!document.fonts?.load) return;
  const families = Object.values(STYLE_FAMILY);
  await Promise.all(
    families.flatMap((fam) => [
      document.fonts.load(`100 20px "${fam}"`),
      document.fonts.load(`700 48px "${fam}"`),
      document.fonts.load(`400 24px "${fam}"`),
    ]),
  ).catch(() => undefined);
}

/** Full variable fonts (FILL · wght · GRAD · opsz) — lazy, page-only. */
export function ensureVariableFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    if (!document.getElementById(VF_LINK_ID)) {
      await new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.id = VF_LINK_ID;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?' +
          [
            'family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
            'family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
            'family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
          ].join('&') +
          '&display=block';
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.append(link);
      });
    }
    await document.fonts.ready.catch(() => undefined);
    await warmVariableAxes();
  })();
  return fontsPromise;
}

function filteredNames(data: MsCatalog): string[] {
  const group = data.groups[groupIndex] ?? data.groups[0]!;
  const list = data.icons[group] ?? [];
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((name) => name.toLowerCase().includes(q));
}

async function copyName(name: string): Promise<void> {
  const snippet = `<span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="${name}" aria-hidden="true"></span>`;
  try {
    await navigator.clipboard.writeText(snippet);
    await showSnackbar({
      message: t('doc.material-symbols.copied', { name }),
      duration: 2000,
    });
  } catch {
    await showSnackbar({ message: name, duration: 2000 });
  }
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** `arrow_back` → `Arrow Back` */
function formatIconLabel(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cellHtml(name: string): string {
  const n = escAttr(name);
  const label = escHtml(formatIconLabel(name));
  return (
    `<button type="button" class="ms-icon-cell" data-name="${n}" title="${n}" aria-label="${n}">` +
    `<span class="ms-icon-glyph ms notranslate" translate="no" lang="zxx" data-k3-icon="${n}" aria-hidden="true"></span>` +
    `<span class="ms-icon-name">${label}</span></button>`
  );
}

/**
 * Apply FILL / wght / GRAD / opsz to the icon grid only (not style tabs).
 * Sets tokens + inherited `font-variation-settings` (CSS vars alone are flaky
 * with Material Symbols + the playground subset face).
 */
function applyAxesToGrid(grid: HTMLElement): void {
  const family = `'${STYLE_FAMILY[style]}', sans-serif`;
  grid.style.setProperty('--k3-sys-icon-fill', String(fill));
  grid.style.setProperty('--k3-sys-icon-weight', String(wght));
  grid.style.setProperty('--k3-sys-icon-grade', String(grad));
  grid.style.setProperty('--k3-sys-icon-optical-size', String(opsz));
  grid.style.setProperty('--k3-sys-icon-font-family', family);
  grid.style.setProperty('--ms-fill', String(fill));
  grid.style.setProperty('--ms-wght', String(wght));
  grid.style.setProperty('--ms-grad', String(grad));
  grid.style.setProperty('--ms-opsz', String(opsz));
  grid.style.fontFamily = family;
  grid.style.fontWeight = String(wght);
  grid.style.fontVariationSettings = `'FILL' ${fill}, 'wght' ${wght}, 'GRAD' ${grad}, 'opsz' ${opsz}`;
  grid.dataset.style = style;
  grid.dataset.fill = fill ? '1' : '0';
}

function renderChunk(
  grid: HTMLElement,
  names: string[],
  start: number,
  gen: number,
): void {
  if (gen !== renderGen) return;
  const end = Math.min(start + CHUNK, names.length);
  let html = '';
  for (let i = start; i < end; i++) {
    html += cellHtml(names[i]!);
  }
  if (html) grid.insertAdjacentHTML('beforeend', html);
  if (end < names.length) {
    requestAnimationFrame(() => renderChunk(grid, names, end, gen));
  }
}

async function renderGrid(root: HTMLElement, names: string[]): Promise<void> {
  const grid = root.querySelector<HTMLElement>('#ms-icon-grid');
  const empty = root.querySelector<HTMLElement>('#ms-icon-empty');
  const loading = root.querySelector<HTMLElement>('#ms-icon-loading');
  if (!grid || !empty || !loading || !catalog) return;

  const gen = ++renderGen;
  loading.hidden = false;
  empty.hidden = true;
  grid.replaceChildren();
  applyAxesToGrid(grid);

  await ensureVariableFonts();
  if (gen !== renderGen) return;

  loading.hidden = true;
  if (!names.length) {
    empty.hidden = false;
    empty.textContent = t('doc.material-symbols.empty');
    return;
  }
  empty.hidden = true;
  renderChunk(grid, names, 0, gen);
}

function syncChips(root: HTMLElement, data: MsCatalog): void {
  const host = root.querySelector<HTMLElement>('#ms-groups');
  if (!host) return;
  host.replaceChildren();
  data.groups.forEach((group, i) => {
    const chip = document.createElement('k3-chip');
    chip.setAttribute('variant', 'filter');
    chip.value = String(i);
    chip.selected = i === groupIndex;
    chip.textContent = group;
    chip.addEventListener('k3-change', (e) => {
      e.stopPropagation();
      groupIndex = i;
      host.querySelectorAll('k3-chip').forEach((c, j) => {
        (c as HTMLElement & { selected: boolean }).selected = j === groupIndex;
      });
      void refresh(root);
    });
    host.append(chip);
  });
}

function syncFillFab(root: HTMLElement): void {
  const fab = root.querySelector<HTMLElement>('#ms-fill-fab');
  if (!fab) return;
  fab.toggleAttribute('data-fill', fill === 1);
  fab.setAttribute(
    'aria-label',
    t(fill ? 'doc.material-symbols.fill.on' : 'doc.material-symbols.fill.off'),
  );
}

function syncAxisControls(root: HTMLElement): void {
  const setSlider = (id: string, value: number) => {
    const el = root.querySelector<HTMLElement & { value: number }>(id);
    if (el) el.value = value;
  };
  setSlider('#ms-wght', wght);
  setSlider('#ms-grad', grad);
  setSlider('#ms-opsz', opsz);
  syncFillFab(root);
}

function setFill(root: HTMLElement, next: boolean): void {
  fill = next ? 1 : 0;
  syncFillFab(root);
  const grid = root.querySelector<HTMLElement>('#ms-icon-grid');
  if (grid) applyAxesToGrid(grid);
}

function setAxis(
  root: HTMLElement,
  key: 'wght' | 'grad' | 'opsz',
  value: number,
): void {
  if (key === 'wght') wght = value;
  else if (key === 'grad') grad = value;
  else opsz = value;
  const grid = root.querySelector<HTMLElement>('#ms-icon-grid');
  if (grid) applyAxesToGrid(grid);
}

async function refresh(root: HTMLElement): Promise<void> {
  if (!catalog) return;
  syncAxisControls(root);
  await renderGrid(root, filteredNames(catalog));
}

function wireGridDelegation(root: HTMLElement): void {
  if (gridWired) return;
  gridWired = true;
  root.querySelector('#ms-icon-grid')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('.ms-icon-cell');
    const name = btn?.dataset.name;
    if (name) void copyName(name);
  });
}

async function wireControls(root: HTMLElement, data: MsCatalog): Promise<void> {
  await registry.registerAll([
    'k3-text-field',
    'k3-chip',
    'k3-tabs',
    'k3-fab',
    'k3-snackbar',
    'k3-loading-indicator',
    'k3-slider',
  ]);

  syncChips(root, data);
  syncAxisControls(root);
  wireGridDelegation(root);

  const field = root.querySelector<HTMLElement & { value: string; clearable: boolean }>(
    '#ms-search',
  );
  if (field) {
    field.clearable = true;
    field.value = query;
    field.addEventListener('k3-input', ((e: CustomEvent<{ value?: string }>) => {
      query = e.detail?.value ?? '';
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => void refresh(root), 80);
    }) as EventListener);
  }

  const tabs = root.querySelector<HTMLElement & { index: number }>('#ms-style-tabs');
  if (tabs) {
    const idx = STYLES.indexOf(style);
    tabs.index = idx >= 0 ? idx : 1;
    tabs.setAttribute('labels', STYLE_LABEL_KEYS.map((k) => t(k)).join(','));
    tabs.setAttribute('icons', STYLE_ICONS.join(','));
    tabs.setAttribute('variant', 'primary');
    tabs.addEventListener('k3-change', ((e: CustomEvent<{ index?: number }>) => {
      style = STYLES[e.detail?.index ?? 0] ?? 'rounded';
      void refresh(root);
    }) as EventListener);
  }

  root.querySelector('#ms-fill-fab')?.addEventListener('k3-click', () => {
    setFill(root, fill !== 1);
  });

  const bindSlider = (id: string, key: 'wght' | 'grad' | 'opsz') => {
    root.querySelector(id)?.addEventListener('k3-input', ((e: CustomEvent<{ value?: number }>) => {
      const v = Number(e.detail?.value);
      if (Number.isFinite(v)) setAxis(root, key, v);
    }) as EventListener);
    root.querySelector(id)?.addEventListener('k3-change', ((e: CustomEvent<{ value?: number }>) => {
      const v = Number(e.detail?.value);
      if (Number.isFinite(v)) setAxis(root, key, v);
    }) as EventListener);
  };
  bindSlider('#ms-wght', 'wght');
  bindSlider('#ms-grad', 'grad');
  bindSlider('#ms-opsz', 'opsz');
}

/** Prefetch catalog + variable fonts after idle. */
export function prefetchMaterialSymbols(): void {
  void loadCatalog();
  void ensureVariableFonts();
}

/** Mount / refresh the Material Symbols resource page. */
export async function mountMaterialSymbols(): Promise<void> {
  const root = document.getElementById('page-material-symbols');
  if (!root) return;

  const loading = root.querySelector<HTMLElement>('#ms-icon-loading');
  if (loading) loading.hidden = false;

  try {
    const [data] = await Promise.all([loadCatalog(), ensureVariableFonts()]);
    if (!mounted) await wireControls(root, data);
    mounted = true;
    syncChips(root, data);
    await refresh(root);
  } catch (err) {
    console.error(err);
    if (loading) loading.hidden = true;
    const empty = root.querySelector<HTMLElement>('#ms-icon-empty');
    if (empty) {
      empty.hidden = false;
      empty.textContent = t('doc.material-symbols.error');
    }
  }
}
