/**
 * AOSP-style single-line text marquee (same behavior as `k3-button-smart`).
 * Track = [label][gap][ghost]; Web Animations API translate; reduced-motion → static.
 */
import { prefersReducedMotion } from '../../core/index.js';
import {
  ButtonSmartMarqueeDelayMs,
  ButtonSmartMarqueeDpPerSecond,
  ButtonSmartMarqueeRestartDelayMs,
} from '../actions/button-smart.specs.js';

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
  const delayMs = opts.delayMs ?? ButtonSmartMarqueeDelayMs;
  const restartDelayMs = opts.restartDelayMs ?? ButtonSmartMarqueeRestartDelayMs;
  const dpPerSecond = opts.dpPerSecond ?? ButtonSmartMarqueeDpPerSecond;
  const minGapPx = opts.minGapPx ?? 24;

  let animation: Animation | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const track =
    () =>
      (marquee.querySelector('.meta-track, .track') as HTMLElement | null);
  const label =
    () =>
      (marquee.querySelector(
        '.meta-label:not(.ghost), .label:not(.ghost)',
      ) as HTMLElement | null);

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
      t.style.removeProperty('--k3-text-marquee-gap');
    }
  };

  const stop = (): void => {
    cancel();
    marquee.classList.remove('scrolling');
    marquee.removeAttribute('data-scrolling');
  };

  const refresh = (): void => {
    if (disposed) return;
    cancel();
    const textEl = label();
    if (!textEl) {
      stop();
      return;
    }

    const containerWidth = marquee.clientWidth;
    const prevMax = textEl.style.maxWidth;
    textEl.style.maxWidth = 'none';
    const textWidth = textEl.scrollWidth;
    textEl.style.maxWidth = prevMax;

    if (containerWidth <= 0 || textWidth <= 0) {
      stop();
      return;
    }

    const overflow = textWidth - containerWidth;
    if (overflow <= 0 || prefersReducedMotion()) {
      stop();
      return;
    }

    marquee.classList.add('scrolling');
    marquee.setAttribute('data-scrolling', '');

    const t = track();
    if (!t) return;

    const gap = Math.max(containerWidth, minGapPx);
    t.style.setProperty('--k3-text-marquee-gap', `${gap}px`);
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
      stop();
    },
  };
}
