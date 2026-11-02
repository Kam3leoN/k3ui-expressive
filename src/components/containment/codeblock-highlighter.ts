/**
 * Syntax highlighting for `k3-codeblock` — thin adapter over the custom
 * highlighter in `src/syntax` (no Prism).
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

/** Highlighted, escaped HTML — plain text for unknown languages. */
export function highlightCode(code: string, language: string): string {
  return syntax.highlight(code, language);
}

/** Kept for API compat — grammars are sync / built-in. */
export function loadCodeLanguage(language: string): Promise<boolean> {
  return syntax.load(language);
}
