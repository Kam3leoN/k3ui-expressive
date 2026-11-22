/**
 * Language brand marks for `k3-codeblock` primary tabs — monochrome via `currentColor`
 * (follows active = primary / idle = on-surface-variant).
 */

/** HTML5 shield */
export const LANG_ICON_HTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109.94 124.49" aria-hidden="true" focusable="false"><path fill="currentColor" d="m0,0l10,112.09,44.9,12.4,45.02-12.39L109.94,0H0Zm89.13,26.54l-.63,7.17-.28,3.29h-52.67l1.26,14h50.16l-.34,3.47-3.23,36.12-.24,2.27-28.2,7.75h0s-.03.02-.03.02l-28.18-7.42-1.91-21.21h13.81l.98,10.92,15.29,4.08h.04v-.55l15.36-3.88,1.6-17.58H24.23l-3.38-38.12-.33-3.88h68.94s-.33,3.54-.33,3.54Z"/></svg>`;

/** CSS3 shield */
export const LANG_ICON_CSS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110.48 125.46" aria-hidden="true" focusable="false"><path fill="currentColor" d="m0,0l10.06,112.88,45.12,12.58,45.24-12.63L110.48,0S0,0,0,0Zm89.59,25.86l-3.35,37.6v.2s0,.47,0,.47h0s-2.38,26.29-2.38,26.29l-.26,2.34-28.36,7.84h0s-.02.02-.02.02l-28.31-7.89-1.92-21.74h13.88l.99,11.05,15.39,4.17h0s0,0,0,0l15.44-4.23,1.63-18h-32.28l-.28-3.04-.63-7.13-.33-3.83h34.75l1.26-14H21.88l-.28-3.04-.63-7.13-.33-3.83h69.28s-.33,3.86-.33,3.86Z"/></svg>`;

/** TypeScript mark */
export const LANG_ICON_TYPESCRIPT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="m462,0H50C22.39,0,0,22.39,0,50v412c0,27.61,22.39,50,50,50h412c27.61,0,50-22.39,50-50V50c0-27.61-22.39-50-50-50Zm-165,284.08h-64.22v182.92h-50.87v-182.92h-63.91v-41.08h179v41.08Zm165.88,150.48c-4.75,8.5-11.19,15.38-19.33,20.65-8.14,5.27-17.61,9.05-28.41,11.34-10.8,2.29-22.2,3.44-34.2,3.44s-24.02-1.04-35.14-3.13-20.74-5.21-28.88-9.39v-50.06h0c9.08,7.61,18.94,13.32,29.58,17.13,10.64,3.81,21.39,5.71,32.24,5.71,6.36,0,11.92-.57,16.67-1.72,4.75-1.15,8.71-2.74,11.89-4.77,3.18-2.03,5.56-4.43,7.12-7.2,1.57-2.76,2.35-5.76,2.35-8.99,0-4.38-1.25-8.29-3.76-11.73-2.51-3.44-5.92-6.62-10.25-9.54-4.33-2.92-9.47-5.74-15.41-8.45-5.95-2.71-12.36-5.47-19.25-8.29-17.53-7.3-30.6-16.22-39.2-26.75-8.61-10.53-12.91-23.26-12.91-38.17,0-11.68,2.35-21.72,7.04-30.11,4.69-8.4,11.08-15.3,19.17-20.73,8.09-5.42,17.45-9.41,28.09-11.97,10.64-2.55,21.91-3.83,33.8-3.83s22.04.7,31.07,2.11c9.03,1.41,17.35,3.57,24.96,6.49v46.78c-3.76-2.61-7.85-4.9-12.29-6.88-4.43-1.98-9-3.62-13.69-4.93-4.7-1.3-9.36-2.27-14.01-2.89-4.64-.62-9.05-.94-13.22-.94-5.74,0-10.96.55-15.65,1.64-4.7,1.09-8.66,2.63-11.89,4.61-3.23,1.98-5.74,4.35-7.51,7.12-1.77,2.76-2.66,5.87-2.66,9.31,0,3.76.99,7.12,2.97,10.09,1.98,2.97,4.8,5.79,8.45,8.45,3.65,2.66,8.09,5.27,13.3,7.82,5.22,2.55,11.11,5.19,17.68,7.9,8.97,3.75,17.03,7.74,24.18,11.97,7.15,4.22,13.28,9,18.39,14.32,5.11,5.32,9.02,11.39,11.74,18.23s4.07,14.78,4.07,23.86c0,12.52-2.37,23.02-7.12,31.52Z"/></svg>`;

/** Material Symbol ligature fallback when no brand SVG exists. */
const MS_FALLBACK = 'code';

const BY_LANG: Record<string, string> = {
  html: LANG_ICON_HTML,
  markup: LANG_ICON_HTML,
  xml: LANG_ICON_HTML,
  svg: LANG_ICON_HTML,
  xhtml: LANG_ICON_HTML,
  css: LANG_ICON_CSS,
  scss: LANG_ICON_CSS,
  sass: LANG_ICON_CSS,
  typescript: LANG_ICON_TYPESCRIPT,
  ts: LANG_ICON_TYPESCRIPT,
  tsx: LANG_ICON_TYPESCRIPT,
  mts: LANG_ICON_TYPESCRIPT,
  cts: LANG_ICON_TYPESCRIPT,
};

/** Icon for a language id/alias — inline SVG (`currentColor`) or MS ligature. */
export function langTabIcon(language: string): string {
  const key = (language || '').trim().toLowerCase();
  return BY_LANG[key] ?? MS_FALLBACK;
}
