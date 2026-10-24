import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { clearMenuPanelFit, fitMenuPanel } from '../../src/components/containment/menu-fit.js';

describe('fitMenuPanel', () => {
  let panel: HTMLElement;
  let trigger: HTMLElement;

  beforeEach(() => {
    panel = document.createElement('div');
    trigger = document.createElement('div');
    document.body.append(trigger, panel);
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 160 });
    Object.defineProperty(panel, 'offsetHeight', { configurable: true, value: 120 });
    Object.defineProperty(panel, 'scrollWidth', { configurable: true, value: 160 });
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 120 });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 120,
      left: 0,
      right: 160,
      width: 160,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 540,
      left: 20,
      right: 60,
      width: 40,
      height: 40,
      x: 20,
      y: 500,
      toJSON: () => ({}),
    });
    vi.stubGlobal('innerWidth', 800);
    vi.stubGlobal('innerHeight', 600);
  });

  afterEach(() => {
    panel.remove();
    trigger.remove();
    vi.restoreAllMocks();
  });

  it('opens top-start toward content when near the start edge (LTR)', () => {
    const { left, top } = fitMenuPanel(panel, trigger, 'top-start', false);
    expect(panel.getAttribute('data-fitted')).toBe('');
    expect(panel.style.position).toBe('fixed');
    expect(panel.style.left).toBe('20px');
    expect(panel.style.right).toBe('auto');
    expect(left).toBe(20);
    expect(top).toBeLessThan(500);
  });

  it('flips top-end to start when end-align cannot fit (LTR near left)', () => {
    fitMenuPanel(panel, trigger, 'top-end', false);
    /* roomEnd (tr.right−EDGE) < pw → fall back to start-align on trigger */
    expect(panel.style.left).toBe('20px');
    expect(panel.style.right).toBe('auto');
  });

  it('keeps bottom-end inside viewport when trigger is at the right edge (app bar)', () => {
    /* Trigger flush right — menu must grow left (end align), not spill past vw */
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 8,
      bottom: 40,
      left: 1860,
      right: 1900,
      width: 40,
      height: 32,
      x: 1860,
      y: 8,
      toJSON: () => ({}),
    });
    vi.stubGlobal('innerWidth', 1920);
    vi.stubGlobal('innerHeight', 1080);
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 220 });
    Object.defineProperty(panel, 'scrollWidth', { configurable: true, value: 220 });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 200,
      left: 0,
      right: 220,
      width: 220,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const { left } = fitMenuPanel(panel, trigger, 'bottom-end', false);
    /* right: vw - trigger.right → panel grows left even if width was underestimated */
    expect(panel.style.right).toBe('20px');
    expect(panel.style.left).toBe('auto');
    expect(left).toBe(1900 - 220);
    expect(left).toBeGreaterThanOrEqual(8);
  });

  it('end-anchors even when measured width is too small (no right spill)', () => {
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      top: 8,
      bottom: 40,
      left: 1860,
      right: 1900,
      width: 40,
      height: 32,
      x: 1860,
      y: 8,
      toJSON: () => ({}),
    });
    vi.stubGlobal('innerWidth', 1920);
    /* Under-measure: 112 while real content will be ~220 */
    Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 112 });
    Object.defineProperty(panel, 'scrollWidth', { configurable: true, value: 112 });
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 100,
      left: 0,
      right: 112,
      width: 112,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fitMenuPanel(panel, trigger, 'bottom-end', false);
    expect(panel.style.right).toBe('20px');
    expect(panel.style.left).toBe('auto');
  });

  it('clearMenuPanelFit removes fixed styles', () => {
    fitMenuPanel(panel, trigger, 'top-start', false);
    clearMenuPanelFit(panel);
    expect(panel.hasAttribute('data-fitted')).toBe(false);
    expect(panel.style.position).toBe('');
  });
});
