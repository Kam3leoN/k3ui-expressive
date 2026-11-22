/*
 * On-demand build → dist/lazy/
 *   k3ui.js                 base (init, theme, registry, i18n, core helpers)
 *   components/k3-*.js      one entry per element; imports what it renders
 *   chunks/*.js             shared code, loaded once
 *   pack.js                 entry re-bundled by the pack builder page
 *   components.json         tag → files / deps / sizes (pack builder)
 *   k3ui.d.ts               types of dist/k3ui.d.ts minus the full-bundle extras
 * The single-file dist/k3ui.js (vite.config.ts) is unchanged.
 */
import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { skipStylesheet, stripDocLocales } from './scripts/build-plugins.mjs';
import {
  LAZY_OMITTED_EXPORTS,
  closure,
  readCatalog,
  readDeps,
  sourceFile,
} from './scripts/registry-graph.mjs';

const catalog = readCatalog();
const deps = readDeps();
const byTag = new Map(catalog.map((c) => [c.tag, c]));
/*
 * `components/k3-select.js` = its children first, then the element itself.
 * Entry sources are generated in .temp/ (git-ignored) — plain files keep the
 * lib build and its sourcemaps simple.
 */
const ENTRY_DIR = resolve(__dirname, '.temp/lazy-entries');
mkdirSync(ENTRY_DIR, { recursive: true });
for (const { tag } of catalog) {
  /* Relative specifiers — the generated files work from any checkout path / OS. */
  const spec = (t: string): string =>
    JSON.stringify(relative(ENTRY_DIR, sourceFile(byTag.get(t)!)).replace(/\\/g, '/'));
  const children = closure([tag], catalog, deps)
    .filter((t) => t !== tag)
    .map((t) => `import ${spec(t)};`);
  writeFileSync(
    resolve(ENTRY_DIR, `${tag}.ts`),
    `${children.join('\n')}\nexport * from ${spec(tag)};\nexport { default } from ${spec(tag)};\n`,
  );
}

/*
 * Chunk layout — few requests instead of one file per shared module:
 *   base    everything `k3ui/lazy` imports statically (downloaded once, first)
 *   kit     helpers only components use (focus, positioning, Lit directives…)
 *   shapes  Material shape paths + morphing (shape-chip, loading-indicator)
 *   …       one chunk per component module (Rollup default)
 */
const LAZY_ENTRY = resolve(__dirname, 'src/lazy.ts');
const ENTRY_ID = LAZY_ENTRY.replace(/\\/g, '/');
let baseModules: Set<string> | null = null;

function chunkOf(
  id: string,
  getModuleInfo: (id: string) => { importedIds: readonly string[] } | null,
): string | undefined {
  if (!baseModules) {
    baseModules = new Set();
    const walk = (mod: string): void => {
      if (baseModules!.has(mod)) return;
      baseModules!.add(mod);
      for (const next of getModuleInfo(mod)?.importedIds ?? []) walk(next);
    };
    walk(ENTRY_ID);
  }
  const file = id.replace(/\\/g, '/');
  if (file === ENTRY_ID || file.endsWith('/src/pack.ts')) return undefined;
  if (baseModules.has(file)) return 'base';
  if (file.includes('/src/shapes/') || file.includes('/material-shapes-ts/')) return 'shapes';
  if (file.includes('/.temp/lazy-entries/')) return undefined;
  if (!file.includes('/src/components/') || file.endsWith('/src/components/_shared.ts')) return 'kit';
  return undefined;
}

