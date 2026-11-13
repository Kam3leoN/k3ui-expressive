/**
 * Home page — Lighthouse scores of this playground, as gauges.
 *
 * - Shows the last stored audit (`/lighthouse.json`, `npm run lighthouse`).
 * - "Run the audit" measures the page live with Lighthouse in Chromium:
 *   on localhost through the dev / preview server (`/__k3-lighthouse`),
 *   elsewhere through PageSpeed Insights (Lighthouse in Chrome, Google).
 *
 * Loaded on demand when the section nears the viewport (no cost at start).
 */
import { html, svg, render, nothing, type TemplateResult } from 'lit';
import { i18n } from '../src/i18n/index.js';
import { registry } from '../src/registry/register.js';
import {
  summarize,
  type LighthouseCategory,
  type LighthouseFormFactor,
  type LighthouseMetric,
} from '../scripts/lighthouse-summary.mjs';

/* ── Pure helpers (unit-tested) ───────────────────────────────────────── */

export type ScoreBand = 'poor' | 'average' | 'good';

/** Lighthouse colour bands: 0–49 · 50–89 · 90–100. */
export function scoreBand(score: number): ScoreBand {
  return score < 50 ? 'poor' : score < 90 ? 'average' : 'good';
}

/** Gauge arc: 270°, starting at −135° (bottom left), clockwise. */
export const GAUGE = { cx: 50, cy: 50, r: 42, start: -135, sweep: 270 } as const;

function polar(r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: GAUGE.cx + r * Math.cos(rad), y: GAUGE.cy + r * Math.sin(rad) };
}

/** SVG path of a circular arc from `a0` to `a1` degrees (0 = top, clockwise). */
export function arcPath(r: number, a0: number, a1: number): string {
  const s = polar(r, a0);
  const e = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(3);
  return `M ${f(s.x)} ${f(s.y)} A ${r} ${r} 0 ${large} 1 ${f(e.x)} ${f(e.y)}`;
}

/** Ease-out cubic between two scores. */
export function tweenScore(from: number, to: number, t: number): number {
  const k = 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  return from + (to - from) * k;
}

export interface FormScores {
  scores: Record<LighthouseCategory, number | null>;
  metrics?: Partial<Record<MetricKey, LighthouseMetric | null>>;
}

export interface LighthouseData {
  date: string;
  source?: 'chromium' | 'psi';
  lighthouse?: string;
  desktop?: FormScores;
  mobile?: FormScores;
}

type MetricKey = 'fcp' | 'lcp' | 'tbt' | 'cls' | 'si';
type Source = 'local' | 'psi';

/** Live audit through PageSpeed Insights (public hosts). */
export function psiUrl(page: string, form: LighthouseFormFactor, key = ''): string {
  const q = new URLSearchParams({ url: page, strategy: form });
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) q.append('category', c);
  if (key) q.set('key', key);
  return `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`;
}

