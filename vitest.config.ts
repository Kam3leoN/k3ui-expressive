import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, 'src'),
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
