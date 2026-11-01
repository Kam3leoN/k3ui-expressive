/**
 * Named cubic-bezier approximations of common Anime.js / CSS easings.
 * Used by animation components (WAAPI — no animejs dependency).
 */
export const easings = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  outBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  inOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
  outCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  inOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
} as const;

export type NamedEasing = keyof typeof easings;
