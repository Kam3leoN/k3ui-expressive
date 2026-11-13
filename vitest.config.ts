import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, 'src'),
      '@k3ux': resolve(__dirname, '../k3ux/src'),
      k3ux: resolve(__dirname, '../k3ux/src/index.ts'),
      /* Peer resolve for @k3ux sources that import 'k3ui'. */
      k3ui: resolve(__dirname, 'src/index.ts'),
    },
  },
  server: {
    fs: {
      allow: [resolve(__dirname), resolve(__dirname, '../k3ux')],
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
