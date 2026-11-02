#!/usr/bin/env node
/**
 * dist/k3ui-syntax.js — the extended language pack (`k3ui/syntax`), a standalone
 * ES module with no import: `syntax.load()` fetches it next to k3ui.js, or apps
 * register it with `syntax.use(await import('k3ui/syntax'))`.
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
  `/** Extended language pack for k3ui syntax highlighting (Prism grammars, MIT). */\n` +
    `export declare const LANGUAGES: ReadonlyArray<readonly [string, (prism: unknown) => void]>;\n`,
);
console.log('dist/k3ui-syntax.js written');
