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

/** Replace the registry catalog with the given tags only (custom packs). */
export function filterCatalog(tags) {
  const keep = new Set(tags);
  return {
    name: 'k3ui-filter-catalog',
    enforce: 'pre',
    load(id) {
      if (!/\/src\/registry\/catalog\.ts$/.test(norm(id))) return null;
      const rows = readCatalog()
        .filter((c) => keep.has(c.tag))
        .map((c) => `  { tag: '${c.tag}', load: () => import('../components/${c.file}.js') },`);
      return `export const catalog = [\n${rows.join('\n')}\n];\nexport const allTags = catalog.map((c) => c.tag);\n`;
    },
  };
}
