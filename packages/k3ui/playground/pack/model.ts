/**
 * Pack builder — pure logic (selection, dependencies, sizes, URL hash).
 * Data comes from dist/lazy/components.json (vite.lazy.config.ts).
 */

export interface ManifestComponent {
  file: string;
  /** Folder under src/components (actions, inputs…). */
  group: string;
  /** Chunk with the element's own code. */
  chunk: string;
  /** Helper chunks it needs besides the base and other elements. */
  shared: string[];
  deps: string[];
  /** Everything a pack must include with it (transitive). */
  requires: string[];
  gzip: number;
}

export interface Manifest {
  version: string;
  base: { file: string; pack: string; gzip: number; files: string[] };
  components: Record<string, ManifestComponent>;
  files: Record<string, { gzip: number; size: number }>;
}

export interface Selection {
  /** Checked by the user, catalog order. */
  explicit: string[];
  /** Explicit + dependencies, catalog order — what the pack holds. */
  included: string[];
  /** Dependency → the selected components that need it. */
  requiredBy: Map<string, string[]>;
}

/** Uncompressed (`raw`) + gzip bytes for a pack slice. */
export interface ByteSize {
  raw: number;
  gzip: number;
}

export interface Totals {
  base: ByteSize;
  components: ByteSize;
  shared: ByteSize;
  total: ByteSize;
  /** Base + every component — the on-demand equivalent of the full library. */
  everything: ByteSize;
  /** How many catalog tags are in this selection / in the full library. */
  count: number;
  everythingCount: number;
}

export type PackProduct = 'k3ui' | 'k3ux';

export const GROUP_ORDER = [
  'actions',
  'inputs',
  'feedback',
  'containment',
  'navigation',
  'pickers',
  'theme',
  'animation',
  'charts',
  'media',
];

export function packProductFromSearch(search: string): PackProduct {
  return new URLSearchParams(search).get('product') === 'k3ux' ? 'k3ux' : 'k3ui';
}

const TAG = /^k3-[a-z0-9-]+$/;

export function isManifest(value: unknown): value is Manifest {
  const m = value as Manifest | null;
  return (
    !!m &&
    typeof m === 'object' &&
    typeof m.version === 'string' &&
    typeof m.base?.gzip === 'number' &&
    typeof m.base?.pack === 'string' &&
    !!m.components &&
    typeof m.components === 'object' &&
    !!m.files &&
    typeof m.files === 'object'
  );
}

/** `select` → `k3-select` (empty string when it cannot be a tag). */
export function normalizeTag(name: string): string {
  const tag = name.trim().toLowerCase();
  const full = tag.startsWith('k3-') ? tag : `k3-${tag}`;
  return TAG.test(full) ? full : '';
}

/** Known tags of `names`, deduplicated, in catalog order. */
function known(manifest: Manifest, names: Iterable<string>): string[] {
  const wanted = new Set([...names].map(normalizeTag));
  return Object.keys(manifest.components).filter((tag) => wanted.has(tag));
}

/** `#components=select+dialog` → tags the manifest knows (anything else is dropped). */
export function parseHash(hash: string, manifest: Manifest): string[] {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  /* `+` separates names (Prism style); URLSearchParams decodes it as a space. */
  const names = (params.get('components') ?? '').split(/[\s+,]+/).filter(Boolean);
  return known(manifest, names);
}

export function formatHash(tags: readonly string[]): string {
  return tags.length ? `#components=${tags.map((t) => t.replace(/^k3-/, '')).join('+')}` : '';
}

/**
 * Selection from the SPA URL (`?components=…#/pack`) or a legacy pack.html hash.
 */
export function parseLocationSelection(manifest: Manifest, loc: Location = location): string[] {
  const fromQuery = new URLSearchParams(loc.search).get('components');
  if (fromQuery) return known(manifest, fromQuery.split(/[\s+,]+/).filter(Boolean));
  if (/components=/i.test(loc.hash)) return parseHash(loc.hash, manifest);
  return [];
}

/**
 * Shareable SPA link: `/?components=select+dialog#/pack`.
 * Legacy `product=k3ux` is omitted in the unified builder (both packs on one page).
 */
export function formatPackHref(
  tags: readonly string[],
  _product: PackProduct | 'unified' = 'k3ui',
  origin = '',
): string {
  const params = new URLSearchParams();
  if (tags.length) params.set('components', tags.map((t) => t.replace(/^k3-/, '')).join(' '));
  const q = params.toString().replace(/%20/g, '+');
  const base = origin ? `${origin.replace(/\/$/, '')}/` : '/';
  return `${base}${q ? `?${q}` : ''}#/pack`;
}

