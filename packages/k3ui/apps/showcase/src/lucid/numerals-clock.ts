/**
 * Analog clock with four large quarter numerals (12 · 3 · 6 · 9), hour + minute
 * hands, and a seconds dot that sticks to the inner outline of the dial shape
 * and glides smoothly around it.
 *
 * <figure class="numerals-clock">
 *   <svg viewBox="0 0 200 200" role="img" data-numerals>…built by the class…</svg>
 * </figure>
 */
import { MaterialShape, type ShapeName } from './shapes.js';
import { prefersReducedMotion } from './motion.js';

const SVG = 'http://www.w3.org/2000/svg';

export interface NumeralsClockOptions {
  locale?: string;
  dial?: ShapeName;
  /** Pull the seconds dot inward from the outline (svg units). */
  secondsInset?: number;
}

export class NumeralsClock {
  private readonly hour: SVGGElement;
  private readonly minute: SVGGElement;
  private readonly dialPath: SVGPathElement;
  private readonly dialOffset: number;
  private readonly dot: SVGCircleElement;
  private readonly inset: number;
  private readonly label: Intl.DateTimeFormat;
  private readonly origin: number;
  private readonly c = 100;
  private pathLen = 0;
  private lastTick = -1;
  private raf = 0;
  private timer: number | undefined;

  constructor(
    private readonly svg: SVGSVGElement,
    options: NumeralsClockOptions = {},
  ) {
    const { dial = 'cookie12', secondsInset = 11 } = options;
    this.inset = secondsInset;
    this.label = new Intl.DateTimeFormat(options.locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    this.origin = midnight.getTime();

    const c = this.c;
    const r = 92;
    this.dialOffset = c - r;

    const dialG = this.el('g', {
      class: 'numerals-clock__dial',
      transform: `translate(${c - r} ${c - r})`,
    });
    this.dialPath = this.el('path', {}, dialG) as SVGPathElement;
    new MaterialShape(this.dialPath, dial, r * 2);
    svg.append(dialG);

    const numerals: { n: string; a: number }[] = [
      { n: '12', a: 0 },
      { n: '3', a: 0.25 },
      { n: '6', a: 0.5 },
      { n: '9', a: 0.75 },
    ];
    const numR = r - 42;
    for (const { n, a } of numerals) {
      const ang = a * 2 * Math.PI;
      const x = c + Math.sin(ang) * numR;
      const y = c - Math.cos(ang) * numR;
      this.el(
        'text',
        {
          class: 'numerals-clock__numeral',
          x: x.toFixed(2),
          y: y.toFixed(2),
          'dominant-baseline': 'central',
          'text-anchor': 'middle',
        },
        svg,
      ).textContent = n;
    }

    this.dot = this.el(
      'circle',
      {
        class: 'numerals-clock__dot',
        cx: c,
        cy: c - (r - this.inset),
        r: 5,
      },
      svg,
    ) as SVGCircleElement;

    const hand = (
      cls: string,
      width: number,
      length: number,
      tail = 0,
    ): SVGGElement => {
      const g = this.el(
        'g',
        { class: `numerals-clock__hand ${cls}` },
        svg,
      ) as SVGGElement;
      this.el(
        'rect',
        {
          x: c - width / 2,
          y: c - length,
          width,
          height: length + tail,
          rx: width / 2,
        },
        g,
      );
      return g;
    };
    this.hour = hand('is-hour', 12, r * 0.38, 6);
    this.minute = hand('is-minute', 8, r * 0.55, 4);
    this.el(
      'circle',
      { class: 'numerals-clock__cap', cx: c, cy: c, r: 8 },
      svg,
    );

    document.addEventListener(
      'visibilitychange',
      () => !document.hidden && this.start(),
    );
  }

  start(): void {
    this.stop();
    this.pathLen =
      typeof this.dialPath.getTotalLength === 'function'
        ? this.dialPath.getTotalLength()
        : 0;
    if (prefersReducedMotion()) {
      this.sync(true);
      this.timer = window.setTimeout(() => this.start(), 1000);
      return;
    }
    const frame = (): void => {
      this.sync(false);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.clearTimeout(this.timer);
    this.timer = undefined;
  }

  /**
   * Shape path starts at 3 o'clock and walks clockwise (screen Y-down).
   * Clock fraction 0 = 12 → pathU = 0.75.
   */
  private sync(wholeSecond: boolean): void {
    const now = new Date();
    const ms = wholeSecond ? 0 : now.getMilliseconds();
    const sWhole = Math.floor((now.getTime() - this.origin) / 1000);
    const secFrac =
      (now.getSeconds() + ms / 1000) / 60;

    const jumped = this.lastTick >= 0 && sWhole - this.lastTick > 2;
    if (jumped) this.svg.classList.add('is-jumping');

    this.minute.style.rotate = `${(sWhole + ms / 1000) / 10}deg`;
    this.hour.style.rotate = `${(sWhole + ms / 1000) / 120}deg`;
    this.lastTick = sWhole;

    if (jumped) {
      void this.svg.getBoundingClientRect();
      this.svg.classList.remove('is-jumping');
    }

    this.placeDot(secFrac);
    this.svg.setAttribute('aria-label', this.label.format(now));
  }

  private placeDot(clockFrac: number): void {
    let x: number;
    let y: number;

    if (
      this.pathLen > 0 &&
      typeof this.dialPath.getPointAtLength === 'function'
    ) {
      /* Sticky on the dial outline, then pulled inward toward the centre. */
      const pathU = (clockFrac + 0.75) % 1;
      const pt = this.dialPath.getPointAtLength(pathU * this.pathLen);
      x = pt.x + this.dialOffset;
      y = pt.y + this.dialOffset;
      const dx = this.c - x;
      const dy = this.c - y;
      const d = Math.hypot(dx, dy) || 1;
      x += (dx / d) * this.inset;
      y += (dy / d) * this.inset;
    } else {
      /* jsdom / no path metrics — circular fallback. */
      const a = clockFrac * 2 * Math.PI;
      const rad = 92 - this.inset;
      x = this.c + Math.sin(a) * rad;
      y = this.c - Math.cos(a) * rad;
    }

    this.dot.setAttribute('cx', x.toFixed(2));
    this.dot.setAttribute('cy', y.toFixed(2));
  }

  private el(
    tag: string,
    attrs: Record<string, string | number>,
    parent?: Element,
  ): SVGElement {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    parent?.append(node);
    return node;
  }
}
