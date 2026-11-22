import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { minify } from 'terser';
import { describe, expect, it } from 'vitest';
import { minifyCssInJs } from '../../scripts/pack-minify.mjs';

/* Reads the on-demand build: runs after `npm run build:lazy` (CI builds first), skipped on a fresh clone. */
const dir = resolve('dist/lazy/chunks');

describe('crush + terser', () => {
  it.skipIf(!existsSync(dir))('base chunk still parses after Lit CSS crush', async () => {
    const base = readdirSync(dir).find((f) => f.startsWith('base-') && f.endsWith('.js'));
    if (!base) return;
    const js = readFileSync(resolve(dir, base), 'utf8');
    const crushed = minifyCssInJs(js);
    expect(crushed).not.toContain('Focus carré');
    expect(crushed).toContain('.k3-state-layer{position:relative;');
    const result = await minify(crushed, { module: true, compress: false, mangle: false });
    expect(result.code).toBeTruthy();
  }, 30_000);
});
