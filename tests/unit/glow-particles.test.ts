import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/animation/glow-particles.js';
import type { K3GlowParticles } from '../../src/components/animation/glow-particles.js';

describe('k3-glow-particles', () => {
  let el: K3GlowParticles;

  beforeEach(async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      createRadialGradient: () => ({ addColorStop: vi.fn() }),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D);
    el = document.createElement('k3-glow-particles') as K3GlowParticles;
    el.autoplay = false;
    el.innerHTML = '<strong>Glow</strong>';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
    vi.restoreAllMocks();
  });

  it('registers and renders a canvas', () => {
    expect(customElements.get('k3-glow-particles')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('canvas')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('slot')).toBeTruthy();
  });

  it('exposes play / stop / restart', async () => {
    expect(typeof el.play).toBe('function');
    expect(typeof el.stop).toBe('function');
    expect(typeof el.restart).toBe('function');
    el.count = 12;
    el.color = '#ff00aa';
    el.interactive = true;
    await el.updateComplete;
    expect(el.hasAttribute('interactive')).toBe(true);
    el.play();
    expect(window.requestAnimationFrame).toHaveBeenCalled();
    el.stop();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
