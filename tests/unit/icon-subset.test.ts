import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The playground self-hosts a Material Symbols subset generated from
 * playground/icons.json (scripts/subset-icons.py). Any ligature used in demos
 * but missing from that list renders as raw letters.
 */
const root = process.cwd();
const names: string[] = JSON.parse(fs.readFileSync(path.join(root, 'playground/icons.json'), 'utf8'));

describe('playground Material Symbols subset', () => {
  it('lists icons once, sorted', () => {
    expect(names).toEqual([...new Set(names)].sort());
  });

  it('includes every ligature used in playground/index.html', () => {
    const html = fs.readFileSync(path.join(root, 'playground/index.html'), 'utf8');
    const subset = new Set(names);
    const used = new Set<string>();
    for (const m of html.matchAll(/<span[^>]*\bms\b[^>]*>([\s\S]*?)<\/span>/g)) {
      const name = m[1]!.replace(/<[^>]+>/g, '').trim();
      if (/^[a-z][a-z0-9_]*$/.test(name)) used.add(name);
    }
    for (const m of html.matchAll(/data-k3-icon="([a-z0-9_]+)"/g)) used.add(m[1]!);
    for (const m of html.matchAll(/&lt;span class="ms"[^&]*&gt;([a-z0-9_]+)&lt;\/span&gt;/g)) used.add(m[1]!);
    for (const m of html.matchAll(/data-k3-icon=\\"([a-z0-9_]+)\\"/g)) used.add(m[1]!);
    const missing = [...used].filter((n) => !subset.has(n)).sort();
    expect(missing, `Add to playground/icons.json, then regenerate the font: ${missing.join(', ')}`).toEqual([]);
  });

  it('ships a font generated from the current list', () => {
    const font = path.join(root, 'playground/fonts/material-symbols-rounded-subset.woff2');
    expect(fs.existsSync(font)).toBe(true);
    const stamp = fs.readFileSync(font.replace(/\.woff2$/, '.sha256'), 'utf8').trim();
    const digest = crypto.createHash('sha256').update(names.join('\n')).digest('hex');
    expect(stamp, 'playground/icons.json changed — run scripts/subset-icons.py').toBe(digest);
  });

  it('never requests Google Fonts', () => {
    const html = fs.readFileSync(path.join(root, 'playground/index.html'), 'utf8');
    expect(html).not.toContain('fonts.googleapis.com');
  });
});
