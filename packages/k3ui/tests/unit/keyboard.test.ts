import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  attachKeyboard,
  bindChord,
  bindChords,
  normalizeKey,
  parseChord,
  matchChord,
  chordId,
} from '../../src/core/keyboard.js';

describe('keyboard util', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    cleanups.splice(0).forEach((fn) => fn());
  });

  it('normalizes keys and parses chords', () => {
    expect(normalizeKey(' ')).toBe('space');
    expect(normalizeKey('Ctrl')).toBe('control');
    expect(parseChord('ctrl+shift+k')).toEqual(['control', 'shift', 'k']);
    expect(chordId(['k', 'control'])).toBe('control+k');
    expect(matchChord(new Set(['control', 'k']), 'control+k')).toBe(true);
    expect(matchChord(new Set(['control', 'k', 'shift']), 'control+k', true)).toBe(
      false,
    );
  });

  it('tracks down / up', () => {
    const kb = attachKeyboard(document);
    cleanups.push(() => kb.destroy());
    const downs: string[] = [];
    const ups: string[] = [];
    kb.on('down', (d) => downs.push(d.key));
    kb.on('up', (d) => ups.push(d.key));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));

    expect(downs).toEqual(['a']);
    expect(ups).toEqual(['a']);
    expect(kb.isDown('a')).toBe(false);
  });

  it('fires 2-key chord on last keydown', () => {
    const two = vi.fn();
    cleanups.push(bindChord(document, 'control+k', two));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true }),
    );
    expect(two).not.toHaveBeenCalled();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    );
    expect(two).toHaveBeenCalledTimes(1);
  });

  it('fires 3-key chord on last keydown', () => {
    const three = vi.fn();
    cleanups.push(
      bindChord(document, 'control+shift+k', three, { exact: true }),
    );

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true }),
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Shift',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(three).toHaveBeenCalledTimes(1);
  });

  it('bindChords maps several shortcuts', () => {
    const a = vi.fn();
    const b = vi.fn();
    cleanups.push(bindChords(document, { space: a, arrowright: b }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
