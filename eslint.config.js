// @ts-check

const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'holder.min.js',
      'jquery-3.2.1.js',
      'user2.js',
      'abi_aaas.js',
      'coverage/',
    ],
  },
];
