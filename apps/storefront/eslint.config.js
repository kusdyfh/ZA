const nextConfig = require('@za/eslint-config/next');

module.exports = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'jest.setup.js',
      'scripts/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
];
