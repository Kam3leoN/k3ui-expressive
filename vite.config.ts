import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    tailwindcss(),
    dts({
      include: ['src'],
      outDir: 'dist',
      rollupTypes: true,
      entryRoot: 'src',
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'K3UI',
      formats: ['es'],
      fileName: () => 'k3ui.js',
    },
    cssCodeSplit: false,
    /* Fonts are copied via build:fonts — never base64 into k3ui.css */
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'k3ui.css';
          return assetInfo.name ?? 'asset';
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
  },
});
