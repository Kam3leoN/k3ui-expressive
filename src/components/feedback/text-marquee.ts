/**
 * AOSP-style single-line text marquee (button-smart · audio-player · …).
 * Track = [label][gap][ghost]; Web Animations API translate; reduced-motion → static.
 */
import { prefersReducedMotion } from '../../core/index.js';
import {
  TextMarqueeDelayMs,
  TextMarqueeDpPerSecond,
  TextMarqueeMinGapPx,
  TextMarqueeRestartDelayMs,
} from './text-marquee.specs.js';

export type TextMarqueeOptions = {
  delayMs?: number;
  restartDelayMs?: number;
  dpPerSecond?: number;
  /** Minimum gap between label and ghost clone (px). */
  minGapPx?: number;
};

export type TextMarqueeHandle = {
  /** Re-measure overflow and (re)start animation. */
  refresh: () => void;
  /** Cancel animation and clear scrolling chrome. */
  stop: () => void;
};

/**
 * Bind an AOSP marquee to a viewport that contains:
 * `.meta-track` > `.meta-label` + `.meta-label.ghost`
 * (or `.track` > `.label` + `.label.ghost` — button-smart names also work).
 */
export function attachTextMarquee(
  marquee: HTMLElement,
  opts: TextMarqueeOptions = {},
): TextMarqueeHandle {
  const delayMs = opts.delayMs ?? TextMarqueeDelayMs;
  const restartDelayMs = opts.restartDelayMs ?? TextMarqueeRestartDelayMs;
  const dpPerSecond = opts.dpPerSecond ?? TextMarqueeDpPerSecond;
  const minGapPx = opts.minGapPx ?? TextMarqueeMinGapPx;

  let animation: Animation | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const track = (): HTMLElement | null =>
    marquee.querySelector('.meta-track, .track');
  const label = (): HTMLElement | null =>
    marquee.querySelector('.meta-label:not(.ghost), .label:not(.ghost)');

  const clearGapVars = (t: HTMLElement): void => {
    t.style.removeProperty('--k3-text-marquee-gap');
    /* Legacy alias used by older button-smart CSS */
    t.style.removeProperty('--k3-button-smart-marquee-gap');
  };

  const cancel = (): void => {
    animation?.cancel();
    animation = null;
    if (restartTimer !== undefined) {
      clearTimeout(restartTimer);
      restartTimer = undefined;
    }
    const t = track();
    if (t) {
      t.style.transform = '';
      clearGapVars(t);
    }
  };

  const clearScrolling = (): void => {
    cancel();
    marquee.classList.remove('scrolling');
    marquee.removeAttribute('data-scrolling');
  };

  const refresh = (): void => {
    if (disposed) return;
    cancel();
    const textEl = label();
    if (!textEl) {
      clearScrolling();
      return;
    }

    const containerWidth = marquee.clientWidth;
    const prevMax = textEl.style.maxWidth;
    textEl.style.maxWidth = 'none';
    const textWidth = textEl.scrollWidth;
    textEl.style.maxWidth = prevMax;

    if (containerWidth <= 0 || textWidth <= 0) {
      clearScrolling();
      return;
    }

    const overflow = textWidth - containerWidth;
    if (overflow <= 0 || prefersReducedMotion()) {
      clearScrolling();
      return;
    }

    marquee.classList.add('scrolling');
    marquee.setAttribute('data-scrolling', '');

    const t = track();
    if (!t) return;

    const gap = Math.max(containerWidth, minGapPx);
    const gapCss = `${gap}px`;
    t.style.setProperty('--k3-text-marquee-gap', gapCss);
    t.style.setProperty('--k3-button-smart-marquee-gap', gapCss);
    void t.offsetWidth;

    const distance = textWidth + gap;
    const durationMs = (distance / dpPerSecond) * 1000;
    const rtl = getComputedStyle(t).direction === 'rtl';
    const shift = rtl ? distance : -distance;

    const play = (): void => {
      if (disposed) return;
      animation = t.animate(
        [{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }],
        {
          delay: delayMs,
          duration: durationMs,
          easing: 'linear',
          fill: 'none',
        },
      );
      animation.onfinish = () => {
        restartTimer = setTimeout(play, restartDelayMs);
      };
    };
    play();
  };

  return {
    refresh,
    stop: () => {
      disposed = true;
      clearScrolling();
    },
  };
}

export {
  TextMarqueeDelayMs,
  TextMarqueeDpPerSecond,
  TextMarqueeMinGapPx,
  TextMarqueeRestartDelayMs,
  TextMarqueeSpecs,
} from './text-marquee.specs.js';
