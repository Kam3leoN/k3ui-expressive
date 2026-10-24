/** Minimal form-associated helpers for Lit elements using ElementInternals. */
export function attachInternals(el: HTMLElement & { internals?: ElementInternals }): ElementInternals {
  if (el.internals) return el.internals;
  // attachInternals must run during construction
  el.internals = el.attachInternals();
  return el.internals;
}

export function setFormValue(
  internals: ElementInternals,
  value: string | null,
  state?: string | null,
): void {
  internals.setFormValue(value, state ?? value);
}
