import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { HAS_K3UX, K3UX_SRC } from '../../scripts/k3ux-sibling.mjs';

const root = resolve(__dirname);
const k3src = resolve(__dirname, '../../src');
const litRoot = resolve(__dirname, '../../node_modules/lit');

const k3uxAliases = HAS_K3UX
  ? [
      { find: '@k3ux', replacement: K3UX_SRC },
      { find: /^k3ux$/, replacement: resolve(K3UX_SRC, 'index.ts') },
    ]
  : [];

const fsAllow = [resolve(__dirname, '../..')];
if (HAS_K3UX) fsAllow.push(resolve(__dirname, '../../../k3ux'));

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    /* One Lit graph for app + sibling k3ux (peer lit lives in k3ui node_modules). */
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
  preview: {
    port: 4174,
    strictPort: true,
    host: true,
  },
  base: './',
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
});