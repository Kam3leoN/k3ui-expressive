/** Web approximations of M3 Expressive spring tokens. */
export const springs = {
  expressive: {
    spatial: {
      fast: { durationMs: 350, easing: 'cubic-bezier(0.42, 1.67, 0.21, 0.9)' },
      default: { durationMs: 500, easing: 'cubic-bezier(0.38, 1.21, 0.22, 1)' },
      slow: { durationMs: 650, easing: 'cubic-bezier(0.39, 1.29, 0.35, 0.98)' },
    },
    effects: {
      fast: { durationMs: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      default: { durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      slow: { durationMs: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    },
  },
  standard: {
    spatial: {
      fast: { durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      default: { durationMs: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      slow: { durationMs: 400, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    },
    effects: {
      fast: { durationMs: 100, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      default: { durationMs: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
      slow: { durationMs: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    },
  },
} as const;

export function motionCss(
  scheme: 'expressive' | 'standard' = 'expressive',
  kind: 'spatial' | 'effects' = 'spatial',
  speed: 'fast' | 'default' | 'slow' = 'default',
): string {
  const t = springs[scheme][kind][speed];
  return `${t.durationMs}ms ${t.easing}`;
}
