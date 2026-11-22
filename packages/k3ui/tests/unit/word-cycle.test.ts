import { afterEach, describe, expect, it, vi } from 'vitest';
import { WordCycle } from '../../playground/word-cycle.js';

describe('WordCycle', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('starts on the last (resting) word from data-words', () => {
    const pill = document.createElement('span');
    pill.dataset.words = 'Expressive Design|Goey Animation|100% Gratuit';
    document.body.append(pill);
    const cycle = new WordCycle(pill);
    expect(pill.querySelector('.word-cycle__word:not(.word-cycle__measure)')?.textContent).toBe(
      '100% Gratuit',
    );
    cycle.pause();
  });

  it('advances through words when playing', () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly cb: IntersectionObserverCallback) {}
        observe(): void {
          this.cb(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        unobserve(): void {}
        disconnect(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );
    const pill = document.createElement('span');
    pill.dataset.words = 'A|B|C';
    document.body.append(pill);
    const cycle = new WordCycle(pill, { hold: 100, restHold: 100 });
    cycle.play();
    expect(pill.textContent).toContain('C');
    vi.advanceTimersByTime(150);
    expect(pill.textContent).toContain('A');
    cycle.pause();
    vi.unstubAllGlobals();
  });

  it('throws when data-words is empty', () => {
    const pill = document.createElement('span');
    document.body.append(pill);
    expect(() => new WordCycle(pill)).toThrow(/data-words/);
  });
});
