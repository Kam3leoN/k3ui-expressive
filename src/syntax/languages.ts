/**
 * Built-in grammars for the custom highlighter (token colours via CSS).
 * Enough coverage for playground samples — no Prism dependency.
 */
import { highlightWithRules, keywordRule, type SyntaxRule } from './engine.js';

const COMMENT_LINE = { type: 'comment', match: /\/\/.*/g };
const COMMENT_BLOCK = { type: 'comment', match: /\/\*[\s\S]*?\*\//g };
const COMMENT_HASH = { type: 'comment', match: /#.*/g };
const STRING_DQ = { type: 'string', match: /"(?:\\.|[^"\\])*"/g };
const STRING_SQ = { type: 'string', match: /'(?:\\.|[^'\\])*'/g };
const STRING_BT = { type: 'string', match: /`(?:\\.|[^`\\])*`/g };
const NUMBER = {
  type: 'number',
  match: /\b(?:0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
};
const PUNCT = { type: 'punctuation', match: /[{}[\]();,.:]/g };

function clike(keywords: readonly string[], extras: SyntaxRule[] = []): SyntaxRule[] {
  return [
    COMMENT_BLOCK,
    COMMENT_LINE,
    STRING_DQ,
    STRING_SQ,
    ...extras,
    keywordRule('keyword', keywords),
    { type: 'boolean', match: /\b(?:true|false|null)\b/g },
    NUMBER,
    { type: 'function', match: /\b[A-Za-z_]\w*(?=\s*\()/g },
    { type: 'class-name', match: /\b[A-Z][A-Za-z0-9_]+\b/g },
    { type: 'operator', match: /[+\-*/%=<>!&|^~?:]+/g },
    PUNCT,
  ];
}

const JS_KEYWORDS = [
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'let', 'new', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'async', 'await', 'from', 'as',
  'get', 'set', 'of', 'enum', 'implements', 'interface', 'package', 'private', 'protected',
  'public', 'readonly', 'type', 'namespace', 'module', 'declare', 'abstract', 'override',
  'satisfies', 'keyof', 'infer', 'never', 'unknown', 'any', 'bigint', 'symbol', 'undefined',
] as const;

const markupRules: SyntaxRule[] = [
  { type: 'doctype', match: /<!DOCTYPE[^>]*>/gi },
  { type: 'comment', match: /<!--[\s\S]*?-->/g },
  { type: 'tag', match: /<\/?[A-Za-z][\w:-]*/g },
  { type: 'attr-name', match: /\s[A-Za-z_:][\w:.-]*(?=\s*=)/g },
  { type: 'attr-value', match: /=\s*"(?:\\.|[^"\\])*"/g },
  { type: 'attr-value', match: /=\s*'(?:\\.|[^'\\])*'/g },
  { type: 'punctuation', match: /\/?>/g },
];

const cssRules: SyntaxRule[] = [
  COMMENT_BLOCK,
  { type: 'atrule', match: /@[A-Za-z-]+/g },
  { type: 'string', match: /url\((?:[^)]|\\.)+\)/g },
  STRING_DQ,
  STRING_SQ,
  { type: 'selector', match: /[.#]?[A-Za-z_][\w-]*(?=\s*[,{])/g },
  { type: 'property', match: /[A-Za-z-]+(?=\s*:)/g },
  { type: 'number', match: /#(?:[\da-fA-F]{3,8})\b|\b\d+(?:\.\d+)?(?:%|px|em|rem|vh|vw|deg|ms|s)?\b/g },
  { type: 'keyword', match: /\b(?:!important|and|or|not|only)\b/g },
  { type: 'punctuation', match: /[{}();:,]/g },
];

const scssRules: SyntaxRule[] = [
  COMMENT_BLOCK,
  COMMENT_LINE,
  { type: 'atrule', match: /@(?:use|forward|import|mixin|include|function|return|if|else|each|for|while|extend|error|warn|debug)[^\n;{]*/g },
  { type: 'variable', match: /\$[A-Za-z_-][\w-]*/g },
  STRING_DQ,
  STRING_SQ,
  { type: 'property', match: /[A-Za-z-]+(?=\s*:)/g },
  { type: 'number', match: /#(?:[\da-fA-F]{3,8})\b|\b\d+(?:\.\d+)?(?:%|px|em|rem|vh|vw|deg|ms|s)?\b/g },
  { type: 'selector', match: /&|[.#]?[A-Za-z_][\w-]*/g },
  { type: 'punctuation', match: /[{}();:,]/g },
];

const jsonRules: SyntaxRule[] = [
  { type: 'property', match: /"(?:\\.|[^"\\])*"(?=\s*:)/g },
  STRING_DQ,
  { type: 'boolean', match: /\b(?:true|false|null)\b/g },
  NUMBER,
  PUNCT,
];

const bashRules: SyntaxRule[] = [
  COMMENT_HASH,
  STRING_DQ,
  STRING_SQ,
  { type: 'string', match: /`[^`]*`/g },
  keywordRule('keyword', [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'in',
    'function', 'select', 'time', 'coproc', '[[', ']]',
  ]),
  { type: 'builtin', match: /\b(?:cd|echo|export|source|alias|unalias|set|unset|read|printf|test|exit|return|local|declare|typeset|readonly|shift|eval|exec|trap|wait|kill|jobs|fg|bg|pwd|pushd|popd|true|false|npm|npx|yarn|pnpm|git|docker|curl|wget|sudo|apt|brew)\b/g },
  { type: 'variable', match: /\$\{?[A-Za-z_]\w*\}?|\$\d/g },
  { type: 'operator', match: /&&|\|\||>>|<<|[|><&;]/g },
];

