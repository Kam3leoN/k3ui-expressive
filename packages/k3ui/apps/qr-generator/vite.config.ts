import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { HAS_K3UX, K3UX_SRC } from '../../scripts/k3ux-sibling.mjs';

const root = resolve(__dirname);
const k3src = resolve(__dirname, '../../src');
/* Workspace install: Lit is hoisted to the monorepo root. */
const litRoot = dirname(createRequire(import.meta.url).resolve('lit'));

const k3uxAliases = HAS_K3UX
  ? [
      { find: '@k3ux', replacement: K3UX_SRC },
      { find: /^k3ux$/, replacement: resolve(K3UX_SRC, 'index.ts') },
    ]
  : [];

const fsAllow = [resolve(__dirname, '../..'), resolve(__dirname, '../../../..')];
if (HAS_K3UX) fsAllow.push(resolve(__dirname, '../../../k3ux'));

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    /* One Lit graph for app + sibling k3ux (Lit is hoisted to the monorepo root). */
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
    alias: [
      { find: '@k3ui', replacement: k3src },
      ...k3uxAliases,
      { find: /^k3ui$/, replacement: resolve(__dirname, '../../src/index.ts') },
      { find: /^lit$/, replacement: litRoot },
      /* Trailing `/` required: resolve() on Windows drops trailing `/` → lit/decorators.js */
      { find: /^lit\//, replacement: `${litRoot}/` },
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    host: true,
    fs: {
      allow: fsAllow,
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
  },
  base: './',
});
