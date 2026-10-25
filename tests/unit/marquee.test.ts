import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { durationFromSpeed } from '../../src/components/feedback/marquee.specs.js';
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
});
