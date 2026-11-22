import { describe, it, expect, afterEach, vi } from 'vitest';
import { applyDockedPosition } from '../../src/components/pickers/time-picker.position.js';

describe('applyDockedPosition clip stability', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const el of hosts) el.remove();
    hosts.length = 0;
    vi.unstubAllGlobals();
  });

  function mountHost(h: number): HTMLElement {
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;width:360px;height:${h}px;`;
    /* scrollHeight ≈ content; simulate tall panel */
    Object.defineProperty(host, 'scrollHeight', { configurable: true, get: () => h });
    Object.defineProperty(host, 'offsetHeight', {
      configurable: true,
      get: () => {
        const max = host.style.maxHeight ? Number.parseFloat(host.style.maxHeight) : h;
        return Math.min(h, max);
      },
    });
    Object.defineProperty(host, 'offsetWidth', { configurable: true, get: () => 360 });
    document.body.appendChild(host);
    hosts.push(host);
    return host;
  }

  function mountAnchor(bottom: number): HTMLElement {
    const anchor = document.createElement('div');
    anchor.getBoundingClientRect = () =>
      ({
        top: bottom - 40,
        bottom,
        left: 20,
        right: 220,
        width: 200,
        height: 40,
        x: 20,
        y: bottom - 40,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(anchor);
    hosts.push(anchor);
    return anchor;
  }

  it('keeps data-clip across reposition when offsetHeight is collapsed by maxHeight', () => {
    vi.stubGlobal('innerWidth', 1280);
    vi.stubGlobal('innerHeight', 500);
    const host = mountHost(420);
    const anchor = mountAnchor(100); /* below → top≈108, avail≈384 → needs clip */

    const first = applyDockedPosition(host, anchor);
    expect(first.maxHeight).not.toBeNull();
    expect(host.hasAttribute('data-clip')).toBe(true);

    /* Second pass: offsetHeight is now the clipped size — must still clip */
    const second = applyDockedPosition(host, anchor);
    expect(second.maxHeight).not.toBeNull();
    expect(host.hasAttribute('data-clip')).toBe(true);
  });

  it('releases clip when natural height clearly fits', () => {
    vi.stubGlobal('innerWidth', 1280);
    vi.stubGlobal('innerHeight', 900);
    const host = mountHost(300);
    const anchor = mountAnchor(80);

    applyDockedPosition(host, anchor);
    expect(host.hasAttribute('data-clip')).toBe(false);

    const again = applyDockedPosition(host, anchor);
    expect(again.maxHeight).toBeNull();
    expect(host.hasAttribute('data-clip')).toBe(false);
  });
});
