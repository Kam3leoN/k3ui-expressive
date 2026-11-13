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

/** Known k3 tags used under `root` (light DOM, `root` included) that are not defined yet. */
function pendingKnown(root: ParentNode): string[] {
  const tags = new Set(pendingCustomElements(root));
  const self = (root as Element).localName;
  if (self?.includes('-') && !customElements.get(self)) tags.add(self);
  return [...tags].filter(isKnown);
}

/**
 * Define every catalog element used under `root` right now (with the elements
 * they render — see deps.ts). Resolves with the tags it registered.
 */
export async function registerPresent(root: ParentNode = document): Promise<string[]> {
  const tags = pendingKnown(root);
  await registerAll(tags);
  return tags;
}

export interface RegistryObserver {
  /** Stop watching — elements already defined stay defined. */
  disconnect(): void;
  /** Resolves once the tags seen so far are defined. */
  readonly ready: Promise<void>;
}

const observers = new WeakMap<Node, RegistryObserver>();

/**
 * On-demand registration: define the catalog elements present under `root`,
 * then keep watching — any k3 element added later (router view, `innerHTML`,
 * framework render…) is defined as it enters the DOM. One observer per root;
 * calling it again returns the same handle. Shadow roots are not crossed:
 * pass a `ShadowRoot` to watch your own component's tree.
 *
 * ```ts
 * registry.observe();              // whole document — `init({ components: 'auto' })`
 * registry.observe(el.shadowRoot); // light DOM of a host you own
 * ```
 */
export function observe(root: ParentNode = document): RegistryObserver {
  const existing = observers.get(root);
  if (existing) return existing;

  let ready: Promise<void> = Promise.resolve();
  const load = (tags: string[]): void => {
    if (!tags.length) return;
    const run = registerAll(tags).catch((err: unknown) => {
      debug.warn('registry', `on-demand load failed: ${String(err)}`);
    });
    ready = Promise.all([ready, run]).then(() => undefined);
  };

  load(pendingKnown(root));

  const mo =
    typeof MutationObserver === 'function'
      ? new MutationObserver((records) => {
          const tags = new Set<string>();
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node.nodeType !== 1) continue;
              for (const tag of pendingKnown(node as Element)) tags.add(tag);
            }
          }
          load([...tags]);
        })
      : null;
  mo?.observe(root, { childList: true, subtree: true });

  const handle: RegistryObserver = {
    disconnect() {
      mo?.disconnect();
      observers.delete(root);
    },
    get ready() {
      return ready;
    },
  };
  observers.set(root, handle);
  return handle;
}

export const registry = {
  register,
  registerAll,
  registerPresent,
  registerWhen,
  observe,
  isKnown,
  isRegistered,
  get tags(): string[] {
    return [...registered];
  },
};
