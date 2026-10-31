/**
 * Resolve an IDREF (`for="…"`) in the element's own tree first — a document
 * or a shadow root — then in the document. `document.getElementById` alone
 * cannot see targets rendered inside another component's shadow DOM.
 */
export function resolveIdRef<T extends HTMLElement = HTMLElement>(
  host: Node,
  id: string | null | undefined,
): T | null {
  if (!id) return null;
  const root = host.getRootNode() as Document | ShadowRoot;
  const local = typeof root.getElementById === 'function' ? root.getElementById(id) : null;
  return (local ?? document.getElementById(id)) as T | null;
}
