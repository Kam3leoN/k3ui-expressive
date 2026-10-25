export type MarqueeMode = 'infinite' | 'classic';
export type MarqueeDirection = 'left' | 'right';

export const MarqueeSpecs = {
  mode: 'infinite' as MarqueeMode,
  direction: 'left' as MarqueeDirection,
  duration: 20 as number,
  gap: 80 as number,
  pauseOnHover: false as boolean,
  autoplay: true as boolean,
};

/** Derive animation duration (seconds) from speed (px/s) and track width (px). */
export function durationFromSpeed(trackWidthPx: number, speedPxPerSec: number): number {
  if (speedPxPerSec <= 0 || trackWidthPx <= 0) return MarqueeSpecs.duration;
  return Math.max(0.1, trackWidthPx / speedPxPerSec);
}
