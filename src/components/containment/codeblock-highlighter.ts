/**
 * Lightweight syntax highlighting for `k3-codeblock` (no Prism).
 */

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const wrap = (cls: string, text: string): string =>
  `<span class="token token--${cls}">${escapeHtml(text)}</span>`;

const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  css: 'css',
  scss: 'css',
  plain: 'plain',
};

export function resolveCodeLanguage(raw: string): string {
  const key = raw.toLowerCase().trim();
  return LANGUAGE_ALIASES[key] ?? key;
}

export function languageFromClassName(className: string): string {
  const m = className.match(/\blanguage-([\w-]+)/i);
  const raw = m ? m[1].toLowerCase() : '';
  return resolveCodeLanguage(raw || 'plain');
}

type Rule = { pattern: RegExp; type: string };

function applyRules(code: string, rules: Rule[]): string {
  const matches: { index: number; end: number; type: string; text: string; order: number }[] = [];
  rules.forEach(({ pattern, type }, order) => {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        type,
        text: m[0],
        order,
      });
    }
  });
  matches.sort((a, b) => a.index - b.index || a.order - b.order);
  const merged: typeof matches = [];
  for (const m of matches) {
    if (merged.some((x) => m.index < x.end && m.end > x.index)) continue;
    merged.push(m);
  }
  merged.sort((a, b) => a.index - b.index);
  let out = '';
  let lastIndex = 0;
  for (const m of merged) {
    if (m.index > lastIndex) out += escapeHtml(code.slice(lastIndex, m.index));
    out += wrap(m.type, m.text);
    lastIndex = m.end;
  }
  if (lastIndex < code.length) out += escapeHtml(code.slice(lastIndex));
  return out || escapeHtml(code);
}

function highlightHtml(code: string): string {
  return applyRules(code, [
    { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
    { pattern: /<!--[\s\S]*?-->/g, type: 'comment' },
    { pattern: /<\/?[\w][\w-]*(?:\s|>)/g, type: 'tag' },
    { pattern: /[\w-]+(?=\s*=)/g, type: 'attr' },
  ]);
}

function highlightJavascript(code: string): string {
  return applyRules(code, [
    { pattern: /\/\/[^\n]*/g, type: 'comment' },
    { pattern: /\/\*[\s\S]*?\*\//g, type: 'comment' },
    { pattern: /"(?:[^"\\]|\\.)*"/g, type: 'string' },
    { pattern: /'(?:[^'\\]|\\.)*'/g, type: 'string' },
    {
      pattern:
        /\b(await|break|case|catch|class|const|continue|default|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|throw|try|typeof|var|void|while|interface|type|enum|implements|namespace|readonly|private|protected|public)\b/g,
      type: 'keyword',
    },
    { pattern: /\b(true|false|null|undefined)\b/g, type: 'constant' },
  ]);
}

function highlightCss(code: string): string {
  return applyRules(code, [
    { pattern: /\/\*[\s\S]*?\*\//g, type: 'comment' },
    { pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, type: 'string' },
    { pattern: /#[\da-fA-F]{3,8}\b/g, type: 'number' },
    { pattern: /([\w-]+)\s*:/g, type: 'attr' },
  ]);
}

const HIGHLIGHTERS: Record<string, (code: string) => string> = {
  html: highlightHtml,
  javascript: highlightJavascript,
  typescript: highlightJavascript,
  css: highlightCss,
};

/** Returns safe HTML with token spans. */
export function highlightCode(code: string, language: string): string {
  const lang = resolveCodeLanguage(language);
  if (!code || lang === 'plain') return escapeHtml(code);
  const fn = HIGHLIGHTERS[lang];
  return fn ? fn(code) : escapeHtml(code);
}
