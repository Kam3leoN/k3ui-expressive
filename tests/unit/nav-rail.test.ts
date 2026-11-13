import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/navigation/nav-rail.js';
import '../../src/components/navigation/nav-item.js';
import '../../src/components/actions/extended-fab.js';
import { K3NavRail } from '../../src/components/navigation/nav-rail.js';
import type { K3ExtendedFab } from '../../src/components/actions/extended-fab.js';

describe('k3-nav-rail', () => {
  let el: K3NavRail;

  beforeEach(async () => {
    el = document.createElement('k3-nav-rail') as K3NavRail;
    el.innerHTML = `
      <k3-nav-item label="Home"></k3-nav-item>
      <k3-nav-item label="Browse"></k3-nav-item>
      <k3-nav-item slot="trailing" label="Settings"></k3-nav-item>
    `;
    document.body.append(el);
    await el.updateComplete;
  });

  afterEach(() => el.remove());

  it('defaults to modal layout and start position', () => {
    expect(el.layout).toBe('modal');
    expect(el.position).toBe('start');
  });

  it('maps deprecated appearance attribute onto layout', async () => {
    el.appearance = 'standard';
    await el.updateComplete;
    expect(el.layout).toBe('standard');
    el.setAttribute('appearance', 'modal');
    await el.updateComplete;
    expect(el.layout).toBe('modal');
  });

  it('shows a trailing section with a divider when slot=trailing has content', async () => {
    await el.updateComplete;
    const trailing = el.shadowRoot!.querySelector('.trailing');
    expect(trailing?.classList.contains('has')).toBe(true);
    expect(el.shadowRoot!.querySelector('slot[name="trailing"]')).toBeTruthy();
  });

  it('hides trailing when empty', async () => {
    el.querySelectorAll('[slot="trailing"]').forEach((n) => n.remove());
    const slot = el.shadowRoot!.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    slot.dispatchEvent(new Event('slotchange'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.trailing')?.classList.contains('has')).toBe(false);
  });

  it('applies position to the destinations group', async () => {
    el.position = 'center';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.destinations')?.getAttribute('data-position')).toBe(
      'center',
    );
    el.position = 'bottom';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.destinations')?.getAttribute('data-position')).toBe(
      'bottom',
    );
  });

  it('FAB slot prefers single extended morph without opacity crossfade', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(/\.fab\.has[\s\S]*?justify-items:\s*start/);
    /* Soft center↔start via --k3-nav-rail-center-fab, synced with width */
    expect(cssText).toContain('--k3-nav-rail-center-fab');
    expect(cssText).toMatch(
      /\.fab\s*\{[\s\S]*?padding-inline-start:\s*var\(--k3-nav-rail-center-fab\)/,
    );
    expect(cssText).toContain('justify-self: start');
    expect(cssText).toContain(":host:has(k3-extended-fab[slot='fab'])");
    expect(cssText).not.toMatch(
      /::slotted\(k3-extended-fab\)[\s\S]{0,200}opacity:\s*0/,
    );
  });

  it('toggle eases margin in sync with expanded (not after settle)', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-nav-rail-center-toggle');
    expect(cssText).toMatch(
      /\.toggle\s*\{[\s\S]*?margin-inline-start:\s*var\(--k3-nav-rail-center-toggle\)/,
    );
    expect(cssText).toMatch(/margin-inline-start:\s*0\.25rem/);
    expect(cssText).not.toMatch(/data-collapsing\][\s\S]{0,40}\.toggle/);
  });

  it('syncFabMorph toggles data-rail-collapsed on extended FAB', async () => {
    el.innerHTML = `
      <k3-extended-fab slot="fab" class="rail-fab-extended">
        <span slot="icon" class="ms" data-k3-icon="edit"></span>
        Create
      </k3-extended-fab>
      <k3-nav-item label="Home"></k3-nav-item>
    `;
    el.collapsible = true;
    el.size = 'compact';
    await el.updateComplete;
    const efab = el.querySelector('k3-extended-fab') as K3ExtendedFab;
    expect(efab.hasAttribute('data-rail-collapsed')).toBe(true);

    /* jsdom has no text metrics — stub intrinsic width for the expand measure */
    Object.defineProperty(efab, 'scrollWidth', { configurable: true, get: () => 140 });
    const rect = efab.getBoundingClientRect.bind(efab);
    efab.getBoundingClientRect = () => {
      const r = rect();
      if (!efab.hasAttribute('data-rail-collapsed') && efab.style.width === 'auto') {
        return { ...r, width: 140, right: r.left + 140 } as DOMRect;
      }
      return r;
    };

    /* Expand — locks px toward measured pill */
    efab.setRailCollapsed(false, true);
    expect(efab.hasAttribute('data-rail-collapsed')).toBe(false);
    expect(efab.style.width).toBe('140px');

    /* Collapse — same px lock (max-width kept open during flight) */
    efab.setRailCollapsed(true, true);
    expect(efab.hasAttribute('data-rail-collapsed')).toBe(true);
    expect(efab.style.width).toMatch(/px$/);
    expect(efab.style.maxWidth).toMatch(/px$/);
  });

  it('compact rail has no end-border token and keeps elevation variable', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ styleSheet?: CSSStyleSheet; cssText?: string }> })
      .styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-sys-elevation-level1');
    expect(cssText).not.toMatch(/\.rail\s*\{[^}]*border-inline-end:/);
  });

  it('modal expanded marks layout=modal and size=large', async () => {
    el.layout = 'modal';
    el.expanded = true;
    await el.updateComplete;
    const rail = el.shadowRoot!.querySelector('.rail') as HTMLElement;
    expect(rail.getAttribute('data-layout')).toBe('modal');
    expect(rail.getAttribute('data-size')).toBe('large');
    expect(el.expanded).toBe(true);
  });

  it('standard expanded has no inset sheet chrome', async () => {
    el.layout = 'standard';
    el.expanded = true;
    await el.updateComplete;
    const rail = el.shadowRoot!.querySelector('.rail') as HTMLElement;
    expect(rail.getAttribute('data-layout')).toBe('standard');
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    /* No floating inset sheet (margin 0.75rem / calc width) on standard */
    expect(cssText).not.toMatch(/layout='standard'[\s\S]{0,400}margin:\s*0\.75rem/);
    expect(cssText).not.toContain('calc(100% - 1.5rem)');
  });

  it('modal expanded CSS docks to the start edge (end radii + elev-1)', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    /* Compact is non-modal; radii are longhands so they ease with width */
    expect(cssText).toMatch(/layout='modal'/);
    expect(cssText).toContain('border-start-end-radius');
    expect(cssText).toContain('border-end-end-radius');
    expect(cssText).toContain('--k3-sys-elevation-level1');
    expect(cssText).not.toContain('--k3-sys-elevation-level2');
  });

  it('switches items to vertical at collapse start so labels stay visible', async () => {
    el.collapsible = true;
    el.layout = 'modal';
    el.size = 'large';
    el.expanded = true;
    await el.updateComplete;
    const items = [...el.querySelectorAll('k3-nav-item')] as Array<
      HTMLElement & { layout: string }
    >;
    const toggle = el.shadowRoot!.querySelector('.toggle') as HTMLButtonElement;
    toggle.click();
    await el.updateComplete;
    expect(el.size).toBe('compact');
    expect(el.hasAttribute('data-collapsing')).toBe(true);
    /* Vertical immediately — labels under icons, no tuck hide/pop */
    expect(items.every((i) => i.layout === 'vertical')).toBe(true);

    const end = new Event('transitionend');
    Object.defineProperty(end, 'propertyName', { value: 'width' });
    el.dispatchEvent(end);
    await el.updateComplete;
    expect(el.hasAttribute('data-collapsing')).toBe(false);
    expect(items.every((i) => i.layout === 'vertical')).toBe(true);
  });

  it('accepts deprecated foot slot as trailing', async () => {
    el.querySelectorAll('[slot="trailing"]').forEach((n) => n.remove());
    const foot = document.createElement('k3-nav-item');
    foot.setAttribute('slot', 'foot');
    foot.setAttribute('label', 'Help');
    el.append(foot);
    const slot = el.shadowRoot!.querySelector('slot[name="foot"]') as HTMLSlotElement;
    slot.dispatchEvent(new Event('slotchange'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.trailing')?.classList.contains('has')).toBe(true);
  });
});
