/**
 * Lucid hero word-cycle (MIT) — pill springs to each word’s width.
 *
 * @see lucid-clock-m3 / word-cycle.ts
 */
import { afterAnimation, prefersReducedMotion, squash } from './lucid-motion.js';

export interface WordCycleOptions {
  hold?: number;
  restHold?: number;
  tilt?: number;
}

export class WordCycle {
  private readonly words: readonly string[];
  private readonly measure: HTMLSpanElement;
  private current: HTMLSpanElement;
  private index: number;
  private timer: number | undefined;
  private visible = true;
  private tiltSign = 1;
  private _playing = false;
  private readonly opts: Required<WordCycleOptions>;

  constructor(
    private readonly pill: HTMLElement,
    options: WordCycleOptions = {},
  ) {
    this.opts = { hold: 1500, restHold: 3400, tilt: 7, ...options };
    this.words = (pill.dataset.words ?? '')
      .split('|')
      .map((w) => w.trim())
      .filter(Boolean);
    if (!this.words.length) throw new Error('WordCycle: data-words is empty');
    this.index = this.words.length - 1;

    pill.replaceChildren();
    this.current = this.makeWord(this.words[this.index]!);
    this.measure = document.createElement('span');
    this.measure.className = 'word-cycle__word word-cycle__measure';
    pill.append(this.current, this.measure);

    this.fit();
    void document.fonts?.ready.then(() => this.fit());
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.fit()).observe(document.documentElement);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(([e]) => {
        this.visible = Boolean(e?.isIntersecting);
      }).observe(pill);
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this._playing) this.schedule();
    });
  }

  get playing(): boolean {
    return this._playing;
  }

  play(): void {
    if (this._playing) return;
    this._playing = true;
    this.schedule();
  }

  pause(): void {
    this._playing = false;
    window.clearTimeout(this.timer);
  }

  autoplay(): void {
    if (!prefersReducedMotion()) this.play();
  }

  private schedule(): void {
    window.clearTimeout(this.timer);
    const hold =
      this.index === this.words.length - 1 ? this.opts.restHold : this.opts.hold;
    this.timer = window.setTimeout(() => {
      if (!this.visible || document.hidden) return this.schedule();
      this.advance();
      this.schedule();
    }, hold);
  }

  private advance(): void {
    this.index = (this.index + 1) % this.words.length;

    const old = this.current;
    if (!old.classList.replace('is-entering', 'is-leaving')) {
      old.classList.add('is-leaving');
    }
    void afterAnimation(old).then(() => old.remove());

    this.tiltSign = -this.tiltSign;
    this.current = this.makeWord(this.words[this.index]!);
    this.current.classList.add('is-entering');
    this.current.style.setProperty('--tilt', `${this.tiltSign * this.opts.tilt}deg`);
    this.pill.insertBefore(this.current, this.measure);

    this.fit();
    window.setTimeout(() => squash(this.pill, 0.07), 260);
  }

  private makeWord(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'word-cycle__word';
    span.textContent = text;
    return span;
  }

  private widthOf(text: string): number {
    this.measure.textContent = text;
    const cs = getComputedStyle(this.pill);
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    return Math.ceil(this.measure.getBoundingClientRect().width + pad);
  }

  private fit(): void {
    this.pill.style.width = `${this.widthOf(this.words[this.index]!)}px`;
  }
}
