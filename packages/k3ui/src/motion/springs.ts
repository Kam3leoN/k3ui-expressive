/**
 * Web approximations of M3 Expressive spring tokens.
 *
 * Schemes:
 * - `expressive` — bouncy spatial (default)
 * - `standard` — calmer, little / no overshoot
 * - `fluid` — soft low-stiffness springs; liveliness lives in shape
 *   (stretch / squash / jelly — see `fluid.ts`)
 *
 * Fluid physics + CSS `linear()` sampled from Grenish Expressive
 * (@see https://expressive.grenishrai.pro/docs/motion).
 */

/** Physics params (mass = 1) — source of truth for fluid sampling. */
export const springPhysics = {
  expressive: {
    spatial: {
      fast: { dampingRatio: 0.6, stiffness: 800 },
      default: { dampingRatio: 0.8, stiffness: 380 },
      slow: { dampingRatio: 0.8, stiffness: 200 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
  fluid: {
    spatial: {
      fast: { dampingRatio: 0.78, stiffness: 420 },
      default: { dampingRatio: 0.82, stiffness: 200 },
      slow: { dampingRatio: 0.86, stiffness: 110 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 1400 },
      default: { dampingRatio: 1, stiffness: 700 },
      slow: { dampingRatio: 1, stiffness: 360 },
    },
  },
  standard: {
    spatial: {
      fast: { dampingRatio: 0.9, stiffness: 1400 },
      default: { dampingRatio: 0.9, stiffness: 700 },
      slow: { dampingRatio: 0.9, stiffness: 300 },
    },
    effects: {
      fast: { dampingRatio: 1, stiffness: 3800 },
      default: { dampingRatio: 1, stiffness: 1600 },
      slow: { dampingRatio: 1, stiffness: 800 },
    },
  },
} as const;

export type MotionSchemeName = keyof typeof springPhysics;

/** Duration + CSS easing for WAAPI / transitions. */
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
  /**
   * Soft springs — `linear()` sampled from fluid physics (40 samples).
   * Mild overshoot on spatial (~1–2%); effects critically damped.
   */
  fluid: {
    spatial: {
      fast: {
        durationMs: 405,
        easing:
          'linear(0, 0.0193, 0.0692, 0.1395, 0.2218, 0.3099, 0.3989, 0.4854, 0.5668, 0.6415, 0.7088, 0.7681, 0.8195, 0.8633, 0.9, 0.9302, 0.9546, 0.974, 0.9889, 1.0001, 1.0082, 1.0138, 1.0173, 1.0192, 1.0199, 1.0197, 1.0188, 1.0174, 1.0158, 1.0141, 1.0123, 1.0106, 1.0089, 1.0074, 1.0061, 1.0048, 1.0038, 1.0029, 1.0021, 1.0015, 1)',
      },
      default: {
        durationMs: 610,
        easing:
          'linear(0, 0.0207, 0.0734, 0.1466, 0.2313, 0.3207, 0.41, 0.4958, 0.5756, 0.6483, 0.713, 0.7696, 0.8184, 0.8597, 0.8942, 0.9225, 0.9455, 0.9637, 0.9779, 0.9887, 0.9968, 1.0026, 1.0065, 1.009, 1.0105, 1.011, 1.011, 1.0106, 1.0099, 1.009, 1.008, 1.007, 1.006, 1.0051, 1.0043, 1.0035, 1.0028, 1.0022, 1.0018, 1.0013, 1)',
      },
      slow: {
        durationMs: 836,
        easing:
          'linear(0, 0.0212, 0.0747, 0.1484, 0.2328, 0.3213, 0.4091, 0.4929, 0.5705, 0.6409, 0.7035, 0.7583, 0.8055, 0.8456, 0.8793, 0.9072, 0.9301, 0.9485, 0.9632, 0.9748, 0.9837, 0.9905, 0.9955, 0.9991, 1.0017, 1.0033, 1.0043, 1.0049, 1.005, 1.0049, 1.0047, 1.0043, 1.0039, 1.0034, 1.003, 1.0026, 1.0022, 1.0018, 1.0015, 1.0012, 1)',
      },
    },
    effects: {
      fast: {
        durationMs: 247,
        easing:
          'linear(0, 0.0229, 0.0789, 0.1534, 0.2364, 0.3211, 0.4034, 0.4806, 0.5514, 0.6151, 0.6716, 0.7211, 0.7642, 0.8014, 0.8333, 0.8604, 0.8835, 0.903, 0.9194, 0.9332, 0.9447, 0.9543, 0.9623, 0.9689, 0.9744, 0.979, 0.9828, 0.9859, 0.9884, 0.9905, 0.9923, 0.9937, 0.9948, 0.9958, 0.9966, 0.9972, 0.9977, 0.9981, 0.9985, 0.9988, 1)',
      },
      default: {
        durationMs: 349,
        easing:
          'linear(0, 0.0229, 0.0788, 0.1532, 0.2361, 0.3208, 0.403, 0.4802, 0.5509, 0.6146, 0.6711, 0.7207, 0.7638, 0.801, 0.8329, 0.8601, 0.8832, 0.9027, 0.9191, 0.9329, 0.9445, 0.9541, 0.9621, 0.9688, 0.9743, 0.9789, 0.9827, 0.9858, 0.9884, 0.9905, 0.9922, 0.9936, 0.9948, 0.9958, 0.9965, 0.9972, 0.9977, 0.9981, 0.9985, 0.9988, 1)',
      },
      slow: {
        durationMs: 487,
        easing:
          'linear(0, 0.0229, 0.0789, 0.1534, 0.2363, 0.3211, 0.4033, 0.4806, 0.5513, 0.615, 0.6715, 0.721, 0.7641, 0.8013, 0.8332, 0.8604, 0.8834, 0.9029, 0.9193, 0.9331, 0.9446, 0.9542, 0.9622, 0.9689, 0.9744, 0.979, 0.9827, 0.9858, 0.9884, 0.9905, 0.9922, 0.9937, 0.9948, 0.9958, 0.9966, 0.9972, 0.9977, 0.9981, 0.9985, 0.9988, 1)',
      },
    },
  },
} as const;

export function motionCss(
  scheme: MotionSchemeName = 'expressive',
  kind: 'spatial' | 'effects' = 'spatial',
  speed: 'fast' | 'default' | 'slow' = 'default',
): string {
  const t = springs[scheme][kind][speed];
  return `${t.durationMs}ms ${t.easing}`;
}
