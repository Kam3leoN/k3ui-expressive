import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  groupIndexListItems,
  resolveIndexKeyFromLabel,
} from '../../src/components/navigation/index-list.specs.js';
import { haptic } from '../../src/core/haptic.js';
import '../../src/components/navigation/index-list.js';
import type { K3IndexList } from '../../src/components/navigation/index-list.js';

describe('k3-index-list', () => {
  let el: K3IndexList;

  beforeEach(async () => {
    el = document.createElement('k3-index-list') as K3IndexList;
    el.items = [
      { label: 'Bob Martin' },
      { label: 'Alice Dupont' },
      { label: 'Zoe Zen' },
    ];
    el.style.setProperty('--k3-index-list-max-height', '20rem');
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
    haptic.setEnabled(true);
  });

  it('groups items by first letter', () => {
    const groups = groupIndexListItems([
      { label: 'Bob' },
      { label: 'Alice' },
    ]);
    expect([...groups.keys()].sort()).toEqual(['A', 'B']);
  });

  it('folds accented letters into A–Z (Élodie → E)', () => {
    expect(resolveIndexKeyFromLabel('Élodie Martin')).toBe('E');
    expect(resolveIndexKeyFromLabel('Amélie Bernard')).toBe('A');
    const groups = groupIndexListItems([
      { label: 'Élodie Martin' },
      { label: 'Emma Garcia' },
    ]);
    expect([...groups.keys()]).toEqual(['E']);
    expect(groups.get('E')!.map((i) => i.label)).toEqual([
      'Élodie Martin',
      'Emma Garcia',
    ]);
  });

  it('renders sections and rail on the end', () => {
    expect(el.shadowRoot!.querySelectorAll('.section').length).toBe(3);
    const root = el.shadowRoot!.querySelector('.root');
    const rail = el.shadowRoot!.querySelector('.rail');
    const content = el.shadowRoot!.querySelector('.content');
    expect(rail).toBeTruthy();
    expect(content).toBeTruthy();
    expect(root?.lastElementChild).toBe(rail);
  });

  it('marks the active rail button', async () => {
    el.scrollToKey('Z', true);
    await el.updateComplete;
    const active = el.shadowRoot!.querySelector('.rail-item--active') as HTMLElement | null;
    expect(active?.dataset.indexKey).toBe('Z');
    expect(el.getActiveKey()).toBe('Z');
  });

  it('setItems rebuilds the directory', async () => {
    el.setItems([{ label: 'Karim' }, { label: 'Léa' }]);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.section').length).toBe(2);
  });

  it('scrollToKey emits k3-section-change', async () => {
    const onSection = vi.fn();
    el.addEventListener('k3-section-change', onSection as EventListener);
    el.scrollToKey('A', true);
    await el.updateComplete;
    expect(onSection).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { key: 'A' } }),
    );
  });

  it('fires selection haptic on rail index change when enabled', async () => {
    const spy = vi.spyOn(haptic, 'selection').mockReturnValue(true);
    haptic.setEnabled(true);
    el.haptic = true;
    el.scrollToKey('B', true);
    await el.updateComplete;
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('skips haptic when haptic attribute is off', async () => {
    const spy = vi.spyOn(haptic, 'selection').mockReturnValue(true);
    el.haptic = false;
    await el.updateComplete;
    el.scrollToKey('Z', true);
    await el.updateComplete;
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('skips haptic when global haptics are disabled', async () => {
    const spy = vi.spyOn(haptic, 'selection').mockReturnValue(true);
    haptic.setEnabled(false);
    el.haptic = true;
    el.scrollToKey('B', true);
    await el.updateComplete;
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
