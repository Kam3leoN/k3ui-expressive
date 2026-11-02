/**
 * Syntax highlighting for `k3-codeblock` — delegates to the k3ui syntax engine
 * (private Prism instance, see src/syntax). Kept as a thin adapter so the
 * public helpers keep their names.
 */
import { syntax } from '../../syntax/index.js';

/** Canonical language id for an id or alias (`'c++'` → `'cpp'`, `''` → `'plain'`). */
export function resolveCodeLanguage(raw: string): string {
  return syntax.resolve(raw);
}

/** Language name as written in a `language-xxx` / `lang-xxx` class (not resolved). */
export function rawLanguageFromClassName(className: string): string {
  const m = className.match(/\b(?:language|lang)-([\w#+.-]+)/i);
  return (m?.[1] ?? 'plain').toLowerCase();
}

/** Canonical language from a `language-xxx` / `lang-xxx` class name. */
export function languageFromClassName(className: string): string {
  return resolveCodeLanguage(rawLanguageFromClassName(className));
}

/** Highlighted, escaped HTML — plain text until the language's grammar is loaded. */
export function highlightCode(code: string, language: string): string {
  return syntax.highlight(code, language);
}

/** Load the grammar for `language` if needed (extended pack). */
export function loadCodeLanguage(language: string): Promise<boolean> {
  return syntax.load(language);
}
