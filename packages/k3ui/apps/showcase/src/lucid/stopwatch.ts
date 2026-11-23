/**
 * Stopwatch — digits + narrow icon buttons (no shapes).
 */

interface State {
  running: boolean;
  startedAt: number;
  accrued: number;
}

const STORE = 'md-stopwatch';

/** m:ss.t (tenths) — stopwatch readout */
export function clockUp(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const t = Math.floor((Math.max(0, ms) % 1000) / 100);
  const ss = String(s).padStart(2, '0');
  if (h) return `${h}:${String(m).padStart(2, '0')}:${ss}.${t}`;
  return `${m}:${ss}.${t}`;
}

export class Stopwatch {
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
      if (!el) throw new Error(`Stopwatch: missing ${sel}`);
      return el;
    };
    this.el = {
      title: q('[data-sw-title]'),
      time: q('[data-sw-time]'),
      toggle: q<HTMLButtonElement>('[data-sw-toggle]'),
      stop: q('[data-sw-stop]'),
      status: q('[data-sw-status]'),
    };
    this.s = this.load();

    this.el.toggle.addEventListener('click', () => this.toggle());
    this.el.stop.addEventListener('k3-click', () => {
      // Gate on state — do not rely on host[disabled] (Lit updates the shadow
      // button asynchronously, so a click right after start is swallowed).
      if (this.idle) return;
      this.reset();
    });
    document.addEventListener('visibilitychange', () => !document.hidden && this.render());

    this.render(true);
    if (this.s.running) this.loop();
  }

  get idle(): boolean {
    return this.elapsed() === 0 && !this.s.running;
  }

  toggle(): void {
    const now = Date.now();
    if (this.s.running) {
      this.s.accrued = this.elapsed();
      this.s.running = false;
      this.s.startedAt = 0;
    } else {
      this.s.startedAt = now;
      this.s.running = true;
    }
    this.save();
    this.render(true);
    if (this.s.running) this.loop();
  }

  reset(): void {
    Object.assign(this.s, { running: false, startedAt: 0, accrued: 0 });
    this.save();
    this.render(true);
  }

  private elapsed(): number {
    return this.s.running
      ? this.s.accrued + (Date.now() - this.s.startedAt)
      : this.s.accrued;
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    const frame = (): void => {
      if (!this.s.running) return;
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private render(structural = false): void {
    const ms = this.elapsed();
    const text = clockUp(ms);
    if (text !== this.lastText) {
      this.el.time.textContent = text;
      this.lastText = text;
    }
    if (!structural) return;

    const { running } = this.s;
    this.root.dataset.running = String(running);
    this.root.dataset.idle = String(this.idle);

    this.el.toggle.setAttribute(
      'aria-label',
      running
        ? (this.el.toggle.dataset.pauseLabel ?? 'Pause')
        : (this.el.toggle.dataset.playLabel ?? 'Start'),
    );
    this.el.toggle.querySelector('[data-icon=pause]')?.toggleAttribute('hidden', !running);
    this.el.toggle.querySelector('[data-icon=play]')?.toggleAttribute('hidden', running);
    this.setStopDisabled(this.idle);

    this.root.dispatchEvent(new CustomEvent('stopwatchchange', { bubbles: true }));
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
    const fresh: State = { running: false, startedAt: 0, accrued: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Partial<State> | null;
      return saved ? { ...fresh, ...saved, running: false, startedAt: 0 } : fresh;
    } catch {
      return fresh;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(
        STORE,
        JSON.stringify({ accrued: this.elapsed(), running: false, startedAt: 0 }),
      );
    } catch {
      /* ignore */
    }
  }
}
