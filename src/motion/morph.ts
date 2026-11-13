import { allowsExpressiveMotion } from '../core/lifecycle.js';

/** Parse a CSS motion token like `500ms cubic-bezier(...)`. */
export function parseMotionToken(token: string): { duration: number; easing: string } {
  const [time, ...rest] = token.trim().split(/\s+/);
  const value = Number.parseFloat(time);
  const easing = rest.join(' ');
  return {
    duration: Number.isNaN(value) ? 0 : time.endsWith('ms') ? value : value * 1000,
    easing: easing || 'linear',
  };
}

/** True when Web Animations API is usable (false in jsdom). */
export function canWebAnimate(element: Element): boolean {
  return (
    typeof (element as Element & { getAnimations?: unknown }).getAnimations === 'function' &&
    typeof (element as HTMLElement).animate === 'function'
  );
}

/** Spatial-default duration + expressive spatial easing from an element's theme tokens. */
export function spatialDefaultTiming(element: Element): {
  duration: number;
  easing: string;
} {
  const style = getComputedStyle(element);
  const durationTok =
    style.getPropertyValue('--k3-sys-motion-duration-spatial-default').trim() || '500ms';
  const easing =
    style.getPropertyValue('--k3-sys-motion-easing-expressive-spatial').trim() ||
    style.getPropertyValue('--k3-sys-motion-easing-spatial').trim() ||
    'cubic-bezier(0.38, 1.21, 0.22, 1)';
  return {
    duration: parseMotionToken(durationTok).duration,
    easing,
  };
}

/** Spatial-fast — dial face enter/leave (snappier than panel morph). */
export function spatialFastTiming(element: Element): {
  duration: number;
  easing: string;
} {
  const style = getComputedStyle(element);
  const durationTok =
    style.getPropertyValue('--k3-sys-motion-duration-spatial-fast').trim() || '350ms';
  const easing =
    style.getPropertyValue('--k3-sys-motion-easing-expressive-spatial-fast').trim() ||
    style.getPropertyValue('--k3-sys-motion-easing-spatial-fast').trim() ||
    style.getPropertyValue('--k3-sys-motion-easing-expressive-spatial').trim() ||
    'cubic-bezier(0.42, 1.67, 0.21, 0.9)';
  return {
    duration: parseMotionToken(durationTok).duration,
    easing,
  };
}

/**
 * Morph width/height around a DOM update (Noph `morphSize`).
 * `apply` must flush layout (e.g. Lit `await updateComplete`) before returning.
 * No-ops the animation when WAAPI is missing (unit tests) or reduced motion.
 */
export async function morphSize(
  element: HTMLElement | null | undefined,
  apply: () => void | Promise<void>,
): Promise<void> {
  if (!element || !allowsExpressiveMotion() || !canWebAnimate(element)) {
    await apply();
    return;
  }
  const from = element.getBoundingClientRect();
  element.getAnimations().forEach((a) => a.cancel());
  await apply();
  const to = element.getBoundingClientRect();
  if (from.width === to.width && from.height === to.height) return;

  const frame = (rect: DOMRect): Keyframe => ({
    ...(from.width !== to.width ? { width: `${rect.width}px` } : {}),
    ...(from.height !== to.height ? { height: `${rect.height}px` } : {}),
  });
  const { duration, easing } = spatialDefaultTiming(element);
  if (duration <= 0) return;

  element.style.overflow = 'hidden';
  try {
    await element.animate([frame(from), frame(to)], { duration, easing }).finished;
  } catch {
    /* cancelled */
  } finally {
    element.style.removeProperty('overflow');
  }
}
