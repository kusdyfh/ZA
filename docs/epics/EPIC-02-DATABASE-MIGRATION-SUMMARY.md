# Epic 2 — Database Migration Summary

## Migration

**`20260801203259_init_identity_core`** — the only migration this epic
produces. Generated via `prisma migrate dev --name init_identity_core`
and applied against the project's Docker Postgres instance
(`infrastructure/docker/docker-compose.yml`, mapped to `localhost:5433` in
this environment). Prisma reported `Your database is now in sync with
your schema` and regenerated the client successfully.

This is Epic 2's first migration — `apps/api` had `DATABASE_URL`
validated by Epic 1's config module but never actually connected Prisma to
it; Epic 1 deliberately shipped no schema. This migration is the first
real schema to exist in the project.

### What it creates

- **`ActorType` enum** (`ADMIN`, `CUSTOMER`, `SYSTEM`) — mirrors
  `@za/types`' `ActorType`, per [ADR 0005](../v2/adr/0005-actor-reference-model.md).
- **`roles`** — `key` (unique), `name`, `description`, `isSystem`
  (defaults `true`).
- **`permissions`** — `key` (unique), `module` (indexed), `action`,
  `description`.
- **`role_permissions`** — composite PK `(roleId, permissionId)`, both
  `ON DELETE CASCADE` — a role or permission being deleted cleanly drops
  its grants rather than orphaning rows.
- **`admin_users`** — `email` (unique), `passwordHash`, `isActive`
  (defaults `true`), `roleId` FK to `roles` (`ON DELETE RESTRICT` — a role
  in use by a staff account cannot be deleted out from under them),
  `deactivatedAt`, and the four Actor-attribution columns
  (`createdByActorId`/`createdByActorType`/`updatedByActorId`/`updatedByActorType`,
  each `ActorType` defaulting to `SYSTEM`). Indexed on `roleId`.

Full SQL:
[`migrations/20260801203259_init_identity_core/migration.sql`](../../apps/api/prisma/migrations/20260801203259_init_identity_core/migration.sql).

### Why this schema, not v1's enum

See [ADR 0011](../v2/adr/0011-data-driven-rbac-schema.md) for the full
reasoning — in short, `Role`/`Permission`/`RolePermission` as tables
(rather than v1's `AdminRole` enum) make the permission matrix queryable
and updatable as data instead of requiring a code deploy, and leave a
clean path to custom, non-system roles in a future epic without another
schema migration.

## Seed

`prisma/seed.ts`, run via `pnpm db:seed` (`prisma db seed` →
`ts-node --transpile-only prisma/seed.ts`). Idempotent — every write is
an `upsert` (or an explicit `deleteMany` reconciliation for stale
`RolePermission` grants), so re-running it against a database that
already has this epic's data is safe and a no-op except where the source
constants have actually changed.

Seeds, from `src/modules/identity/domain/constants/permissions.constants.ts`:

- **5 roles**: `SUPER_ADMIN`, `MANAGER`, `WAREHOUSE`, `SALES`,
  `CUSTOMER_SUPPORT` — the fixed set from `docs/05-ROADMAP.md`'s RBAC
  matrix, each `isSystem: true`.
- **17 permissions** across 9 modules (`products`, `inventory`, `orders`,
  `customers`, `coupons`, `reviews`, `content`, `analytics`, `users`,
  `settings`, `audit_log`).
- **Role → permission grants** — the full matrix from
  `ROLE_DEFINITIONS`, reconciled (not just additively inserted) against
  each role's current definition, so removing a permission from a role's
  definition and re-seeding actually revokes the grant rather than
  leaving it stale.
- **One bootstrap `AdminUser`**, `SUPER_ADMIN`-rolled, from
  `BOOTSTRAP_SUPER_ADMIN_EMAIL` / `BOOTSTRAP_SUPER_ADMIN_PASSWORD`
  (`.env.example` documents both; the seed warns and skips this step,
  without failing, if either is unset).

### Verification performed

Ran the seed against the real Docker Postgres instance and confirmed via
`psql`:

```
 key
------------------
 SUPER_ADMIN
 MANAGER
 WAREHOUSE
 SALES
 CUSTOMER_SUPPORT
(5 rows)
```

- `roles`: 5 rows.
- `permissions`: 17 rows.
- `admin_users`: 1 row (the bootstrap Super Admin).

Re-verified after the full integration test run (which creates and
cleans up its own uniquely-keyed fixtures) that these counts were
unchanged — the test suites do not leak rows into the seeded catalog.

## Manual steps required in a new environment

1. `docker compose -f infrastructure/docker/docker-compose.yml up -d`
   (or equivalent) to have a reachable Postgres.
2. Copy `.env.example` to `.env`, set `DATABASE_URL` and
   `BOOTSTRAP_SUPER_ADMIN_EMAIL`/`BOOTSTRAP_SUPER_ADMIN_PASSWORD`.
3. `pnpm --filter @za/api db:migrate:deploy` (production) or
   `db:migrate:dev` (local, prompts to name new migrations).
4. `pnpm --filter @za/api db:seed`.

No manual SQL, no manual data entry — every step is one of the four
commands above.
