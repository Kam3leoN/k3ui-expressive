/** Shared pack densify — playground builder + `npm run build:pack`. */

export declare function minifyCss(css: string): string;
export declare function looksLikeCssTemplate(body: string): boolean;
export declare function minifyCssWithInterpolations(body: string): string;
export declare function compactTemplateBody(body: string): string;
export declare function minifyCssInJs(js: string): string;
export declare function compactTemplatesInJs(js: string): string;
export declare function packToOneLine(code: string): string;
export declare function cssInjectPreamble(minifiedCss: string): string;
export declare function densifyPackJs(js: string): string;
export declare function embedCssIntoPack(js: string, cssText: string): string;
