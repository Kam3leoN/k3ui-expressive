import { HAS_K3UX } from './k3ux-sibling.mjs';

/** Virtual id prefix for `@k3ux/*` requests when the sibling is not checked out. */
const MISSING = '\0k3ux-missing:';
const STYLE = /\.(?:s?css|sass|less)(?:\?|$)/;

/**
 * Vite / Vitest plugin — keeps `@k3ux/*` imports resolvable without `../k3ux`.
 *
 * - Sibling present: does nothing; the real sources come from the `@k3ux`
 *   alias, so k3ux behaves exactly as before.
 * - Sibling absent: every `@k3ux/*` request resolves to an empty module
 *   (empty stylesheet for style requests). Callers guard with
 *   `import.meta.env.VITE_K3UX_SIBLING` or try/catch around dynamic imports.
 */
export function k3uxOptional() {
  return {
    name: 'k3ux-optional',
    enforce: 'pre',
    resolveId(id) {
      if (HAS_K3UX) return null;
      if (id === '@k3ux' || id.startsWith('@k3ux/')) return MISSING + id;
      return null;
    },
    load(id) {
      if (!id.startsWith(MISSING)) return null;
      return STYLE.test(id) ? '' : 'export default undefined;\n';
    },
  };
}
