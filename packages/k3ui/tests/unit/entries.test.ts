import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as base from '../../src/base.js';
import * as full from '../../src/index.js';
import * as lazy from '../../src/lazy.js';
import * as pack from '../../src/pack.js';
import { LAZY_OMITTED_EXPORTS } from '../../scripts/registry-graph.mjs';

const keys = (mod: object): string[] => Object.keys(mod).sort();

describe('package entries', () => {
  it('k3ui = base + the documented full-bundle extras', () => {
    const extras = keys(full).filter((k) => !(k in base));
    expect(extras).toEqual([...LAZY_OMITTED_EXPORTS].sort());
    for (const k of keys(base)) expect(k in full, k).toBe(true);
  });

  it('k3ui/lazy and custom packs expose exactly the base API', () => {
    expect(keys(lazy)).toEqual(keys(base));
    expect(keys(pack)).toEqual(keys(base));
  });

  it('base.ts never imports a component class statically', () => {
    const catalogSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/registry/catalog.ts'), 'utf8');
    const modules = [...catalogSrc.matchAll(/import\('\.\.\/(components\/[\w/.-]+?\.js)'\)/g)].map((m) => m[1]!);
    const baseSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/base.ts'), 'utf8');
    /* `export type` / `import type` are erased — only value imports count. */
    const valueImports = [...baseSrc.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?from\s+'\.\/([^']+)';/gms)].map(
      (m) => m[1]!,
    );
    for (const mod of modules) expect(valueImports, mod).not.toContain(mod);
  });

  it('keeps one K3UI global across entries', () => {
    expect(lazy.K3UI).toBe(full.K3UI);
    expect(window.K3UI).toBe(full.K3UI);
  });
});
