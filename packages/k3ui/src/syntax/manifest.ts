export interface SyntaxLanguageInfo {
  title: string;
  aliases: readonly string[];
  /** All languages ship in the main bundle — kept for API compat. */
  tier: 'base' | 'extended';
}

/** Custom highlighter version (replaces Prism). */
export const SYNTAX_VERSION = '2.0.0';

/** @deprecated Use SYNTAX_VERSION — kept so older docs/tests keep compiling. */
export const PRISM_VERSION = SYNTAX_VERSION;

export const LANGUAGE_MANIFEST: Readonly<Record<string, SyntaxLanguageInfo>> = {
  markup: { title: 'Markup', aliases: ['html', 'xml', 'svg', 'mathml', 'xhtml'], tier: 'base' },
  css: { title: 'CSS', aliases: [], tier: 'base' },
  scss: { title: 'SCSS', aliases: [], tier: 'base' },
  sass: { title: 'Sass', aliases: [], tier: 'base' },
  javascript: { title: 'JavaScript', aliases: ['js', 'mjs', 'cjs'], tier: 'base' },
  typescript: { title: 'TypeScript', aliases: ['ts', 'mts', 'cts'], tier: 'base' },
  jsx: { title: 'React JSX', aliases: ['react'], tier: 'base' },
  tsx: { title: 'React TSX', aliases: ['react-ts'], tier: 'base' },
  json: { title: 'JSON', aliases: ['webmanifest'], tier: 'base' },
  bash: { title: 'Bash', aliases: ['sh', 'shell', 'zsh'], tier: 'base' },
  sql: { title: 'SQL', aliases: ['sqlite', 'mysql', 'pgsql'], tier: 'base' },
  python: { title: 'Python', aliases: ['py'], tier: 'base' },
  php: { title: 'PHP', aliases: [], tier: 'base' },
  yaml: { title: 'YAML', aliases: ['yml'], tier: 'base' },
  markdown: { title: 'Markdown', aliases: ['md'], tier: 'base' },
  docker: { title: 'Dockerfile', aliases: ['dockerfile'], tier: 'base' },
  go: { title: 'Go', aliases: ['golang'], tier: 'base' },
  rust: { title: 'Rust', aliases: ['rs'], tier: 'base' },
  java: { title: 'Java', aliases: [], tier: 'base' },
  csharp: { title: 'C#', aliases: ['cs', 'c#'], tier: 'base' },
  cpp: { title: 'C++', aliases: ['c++'], tier: 'base' },
  c: { title: 'C', aliases: [], tier: 'base' },
  powershell: { title: 'PowerShell', aliases: ['ps1', 'ps'], tier: 'base' },
  ini: { title: 'INI', aliases: [], tier: 'base' },
  toml: { title: 'TOML', aliases: [], tier: 'base' },
  graphql: { title: 'GraphQL', aliases: ['gql'], tier: 'base' },
  lua: { title: 'Lua', aliases: [], tier: 'base' },
  ruby: { title: 'Ruby', aliases: ['rb'], tier: 'base' },
  kotlin: { title: 'Kotlin', aliases: ['kt'], tier: 'base' },
  swift: { title: 'Swift', aliases: [], tier: 'base' },
  diff: { title: 'Diff', aliases: [], tier: 'base' },
  nginx: { title: 'nginx', aliases: [], tier: 'base' },
  http: { title: 'HTTP', aliases: [], tier: 'base' },
  batch: { title: 'Batch', aliases: ['bat', 'cmd'], tier: 'base' },
  git: { title: 'Git', aliases: [], tier: 'base' },
  mongodb: { title: 'MongoDB', aliases: ['mongo'], tier: 'base' },
  regex: { title: 'Regex', aliases: [], tier: 'base' },
  autohotkey: { title: 'AutoHotkey', aliases: ['ahk'], tier: 'base' },
  asciidoc: { title: 'AsciiDoc', aliases: ['adoc', 'asc'], tier: 'base' },
  clike: { title: 'C-like', aliases: [], tier: 'base' },
};
