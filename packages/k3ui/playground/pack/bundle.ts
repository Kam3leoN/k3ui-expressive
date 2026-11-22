/**
 * Pack builder (browser) — Rollup + Terser on demand, densify via shared
 * `scripts/pack-minify.mjs` (same transforms as `npm run build:pack`).
 */
import { densifyPackJs, embedCssIntoPack } from '../../scripts/pack-minify.mjs';
import { excludedChunks, packHeader, type Manifest } from './model.js';

export interface BuildOptions {
  manifest: Manifest;
  /** Components the pack holds (selection + dependencies). */
  included: readonly string[];
  /** Folder of the on-demand build, with a trailing slash. */
  baseUrl: string;
  /** Absolute URL of the product stylesheet to embed (minified). */
  cssUrl: string;
  /** Extra stylesheets to embed after `cssUrl` (e.g. k3ux on top of k3ui). */
  extraCssUrls?: readonly string[];
  /** Builder page recorded in the pack (rebuild link of the missing-component guard). */
  builder: string;
  name?: string;
  /** k3ux packs keep peer imports (`k3ui`, `lit`, `chart.js`). */
  product?: 'k3ui' | 'k3ux';
  fetchText?: (url: string) => Promise<string>;
}

const EXCLUDED = '\0k3ui-excluded';

/** Peer packages left external in a k3ux pack (same as the library build). */
function isPeerExternal(source: string): boolean {
  return (
    source === 'k3ui' ||
    source === 'lit' ||
    source === 'chart.js' ||
    source === '@material/material-color-utilities' ||
    source.startsWith('lit/') ||
    source.startsWith('chart.js/')
  );
}

async function defaultFetch(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** `./chunks/x.js` imported from `pack.js` → `chunks/x.js` (never leaves the build folder). */
export function resolveChunk(source: string, importer: string | undefined): string {
  const url = new URL(source, `http://k3ui.pack/${importer ?? ''}`);
  return url.pathname.replace(/^\/+/, '');
}

/* Re-export densify helpers so unit tests / callers can import from one place. */
export {
  compactTemplateBody,
  compactTemplatesInJs,
  cssInjectPreamble,
  densifyPackJs,
  embedCssIntoPack,
  looksLikeCssTemplate,
  minifyCss,
  minifyCssInJs,
  minifyCssWithInterpolations,
  packToOneLine,
} from '../../scripts/pack-minify.mjs';

export async function buildPack(options: BuildOptions): Promise<string> {
  const {
    manifest,
    included,
    baseUrl,
    cssUrl,
    extraCssUrls = [],
    builder,
    product = 'k3ui',
    name = product === 'k3ux' ? 'k3ux.pack' : 'k3ui.pack',
    fetchText = defaultFetch,
  } = options;
  const { rollup } = await import('@rollup/browser');
  const excluded = excludedChunks(manifest, included);
  const bundle = await rollup({
    input: manifest.base.pack,
    onwarn: () => undefined,
    plugins: [
      {
        name: 'k3-pack',
        resolveId(source, importer) {
          if (source === EXCLUDED) return EXCLUDED;
          if (product === 'k3ux' && isPeerExternal(source)) return { id: source, external: true };
          return resolveChunk(source, importer);
        },
        resolveDynamicImport(specifier, importer) {
          if (typeof specifier !== 'string') return null;
          if (product === 'k3ux' && isPeerExternal(specifier)) return { id: specifier, external: true };
          const id = resolveChunk(specifier, importer);
          /* Not in the pack: the registry reports it instead of loading it. */
          return excluded.has(id) ? EXCLUDED : id;
        },
        load(id) {
          if (id === EXCLUDED) return 'export default null;';
          return fetchText(baseUrl + id).then((code) => code.replace(/\n\/\/# sourceMappingURL=.*$/m, ''));
        },
      },
    ],
  });
  const { output } = await bundle.generate({
    format: 'es',
    inlineDynamicImports: true,
    compact: true,
    ...packHeader({ name, version: manifest.version, components: included, builder }, product),
  });
  await bundle.close();

  const sheets = await Promise.all([cssUrl, ...extraCssUrls].map((url) => fetchText(url)));
  /* Densify templates → Terser (strips //) → embed CSS → one-line. */
  const minified = await minifyPack(densifyPackJs(output[0].code));
  return embedCssIntoPack(minified, sheets.join('\n'));
}

/** Minify + mangle locals — safe for Lit / custom elements (no property rename). */
async function minifyPack(code: string): Promise<string> {
  const { minify } = await import('terser');
  const result = await minify(code, {
    module: true,
    ecma: 2022,
    compress: {
      passes: 3,
      toplevel: true,
      pure_getters: true,
      arguments: true,
    },
    mangle: { toplevel: true },
    format: {
      comments: /^!/,
      beautify: false,
      semicolons: true,
      ecma: 2022,
    },
  });
  if (!result.code) throw new Error('Pack minify produced empty output');
  return result.code;
}

/** Gzip size of `text`, when the browser can compress (`null` otherwise). */
export async function gzipSize(text: string): Promise<number | null> {
  if (typeof CompressionStream !== 'function') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}
