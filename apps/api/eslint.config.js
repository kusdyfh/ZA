const nestjsConfig = require('@za/eslint-config/nestjs');

module.exports = [
  ...nestjsConfig,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    // Mocked repository/service methods in tests are plain object
    // properties, not real class methods with meaningful `this` — this
    // rule's premise doesn't apply here and only produces noise.
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
