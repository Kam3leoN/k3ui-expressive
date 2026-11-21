import { defineConfig, type Plugin } from 'vite';
import { extname, resolve, sep } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build as esbuild } from 'esbuild';
import { lighthouseLive } from './lighthouse-live.js';
import {
  DEFAULT_THEME,
  THEME_CACHE_KEY,
  THEME_SEEDS,
  THEME_STORE_KEYS,
  THEME_STORE_PREFIX,
} from './theme-defaults.js';
import {
  HAS_K3UX,
  K3UX_CSS,
  K3UX_HOLO_SCSS,
  K3UX_LAZY_DIST,
  K3UX_SRC,
} from '../scripts/k3ux-sibling.mjs';
import { k3uxOptional } from '../scripts/k3ux-optional.mjs';

const K3UX_ENTRY = HAS_K3UX
  ? resolve(__dirname, '../../k3ux/src/index.ts')
  : resolve(__dirname, 'stubs/k3ux-peer-stub.ts');
const K3UX_HOLO = HAS_K3UX ? K3UX_HOLO_SCSS : resolve(__dirname, 'stubs/k3ux-empty.scss');

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
    specVersion: DEFAULT_THEME.spec,
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

function loadPlaygroundLocaleDict(loc: string): Record<string, string> {
  const lib = JSON.parse(
    readFileSync(resolve(__dirname, `../src/i18n/locales/${loc}.json`), 'utf8'),
  ) as Record<string, string>;
  const docPath = resolve(__dirname, `i18n/${loc}.json`);
  if (!existsSync(docPath)) return lib;
  const doc = JSON.parse(readFileSync(docPath, 'utf8')) as Record<string, string>;
  return { ...lib, ...doc };
}

function prerenderI18n(html: string): string {
  const dict = loadPlaygroundLocaleDict(DEFAULT_LOCALE);
  /* Leaf elements only — same rule as applyPlaygroundI18n() (no element children) */
  return html.replace(
    /(<([a-z0-9-]+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (m, open: string, _tag: string, key: string, _text: string, close: string) =>
      key in dict ? `${open}${escapeHtml(dict[key]!)}${close}` : m,
  );
}

/*
 * Every doc page except the active one (home) leaves index.html: the bodies go
 * to a JSON file (`{ pageId: html }`) the app fetches after first paint and
 * stamps one page per task. The first frame only downloads, parses, styles and
 * upgrades the shell + home (HTML ≈ 490 kB → ≈ 90 kB). Empty `<article>`s stay
 * as anchors, so routing and `data-page` lookups are unchanged.
 */
const PAGES_META = 'k3-doc-pages';
let deferredPages: { json: string; url: string } | null = null;

function deferInactivePages(html: string, build: boolean): string {
  const pages: Record<string, string> = {};
  const out = html.replace(
    /(<article class="comp-page"(?![^>]*\bis-active\b)[^>]*\bdata-page="([^"]+)"[^>]*>)([\s\S]*?)(<\/article>)/g,
    (_m, open: string, id: string, body: string, close: string) => {
      pages[id] = body;
      return `${open}${close}`;
    },
  );
  const json = JSON.stringify(pages);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 10);
  const url = build ? `/assets/doc-pages-${hash}.json` : '/@k3-doc-pages.json';
  deferredPages = { json, url };
  return out.replace('</head>', `    <meta name="${PAGES_META}" content="${url}" />\n  </head>`);
}

/*
 * Pack builder (pack.html): on-demand builds served next to the site as
 * /k3ui-lazy/ and /k3ux-lazy/ — the page reads components.json and re-bundles
 * chunks in the browser. `build:playground` builds both first.
 */
const LAZY_DIST = resolve(__dirname, '../dist/lazy');
const K3UI_CSS = resolve(__dirname, '../dist/k3ui.css');
const LAZY_MIME: Record<string, string> = {
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
};

function serveLazyTree(mount: string, dist: string, hint: string): (req: import('http').IncomingMessage, res: import('http').ServerResponse) => void {
  return (req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]!).replace(/^\/+/, '');
    const file = resolve(dist, rel);
    const type = LAZY_MIME[extname(file)];
    if (!type || !file.startsWith(dist + sep) || !existsSync(file)) {
      res.statusCode = 404;
      res.end(`Not found — ${hint}`);
      return;
    }
    res.setHeader('Content-Type', type);
    res.end(readFileSync(file));
  };
}

