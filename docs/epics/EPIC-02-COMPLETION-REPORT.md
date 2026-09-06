# Epic 2 — Identity & Access Management Core — Completion Report

**Scope**: User Domain, Role Domain, Permission Domain, RBAC, Authorization
Policies, Audit Actor, Password Hashing, Password Policy, Repository
Layer, Service Layer, DTOs, Validation, Prisma Models, Migrations, Unit
Tests, Integration Tests.

**Explicitly excluded** (per the epic brief, unchanged): Login, JWT,
Sessions, Refresh Tokens, Forgot Password, Email Verification. No HTTP
controllers exist in this epic — see [§5](#5-a-disclosed-scope-decision-no-controllers).

## 1. Files Created

### `apps/api/prisma/` — schema, migration, seed

- `schema.prisma` — `Role`, `Permission`, `RolePermission`, `AdminUser`
  models, `ActorType` enum. See
  [ADR 0011](../v2/adr/0011-data-driven-rbac-schema.md) for why Role/Permission
  are data models rather than the v1 `AdminRole` enum sketch.
- `migrations/20260801203259_init_identity_core/migration.sql` — the one
  migration this epic produces, applied against the real Docker Postgres
  instance. See [EPIC-02-DATABASE-MIGRATION-SUMMARY.md](EPIC-02-DATABASE-MIGRATION-SUMMARY.md).
- `seed.ts` — idempotent seed of the 5 roles, 17 permissions, their
  grants, and one bootstrap Super Admin from
  `BOOTSTRAP_SUPER_ADMIN_EMAIL`/`BOOTSTRAP_SUPER_ADMIN_PASSWORD`.
- `tsconfig.json` — a minimal, `noEmit` TypeScript project scoped to
  `prisma/**/*.ts`, added solely so ESLint's typed-linting project
  service has a project to resolve `seed.ts` against (it lives outside
  `apps/api/tsconfig.json`'s `rootDir: ./src`). Not consumed by any build
  or run script — `ts-node --transpile-only` (already configured) never
  reads it.

### `src/modules/identity/domain/` — the domain layer

- `entities/{admin-user,role,permission}.entity.ts` — private-constructor
  entities with `reconstitute()` factories. `AdminUser` owns
  `deactivate()`/`activate()`/`changeRole()`, each stamping the acting
  `ActorRef`.
- `value-objects/email.vo.ts` — normalizes (trim + lowercase) and
  validates at construction.
- `policies/password-policy.ts` — `PASSWORD_MIN_LENGTH = 10`; length over
  complexity, per `docs/product/01-AUTHENTICATION.md`.
- `errors/identity.errors.ts` — 9 domain errors extending the shared
  `DomainError` base, each with a stable `code`.
- `services/authorization.service.ts` — pure RBAC decision logic
  (`hasPermission`/`hasAnyPermission`/`hasAllPermissions`/`assertPermission`);
  no HTTP/JWT awareness.
- `services/password-hasher.ts` — `PasswordHasher` port + `PASSWORD_HASHER`
  DI token.
- `repositories/{admin-user,role,permission}.repository.ts` — repository
  ports (interfaces) + Symbol DI tokens. `RoleWithPermissionKeys` is the
  shape `findWithPermissions()` returns.
- `constants/{roles,permissions}.constants.ts` — the single source of
  truth for the 5 roles and 17 permissions, consumed by both `seed.ts` and
  (in a future epic) any admin-facing "what can this role do" screen.

### `src/modules/identity/application/` — the application layer

- `dto/create-admin-user.dto.ts`, `update-admin-user-role.dto.ts` —
  class-validator DTOs. Validation here intentionally overlaps with the
  domain's own `Email`/`PasswordPolicy` checks (defense in depth per
  `docs/v2/08-DEVELOPER-EXPERIENCE.md` — the domain must stay correct even
  from a non-HTTP entry point that skips these DTOs entirely).
- `dto/admin-user-response.dto.ts` — `fromDomain()` excludes
  `passwordHash` from every serialized response.
- `use-cases/*.ts` — 9 use-cases: `CreateAdminUserUseCase`,
  `DeactivateAdminUserUseCase`, `ActivateAdminUserUseCase`,
  `ChangeAdminUserRoleUseCase`, `CheckPermissionUseCase`,
  `ListAdminUsersUseCase`, `ListRolesUseCase`, `ListPermissionsUseCase`,
  `GetRoleWithPermissionsUseCase`. The three that mutate an `AdminUser`'s
  standing (deactivate/activate/change-role) each enforce the "at least
  one active Super Admin" invariant where relevant.

### `src/modules/identity/infrastructure/` — the infrastructure layer

- `mappers/{admin-user,role,permission}.mapper.ts` — Prisma record ↔
  domain entity translation. This is the one place the Prisma-generated
  `ActorType` (a string-literal-union, not a nominal enum) is cast to
  `@za/types`' `ActorType` — confined here, never leaking into the
  domain.
- `repositories/prisma-{admin-user,role,permission}.repository.ts` —
  Prisma implementations of the domain ports.
- `hashing/argon2-password-hasher.ts` — Argon2id via the `argon2`
  package, per `docs/12-SECURITY-REVIEW.md` §10.

### Module wiring and tests

- `identity.module.ts` — wires every provider by DI token; deliberately
  registers zero controllers (see [§5](#5-a-disclosed-scope-decision-no-controllers)).
- `src/app.module.ts` — **the one Foundation file touched**: added
  `PrismaModule` and `IdentityModule` to the root `imports` array. No
  other Epic 1 file was modified.
- 9 `*.spec.ts` unit test files (domain + application layer, mocked
  repositories) and 3 `*.integration.spec.ts` files (repositories against
  real Postgres) — see [EPIC-02-TEST-SUMMARY.md](EPIC-02-TEST-SUMMARY.md).

### Foundation config touched for testing (disclosed)

Epic 1 shipped no test tooling at all — Epic 2 is the first to need it.
Three Foundation files were touched, each minimally:

- `apps/api/jest.config.js`, `apps/api/jest.integration.config.js` — new
  files (unit vs. integration test runners).
- `apps/api/eslint.config.js` — added one override disabling
  `@typescript-eslint/unbound-method` for `**/*.spec.ts` (a well-known
  false positive against `jest.fn()`-based mock objects, which are plain
  object literals, not real class instances with meaningful `this`
  binding).
- `turbo.json` — added a `test` task; and fixed a latent race in the
  existing `type-check` task (it depended only on `^build`, not this
  package's own `build`, so a Next.js app's `type-check` could run before
  `next build` finished writing `.next/types/**`). See
  [EPIC-02-ARCHITECTURE-COMPLIANCE.md](EPIC-02-ARCHITECTURE-COMPLIANCE.md#turbojson-type-check-race)
  for the full account — this is a bug fix surfaced by running a clean,
  uncached verification pass, not a redesign.
- `package.json` (root) — added a `test` script (`turbo run test`).
- `.github/workflows/ci.yml` — added a `test` job running
  `pnpm turbo run test` (unit tests only; integration tests need a live
  Postgres and are deliberately not wired into CI in this epic).

## 2. Architecture Compliance Report

See [EPIC-02-ARCHITECTURE-COMPLIANCE.md](EPIC-02-ARCHITECTURE-COMPLIANCE.md)
for the full point-by-point account. Summary: every required component
was built; the one significant schema decision (data-driven RBAC instead
of an enum) is documented in [ADR 0011](../v2/adr/0011-data-driven-rbac-schema.md)
per the project's own governance rule; no excluded feature (Login, JWT,
Sessions, etc.) was implemented.

## 3. Test Summary

See [EPIC-02-TEST-SUMMARY.md](EPIC-02-TEST-SUMMARY.md). Headline: 47 unit
tests + 16 integration tests, all passing, run clean from an uncached
state.

## 4. Database Migration Summary

See [EPIC-02-DATABASE-MIGRATION-SUMMARY.md](EPIC-02-DATABASE-MIGRATION-SUMMARY.md).
Headline: one migration (`20260801203259_init_identity_core`), applied
successfully; the seed script populates 5 roles, 17 permissions, and one
bootstrap Super Admin, idempotently.

## 5. A disclosed scope decision: no controllers

`IdentityModule` registers zero `@Controller()`s. This wasn't explicitly
listed under "do not implement," but building an HTTP surface for staff
management with no authentication guard in front of it — because
Login/JWT are explicitly out of scope for this epic — would itself be a
security defect: an unauthenticated `POST /admin-users` that creates
Super Admin accounts. The use-cases are fully built, tested, and exported
from the module; wiring them to controllers is one epic's worth of work
(add Login/JWT, then add controllers + guards that call
`CheckPermissionUseCase`), not a redesign.

## 6. Commands

```bash
# from the repo root, with Docker Postgres running (infrastructure/docker/docker-compose.yml)
pnpm --filter @za/api db:migrate:dev   # apply migrations (DATABASE_URL required)
pnpm --filter @za/api db:seed          # seed roles/permissions/bootstrap admin
pnpm --filter @za/api test             # unit tests (no DB required)
pnpm --filter @za/api test:integration # repository integration tests (real Postgres required)

# whole monorepo
pnpm turbo run build lint type-check test
```

## 7. Requires Manual Configuration / Attention

- `BOOTSTRAP_SUPER_ADMIN_EMAIL` / `BOOTSTRAP_SUPER_ADMIN_PASSWORD` must be
  set (via `.env`, copied from `.env.example`) before running
  `db:seed` in a new environment — without them the seed skips creating a
  Super Admin and only warns.
- `test:integration` requires a real, running Postgres reachable via
  `DATABASE_URL` — it is not run as part of `pnpm test` or CI. Run it
  manually (or in a future epic's CI job with a Postgres service
  container) before trusting the repository layer in a new environment.
- No HTTP surface exists yet for anything built in this epic — see §5.
  The next epic that adds Login/JWT is the natural place to also add the
  first `identity` controllers.
