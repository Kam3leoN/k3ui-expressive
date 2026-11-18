import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { HAS_K3UX, K3UX_SRC } from './scripts/k3ux-sibling.mjs';

const k3uxEntry = HAS_K3UX
  ? resolve(__dirname, '../k3ux/src/index.ts')
  : resolve(__dirname, 'playground/stubs/k3ux-peer-stub.ts');

const fsAllow = [resolve(__dirname)];
if (HAS_K3UX) fsAllow.push(resolve(__dirname, '../k3ux'));

export default defineConfig({
  define: {
    'import.meta.env.VITE_K3UX_SIBLING': JSON.stringify(HAS_K3UX ? '1' : '0'),
  },
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, 'src'),
      ...(HAS_K3UX
        ? {
            '@k3ux': K3UX_SRC,
            k3ux: k3uxEntry,
          }
        : {
            k3ux: k3uxEntry,
          }),
      /* Peer resolve for @k3ux sources that import 'k3ui'. */
      k3ui: resolve(__dirname, 'src/index.ts'),
    },
  },
  server: {
    fs: {
      allow: fsAllow,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'apps/*/tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    css: true,
    server: {
      deps: {
        /* MCU 0.4.0 ships extension-less relative ESM imports Node cannot resolve —
           let Vite transform it like in the browser build. */
        inline: [/@material\/material-color-utilities/],
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
});