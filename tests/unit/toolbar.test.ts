import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';

describe('k3-toolbar', () => {
  it('renders docked / floating / fab slot', async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-toolbar', 'k3-icon-button', 'k3-fab'],
      theme: { mode: 'light' },
    });

    const el = document.createElement('k3-toolbar') as HTMLElement & {
      variant: string;
      color: string;
      layout: string;
      shape: string;
      updateComplete: Promise<unknown>;
    };
    el.variant = 'floating';
    el.color = 'vibrant';
    el.shape = 'rounded';
    el.setAttribute('label', 'Format');
    el.innerHTML = `
      <div slot="expand">Reactions</div>
      <k3-icon-button label="Bold"><span class="ms">format_bold</span></k3-icon-button>
      <k3-fab slot="fab" aria-label="Add"><span slot="icon" class="ms">add</span></k3-fab>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    /* Slot sync is async via slotchange / firstUpdated */
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;

    const root = el.shadowRoot!;
    expect(root.querySelector('[role="toolbar"]')).toBeTruthy();
    expect(root.querySelector('.fab')?.classList.contains('has')).toBe(true);
    expect(root.querySelector('.expand')?.classList.contains('has')).toBe(true);
    expect(el.getAttribute('variant')).toBe('floating');
    expect(el.getAttribute('color')).toBe('vibrant');
    expect(el.getAttribute('shape')).toBe('rounded');

    (el as unknown as HTMLElement & { expanded: boolean }).expanded = true;
    await el.updateComplete;
    expect(el.hasAttribute('expanded')).toBe(true);

    el.variant = 'docked';
    el.layout = 'spread';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('docked');
    el.remove();
  });
});
