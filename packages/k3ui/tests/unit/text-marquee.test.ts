import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachTextMarquee } from '../../src/components/feedback/text-marquee.js';

describe('attachTextMarquee', () => {
  let host: HTMLElement;
  let marquee: HTMLElement;
  let label: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    host.style.width = '80px';
    host.innerHTML = `
      <div class="meta-marquee" style="width:80px;overflow:hidden">
        <div class="meta-track">
          <span class="meta-label">Porter Robinson & Lazy Rich feat. Sue Cho</span>
          <span class="meta-label ghost" aria-hidden="true">Porter Robinson & Lazy Rich feat. Sue Cho</span>
        </div>
      </div>
    `;
    document.body.appendChild(host);
    marquee = host.querySelector('.meta-marquee')!;
    label = host.querySelector('.meta-label:not(.ghost)')!;
    /* jsdom: force overflow measurement */
    Object.defineProperty(marquee, 'clientWidth', { configurable: true, get: () => 80 });
    Object.defineProperty(label, 'scrollWidth', { configurable: true, get: () => 320 });
  });

  afterEach(() => {
    host.remove();
  });

  it('adds scrolling chrome when label overflows', () => {
    const animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      onfinish: null as (() => void) | null,
    });
    const track = marquee.querySelector('.meta-track') as HTMLElement;
    track.animate = animate as unknown as typeof track.animate;

    const handle = attachTextMarquee(marquee);
    handle.refresh();

    expect(marquee.classList.contains('scrolling')).toBe(true);
    expect(animate).toHaveBeenCalled();
    handle.stop();
    expect(marquee.classList.contains('scrolling')).toBe(false);
  });

  it('stays static when text fits', () => {
    Object.defineProperty(label, 'scrollWidth', { configurable: true, get: () => 40 });
    const track = marquee.querySelector('.meta-track') as HTMLElement;
    track.animate = vi.fn() as unknown as typeof track.animate;

    const handle = attachTextMarquee(marquee);
    handle.refresh();
    expect(marquee.classList.contains('scrolling')).toBe(false);
    expect(track.animate).not.toHaveBeenCalled();
    handle.stop();
  });
});
