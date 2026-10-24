/** camelCase → kebab-case for CSS custom properties. */
export function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Dual Material / K3ui system color vars for one role.
 * `--k3-sys-color-*` + `--md-sys-color-*`
 */
export function sysColorCssVars(roleKey: string, hex: string): Record<string, string> {
  const kebab = camelToKebab(roleKey);
  return {
    [`--k3-sys-color-${kebab}`]: hex,
    [`--md-sys-color-${kebab}`]: hex,
  };
}

/** Apply expressive vs standard motion aliases on a style target. */
export function applyMotionSchemeVars(
  style: CSSStyleDeclaration,
  motion: 'expressive' | 'standard',
): void {
  const spatial =
    motion === 'expressive'
      ? 'var(--k3-sys-motion-easing-expressive-spatial)'
      : 'var(--k3-sys-motion-easing-standard)';
  const effects =
    motion === 'expressive'
      ? 'var(--k3-sys-motion-easing-expressive-effects)'
      : 'var(--k3-sys-motion-easing-standard)';
  style.setProperty('--k3-sys-motion-easing-active', spatial);
  style.setProperty('--k3-sys-motion-easing-spatial', spatial);
  style.setProperty('--k3-sys-motion-easing-effects', effects);
}