/** Tags from the URL that appear in either manifest (k3ui first, then k3ux). */
export function parseLocationSelectionDual(
  ui: Manifest,
  ux: Manifest | null,
  loc: Location = location,
): string[] {
  const fromQuery = new URLSearchParams(loc.search).get('components');
  const names = fromQuery
    ? fromQuery.split(/[\s+,]+/).filter(Boolean)
    : /components=/i.test(loc.hash)
      ? (new URLSearchParams(loc.hash.replace(/^#/, '')).get('components') ?? '')
          .split(/[\s+,]+/)
          .filter(Boolean)
      : [];
  const uiTags = Object.keys(ui.components).filter((t) =>
    names.map(normalizeTag).includes(t),
  );
  const uxTags = ux
    ? Object.keys(ux.components).filter((t) => names.map(normalizeTag).includes(t))
    : [];
  return [...uiTags, ...uxTags];
}

export function resolveSelection(manifest: Manifest, names: Iterable<string>): Selection {
  const explicit = known(manifest, names);
  const requiredBy = new Map<string, string[]>();
  const all = new Set(explicit);
  for (const tag of explicit) {
    for (const dep of manifest.components[tag]!.requires) {
      if (!(dep in manifest.components)) continue;
      all.add(dep);
      if (!explicit.includes(dep)) requiredBy.set(dep, [...(requiredBy.get(dep) ?? []), tag]);
    }
  }
  return { explicit, included: Object.keys(manifest.components).filter((t) => all.has(t)), requiredBy };
}

/** Gzip size of a component's own chunk — the number shown on its row. */
export function ownSize(manifest: Manifest, tag: string): number {
  const c = manifest.components[tag];
  return c ? (manifest.files[c.chunk]?.gzip ?? 0) : 0;
}

function sumDim(manifest: Manifest, files: Iterable<string>, dim: 'gzip' | 'size'): number {
  let n = 0;
  for (const f of files) n += manifest.files[f]?.[dim] ?? 0;
  return n;
}

function pair(manifest: Manifest, files: Iterable<string>): ByteSize {
  const list = [...files];
  return { raw: sumDim(manifest, list, 'size'), gzip: sumDim(manifest, list, 'gzip') };
}

function add(a: ByteSize, b: ByteSize): ByteSize {
  return { raw: a.raw + b.raw, gzip: a.gzip + b.gzip };
}

/** base + components + shared = total (each file counted once) — raw and gzip. */
export function totals(manifest: Manifest, included: readonly string[]): Totals {
  const measure = (tags: readonly string[]): { components: ByteSize; shared: ByteSize } => {
    const own = new Set<string>();
    const shared = new Set<string>();
    for (const tag of tags) {
      const c = manifest.components[tag];
      if (!c) continue;
      own.add(c.chunk);
      for (const f of c.shared) shared.add(f);
    }
    for (const f of own) shared.delete(f);
    return { components: pair(manifest, own), shared: pair(manifest, shared) };
  };
  const catalog = Object.keys(manifest.components);
  const mine = measure(included);
  const all = measure(catalog);
  const baseFiles = manifest.base.files?.length
    ? manifest.base.files
    : Object.keys(manifest.files).filter((f) => f.includes('/base') || f === manifest.base.file);
  const baseFromFiles = pair(manifest, baseFiles);
  const base: ByteSize = {
    raw: baseFromFiles.raw || manifest.base.gzip,
    gzip: baseFromFiles.gzip || manifest.base.gzip,
  };
  return {
    base,
    ...mine,
    total: add(base, add(mine.components, mine.shared)),
    everything: add(base, add(all.components, all.shared)),
    count: included.length,
    everythingCount: catalog.length,
  };
}

/** Chunks of every component that is *not* in the pack — their dynamic imports are cut. */
export function excludedChunks(manifest: Manifest, included: readonly string[]): Set<string> {
  const keep = new Set(included.map((t) => manifest.components[t]?.chunk));
  const out = new Set<string>();
  for (const c of Object.values(manifest.components)) if (!keep.has(c.chunk)) out.add(c.chunk);
  return out;
}

/** Same pack from a clone of the repository. */
export function cliCommand(explicit: readonly string[], product: PackProduct = 'k3ui'): string {
  const tags = explicit.map((t) => t.replace(/^k3-/, '')).join(' ');
  if (product === 'k3ux') {
    return `npm run build:pack --prefix ../k3ux -- ${tags}`.trim();
  }
  return `npm run build:pack -- ${tags}`.trim();
}

export function formatKb(bytes: number, locale = 'en'): string {
  const kb = bytes / 1024;
  return `${kb.toLocaleString(locale, { minimumFractionDigits: kb < 100 ? 1 : 0, maximumFractionDigits: kb < 100 ? 1 : 0 })} kB`;
}

/** AiO / custom / generic — derived from the download stem (`k3ui.full`, `.custom`, …). */
export function packKindLabel(name: string): string {
  if (/\.full$/i.test(name)) return 'AiO pack';
  if (/\.custom$/i.test(name)) return 'custom pack';
  return 'pack';
}

/** Banner + `globalThis.K3UI_PACK` / `K3UX_PACK` — same shape as the CLI builders. */
export function packHeader(
  info: { name: string; version: string; components: readonly string[]; builder: string },
  product: PackProduct = 'k3ui',
): {
  banner: string;
  intro: string;
} {
  const brand = product === 'k3ux' ? 'K3UX' : 'K3UI';
  const globalName = product === 'k3ux' ? 'K3UX_PACK' : 'K3UI_PACK';
  const url = formatPackHref(info.components, product, info.builder.replace(/\/?#.*$/, '').replace(/\?.*$/, '') || 'https://k3ui-expressive.vercel.app');
  const kind = packKindLabel(info.name);
  return {
    /* One line — pack downloads stay GSAP-dense (no banner line-break). */
    banner: `/*! ${brand} ${info.version} — ${kind} "${info.name}" (${info.components.length} components) ${url} */`,
    intro: `globalThis.${globalName}=${JSON.stringify(info)};`,
  };
}
