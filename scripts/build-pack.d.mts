export interface PackOptions {
  tags: string[];
  name: string;
  out: string;
  list: boolean;
}
export interface PackSelection {
  requested: string[];
  /** Children pulled in by the requested components. */
  added: string[];
  tags: string[];
}
export interface PackManifest extends PackSelection {
  name: string;
  version: string;
  file: string;
  gzip: number;
}
export declare function parseArgs(argv: readonly string[]): PackOptions;
export declare function resolvePack(tags: readonly string[]): PackSelection;
export declare function buildPack(options: Partial<PackOptions> & { tags: string[] }): Promise<PackManifest>;
