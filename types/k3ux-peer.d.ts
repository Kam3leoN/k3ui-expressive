/**
 * Ambient companion typings for playground `import … from 'k3ux'` during `tsc --noEmit`.
 * Vite resolves the real sibling package via alias.
 */
/**
 * Sibling sources (`@k3ux/…`) — typed loosely so `tsc` passes with or without
 * ../k3ux; Vite / Vitest resolve the real files (or empty modules) at build time.
 */
declare module '@k3ux/*';

declare module 'k3ux' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ChartData = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ChartOptions = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getSoundFx(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api: any;
  export default api;
}
