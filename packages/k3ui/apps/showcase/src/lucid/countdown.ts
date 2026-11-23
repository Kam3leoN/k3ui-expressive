/**
 * Countdown timer — digits + narrow icon buttons (no shapes).
 */
import { clock } from './pomodoro.js';

export interface CountdownPreset {
  key: string;
  /** duration in milliseconds */
  ms: number;
}

export const COUNTDOWN_PRESETS: readonly CountdownPreset[] = [
  { key: '5m', ms: 5 * 60_000 },
  { key: '10m', ms: 10 * 60_000 },
  { key: '15m', ms: 15 * 60_000 },
];

interface State {
  preset: string;
  /** Custom duration when preset === 'custom' */
  customMs: number;
  running: boolean;
  endsAt: number;
  left: number;
  span: number;
  started: boolean;
}

const STORE = 'md-countdown';
const DEFAULT_CUSTOM_MS = 60_000;

export class Countdown {
  private s: State;
  private readonly el: {
    title: HTMLElement;
    time: HTMLElement;
    toggle: HTMLButtonElement;
    stop: HTMLElement & { disabled: boolean };
    status: HTMLElement;
  };
  private raf = 0;
  private lastText = '';

  constructor(private readonly root: HTMLElement) {
    const q = <T extends Element = HTMLElement>(sel: string): T => {
      const el = root.querySelector<T>(sel);
      if (!el) throw new Error(`Countdown: missing ${sel}`);
      return el;
    };
    this.el = {
      title: q('[data-cd-title]'),
      time: q('[data-cd-time]'),
      toggle: q<HTMLButtonElement>('[data-cd-toggle]'),
      stop: q('[data-cd-stop]'),
      status: q('[data-cd-status]'),
    };
    this.s = this.load();

    this.el.toggle.addEventListener('click', () => this.toggle());
    this.el.stop.addEventListener('k3-click', () => {
      // Gate on state — do not rely on host[disabled] (Lit updates the shadow
      // button asynchronously, so a click right after start is swallowed).
      if (!this.s.started) return;
      this.reset();
    });
    document.addEventListener('visibilitychange', () => !document.hidden && this.render());

    this.render(true);
    if (this.s.running) this.loop();
  }

  get presetKey(): string {
    return this.s.preset;
  }

  /** Custom length in whole minutes (at least 1). */
  get customMinutes(): number {
    return Math.max(1, Math.round(this.s.customMs / 60_000));
  }

  get idle(): boolean {
    return !this.s.started;
  }

  usePreset(key: string): void {
    if (this.s.started) return;
    const p = COUNTDOWN_PRESETS.find((x) => x.key === key);
    if (!p) return;
    this.s.preset = key;
    this.s.span = p.ms;
    this.s.left = p.ms;
    this.save();
    this.render(true);
  }

  /** Apply a custom duration in minutes and select the custom preset. */
  setCustom(minutes: number): void {
    if (this.s.started) return;
    const m = Number.isFinite(minutes) ? Math.min(180, Math.max(1, Math.round(minutes))) : 1;
    const ms = m * 60_000;
    this.s.customMs = ms;
    this.s.preset = 'custom';
    this.s.span = ms;
    this.s.left = ms;
    this.save();
    this.render(true);
  }

  toggle(): void {
    const now = Date.now();
    if (!this.s.started) {
      const span = this.presetMs();
      Object.assign(this.s, {
        started: true,
        span,
        left: span,
        endsAt: now + span,
        running: true,
      });
    } else if (this.s.running) {
      this.s.left = Math.max(0, this.s.endsAt - now);
      this.s.running = false;
    } else {
      if (this.s.left <= 0) {
        this.reset();
        return this.toggle();
      }
      this.s.endsAt = now + this.s.left;
      this.s.running = true;
    }
    this.save();
    this.render(true);
    if (this.s.running) this.loop();
  }

  reset(): void {
    const span = this.presetMs();
    Object.assign(this.s, {
      started: false,
      running: false,
      left: span,
      span,
      endsAt: 0,
    });
    this.save();
    this.render(true);
  }

  private presetMs(): number {
    if (this.s.preset === 'custom') return this.s.customMs;
    return (
      COUNTDOWN_PRESETS.find((p) => p.key === this.s.preset)?.ms ??
      COUNTDOWN_PRESETS[0].ms
    );
  }

  private remaining(): number {
    return this.s.running
      ? Math.max(0, this.s.endsAt - Date.now())
      : this.s.left;
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    const frame = (): void => {
      if (!this.s.running) return;
      if (this.remaining() <= 0) {
        this.s.left = 0;
        this.s.running = false;
        this.s.started = true;
        this.el.status.textContent = this.el.title.dataset.done ?? 'Done';
        this.save();
        this.render(true);
        return;
      }
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private render(structural = false): void {
    const { running, started } = this.s;
    const left = started ? this.remaining() : this.presetMs();
    const text = clock(left);
    if (text !== this.lastText) {
      this.el.time.textContent = text;
      this.lastText = text;
    }
    if (!structural) return;

    this.root.dataset.running = String(running);
    this.root.dataset.idle = String(!started);

    this.el.toggle.setAttribute(
      'aria-label',
      running
        ? (this.el.toggle.dataset.pauseLabel ?? 'Pause')
        : (this.el.toggle.dataset.playLabel ?? 'Start'),
    );
    this.el.toggle.querySelector('[data-icon=pause]')?.toggleAttribute('hidden', !running);
    this.el.toggle.querySelector('[data-icon=play]')?.toggleAttribute('hidden', running);
    this.setStopDisabled(!started);

    this.root.dispatchEvent(new CustomEvent('countdownchange', { bubbles: true }));
  }

  private setStopDisabled(disabled: boolean): void {
    const el = this.el.stop;
    // Keep the CE enabled so the shadow button stays clickable; style via data-inactive.
    el.disabled = false;
    el.removeAttribute('disabled');
    el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    el.toggleAttribute('data-inactive', disabled);
  }

  private load(): State {
    const span = COUNTDOWN_PRESETS[0].ms;
    const fresh: State = {
      preset: '5m',
      customMs: DEFAULT_CUSTOM_MS,
      running: false,
      endsAt: 0,
      left: span,
      span,
      started: false,
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Partial<State> | null;
      if (!saved) return fresh;
      const customMs =
        typeof saved.customMs === 'number' && saved.customMs > 0
          ? saved.customMs
          : DEFAULT_CUSTOM_MS;
      const presetKey = saved.preset;
      const preset =
        presetKey === 'custom' || COUNTDOWN_PRESETS.some((p) => p.key === presetKey)
          ? (presetKey as string)
          : '5m';
      const next = { ...fresh, ...saved, customMs, preset, running: false };
      if (preset === 'custom') {
        next.span = customMs;
        next.left = customMs;
      }
      return next;
    } catch {
      return fresh;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORE, JSON.stringify({ ...this.s, running: false }));
    } catch {
      /* ignore */
    }
  }
}
