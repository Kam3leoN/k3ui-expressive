/**
 * Home footer CTA — Trainable-style primary-container card
 * with Material shape blobs + live GitHub star count.
 */
import {
  MATERIAL_SHAPE_SVG,
  type MaterialShapeName,
} from '../../src/shapes/index.js';

const REPO = 'Kam3leoN/k3ui-expressive';
const STARS_CACHE_KEY = 'k3ui.gh.stars.v1';
const STARS_TTL_MS = 1000 * 60 * 60; // 1h

const BLOBS: { name: MaterialShapeName; slot: 'a' | 'b' }[] = [
  { name: 'Sunny', slot: 'a' },
  { name: 'Flower', slot: 'b' },
];

function t(key: string): string {
  return window.K3UI?.i18n.t(key) ?? key;
}

function blobMarkup(name: MaterialShapeName, slot: string): string {
  return `<div class="home-lift-cta__blob home-lift-cta__blob--${slot}" data-shape="${name}">
  <div class="home-lift-cta__spin">
    <svg class="home-lift-cta__shape" viewBox="0 0 1 1" aria-hidden="true" focusable="false">
      <path d="${MATERIAL_SHAPE_SVG[name]}" />
    </svg>
  </div>
</div>`;
}

function readCachedStars(): number | null {
  try {
    const raw = sessionStorage.getItem(STARS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { n: number; at: number };
    if (!Number.isFinite(parsed.n) || Date.now() - parsed.at > STARS_TTL_MS) return null;
    return parsed.n;
  } catch {
    return null;
  }
}

function writeCachedStars(n: number): void {
  try {
    sessionStorage.setItem(STARS_CACHE_KEY, JSON.stringify({ n, at: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

function starBaseLabel(btnLabel: HTMLElement): string {
  const translated = t('playground.home.lift.star');
  if (translated !== 'playground.home.lift.star') return translated;
  return (
    (btnLabel.textContent ?? 'Star on GitHub').replace(/\s·\s*\d+\s*$/, '').trim() ||
    'Star on GitHub'
  );
}

function paintStars(host: HTMLElement, count: number | null): void {
  const label = host.querySelector<HTMLElement>('[data-home-lift-stars]');
  const btnLabel = host.querySelector<HTMLElement>('[data-home-lift-star-label]');
  if (!label || !btnLabel) return;
  const base = starBaseLabel(btnLabel);
  if (count == null || count < 0) {
    label.hidden = true;
    label.textContent = '';
    btnLabel.textContent = base;
    return;
  }
  label.hidden = false;
  label.textContent = String(count);
  btnLabel.textContent = `${base} · ${count}`;
}

export async function fetchGithubStars(): Promise<number | null> {
  const cached = readCachedStars();
  if (cached != null) return cached;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    const n = Number(data.stargazers_count);
    if (!Number.isFinite(n)) return null;
    writeCachedStars(n);
    return n;
  } catch {
    return null;
  }
}

function mountBlobs(host: HTMLElement): void {
  const layer = host.querySelector('.home-lift-cta__blobs');
  if (!layer || layer.childElementCount) return;
  layer.innerHTML = BLOBS.map(({ name, slot }) => blobMarkup(name, slot)).join('');
}

export async function mountHomeLiftCta(): Promise<void> {
  const host = document.getElementById('home-lift-cta');
  if (!host) return;
  mountBlobs(host);
  paintStars(host, readCachedStars());
  const count = await fetchGithubStars();
  paintStars(host, count);
}

export function syncHomeLiftCtaI18n(): void {
  const host = document.getElementById('home-lift-cta');
  if (!host) return;
  const title = host.querySelector('[data-i18n="playground.home.lift.title"]');
  const lead = host.querySelector('[data-i18n="playground.home.lift.lead"]');
  if (title) title.textContent = t('playground.home.lift.title');
  if (lead) lead.textContent = t('playground.home.lift.lead');
  for (const key of ['playground.home.lift.start', 'playground.home.lift.pack'] as const) {
    const el = host.querySelector(`[data-i18n="${key}"]`);
    if (el) el.textContent = t(key);
  }
  paintStars(host, readCachedStars());
}
