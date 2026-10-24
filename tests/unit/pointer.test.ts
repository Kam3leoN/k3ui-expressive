import { describe, expect, it, vi, afterEach } from 'vitest';
import { canHoverOpen, pathIncludes, pathMatches } from '../../src/core/pointer.js';

describe('pointer helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('canHoverOpen follows matchMedia', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('hover: hover'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    expect(canHoverOpen()).toBe(true);
  });

  it('pathIncludes / pathMatches', () => {
    const a = document.createElement('div');
    const b = document.createElement('button');
    b.className = 'ignore-me';
    a.append(b);
    document.body.append(a);
    const path = [b, a, document.body, document] as EventTarget[];
    expect(pathIncludes(path, a)).toBe(true);
    expect(pathIncludes(path, document.createElement('span'))).toBe(false);
    expect(pathMatches(path, '.ignore-me')).toBe(true);
    expect(pathMatches(path, '.missing')).toBe(false);
    a.remove();
  });
});
