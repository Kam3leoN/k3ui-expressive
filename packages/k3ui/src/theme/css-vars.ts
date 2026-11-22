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

/** Apply motion scheme aliases on a style target (non-root or SSR). */
export function applyMotionSchemeVars(
  style: CSSStyleDeclaration,
  motion: 'expressive' | 'standard' | 'fluid',
): void {
  if (motion === 'standard') {
    const easing = 'var(--k3-sys-motion-easing-standard)';
    style.setProperty('--k3-sys-motion-easing-active', easing);
    style.setProperty('--k3-sys-motion-easing-spatial-fast', easing);
    style.setProperty('--k3-sys-motion-easing-spatial', easing);
    style.setProperty('--k3-sys-motion-easing-spatial-slow', easing);
    style.setProperty('--k3-sys-motion-easing-effects', easing);
    style.setProperty('--k3-sys-motion-easing-effects-fast', easing);
    style.setProperty('--k3-sys-motion-duration-spatial-fast', '200ms');
    style.setProperty('--k3-sys-motion-duration-spatial-default', '300ms');
    style.setProperty('--k3-sys-motion-duration-spatial-slow', '400ms');
    style.setProperty('--k3-sys-motion-duration-effects-fast', '100ms');
    style.setProperty('--k3-sys-motion-duration-effects-default', '150ms');
    style.setProperty('--k3-sys-motion-duration-effects-slow', '200ms');
    return;
  }

  if (motion === 'fluid') {
    style.setProperty(
      '--k3-sys-motion-easing-active',
      'var(--k3-sys-motion-easing-fluid-spatial)',
    );
    style.setProperty(
      '--k3-sys-motion-easing-spatial-fast',
      'var(--k3-sys-motion-easing-fluid-spatial-fast)',
    );
    style.setProperty(
      '--k3-sys-motion-easing-spatial',
      'var(--k3-sys-motion-easing-fluid-spatial)',
    );
    style.setProperty(
      '--k3-sys-motion-easing-spatial-slow',
      'var(--k3-sys-motion-easing-fluid-spatial-slow)',
    );
    style.setProperty(
      '--k3-sys-motion-easing-effects',
      'var(--k3-sys-motion-easing-fluid-effects)',
    );
    style.setProperty(
      '--k3-sys-motion-easing-effects-fast',
      'var(--k3-sys-motion-easing-fluid-effects)',
    );
    style.setProperty('--k3-sys-motion-duration-spatial-fast', '405ms');
    style.setProperty('--k3-sys-motion-duration-spatial-default', '610ms');
    style.setProperty('--k3-sys-motion-duration-spatial-slow', '836ms');
    style.setProperty('--k3-sys-motion-duration-effects-fast', '247ms');
    style.setProperty('--k3-sys-motion-duration-effects-default', '349ms');
    style.setProperty('--k3-sys-motion-duration-effects-slow', '487ms');
    return;
  }

  /* expressive — restore scheme-aware aliases to expressive tokens */
  style.setProperty(
    '--k3-sys-motion-easing-active',
    'var(--k3-sys-motion-easing-expressive-spatial)',
  );
  style.setProperty(
    '--k3-sys-motion-easing-spatial-fast',
    'var(--k3-sys-motion-easing-expressive-spatial-fast)',
  );
  style.setProperty(
    '--k3-sys-motion-easing-spatial',
    'var(--k3-sys-motion-easing-expressive-spatial)',
  );
  style.setProperty(
    '--k3-sys-motion-easing-spatial-slow',
    'var(--k3-sys-motion-easing-expressive-spatial-slow)',
  );
  style.setProperty(
    '--k3-sys-motion-easing-effects',
    'var(--k3-sys-motion-easing-expressive-effects)',
  );
  style.setProperty(
    '--k3-sys-motion-easing-effects-fast',
    'var(--k3-sys-motion-easing-expressive-effects)',
  );
  style.setProperty('--k3-sys-motion-duration-spatial-fast', '350ms');
  style.setProperty('--k3-sys-motion-duration-spatial-default', '500ms');
  style.setProperty('--k3-sys-motion-duration-spatial-slow', '650ms');
  style.setProperty('--k3-sys-motion-duration-effects-fast', '150ms');
  style.setProperty('--k3-sys-motion-duration-effects-default', '200ms');
  style.setProperty('--k3-sys-motion-duration-effects-slow', '300ms');
}
