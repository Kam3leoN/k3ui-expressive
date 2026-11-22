/**
 * Lucid's "shape" clock: the time inside one big Expressive shape that turns a
 * notch (6°) every second on the default spatial spring. Pressing it morphs
 * the shape to the next one in the list.
 *
 * <button class="shape-clock" type="button" aria-label="…">
 *   <svg class="shape-clock__shape" viewBox="0 0 100 100" aria-hidden="true"><path/></svg>
 *   <span class="shape-clock__copy">
 *     <time class="shape-clock__time" data-shape-time></time>
 *     <span class="shape-clock__date" data-shape-date></span>
 *   </span>
 * </button>
 */
import { MaterialShape, type ShapeName } from "./shapes.js";

export interface ShapeClockOptions {
  locale?: string;
  /** shapes visited on each press, first one shown at rest */
  shapes?: ShapeName[];
  /** turn with the seconds (Lucid's "seconds" option) */
  seconds?: boolean;
}

export class ShapeClock {
  private readonly shape: MaterialShape;
  private readonly svg: SVGSVGElement;
  private readonly time: HTMLTimeElement;
  private readonly date: HTMLElement;
  private readonly timeFormat: Intl.DateTimeFormat;
  private readonly dateFormat: Intl.DateTimeFormat;
  private readonly shapes: ShapeName[];
  private readonly seconds: boolean;
  private index = 0;
  private turns = 0;
  private lastSecond = -1;
  private timer: number | undefined;

  constructor(private readonly root: HTMLButtonElement, options: ShapeClockOptions = {}) {
    this.shapes = options.shapes ?? ["cookie9", "clover4", "sunny", "flower", "cookie12", "softBurst", "puffy", "gem"];
    this.seconds = options.seconds ?? true;
    this.svg = root.querySelector("svg")!;
    this.time = root.querySelector("[data-shape-time]")!;
    this.date = root.querySelector("[data-shape-date]")!;
    this.shape = new MaterialShape(this.svg.querySelector("path")!, this.shapes[0]);
    this.timeFormat = new Intl.DateTimeFormat(options.locale, { hour: "numeric", minute: "2-digit" });
    this.dateFormat = new Intl.DateTimeFormat(options.locale, { weekday: "short", day: "numeric", month: "short" });

    root.addEventListener("click", () => this.next());
    document.addEventListener("visibilitychange", () => !document.hidden && this.tick());
  }

  start(): void {
    this.tick();
  }

  stop(): void {
    window.clearTimeout(this.timer);
  }

  next(): void {
    this.index = (this.index + 1) % this.shapes.length;
    this.shape.morphTo(this.shapes[this.index]);
    this.root.dataset.shape = this.shapes[this.index];
  }

  private tick(): void {
    window.clearTimeout(this.timer);
    const d = new Date();
    this.time.textContent = this.timeFormat.format(d);
    this.time.dateTime = d.toISOString().slice(11, 16);
    this.date.textContent = this.dateFormat.format(d);
    this.root.setAttribute("aria-label", `${this.timeFormat.format(d)}, ${this.date.textContent}. Changer de forme`);

    if (this.seconds) {
      // count whole turns so 59 s → 0 s keeps going clockwise instead of unwinding
      const s = d.getSeconds();
      if (this.lastSecond > s) this.turns++;
      this.lastSecond = s;
      this.svg.style.rotate = `${this.turns * 360 + s * 6}deg`;
    }
    this.timer = window.setTimeout(() => this.tick(), 1000 - d.getMilliseconds() + 5);
  }
}
