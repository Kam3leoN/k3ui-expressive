/**
 * Vite plugins shared by the on-demand build and the custom pack builder.
 */
import { readCatalog } from './registry-graph.mjs';

const norm = (id) => id.replace(/\\/g, '/').split('?')[0];

/**
 * The locale files also hold the documentation site strings (`doc.*`,
 * `playground.*` ≈ 80 % of each catalog). Library builds that opt in drop
 * them; `doc.colors.group.*` stays (labels of `COLOR_ROLE_GROUPS`).
 */
export function stripDocLocales() {
  return {
    name: 'k3ui-strip-doc-locales',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/src\/i18n\/locales\/[\w-]+\.json$/.test(norm(id))) return null;
      const dict = JSON.parse(code);
      const kept = Object.fromEntries(
        Object.entries(dict).filter(
          ([key]) =>
            key.startsWith('doc.colors.group.') ||
            !(key.startsWith('doc.') || key.startsWith('playground.')),
        ),
      );
      return { code: JSON.stringify(kept), map: null };
    },
  };
}

/** Styles ship once as dist/k3ui.css — secondary builds skip the stylesheet. */
export function skipStylesheet() {
  return {
    name: 'k3ui-skip-stylesheet',
    enforce: 'pre',
    load(id) {
      return /\/src\/styles\/k3ui\.scss$/.test(norm(id)) ? '' : null;
    },
  };
}

/**
 * Custom packs: the catalog keeps every tag (the registry can then say
 * "k3-select is not in your pack") but only the selected ones carry code.
 */
export function filterCatalog(tags) {
  const keep = new Set(tags);
  return {
    name: 'k3ui-filter-catalog',
    enforce: 'pre',
    load(id) {
      if (!/\/src\/registry\/catalog\.ts$/.test(norm(id))) return null;
      const rows = readCatalog().map((c) =>
        keep.has(c.tag)
          ? `  { tag: '${c.tag}', load: () => import('../components/${c.file}.js') },`
          : `  { tag: '${c.tag}', load: excluded },`,
      );
      return (
        `const excluded = () => Promise.resolve({ default: null });\n` +
        `export const catalog = [\n${rows.join('\n')}\n];\nexport const allTags = catalog.map((c) => c.tag);\n`
      );
    },
  };
}

/** AiO / custom / generic — same rule as playground/pack/model.ts. */
export function packKindLabel(name) {
  if (/\.full$/i.test(name)) return 'AiO pack';
  if (/\.custom$/i.test(name)) return 'custom pack';
  return 'pack';
}

/** Banner + `globalThis.K3UI_PACK` — how a pack describes itself to the registry. */
export function packHeader({ name, version, components, builder }) {
  const info = { name, version, components, builder };
  const root = String(builder).split('#')[0] || 'https://k3ui-expressive.vercel.app/';
  const tags = components.map((t) => t.slice(3)).join('+');
  const url = `${root}${root.includes('?') ? '&' : '?'}components=${tags}#/pack`.replace(
    '?&',
    '?',
  );
  const kind = packKindLabel(name);
  return {
    banner: `/*! K3UI ${version} — ${kind} "${name}" (${components.length} components) ${url} */`,
    intro: `globalThis.K3UI_PACK=${JSON.stringify(info)};`,
  };
}
