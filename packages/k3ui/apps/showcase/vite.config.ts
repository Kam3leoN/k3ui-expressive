import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(__dirname);
const k3src = resolve(__dirname, '../../src');
const litRoot = resolve(__dirname, '../../node_modules/lit');

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
    alias: [
      { find: '@k3ui', replacement: k3src },
      { find: /^k3ui$/, replacement: resolve(__dirname, '../../src/index.ts') },
      { find: /^lit$/, replacement: litRoot },
      { find: /^lit\//, replacement: `${litRoot}/` },
    ],
  },
  server: {
    port: 5175,
    strictPort: true,
    open: false,
    host: true,
    fs: {
      allow: [resolve(__dirname, '../..')],
    },
  },
  preview: {
    port: 4175,
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
