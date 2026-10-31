import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/registry/catalog.js';
import { COMPONENT_DEPS } from '../../src/registry/deps.js';
import { register } from '../../src/registry/register.js';

/** Source file of each catalog tag, read from the lazy loader. */
function sourceOf(load: () => unknown): string {
  const m = String(load).match(/components\/([\w/.-]+?)\.(?:js|ts)/);
  return m ? path.resolve(process.cwd(), 'src/components', `${m[1]}.ts`) : '';
}

describe('registry dependencies', () => {
  it('lists every k3-* element a component renders', () => {
    const tags = new Set(catalog.map((c) => c.tag));
    for (const { tag, load } of catalog) {
      const file = sourceOf(load);
      if (!file || !fs.existsSync(file)) continue;
      const used = [...fs.readFileSync(file, 'utf8').matchAll(/<(k3-[a-z0-9-]+)[\s>]/g)]
        .map((m) => m[1]!)
        .filter((t) => t !== tag && tags.has(t));
      for (const dep of new Set(used)) {
        expect(COMPONENT_DEPS[tag] ?? [], `${tag} renders <${dep}>`).toContain(dep);
      }
    }
  });

  it('defines the children when only the parent is registered', async () => {
    await register('k3-audio-player');
    for (const dep of COMPONENT_DEPS['k3-audio-player']!) {
      expect(customElements.get(dep), dep).toBeTruthy();
    }
  });
});
