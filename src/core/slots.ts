/** Returns true if a named (or default) slot has assigned nodes. */
export function hasSlot(host: HTMLElement, name?: string): boolean {
  const root = host.shadowRoot;
  if (!root) return false;
  const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
  const slot = root.querySelector(selector) as HTMLSlotElement | null;
  if (!slot) return false;
  return slotHasContent(slot);
}

export function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes({ flatten: true }).some((n) => {
    if (n.nodeType === Node.TEXT_NODE) return (n.textContent ?? '').trim().length > 0;
    return n.nodeType === Node.ELEMENT_NODE;
  });
}

/**
 * Light-DOM child for a named slot — works before the first shadow render
 * and after DOM moves (e.g. menu gap elev). Prefer this when `hasSlot` can
 * still be false on first paint.
 */
export function hasLightSlot(host: HTMLElement, name: string): boolean {
  for (const child of host.children) {
    if (child instanceof HTMLElement && child.slot === name) return true;
  }
  return false;
}

/** Light DOM first, then shadow assigned nodes. */
export function hasNamedSlot(host: HTMLElement, name: string): boolean {
  return hasLightSlot(host, name) || hasSlot(host, name);
}
