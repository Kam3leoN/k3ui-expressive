export interface CatalogEntry {
  tag: string;
  /** Relative to src/components, without extension. */
  file: string;
}
export declare const root: string;
export declare const LAZY_OMITTED_EXPORTS: readonly string[];
export declare function readCatalog(): CatalogEntry[];
export declare function readDeps(): Record<string, string[]>;
export declare function normalizeTag(name: string): string;
export declare function closure(
  tags: readonly string[],
  catalog?: CatalogEntry[],
  deps?: Record<string, readonly string[]>,
): string[];
export declare function sourceFile(entry: CatalogEntry): string;
