import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Playground loads a Google Fonts *subset* (`icon_names=`).
 * Any ligature used in demos but missing from that list renders as raw letters.
 */
describe('playground Material Symbols subset', () => {
  it('includes every ligature used in playground/index.html .ms spans', () => {
    const htmlPath = path.resolve(process.cwd(), 'playground/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const namesMatch = html.match(/icon_names=([^&"']+)/);
    expect(namesMatch, 'icon_names= missing in playground/index.html').toBeTruthy();
    const subset = new Set((namesMatch?.[1] ?? '').split(',').filter(Boolean));

    const used = new Set<string>();
    for (const m of html.matchAll(/<span[^>]*\bms\b[^>]*>([\s\S]*?)<\/span>/g)) {
      const name = m[1].replace(/<[^>]+>/g, '').trim();
      if (/^[a-z][a-z0-9_]*$/.test(name)) used.add(name);
    }
    for (const m of html.matchAll(/data-k3-icon="([a-z0-9_]+)"/g)) used.add(m[1]);
    for (const m of html.matchAll(/&lt;span class="ms"[^&]*&gt;([a-z0-9_]+)&lt;\/span&gt;/g)) {
      used.add(m[1]);
    }
    for (const m of html.matchAll(/data-k3-icon=\\"([a-z0-9_]+)\\"/g)) used.add(m[1]);

    const missing = [...used].filter((n) => !subset.has(n)).sort();
    expect(
      missing,
      `Add to playground/index.html icon_names=: ${missing.join(', ')}`,
    ).toEqual([]);
  });
});
