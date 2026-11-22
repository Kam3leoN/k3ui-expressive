/** Defaults — CodePen eehayman/qdGZJr (full-page parallax scroll). */
export const ParallaxSpecs = {
  /** Wheel delta threshold before a slide change (higher = less sensitive). */
  sensitivity: 30,
  /** Lock duration after a slide change (ms). */
  lockMs: 600,
  /** Wheel listener throttle (ms). */
  throttleMs: 60,
  /** Background translate offset (CSS length). */
  parallaxOffset: '30vh',
  /** Content translate when parked off-screen (CSS length). */
  contentOffset: '40vh',
  /** Slide transition duration. */
  transitionMs: 1200,
  /** Content transition duration (CodePen: transition + 0.5s). */
  contentTransitionMs: 1700,
  /** Dark overlay opacity over backgrounds (0–1). */
  overlay: 0.3,
  /** Easing from the original pen. */
  easing: 'cubic-bezier(0.22, 0.44, 0, 1)',
  accessibility: {
    role: 'region',
  },
  behaviors: {
    disableForReducedMotion: true,
  },
} as const;
