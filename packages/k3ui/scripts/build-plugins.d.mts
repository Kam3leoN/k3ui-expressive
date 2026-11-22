import type { Plugin } from 'vite';

export declare function stripDocLocales(): Plugin;
export declare function skipStylesheet(): Plugin;
export declare function filterCatalog(tags: readonly string[]): Plugin;
export declare function packKindLabel(name: string): string;
export declare function packHeader(info: {
  name: string;
  version: string;
  components: readonly string[];
  builder: string;
}): { banner: string; intro: string };
