# Epic 2 — Test Summary

## Headline

| Suite | Config | Requires | Suites | Tests | Result |
|---|---|---|---|---|---|
| Unit | `apps/api/jest.config.js` | nothing (mocked repositories) | 9 | 47 | **All passing** |
| Integration | `apps/api/jest.integration.config.js` | a real Postgres (`DATABASE_URL`) | 3 | 16 | **All passing** |

Both suites were run clean, immediately before this report, from an
uncached `pnpm turbo run build lint type-check test` (unit) and a direct
`pnpm test:integration` against the project's own Docker Postgres
instance (integration). Neither run left residue: the seeded catalog
(5 roles, 17 permissions, 1 bootstrap Super Admin) was verified intact
via `psql` after the integration run.

## Unit tests (`pnpm --filter @za/api test`)

No database, no NestJS DI container — pure functions and classes with
hand-constructed mocks conforming to the repository port interfaces.

| File | What it covers |
|---|---|
| `domain/policies/password-policy.spec.ts` | Accepts ≥10 chars, rejects shorter/empty. |
| `domain/value-objects/email.vo.spec.ts` | Trims/lowercases, rejects malformed input, case/whitespace-insensitive equality. |
| `domain/services/authorization.service.spec.ts` | `hasPermission`/`hasAnyPermission`/`hasAllPermissions`/`assertPermission` (including the `PermissionDeniedError` throw path). |
| `domain/entities/admin-user.entity.spec.ts` | `validateName` (trim + reject blank); `deactivate`/`activate` (state change + actor stamping + no-op-when-already-in-that-state); `changeRole` (roleId update + actor stamping). |
| `application/use-cases/create-admin-user.use-case.spec.ts` | Happy path (hash + create); `RoleNotFoundError`; `EmailAlreadyInUseError`; `WeakPasswordError` short-circuits before any repository call; `InvalidEmailError`; `InvalidAdminUserNameError`. |
| `application/use-cases/deactivate-admin-user.use-case.spec.ts` | `AdminUserNotFoundError`; **the last-active-Super-Admin invariant** — blocks deactivating the sole active Super Admin, allows it when a second active one exists, skips the check entirely for non-Super-Admin roles and for already-inactive users. |
| `application/use-cases/activate-admin-user.use-case.spec.ts` | `AdminUserNotFoundError`; successful reactivation. |
| `application/use-cases/change-admin-user-role.use-case.spec.ts` | `AdminUserNotFoundError`; `RoleNotFoundError`; **the last-active-Super-Admin invariant applied to role changes** — blocks moving the sole active Super Admin to another role, allows it with a second active Super Admin present, skips the check when the target role is unchanged or the user is inactive. |
| `application/use-cases/check-permission.use-case.spec.ts` | Returns `false` for a missing user, an inactive user, or an unloadable role; returns `true`/`false` correctly based on the role's granted permission keys. |

The last-active-Super-Admin invariant — the one explicitly called out in
this epic's brief as needing coverage — is exercised from both directions
it can be violated (deactivation and role change), plus the boundary
cases (exactly one active Super Admin vs. two, active vs. already
inactive, same-role vs. different-role).

## Integration tests (`pnpm --filter @za/api test:integration`)

Run with `--runInBand` against the real Postgres started by
`infrastructure/docker/docker-compose.yml` (port 5433 in this
environment). Each suite creates its own uniquely-keyed fixtures
(`randomUUID()`-suffixed keys/emails) and deletes them in `afterAll` —
none of the seeded catalog data is read, relied upon, or mutated as a
precondition, so these tests are safe to run repeatedly against a
shared dev database.

| File | What it covers |
|---|---|
| `prisma-permission.repository.integration.spec.ts` | Create via raw Prisma → `findByKey()` round-trip; `findByKey()` returns `null` for a missing key; `list()` includes both a known seeded permission and the test fixture. |
| `prisma-role.repository.integration.spec.ts` | `findById()`/`findByKey()` round-trip; `findById()` returns `null` for a missing id; `list()` includes a seeded role and the fixture; `findWithPermissions()` correctly joins through `RolePermission` to return the granted permission keys; `findWithPermissions()` returns `null` for a missing role. |
| `prisma-admin-user.repository.integration.spec.ts` | `create()` persists and stamps the actor; `findById()`/`findByEmail()` round-trip; `findByEmail()` returns `null` for a missing address; **`save()` correctly persists `deactivate()` + `changeRole()` mutations made on a domain entity back to Postgres**; `countActiveByRoleId()` reflects deactivation/reactivation; `list()` includes the created user. |

These are the tests that actually exercise the infrastructure layer's
Prisma-enum casts (`AdminUserMapper`, `PrismaAdminUserRepository`) end to
end against a live database — the layer the unit tests, by design
(mocked repositories), cannot reach.

## What is deliberately not covered

- **HTTP-layer tests**: there is no HTTP layer in this epic (see the
  Completion Report §5) — nothing to test.
- **`test:integration` in CI**: requires a live Postgres; CI's new `test`
  job (`.github/workflows/ci.yml`) runs the unit suite only. Running
  integration tests in CI is a natural addition for whichever future epic
  adds a Postgres service container to the workflow — noted here so it
  isn't mistaken for an oversight.
- **The trivial list use-cases** (`ListAdminUsersUseCase`,
  `ListRolesUseCase`, `ListPermissionsUseCase`,
  `GetRoleWithPermissionsUseCase`'s "not found" path) have no branching
  logic of their own beyond a single repository call — a unit test would
  only be re-asserting that the mock returns what it was told to return.
  `GetRoleWithPermissionsUseCase`'s happy path and `RoleWithPermissionKeys`
  shape are exercised indirectly via `CheckPermissionUseCase`'s tests and
  the `findWithPermissions` integration test.
