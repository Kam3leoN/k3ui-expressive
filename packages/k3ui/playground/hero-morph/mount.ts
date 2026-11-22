/**
 * Home hero morph art — 3 rotating/morphing Material shapes + centre mark (K).
 * Path morph: Material Morph via RAF (home allowlist only).
 * Spin: CSS transform on a DIV wrapper (not the SVG — avoids compositor freeze).
 */
import {
  MATERIAL_SHAPE_SVG,
  animateMaterialShapeMorph,
  type MaterialShapeName,
} from '../../src/shapes/index.js';
import { pickRandomHomeShape } from '../home-shapes.js';

const LAYERS = ['back', 'mid', 'front'] as const;
type Layer = (typeof LAYERS)[number];

/** Distinct starting shapes so the stack reads as three different forms. */
export const HERO_LAYER_START: Record<Layer, MaterialShapeName> = {
  back: 'VerySunny',
  mid: 'Cookie9Sided',
  front: 'Pill',
};

/** Morph duration per step — staggered so layers drift out of sync. */
const LAYER_MORPH_MS: Record<Layer, number> = {
  back: 4200,
  mid: 3300,
  front: 2700,
};

const HOLD_MS = 280;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.hasAttribute('data-k3-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function morphSvgMarkup(name: MaterialShapeName): string {
  const d = escapeAttr(MATERIAL_SHAPE_SVG[name]);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="home-hero-morph__svg" viewBox="0 0 1 1" aria-hidden="true">
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

function layerSpin(layer: Layer, start: MaterialShapeName): HTMLDivElement {
  const spin = document.createElement('div');
  spin.className = `home-hero-morph__shape home-hero-morph__shape--${layer}`;
  spin.dataset.shape = start;
  spin.innerHTML = morphSvgMarkup(start);
  return spin;
}

let stopMorph: (() => void) | null = null;

function wireMorph(host: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => undefined;

  const shapes = [...host.querySelectorAll<HTMLElement>('.home-hero-morph__shape')];
  const controllers: AbortController[] = [];
  const timers: number[] = [];
  let cancelled = false;

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      const id = window.setTimeout(resolve, ms);
      timers.push(id);
    });

  const runLayer = async (el: HTMLElement, layer: Layer, staggerMs: number): Promise<void> => {
    await wait(staggerMs);
    let current =
      (el.dataset.shape as MaterialShapeName | undefined) ?? HERO_LAYER_START[layer];
    while (!cancelled && !prefersReducedMotion()) {
      const path = el.querySelector<SVGPathElement>('.home-hero-morph__animated');
      if (!path) return;
      const to = pickRandomHomeShape(current);
      const go = new AbortController();
      controllers.push(go);
      await animateMaterialShapeMorph({
        from: current,
        to,
        duration: LAYER_MORPH_MS[layer],
        signal: go.signal,
        onFrame: (d) => path.setAttribute('d', d),
      });
      if (cancelled || go.signal.aborted) return;
      current = to;
      el.dataset.shape = to;
      await wait(HOLD_MS);
    }
  };

  shapes.forEach((el, i) => {
    const layer = (LAYERS[i] ?? 'front') as Layer;
    void runLayer(el, layer, 120 + i * 220);
  });

  return () => {
    cancelled = true;
    for (const id of timers) window.clearTimeout(id);
    for (const c of controllers) c.abort();
  };
}

/** Mount morphing 3-shape stack into `#home-hero-morph` (idempotent). */
export function mountHomeHeroMorph(): void {
  const host = document.getElementById('home-hero-morph');
  if (!host || host.childElementCount) return;

  stopMorph?.();
  const layers = LAYERS.map((layer) => layerSpin(layer, HERO_LAYER_START[layer]));
  host.replaceChildren(...layers, centreMark());
  stopMorph = wireMorph(host);
}
