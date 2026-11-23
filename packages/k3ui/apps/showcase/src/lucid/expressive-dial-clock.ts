/**
 * Material 3 Expressive dial clock — 60 ticks along a rounded-rect contour,
 * stretched condensed digits, seconds trail on the ticks.
 *
 * Port of clock-material-expressive.html (showcase demo).
 *
 * <figure class="expressive-dial-clock" data-expressive-dial role="timer">
 *   <svg class="expressive-dial-clock__dial" data-expressive-dial-svg aria-hidden="true"></svg>
 *   <time class="expressive-dial-clock__time" data-expressive-dial-time></time>
 * </figure>
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const W = 400;
const H = 370;
const RADIUS = 64;
const EDGE = 9;
const LEN = 14;
/** Air between tick tips and digit ink — larger = smaller type. */
const GAP = 40;
const MAX_FONT = 220;
const TRAIL = 40;
const STRETCH = 1.32;

export interface ExpressiveDialClockOptions {
  locale?: string;
  /** Override clock time (tests / fixed demos). */
  now?: () => Date;
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Point inside a centered rounded rect (half-sizes A,B · corner R). */
function inside(x: number, y: number, A: number, B: number, R: number): boolean {
  x = Math.abs(x);
  y = Math.abs(y);
  if (x > A || y > B) return false;
  const dx = Math.max(x - (A - R), 0);
  const dy = Math.max(y - (B - R), 0);
  return dx * dx + dy * dy <= R * R;
}

/** Distance from center to rounded-rect edge along direction (c,s). */
function rayHit(c: number, s: number, A: number, B: number, R: number): number {
  let lo = 0;
  let hi = Math.hypot(A, B);
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (inside(c * m, s * m, A, B, R)) lo = m;
    else hi = m;
  }
  return lo;
}

export class ExpressiveDialClock {
  private readonly svg: SVGSVGElement;
  private readonly timeEl: HTMLTimeElement;
  private readonly ticks: SVGLineElement[] = [];
  private readonly now: () => Date;
  private readonly label: Intl.DateTimeFormat;
  private readonly reduce = prefersReducedMotion();
  private last = '';
  private inkH = 1;
  private fontReady: Promise<void>;
  private timer: number | undefined;
  private running = false;
  private iA = 0;
  private iB = 0;
  private iR = 0;

  constructor(
    private readonly root: HTMLElement,
    options: ExpressiveDialClockOptions = {},
  ) {
    const svg = root.querySelector<SVGSVGElement>('[data-expressive-dial-svg]');
    const time = root.querySelector<HTMLTimeElement>('[data-expressive-dial-time]');
    if (!svg || !time) throw new Error('ExpressiveDialClock: missing dial svg / time');
    this.svg = svg;
    this.timeEl = time;
    this.now = options.now ?? (() => new Date());
    this.label = new Intl.DateTimeFormat(options.locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.buildTicks();

    const inset = EDGE + LEN + 2 + GAP;
    this.iA = W / 2 - inset;
    this.iB = H / 2 - inset;
    this.iR = Math.max(RADIUS - inset, 0);

    this.fontReady = this.measureInk().catch(() => {
      this.inkH = 0.72;
    });
  }

  start(): void {
    this.running = true;
    void this.fontReady.then(() => {
      if (!this.running) return;
      this.render();
      if (this.timer != null) return;
      this.timer = window.setInterval(() => this.render(), this.reduce ? 1000 : 250);
    });
  }

  stop(): void {
    this.running = false;
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private buildTicks(): void {
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    this.ticks.length = 0;
    const cx = W / 2;
    const cy = H / 2;
    const oA = W / 2 - EDGE;
    const oB = H / 2 - EDGE;
    const oR = RADIUS - EDGE;
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * 2 * Math.PI - Math.PI / 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      const r = rayHit(c, s, oA, oB, oR);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(cx + c * r));
      line.setAttribute('y1', String(cy + s * r));
      line.setAttribute('x2', String(cx + c * (r - LEN)));
      line.setAttribute('y2', String(cy + s * (r - LEN)));
      line.setAttribute('class', 'expressive-dial-clock__tick');
      this.svg.appendChild(line);
      this.ticks.push(line);
    }
  }

  private async measureInk(): Promise<void> {
    if (typeof document !== 'undefined' && document.fonts?.load) {
      try {
        await Promise.race([
          document.fonts.load('800 100px "Barlow Condensed"'),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 120);
          }),
        ]);
      } catch {
        /* subset / jsdom — still measure with fallback metrics */
      }
    }
    /* DOM probe — avoids canvas (unavailable in jsdom). */
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.textContent = '0123456789';
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;' +
      'font:800 100px "Barlow Condensed","Barlow",system-ui,sans-serif;line-height:1;';
    document.body.append(probe);
    const h = probe.getBoundingClientRect().height / 100;
    probe.remove();
    this.inkH = Number.isFinite(h) && h > 0.2 ? h : 0.72;
  }

  private fitFont(html: string): number {
    this.timeEl.style.fontSize = '100px';
    this.timeEl.innerHTML = `<span class="expressive-dial-clock__probe">${html}</span>`;
    const probe = this.timeEl.querySelector('.expressive-dial-clock__probe');
    const w = (probe?.getBoundingClientRect().width ?? 200) / 100;
    let lo = 10;
    let hi = MAX_FONT;
    for (let k = 0; k < 30; k++) {
      const f = (lo + hi) / 2;
      if (inside((w * f) / 2, (this.inkH * STRETCH * f) / 2, this.iA, this.iB, this.iR)) {
        lo = f;
      } else {
        hi = f;
      }
    }
    return Math.floor(lo);
  }

  private paintTicks(sec: number): void {
    for (let i = 0; i < 60; i++) {
      const age = (sec - i + 60) % 60;
      let p = 0;
      if (age <= 10) p = 100;
      else if (age < TRAIL) {
        p = Math.round(100 * Math.pow(1 - (age - 10) / (TRAIL - 10), 1.4));
      }
      const tick = this.ticks[i];
      if (!tick) continue;
      tick.style.setProperty('--k3-dial-tick-mix', `${p}%`);
    }
  }

  private render(): void {
    const d = this.now();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const str = `${hours}:${minutes}`;
    this.root.setAttribute('aria-label', this.label.format(d));
    this.timeEl.dateTime = `${String(hours).padStart(2, '0')}:${minutes}`;

    if (str !== this.last) {
      const html = [...str]
        .map((ch, i) => {
          if (ch === ':') {
            return '<span class="expressive-dial-clock__colon">:</span>';
          }
          const pop =
            !this.reduce && this.last && this.last[i] !== ch
              ? ' expressive-dial-clock__digit--pop'
              : '';
          return `<span class="expressive-dial-clock__digit${pop}">${ch}</span>`;
        })
        .join('');
      this.timeEl.style.fontSize = `${this.fitFont(html)}px`;
      this.timeEl.innerHTML = `<span class="expressive-dial-clock__stretch">${html}</span>`;
      this.last = str;
    }
    this.paintTicks(d.getSeconds());
  }
}
