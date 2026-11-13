import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(__dirname);
const k3src = resolve(__dirname, '../../src');
const k3uxSrc = resolve(__dirname, '../../../k3ux/src');
const litRoot = resolve(__dirname, '../../node_modules/lit');

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    /* One Lit graph for app + sibling k3ux (peer lit lives in k3ui node_modules). */
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
    alias: [
      { find: '@k3ui', replacement: k3src },
      { find: '@k3ux', replacement: k3uxSrc },
      { find: /^k3ui$/, replacement: resolve(__dirname, '../../src/index.ts') },
      { find: /^k3ux$/, replacement: resolve(__dirname, '../../../k3ux/src/index.ts') },
      { find: /^lit$/, replacement: litRoot },
      /* Trailing `/` required: resolve() drops it on Windows → litdecorators.js */
      { find: /^lit\//, replacement: `${litRoot}/` },
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    host: true,
    fs: {
      allow: [resolve(__dirname, '../..'), resolve(__dirname, '../../../k3ux')],
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
