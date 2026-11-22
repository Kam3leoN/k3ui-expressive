/**
 * Legacy entry for `k3ui/syntax` — grammars now ship in the main bundle.
 * Kept so `import * as extended from 'k3ui/syntax'; syntax.use(extended)` is a no-op.
 */
export const LANGUAGES: ReadonlyArray<readonly [string, (engine: unknown) => void]> = [];
