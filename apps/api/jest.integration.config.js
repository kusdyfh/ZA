/**
 * Repository integration tests against a real Postgres instance.
 * Requires DATABASE_URL to point at a running database (see
 * infrastructure/docker/docker-compose.yml) — not run as part of
 * `pnpm test`, and not wired into CI in this epic (see
 * docs/epics/EPIC-02-TEST-SUMMARY.md).
 */
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  testRegex: '.*\\.integration\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
};
