#!/usr/bin/env node
/**
 * dist/k3ui-syntax.js — legacy empty pack (`k3ui/syntax`).
 * Grammars now ship in k3ui.js; this stub keeps `syntax.use(await import('k3ui/syntax'))` harmless.
 */
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [resolve(root, 'src/syntax/extended.ts')],
  outfile: resolve(root, 'dist/k3ui-syntax.js'),
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2020',
  legalComments: 'inline',
  logLevel: 'warning',
});
writeFileSync(
  resolve(root, 'dist/k3ui-syntax.d.ts'),
  `/** Legacy empty language pack — grammars ship in k3ui.js. */\n` +
    `export declare const LANGUAGES: ReadonlyArray<readonly [string, (engine: unknown) => void]>;\n`,
);
console.log('dist/k3ui-syntax.js written (empty stub)');
