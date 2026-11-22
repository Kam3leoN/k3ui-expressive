import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  K3TopAppBar,
  default as TopAppBar,
} from '../../src/components/navigation/top-app-bar.js';

void TopAppBar;

describe('k3-top-app-bar', () => {
  let el: K3TopAppBar;

  beforeEach(async () => {
    el = document.createElement('k3-top-app-bar') as K3TopAppBar;
    el.textContent = 'Inbox';
    document.body.append(el);
    await el.updateComplete;
  });

  afterEach(() => el.remove());

  it('reflects blur attribute via blurred property', async () => {
    expect(el.hasAttribute('blur')).toBe(false);
    expect(el.blurred).toBe(false);
    el.blurred = true;
    await el.updateComplete;
    expect(el.hasAttribute('blur')).toBe(true);
    el.removeAttribute('blur');
    await el.updateComplete;
    expect(el.blurred).toBe(false);
  });

  it('does not clobber HTMLElement.blur()', async () => {
    el.blurred = true;
    await el.updateComplete;
    expect(typeof el.blur).toBe('function');
    expect(() => el.blur()).not.toThrow();
  });

  it('applies backdrop blur styles when blur is set', () => {
    const sheet = (K3TopAppBar as unknown as { styles: Array<{ cssText?: string }> })
      .styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(/:host\(\[blur\]\)\s*\.bar/);
    expect(cssText).toMatch(/backdrop-filter:\s*blur\(/);
    expect(cssText).toMatch(/prefers-reduced-transparency:\s*reduce/);
    expect(cssText).toContain('--k3-appbar-blur');
    expect(cssText).toMatch(/--k3-appbar-blur-fill:\s*72%/);
  });

  it('sticky only pins — blur is a separate option', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/navigation/top-app-bar.ts'),
      'utf8',
    );
    expect(src).toMatch(/:host\(\[sticky\]\)\s*\{[\s\S]*?position:\s*sticky/);
    expect(src).not.toMatch(
      /:host\(\[sticky\]\)\s*\.bar\s*\{[\s\S]*?backdrop-filter/,
    );
  });
});
