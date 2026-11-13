/**
 * Ambient companion typings for playground `import … from 'k3ux'` during `tsc --noEmit`.
 * Vite resolves the real sibling package via alias.
 */
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
