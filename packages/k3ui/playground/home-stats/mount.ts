/**
 * Home stats banner — connected card grid with spinning Material shapes
 * and count-up values on first paint (home allowlist shapes).
 */
import { catalog as k3uiCatalog } from '../../src/registry/catalog.js';
import { registry } from '../../src/registry/register.js';
import {
  MATERIAL_SHAPE_SVG,
  type MaterialShapeName,
} from '../../src/shapes/index.js';
import { pickRandomHomeShape } from '../home-shapes.js';

export type HomeStatTone = 'primary' | 'tertiary' | 'secondary' | 'container';

export type HomeStatDef = {
  id: string;
  shape: MaterialShapeName;
  tone: HomeStatTone;
  value: string;
  /** Numeric target for count-up; omit for static copy. */
  countTo?: number;
  valueClass?: 'home-stat__value--text' | 'home-stat__value--stack';
  labelKey: string;
};

const COUNT_MS = 1100;
const COLUMNS_DESKTOP = 4;
const COLUMNS_NARROW = 1;
const NARROW_MQ = '(width < 600px)';

function t(key: string): string {
  return window.K3UI?.i18n.t(key) ?? key;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Stack lines — keep "No ads" / "No ADS" together. */
function stackLines(value: string): string[] {
  const parts = value.trim().split(/\s+/);
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i]!;
    const next = parts[i + 1];
    if (/^no$/i.test(cur) && next && /^(ads|ad)$/i.test(next)) {
      lines.push(`${cur} ${next}`);
      i++;
      continue;
    }
    lines.push(cur);
  }
  return lines;
}

/** Render one stack line — split `100%` so the % is half-size / unbolded. */
function stackLineHtml(line: string): string {
  const m = line.match(/^(\d+)(%)$/);
  if (m) {
    return `<span class="home-stat__line home-stat__line--num">${escapeHtml(m[1]!)}<span class="home-stat__percent">${escapeHtml(m[2]!)}</span></span>`;
  }
  return `<span class="home-stat__line">${escapeHtml(line)}</span>`;
}

export async function resolveHomeStatCounts(): Promise<{ k3ui: number; k3ux: number }> {
  const k3ui = k3uiCatalog.length;
  try {
    /* Empty module without ../k3ux (k3uxOptional) → no catalog → 0. */
    const ux = (await import('@k3ux/registry/catalog.js')) as { catalog?: unknown[] };
    return { k3ui, k3ux: ux.catalog?.length ?? 0 };
  } catch {
    return { k3ui, k3ux: 0 };
  }
}

export function buildHomeStatDefs(counts: { k3ui: number; k3ux: number }): HomeStatDef[] {
  return [
    {
      id: 'k3ui',
      shape: 'VerySunny',
      tone: 'primary',
      value: String(counts.k3ui),
      countTo: counts.k3ui,
      labelKey: 'playground.home.stats.k3ui',
    },
    {
      id: 'k3ux',
      shape: 'Cookie4Sided',
      tone: 'tertiary',
      value: String(counts.k3ux),
      countTo: counts.k3ux,
      labelKey: 'playground.home.stats.k3ux',
    },
    {
      id: 'oss',
      shape: 'Pill',
      tone: 'secondary',
      value: t('playground.home.stats.openSource'),
      valueClass: 'home-stat__value--text',
      labelKey: 'playground.home.stats.openSourceLabel',
    },
    {
      id: 'free',
      shape: 'SoftBurst',
      tone: 'container',
      value: t('playground.home.stats.free'),
      valueClass: 'home-stat__value--stack',
      labelKey: 'playground.home.stats.freeLabel',
    },
  ];
}

