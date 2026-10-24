/**
 * Standard button-group press morph — pure layout math.
 *
 * Mirrors Compose `ButtonGroup` + `animateWidth(compressionLimit)`:
 * pressed shell grows by `expandedRatio`, stolen only from immediate neighbors.
 * Shell width only — never mutates padding, font, or icon size.
 *
 * @see ./button-group.specs.ts
 * @see https://developer.android.com/reference/kotlin/androidx/compose/material3/ButtonGroupScope
 */

import { ButtonGroupSpecs } from './button-group.specs.js';

/** Tag name that participates in width morph (`k3-icon-button` stays square). */
export const BUTTON_GROUP_WIDTH_MORPH_TAG = 'k3-button';

export function isButtonGroupWidthMorphable(el: Element): boolean {
  return el.localName === BUTTON_GROUP_WIDTH_MORPH_TAG;
}

/** Parse `12px` / `0.75rem` / bare number → CSS px (16px rem root). */
export function parseCssLengthPx(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (t.endsWith('rem')) return n * 16;
  return n;
}

/**
 * Compose `compressionLimit` — one side’s content padding on the painted surface.
 */
export function readCompressionLimitPx(
  el: HTMLElement,
  fallbackDp = ButtonGroupSpecs.compressionLimitFallbackDp,
): number {
  const inner = el.shadowRoot?.querySelector('button');
  if (inner) {
    const pad = parseFloat(getComputedStyle(inner).paddingInlineStart);
    if (Number.isFinite(pad) && pad > 0) return pad;
  }
  for (const prop of ['--k3-btn-pad-inline', '--k3-ib-pad-inline'] as const) {
    const px = parseCssLengthPx(getComputedStyle(el).getPropertyValue(prop));
    if (px != null) return px;
  }
  return fallbackDp;
}

export type PressWidthPlan = {
  /** Target widths for every child index (rest widths for untouched). */
  widths: number[];
  /** Indices whose shell width changes (pressed + neighbors that gave space). */
  touched: number[];
};

/**
 * Compute pressed / neighbor shell widths.
 * Returns `null` when morph does not apply (need ≥2 children, morphable press).
 */
export function planPressWidths(opts: {
  restWidths: readonly number[];
  pressedIdx: number;
  /** Per-child max steal (0 = not morphable / cannot give). */
  compressionLimits: readonly number[];
  expandedRatio?: number;
}): PressWidthPlan | null {
  const {
    restWidths,
    pressedIdx,
    compressionLimits,
    expandedRatio = ButtonGroupSpecs.expandedRatio,
  } = opts;
  const n = restWidths.length;
  if (n < 2 || pressedIdx < 0 || pressedIdx >= n) return null;

  const widths = restWidths.map((w) => w);
  const last = n - 1;
  const touched = new Set<number>([pressedIdx]);

  const take = (idx: number, want: number): number => {
    const lim = compressionLimits[idx] ?? 0;
    if (lim <= 0) return 0;
    const capped = Math.min(want, lim, widths[idx]!);
    if (capped <= 0) return 0;
    widths[idx]! -= capped;
    touched.add(idx);
    return capped;
  };

  let growth = 0;
  if (pressedIdx > 0 && pressedIdx < last) {
    const left = pressedIdx - 1;
    const right = pressedIdx + 1;
    const perSide = Math.min(
      (expandedRatio * widths[pressedIdx]!) / 2,
      compressionLimits[left] ?? 0,
      compressionLimits[right] ?? 0,
      widths[left]!,
      widths[right]!,
    );
    if (perSide > 0) {
      widths[left]! -= perSide;
      widths[right]! -= perSide;
      touched.add(left);
      touched.add(right);
      growth = perSide * 2;
    }
  } else if (pressedIdx === 0) {
    growth = take(1, expandedRatio * widths[0]!);
  } else {
    growth = take(last - 1, expandedRatio * widths[last]!);
  }

  widths[pressedIdx]! += growth;
  return { widths, touched: [...touched] };
}

/** Pin the flex row so the page does not reflow while shells morph. */
export function measureGroupPinnedWidthPx(
  restWidths: readonly number[],
  gapPx: number,
): number {
  const gaps = Math.max(0, restWidths.length - 1) * gapPx;
  return restWidths.reduce((a, w) => a + w, 0) + gaps;
}
