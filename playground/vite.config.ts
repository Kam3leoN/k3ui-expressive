import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

/* Default playground locale — static HTML ships its strings so the first paint
   is final (no English → French swap after boot, which delayed LCP). */
const DEFAULT_LOCALE = 'fr';
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function prerenderI18n(html: string): string {
  const dict = JSON.parse(
    readFileSync(resolve(__dirname, `../src/i18n/locales/${DEFAULT_LOCALE}.json`), 'utf8'),
  ) as Record<string, string>;
  /* Leaf elements only — same rule as applyPlaygroundI18n() (no element children) */
  return html.replace(
    /(<([a-z0-9-]+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (m, open: string, _tag: string, key: string, _text: string, close: string) =>
      key in dict ? `${open}${escapeHtml(dict[key]!)}${close}` : m,
  );
}

export default defineConfig({
  root: resolve(__dirname),
  publicDir: resolve(__dirname, 'public'),
  plugins: [
    tailwindcss(),
    {
      name: 'k3-lh-html',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          const bundle = ctx.bundle;
          if (!bundle) return html;
          let out = prerenderI18n(html);
          const font = Object.keys(bundle).find((k) =>
            k.includes('google-sans-latin-400-normal'),
          );
          /* Only the text font is preloaded: icon glyphs and the app bundle load
             after first paint, so nothing competes with LCP on slow networks. */
          for (const asset of [font]) {
            if (!asset) continue;
            out = out.replace(
              '</head>',
              `    <link rel="preload" href="/${asset}" as="font" type="font/woff2" crossorigin />\n  </head>`,
            );
          }
          return out;
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true /* fail if busy — avoid drifting to 5174/5177 */,
    open: false,
    /* Bind IPv4+IPv6 so localhost is not stolen by another app on ::1 */
    host: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
    modulePreload: {
      resolveDependencies(_filename, deps) {
        /* Do not preload heavy demo chunks on first navigation */
        return deps.filter(
          (d) => !d.includes('shapes-') && !d.includes('mcu-') && !d.includes('loading-indicator'),
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('material-color-utilities')) return 'mcu';
          if (id.includes('material-shapes') || id.includes('/shapes/')) return 'shapes';
          if (id.includes('node_modules/lit')) return 'lit';
        },
      },
    },
  },
});
