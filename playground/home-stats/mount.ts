/**
 * Home stats banner — Trainable-style Material shape counters
 * (VerySunny · Cookie4Sided · Pill · SoftBurst).
 */
import { catalog as k3uiCatalog } from '../../src/registry/catalog.js';
import {
  MATERIAL_SHAPE_SVG,
  animateMaterialShapeMorph,
  type MaterialShapeName,
} from '../../src/shapes/index.js';

export type HomeStatTone = 'primary' | 'tertiary' | 'secondary' | 'container';

export type HomeStatDef = {
  id: string;
  shape: MaterialShapeName;
  morph: MaterialShapeName;
  tone: HomeStatTone;
  value: string;
  valueClass?: 'home-stat__value--text' | 'home-stat__value--stack';
  labelKey: string;
};

const MORPH_MS = 800;
const HOLD_MS = 2200;

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

export async function resolveHomeStatCounts(): Promise<{ k3ui: number; k3ux: number }> {
  const k3ui = k3uiCatalog.length;
  try {
    const ux = await import('../../../k3ux/src/registry/catalog.js');
    return { k3ui, k3ux: ux.catalog.length };
  } catch {
    return { k3ui, k3ux: 0 };
  }
}

export function buildHomeStatDefs(counts: { k3ui: number; k3ux: number }): HomeStatDef[] {
  return [
    {
      id: 'k3ui',
      shape: 'VerySunny',
      morph: 'Sunny',
      tone: 'primary',
      value: String(counts.k3ui),
      labelKey: 'playground.home.stats.k3ui',
    },
    {
      id: 'k3ux',
      shape: 'Cookie4Sided',
      morph: 'Flower',
      tone: 'tertiary',
      value: String(counts.k3ux),
      labelKey: 'playground.home.stats.k3ux',
    },
    {
      id: 'oss',
      shape: 'Pill',
      morph: 'Pentagon',
      tone: 'secondary',
      value: t('playground.home.stats.openSource'),
      valueClass: 'home-stat__value--text',
      labelKey: 'playground.home.stats.openSourceLabel',
    },
    {
      id: 'free',
      shape: 'SoftBurst',
      morph: 'Cookie9Sided',
      tone: 'container',
      value: t('playground.home.stats.free'),
      valueClass: 'home-stat__value--stack',
      labelKey: 'playground.home.stats.freeLabel',
    },
  ];
}

function shapeMarkup(name: MaterialShapeName): string {
  return `<svg class="home-stat__svg" viewBox="0 0 1 1" aria-hidden="true" focusable="false">
  <path class="home-stat__path" d="${MATERIAL_SHAPE_SVG[name]}" />
</svg>`;
}

function statMarkup(def: HomeStatDef): string {
  const valueClass = ['home-stat__value', def.valueClass].filter(Boolean).join(' ');
  const valueHtml =
    def.valueClass === 'home-stat__value--stack'
      ? stackLines(def.value)
          .map((w) => `<span class="home-stat__line">${escapeHtml(w)}</span>`)
          .join('')
      : escapeHtml(def.value);
  return `<div class="home-stat" data-stat="${escapeHtml(def.id)}">
  <div class="home-stat__shape home-stat__shape--${def.tone}" data-shape="${def.shape}" data-morph="${def.morph}">
    ${shapeMarkup(def.shape)}
    <span class="${valueClass}">${valueHtml}</span>
  </div>
  <p class="home-stat__label" data-i18n="${escapeHtml(def.labelKey)}">${escapeHtml(t(def.labelKey))}</p>
</div>`;
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.hasAttribute('data-k3-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function wireMorph(host: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => undefined;
  const shapes = [...host.querySelectorAll('.home-stat__shape')];
  const controllers = [];
  let cancelled = false;
  let timer = 0;

  const runCycle = async () => {
    if (cancelled || prefersReducedMotion()) return;
    for (const el of shapes) {
      if (cancelled) return;
      const from = el.dataset.shape;
      const to = el.dataset.morph;
      const path = el.querySelector('.home-stat__path');
      if (!from || !to || !path) continue;
      const go = new AbortController();
      controllers.push(go);
      await animateMaterialShapeMorph({
        from,
        to,
        duration: MORPH_MS,
        signal: go.signal,
        onFrame: (d) => path.setAttribute('d', d),
      });
      if (cancelled) return;
      await new Promise((r) => {
        timer = window.setTimeout(r, HOLD_MS / 2);
      });
      if (cancelled) return;
      const back = new AbortController();
      controllers.push(back);
      await animateMaterialShapeMorph({
        from: to,
        to: from,
        duration: MORPH_MS,
        signal: back.signal,
        onFrame: (d) => path.setAttribute('d', d),
      });
      if (cancelled) return;
      await new Promise((r) => {
        timer = window.setTimeout(r, HOLD_MS);
      });
    }
    if (!cancelled) void runCycle();
  };

  timer = window.setTimeout(() => void runCycle(), 1200);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    for (const c of controllers) c.abort();
  };
}

let stopMorph = null;

export async function mountHomeStats() {
  const host = document.getElementById('home-stats');
  if (!host) return;
  stopMorph?.();
  stopMorph = null;
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
  host.replaceChildren(
    title,
    ...defs.map((def) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = statMarkup(def);
      return wrap.firstElementChild;
    }),
  );
  host.classList.add('home-stats--ready');
  stopMorph = wireMorph(host);
}

export function syncHomeStatsI18n() {
  const host = document.getElementById('home-stats');
  if (!host?.classList.contains('home-stats--ready')) return;
  const counts = {
    k3ui: host.querySelector('[data-stat="k3ui"] .home-stat__value')?.textContent?.trim() || '',
    k3ux: host.querySelector('[data-stat="k3ux"] .home-stat__value')?.textContent?.trim() || '',
  };
  const defs = buildHomeStatDefs({
    k3ui: Number(counts.k3ui) || k3uiCatalog.length,
    k3ux: Number(counts.k3ux) || 0,
  });
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
      value.innerHTML = stackLines(def.value)
        .map((w) => `<span class="home-stat__line">${escapeHtml(w)}</span>`)
        .join('');
    } else {
      value.textContent = def.value;
    }
  }
}
