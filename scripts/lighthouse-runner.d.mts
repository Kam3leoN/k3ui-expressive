import type { LighthouseFormFactor, LighthouseSummary } from './lighthouse-summary.mjs';

export * from './lighthouse-summary.mjs';

/** Audit `url` with Lighthouse in headless Chromium. */
export declare function runLighthouse(
  url: string,
  formFactor?: LighthouseFormFactor,
): Promise<{ summary: LighthouseSummary; html: string; lhr: object }>;
