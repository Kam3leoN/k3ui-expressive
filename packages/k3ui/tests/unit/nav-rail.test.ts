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

  it('uses M3 Expressive widths — collapsed 96dp, expanded 280dp (220–360)', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    /* md.comp.nav-rail.collapsed.container.width */
    expect(cssText).toMatch(/--k3-nav-rail-compact:\s*6rem/);
    /* md.comp.nav-rail.collapsed.narrow.container.width */
    expect(cssText).toMatch(/--k3-nav-rail-narrow:\s*5rem/);
    /* Default expanded + clamp to token min/max */
    expect(cssText).toMatch(/--k3-nav-rail-expanded:\s*17\.5rem/);
    expect(cssText).toMatch(/--k3-nav-rail-expanded-min:\s*13\.75rem/);
    expect(cssText).toMatch(/--k3-nav-rail-expanded-max:\s*22\.5rem/);
    expect(cssText).toMatch(
      /size='large'[\s\S]*?--k3-nav-rail-width:\s*clamp\(\s*var\(--k3-nav-rail-expanded-min\)/,
    );
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
    /* Collapsed centers the FAB; expanded pins to compact track */
    expect(cssText).toMatch(/\.fab\.has[\s\S]*?justify-items:\s*center/);
    expect(cssText).toContain('--k3-nav-rail-center-fab');
    expect(cssText).toMatch(
      /size='large'[\s\S]*?padding-inline-start:\s*var\(--k3-nav-rail-center-fab\)/,
    );
    expect(cssText).toContain(":host:has(k3-extended-fab[slot='fab'])");
    expect(cssText).not.toMatch(
      /::slotted\(k3-extended-fab\)[\s\S]{0,200}opacity:\s*0/,
    );
  });

  it('toggle is centered when collapsed and pinned on expand morph', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-nav-rail-center-toggle');
    /* Collapsed — true center */
    expect(cssText).toMatch(/\.toggle\s*\{[\s\S]*?margin-inline:\s*auto/);
    expect(cssText).toMatch(/\.toggle\s*\{[\s\S]*?align-self:\s*center/);
    /* Expanded / morph — pin to compact track */
    expect(cssText).toMatch(
      /data-collapsing[\s\S]*?\.toggle[\s\S]*?margin-inline-start:\s*var\(--k3-nav-rail-center-toggle\)/,
    );
  });

  it('uses scheme-aware spatial on expand and effects on collapse', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    /* Compact / collapse destination */
    expect(cssText).toMatch(
      /:host\s*\{[\s\S]*?--k3-nav-rail-ease:\s*var\(\s*--k3-sys-motion-easing-effects/,
    );
    /* Expanded / expand destination — scheme spatial (fluid / expressive) */
    expect(cssText).toMatch(
      /size='large'[\s\S]*?--k3-nav-rail-ease:\s*var\(\s*--k3-sys-motion-easing-spatial/,
    );
  });

  it('uses M3 Expressive collapsed item spacing 4dp and min-height 64dp', () => {
    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toContain('--k3-nav-rail-item-gap');
    expect(cssText).toContain('--k3-nav-rail-item-min-height: 4rem');
    expect(cssText).toMatch(
      /\.destinations\s*\{[\s\S]*?gap:\s*var\(--k3-nav-rail-item-gap\)/,
    );
    expect(cssText).toMatch(
      /size='large'[\s\S]*?--k3-nav-rail-item-min-height:\s*3\.5rem/,
    );
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

  it('xr layout renders a floating pill shell and accepts spatial alias', async () => {
    el.layout = 'xr';
    await el.updateComplete;
    const rail = el.shadowRoot!.querySelector('.rail') as HTMLElement;
    expect(rail.getAttribute('data-layout')).toBe('xr');
    expect(rail.getAttribute('data-fab-placement')).toBe('contained');
    expect(el.shadowRoot!.querySelector('.xr-shell')).toBeTruthy();

    el.setAttribute('layout', 'spatial');
    await el.updateComplete;
    expect(el.layout).toBe('xr');
    expect(rail.getAttribute('data-layout')).toBe('xr');

    const sheet = (K3NavRail as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(/layout='xr'/);
    expect(cssText).toContain('--k3-nav-rail-xr-radius');
    /* XR orbiter: no 2D shadow (surface color only) */
    expect(cssText).toMatch(
      /layout='xr'[\s\S]*?\.rail\s*\{[\s\S]*?box-shadow:\s*none/,
    );
  });

  it('xr fab-placement spatialized lifts FAB outside the pill', async () => {
    el.layout = 'xr';
    el.fabPlacement = 'spatialized';
    el.collapsible = true;
    el.innerHTML = `
      <k3-extended-fab slot="fab" class="rail-fab-extended">Create</k3-extended-fab>
      <k3-nav-item label="Home"></k3-nav-item>
    `;
    await el.updateComplete;
    const rail = el.shadowRoot!.querySelector('.rail') as HTMLElement;
    expect(rail.getAttribute('data-fab-placement')).toBe('spatialized');
    const shell = el.shadowRoot!.querySelector('.xr-shell') as HTMLElement;
    expect(shell).toBeTruthy();
    /* Toggle stays inside the pill; FAB orbiter is a sibling before the shell */
    expect(shell.querySelector('.toggle')).toBeTruthy();
    expect(shell.querySelector('.fab')).toBeNull();
    expect(rail.querySelector(':scope > .fab')).toBeTruthy();
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

  it('centers collapsed destinations; expanded keeps compact-track inset', async () => {
    const { K3NavItem } = await import('../../src/components/navigation/nav-item.js');
    const cssText = (
      K3NavItem as unknown as { styles: Array<{ cssText?: string }> }
    ).styles
      .map((s) => s.cssText ?? '')
      .join('\n');
    /* Collapsed — true center in the rail column */
    expect(cssText).toMatch(
      /layout='vertical'[\s\S]*?host-context\(k3-nav-rail\) \.item[\s\S]*?align-items:\s*center/,
    );
    /* Expanded — pin to compact-track inset (expand baseline, no L/R slide) */
    expect(cssText).toContain('--k3-nav-icon-inset');
    expect(cssText).toMatch(
      /layout='horizontal'[\s\S]*?host-context\(k3-nav-rail\) \.item[\s\S]*?padding-inline-start:\s*var\(--k3-nav-icon-inset\)/,
    );
    expect(cssText).toContain('(var(--k3-nav-icon-track) - var(--k3-nav-pill-w)) / 2');
    expect(cssText).toContain('--k3-nav-rail-item-min-height');
    /* Icon lead margin keeps glyph (and badge) centered in the 56dp column */
    expect(cssText).toContain('calc((var(--k3-nav-pill-w) - 1.5rem) / 2)');
    expect(cssText).toMatch(/label--stack[\s\S]*?white-space:\s*nowrap/);
    expect(cssText).toMatch(/label--stack[\s\S]*?text-overflow:\s*ellipsis/);
    /* Collapse must not re-center the item in a still-wide rail */
    expect(cssText).not.toMatch(
      /data-collapsing\)[\s\S]{0,200}margin-inline:\s*auto/,
    );
  });

  it('keeps items horizontal during collapse flight then settles vertical', async () => {
    el.collapsible = true;
    el.layout = 'modal';
    el.size = 'large';
    el.expanded = true;
    await el.updateComplete;
    const items = [...el.querySelectorAll(':scope > k3-nav-item')] as Array<
      HTMLElement & { layout: string }
    >;
    expect(items.every((i) => i.layout === 'horizontal')).toBe(true);
    const toggle = el.shadowRoot!.querySelector('.toggle') as HTMLButtonElement;
    toggle.click();
    await el.updateComplete;
    expect(el.size).toBe('compact');
    expect(el.hasAttribute('data-collapsing')).toBe(true);
    /* Stay horizontal while dual labels crossfade (Android FADE then ChangeBounds) */
    expect(items.every((i) => i.layout === 'horizontal')).toBe(true);

    /* Stack rise: one paint without data-stack-in, then arm on rAF */
    expect(el.hasAttribute('data-stack-in')).toBe(false);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    expect(el.hasAttribute('data-stack-in')).toBe(true);

    const end = new Event('transitionend');
    Object.defineProperty(end, 'propertyName', { value: 'width' });
    el.dispatchEvent(end);
    await el.updateComplete;
    await Promise.all(
      items.map((i) => (i as unknown as { updateComplete: Promise<unknown> }).updateComplete),
    );
    /* finishCollapseLayout clears the flag after items reflect vertical */
    await Promise.resolve();
    await Promise.resolve();
    expect(el.hasAttribute('data-collapsing')).toBe(false);
    expect(el.hasAttribute('data-stack-in')).toBe(false);
    expect(items.every((i) => i.layout === 'vertical')).toBe(true);
  });

  it('expand morph holds data-expanding until items have painted horizontal', async () => {
    el.collapsible = true;
    el.layout = 'modal';
    el.size = 'compact';
    el.expanded = false;
    await el.updateComplete;
    const items = [...el.querySelectorAll(':scope > k3-nav-item')] as Array<
      HTMLElement & { layout: string; updateComplete: Promise<unknown> }
    >;
    expect(items.every((i) => i.layout === 'vertical')).toBe(true);

    const toggle = el.shadowRoot!.querySelector('.toggle') as HTMLButtonElement;
    toggle.click();
    /* Sync: expanding flag + horizontal before release */
    expect(el.hasAttribute('data-expanding')).toBe(true);
    expect(el.getAttribute('data-morphing')).toBe('in');
    await el.updateComplete;
    await Promise.all(items.map((i) => i.updateComplete));
    expect(items.every((i) => i.layout === 'horizontal')).toBe(true);

    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    expect(el.hasAttribute('data-expanding')).toBe(false);
    /* Full width spring still morphing (fluid jelly / scheme settle). */
    expect(el.getAttribute('data-morphing')).toBe('in');
    expect(el.size).toBe('large');

    const end = new Event('transitionend');
    Object.defineProperty(end, 'propertyName', { value: 'width' });
    el.dispatchEvent(end);
    expect(el.hasAttribute('data-morphing')).toBe(false);
  });

  it.each(['modal', 'standard', 'xr'] as const)(
    'expand/collapse morph works for layout=%s under fluid scheme',
    async (layout) => {
      document.documentElement.setAttribute('data-k3-motion', 'fluid');
      el.collapsible = true;
      el.layout = layout;
      el.size = 'compact';
      el.expanded = false;
      if (layout === 'xr') el.fabPlacement = 'spatialized';
      await el.updateComplete;

      const items = [...el.querySelectorAll('k3-nav-item')] as Array<
        HTMLElement & { updateComplete: Promise<unknown> }
      >;
      const toggle = el.shadowRoot!.querySelector('.toggle') as HTMLButtonElement;
      toggle.click();
      expect(el.getAttribute('data-morphing')).toBe('in');
      expect(el.size).toBe('large');
      await el.updateComplete;
      await Promise.all(items.map((i) => i.updateComplete));
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const expandEnd = new Event('transitionend');
      Object.defineProperty(expandEnd, 'propertyName', { value: 'width' });
      el.dispatchEvent(expandEnd);
      expect(el.hasAttribute('data-morphing')).toBe(false);

      toggle.click();
      expect(el.getAttribute('data-morphing')).toBe('out');
      expect(el.hasAttribute('data-collapsing')).toBe(true);
      expect(el.size).toBe('compact');

      const collapseEnd = new Event('transitionend');
      Object.defineProperty(collapseEnd, 'propertyName', { value: 'width' });
      el.dispatchEvent(collapseEnd);
      /* finishCollapseLayout is async — wait until morph flags clear */
      for (let i = 0; i < 20 && el.hasAttribute('data-collapsing'); i++) {
        await el.updateComplete;
        await Promise.all(items.map((n) => n.updateComplete));
        await Promise.resolve();
      }
      expect(el.hasAttribute('data-collapsing')).toBe(false);
      expect(el.hasAttribute('data-morphing')).toBe(false);

      document.documentElement.removeAttribute('data-k3-motion');
    },
  );

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
