/**
 * Shared AOSP-style text marquee timing (button-smart · audio-player · …).
 */

/** Delay before first scroll (ms). */
export const TextMarqueeDelayMs = 1200;

/** Pause between loops (ms). */
export const TextMarqueeRestartDelayMs = 1200;

/** Scroll speed (dp/s). */
export const TextMarqueeDpPerSecond = 30;

/** Minimum gap between label and ghost clone (px). */
export const TextMarqueeMinGapPx = 24;

export const TextMarqueeSpecs = {
  delayMs: TextMarqueeDelayMs,
  restartDelayMs: TextMarqueeRestartDelayMs,
  dpPerSecond: TextMarqueeDpPerSecond,
  minGapPx: TextMarqueeMinGapPx,
} as const;
