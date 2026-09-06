# ADR 0011: Data-Driven RBAC Schema

**Status**: Accepted
**Supersedes**: the `AdminRole` enum in
[v1 03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md#enums) (`SUPER_ADMIN`,
`MANAGER`, `WAREHOUSE`, `SALES`, `CUSTOMER_SUPPORT`) and `AdminUser.role
AdminRole`.
**Raised during**: Epic 2 (Identity & Access Management Core)
implementation — this is a schema decision made while building, per the
governance rule in
[ADR 0010](0010-developer-experience-governance.md#decision) that every
architecturally significant decision from implementation onward gets a
numbered ADR rather than being silently absorbed into code.

## Context

v1's schema modeled the five staff roles as a fixed Prisma `enum
AdminRole`, with `AdminUser.role: AdminRole` as a single scalar column.
This is simple and was adequate for a document that was still deferring
*what a role can actually do* — v1 and v2 both left "the RBAC permission
matrix" as a table in [05-ROADMAP.md](../../05-ROADMAP.md) rather than a
schema concern, on the assumption that permission-checking logic would
hardcode a `switch` on the enum wherever it was needed.

Building Epic 2's `AuthorizationService` and `CheckPermissionUseCase`
against that assumption surfaced three concrete problems:

1. **Permissions can't be queried or listed without hardcoding.** "Which
   permissions does the Manager role have?" (needed for an admin-facing
   "what can this role do" screen, and for
   `GetRoleWithPermissionsUseCase`) has no answer from an enum — the
   matrix would have to be duplicated as a parallel, hand-maintained
   TypeScript object with no way for the database or a future admin UI to
   see or verify it against what's actually enforced.
2. **A permission-matrix change is a code deploy, not a data change.**
   Moving `orders.refund` from Sales to also-Warehouse (a realistic,
   frequently-requested change from a small commerce operation) would mean
   editing a `switch` statement and redeploying, rather than an update
   query — direct tension with
   [08-DEVELOPER-EXPERIENCE.md](../08-DEVELOPER-EXPERIENCE.md)'s
   preference for configuration over code changes for business-tunable
   rules.
3. **No path to custom roles without a breaking schema change.**
   [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md) already flags
   "custom, non-system roles" as an open future question. An enum column
   forecloses that entirely — adding a role requires a migration that
   changes the enum type itself, which Postgres treats as a schema
   migration touching every row, not an insert.

None of this was a defect in v1 at the time it was written — the roles
were genuinely fixed and the permission matrix was genuinely a document,
not yet code. It became a real constraint only once Epic 2 had to make the
matrix *executable*.

## Decision

Replace the `AdminRole` enum with three first-class tables:

```prisma
model Role {
  id          String   @id @default(cuid())
  key         String   @unique   // e.g. "SUPER_ADMIN" — stable machine identifier
  name        String              // e.g. "Super Admin" — display label
  description String?
  isSystem    Boolean  @default(true)  // seeded, non-deletable role

  permissions RolePermission[]
  users       AdminUser[]
}

model Permission {
  id          String   @id @default(cuid())
  key         String   @unique   // "<module>.<action>", e.g. "orders.refund"
  module      String
  action      String
  description String?

  roles RolePermission[]
}

model RolePermission {
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  roleId       String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  permissionId String
  grantedAt    DateTime   @default(now())

  @@id([roleId, permissionId])
}
```

`AdminUser.roleId` becomes a real foreign key to `Role.id`, replacing the
scalar `role: AdminRole` column. **One role per user is unchanged** — this
is a data-model shape change, not a policy change; `docs/product/23-ROLES-PERMISSIONS.md`'s
"role assignment is Super-Admin-only, one role per staff member" rule is
enforced exactly as before, just against a relation instead of an enum
value.

The five roles (`SUPER_ADMIN`, `MANAGER`, `WAREHOUSE`, `SALES`,
`CUSTOMER_SUPPORT`) and the 17 permissions from the RBAC matrix are seeded
via `prisma/seed.ts` from a single source of truth
(`src/modules/identity/domain/constants/permissions.constants.ts`'s
`PERMISSION_DEFINITIONS` and `ROLE_DEFINITIONS`), marked `isSystem: true`
— they are still fixed for this epic in every practical sense (nothing in
Epic 2 exposes an HTTP endpoint to create or edit a role), but the fixed-ness
is now a seed-time convention rather than a type-system guarantee.

`AuthorizationService.hasPermission()` operates on a loaded
`RoleWithPermissionKeys` (a role plus the flat array of its granted
permission keys) — pure, synchronous, no enum `switch` anywhere.

## Consequences

- **Positive**: `GetRoleWithPermissionsUseCase` / `ListPermissionsUseCase`
  / `ListRolesUseCase` can answer "what does this role grant" directly
  from the database — no parallel hardcoded matrix to keep in sync.
- **Positive**: a permission-matrix change (e.g. granting Warehouse
  `orders.refund`) becomes a `RolePermission` insert/delete, seedable and
  auditable (`grantedAt`), not a code change.
- **Positive**: this directly unblocks the "custom roles" open question
  from [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md) for a future epic —
  a custom role is just a `Role` row with `isSystem: false` and its own
  `RolePermission` grants. Nothing else in this schema needs to change to
  support that later.
- **Negative**: two extra joins (`Role` → `RolePermission` → `Permission`)
  to answer "does this user have this permission," versus an enum
  comparison. Mitigated by `RoleRepository.findWithPermissions()` loading
  the full grant set in one query per authorization check rather than
  per-permission; a future epic that finds this check on the hot path of
  every request should cache the resolved `RoleWithPermissionKeys` (e.g.
  alongside the session/JWT once Login exists), not re-architect the
  schema.
- **Negative**: `Role.key` and `Permission.key` are enforced unique only by
  a database `@unique` constraint, not a TypeScript union type — a typo in
  a seed file's key string is now a data-integrity risk instead of a
  compile error. Mitigated by `PERMISSION_KEYS` /
  `ROLE_KEYS` remaining literal-union TypeScript constants
  (`permissions.constants.ts` / `roles.constants.ts`) that both the seed
  script and application code import from — the compile-time safety is
  preserved at the TypeScript boundary, just not inside Postgres itself.
- **Neutral, disclosed simplification**: the seeded 17 permissions
  collapse a few matrix entries from
  [05-ROADMAP.md](../../05-ROADMAP.md) that were described as
  role-specific UI affordances rather than separately-enforceable
  capabilities (e.g. Warehouse's "packing view" and "inventory KPIs
  only") into the nearest existing permission key rather than minting a
  1:1 permission per matrix row. See
  [EPIC-02-ARCHITECTURE-COMPLIANCE.md](../../epics/EPIC-02-ARCHITECTURE-COMPLIANCE.md)
  for the full mapping.

## Alternatives Considered

- **Keep the `AdminRole` enum, hardcode a `ROLE_PERMISSIONS` map in
  TypeScript.** Rejected — this is what Epic 2 started from and is exactly
  the problem described in Context: no queryability, matrix changes
  require a deploy, and it foreclosed custom roles. It would have been the
  path of least resistance (zero schema change) but fails the "optimize
  for long-term evolution" instruction under which Architecture v2 was
  written.
- **Bitmask/flags column on `AdminUser`** (`permissionsBitmask: BigInt`).
  Rejected — unreadable in the database without an application-side
  decoder, a hard ceiling on the number of permissions (64 per `BigInt`),
  and no per-role indirection (every user would need every permission bit
  set individually, losing "role" as a concept entirely).
- **Full custom-role support now** (a role-management UI, arbitrary
  user-defined roles from day one). Rejected as out of scope for this
  epic — Epic 2's explicit brief covers the User/Role/Permission
  *domains*, not a role-authoring feature. This ADR's schema is
  deliberately shaped so that a future epic can add custom-role authoring
  as a pure application-layer feature (a new use-case + controller) without
  another schema migration.
