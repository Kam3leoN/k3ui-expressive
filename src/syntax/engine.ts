/** Tiny leftmost-longest tokenizer — no Prism / no Highlight.js. */

export type SyntaxRule = {
  type: string;
  /** Global regex; matched only when `lastIndex` aligns with the cursor. */
  match: RegExp;
};

export type SyntaxToken = { type: string | null; value: string };

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ruleHits(code: string, rules: SyntaxRule[], index: number): boolean {
  for (const rule of rules) {
    rule.match.lastIndex = index;
    const m = rule.match.exec(code);
    if (m && m.index === index) return true;
  }
  return false;
}

/** Tokenize `code` with `rules` (leftmost, longest match wins). */
export function tokenize(code: string, rules: SyntaxRule[]): SyntaxToken[] {
  if (!code) return [];
  const out: SyntaxToken[] = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    let bestType: string | null = null;
    let bestEnd = -1;
    let bestValue = '';
    for (const rule of rules) {
      rule.match.lastIndex = i;
      const m = rule.match.exec(code);
      if (!m || m.index !== i) continue;
      const end = i + m[0].length;
      if (end > bestEnd) {
        bestEnd = end;
        bestType = rule.type;
        bestValue = m[0];
      }
    }
    if (bestType && bestValue.length) {
      out.push({ type: bestType, value: bestValue });
      i = bestEnd;
      continue;
    }
    const start = i;
    i += 1;
    while (i < n && !ruleHits(code, rules, i)) i += 1;
    out.push({ type: null, value: code.slice(start, i) });
  }
  return out;
}

/** Escaped HTML with `<span class="token …">` wrappers. */
export function renderTokens(tokens: SyntaxToken[]): string {
  let html = '';
  for (const t of tokens) {
    const esc = escapeHtml(t.value);
    html += t.type ? `<span class="token ${t.type}">${esc}</span>` : esc;
  }
  return html;
}

export function highlightWithRules(code: string, rules: SyntaxRule[]): string {
  return renderTokens(tokenize(code, rules));
}

/** Keyword list → word-boundary rule (longest keywords preferred by sort). */
export function keywordRule(type: string, words: readonly string[]): SyntaxRule {
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const body = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return { type, match: new RegExp(`\\b(?:${body})\\b`, 'g') };
}
