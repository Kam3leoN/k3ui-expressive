import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

/* Workspace install: Lit is hoisted to the monorepo root, so resolve it instead of
   hard-coding <package>/node_modules/lit. */
const litRoot = dirname(createRequire(import.meta.url).resolve('lit'));

export default defineConfig({
  resolve: {
    alias: {
      '@k3ux': resolve(__dirname, 'src'),
      /* Thin peer surface — not the full k3ui catalog. */
      k3ui: resolve(__dirname, 'tests/k3ui-shim.ts'),
      /* One Lit copy for k3ux + shimmed k3ui sources. */
      lit: litRoot,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    css: true,
    server: {
      deps: {
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
