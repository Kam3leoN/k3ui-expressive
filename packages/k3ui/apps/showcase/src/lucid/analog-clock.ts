/**
 * Lucid's analog clock (ClockWidget.qml "analog"): a 12-sided cookie for a dial,
 * twelve dots, a date window at three o'clock, chunky hour and minute hands,
 * and here a full seconds hand that ticks on the fast spatial spring.
 *
 * <figure class="analog-clock">
 *   <svg viewBox="0 0 200 200" role="img" data-analog>…built by the class…</svg>
 * </figure>
 *
 * Angles only ever grow (they count from the midnight before the page opened),
 * so 59 s → 0 s and 11:59 → 12:00 keep turning clockwise instead of unwinding.
 */
import { MaterialShape, type ShapeName } from "./shapes.js";

const SVG = "http://www.w3.org/2000/svg";

export interface AnalogClockOptions {
  locale?: string;
  /** the dial; Lucid uses cookie12 */
  dial?: ShapeName;
  /** the watch's date window at three */
  showDate?: boolean;
}

export class AnalogClock {
  private readonly hour: SVGGElement;
  private readonly minute: SVGGElement;
  private readonly second: SVGGElement;
  private readonly dateText: SVGTextElement | undefined;
  private readonly label: Intl.DateTimeFormat;
  private readonly origin: number;
  private lastTick = -1;
  private timer: number | undefined;

  constructor(private readonly svg: SVGSVGElement, options: AnalogClockOptions = {}) {
    const { dial = "cookie12", showDate = true } = options;
    this.label = new Intl.DateTimeFormat(options.locale, { hour: "numeric", minute: "2-digit", second: "2-digit" });
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    this.origin = midnight.getTime();

    const c = 100; // centre
    const r = 92; // dial radius

    // dial: the cookie, as a 184-unit shape centred in the 200 box
    const dialG = this.el("g", { class: "analog-clock__dial", transform: `translate(${c - r} ${c - r})` });
    const dialPath = this.el("path", {}, dialG);
    new MaterialShape(dialPath as SVGPathElement, dial, r * 2);
    svg.append(dialG);

    // twelve dots; the quarters bigger and darker
    for (let i = 0; i < 12; i++) {
      if (showDate && i === 3) continue;
      const a = (i / 12) * 2 * Math.PI;
      const quarter = i % 3 === 0;
      this.el("circle", {
        class: quarter ? "analog-clock__mark is-quarter" : "analog-clock__mark",
        cx: (c + Math.sin(a) * (r - 18)).toFixed(2),
        cy: (c - Math.cos(a) * (r - 18)).toFixed(2),
        r: quarter ? 3.5 : 2,
      }, svg);
    }

    if (showDate) {
      const win = this.el("g", { class: "analog-clock__date" }, svg);
      this.el("rect", { x: c + r - 46, y: c - 11, width: 26, height: 22, rx: 8 }, win);
      this.dateText = this.el("text", { x: c + r - 33, y: c, "dominant-baseline": "central", "text-anchor": "middle" }, win) as SVGTextElement;
    }

    // hands point at twelve; their <g> turns about the centre
    const hand = (cls: string, width: number, length: number, tail = 0): SVGGElement => {
      const g = this.el("g", { class: `analog-clock__hand ${cls}` }, svg) as SVGGElement;
      this.el("rect", { x: c - width / 2, y: c - length, width, height: length + tail, rx: width / 2 }, g);
      return g;
    };
    this.hour = hand("is-hour", 11, r * 0.52, 5.5);
    this.minute = hand("is-minute", 6, r * 0.8, 3);
    this.second = hand("is-second", 2.5, r * 0.88, r * 0.18);
    this.el("circle", { class: "analog-clock__cap", cx: c, cy: c, r: 7 }, svg);
    this.el("circle", { class: "analog-clock__pin", cx: c, cy: c, r: 3 }, svg);

    document.addEventListener("visibilitychange", () => !document.hidden && this.tick());
  }

  start(): void {
    this.tick();
  }

  stop(): void {
    window.clearTimeout(this.timer);
  }

  private tick(): void {
    window.clearTimeout(this.timer);
    const now = new Date();
    const s = Math.floor((now.getTime() - this.origin) / 1000); // whole seconds since that midnight

    // back from a sleeping tab: jump straight there rather than whirl the hands round
    const jumped = this.lastTick >= 0 && s - this.lastTick > 2;
    if (jumped) this.svg.classList.add("is-jumping");

    this.second.style.rotate = `${s * 6}deg`;
    this.minute.style.rotate = `${s / 10}deg`; // 6° a minute, a tenth of a degree a second
    this.hour.style.rotate = `${s / 120}deg`; // 30° an hour
    this.lastTick = s;

    if (jumped) {
      void this.svg.getBoundingClientRect(); // commit the jump before transitions come back
      this.svg.classList.remove("is-jumping");
    }
    if (this.dateText) this.dateText.textContent = String(now.getDate());
    this.svg.setAttribute("aria-label", this.label.format(now));

    this.timer = window.setTimeout(() => this.tick(), 1000 - now.getMilliseconds() + 5);
  }

  private el(tag: string, attrs: Record<string, string | number>, parent?: Element): SVGElement {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    parent?.append(node);
    return node;
  }
}
