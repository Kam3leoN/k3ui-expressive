/**
 * Lucid's Pomodoro widget (TimerWidget.qml "pomodoro" + Chrono.qml): the phase
 * in a cookie shape, a wavy ring counting down, one dot per round, and
 * stop / play-pause / skip. Focus sits in a cookie, breaks in a clover.
 *
 * Time is kept as an end timestamp, not a counter, so it stays right in a
 * background tab, and the state survives a reload when storage is available.
 */
import { MaterialShape } from "./shapes.js";
import { WavyProgress } from "./wavy-progress.js";

export type Phase = "idle" | "focus" | "short" | "long";

export interface PomodoroPreset {
  key: string;
  name: string;
  focus: number; // minutes
  short: number;
  long: number;
  rounds: number; // focus sessions before the long break
}

export const PRESETS: readonly PomodoroPreset[] = [
  { key: "classic", name: "Classique", focus: 25, short: 5, long: 15, rounds: 4 },
  { key: "deep", name: "Travail profond", focus: 50, short: 10, long: 30, rounds: 3 },
  { key: "sprint", name: "Sprint", focus: 15, short: 3, long: 10, rounds: 4 },
  { key: "long", name: "Longue haleine", focus: 90, short: 20, long: 30, rounds: 2 },
];

const LABELS: Record<Phase, string> = {
  idle: "Pomodoro",
  focus: "Concentration",
  short: "Pause courte",
  long: "Pause longue",
};

interface State {
  preset: string;
  phase: Phase;
  round: number; // focus sessions finished in this set
  running: boolean;
  endsAt: number; // while running
  left: number; // ms, while paused
  span: number; // ms, length of the phase in hand
  day: string;
  doneToday: number;
}

const STORE = "md-pomodoro";
const today = (): string => new Date().toISOString().slice(0, 10);

export class Pomodoro {
  private s: State;
  private readonly ring: WavyProgress;
  private readonly shape: MaterialShape;
  private readonly el: {
    title: HTMLElement;
    time: HTMLElement;
    dots: HTMLElement;
    toggle: HTMLButtonElement;
    stop: HTMLButtonElement;
    skip: HTMLButtonElement;
    status: HTMLElement;
    today: HTMLElement;
  };
  private raf = 0;
  private audio: AudioContext | undefined;
  private lastText = "";

  constructor(private readonly root: HTMLElement) {
    const q = <T extends Element = HTMLElement>(sel: string): T => {
      const el = root.querySelector<T>(sel);
      if (!el) throw new Error(`Pomodoro: missing ${sel}`);
      return el;
    };
    this.el = {
      title: q("[data-pomo-title]"),
      time: q("[data-pomo-time]"),
      dots: q("[data-pomo-dots]"),
      toggle: q("[data-pomo-toggle]"),
      stop: q("[data-pomo-stop]"),
      skip: q("[data-pomo-skip]"),
      status: q("[data-pomo-status]"),
      today: q("[data-pomo-today]"),
    };
    this.ring = new WavyProgress(q<SVGSVGElement>(".wavy-progress"), { thickness: 7 });
    this.shape = new MaterialShape(q<SVGPathElement>(".pomodoro__shape path"), "cookie9");
    this.s = this.load();

    this.el.toggle.addEventListener("click", () => this.toggle());
    this.el.stop.addEventListener("click", () => this.stop());
    this.el.skip.addEventListener("click", () => this.advance(false));
    document.addEventListener("visibilitychange", () => !document.hidden && this.render());

    this.render(true);
    if (this.s.running) this.loop();
  }

  get presetKey(): string {
    return this.preset.key;
  }

  get preset(): PomodoroPreset {
    return PRESETS.find((p) => p.key === this.s.preset) ?? PRESETS[0];
  }

  /** Change the lengths; only while idle, like Lucid's Settings */
  usePreset(key: string): void {
    if (this.s.phase !== "idle") return;
    this.s.preset = key;
    this.save();
    this.render(true);
  }

  get idle(): boolean {
    return this.s.phase === "idle";
  }

  toggle(): void {
    this.unlockAudio();
    const now = Date.now();
    if (this.s.phase === "idle") {
      this.begin("focus");
    } else if (this.s.running) {
      this.s.left = Math.max(0, this.s.endsAt - now);
      this.s.running = false;
    } else {
      this.s.endsAt = now + this.s.left;
      this.s.running = true;
    }
    this.save();
    this.render(true);
    if (this.s.running) this.loop();
  }

  stop(): void {
    Object.assign(this.s, { phase: "idle", running: false, round: 0, left: 0, span: 0 });
    this.save();
    this.render(true);
  }

