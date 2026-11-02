/**
 * Syntax highlighting for k3ui — a private Prism instance (vendored, MIT).
 *
 * - Common web languages ship in k3ui.js (HTML / XML / SVG, CSS, JS, TS, JSX, TSX, JSON).
 * - Every other language lives in an extended pack loaded on demand
 *   (`dist/k3ui-syntax.js` next to k3ui.js, a code-split chunk in apps built
 *   from source). Bundler users can also register it up front:
 *
 *   ```js
 *   import { syntax } from 'k3ui';
 *   import * as extended from 'k3ui/syntax';
 *   syntax.use(extended);
 *   ```
 *
 * Nothing global: `window.Prism` is never read or written, and host-page
 * `<code class="language-…">` elements are never touched.
 */
import { createPrism } from './vendor/prism-core.js';
import { BASE_LANGUAGES } from './vendor/languages.base.js';
import { LANGUAGE_MANIFEST, PRISM_VERSION, type SyntaxLanguageInfo } from './vendor/manifest.js';

export { LANGUAGE_MANIFEST, PRISM_VERSION, type SyntaxLanguageInfo };

/** Set by the library build (vite.config.ts) — selects how the extended pack is fetched. */
declare const __K3UI_LIB__: boolean | undefined;

type Register = (prism: unknown) => void;

/** Shape of `k3ui/syntax` (dist/k3ui-syntax.js) and of src/syntax/extended.ts. */
export interface SyntaxLanguagePack {
  LANGUAGES: ReadonlyArray<readonly [string, Register]>;
}

interface PrismInstance {
  languages: Record<string, unknown>;
  highlight(text: string, grammar: unknown, language: string): string;
  util: { encode(text: string): string };
}

const prism = createPrism() as unknown as PrismInstance;
const registered = new Set<string>();

function registerAll(list: SyntaxLanguagePack['LANGUAGES']): void {
  for (const [id, register] of list) {
    if (registered.has(id)) continue;
    register(prism);
    registered.add(id);
  }
}

registerAll(BASE_LANGUAGES as unknown as SyntaxLanguagePack['LANGUAGES']);

/** alias → canonical id (built once from the manifest). */
const ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [id, info] of Object.entries(LANGUAGE_MANIFEST)) {
    map[id] = id;
    for (const alias of info.aliases) map[alias] ??= id;
  }
  for (const plain of ['plain', 'text', 'txt', 'plaintext', 'ascii', 'none']) map[plain] = 'plain';
  return map;
})();

let extendedLoad: Promise<boolean> | null = null;

function importExtended(): Promise<SyntaxLanguagePack> {
  if (typeof __K3UI_LIB__ !== 'undefined' && __K3UI_LIB__) {
    /* Library build: the pack sits next to k3ui.js (CDN / native ESM). */
    const url = new URL('./k3ui-syntax.js', import.meta.url).href;
    return import(/* @vite-ignore */ /* webpackIgnore: true */ url) as Promise<SyntaxLanguagePack>;
  }
  /* Built from source (playground, apps): a regular code-split chunk. */
  return import('./extended.js') as unknown as Promise<SyntaxLanguagePack>;
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const syntax = {
  /** Prism version of the vendored grammars. */
  version: PRISM_VERSION,

  /** Canonical language id for an id or alias (`'c++'` → `'cpp'`, `''` → `'plain'`). */
  resolve(language: string | null | undefined): string {
    const key = (language ?? '').trim().toLowerCase();
    if (!key) return 'plain';
    return ALIASES[key] ?? key;
  },

  /** Whether `language` can be highlighted right now (grammar registered). */
  isReady(language: string): boolean {
    const id = this.resolve(language);
    return id === 'plain' || !!prism.languages[id];
  },

  /** Whether `language` is known (bundled or in the extended pack). */
  isKnown(language: string): boolean {
    const id = this.resolve(language);
    return id === 'plain' || id in LANGUAGE_MANIFEST;
  },

  /**
   * Highlighted HTML (text is escaped). Unknown or not-yet-loaded languages
   * return escaped plain text — call `load()` first to be sure.
   */
  highlight(code: string, language: string): string {
    const id = this.resolve(language);
    const grammar = id === 'plain' ? undefined : prism.languages[id];
    if (!grammar) return escapeHtml(code);
    return prism.highlight(code, grammar, id);
  },

  /** Make `language` available (fetches the extended pack once if needed). */
  async load(language: string): Promise<boolean> {
    if (this.isReady(language)) return true;
    if (!this.isKnown(language)) return false;
    extendedLoad ??= importExtended()
      .then((pack) => {
        registerAll(pack.LANGUAGES);
        return true;
      })
      .catch((error: unknown) => {
        extendedLoad = null;
        console.info(
          "[k3ui] syntax: extended languages unavailable — `import * as extended from 'k3ui/syntax'; syntax.use(extended)`.",
          error,
        );
        return false;
      });
    await extendedLoad;
    return this.isReady(language);
  },

  /** Register a language pack (e.g. `import * as extended from 'k3ui/syntax'`). */
  use(pack: SyntaxLanguagePack): void {
    registerAll(pack.LANGUAGES);
  },

  /** Every known language: id, title, aliases, and whether it is loaded. */
  languages(): Array<{ id: string; title: string; aliases: readonly string[]; tier: 'base' | 'extended'; ready: boolean }> {
    return Object.entries(LANGUAGE_MANIFEST)
      .filter(([id]) => id !== 'clike' && id !== 'markup-templating')
      .map(([id, info]) => ({ id, ...info, ready: !!prism.languages[id] }));
  },
};

export type K3Syntax = typeof syntax;
