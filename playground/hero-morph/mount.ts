/**
 * Home hero morph art — 3 rotating/morphing Material shapes + centre mark (K).
 * Path morph: CSS `d: path()` keyframes (starts on first paint).
 * Spin: CSS transform on a DIV wrapper (not the SVG — avoids compositor freeze).
 * Recipe / path data adapted from noph.dev hero.
 */
import { HERO_MORPH, type HeroMorphLayer } from './data.js';

const STYLE_ID = 'home-hero-morph-keyframes';
const LAYERS = ['back', 'mid', 'front'] as const;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeCssPath(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function keyframesCss(name: string, data: HeroMorphLayer): string {
  const frames = data.values.split(';');
  const times = data.keyTimes.split(';').map(Number);
  const steps = frames
    .map((d, i) => {
      const t = times[i] ?? i / Math.max(1, frames.length - 1);
      const pct = `${(t * 100).toFixed(4).replace(/\.?0+$/, '')}%`;
      return `  ${pct} { d: path("${escapeCssPath(d)}"); }`;
    })
    .join('\n');
  return `@keyframes ${name} {\n${steps}\n}`;
}

function ensureMorphStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const parts: string[] = [
    `/* Hero morph — CSS d animation (instant start; SMIL begin=0s misses late inject). */`,
  ];
  for (const layer of LAYERS) {
    const data = HERO_MORPH[layer];
    const kf = `home-hero-morph-d-${layer}`;
    parts.push(keyframesCss(kf, data));
    parts.push(`.home-hero-morph__shape--${layer} .home-hero-morph__animated {
  animation: ${kf} ${data.dur} cubic-bezier(0.4, 0, 0.2, 1) infinite;
}`);
  }
  parts.push(`@media (prefers-reduced-motion: reduce) {
  .home-hero-morph__animated { animation: none !important; }
}
html[data-k3-reduce-motion] .home-hero-morph__animated { animation: none !important; }`);

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = parts.join('\n');
  document.head.append(style);
}

function morphSvgMarkup(data: HeroMorphLayer): string {
  const d = escapeAttr(data.still);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="home-hero-morph__svg" viewBox="0 0 48 48" aria-hidden="true">
  <path class="home-hero-morph__animated" fill="currentColor" d="${d}" />
  <path class="home-hero-morph__still" fill="currentColor" d="${d}" />
</svg>`;
}

function centreMark(): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'home-hero-morph__mark';
  wrap.innerHTML = `<span class="home-hero-morph__k" aria-hidden="true">K</span>`;
  return wrap;
}

function layerSpin(layer: (typeof LAYERS)[number], data: HeroMorphLayer): HTMLDivElement {
  const spin = document.createElement('div');
  spin.className = `home-hero-morph__shape home-hero-morph__shape--${layer}`;
  spin.innerHTML = morphSvgMarkup(data);
  return spin;
}

/** Mount morphing 3-shape stack into `#home-hero-morph` (idempotent). */
export function mountHomeHeroMorph(): void {
  const host = document.getElementById('home-hero-morph');
  if (!host || host.childElementCount) return;

  ensureMorphStyles();
  const layers = LAYERS.map((layer) => layerSpin(layer, HERO_MORPH[layer]));
  host.replaceChildren(...layers, centreMark());
}