export function isLocalHostname(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

/* ── Strings (kept with the section, merged into the catalogs on load) ── */

const STRINGS = {
  en: {
    'playground.lighthouse.title': 'Lighthouse K3[UI] scores',
    'playground.lighthouse.lead':
      'This page is built with K3UI — the scores reflect the performance and accessibility of the framework (out of 100).',
    'playground.lighthouse.date': 'Last audit: {date} (UTC)',
    'playground.lighthouse.source.chromium': 'Lighthouse {version} · Chromium',
    'playground.lighthouse.source.psi': 'Lighthouse {version} · PageSpeed Insights',
    'playground.lighthouse.desktop': 'Desktop',
    'playground.lighthouse.mobile': 'Mobile',
    'playground.lighthouse.performance': 'Performance',
    'playground.lighthouse.accessibility': 'Accessibility',
    'playground.lighthouse.best-practices': 'Best practices',
    'playground.lighthouse.seo': 'SEO',
    'playground.lighthouse.legend': 'Score ranges',
    'playground.lighthouse.metrics': 'Metrics ({form})',
    'playground.lighthouse.fcp': 'First Contentful Paint',
    'playground.lighthouse.lcp': 'Largest Contentful Paint',
    'playground.lighthouse.tbt': 'Total Blocking Time',
    'playground.lighthouse.cls': 'Cumulative Layout Shift',
    'playground.lighthouse.si': 'Speed Index',
    'playground.lighthouse.run': 'Run the audit ({form})',
    'playground.lighthouse.running': 'Lighthouse is auditing this page ({form})… about 20 to 60 s',
    'playground.lighthouse.done': 'Audit done ({form}).',
    'playground.lighthouse.report': 'Full report',
    'playground.lighthouse.error': 'The audit failed: {error}',
    'playground.lighthouse.unavailable':
      'Live audits need the dev or preview server (npm run dev / npm run preview) or a public address.',
    'playground.lighthouse.devhint': 'Dev server: unbundled code, performance is not representative — use npm run preview.',
    'playground.lighthouse.nodata': 'No audit stored yet — run one, or npm run lighthouse.',
  },
  fr: {
    'playground.lighthouse.title': 'Scores Lighthouse K3[UI]',
    'playground.lighthouse.lead':
      'Cette page est construite avec K3UI — les scores reflètent la performance et l’accessibilité du framework (sur 100).',
    'playground.lighthouse.date': 'Dernier audit : {date} (UTC)',
    'playground.lighthouse.source.chromium': 'Lighthouse {version} · Chromium',
    'playground.lighthouse.source.psi': 'Lighthouse {version} · PageSpeed Insights',
    'playground.lighthouse.desktop': 'Desktop',
    'playground.lighthouse.mobile': 'Mobile',
    'playground.lighthouse.performance': 'Performance',
    'playground.lighthouse.accessibility': 'Accessibilité',
    'playground.lighthouse.best-practices': 'Bonnes pratiques',
    'playground.lighthouse.seo': 'SEO',
    'playground.lighthouse.legend': 'Plages de score',
    'playground.lighthouse.metrics': 'Métriques ({form})',
    'playground.lighthouse.fcp': 'First Contentful Paint',
    'playground.lighthouse.lcp': 'Largest Contentful Paint',
    'playground.lighthouse.tbt': 'Total Blocking Time',
    'playground.lighthouse.cls': 'Cumulative Layout Shift',
    'playground.lighthouse.si': 'Speed Index',
    'playground.lighthouse.run': 'Lancer l’audit ({form})',
    'playground.lighthouse.running': 'Lighthouse audite cette page ({form})… environ 20 à 60 s',
    'playground.lighthouse.done': 'Audit terminé ({form}).',
    'playground.lighthouse.report': 'Rapport complet',
    'playground.lighthouse.error': 'L’audit a échoué : {error}',
    'playground.lighthouse.unavailable':
      'Les audits en direct demandent le serveur de dev ou de prévisualisation (npm run dev / npm run preview) ou une adresse publique.',
    'playground.lighthouse.devhint':
      'Serveur de dev : code non regroupé, la performance n’est pas représentative — utilisez npm run preview.',
    'playground.lighthouse.nodata': 'Aucun audit enregistré — lancez-en un, ou npm run lighthouse.',
  },
};

/* ── Icons (Material Icons, Apache 2.0) ───────────────────────────────── */

const ICONS: Record<LighthouseCategory, string> = {
  performance: 'M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z',
  accessibility:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 5h-3.2v8h-1.6v-3.6h-.4V18H10.2v-8H7V8.6h10V10z',
  'best-practices':
    'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  seo: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
};
const TAB_ICONS = [
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16v11z"/></svg>',
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H8a2.5 2.5 0 0 0-2.5 2.5v17A2.5 2.5 0 0 0 8 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 16 1zm-4 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5-4h-9V4h9v14z"/></svg>',
];

const CATS: LighthouseCategory[] = ['performance', 'accessibility', 'best-practices', 'seo'];
const METRIC_KEYS: MetricKey[] = ['fcp', 'lcp', 'tbt', 'cls', 'si'];
const FORMS: LighthouseFormFactor[] = ['desktop', 'mobile'];
const TRACK = arcPath(GAUGE.r, GAUGE.start, GAUGE.start + GAUGE.sweep);
const LABEL_ARC = arcPath(31, -80, 80);
const reduceMotion = () =>
  document.documentElement.hasAttribute('data-k3-reduce-motion') ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Section ──────────────────────────────────────────────────────────── */

class LighthouseSection {
  private form: LighthouseFormFactor = 'desktop';
  private data: LighthouseData | null = null;
  private source: Source | null = null;
  private running: LighthouseFormFactor | null = null;
  private status = '';
  private statusKind: 'info' | 'error' = 'info';
  private reports: Partial<Record<LighthouseFormFactor, string>> = {};
  private shown: Record<LighthouseCategory, number> = { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 };
  private anim = 0;
  private devServer = false;
  private detected = false;

  constructor(private readonly root: HTMLElement) {}

  async start(): Promise<void> {
    this.render();
    document.addEventListener('k3-locale-change', () => this.render());
    const [data, source] = await Promise.all([this.loadStored(), this.detectSource()]);
    this.data = data;
    this.source = source;
    this.detected = true;
    this.render();
    this.animateTo();
  }

  private t(key: string, vars?: Record<string, string | number>): string {
    return i18n.t(`playground.lighthouse.${key}`, undefined, vars);
  }

  private async loadStored(): Promise<LighthouseData | null> {
    try {
      const res = await fetch('/lighthouse.json', { cache: 'no-cache' });
      return res.ok ? ((await res.json()) as LighthouseData) : null;
    } catch {
      return null;
    }
  }

  private async detectSource(): Promise<Source | null> {
    if (!isLocalHostname(location.hostname)) return 'psi';
    try {
      const res = await fetch('/__k3-lighthouse/ping', { cache: 'no-store' });
      if (!res.ok) return null;
      const ping = (await res.json()) as { mode?: string };
      this.devServer = ping.mode === 'dev';
      return 'local';
    } catch {
      return null;
    }
  }

  /* ── Live audit ─────────────────────────────────────────────────────── */

  private async run(): Promise<void> {
    if (this.running || !this.source) return;
    const form = this.form;
    const formLabel = this.t(form);
    this.running = form;
    this.statusKind = 'info';
    this.status = this.t('running', { form: formLabel });
    this.render();
    try {
      const path = location.pathname + location.search;
      let summary: ReturnType<typeof summarize> & { report?: string };
      if (this.source === 'local') {
        const res = await fetch(`/__k3-lighthouse/run?form=${form}&path=${encodeURIComponent(path)}`, { cache: 'no-store' });
        const body = (await res.json()) as ReturnType<typeof summarize> & { report?: string; error?: string };
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        summary = body;
      } else {
        const page = location.origin + path;
        const res = await fetch(psiUrl(page, form, this.root.dataset.psiKey ?? ''));
        const body = (await res.json()) as { lighthouseResult?: unknown; error?: { message?: string } };
        if (!res.ok || !body.lighthouseResult) throw new Error(body.error?.message || `HTTP ${res.status}`);
        summary = {
          ...summarize(body.lighthouseResult),
          report: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(page)}&form_factor=${form}`,
        };
      }
      const prev = this.data;
      this.data = {
        ...(prev ?? {}),
        date: summary.date,
        source: this.source === 'local' ? 'chromium' : 'psi',
        lighthouse: summary.lighthouse,
        [form]: { scores: summary.scores, metrics: summary.metrics },
      };
      if (summary.report) this.reports[form] = summary.report;
      this.status = this.t('done', { form: formLabel });
    } catch (e) {
      this.statusKind = 'error';
      this.status = this.t('error', { error: String((e as Error).message ?? e).split('\n')[0]!.slice(0, 200) });
    } finally {
      this.running = null;
      this.render();
      if (this.form === form) this.animateTo();
    }
  }

  /* ── Gauges ─────────────────────────────────────────────────────────── */

  private target(cat: LighthouseCategory): number | null {
    return this.data?.[this.form]?.scores?.[cat] ?? null;
  }

  /** Animate every gauge from its shown value to the current target. */
  private animateTo(): void {
    cancelAnimationFrame(this.anim);
    const from = { ...this.shown };
    const to = Object.fromEntries(CATS.map((c) => [c, this.target(c) ?? 0])) as Record<LighthouseCategory, number>;
    const paint = (t: number) => {
      for (const c of CATS) {
        this.shown[c] = tweenScore(from[c], to[c], t);
        this.paintGauge(c);
      }
    };
    if (reduceMotion()) return paint(1);
    const t0 = performance.now();
    const duration = 1100;
    const step = (now: number) => {
      const t = (now - t0) / duration;
      paint(t);
      if (t < 1) this.anim = requestAnimationFrame(step);
    };
    this.anim = requestAnimationFrame(step);
  }

  private paintGauge(cat: LighthouseCategory): void {
    const el = this.root.querySelector<HTMLElement>(`.lh-gauge[data-cat="${cat}"]`);
    if (!el) return;
    const loading = this.running === this.form;
    const target = this.target(cat);
    const v = this.shown[cat];
    const progress = el.querySelector<SVGPathElement>('.lh-progress')!;
    const num = el.querySelector<SVGTSpanElement>('.lh-num')!;
    el.dataset.band = target == null && !loading ? 'none' : scoreBand(Math.round(v));
    if (loading) {
      progress.removeAttribute('stroke-dasharray');
      num.textContent = '…';
      return;
    }
    progress.setAttribute('stroke-dasharray', `${v.toFixed(2)} 200`);
    progress.style.visibility = v < 0.5 ? 'hidden' : '';
    num.textContent = target == null ? '–' : String(Math.round(v));
  }

  private gauge(cat: LighthouseCategory): TemplateResult {
    const label = this.t(cat);
    const target = this.target(cat);
    const loading = this.running === this.form;
    return html`<div
      class="lh-gauge ${loading ? 'is-loading' : ''}"
      data-cat=${cat}
      role="meter"
      aria-label=${label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${target ?? nothing}
      aria-valuetext=${target == null ? '–' : `${target} / 100`}
      aria-busy=${loading ? 'true' : 'false'}
    >
      ${svg`<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs><path id=${`k3lh-label-${cat}`} d=${LABEL_ARC}></path></defs>
        <circle class="lh-frame" cx="50" cy="50" r="49.5"></circle>
        <path class="lh-track" d=${TRACK} pathLength="100"></path>
        <path class="lh-progress" d=${TRACK} pathLength="100" stroke-dasharray="0 200"></path>
        <text class="lh-label"><textPath href=${`#k3lh-label-${cat}`} startOffset="50%" text-anchor="middle">${label.toUpperCase()}</textPath></text>
        <path class="lh-icon" d=${ICONS[cat]} transform="translate(42.2 31) scale(0.65)"></path>
        <text class="lh-value" x="50" y="70" text-anchor="middle"><tspan class="lh-num">–</tspan><tspan class="lh-pct" dx="1">%</tspan></text>
      </svg>`}
    </div>`;
  }

  private metric(key: MetricKey): TemplateResult {
    const m = this.data?.[this.form]?.metrics?.[key];
    const band = m?.score == null ? 'none' : scoreBand(Math.round(m.score * 100));
    return html`<div class="lh-metric" data-band=${band}>
      <span class="lh-metric-dot" aria-hidden="true"></span>
      <span class="lh-metric-name">${this.t(key)}</span>
      <span class="lh-metric-value">${m?.value || '–'}</span>
    </div>`;
  }

  private dateText(): string {
    if (!this.data?.date) return this.t('nodata');
    const d = new Date(this.data.date);
    const fmt = new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' });
    const src = this.data.source === 'psi' ? 'psi' : 'chromium';
    const version = this.data.lighthouse ? this.t(`source.${src}`, { version: this.data.lighthouse }) : '';
    return [this.t('date', { date: fmt.format(d) }), version].filter(Boolean).join(' · ');
  }

  private render(): void {
    const formLabel = this.t(this.form);
    const report = this.reports[this.form];
    const tabs = FORMS.map((f) => this.t(f)).join(',');
    render(
      html`
        <section class="home-lighthouse" aria-labelledby="home-lh-title">
          <header class="section-head sub">
            <h2 id="home-lh-title">${this.t('title')}</h2>
            <p>${this.t('lead')}</p>
            <p class="lh-date">${this.dateText()}</p>
          </header>
          <k3-tabs
            class="lh-tabs"
            variant="primary"
            labels=${tabs}
            .customIcons=${TAB_ICONS}
            .index=${FORMS.indexOf(this.form)}
            @k3-change=${(e: CustomEvent<{ index: number }>) => this.select(FORMS[e.detail.index] ?? 'desktop')}
          ></k3-tabs>
          <div class="lh-gauges">${CATS.map((c) => this.gauge(c))}</div>
          <ul class="lh-legend" aria-label=${this.t('legend')}>
            <li data-band="poor">0–49</li>
            <li data-band="average">50–89</li>
            <li data-band="good">90–100</li>
          </ul>
          <div class="lh-metrics" role="group" aria-label=${this.t('metrics', { form: formLabel })}>
            ${METRIC_KEYS.map((k) => this.metric(k))}
          </div>
          <div class="lh-actions">
            <k3-button
              class="lh-run"
              variant="tonal"
              ?disabled=${!this.source || !!this.running}
              @click=${() => void this.run()}
              >${this.t('run', { form: formLabel })}</k3-button
            >
            ${report
              ? html`<a class="lh-report" href=${report} target="_blank" rel="noopener noreferrer">${this.t('report')}</a>`
              : nothing}
          </div>
          <p class="lh-status ${this.statusKind === 'error' ? 'is-error' : ''}" role="status" aria-live="polite">
            ${this.status ||
            (this.detected && !this.source ? this.t('unavailable') : '') ||
            (this.devServer ? this.t('devhint') : '')}
          </p>
        </section>
      `,
      this.root,
    );
    for (const c of CATS) this.paintGauge(c);
  }

  private select(form: LighthouseFormFactor): void {
    if (form === this.form) return;
    this.form = form;
    this.render();
    this.animateTo();
  }
}

let mounted = false;

/** Build the section in `root` (once). */
export function mountLighthouse(root: HTMLElement): void {
  if (mounted) return;
  mounted = true;
  i18n.extend(STRINGS);
  /* Tabs and button may not be upgraded yet on the home page */
  void Promise.all([registry.register('k3-tabs'), registry.register('k3-button')]).finally(() =>
    new LighthouseSection(root).start(),
  );
}
