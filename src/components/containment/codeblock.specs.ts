/**
 * Spécifications `k3-codeblock` — bloc de code monospace + toolbar.
 */

export const CodeBlockSpecs = {
  defaultLabel: '',
  defaultLanguage: '',
  defaultCollapsible: false,
  defaultCollapsedHeight: 150,
  defaultCollapsibleMinLines: 5,
  showToolbar: true,
  showCopy: true,
  showDownload: true,
  accessibility: {
    role: 'region' as const,
    ariaLabel: 'Code sample',
    copyLabel: 'Copy code',
    downloadLabel: 'Download code',
    expandMore: 'Show more',
    expandLess: 'Show less',
  },
  extensionByLang: {
    html: 'html',
    javascript: 'js',
    js: 'js',
    typescript: 'ts',
    ts: 'ts',
    css: 'css',
    scss: 'css',
    plain: 'txt',
  } as Record<string, string>,
} as const;
