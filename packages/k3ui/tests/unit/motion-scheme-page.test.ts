import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Motion page ships a local scheme toggle; Settings keeps its own. */
describe('motion page scheme toggle', () => {
  const html = readFileSync(
    resolve(__dirname, '../../playground/index.html'),
    'utf8',
  );
  const app = readFileSync(resolve(__dirname, '../../playground/app.ts'), 'utf8');

  it('marks up a connected button-group only on the motion page', () => {
    const pageStart = html.indexOf('data-page="motion"');
    const pageEnd = html.indexOf('<!-- STYLES:', pageStart + 1);
    const page = html.slice(pageStart, pageEnd > pageStart ? pageEnd : undefined);
    expect(page).toContain('id="motion-scheme-group"');
    expect(page).toContain('class="motion-scheme-group"');
    expect(page).toContain('variant="connected"');
    expect(page).toContain('data-motion-scheme="standard"');
    expect(page).toContain('data-motion-scheme="expressive"');
    expect(page).toContain('data-motion-scheme="fluid"');
    /* Not duplicated outside Settings + motion page */
    const matches = html.match(/id="motion-scheme-group"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('wires the page group to the same scheme setter as Settings', () => {
    expect(app).toContain("getElementById('motion-scheme-group')");
    expect(app).toContain("onMotionSchemePick('data-motion-scheme')");
    expect(app).toContain('[data-motion-scheme]');
  });
});
