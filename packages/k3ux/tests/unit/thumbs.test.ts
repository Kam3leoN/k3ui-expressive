import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Thumbs } from '../../src/components/inputs/thumbs.js';

describe('k3-thumbs', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    window.K3UX_MANUAL = true;
    await init();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3Thumbs> {
    host.innerHTML = html;
    const el = host.querySelector('k3-thumbs') as K3Thumbs;
    await el.updateComplete;
    return el;
  }

  it('defaults to value 0 · no vote', async () => {
    const el = await mount(`<k3-thumbs></k3-thumbs>`);
    expect(el.getValue()).toBe(0);
    expect(el.getVote()).toBe('');
    expect(el.shadowRoot!.querySelector('.count')?.textContent).toBe('0');
  });

  it('upvote increments and sets vote=up', async () => {
    const el = await mount(`<k3-thumbs value="17"></k3-thumbs>`);
    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange as EventListener);
    (el.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getValue()).toBe(18);
    expect(el.getVote()).toBe('up');
    expect(onChange).toHaveBeenCalledTimes(1);
    const detail = (onChange.mock.calls[0]![0] as CustomEvent).detail;
    expect(detail).toEqual({ value: 18, vote: 'up', delta: 1 });
  });

  it('downvote decrements and sets vote=down', async () => {
    const el = await mount(`<k3-thumbs value="17"></k3-thumbs>`);
    (el.shadowRoot!.querySelector('.is-down') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getValue()).toBe(16);
    expect(el.getVote()).toBe('down');
  });

  it('toggling the same thumb clears the vote', async () => {
    const el = await mount(`<k3-thumbs value="10" vote="up"></k3-thumbs>`);
    (el.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getVote()).toBe('');
    expect(el.getValue()).toBe(9);
  });

  it('switching from down to up adjusts by +2', async () => {
    const el = await mount(`<k3-thumbs value="10" vote="down"></k3-thumbs>`);
    (el.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getVote()).toBe('up');
    expect(el.getValue()).toBe(12);
  });

  it('respects min / max clamps', async () => {
    const el = await mount(`<k3-thumbs value="0" min="0" max="2"></k3-thumbs>`);
    (el.shadowRoot!.querySelector('.is-down') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getValue()).toBe(0);
    el.setValue(2);
    (el.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.getValue()).toBe(2);
  });

  it('readonly / disabled ignore clicks', async () => {
    const ro = await mount(`<k3-thumbs value="5" readonly></k3-thumbs>`);
    (ro.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await ro.updateComplete;
    expect(ro.getValue()).toBe(5);

    const dis = await mount(`<k3-thumbs value="5" disabled></k3-thumbs>`);
    (dis.shadowRoot!.querySelector('.is-up') as HTMLButtonElement).click();
    await dis.updateComplete;
    expect(dis.getValue()).toBe(5);
  });

  it('setVote / clearVote work programmatically', async () => {
    const el = await mount(`<k3-thumbs value="5"></k3-thumbs>`);
    el.setVote('up');
    await el.updateComplete;
    expect(el.getVote()).toBe('up');
    expect(el.getValue()).toBe(6);
    el.clearVote();
    await el.updateComplete;
    expect(el.getVote()).toBe('');
    expect(el.getValue()).toBe(5);
  });

  it('reflects size and pressed state', async () => {
    const el = await mount(`<k3-thumbs size="lg" vote="up" value="3"></k3-thumbs>`);
    expect(el.getAttribute('size')).toBe('lg');
    const up = el.shadowRoot!.querySelector('.is-up') as HTMLButtonElement;
    expect(up.getAttribute('aria-pressed')).toBe('true');
  });
});