function packBuilderAssets(): Plugin {
  return {
    name: 'k3-pack-builder-assets',
    configureServer(server) {
      server.middlewares.use(
        '/k3ui-lazy',
        serveLazyTree('/k3ui-lazy', LAZY_DIST, 'run `npm run build:lazy`'),
      );
      if (HAS_K3UX) {
        server.middlewares.use(
          '/k3ux-lazy',
          serveLazyTree('/k3ux-lazy', K3UX_LAZY_DIST, 'run `npm run build:lazy` in k3ux'),
        );
      }
      /* Built stylesheets for pack embed (minify + inject into .full.js / .custom.js). */
      server.middlewares.use('/k3ui-pack/k3ui.css', (_req, res) => {
        if (!existsSync(K3UI_CSS)) {
          res.statusCode = 404;
          res.end('Not found — run `npm run build` (dist/k3ui.css)');
          return;
        }
        res.setHeader('Content-Type', 'text/css');
        res.end(readFileSync(K3UI_CSS));
      });
      if (HAS_K3UX) {
        server.middlewares.use('/k3ux-pack/k3ux.css', (_req, res) => {
          if (!existsSync(K3UX_CSS)) {
            res.statusCode = 404;
            res.end('Not found — run `npm run build` in k3ux (dist/k3ux.css)');
            return;
          }
          res.setHeader('Content-Type', 'text/css');
          res.end(readFileSync(K3UX_CSS));
        });
      }
    },
    writeBundle(options) {
      if (!options.dir) return;
      if (!existsSync(resolve(LAZY_DIST, 'components.json'))) {
        this.error('dist/lazy is missing — run `npm run build:lazy` before the playground build');
      }
      if (HAS_K3UX) {
        if (!existsSync(resolve(K3UX_LAZY_DIST, 'components.json'))) {
          this.error(
            'k3ux/dist/lazy is missing — run `npm run build:lazy` in the sibling k3ux package',
          );
        }
        cpSync(K3UX_LAZY_DIST, resolve(options.dir, 'k3ux-lazy'), {
          recursive: true,
          filter: (src) => !/\.(map|d\.ts)$/.test(src),
        });
      }
      cpSync(LAZY_DIST, resolve(options.dir, 'k3ui-lazy'), {
        recursive: true,
        filter: (src) => !/\.(map|d\.ts)$/.test(src),
      });
      if (existsSync(K3UI_CSS)) {
        mkdirSync(resolve(options.dir, 'k3ui-pack'), { recursive: true });
        cpSync(K3UI_CSS, resolve(options.dir, 'k3ui-pack/k3ui.css'));
      }
      if (existsSync(K3UX_CSS)) {
        mkdirSync(resolve(options.dir, 'k3ux-pack'), { recursive: true });
        cpSync(K3UX_CSS, resolve(options.dir, 'k3ux-pack/k3ux.css'));
      }
    },
  };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_K3UX_SIBLING': JSON.stringify(HAS_K3UX ? '1' : '0'),
  },
  root: resolve(__dirname),
  publicDir: resolve(__dirname, 'public'),
  plugins: [
    k3uxOptional(),
    tailwindcss(),
    lighthouseLive(),
    packBuilderAssets(),
    {
      name: 'k3-lh-html',
      configureServer(server) {
        /* Dev: serve the page bodies extracted by the last index.html transform */
        server.middlewares.use('/@k3-doc-pages.json', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(deferredPages?.json ?? '{}');
        });
      },
      writeBundle(options) {
        if (!deferredPages || !options.dir) return;
        const file = resolve(options.dir, deferredPages.url.replace(/^\//, ''));
        mkdirSync(resolve(file, '..'), { recursive: true });
        writeFileSync(file, deferredPages.json);
      },
      transformIndexHtml: {
        order: 'post',
        async handler(html, ctx) {
          /* Doc shell only — pack.html is a plain standalone page. */
          if (!/(^|\/)index\.html$/.test(ctx.filename.replace(/\\/g, '/'))) return html;
          const bundle = ctx.bundle;
          const prepaint = await prepaintTheme();
          /* Dev must also inject prepaint — otherwise first paint keeps the static
             SCSS / static fallbacks until JS applies indigo tonalspot. */
          if (!bundle) {
            return deferInactivePages(html, false).replace('</head>', `${prepaint}  </head>`);
          }
          let out = deferInactivePages(compactHtml(prerenderI18n(html)), true).replace(
            '</head>',
            `${prepaint}  </head>`,
          );
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
    /* One Lit graph for playground + sibling k3ux (avoids lit-html _$AT crashes). */
    dedupe: ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'],
    alias: [
      {
        /* Exact package entry — do not swallow k3ux/holo-effects.css */
        find: /^k3ux$/,
        replacement: K3UX_ENTRY,
      },
      {
        find: 'k3ux/holo-effects.css',
        replacement: K3UX_HOLO,
      },
      /* Sibling sources (`@k3ux/…`); without ../k3ux the k3uxOptional plugin serves empty modules. */
      ...(HAS_K3UX ? [{ find: /^@k3ux\//, replacement: `${K3UX_SRC}/` }] : []),
      {
        /* Peer import from k3ux sources — never the built dist (bundled Lit). */
        find: /^k3ui$/,
        replacement: resolve(__dirname, '../src/index.ts'),
      },
      { find: '@k3ui', replacement: resolve(__dirname, '../src') },
      {
        find: /^lit$/,
        replacement: resolve(__dirname, '../node_modules/lit'),
      },
      {
        /* Trailing `/` required: resolve() drops it on Windows → litdecorators.js */
        find: /^lit\//,
        replacement: `${resolve(__dirname, '../node_modules/lit')}/`,
      },
    ],
  },
  /* Pack builder: pre-bundling would break the URL of Rollup's .wasm parser.
   * Force-include MCU so switching the vendored GitHub build (SchemeCmf / 2026)
   * invalidates the esbuild prebundle instead of serving a stale barrel. */
  optimizeDeps: {
    exclude: ['@rollup/browser'],
    include: ['@material/material-color-utilities'],
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
      input: {
        main: resolve(__dirname, 'index.html'),
        pack: resolve(__dirname, 'pack.html'),
      },
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
