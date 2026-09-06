// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('./base');

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.Config[]} */
const nextConfig = [
  // next/core-web-vitals is bridged from the legacy eslintrc format and
  // sets its own `languageOptions.parser`. It must come BEFORE baseConfig
  // here so our typed-linting parser/parserOptions (from typescript-eslint)
  // are the last word for any file both blocks match — otherwise the
  // bridged config silently wins the parser, while our type-aware rules
  // stay active and crash for lack of parser services.
  ...compat.extends('next/core-web-vitals'),
  ...baseConfig,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // eslint-config-next@14.2.15's bundled plugin still calls the
      // legacy `context.getAncestors()` API, removed in ESLint 9 — this
      // rule only applies to the pages-router `_document.js` pattern
      // anyway, which this App-Router-only project never uses.
      '@next/next/no-duplicate-head': 'off',
    },
  },
];

module.exports = nextConfig;