const sqlRules: SyntaxRule[] = [
  { type: 'comment', match: /--.*/g },
  COMMENT_BLOCK,
  STRING_SQ,
  STRING_DQ,
  keywordRule('keyword', [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
    'TABLE', 'DROP', 'ALTER', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS',
    'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
    'OFFSET', 'DISTINCT', 'UNION', 'ALL', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'CASE',
    'WHEN', 'THEN', 'ELSE', 'END', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT',
  ]),
  NUMBER,
  PUNCT,
];

const pythonRules = clike(
  [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
    'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
    'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while',
    'with', 'yield', 'match', 'case',
  ],
  [
    { type: 'comment', match: /#.*/g },
    { type: 'string', match: /"""[\s\S]*?"""|'''[\s\S]*?'''/g },
    { type: 'string', match: /f"(?:\\.|[^"\\])*"|f'(?:\\.|[^'\\])*'/g },
  ],
);

const phpRules: SyntaxRule[] = [
  { type: 'comment', match: /\/\*[\s\S]*?\*\/|\/\/.*|#.*/g },
  { type: 'keyword', match: /<\?(?:php)?|\?>/g },
  STRING_DQ,
  STRING_SQ,
  keywordRule('keyword', [
    'echo', 'print', 'return', 'function', 'class', 'public', 'private', 'protected', 'static',
    'new', 'extends', 'implements', 'interface', 'namespace', 'use', 'if', 'else', 'elseif',
    'endif', 'foreach', 'as', 'while', 'for', 'do', 'switch', 'case', 'break', 'continue',
    'try', 'catch', 'finally', 'throw', 'array', 'true', 'false', 'null', 'isset', 'empty',
  ]),
  { type: 'variable', match: /\$[A-Za-z_]\w*/g },
  NUMBER,
  PUNCT,
];

const yamlRules: SyntaxRule[] = [
  COMMENT_HASH,
  { type: 'property', match: /^[\t ]*[A-Za-z_][\w-]*(?=\s*:)/gm },
  STRING_DQ,
  STRING_SQ,
  { type: 'boolean', match: /\b(?:true|false|null|yes|no|on|off)\b/gi },
  NUMBER,
  { type: 'punctuation', match: /[:\-\[\]{},|>&*!]/g },
];

const mdRules: SyntaxRule[] = [
  { type: 'keyword', match: /^#{1,6}.+$/gm },
  { type: 'string', match: /`[^`]+`|```[\s\S]*?```/g },
  { type: 'keyword', match: /\*\*[^*]+\*\*|__[^_]+__/g },
  { type: 'keyword', match: /\*[^*]+\*|_[^_]+_/g },
  { type: 'attr-value', match: /\[[^\]]*\]\([^)]*\)/g },
];

const dockerRules: SyntaxRule[] = [
  COMMENT_HASH,
  keywordRule('keyword', [
    'FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME',
    'USER', 'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL', 'AS',
  ]),
  STRING_DQ,
  STRING_SQ,
];

const goRules = clike([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
  'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
  'return', 'select', 'struct', 'switch', 'type', 'var',
]);

const rustRules = clike(
  [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move',
    'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true',
    'type', 'unsafe', 'use', 'where', 'while',
  ],
  [{ type: 'attr-name', match: /#\[[^\]]*\]/g }],
);

const javaRules = clike([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long',
  'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
  'void', 'volatile', 'while', 'var', 'record', 'sealed', 'permits', 'yield',
]);

const csharpRules = clike([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class',
  'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event',
  'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if',
  'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new',
  'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public',
  'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static',
  'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong',
  'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while', 'async',
  'await', 'var', 'dynamic', 'nameof', 'when', 'where', 'yield', 'record', 'init', 'required',
]);

const cppRules = clike([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool', 'break',
  'case', 'catch', 'char', 'class', 'compl', 'const', 'constexpr', 'continue', 'decltype',
  'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
  'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new',
  'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected',
  'public', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
  'template', 'this', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union',
  'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq',
  'concept', 'requires', 'co_await', 'co_return', 'co_yield',
]);

const powershellRules: SyntaxRule[] = [
  COMMENT_HASH,
  { type: 'comment', match: /<#[\s\S]*?#>/g },
  STRING_DQ,
  STRING_SQ,
  keywordRule('keyword', [
    'Begin', 'Break', 'Catch', 'Class', 'Continue', 'Data', 'Define', 'Do', 'DynamicParam',
    'Else', 'ElseIf', 'End', 'Exit', 'Filter', 'Finally', 'For', 'ForEach', 'From', 'Function',
    'If', 'In', 'Param', 'Process', 'Return', 'Switch', 'Throw', 'Trap', 'Try', 'Until', 'Using',
    'Var', 'While', 'Workflow',
  ]),
  { type: 'function', match: /\b(?:Get|Set|New|Remove|Add|Write|Read|Import|Export|Invoke|Test|Start|Stop)-[A-Za-z]+\b/g },
  { type: 'variable', match: /\$[A-Za-z_]\w*/g },
  PUNCT,
];

const jsRules = clike(JS_KEYWORDS, [
  STRING_BT,
  { type: 'regex', match: /\/(?![*/])(?:\\.|[^[/\\\n]|\[(?:\\.|[^\]\\\n])*\])+\/[gimsuy]*/g },
]);

const tsRules = clike(JS_KEYWORDS, [
  STRING_BT,
  keywordRule('keyword', ['interface', 'type', 'implements', 'enum', 'namespace', 'declare', 'readonly', 'keyof', 'infer', 'satisfies', 'override', 'abstract']),
]);

/** id → highlighter */
const HIGHLIGHTERS: Record<string, (code: string) => string> = {
  markup: (c) => highlightWithRules(c, markupRules),
  html: (c) => highlightWithRules(c, markupRules),
  xml: (c) => highlightWithRules(c, markupRules),
  svg: (c) => highlightWithRules(c, markupRules),
  css: (c) => highlightWithRules(c, cssRules),
  scss: (c) => highlightWithRules(c, scssRules),
  sass: (c) => highlightWithRules(c, scssRules),
  javascript: (c) => highlightWithRules(c, jsRules),
  typescript: (c) => highlightWithRules(c, tsRules),
  jsx: (c) => highlightWithRules(c, [...markupRules, ...jsRules]),
  tsx: (c) => highlightWithRules(c, [...markupRules, ...tsRules]),
  json: (c) => highlightWithRules(c, jsonRules),
  bash: (c) => highlightWithRules(c, bashRules),
  shell: (c) => highlightWithRules(c, bashRules),
  sql: (c) => highlightWithRules(c, sqlRules),
  python: (c) => highlightWithRules(c, pythonRules),
  php: (c) => highlightWithRules(c, phpRules),
  yaml: (c) => highlightWithRules(c, yamlRules),
  markdown: (c) => highlightWithRules(c, mdRules),
  docker: (c) => highlightWithRules(c, dockerRules),
  go: (c) => highlightWithRules(c, goRules),
  rust: (c) => highlightWithRules(c, rustRules),
  java: (c) => highlightWithRules(c, javaRules),
  csharp: (c) => highlightWithRules(c, csharpRules),
  cpp: (c) => highlightWithRules(c, cppRules),
  c: (c) => highlightWithRules(c, cppRules),
  powershell: (c) => highlightWithRules(c, powershellRules),
  ini: (c) =>
    highlightWithRules(c, [
      COMMENT_HASH,
      { type: 'comment', match: /;.*/g },
      { type: 'selector', match: /^\[[^\]]+\]/gm },
      { type: 'property', match: /^[^=\n]+(?==)/gm },
      STRING_DQ,
      STRING_SQ,
    ]),
  toml: (c) =>
    highlightWithRules(c, [
      COMMENT_HASH,
      { type: 'selector', match: /^\[[^\]]+\]/gm },
      { type: 'property', match: /^[\t ]*[A-Za-z_][\w-.]*(?=\s*=)/gm },
      STRING_DQ,
      STRING_SQ,
      { type: 'boolean', match: /\b(?:true|false)\b/g },
      NUMBER,
    ]),
  graphql: (c) =>
    highlightWithRules(
      c,
      clike(['query', 'mutation', 'subscription', 'type', 'input', 'enum', 'interface', 'union', 'scalar', 'fragment', 'on', 'schema', 'extend', 'implements', 'directive']),
    ),
  lua: (c) =>
    highlightWithRules(
      c,
      clike(
        ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while'],
        [{ type: 'comment', match: /--\[\[[\s\S]*?\]\]|--.*/g }],
      ),
    ),
  ruby: (c) =>
    highlightWithRules(
      c,
      clike(
        ['BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when', 'while', 'yield'],
        [{ type: 'comment', match: /#.*/g }, { type: 'symbol', match: /:[A-Za-z_]\w*/g }],
      ),
    ),
  kotlin: (c) =>
    highlightWithRules(
      c,
      clike([
        'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in',
        'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw',
        'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while', 'by', 'catch',
        'constructor', 'delegate', 'dynamic', 'field', 'file', 'finally', 'get', 'import',
        'init', 'param', 'property', 'receiver', 'set', 'setparam', 'where', 'actual',
        'abstract', 'annotation', 'companion', 'const', 'crossinline', 'data', 'enum',
        'expect', 'external', 'final', 'infix', 'inline', 'inner', 'internal', 'lateinit',
        'noinline', 'open', 'operator', 'out', 'override', 'private', 'protected', 'public',
        'reified', 'sealed', 'suspend', 'tailrec', 'vararg',
      ]),
    ),
  swift: (c) =>
    highlightWithRules(
      c,
      clike([
        'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func',
        'import', 'init', 'inout', 'internal', 'let', 'open', 'operator', 'private',
        'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript', 'typealias', 'var',
        'break', 'case', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough', 'for',
        'guard', 'if', 'in', 'repeat', 'return', 'switch', 'where', 'while', 'as', 'Any',
        'catch', 'false', 'is', 'nil', 'super', 'self', 'Self', 'throw', 'throws', 'true', 'try',
        'async', 'await', 'actor',
      ]),
    ),
  diff: (c) =>
    highlightWithRules(c, [
      { type: 'deleted', match: /^-.*/gm },
      { type: 'inserted', match: /^\+.*/gm },
      { type: 'keyword', match: /^(?:diff|index|@@).*/gm },
    ]),
  nginx: (c) =>
    highlightWithRules(c, [
      COMMENT_HASH,
      keywordRule('keyword', ['server', 'location', 'upstream', 'http', 'events', 'listen', 'root', 'index', 'proxy_pass', 'try_files', 'return', 'rewrite', 'if', 'include']),
      STRING_DQ,
      STRING_SQ,
      { type: 'number', match: /\b\d+\b/g },
      PUNCT,
    ]),
  http: (c) =>
    highlightWithRules(c, [
      { type: 'keyword', match: /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE|CONNECT)\b/gm },
      { type: 'property', match: /^[A-Za-z-]+:/gm },
      STRING_DQ,
      NUMBER,
    ]),
  batch: (c) =>
    highlightWithRules(c, [
      { type: 'comment', match: /(?:^|[\s&])::.*/gm },
      { type: 'comment', match: /(?:^|[\s&])REM\b.*/gim },
      keywordRule('keyword', ['echo', 'set', 'if', 'else', 'for', 'in', 'do', 'goto', 'call', 'exit', 'pause', 'cd', 'dir', 'copy', 'del', 'move', 'mkdir', 'rmdir', 'type', 'cls']),
      { type: 'variable', match: /%[^%]+%|!\w+!/g },
    ]),
  git: (c) => highlightWithRules(c, bashRules),
  mongodb: (c) => highlightWithRules(c, jsRules),
  regex: (c) =>
    highlightWithRules(c, [
      { type: 'keyword', match: /\\[wWdDsSbB]|\\[0-9]+|\\[rntfv]|\[(?:\\.|[^\]])+\]|\((?:\?[:!=<])?|\||\^|\$|\*|\+|\?|\{(?:\d+(?:,\d*)?)?\}|\./g },
    ]),
  autohotkey: (c) =>
    highlightWithRules(c, [
      COMMENT_LINE,
      COMMENT_BLOCK,
      { type: 'keyword', match: /\b(?:return|Send|SendInput|MsgBox|Sleep|If|Else|Loop|Break|Continue|ExitApp|Gui|SetTimer)\b/gi },
      { type: 'hotkey', match: /[~$!^+#]*[A-Za-z0-9]+::/g },
      STRING_DQ,
    ]),
  asciidoc: (c) => highlightWithRules(c, mdRules),
  clike: (c) => highlightWithRules(c, clike(['if', 'else', 'for', 'while', 'return', 'switch', 'case', 'break', 'continue', 'struct', 'class', 'enum', 'typedef', 'const', 'static', 'void', 'int', 'char', 'float', 'double', 'bool', 'true', 'false', 'null'])),
};

export function highlightLanguage(code: string, id: string): string | null {
  const fn = HIGHLIGHTERS[id];
  return fn ? fn(code) : null;
}

export function isLanguageReady(id: string): boolean {
  return id === 'plain' || id in HIGHLIGHTERS;
}
