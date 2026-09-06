// @ts-check
const baseConfig = require('./base');

/** @type {import('eslint').Linter.Config[]} */
const nestjsConfig = [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];

module.exports = nestjsConfig;
