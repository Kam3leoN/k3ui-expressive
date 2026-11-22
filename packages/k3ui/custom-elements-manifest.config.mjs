/** @type {import('@custom-elements-manifest/analyzer').AnalyzerConfig} */
export default {
  globs: [
    'src/components/**/!(*.styles|*.specs|*.types|*.utils|*.position|*.highlighter|*-lang-icons|*.engine|*.mcu|*.presets|*.theme|*.register|*.pack|*.frames|*.payload|*.encoder|*.render|*.qrio*).ts',
  ],
  exclude: ['**/*.test.ts', '**/node_modules/**'],
  outdir: '.',
  litelement: true,
};
