import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  CoverflowSpecs,
  coverflowBulletWeight,
  coverflowExtent,
  coverflowFit,
  coverflowOffset,
  coverflowPose,
  coverflowSlidePose,
  coverflowSlideVisible,
  coverflowSnap,
  coverflowSpring,
  coverflowTransform,
  safeCoverflowHref,
  wrapIndex,
  type CoverflowGeometry,
} from '../../src/components/containment/coverflow.specs.js';
import '../../src/components/containment/coverflow.js';
import type { K3Coverflow } from '../../src/components/containment/coverflow.js';
import type { K3CoverflowItem } from '../../src/components/containment/coverflow-item.js';

const G: CoverflowGeometry = {
  width: 200,
  angle: CoverflowSpecs.angle,
  gap: CoverflowSpecs.gap,
  spacing: CoverflowSpecs.spacing,
  depth: CoverflowSpecs.depth,
  visible: 2,
};

describe('coverflow geometry', () => {
  it('wraps indices into [0, count)', () => {
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(12, 5)).toBe(2);
    expect(wrapIndex(3, 0)).toBe(0);
  });

  it('offsets take the shortest way round in loop mode only', () => {
    expect(coverflowOffset(9, 0, 10, true)).toBe(-1);
    expect(coverflowOffset(1, 9, 10, true)).toBe(2);
    expect(coverflowOffset(9, 0, 10, false)).toBe(9);
    expect(coverflowOffset(2, 2.5, 10, true)).toBeCloseTo(-0.5);
  });

  it('centres the active cover and turns the sides towards it', () => {
    const c = coverflowPose(0, G);
    expect(c).toMatchObject({ x: 0, z: -0, rotate: -0, opacity: 1, hidden: false });
    const r = coverflowPose(1, G);
    const l = coverflowPose(-1, G);
    expect(r.x).toBeCloseTo(G.gap * G.width);
    expect(l.x).toBeCloseTo(-G.gap * G.width);
    expect(r.rotate).toBe(-G.angle);
    expect(l.rotate).toBe(G.angle);
    expect(r.z).toBeLessThan(0);
    expect(c.zIndex).toBeGreaterThan(r.zIndex);
    /* Further covers stack behind, a little deeper */
    const r2 = coverflowPose(2, G);
    expect(r2.x - r.x).toBeCloseTo(G.spacing * G.width);
    expect(r2.z).toBeLessThan(r.z);
    expect(r2.zIndex).toBeLessThan(r.zIndex);
  });

  it('is continuous between positions (no jump while dragging)', () => {
    for (const d of [0.999, 1.001, -0.999, -1.001]) {
      const a = coverflowPose(d, G);
      const b = coverflowPose(Math.sign(d), G);
      expect(Math.abs(a.x - b.x)).toBeLessThan(1);
      expect(Math.abs(a.rotate - b.rotate)).toBeLessThan(0.2);
    }
  });

  it('fades out past the visible window, then hides', () => {
    expect(coverflowPose(2, G).opacity).toBe(1);
    expect(coverflowPose(2.5, G).opacity).toBeCloseTo(0.5);
    expect(coverflowPose(3, G).hidden).toBe(true);
  });

  it('mirrors in RTL', () => {
    const p = coverflowPose(1, G, true);
    expect(p.x).toBeCloseTo(-G.gap * G.width);
    expect(p.rotate).toBe(G.angle);
  });

  it('vertical transform: offset on y, tilt around x facing the centre', () => {
    expect(coverflowTransform(coverflowPose(1, G), true)).toBe('translate3d(0, 144.00px, -124.00px) rotateX(60.000deg)');
    expect(coverflowTransform(coverflowPose(-1, G), true)).toBe('translate3d(0, -144.00px, -124.00px) rotateX(-60.000deg)');
    expect(coverflowTransform(coverflowPose(0, G), true)).toBe('translate3d(0, 0.00px, 0.00px) rotateX(0.000deg)');
  });

  it('builds a 3D transform', () => {
    expect(coverflowTransform(coverflowPose(1, G))).toBe('translate3d(144.00px, 0, -124.00px) rotateY(-60.000deg)');
  });

  it('snaps with momentum, clamped when bounded', () => {
    expect(coverflowSnap(2.4, 0, 10, true)).toBe(2);
    expect(coverflowSnap(2.4, 10, 10, true)).toBe(4);
    expect(coverflowSnap(8.6, 20, 10, false)).toBe(9);
    expect(coverflowSnap(0.2, -20, 10, false)).toBe(0);
    expect(coverflowSnap(0.2, -20, 10, true)).toBe(-3);
  });

  it('spring settles on the target without overshoot, whatever the frame time', () => {
    for (const dt of [1 / 120, 1 / 30, 0.1]) {
      let s = { position: 0, velocity: 0 };
      let max = 0;
      for (let t = 0; t < 1.5; t += dt) {
        s = coverflowSpring(s.position, s.velocity, 1, dt);
        max = Math.max(max, s.position);
      }
      expect(max).toBeLessThanOrEqual(1 + 1e-9);
      expect(s.position).toBeCloseTo(1, 4);
    }
  });

  it('keeps safe link targets only', () => {
    expect(safeCoverflowHref('/albums/1')).toBe('/albums/1');
    expect(safeCoverflowHref('#top')).toBe('#top');
    expect(safeCoverflowHref('https://example.com/a')).toBe('https://example.com/a');
    expect(safeCoverflowHref('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(safeCoverflowHref('javascript:alert(1)')).toBe('');
    expect(safeCoverflowHref(' JaVa\tscript:alert(1)')).toBe('');
    expect(safeCoverflowHref('data:text/html,<b>')).toBe('');
    expect(safeCoverflowHref('vbscript:x')).toBe('');
    expect(safeCoverflowHref('')).toBe('');
    expect(safeCoverflowHref(null)).toBe('');
  });
});

describe('coverflow slide effect', () => {
  const g = { width: 200, visible: 3 };
  const S = CoverflowSpecs.slideScale;
  const gap = CoverflowSpecs.slideGap * 200;
  const edges = (d: number) => {
    const p = coverflowSlidePose(d, g);
    const half = (200 * (p.scale ?? 1)) / 2;
    return [p.x - half, p.x + half];
  };

  it('grows the centred cover only, flat and without rotation', () => {
    expect(coverflowSlidePose(0, g)).toMatchObject({ x: 0, rotate: 0, scale: S, opacity: 1 });
    expect(coverflowSlidePose(1, g).scale).toBe(1);
    expect(coverflowSlidePose(0.5, g).scale).toBeCloseTo(1 + (S - 1) / 2);
    expect(coverflowSlidePose(-2, g).x).toBeCloseTo(-coverflowSlidePose(2, g).x);
  });

  it('keeps one gap between neighbours at rest and never overlaps while sliding', () => {
    expect(edges(1)[0]! - edges(0)[1]!).toBeCloseTo(gap);
    expect(edges(2)[0]! - edges(1)[1]!).toBeCloseTo(gap);
    for (let p = 0; p <= 1; p += 0.05) {
      /* covers at offsets −p, 1−p, 2−p as the row moves by one */
      const a = edges(-p);
      const b = edges(1 - p);
      const c = edges(2 - p);
      expect(b[0]! - a[1]!).toBeGreaterThanOrEqual(gap - 1e-6);
      expect(c[0]! - b[1]!).toBeGreaterThanOrEqual(gap - 1e-6);
    }
  });

  it('builds a translate + scale transform on either axis', () => {
    expect(coverflowTransform(coverflowSlidePose(1, g))).toBe('translate3d(260.00px, 0, -0.50px) scale(1.0000)');
    expect(coverflowTransform(coverflowSlidePose(0, g), true)).toBe('translate3d(0, 0.00px, 0.00px) scale(1.4000)');
  });

  it('counts the covers needed to reach the edges', () => {
    expect(coverflowSlideVisible(1400, 160)).toBe(5);
    expect(coverflowSlideVisible(360, 120)).toBe(2);
    expect(coverflowSlideVisible(0, 120)).toBe(CoverflowSpecs.visible);
  });
});

describe('coverflow full width & bullets', () => {
  const g: CoverflowGeometry = { ...G, width: 224, visible: 4 };

  it('projects the outer edge of side covers, growing with the offset', () => {
    const e1 = coverflowExtent(1, g);
    const e3 = coverflowExtent(3, g);
    expect(e1).toBeGreaterThan(G.gap * 224 * 0.5);
    expect(e3).toBeGreaterThan(e1);
    expect(coverflowExtent(-3, g)).toBeCloseTo(e3, 6);
  });

  it('fits the outermost cover to the container edges', () => {
    const fit = coverflowFit(1400, g, 6);
    expect(fit.visible).toBe(6);
    expect(coverflowExtent(6, { ...g, ...fit })).toBeCloseTo(700, 0);
  });

  it('uses fewer covers rather than packing them, keeps defaults when nothing fits', () => {
    const fit = coverflowFit(600, g, 6);
    expect(fit.visible).toBeLessThan(6);
    expect(fit.spacing).toBeGreaterThanOrEqual(g.spacing * 0.75);
    expect(coverflowFit(300, g, 6)).toEqual({ visible: g.visible, spacing: g.spacing });
  });

  it('caps the spacing when there are too few covers to reach the edges', () => {
    expect(coverflowFit(4000, g, 2)).toEqual({ visible: 2, spacing: CoverflowSpecs.maxSpacing });
  });

  it('bullet weight is 1 when centred and fades over one item', () => {
    expect(coverflowBulletWeight(0)).toBe(1);
    expect(coverflowBulletWeight(0.25)).toBe(0.75);
    expect(coverflowBulletWeight(-1)).toBe(0);
    expect(coverflowBulletWeight(3)).toBe(0);
  });
});

describe('k3-coverflow', () => {
  let el: K3Coverflow;

  const mount = async (attrs = '', items = 6, itemAttrs = (i: number) => `href="/item/${i}"`) => {
    el = document.createElement('k3-coverflow') as K3Coverflow;
    el.innerHTML = Array.from(
      { length: items },
      (_, i) => `<k3-coverflow-item ${itemAttrs(i)}><img src="/${i}.jpg" alt="Cover ${i}" /></k3-coverflow-item>`,
    ).join('');
    for (const a of attrs.split(/\s+/).filter(Boolean)) {
      const [k, v = ''] = a.split('=');
      el.setAttribute(k!, v);
    }
    document.body.appendChild(el);
    await el.updateComplete;
    await Promise.all(covers().map((c) => c.updateComplete));
    return el;
  };
  const covers = () => [...el.querySelectorAll('k3-coverflow-item')] as K3CoverflowItem[];
  const settle = async () => {
    await el.updateComplete;
    await Promise.all(covers().map((c) => c.updateComplete));
  };

  beforeEach(() => {
    /* Instant moves: no animation frames to wait for */
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
  });
  afterEach(() => {
    el?.remove();
    document.documentElement.removeAttribute('data-k3-reduce-motion');
    document.documentElement.removeAttribute('dir');
  });

  it('is a named region of covers, with the centred one active', async () => {
    await mount('label=Albums index=2');
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Albums');
    expect(el.getAttribute('aria-roledescription')).toBeTruthy();
    const c = covers();
    expect(c.filter((x) => x.active)).toEqual([c[2]]);
    expect(c[2]!.getAttribute('aria-label')).toBe('Cover 2 (3 of 6)');
    expect(c[0]!.getAttribute('aria-hidden')).toBe('true');
    expect(c[2]!.hasAttribute('aria-hidden')).toBe(false);
    expect(c[2]!.style.transform).toContain('translate3d(0.00px');
    /* No caption, category or scrollbar parts */
    expect(el.shadowRoot!.querySelector('.viewport')).toBeTruthy();
    expect(el.shadowRoot!.querySelectorAll('[part]').length).toBe(2);
  });

  it('loops past both ends and announces the change', async () => {
    await mount();
    const changes: number[] = [];
    el.addEventListener('k3-change', (e) => changes.push((e as CustomEvent<{ index: number }>).detail.index));
    el.prev();
    await settle();
    expect(el.index).toBe(5);
    el.next();
    el.next();
    await settle();
    expect(el.index).toBe(1);
    expect(changes).toEqual([5, 0, 1]);
    expect(el.shadowRoot!.querySelector('[aria-live]')!.textContent).toContain('2 of 6');
  });

  it('stops at the ends when bounded', async () => {
    await mount('mode=bounded');
    el.prev();
    await settle();
    expect(el.index).toBe(0);
    el.goTo(99);
    await settle();
    expect(el.index).toBe(5);
    el.next();
    await settle();
    expect(el.index).toBe(5);
  });

  it('navigates with the keyboard (mirrored in RTL) and moves focus along', async () => {
    await mount();
    covers()[0]!.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    expect(el.index).toBe(1);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await settle();
    expect(el.index).toBe(5);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await settle();
    expect(el.index).toBe(0);
    document.documentElement.dir = 'rtl';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await settle();
    expect(el.index).toBe(5);
  });

  it('setting index centres that cover', async () => {
    await mount();
    el.index = 3;
    await settle();
    expect(covers()[3]!.active).toBe(true);
  });

  it('a side cover comes to the centre on click instead of following its link', async () => {
    await mount();
    const side = covers()[2]!;
    const a = side.shadowRoot!.querySelector('a')!;
    const click = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    a.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    await settle();
    expect(el.index).toBe(2);
    /* Centred now: its link is the tab stop and is followed */
    expect(a.getAttribute('tabindex')).toBe('0');
    const again = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    a.addEventListener('click', (e) => e.preventDefault(), { once: true }); // jsdom: no navigation
    a.dispatchEvent(again);
    expect(el.index).toBe(2);
  });

  it('link covers: safe href, rel for new tabs, no button role', async () => {
    await mount('', 3, (i) => (i === 1 ? 'href="javascript:alert(1)"' : `href="https://example.com/${i}" target="_blank"`));
    const [a0, a1] = covers().map((c) => c.shadowRoot!.querySelector('a'));
    expect(a0!.getAttribute('href')).toBe('https://example.com/0');
    expect(a0!.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a1).toBeNull();
    expect(covers()[0]!.getAttribute('role')).toBe('group');
  });

  it('flip covers turn over when centred (click, Enter, Space) and can be canceled', async () => {
    await mount('', 4, () => 'flip');
    const c = covers();
    const flips: boolean[] = [];
    el.addEventListener('k3-flip', (e) => flips.push((e as CustomEvent<{ flipped: boolean }>).detail.flipped));
    expect(c[0]!.getAttribute('role')).toBe('button');
    expect(c[0]!.getAttribute('aria-pressed')).toBe('false');
    expect(c[0]!.tabIndex).toBe(0);
    expect(c[1]!.tabIndex).toBe(-1);

    /* Side cover: centres, does not flip */
    c[1]!.click();
    await settle();
    expect(el.index).toBe(1);
    expect(c[1]!.flipped).toBe(false);

    c[1]!.click();
    await settle();
    expect(c[1]!.flipped).toBe(true);
    expect(c[1]!.getAttribute('aria-pressed')).toBe('true');

    c[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await settle();
    expect(c[1]!.flipped).toBe(false);
    c[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    await settle();
    expect(c[1]!.flipped).toBe(true);
    expect(flips).toEqual([true, false, true]);

    c[1]!.addEventListener('k3-change-start', (e) => e.preventDefault(), { once: true });
    c[1]!.toggle();
    expect(c[1]!.flipped).toBe(true);
  });

  it('reflection is on by default and can be removed', async () => {
    await mount('no-reflection');
    expect(el.hasAttribute('data-reflect')).toBe(false);
    expect(covers()[0]!.hasAttribute('data-reflect')).toBe(false);
    el.noReflection = false;
    await settle();
    expect(el.hasAttribute('data-reflect')).toBe(true);
    expect(covers()[0]!.hasAttribute('data-reflect')).toBe(true);
  });

  it('keeps up with covers added later', async () => {
    await mount('', 2);
    const extra = document.createElement('k3-coverflow-item');
    extra.innerHTML = '<img src="/x.jpg" alt="Extra" />';
    el.appendChild(extra);
    await new Promise((r) => setTimeout(r, 0));
    await settle();
    expect(extra.getAttribute('aria-label')).toBe('Extra (3 of 3)');
    el.goTo(2);
    await settle();
    expect(extra.active).toBe(true);
  });

  it('side arrows step through the covers and hide at the ends when bounded', async () => {
    await mount('arrows mode=bounded');
    const prev = el.shadowRoot!.querySelector<HTMLButtonElement>('.arrow.prev')!;
    const next = el.shadowRoot!.querySelector<HTMLButtonElement>('.arrow.next')!;
    expect(prev.getAttribute('aria-label')).toBeTruthy();
    expect(prev.disabled).toBe(true);
    next.click();
    await settle();
    expect(el.index).toBe(1);
    expect(prev.disabled).toBe(false);
    el.goTo(5);
    await settle();
    expect(next.disabled).toBe(true);
    prev.click();
    await settle();
    expect(el.index).toBe(4);
  });

  it('bullets: one per cover, the active one weighted 1 and current, click and arrows', async () => {
    await mount('bullets index=1');
    const bullets = () => [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.bullet')];
    expect(bullets()).toHaveLength(6);
    expect(bullets()[1]!.style.getPropertyValue('--t')).toBe('1.000');
    expect(bullets()[0]!.style.getPropertyValue('--t')).toBe('0.000');
    expect(bullets()[1]!.getAttribute('aria-current')).toBe('true');
    expect(bullets().map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1, -1, -1]);
    bullets()[4]!.click();
    await settle();
    expect(el.index).toBe(4);
    expect(bullets()[4]!.style.getPropertyValue('--t')).toBe('1.000');
    expect(bullets()[4]!.getAttribute('aria-current')).toBe('true');
    bullets()[4]!.focus();
    bullets()[4]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await settle();
    await new Promise((r) => setTimeout(r, 0));
    expect(el.index).toBe(5);
    expect(el.shadowRoot!.activeElement).toBe(bullets()[5]);
  });

  describe('lightbox', () => {
    const box = () => el.shadowRoot!.querySelector<HTMLElement>('.lightbox');
    /* The layer opens once its image is ready (jsdom never loads: ≤ 0.5 s) */
    const shown = () => vi.waitFor(() => expect(box()).toBeTruthy(), { timeout: 2000 });
    const openOn = async (i: number) => {
      covers()[i]!.shadowRoot!.querySelector('a')!.click();
      await shown();
      await settle();
    };
    const imageIs = (src: string) =>
      vi.waitFor(() => expect(box()!.querySelector('img')!.getAttribute('src')).toBe(src), { timeout: 2000 });

    it('the centred link opens its image in a modal layer instead of navigating', async () => {
      await mount('lightbox', 4, (i) => `href="/full/${i}.webp"`);
      const opened: number[] = [];
      el.addEventListener('k3-open', (e) => opened.push((e as CustomEvent<{ index: number }>).detail.index));
      const a = covers()[0]!.shadowRoot!.querySelector('a')!;
      expect(a.getAttribute('aria-haspopup')).toBe('dialog');
      const click = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
      a.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      await shown();
      await settle();
      const lb = box()!;
      expect(lb).toBeTruthy();
      expect(lb.getAttribute('role')).toBe('dialog');
      expect(lb.getAttribute('aria-modal')).toBe('true');
      expect(lb.getAttribute('aria-label')).toBe('Cover 0');
      expect(lb.querySelector('img')!.getAttribute('src')).toBe('/full/0.webp');
      expect(opened).toEqual([0]);
      /* Focus moved into the layer (close button first) */
      expect(el.shadowRoot!.activeElement?.classList.contains('lb-close')).toBe(true);
      expect(document.querySelector('dialog')).toBeNull();
    });

    it('a side cover still only comes to the centre', async () => {
      await mount('lightbox');
      covers()[2]!.shadowRoot!.querySelector('a')!.click();
      await settle();
      expect(el.index).toBe(2);
      expect(box()).toBeNull();
    });

    it('arrows (keys and buttons) move the covers and the image; Escape closes and refocuses', async () => {
      await mount('lightbox', 4, (i) => `href="/full/${i}.webp"`);
      await openOn(0);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      box()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
      await settle();
      expect(el.index).toBe(1);
      await imageIs('/full/1.webp');
      box()!.querySelector<HTMLButtonElement>('.lb-nav.prev')!.click();
      await settle();
      expect(el.index).toBe(0);
      await imageIs('/full/0.webp');
      const closed: number[] = [];
      el.addEventListener('k3-close', (e) => closed.push((e as CustomEvent<{ index: number }>).detail.index));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await settle();
      expect(box()).toBeNull();
      expect(closed).toEqual([0]);
      await new Promise((r) => setTimeout(r, 0));
      expect(document.activeElement).toBe(covers()[0]);
    });

    it('closes on the scrim and the close button, not on the image', async () => {
      await mount('lightbox');
      await openOn(0);
      box()!.querySelector('img')!.click();
      await settle();
      expect(box()).toBeTruthy();
      box()!.click();
      await settle();
      expect(box()).toBeNull();
      await openOn(0);
      box()!.querySelector<HTMLButtonElement>('.lb-close')!.click();
      await settle();
      expect(box()).toBeNull();
    });

    it('without the attribute, links stay links', async () => {
      await mount('', 3);
      const a = covers()[0]!.shadowRoot!.querySelector('a')!;
      expect(a.hasAttribute('aria-haspopup')).toBe(false);
      const click = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
      a.addEventListener('click', (e) => e.preventDefault(), { once: true });
      a.dispatchEvent(click);
      await settle();
      expect(box()).toBeNull();
    });
  });

  describe('vertical', () => {
    it('stacks covers on y, tilts them around x and drops the reflection', async () => {
      await mount('orientation=vertical index=2');
      const c = covers();
      expect(el.hasAttribute('data-reflect')).toBe(false);
      expect(c[0]!.hasAttribute('data-reflect')).toBe(false);
      expect(c[0]!.hasAttribute('data-vertical')).toBe(true);
      expect(c[2]!.style.transform).toContain('translate3d(0, 0.00px');
      expect(c[3]!.style.transform).toMatch(/^translate3d\(0, [\d.]+px, -[\d.]+px\) rotateX\(60\.000deg\)$/);
      expect(c[1]!.style.transform).toMatch(/rotateX\(-60\.000deg\)$/);
    });

    it('↑ ↓ move along the column; ← → do nothing', async () => {
      await mount('orientation=vertical');
      covers()[0]!.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await settle();
      expect(el.index).toBe(1);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await settle();
      expect(el.index).toBe(5);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await settle();
      expect(el.index).toBe(5);
    });

    it('the vertical wheel moves the covers', async () => {
      await mount('orientation=vertical');
      const vp = el.shadowRoot!.querySelector('.viewport')!;
      vp.dispatchEvent(new WheelEvent('wheel', { deltaY: 130, bubbles: true, cancelable: true }));
      await settle();
      expect(el.index).toBe(2);
      vp.dispatchEvent(new WheelEvent('wheel', { deltaX: 200, bubbles: true, cancelable: true }));
      await settle();
      expect(el.index).toBe(2);
    });

    it('switching orientation re-poses the covers', async () => {
      await mount();
      expect(covers()[1]!.style.transform).toContain('rotateY');
      el.orientation = 'vertical';
      await settle();
      expect(covers()[1]!.style.transform).toContain('rotateX');
      el.orientation = 'horizontal';
      await settle();
      expect(covers()[1]!.style.transform).toContain('rotateY');
      expect(el.hasAttribute('data-reflect')).toBe(true);
    });
  });

  describe('slide effect', () => {
    it('flat row: same mirror reflection as coverflow, covers translated and the centred one scaled', async () => {
      await mount('effect=slide index=1');
      const c = covers();
      expect(el.hasAttribute('data-reflect')).toBe(true);
      expect(c[1]!.hasAttribute('data-reflect')).toBe(true);
      expect(c[1]!.style.transform).toBe('translate3d(0.00px, 0, 0.00px) scale(1.4000)');
      expect(c[2]!.style.transform).toMatch(/^translate3d\([\d.]+px, 0, -0\.50px\) scale\(1\.0000\)$/);
      expect(el.style.getPropertyValue('--_s')).toBe('1.4');
      el.noReflection = true;
      await settle();
      expect(el.hasAttribute('data-reflect')).toBe(false);
    });

    it('active-scale sets the growth; vertical slides on y', async () => {
      await mount('effect=slide active-scale=1.25 orientation=vertical');
      expect(covers()[0]!.style.transform).toBe('translate3d(0, 0.00px, 0.00px) scale(1.2500)');
      expect(covers()[1]!.style.transform).toMatch(/^translate3d\(0, [\d.]+px/);
      el.effect = 'coverflow';
      await settle();
      expect(covers()[1]!.style.transform).toContain('rotateX');
      expect(el.style.getPropertyValue('--_s')).toBe('');
    });

    it('navigates like the 3D effect', async () => {
      await mount('effect=slide');
      el.next();
      el.next();
      await settle();
      expect(el.index).toBe(2);
      el.prev();
      el.prev();
      el.prev();
      await settle();
      expect(el.index).toBe(5);
    });
  });
});
