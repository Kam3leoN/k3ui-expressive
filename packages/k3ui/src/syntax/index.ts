/**
 * Syntax highlighting for k3ui — lightweight custom tokenizer (no Prism).
 *
 * All languages ship in k3ui.js. `syntax.load()` is a no-op success for known
 * ids (kept for API compatibility with the old extended pack). `k3ui/syntax`
 * still exports an empty `LANGUAGES` pack so `syntax.use()` stays harmless.
 *
 * Nothing global: host-page `<code class="language-…">` is never touched.
 */
import { escapeHtml } from './engine.js';
import { highlightLanguage, isLanguageReady } from './languages.js';
import {
  LANGUAGE_MANIFEST,
  PRISM_VERSION,
  SYNTAX_VERSION,
  type SyntaxLanguageInfo,
} from './manifest.js';

export {
  LANGUAGE_MANIFEST,
  PRISM_VERSION,
  SYNTAX_VERSION,
  type SyntaxLanguageInfo,
};
export { escapeHtml } from './engine.js';

/** Shape of `k3ui/syntax` — empty since every grammar is built-in. */
export interface SyntaxLanguagePack {
  LANGUAGES: ReadonlyArray<readonly [string, (engine: unknown) => void]>;
}

/** alias → canonical id */
const ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [id, info] of Object.entries(LANGUAGE_MANIFEST)) {
    map[id] = id;
    for (const alias of info.aliases) map[alias] ??= id;
  }
  for (const plain of ['plain', 'text', 'txt', 'plaintext', 'ascii', 'none']) map[plain] = 'plain';
  /* Common Prism leftovers */
  map.html = 'markup';
  map.xml = 'markup';
  map.svg = 'markup';
  map.js = 'javascript';
  map.ts = 'typescript';
  map.py = 'python';
  map.sh = 'bash';
  map.shell = 'bash';
  map['c++'] = 'cpp';
  map['c#'] = 'csharp';
  map.cs = 'csharp';
  map.react = 'jsx';
  map.sqlite = 'sql';
  map.mysql = 'sql';
  map.yml = 'yaml';
  map.md = 'markdown';
  map.golang = 'go';
  map.bat = 'batch';
  map.ahk = 'autohotkey';
  map.mongo = 'mongodb';
  return map;
})();

export const syntax = {
  version: SYNTAX_VERSION,

  resolve(language: string | null | undefined): string {
    const key = (language ?? '').trim().toLowerCase();
    if (!key) return 'plain';
    /* Own keys only — `constructor` / `__proto__` must not resolve to Object internals. */
    return Object.hasOwn(ALIASES, key) ? ALIASES[key]! : key;
  },

  isReady(language: string): boolean {
    const id = this.resolve(language);
    return id === 'plain' || isLanguageReady(id);
  },

  isKnown(language: string): boolean {
    const id = this.resolve(language);
    return id === 'plain' || Object.hasOwn(LANGUAGE_MANIFEST, id) || isLanguageReady(id);
  },

  /**
   * Highlighted HTML (escaped). Unknown languages → escaped plain text.
   */
  highlight(code: string, language: string): string {
    const id = this.resolve(language);
    if (id === 'plain') return escapeHtml(code);
    const html = highlightLanguage(code, id);
    return html ?? escapeHtml(code);
  },

  /** Always sync now — resolves true when the language is known. */
  async load(language: string): Promise<boolean> {
    return this.isKnown(language) && this.isReady(language);
  },

  /** No-op for the legacy extended pack. */
  use(_pack: SyntaxLanguagePack): void {
    /* all grammars are built-in */
  },

  languages(): Array<{
    id: string;
    title: string;
    aliases: readonly string[];
    tier: 'base' | 'extended';
    ready: boolean;
  }> {
    return Object.entries(LANGUAGE_MANIFEST)
      .filter(([id]) => id !== 'clike')
      .map(([id, info]) => ({ id, ...info, ready: isLanguageReady(id) }));
  },
};

export type K3Syntax = typeof syntax;
