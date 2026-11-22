import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

/* Workspace install: Lit is hoisted to the monorepo root, so resolve it instead of
   hard-coding <package>/node_modules/lit. */
const litRoot = dirname(createRequire(import.meta.url).resolve('lit'));

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@k3ux': resolve(__dirname, '../src'),
      /* Dev: peer from sibling package source + CSS entry. */
      'k3ui/k3ui.css': resolve(__dirname, '../../k3ui/src/styles/k3ui.scss'),
      k3ui: resolve(__dirname, '../../k3ui/src/index.ts'),
      lit: litRoot,
    },
  },
  server: {
    port: 5180,
    open: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    outDir: resolve(__dirname, '../dist-playground'),
    emptyOutDir: true,
  },
});