/** Pick a random home-allowlisted shape different from `exclude`. */
export function pickRandomShape(exclude: MaterialShapeName): MaterialShapeName {
  return pickRandomHomeShape(exclude);
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.hasAttribute('data-k3-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Ease-out cubic count-up (0 → to). */
export function animateCountUp(
  el: HTMLElement,
  to: number,
  opts: { duration?: number; signal?: AbortSignal } = {},
): Promise<void> {
  const duration = opts.duration ?? COUNT_MS;
  const signal = opts.signal;
  const target = Math.max(0, Math.round(to));

  if (prefersReducedMotion() || duration <= 0 || target === 0) {
    el.textContent = String(target);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();
    let raf = 0;

    const finish = (): void => {
      if (raf) cancelAnimationFrame(raf);
      el.textContent = String(target);
      resolve();
    };

    if (signal?.aborted) {
      finish();
      return;
    }
    signal?.addEventListener('abort', finish, { once: true });

    const tick = (now: number): void => {
      if (signal?.aborted) return;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
  });
}

function shapeMarkup(name: MaterialShapeName): string {
  return `<div class="home-stat__spin" aria-hidden="true">
  <svg class="home-stat__svg" viewBox="0 0 1 1" focusable="false">
    <path class="home-stat__path" d="${MATERIAL_SHAPE_SVG[name]}" />
  </svg>
</div>`;
}

function valueMarkup(def: HomeStatDef): string {
  const valueClass = ['home-stat__value', def.valueClass].filter(Boolean).join(' ');
  if (def.countTo != null) {
    const start = prefersReducedMotion() ? String(def.countTo) : '0';
    return `<span class="${valueClass}" data-home-stat-count="${def.countTo}">${start}</span>`;
  }
  if (def.valueClass === 'home-stat__value--stack') {
    return `<span class="${valueClass}">${stackLines(def.value).map(stackLineHtml).join('')}</span>`;
  }
  return `<span class="${valueClass}">${escapeHtml(def.value)}</span>`;
}

function cardMarkup(def: HomeStatDef): string {
  return `<k3-card variant="filled" class="home-stat-card" data-stat="${escapeHtml(def.id)}">
  <div class="home-stat" data-stat="${escapeHtml(def.id)}">
    <div
      class="home-stat__blob home-stat__blob--${def.tone}"
      data-shape="${def.shape}"
      aria-hidden="true"
    >
      ${shapeMarkup(def.shape)}
    </div>
    <div class="home-stat__copy">
      ${valueMarkup(def)}
      <p class="home-stat__label" data-i18n="${escapeHtml(def.labelKey)}">${escapeHtml(t(def.labelKey))}</p>
    </div>
  </div>
</k3-card>`;
}

function wireColumns(set: HTMLElement & { columns?: number }): () => void {
  const mq = window.matchMedia(NARROW_MQ);
  const sync = (): void => {
    set.columns = mq.matches ? COLUMNS_NARROW : COLUMNS_DESKTOP;
  };
  sync();
  mq.addEventListener('change', sync);
  return () => mq.removeEventListener('change', sync);
}

function wireCountUp(host: HTMLElement): () => void {
  const go = new AbortController();
  const nodes = [
    ...host.querySelectorAll<HTMLElement>('[data-home-stat-count]'),
  ];
  for (const el of nodes) {
    const to = Number(el.dataset.homeStatCount);
    if (!Number.isFinite(to)) continue;
    void animateCountUp(el, to, { signal: go.signal });
  }
  return () => go.abort();
}

let stopColumns: (() => void) | null = null;
let stopCount: (() => void) | null = null;

export async function mountHomeStats(): Promise<void> {
  const host = document.getElementById('home-stats');
  if (!host) return;

  stopColumns?.();
  stopColumns = null;
  stopCount?.();
  stopCount = null;

  await registry.register('k3-card-set');

  const counts = await resolveHomeStatCounts();
  const defs = buildHomeStatDefs(counts);
  const title =
    host.querySelector('#home-stats-title') ??
    (() => {
      const h = document.createElement('h2');
      h.id = 'home-stats-title';
      h.className = 'visually-hidden';
      h.setAttribute('data-i18n', 'playground.home.stats.title');
      h.textContent = t('playground.home.stats.title');
      return h;
    })();
  title.textContent = t('playground.home.stats.title');

  const set = document.createElement('k3-card-set') as HTMLElement & {
    variant: string;
    layout: string;
    columns: number;
    label: string;
  };
  set.className = 'home-stats__set';
  set.setAttribute('variant', 'connected');
  set.setAttribute('layout', 'grid');
  set.setAttribute('columns', String(COLUMNS_DESKTOP));
  set.variant = 'connected';
  set.layout = 'grid';
  set.columns = COLUMNS_DESKTOP;
  set.label = t('playground.home.stats.title');
  set.innerHTML = defs.map(cardMarkup).join('');

  host.replaceChildren(title, set);
  host.classList.add('home-stats--ready');

  stopColumns = wireColumns(set);
  stopCount = wireCountUp(host);
}

export function syncHomeStatsI18n(): void {
  const host = document.getElementById('home-stats');
  if (!host?.classList.contains('home-stats--ready')) return;
  const counts = {
    k3ui:
      Number(
        host.querySelector('[data-stat="k3ui"] [data-home-stat-count]')?.getAttribute(
          'data-home-stat-count',
        ),
      ) ||
      Number(host.querySelector('[data-stat="k3ui"] .home-stat__value')?.textContent?.trim()) ||
      k3uiCatalog.length,
    k3ux:
      Number(
        host.querySelector('[data-stat="k3ux"] [data-home-stat-count]')?.getAttribute(
          'data-home-stat-count',
        ),
      ) ||
      Number(host.querySelector('[data-stat="k3ux"] .home-stat__value')?.textContent?.trim()) ||
      0,
  };
  const defs = buildHomeStatDefs(counts);
  const set = host.querySelector('k3-card-set') as (HTMLElement & { label?: string }) | null;
  if (set) set.label = t('playground.home.stats.title');
  const title = host.querySelector('#home-stats-title');
  if (title) title.textContent = t('playground.home.stats.title');

  for (const def of defs) {
    const root = host.querySelector(`[data-stat="${def.id}"]`);
    if (!root) continue;
    const value = root.querySelector('.home-stat__value');
    const label = root.querySelector('.home-stat__label');
    if (label) {
      label.setAttribute('data-i18n', def.labelKey);
      label.textContent = t(def.labelKey);
    }
    if (!value || def.id === 'k3ui' || def.id === 'k3ux') continue;
    if (def.valueClass === 'home-stat__value--stack') {
      value.innerHTML = stackLines(def.value).map(stackLineHtml).join('');
    } else {
      value.textContent = def.value;
    }
  }
}