/** dist/lazy/components.json — what a pack configurator needs to know. */
function componentsManifest(): Plugin {
  return {
    name: 'k3ui-components-manifest',
    /* After the files are written: sizes and imports are read from the real output. */
    writeBundle(options, bundle) {
      const outDir = options.dir!;
      const chunks = new Map<string, { imports: string[]; gzip: number; size: number }>();
      /** Source module → file that holds it (target of the catalog's dynamic import). */
      const chunkOfModule = new Map<string, string>();
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        const code = readFileSync(resolve(outDir, item.fileName), 'utf8');
        const imports = [...code.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g)].map((m) =>
          posix.join(posix.dirname(item.fileName), m[1]!),
        );
        chunks.set(item.fileName, { imports, gzip: gzipSync(code).length, size: Buffer.byteLength(code) });
        for (const id of Object.keys(item.modules)) chunkOfModule.set(id.replace(/\\/g, '/'), item.fileName);
      }
      const reach = (file: string, seen = new Set<string>()): Set<string> => {
        if (seen.has(file) || !chunks.has(file)) return seen;
        seen.add(file);
        for (const next of chunks.get(file)!.imports) reach(next, seen);
        return seen;
      };
      const size = (files: Iterable<string>): number =>
        [...files].reduce((sum, f) => sum + chunks.get(f)!.gzip, 0);
      const base = reach('k3ui.js');
      const own = new Map(
        catalog.map((c) => [c.tag, chunkOfModule.get(sourceFile(c).replace(/\\/g, '/'))!]),
      );
      const componentChunks = new Set(own.values());
      const components = Object.fromEntries(
        catalog.map((c) => {
          const { tag } = c;
          const file = `components/${tag}.js`;
          const extra = [...reach(file)].filter((f) => !base.has(f) && f !== file);
          return [
            tag,
            {
              file,
              /** Folder under src/components — the family shown by the pack builder. */
              group: c.file.split('/')[0],
              /** Chunk with the element's own code. */
              chunk: own.get(tag),
              /** Shared helper chunks it needs (not the base, not another element). */
              shared: extra.filter((f) => !componentChunks.has(f)),
              /** Elements it renders (direct) and everything a pack must include. */
              deps: deps[tag] ?? [],
              requires: closure([tag], catalog, deps).filter((t) => t !== tag),
              /** Bytes (gzip) fetched on top of the base when used alone. */
              gzip: size(extra),
            },
          ];
        }),
      );
      const files = Object.fromEntries(
        [...chunks]
          .filter(([f]) => f.startsWith('chunks/'))
          .map(([f, c]) => [f, { gzip: c.gzip, size: c.size }]),
      );
      const version = (JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as { version: string })
        .version;
      /* Local declarations win over `export *`: the omitted values type as `never`. */
      writeFileSync(
        resolve(outDir, 'k3ui.d.ts'),
          `export * from '../k3ui.js';\n` +
          LAZY_OMITTED_EXPORTS.map(
            (name) =>
              `/** Not part of \`k3ui/lazy\` (embeds component code) — see README › On-demand loading. */\n` +
              `export declare const ${name}: never;\n`,
          ).join(''),
      );
      writeFileSync(
        resolve(outDir, 'components.json'),
        `${JSON.stringify(
          {
            version,
            base: { file: 'k3ui.js', pack: 'pack.js', gzip: size(base), files: [...base].filter((f) => f !== 'k3ui.js') },
            components,
            files,
          },
          null,
          2,
        )}\n`,
      );
    },
  };
}

export default defineConfig({
  define: { __K3UI_LIB__: 'true' },
  plugins: [
    skipStylesheet(),
    stripDocLocales(),
    componentsManifest(),
  ],
  resolve: {
    alias: {
      '@k3ui': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/lazy',
    emptyOutDir: true,
    lib: {
      entry: {
        k3ui: LAZY_ENTRY,
        /* Entry the pack builder page re-bundles (default `components: 'all'`). */
        pack: resolve(__dirname, 'src/pack.ts'),
        ...Object.fromEntries(catalog.map(({ tag }) => [`components/${tag}`, resolve(ENTRY_DIR, `${tag}.ts`)])),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        manualChunks: (id, { getModuleInfo }) => chunkOf(id, getModuleInfo),
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
  },
});
