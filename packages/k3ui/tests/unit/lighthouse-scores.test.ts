import { describe, it, expect } from 'vitest';
import { summarize } from '../../scripts/lighthouse-summary.mjs';
import { isLocalRequest, safeAuditPath } from '../../playground/lighthouse-live.js';
import { arcPath, GAUGE, isLocalHostname, psiUrl, scoreBand, tweenScore } from '../../playground/lighthouse.js';

const LHR = {
  lighthouseVersion: '12.8.2',
  fetchTime: '2026-11-07T12:50:57.148Z',
  finalDisplayedUrl: 'http://127.0.0.1:4173/',
  categories: {
    performance: { score: 0.97 },
    accessibility: { score: 1 },
    'best-practices': { score: 0.964 },
    seo: { score: null },
  },
  audits: {
    'first-contentful-paint': { displayValue: '1.4 s', score: 0.98 },
    'largest-contentful-paint': { displayValue: '1.7 s', score: 0.99 },
    'total-blocking-time': { displayValue: '170 ms', score: 0.93 },
    'cumulative-layout-shift': { displayValue: '0', score: 1 },
  },
};

describe('Lighthouse summary', () => {
  it('rounds category scores to 0–100 and keeps the metric values', () => {
    const s = summarize(LHR);
    expect(s.scores).toEqual({ performance: 97, accessibility: 100, 'best-practices': 96, seo: null });
    expect(s.metrics.tbt).toEqual({ value: '170 ms', score: 0.93 });
    expect(s.metrics.si).toBeNull();
    expect(s.lighthouse).toBe('12.8.2');
    expect(s.date).toBe('2026-11-07T12:50:57.148Z');
    expect(s.url).toBe('http://127.0.0.1:4173/');
  });

  it('copes with an empty result', () => {
    const s = summarize(undefined);
    expect(s.scores.performance).toBeNull();
    expect(Object.values(s.metrics).every((m) => m === null)).toBe(true);
  });
});

describe('Lighthouse gauges', () => {
  it('uses the Lighthouse colour bands', () => {
    expect(scoreBand(0)).toBe('poor');
    expect(scoreBand(49)).toBe('poor');
    expect(scoreBand(50)).toBe('average');
    expect(scoreBand(89)).toBe('average');
    expect(scoreBand(90)).toBe('good');
    expect(scoreBand(100)).toBe('good');
  });

  it('draws a 270° arc opening at the bottom', () => {
    const d = arcPath(GAUGE.r, GAUGE.start, GAUGE.start + GAUGE.sweep);
    const [, x0, y0] = /^M ([\d.]+) ([\d.]+)/.exec(d)!.map(Number);
    const [x1, y1] = d.split(' ').slice(-2).map(Number);
    expect(d).toContain(' 0 1 1 ');
    expect(x0).toBeCloseTo(50 - GAUGE.r * Math.sin(Math.PI / 4), 2);
    expect(y0).toBeCloseTo(50 + GAUGE.r * Math.cos(Math.PI / 4), 2);
    expect(x1).toBeCloseTo(100 - x0!, 2);
    expect(y1).toBeCloseTo(y0!, 2);
  });

  it('eases scores in without overshoot', () => {
    expect(tweenScore(0, 100, 0)).toBe(0);
    expect(tweenScore(0, 100, 1)).toBe(100);
    expect(tweenScore(0, 100, 0.5)).toBeGreaterThan(50);
    expect(tweenScore(100, 88, 2)).toBe(88);
  });

  it('builds PageSpeed Insights requests for public hosts only', () => {
    const u = new URL(psiUrl('https://k3ui.dev/', 'mobile', 'KEY'));
    expect(u.origin + u.pathname).toBe('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    expect(u.searchParams.get('url')).toBe('https://k3ui.dev/');
    expect(u.searchParams.get('strategy')).toBe('mobile');
    expect(u.searchParams.getAll('category')).toEqual(['performance', 'accessibility', 'best-practices', 'seo']);
    expect(u.searchParams.get('key')).toBe('KEY');
    expect(new URL(psiUrl('https://k3ui.dev/', 'desktop')).searchParams.has('key')).toBe(false);
    expect(isLocalHostname('localhost')).toBe(true);
    expect(isLocalHostname('127.0.0.1')).toBe(true);
    expect(isLocalHostname('k3ui.dev')).toBe(false);
  });
});

describe('Live audit endpoint guards', () => {
  it('answers loopback clients with a localhost Host header only', () => {
    expect(isLocalRequest('127.0.0.1', 'localhost:5173')).toBe(true);
    expect(isLocalRequest('::1', '127.0.0.1:4173')).toBe(true);
    expect(isLocalRequest('::ffff:127.0.0.1', '[::1]:4173')).toBe(true);
    expect(isLocalRequest('192.168.1.20', 'localhost:5173')).toBe(false);
    expect(isLocalRequest('127.0.0.1', 'evil.example:5173')).toBe(false);
    expect(isLocalRequest('127.0.0.1', undefined)).toBe(false);
  });

  it('audits same-origin paths only', () => {
    expect(safeAuditPath(null)).toBe('/');
    expect(safeAuditPath('/')).toBe('/');
    expect(safeAuditPath('/#/buttons')).toBe('/#/buttons');
    expect(safeAuditPath('//evil.example/')).toBeNull();
    expect(safeAuditPath('http://evil.example/')).toBeNull();
    expect(safeAuditPath('/\\evil')).toBeNull();
    expect(safeAuditPath('/a b')).toBeNull();
  });
});
