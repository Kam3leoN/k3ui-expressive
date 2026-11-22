/**
 * Shared pack densify — used by the playground builder (browser) and
 * `npm run build:pack` (CLI). Pure string transforms; no I/O.
 *
 * Pipeline: crush Lit css`…` → compact all templates → (optional Terser) →
 * inject minified CSS → one-line file.
 */

/** Whitespace / comment strip — enough for shipped tokens CSS. */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/** Lit html`…` stays out; css`…` (mangled tag) gets compacted. */
export function looksLikeCssTemplate(body) {
  if (!body.includes('{')) return false;
  if (/<[a-zA-Z!/?]/.test(body)) return false;
  /* Avoid `var` — CSS var(--token) is common. */
  if (/\b(?:function|return|const|let|class|static)\b/.test(body)) return false;
  return (
    /(?:^|[{;\s])[a-z-][\w-]*\s*:/.test(body) ||
    /--[\w-]/.test(body) ||
    /@(?:media|keyframes|supports|charset|layer)\b/.test(body)
  );
}

/** Map raw segments of a template; keep `${…}` interpolations intact. */
function mapTemplateSegments(body, mapRaw) {
  if (!body.includes('${')) return mapRaw(body);
  let out = '';
  let i = 0;
  while (i < body.length) {
    const start = body.indexOf('${', i);
    if (start === -1) {
      out += mapRaw(body.slice(i));
      break;
    }
    out += mapRaw(body.slice(i, start));
    let depth = 0;
    let j = start + 1;
    for (; j < body.length; j++) {
      if (body[j] === '{') depth++;
      else if (body[j] === '}') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    out += body.slice(start, j);
    i = j;
  }
  return out;
}

export function minifyCssWithInterpolations(body) {
  return mapTemplateSegments(body, minifyCss);
}

export function compactTemplateBody(body) {
  return mapTemplateSegments(body, (raw) =>
    raw.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim(),
  );
}

/** End index after a `…` template (handles `${…}` and escapes). */
function scanTemplateLiteral(js, from) {
  let i = from + 1;
  while (i < js.length) {
    const c = js[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '`') return i + 1;
    if (c === '$' && js[i + 1] === '{') {
      let depth = 0;
      i += 1;
      for (; i < js.length; i++) {
        if (js[i] === '{') depth++;
        else if (js[i] === '}') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
      }
      continue;
    }
    i++;
  }
  return js.length;
}

function peekCssTemplateBody(js, tick) {
  let j = tick + 1;
  while (j < js.length) {
    const ch = js[j];
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
      j++;
      continue;
    }
    if (ch === '/' && js[j + 1] === '*') {
      const end = js.indexOf('*/', j + 2);
      if (end === -1) return false;
      j = end + 2;
      continue;
    }
    break;
  }
  if (j >= js.length) return false;
  const ch = js[j];
  if (ch === '<' || ch === '$') return false;
  return (
    ch === ':' ||
    ch === '.' ||
    ch === '#' ||
    ch === '@' ||
    ch === '*' ||
    ch === '[' ||
    ch === '_' ||
    (ch >= 'A' && ch <= 'Z') ||
    (ch >= 'a' && ch <= 'z') ||
    (ch === '-' && js[j + 1] === '-')
  );
}

/**
 * Walk JS, skip // and /* comments (JSDoc uses `code` ticks), transform each
 * template body via `mapBody(body, { isCssCandidate })` → new body or `null`.
 */
function transformTemplates(js, mapBody) {
  const parts = [];
  let i = 0;
  while (i < js.length) {
    if (js[i] === '/' && js[i + 1] === '/') {
      const end = js.indexOf('\n', i);
      const stop = end === -1 ? js.length : end + 1;
      parts.push(js.slice(i, stop));
      i = stop;
      continue;
    }
    if (js[i] === '/' && js[i + 1] === '*') {
      const end = js.indexOf('*/', i + 2);
      const stop = end === -1 ? js.length : end + 2;
      parts.push(js.slice(i, stop));
      i = stop;
      continue;
    }
    if (js[i] !== '`') {
      const start = i;
      let j = i + 1;
      while (j < js.length) {
        if (js[j] === '`') break;
        if (js[j] === '/' && (js[j + 1] === '/' || js[j + 1] === '*')) break;
        j++;
      }
      parts.push(js.slice(start, j));
      i = j;
      continue;
    }
    const end = scanTemplateLiteral(js, i);
    const body = js.slice(i + 1, end - 1);
    const next = mapBody(body, { isCssCandidate: peekCssTemplateBody(js, i) });
    parts.push(next == null ? js.slice(i, end) : '`' + next + '`');
    i = end;
  }
  return parts.join('');
}

/** Crush Lit css`…` left pretty by esbuild. */
export function minifyCssInJs(js) {
  return transformTemplates(js, (body, { isCssCandidate }) => {
    if (!isCssCandidate || !looksLikeCssTemplate(body)) return null;
    return minifyCssWithInterpolations(body);
  });
}

/** Collapse whitespace inside every template (html`…` / leftovers). */
export function compactTemplatesInJs(js) {
  return transformTemplates(js, (body) => compactTemplateBody(body));
}

/** Strip raw CR/LF — strings already use \\n after minify / JSON.stringify. */
export function packToOneLine(code) {
  return code.replace(/\r?\n/g, '');
}

/** Runtime style install — runs before the module body. */
export function cssInjectPreamble(minifiedCss) {
  return (
    '!(function(){if(typeof document==="undefined")return;' +
    'var s=document.createElement("style");s.dataset.k3PackCss="1";' +
    `s.textContent=${JSON.stringify(minifiedCss)};` +
    '(document.head||document.documentElement).appendChild(s)})();'
  );
}

/**
 * Crush Lit css`…` + compact html`…`.
 * Do **not** strip newlines here — that would glue `//` comments onto the next
 * statement. Call `packToOneLine` only after minify (Terser / esbuild) or via
 * `embedCssIntoPack`.
 */
export function densifyPackJs(js) {
  return compactTemplatesInJs(minifyCssInJs(js));
}

/**
 * Inject minified CSS after the /*! banner, then force one line.
 * `cssText` = raw or already-minified stylesheet contents.
 */
export function embedCssIntoPack(js, cssText) {
  const inject = cssInjectPreamble(minifyCss(cssText));
  const banner = js.match(/^(\/\*![^*]*\*\/)/);
  const assembled = banner ? banner[1] + inject + js.slice(banner[1].length) : inject + js;
  return packToOneLine(assembled);
}
