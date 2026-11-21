import { describe, expect, it, beforeAll } from 'vitest';
import { K3NavItem } from '../../src/components/navigation/nav-item.js';

beforeAll(() => {
  if (!customElements.get('k3-nav-item')) {
    customElements.define('k3-nav-item', K3NavItem);
  }
});

describe('k3-nav-item badge', () => {
  it('hides badge when empty', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.icon = 'widgets';
    el.label = 'Components';
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot?.querySelector('.badge');
    expect(badge?.hasAttribute('hidden')).toBe(true);
    el.remove();
  });

  it('shows count badge on the indicator pill', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.icon = 'widgets';
    el.label = 'Components';
    el.badge = '42';
    document.body.appendChild(el);
    await el.updateComplete;
    const icon = el.shadowRoot?.querySelector('.icon');
    const badge = el.shadowRoot?.querySelector('.badge');
    expect(badge?.hasAttribute('hidden')).toBe(false);
    expect(badge?.textContent).toBe('42');
    /* Badge anchors on the glyph so rail expand/collapse never reanchors it */
    expect(badge?.parentElement).toBe(icon);
    /* Name comes from the visible content (badge + label), not an aria-label in
       another order — WCAG 2.5.3 "label in name" (axe label-content-name-mismatch). */
    const item = el.shadowRoot?.querySelector('.item');
    expect(item?.hasAttribute('aria-label')).toBe(false);
    const visible = (item?.textContent ?? '').replace(/\s+/g, ' ');
    expect(visible).toContain('42');
    expect(visible).toContain('Components');
    el.remove();
  });

  it('caps numeric badge above 999', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.badge = '1200';
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.badge')?.textContent).toBe('999+');
    el.remove();
  });
});

describe('k3-nav-item dual labels (Android expand/collapse)', () => {
  it('keeps stack + row labels mounted in both layouts', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.icon = 'home';
    el.label = 'Home';
    el.layout = 'vertical';
    document.body.appendChild(el);
    await el.updateComplete;
    const stack = el.shadowRoot?.querySelector('.label--stack');
    const row = el.shadowRoot?.querySelector('.label--row');
    expect(stack?.textContent).toContain('Home');
    expect(row?.textContent).toContain('Home');
    expect(row?.parentElement?.classList.contains('shell')).toBe(true);
    expect(stack?.parentElement?.classList.contains('item')).toBe(true);

    el.layout = 'horizontal';
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.label--stack')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.label--row')).toBeTruthy();
    el.remove();
  });

  it('exposes label fade token for dual-label crossfade', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-nav-label-fade');
    expect(cssText).toContain('--k3-sys-motion-duration-effects-default');
    expect(cssText).toContain('data-collapsing');
    expect(cssText).toContain('data-expanding');
  });

  it('uses decelerate by default and expressive spatial overshoot on rail expand', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(
      /--k3-nav-pill-motion:[\s\S]*?--k3-sys-motion-easing-emphasized-decelerate/,
    );
    expect(cssText).toMatch(
      /not\(\[data-collapsing\]\)[\s\S]*?--k3-nav-pill-motion:[\s\S]*?expressive-spatial/,
    );
  });

  it('opens the active indicator from scaleX(0.4) with opacity + pressed 12%', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-nav-indicator-motion');
    expect(cssText).toContain('--k3-nav-indicator-fade');
    expect(cssText).toContain('scaleX(0.4)');
    expect(cssText).toMatch(/\.item:active\s+\.shell::before/);
    expect(cssText).toContain('var(--k3-sys-color-on-surface) 12%');
    expect(cssText).toMatch(
      /\.shell\.selected::after\s*\{[\s\S]*?opacity:\s*1/,
    );
  });

  it('animates pill morph on the horizontal axis only (no height transition)', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).not.toMatch(/height\s+var\(--k3-nav-pill-motion\)/);
    expect(cssText).not.toMatch(/min-height\s+var\(--k3-nav-pill-motion\)/);
    expect(cssText).not.toMatch(/max-height\s+var\(--k3-nav-pill-motion\)/);
    expect(cssText).toContain('width var(--k3-nav-pill-motion)');
  });

  it('uses distinct expand vs collapse shell sizes (32 collapsed · 56 expanded)', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    /* Morph flight (expand + collapse) tucks to collapsed 32h indicator */
    expect(cssText).toMatch(
      /data-expanding\]\)\s*\.shell,\s*:host\(\[layout='horizontal'\]\):host-context\(k3-nav-rail\[data-collapsing\]\)\s*\.shell\s*\{[^}]*height:\s*var\(--k3-nav-pill-h\)/,
    );
    /* Resting expanded rail pill is 56 tall */
    expect(cssText).toContain('height: var(--k3-nav-pill-h-row); /* expanded pill 56 tall */');
    /* Resting collapsed rail indicator is 32 tall */
    expect(cssText).toContain('height: var(--k3-nav-pill-h); /* collapsed indicator 56×32 */');
  });

  it('fades the collapsed stack label (opacity via --k3-nav-label-fade)', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(/\.label--stack\s*\{[\s\S]*?opacity\s+var\(--k3-nav-label-fade\)/);
  });

  it('rises the collapsed stack label from below into its final position', () => {
    const sheet = (K3NavItem as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(
      /data-collapsing\]\)\s*\.label--stack\s*\{[\s\S]*?translateY\(0\.25rem\)/,
    );
    expect(cssText).toMatch(
      /data-collapsing\]\[data-stack-in\]\)[\s\S]*?\.label--stack\s*\{[\s\S]*?translateY\(0\)/,
    );
    expect(cssText).toMatch(/\.label--stack\s*\{[\s\S]*?transform\s+var\(--k3-nav-label-fade\)/);
  });
});
