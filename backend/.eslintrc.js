module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  env: { node: true, jest: true, es2022: true },
  extends: [],
  rules: { semi: ['error', 'always'], quotes: ['error', 'single'] },
};
