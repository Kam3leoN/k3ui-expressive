/**
 * `package.json#sideEffects` tells bundlers which files must survive tree
 * shaking. Every published file that registers a custom element (or ships
 * CSS) must match, otherwise `import 'k3ui/components/k3-xxx'` is dropped by
 * Vite / Rollup / esbuild / webpack and the tag is never defined.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  sideEffects: string[] | boolean;
};

/** Bundler glob semantics: `**` any depth, `*` one segment, slash-less patterns match any basename. */
function globToRegExp(glob: string): RegExp {
  const g = glob.replace(/^\.\//, '');
  const anyDir = !g.includes('/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i]!;
    if (c === '*' && g[i + 1] === '*') {
      if (g[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${anyDir ? '(?:.*/)?' : ''}${re}$`);
}

const patterns = Array.isArray(pkg.sideEffects) ? pkg.sideEffects.map(globToRegExp) : [];
const isSideEffect = (file: string): boolean =>
  pkg.sideEffects === true || patterns.some((re) => re.test(file.replace(/\\/g, '/')));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('package.json sideEffects', () => {
  it('is an explicit list (tree shaking stays on for everything else)', () => {
    expect(Array.isArray(pkg.sideEffects)).toBe(true);
  });

  it.each([
    'dist/k3ui.js',
    'dist/k3ui.css',
    'dist/lazy/k3ui.js',
    'dist/lazy/components/k3-list.js',
    'dist/lazy/chunks/list-Bp2ghqFy.js',
    'dist/lazy/chunks/nested/base-x1.js',
    'dist/fonts/fonts.css',
    'dist/k3ui-syntax.js',
  ])('keeps %s', (file) => {
    expect(isSideEffect(file), `${file} must match package.json#sideEffects`).toBe(true);
  });

  it('covers every built file that defines a custom element', () => {
    const dist = join(root, 'dist');
    if (!existsSync(dist)) return; // runs after `npm run build`
    const missing = walk(dist)
      .filter((f) => f.endsWith('.js'))
      .filter((f) => readFileSync(f, 'utf8').includes('customElements.define'))
      .map((f) => relative(root, f).replace(/\\/g, '/'))
      .filter((f) => !isSideEffect(f));
    expect(missing, 'add these paths to package.json#sideEffects').toEqual([]);
  });
});
