import { catalog } from './catalog.js';
import { COMPONENT_DEPS } from './deps.js';
import { debug } from '../debug/logger.js';
import {
  pendingCustomElements,
  whenTriggered,
  type LazyTrigger,
  type WhenTriggeredOptions,
} from '../core/lazy.js';

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

/** `true` when the catalog knows how to load `tag`. */
export function isKnown(tag: string): boolean {
  return catalog.some((c) => c.tag === tag);
}

/**
 * Wait for `trigger`, then define every k3 element used under `root` (with the
 * elements they render — see deps.ts). Resolves with the tags it registered.
 *
 * ```ts
 * await registry.registerWhen(document.querySelector('#comments')!, 'visible');
 * ```
 */
export async function registerWhen(
  root: Element,
  trigger: LazyTrigger = 'visible',
  options: WhenTriggeredOptions = {},
): Promise<string[]> {
  await whenTriggered(root, trigger, options);
  const pending = pendingCustomElements(root);
  /* `root` itself may be the lazy k3 element (`registerWhen(cardEl, 'visible')`). */
  if (root.localName.includes('-') && !customElements.get(root.localName)) pending.unshift(root.localName);
  const tags = [...new Set(pending)].filter(isKnown);
  await registerAll(tags);
  return tags;
}

export const registry = {
  register,
  registerAll,
  registerWhen,
  isKnown,
  isRegistered,
  get tags(): string[] {
    return [...registered];
  },
};
