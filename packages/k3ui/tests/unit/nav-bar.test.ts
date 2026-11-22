import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/navigation/nav-bar.js';
import '../../src/components/navigation/nav-item.js';
import { K3NavBar } from '../../src/components/navigation/nav-bar.js';

describe('k3-nav-bar', () => {
  let el: K3NavBar;

  beforeEach(async () => {
    el = document.createElement('k3-nav-bar') as K3NavBar;
    el.innerHTML = `
      <k3-nav-item label="Home"></k3-nav-item>
      <k3-nav-item label="Browse"></k3-nav-item>
      <k3-nav-item label="Library"></k3-nav-item>
    `;
    document.body.append(el);
    await el.updateComplete;
  });

  afterEach(() => el.remove());

  it('defaults to vertical layout and standard appearance', () => {
    expect(el.layout).toBe('vertical');
    expect(el.appearance).toBe('standard');
  });

  it('syncs layout to slotted destinations', async () => {
    el.layout = 'horizontal';
    await el.updateComplete;
    const items = [...el.querySelectorAll('k3-nav-item')];
    expect(items.every((n) => (n as HTMLElement & { layout: string }).layout === 'horizontal')).toBe(
      true,
    );
  });

  it('xr appearance renders a floating orbiter and accepts spatial alias', async () => {
    el.appearance = 'xr';
    await el.updateComplete;
    const bar = el.shadowRoot!.querySelector('.bar') as HTMLElement;
    expect(bar.getAttribute('data-appearance')).toBe('xr');

    el.setAttribute('appearance', 'spatial');
    await el.updateComplete;
    expect(el.appearance).toBe('xr');
    expect(bar.getAttribute('data-appearance')).toBe('xr');

    const sheet = (K3NavBar as unknown as { styles: Array<{ cssText?: string }> }).styles;
    const cssText = sheet.map((s) => s.cssText ?? '').join('\n');
    expect(cssText).toMatch(/appearance='xr'/);
    expect(cssText).toContain('--k3-nav-bar-xr-inset');
    expect(cssText).toContain('--k3-nav-bar-xr-radius');
    expect(cssText).toContain('--k3-sys-elevation-level3');
    expect(cssText).toContain('--k3-nav-bar-xr-pad-inline');
    /* Vertical XR keeps 64dp so FAB 16dp clearance stays predictable */
    expect(cssText).toMatch(
      /appearance='xr'[\s\S]*?\.bar[\s\S]*?height:\s*4rem/,
    );
  });

  it('emits k3-change when a destination is selected', async () => {
    const events: unknown[] = [];
    el.addEventListener('k3-change', (e) => events.push((e as CustomEvent).detail));
    const second = el.querySelectorAll('k3-nav-item')[1] as HTMLElement;
    second.click();
    await el.updateComplete;
    expect(el.active).toBe(1);
    expect(events).toEqual([{ index: 1 }]);
  });
});
