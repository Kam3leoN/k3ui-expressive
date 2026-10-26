import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/media/audio-player.js';
import type { K3AudioPlayer } from '../../src/components/media/audio-player.js';

describe('k3-audio-player', () => {
  let el: K3AudioPlayer;

  beforeEach(async () => {
    localStorage.removeItem('k3-music-muted');
    el = document.createElement('k3-audio-player') as K3AudioPlayer;
    el.tracks = [
      { src: '/sounds/track-a.wav', title: 'A', type: 'audio/wav' },
      { src: '/sounds/track-b.wav', title: 'B', type: 'audio/wav' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('registers and exposes transport controls', () => {
    expect(customElements.get('k3-audio-player')).toBeTruthy();
    expect(typeof el.play).toBe('function');
    expect(typeof el.pause).toBe('function');
    expect(typeof el.stop).toBe('function');
    expect(typeof el.next).toBe('function');
    expect(typeof el.prev).toBe('function');
    expect(el.getAttribute('role')).toBe('region');
    expect(el.variant).toBe('card');
  });

  it('supports compact, toolbar and sticky variants', async () => {
    el.variant = 'compact';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('compact');
    el.variant = 'toolbar';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('toolbar');
    el.variant = 'sticky';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('sticky');
  });

  it('next advances track index', async () => {
    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange);
    el.trackIndex = 0;
    el.next();
    await el.updateComplete;
    expect(el.trackIndex).toBe(1);
  });

  it('music mute is independent storage key', () => {
    el.setMusicMuted(true);
    expect(el.muted).toBe(true);
    expect(localStorage.getItem('k3-music-muted')).toBe('1');
  });
});
