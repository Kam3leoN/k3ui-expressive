import type { Plugin } from 'vite';

export declare function stripDocLocales(): Plugin;
export declare function skipStylesheet(): Plugin;
export declare function filterCatalog(tags: readonly string[]): Plugin;
