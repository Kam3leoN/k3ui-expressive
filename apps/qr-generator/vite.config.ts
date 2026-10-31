import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(__dirname);
const k3src = resolve(__dirname, '../../src');

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    alias: {
      '@k3ui': k3src,
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    host: true,
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
