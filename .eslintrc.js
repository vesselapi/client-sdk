module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['*.test.ts'],
  env: {
    es6: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
  },
  parserOptions: {
    project: ['./tsconfig.json'], // Specify it only for TypeScript files
  },
};
