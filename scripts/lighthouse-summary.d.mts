export declare const LIGHTHOUSE_VERSION: string;
export declare const CATEGORIES: readonly ['performance', 'accessibility', 'best-practices', 'seo'];
export declare const FORM_FACTORS: readonly ['desktop', 'mobile'];

export type LighthouseFormFactor = 'desktop' | 'mobile';
export type LighthouseCategory = 'performance' | 'accessibility' | 'best-practices' | 'seo';

export interface LighthouseMetric {
  value: string;
  score: number | null;
}

export interface LighthouseSummary {
  scores: Record<LighthouseCategory, number | null>;
  metrics: Record<'fcp' | 'lcp' | 'tbt' | 'cls' | 'si', LighthouseMetric | null>;
  lighthouse: string;
  date: string;
  url: string;
}

/** Compact summary of a Lighthouse result (local run or PageSpeed Insights `lighthouseResult`). */
export declare function summarize(lhr: unknown): LighthouseSummary;
