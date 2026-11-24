import { describe, expect, it, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';

type MenuEl = HTMLElement & {
  updateComplete: Promise<unknown>;
  open: boolean;
  show: (focus?: 'menu' | 'none', opts?: { fast?: boolean }) => Promise<boolean>;
  hide: (source?: string, opts?: { fast?: boolean }) => Promise<boolean>;
  positioningAnchor: HTMLElement | null;
  positioningEdge: HTMLElement | null;
};

async function mountMenu(): Promise<{ menu: MenuEl; trigger: HTMLElement }> {
  await init({
    components: ['k3-menu', 'k3-menu-item'],
    theme: { mode: 'light' },
  });
  const trigger = document.createElement('button');
  trigger.textContent = 'Open';
  document.body.append(trigger);
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
    top: 80,
    bottom: 120,
    left: 20,
    right: 60,
    width: 40,
    height: 40,
    x: 20,
    y: 80,
    toJSON: () => ({}),
  });
  Object.defineProperty(trigger, 'offsetWidth', { configurable: true, value: 40 });
  Object.defineProperty(trigger, 'offsetHeight', { configurable: true, value: 40 });

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <k3-menu position="end-start" style="position:fixed;width:0;height:0;overflow:visible">
      <k3-menu-item value="a">Alpha</k3-menu-item>
      <k3-menu-item value="b">Beta</k3-menu-item>
    </k3-menu>`;
  const menu = wrap.firstElementChild as MenuEl;
  document.body.append(menu);
  menu.positioningAnchor = trigger;
  menu.positioningEdge = trigger;
  await menu.updateComplete;

  const panel = menu.shadowRoot!.querySelector('.panel') as HTMLElement;
  Object.defineProperty(panel, 'offsetWidth', { configurable: true, value: 160 });
  Object.defineProperty(panel, 'offsetHeight', { configurable: true, value: 120 });
  Object.defineProperty(panel, 'scrollWidth', { configurable: true, value: 160 });
  Object.defineProperty(panel, 'scrollHeight', { configurable: true, value: 120 });

  return { menu, trigger };
}

describe('k3-menu show({ fast })', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('fits before opening so the panel never paints at the CSS absolute fallback', async () => {
    const { menu } = await mountMenu();
    const panel = menu.shadowRoot!.querySelector('.panel') as HTMLElement;

    let sawOpenWithoutFit = false;
    const obs = new MutationObserver(() => {
      if (menu.open && !panel.hasAttribute('data-fitted')) {
        sawOpenWithoutFit = true;
      }
    });
    obs.observe(panel, { attributes: true, attributeFilter: ['style', 'data-fitted', 'class'] });
    obs.observe(menu, { attributes: true, attributeFilter: ['open'] });

    const ok = await menu.show('none', { fast: true });
    obs.disconnect();

    expect(ok).toBe(true);
    expect(menu.open).toBe(true);
    expect(sawOpenWithoutFit).toBe(false);
    expect(panel.hasAttribute('data-fitted')).toBe(true);
    expect(panel.style.position).toBe('fixed');
    /* Trigger right=60 + gap — not the 0-host CSS fallback (~8px) */
    expect(parseFloat(panel.style.left)).toBeGreaterThanOrEqual(60);

    await menu.hide('api', { fast: true });
  });

  it('show(none) leaves focus off the panel', async () => {
    const { menu } = await mountMenu();
    await menu.show('none', { fast: true });
    const panel = menu.shadowRoot!.querySelector('.panel') as HTMLElement;
    expect(menu.shadowRoot!.activeElement).not.toBe(panel);
    await menu.hide('api', { fast: true });
  });
});
