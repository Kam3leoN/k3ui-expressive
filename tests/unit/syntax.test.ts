import { describe, expect, it } from 'vitest';

/* A host-page code element must stay untouched */
document.body.innerHTML = '<pre><code class="language-js">const host = 1;</code></pre>';
const { syntax, LANGUAGE_MANIFEST } = await import('../../src/syntax/index.js');

const SAMPLES: Record<string, string> = {
  html: '<a href="/x">Hi</a>',
  xml: '<?xml version="1.0"?><note id="1"/>',
  php: '<?php echo "Hi " . $name; ?>',
  css: '.btn { color: #fff; }',
  scss: '$c: red;\n.a { &:hover { color: $c; } }',
  sass: '$c: red\n.a\n  color: $c',
  js: 'const x = await fetch("/api"); // go',
  ts: 'type A = { id: number };\nconst a: A = { id: 1 };',
  sqlite: 'SELECT id FROM users WHERE id = 1;',
  mysql: "INSERT INTO t (a) VALUES ('x');",
  json: '{ "a": [1, true, null] }',
  'c++': '#include <vector>\nstd::vector<int> v;',
  'c#': 'public class A { string Name { get; set; } }',
  c: 'int main(void) { return 0; }',
  git: '$ git commit -m "fix"\n+ added line',
  bat: '@echo off\nset X=1\nif %X%==1 echo ok',
  autohotkey: '^j::\nSend, My First Script\nreturn',
  asciidoc: '= Title\n\n*bold* text',
  go: 'func main() { fmt.Println("hi") }',
  python: 'def f(x):\n    return x + 1  # inc',
  http: 'GET /api HTTP/1.1\nHost: example.com',
  markdown: '# Title\n\n**bold** and `code`',
  lua: 'local t = { a = 1 } -- table',
  mongodb: 'db.users.find({ age: { $gt: 18 } })',
  nginx: 'server { listen 80; location / { root /var/www; } }',
  react: 'const App = () => <div className="a">{x}</div>;',
  tsx: 'const A = (p: P) => <b>{p.x}</b>;',
  bash: 'for f in *.txt; do echo "$f"; done',
  yaml: 'key: value\nlist:\n  - 1',
  powershell: 'Get-ChildItem | Where-Object { $_.Length -gt 1kb }',
  docker: 'FROM node:22\nRUN npm ci',
  rust: 'fn main() { let x: i32 = 5; }',
  java: 'public static void main(String[] a) {}',
};

describe('syntax engine', () => {
  it('never creates window.Prism nor touches host-page code', () => {
    expect((window as unknown as { Prism?: unknown }).Prism).toBeUndefined();
    expect(document.querySelector('code')!.innerHTML).toBe('const host = 1;');
  });

  it('resolves ids and aliases', () => {
    const cases: Record<string, string> = {
      'c++': 'cpp',
      'c#': 'csharp',
      cs: 'csharp',
      react: 'jsx',
      sqlite: 'sql',
      mysql: 'sql',
      bat: 'batch',
      ahk: 'autohotkey',
      ascii: 'plain',
      '': 'plain',
      html: 'markup',
      xml: 'markup',
      md: 'markdown',
      py: 'python',
      golang: 'go',
      mongo: 'mongodb',
      sh: 'bash',
      yml: 'yaml',
      ts: 'typescript',
    };
    for (const [alias, id] of Object.entries(cases)) expect(syntax.resolve(alias), alias).toBe(id);
  });

  it('ships languages in the main bundle', () => {
    for (const id of ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'svg', 'php']) {
      expect(syntax.isReady(id), id).toBe(true);
    }
    expect(LANGUAGE_MANIFEST.php?.tier).toBe('base');
  });

  it('escapes text — no HTML injection', () => {
    expect(syntax.highlight('<img src=x onerror=alert(1)>', 'plain')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
    const html = syntax.highlight('<script>alert(1)</script>', 'html');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;');
  });

  it('returns plain escaped text for unknown languages', async () => {
    expect(syntax.highlight('a < b', 'klingon')).toBe('a &lt; b');
    expect(await syntax.load('klingon')).toBe(false);
  });

  it('highlights every requested language', async () => {
    expect(await syntax.load('php')).toBe(true);
    for (const [lang, code] of Object.entries(SAMPLES)) {
      expect(await syntax.load(lang), lang).toBe(true);
      const html = syntax.highlight(code, lang);
      expect(html, lang).toMatch(/class="token /);
    }
    expect(syntax.highlight('SELECT 1', 'mysql')).toContain('token keyword');
    expect(syntax.highlight('fn main() {}', 'rust')).toContain('token keyword');
  });

  it('lists languages with readiness', () => {
    const list = syntax.languages();
    expect(list.find((l) => l.id === 'python')?.title).toBe('Python');
    expect(list.some((l) => l.id === 'clike')).toBe(false);
  });
});
