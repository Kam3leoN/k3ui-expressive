import { describe, expect, it, vi, afterEach } from 'vitest';
import { GOO_TIMING, SnackbarGoo } from '../../src/components/feedback/snackbar-goo.js';

function mockBar(width = 280, height = 56, top = 600): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetWidth', { get: () => width });
  Object.defineProperty(el, 'offsetHeight', { get: () => height });
  el.getBoundingClientRect = () =>
    ({
      width,
      height,
      top,
      left: 100,
      right: 100 + width,
      bottom: top + height,
      x: 100,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

function mockSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = `
    <defs>
      <filter id="k3-snackbar-goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0"></feGaussianBlur>
      </filter>
    </defs>
    <g class="goo-bodies">
      <ellipse class="puddle"></ellipse>
      <circle class="drop"></circle>
      <rect class="body"></rect>
      <circle class="tip"></circle>
      <circle class="tip"></circle>
    </g>
  `;
  document.body.appendChild(svg);
  return svg;
}

describe('SnackbarGoo', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('exports leave timing longer than arrive (exit drop needs more runway)', () => {
    expect(GOO_TIMING.arrive).toBe(520);
    expect(GOO_TIMING.leave).toBe(560);
    expect(GOO_TIMING.leave).toBeGreaterThan(GOO_TIMING.arrive);
  });

  it('enter / stretch / leave drive SVG bodies then stop cleans raf', () => {
    vi.useFakeTimers();
    const bar = mockBar();
    const svg = mockSvg();
    const goo = new SnackbarGoo(
      () => bar,
      () => svg,
    );

    goo.enter('bottom');
    vi.advanceTimersByTime(60);
    const drop = svg.querySelector('.drop');
    expect(drop?.getAttribute('r')).toBeTruthy();

    goo.stretch();
    vi.advanceTimersByTime(50);
    const tips = svg.querySelectorAll('.tip');
    expect(tips.length).toBe(2);

    goo.leave();
    vi.advanceTimersByTime(GOO_TIMING.leave);
    goo.stop();

    /* stop is idempotent */
    goo.stop();
  });

  it('enter on top edge does not throw without bar/svg', () => {
    const goo = new SnackbarGoo(
      () => null,
      () => null,
    );
    expect(() => goo.enter('top')).not.toThrow();
    expect(() => goo.leave()).not.toThrow();
    goo.stop();
  });
});
