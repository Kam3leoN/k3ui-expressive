import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { glowParticlesStyles } from './glow-particles.styles.js';

export const GlowParticlesSpecs = {
  count: 48,
  speed: 0.35,
  sizeMin: 1.2,
  sizeMax: 4.5,
  glow: 18,
  fps: 30,
} as const;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  pulse: number;
};

/**
 * Glowing particles lookalike (Figma Community vibe) — canvas 2D soft dots.
 * No WebGL / WebGPU / Anime.js.
 *
 * ```html
 * <k3-glow-particles count="56" color="#7dd3fc" interactive>
 *   <span>Glow</span>
 * </k3-glow-particles>
 * ```
 */
export class K3GlowParticles extends K3Element {
  static override styles = [hostReset, glowParticlesStyles];

  @property({ type: Number }) count: number = GlowParticlesSpecs.count;
  /** Base particle / glow color. */
  @property() color = '#7dd3fc';
  /** Drift speed multiplier. */
  @property({ type: Number }) speed: number = GlowParticlesSpecs.speed;
  /** Soft blur radius in CSS px. */
  @property({ type: Number }) glow: number = GlowParticlesSpecs.glow;
  /** Attract particles slightly toward the pointer. */
  @property({ type: Boolean, reflect: true }) interactive = false;
  @property({ type: Boolean }) autoplay = true;

  @query('canvas') private canvas?: HTMLCanvasElement;

  private particles: Particle[] = [];
  private raf = 0;
  private last = 0;
  private running = false;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private pointer = { x: 0.5, y: 0.5, active: false };
  private ro?: ResizeObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointermove', this.onMove);
    this.addEventListener('pointerleave', this.onLeave);
  }

  override firstUpdated(): void {
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this);
    this.resize();
    if (this.autoplay) this.play();
  }

  override disconnectedCallback(): void {
    this.stop();
    this.ro?.disconnect();
    this.ro = undefined;
    this.removeEventListener('pointermove', this.onMove);
    this.removeEventListener('pointerleave', this.onLeave);
    super.disconnectedCallback();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('count') || changed.has('speed') || changed.has('color')) {
      this.seed();
    }
  }

  play(): void {
    if (prefersReducedMotion()) {
      this.paintStatic();
      return;
    }
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  restart(): void {
    this.stop();
    this.seed();
    this.play();
  }

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.interactive) return;
    const r = this.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.pointer.x = (e.clientX - r.left) / r.width;
    this.pointer.y = (e.clientY - r.top) / r.height;
    this.pointer.active = true;
  };

  private readonly onLeave = (): void => {
    this.pointer.active = false;
  };

  private resize(): void {
    const canvas = this.canvas;
    if (!canvas) return;
    const rect = this.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, Math.floor(rect.width));
    this.h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(this.w * this.dpr);
    canvas.height = Math.floor(this.h * this.dpr);
    try {
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    } catch {
      /* jsdom has no canvas implementation */
    }
    if (!this.particles.length) this.seed();
    if (!this.running) this.paintStatic();
  }

  private seed(): void {
    const n = Math.max(1, Math.floor(this.count));
    const spd = Math.max(0.05, this.speed);
    this.particles = Array.from({ length: n }, () => {
      const r =
        GlowParticlesSpecs.sizeMin +
        Math.random() * (GlowParticlesSpecs.sizeMax - GlowParticlesSpecs.sizeMin);
      return {
        x: Math.random() * Math.max(1, this.w),
        y: Math.random() * Math.max(1, this.h),
        vx: (Math.random() - 0.5) * spd,
        vy: (Math.random() - 0.5) * spd,
        r,
        a: 0.35 + Math.random() * 0.55,
        pulse: Math.random() * Math.PI * 2,
      };
    });
  }

  private paintStatic(): void {
    const canvas = this.canvas;
    if (!canvas || !this.w || !this.h) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;
    ctx.clearRect(0, 0, this.w, this.h);
    for (const p of this.particles) this.drawParticle(ctx, p, 0);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(48, now - this.last);
    this.last = now;
    this.step(dt / 16.67);
    this.paintStatic();
    this.raf = requestAnimationFrame(this.tick);
  };

  private step(scale: number): void {
    const w = this.w;
    const h = this.h;
    const attract = this.interactive && this.pointer.active;
    const tx = this.pointer.x * w;
    const ty = this.pointer.y * h;
    for (const p of this.particles) {
      if (attract) {
        p.vx += ((tx - p.x) * 0.0008) * scale;
        p.vy += ((ty - p.y) * 0.0008) * scale;
      }
      p.x += p.vx * scale * 8;
      p.y += p.vy * scale * 8;
      p.pulse += 0.03 * scale;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
      /* Soft damping so interactive pull does not explode */
      p.vx *= 0.995;
      p.vy *= 0.995;
    }
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle, _t: number): void {
    const glow = Math.max(4, this.glow);
    const pulse = 0.75 + 0.25 * Math.sin(p.pulse);
    const r = p.r * pulse;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r + glow);
    g.addColorStop(0, this.withAlpha(this.color, p.a));
    g.addColorStop(0.35, this.withAlpha(this.color, p.a * 0.45));
    g.addColorStop(1, this.withAlpha(this.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + glow, 0, Math.PI * 2);
    ctx.fill();
  }

  private withAlpha(color: string, a: number): string {
    const alpha = Math.min(1, Math.max(0, a));
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      const hex =
        color.length === 4
          ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
          : color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  override render() {
    return html`
      <canvas part="canvas" aria-hidden="true"></canvas>
      <div class="content"><slot></slot></div>
    `;
  }
}

export default K3GlowParticles;

if (!customElements.get('k3-glow-particles')) {
  customElements.define('k3-glow-particles', K3GlowParticles);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-glow-particles': K3GlowParticles;
  }
}
