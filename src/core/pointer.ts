/**
 * Pointer / path helpers — hover capability, composedPath checks.
 */

/** Fine pointer with real hover — touch / coarse fall back to click. */
export function canHoverOpen(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** True if `node` appears in an event composed path. */
export function pathIncludes(
  path: readonly EventTarget[],
  node: EventTarget | null | undefined,
): boolean {
  if (!node) return false;
  return path.includes(node);
}

/** True if any path node matches or is inside one of the CSS selectors. */
export function pathMatches(
  path: readonly EventTarget[],
  selectors: string | readonly string[],
): boolean {
  const list = (
    typeof selectors === 'string'
      ? selectors.split(',').map((s) => s.trim())
      : [...selectors]
  ).filter(Boolean);
  if (!list.length) return false;
  for (const n of path) {
    if (!(n instanceof Element)) continue;
    for (const sel of list) {
      try {
        if (n.matches(sel) || n.closest(sel)) return true;
      } catch {
        /* invalid selector */
      }
    }
  }
  return false;
}