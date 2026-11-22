/**
 * Lighthouse result → compact summary. Pure (no Node API): shared by the
 * runner, the dev server endpoint and the playground page (PageSpeed Insights).
 */

export const LIGHTHOUSE_VERSION = '12.8.2';
export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
export const FORM_FACTORS = ['desktop', 'mobile'];

const METRICS = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  tbt: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
  si: 'speed-index',
};

/**
 * Compact summary of a Lighthouse result (LHR) — a local run, or the
 * `lighthouseResult` of a PageSpeed Insights response.
 */
export function summarize(lhr) {
  const categories = lhr?.categories ?? {};
  const audits = lhr?.audits ?? {};
  const scores = {};
  for (const id of CATEGORIES) {
    const s = categories[id]?.score;
    scores[id] = typeof s === 'number' ? Math.round(s * 100) : null;
  }
  const metrics = {};
  for (const [key, id] of Object.entries(METRICS)) {
    const a = audits[id];
    metrics[key] = a ? { value: a.displayValue ?? '', score: typeof a.score === 'number' ? a.score : null } : null;
  }
  return {
    scores,
    metrics,
    lighthouse: lhr?.lighthouseVersion ?? '',
    date: lhr?.fetchTime ?? new Date().toISOString(),
    url: lhr?.finalDisplayedUrl ?? lhr?.finalUrl ?? lhr?.requestedUrl ?? '',
  };
}
