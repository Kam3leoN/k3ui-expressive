import { catalog } from './catalog.js';
import { COMPONENT_DEPS } from './deps.js';
import { debug } from '../debug/logger.js';

export type CustomElementConstructor = typeof HTMLElement;

const registered = new Set<string>();

export async function register(tag: string, seen: Set<string> = new Set()): Promise<void> {
  if (seen.has(tag)) return;
  seen.add(tag);
  /* Children rendered by this component must exist before it upgrades. */
  const deps = COMPONENT_DEPS[tag];
  if (deps?.length) await Promise.all(deps.map((dep) => register(dep, seen)));
  if (registered.has(tag) || customElements.get(tag)) {
    registered.add(tag);
    return;
  }
  const def = catalog.find((c) => c.tag === tag);
  if (!def) {
    debug.warn('registry', `unknown tag: ${tag}`);
    return;
  }
  const mod = await def.load();
  const ctor = mod.default;
  if (!customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
  registered.add(tag);
  debug.verbose('registry', `defined ${tag}`);
}

export async function registerAll(tags: 'all' | string[] = 'all'): Promise<void> {
  const list = tags === 'all' ? catalog.map((c) => c.tag) : tags;
  await Promise.all(list.map((t) => register(t)));
}

export function isRegistered(tag: string): boolean {
  return registered.has(tag) || !!customElements.get(tag);
}

export const registry = {
  register,
  registerAll,
  isRegistered,
  get tags(): string[] {
    return [...registered];
  },
};
