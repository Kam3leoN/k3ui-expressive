import { afterEach, describe, expect, it, vi } from 'vitest';
import { FluidEdgeCurve, FLUID_EDGE_CURVE } from '../../src/motion/fluid-edge-curve.js';

describe('FluidEdgeCurve', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute('data-k3-motion');
    vi.useRealTimers();
  });

  it('exposes capped gain / max constants', () => {
    expect(FLUID_EDGE_CURVE.max).toBe(28);
    expect(FLUID_EDGE_CURVE.maxRatio).toBe(0.12);
    expect(FLUID_EDGE_CURVE.gain).toBeGreaterThan(0);
    expect(FLUID_EDGE_CURVE.gainRect).toBeGreaterThan(FLUID_EDGE_CURVE.gain);
    expect(FLUID_EDGE_CURVE.hysteresis).toBeGreaterThan(FLUID_EDGE_CURVE.epsilon);
  });

  it('sets data-curve-edge on start; data-curve once size moves; clears on stop', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const host = document.createElement('div');
    const surface = document.createElement('div');
    let width = 96;
    Object.defineProperty(surface, 'offsetWidth', { get: () => width });
    Object.defineProperty(surface, 'offsetHeight', { get: () => 400 });
    const edge = document.createElement('span');
    edge.className = 'edge';
    surface.append(edge);
    host.append(surface);
    document.body.append(host);

    const curve = new FluidEdgeCurve(host, () => surface, { measure: 'offset' });
    curve.start(2000);
    expect(host.getAttribute('data-curve-edge')).toBe('inline-end');
    expect(host.getAttribute('data-curve-axis')).toBe('inline');
    /* Still surface — no sag yet */
    expect(host.hasAttribute('data-curve')).toBe(false);

    vi.advanceTimersToNextFrame();
    width = 160;
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    expect(host.hasAttribute('data-curve')).toBe(true);

    curve.stop();
    expect(host.hasAttribute('data-curve')).toBe(false);
    expect(host.hasAttribute('data-curve-edge')).toBe(false);
    expect(host.hasAttribute('data-curve-axis')).toBe(false);
  });

  it('block axis marks data-curve-axis=block and data-curve-edge', () => {
    const host = document.createElement('div');
    const surface = document.createElement('div');
    const edge = document.createElement('span');
    edge.className = 'edge';
    surface.append(edge);
    host.append(surface);
    document.body.append(host);
    const curve = new FluidEdgeCurve(host, () => surface, {
      measure: 'rect',
      edge: 'block-end',
    });
    curve.start(100);
    expect(host.getAttribute('data-curve-axis')).toBe('block');
    expect(host.getAttribute('data-curve-edge')).toBe('block-end');
    curve.stop();
  });

  it('inline-start marks data-curve-edge for end-docked sheets', () => {
    const host = document.createElement('div');
    const surface = document.createElement('div');
    host.append(surface);
    document.body.append(host);
    const curve = new FluidEdgeCurve(host, () => surface, {
      measure: 'rect',
      edge: 'inline-start',
    });
    curve.start(50);
    expect(host.getAttribute('data-curve-edge')).toBe('inline-start');
    curve.stop();
  });
});