  private minutes(phase: Phase): number {
    const p = this.preset;
    return phase === "short" ? p.short : phase === "long" ? p.long : p.focus;
  }

  private begin(phase: Phase): void {
    const span = this.minutes(phase) * 60_000;
    Object.assign(this.s, { phase, span, left: span, endsAt: Date.now() + span, running: true });
  }

  /** next phase; `finished` when the time ran out rather than a skip */
  private advance(finished: boolean): void {
    if (this.s.phase === "idle") return;
    const was = this.s.phase;
    let next: Phase = "focus";
    if (was === "focus") {
      this.s.round++;
      next = this.s.round % this.preset.rounds === 0 ? "long" : "short";
      if (finished) {
        if (this.s.day !== today()) Object.assign(this.s, { day: today(), doneToday: 0 });
        this.s.doneToday++;
      }
    }
    if (finished) this.chime(was === "focus" ? [660, 880] : [880, 660]);

    if (was === "long") {
      this.stop();
      this.announce("Cycle terminé. Relancez quand vous êtes prêt.");
      return;
    }
    const running = this.s.running || finished;
    this.begin(next);
    if (!running) this.s.running = false;
    this.announce(finished ? `${LABELS[was]} terminée. ${LABELS[next]}.` : `${LABELS[next]}.`);
    this.save();
    this.render(true);
    if (this.s.running) this.loop();
  }

  private remaining(): number {
    return this.s.running ? Math.max(0, this.s.endsAt - Date.now()) : this.s.left;
  }

  private loop(): void {
    cancelAnimationFrame(this.raf);
    const frame = (): void => {
      if (!this.s.running) return;
      if (this.remaining() <= 0) return this.advance(true);
      this.render();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private render(structural = false): void {
    const { phase, running, span } = this.s;
    const idle = phase === "idle";
    const left = idle ? this.minutes("focus") * 60_000 : this.remaining();

    const text = clock(left);
    if (text !== this.lastText) {
      this.el.time.textContent = text;
      this.lastText = text;
    }
    this.ring.set(idle || span <= 0 ? 0 : left / span);
    if (!structural) return;

    this.root.dataset.phase = phase;
    this.root.dataset.running = String(running);
    this.el.title.textContent = LABELS[phase];
    this.ring.setMoving(running);
    this.shape.morphTo(phase === "focus" || idle ? "cookie9" : "clover4");

    this.el.toggle.setAttribute("aria-label", running ? "Mettre en pause" : idle ? "Démarrer" : "Reprendre");
    this.el.toggle.querySelector("[data-icon=pause]")!.toggleAttribute("hidden", !running);
    this.el.toggle.querySelector("[data-icon=play]")!.toggleAttribute("hidden", running);
    this.el.stop.disabled = idle;
    this.el.skip.disabled = idle;

    // one dot per round; the one in hand stretches into a pill
    const rounds = this.preset.rounds;
    const doneRounds = this.s.round % rounds;
    this.el.dots.replaceChildren(
      ...Array.from({ length: rounds }, (_, i) => {
        const dot = document.createElement("span");
        dot.className = "pomodoro__dot";
        if (i < doneRounds) dot.classList.add("is-done");
        if (i === doneRounds && phase === "focus") dot.classList.add("is-current");
        return dot;
      }),
    );
    this.el.dots.setAttribute("aria-label", `Session ${Math.min(doneRounds + 1, rounds)} sur ${rounds}`);

    this.root.dispatchEvent(new CustomEvent("pomodorochange", { bubbles: true }));

    const n = this.s.day === today() ? this.s.doneToday : 0;
    this.el.today.textContent = n ? `${n} session${n > 1 ? "s" : ""} aujourd’hui` : "Aucune session aujourd’hui";
  }

  private announce(msg: string): void {
    this.el.status.textContent = msg;
  }

  // ---- sound: two soft notes, Web Audio, only after a first press ----------
  private unlockAudio(): void {
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
    } catch {
      /* no audio: the ring and the announcement still say it */
    }
  }

  private chime(notes: number[]): void {
    const ctx = this.audio;
    if (!ctx) return;
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // ---- storage --------------------------------------------------------------
  private load(): State {
    const fresh: State = { preset: "classic", phase: "idle", round: 0, running: false, endsAt: 0, left: 0, span: 0, day: today(), doneToday: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null") as Partial<State> | null;
      return saved ? { ...fresh, ...saved } : fresh;
    } catch {
      return fresh;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORE, JSON.stringify(this.s));
    } catch {
      /* storage off: the timer still works for this visit */
    }
  }
}

/** m:ss, or h:mm:ss past the hour, rounded up like Lucid's countdown */
export function clock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
