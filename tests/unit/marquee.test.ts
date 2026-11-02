import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  marqueeOffset,
  durationFromSpeed,
  marqueeItemStations,
  crossedMarqueeStation,
} from '../../src/components/feedback/marquee.specs.js';
import '../../src/components/feedback/marquee.js';
import type { K3Marquee } from '../../src/components/feedback/marquee.js';

describe('k3-marquee', () => {
  let el: K3Marquee;

  beforeEach(async () => {
    el = document.createElement('k3-marquee') as K3Marquee;
    el.autoplay = false;
    el.innerHTML = '<span>One</span><span>Two</span>';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('computes duration from speed', () => {
    expect(durationFromSpeed(400, 200)).toBe(2);
  });

  it('duplicates content track in infinite mode', async () => {
    el.mode = 'infinite';
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    await el.updateComplete;
    const sets = el.shadowRoot!.querySelectorAll('.set');
    expect(sets.length).toBe(2);
  });

  it('play and stop toggle data-state', async () => {
    el.play();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.viewport')!.getAttribute('data-state')).toBe('playing');
    el.stop();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.viewport')!.getAttribute('data-state')).toBe('paused');
  });

  it('advances distance while playing (tick must not reset lastTime)', async () => {
    el.speed = 100;
    el.play();
    await el.updateComplete;
    const before = (el as unknown as { distance: number }).distance;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const after = (el as unknown as { distance: number }).distance;
    expect(after).toBeGreaterThan(before);
    el.stop();
  });
});

describe('marquee engine (MarqueeJS model)', () => {
  const base = { viewport: 600, period: 100, setSize: 80 };

  it('classic starts at the far edge and leaves completely', () => {
    expect(marqueeOffset(0, { ...base, mode: 'classic', start: 'filled' })).toBe(600);
    expect(marqueeOffset(680 - 1, { ...base, mode: 'classic', start: 'filled' })).toBe(-79);
    expect(marqueeOffset(680, { ...base, mode: 'classic', start: 'filled' })).toBe(600);
  });

  it('infinite + filled is covered from the first frame and loops on the period', () => {
    expect(marqueeOffset(0, { ...base, mode: 'infinite', start: 'filled' })).toBeCloseTo(0);
    expect(marqueeOffset(50, { ...base, mode: 'infinite', start: 'filled' })).toBe(-50);
    expect(marqueeOffset(100, { ...base, mode: 'infinite', start: 'filled' })).toBeCloseTo(0);
  });

  it('infinite + edge enters from the far edge, then loops seamlessly', () => {
    expect(marqueeOffset(0, { ...base, mode: 'infinite', start: 'edge' })).toBe(600);
    expect(marqueeOffset(300, { ...base, mode: 'infinite', start: 'edge' })).toBe(300);
    expect(marqueeOffset(600, { ...base, mode: 'infinite', start: 'edge' })).toBeCloseTo(0);
    expect(marqueeOffset(650, { ...base, mode: 'infinite', start: 'edge' })).toBe(-50);
  });

  it('normalises item stations within the period', () => {
    expect(marqueeItemStations([0, 40, 40, 90], 100)).toEqual([0, 40, 90]);
  });

  it('detects the next station crossed along the path (including wrap)', () => {
    const stations = [0, 40, 90];
    expect(crossedMarqueeStation(10, 45, stations, 100)).toBe(40);
    expect(crossedMarqueeStation(95, 5, stations, 100)).toBe(0);
    expect(crossedMarqueeStation(40, 40, stations, 100)).toBeNull();
  });
});

describe('k3-marquee API', () => {
  const mount = async (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    const el = host.firstElementChild as K3Marquee;
    await el.updateComplete;
    return { el, host };
  };
  const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

  it('autoplay=false starts paused; pause / resume / toggle fire once', async () => {
    const { el, host } = await mount('<k3-marquee autoplay="false"><span>a</span></k3-marquee>');
    (el as unknown as { autoplay: boolean }).autoplay = false;
    const events: string[] = [];
    el.addEventListener('k3-pause', () => events.push('pause'));
    el.addEventListener('k3-play', () => events.push('play'));
    el.paused = false;
    el.pause();
    el.pause();
    el.resume();
    el.toggle();
    expect(events).toEqual(['pause', 'play', 'pause']);
    expect(el.paused).toBe(true);
    host.remove();
  });

  it('respects clone-count, classic mode and separator', async () => {
    const { el, host } = await mount('<k3-marquee clone-count="3" separator="•"><span>a</span></k3-marquee>');
    await frame();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.set').length).toBe(4);
    expect(el.shadowRoot!.querySelectorAll('.sep').length).toBe(3);
    el.mode = 'classic';
    await el.updateComplete;
    await frame();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.set').length).toBe(1);
    host.remove();
  });

  it('copies follow text changes (no slotchange) and stay hidden from assistive tech', async () => {
    const { el, host } = await mount('<k3-marquee clone-count="1"><span>Bonjour</span></k3-marquee>');
    await frame();
    await el.updateComplete;
    el.querySelector('span')!.textContent = 'Hello';
    await new Promise((r) => setTimeout(r, 50));
    const clone = el.shadowRoot!.querySelector('.set.clone')!;
    expect(clone.textContent).toBe('Hello');
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.hasAttribute('inert')).toBe(true);
    host.remove();
  });
});
