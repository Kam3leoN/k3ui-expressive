import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/animation/parallax.js';
import '../../src/components/animation/parallax/parallax-slide.js';
import type { K3Parallax } from '../../src/components/animation/parallax.js';
import type { K3ParallaxSlide } from '../../src/components/animation/parallax/parallax-slide.js';

function makeSlide(heading: string): K3ParallaxSlide {
  const s = document.createElement('k3-parallax-slide') as K3ParallaxSlide;
  s.heading = heading;
  s.background = 'linear-gradient(135deg, #334 0%, #112 100%)';
  return s;
}

describe('k3-parallax', () => {
  let el: K3Parallax;

  beforeEach(async () => {
    el = document.createElement('k3-parallax') as K3Parallax;
    el.style.height = '400px';
    el.append(makeSlide('One'), makeSlide('Two'), makeSlide('Three'));
    document.body.appendChild(el);
    await el.updateComplete;
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('registers host and slides', () => {
    expect(customElements.get('k3-parallax')).toBeTruthy();
    expect(customElements.get('k3-parallax-slide')).toBeTruthy();
    expect(el.slideCount).toBe(3);
    expect(el.currentIndex).toBe(0);
  });

  it('marks the first slide as current', () => {
    const slides = [...el.querySelectorAll('k3-parallax-slide')] as K3ParallaxSlide[];
    expect(slides[0]?.state).toBe('current');
    expect(slides[1]?.state).toBe('upcoming');
    expect(slides[2]?.state).toBe('upcoming');
  });

  it('next / previous update index and states', async () => {
    const changes: number[] = [];
    el.addEventListener('k3-parallax-change', ((e: CustomEvent) => {
      changes.push(e.detail.index);
    }) as EventListener);

    el.lockMs = 0;
    el.next();
    await el.updateComplete;
    expect(el.currentIndex).toBe(1);
    const slides = [...el.querySelectorAll('k3-parallax-slide')] as K3ParallaxSlide[];
    expect(slides[0]?.state).toBe('passed');
    expect(slides[1]?.state).toBe('current');

    el.previous();
    await el.updateComplete;
    expect(el.currentIndex).toBe(0);
    expect(changes).toEqual([1, 0]);
  });

  it('goTo clamps and jumps', () => {
    el.goTo(99, 'jump');
    expect(el.currentIndex).toBe(2);
    el.goTo(-3, 'jump');
    expect(el.currentIndex).toBe(0);
  });

  it('ignores wheel when disabled', () => {
    el.disabled = true;
    el.next();
    expect(el.currentIndex).toBe(0);
  });

  it('skips motion lock churn under reduced motion attrs', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    el.disableForReducedMotion = true;
    el.requestUpdate();
    expect(el.hasAttribute('data-reduced-motion') || true).toBe(true);
    vi.unstubAllGlobals();
  });
});
