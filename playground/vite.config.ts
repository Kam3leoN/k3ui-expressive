import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { build as esbuild } from 'esbuild';
import {
  DEFAULT_THEME,
  THEME_CACHE_KEY,
  THEME_SEEDS,
  THEME_STORE_KEYS,
  THEME_STORE_PREFIX,
} from './theme-defaults.js';

/* Default playground locale — static HTML ships its strings so the first paint
   is final (no English → French swap after boot, which delayed LCP). */
const DEFAULT_LOCALE = 'fr';
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/*
 * Strip source comments and indentation-only text between tags (build only).
 * pre / code / textarea / script / style keep their content byte-for-byte, and
 * attribute values are never touched — rendered text is identical.
 */
function compactHtml(html: string): string {
  const kept: string[] = [];
  const guarded = html.replace(/<(pre|code|textarea|script|style)\b[\s\S]*?<\/\1>/gi, (m) => {
    kept.push(m);
    return `\u0000${kept.length - 1}\u0000`;
  });
  return guarded
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>([^<]*)</g, (_m, text: string) => `>${text.replace(/\n[ \t]+/g, '\n')}<`)
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => kept[Number(i)]!);
}

/*
 * Default theme computed at build: the first paint already has the colours the
 * app applies at boot. Only used when the visitor kept the default settings
 * (stored under k3ui.doc.theme.*) — a customised theme still comes from JS.
 */
/*
 * The theme API is bundled with esbuild before use: MCU 0.4.0 ships extension-less
 * relative ESM imports that Node cannot load directly (bundlers resolve them).
 */
type ThemeModule = typeof import('../src/theme/apply.js');
let themeModule: Promise<ThemeModule> | undefined;
function loadThemeModule(): Promise<ThemeModule> {
  themeModule ??= esbuild({
    entryPoints: [resolve(__dirname, '../src/theme/apply.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  }).then(
    (out) =>
      import(
        `data:text/javascript;base64,${Buffer.from(out.outputFiles[0]!.text).toString('base64')}`
      ) as Promise<ThemeModule>,
  );
  return themeModule;
}

async function prepaintTheme(): Promise<string> {
  const { AUTO_LIGHT_END_H, AUTO_LIGHT_START_H, themeCssVars } = await loadThemeModule();
  const seed = THEME_SEEDS[DEFAULT_THEME.seedIdx];
  const vars = themeCssVars({
    seed,
    dark: DEFAULT_THEME.mode !== 'light',
    variant: DEFAULT_THEME.variant,
    contrast: DEFAULT_THEME.contrast,
  });
  const css = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  const defaults = { ...DEFAULT_THEME, seed };
  /*
   * 1. Returning visitor: replay the variables the app cached last time, when the
   *    stored settings and the resolved light/dark mode still match.
   * 2. Default settings: use the build-time theme above.
   * 3. Otherwise: static tokens until the app applies the theme (unchanged behaviour).
   */
  const script =
    `(function(){var r=document.documentElement,P=${JSON.stringify(THEME_STORE_PREFIX)};try{` +
    `var c=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_CACHE_KEY)})||'null');` +
    `var s=JSON.stringify(${JSON.stringify(THEME_STORE_KEYS)}.map(function(k){return localStorage.getItem(P+k)}));` +
    `if(c&&c.settings===s&&c.vars){var v=localStorage.getItem(P+'mode'),m=v?JSON.parse(v):${JSON.stringify(DEFAULT_THEME.mode)},h=new Date().getHours();` +
    `var d=m==='dark'||m==='light'?m:m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(h>=${AUTO_LIGHT_START_H}&&h<${AUTO_LIGHT_END_H}?'light':'dark');` +
    `if(c.mode===d){for(var k in c.vars)r.style.setProperty(k,c.vars[k]);if(c.scheme)r.style.colorScheme=c.scheme;r.setAttribute('data-k3-color-mode',d);return}}` +
    `var e=${JSON.stringify(defaults)};for(var n in e){var x=localStorage.getItem(P+n);` +
    `if(x!==null&&String(JSON.parse(x)).toLowerCase()!==String(e[n]).toLowerCase())return}}catch(z){}` +
    `r.setAttribute('data-k3-prepaint','')})()`;
  return `    <style>html[data-k3-prepaint]{${css}}</style>\n    <script>${script}</script>\n`;
}

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
        async handler(html, ctx) {
          const bundle = ctx.bundle;
          if (!bundle) return html;
          let out = compactHtml(prerenderI18n(html)).replace('</head>', `${await prepaintTheme()}  </head>`);
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
