# Epic 2 — Architecture Compliance Report

## 1. Required components — status

| Required | Status | Where |
|---|---|---|
| User Domain | Done | `domain/entities/admin-user.entity.ts` |
| Role Domain | Done | `domain/entities/role.entity.ts` |
| Permission Domain | Done | `domain/entities/permission.entity.ts` |
| RBAC | Done | `Role`/`Permission`/`RolePermission` schema + seeded matrix |
| Authorization Policies | Done | `domain/services/authorization.service.ts` |
| Audit Actor | Done | `AdminUser.createdBy*`/`updatedBy*` using the [ADR 0005](../v2/adr/0005-actor-reference-model.md) polymorphic shape |
| Password Hashing | Done | `infrastructure/hashing/argon2-password-hasher.ts` (Argon2id) |
| Password Policy | Done | `domain/policies/password-policy.ts` (length-based, per `docs/product/01-AUTHENTICATION.md`) |
| Repository Layer | Done | 3 ports (`domain/repositories/`) + 3 Prisma adapters (`infrastructure/repositories/`) |
| Service Layer | Done | 9 use-cases (`application/use-cases/`) |
| DTOs | Done | `application/dto/` (create, update-role, response) |
| Validation | Done | class-validator on DTOs + domain-level `Email`/`PasswordPolicy` (defense in depth, disclosed in the Completion Report) |
| Prisma Models | Done | `Role`, `Permission`, `RolePermission`, `AdminUser` |
| Migrations | Done | `20260801203259_init_identity_core`, applied — see [EPIC-02-DATABASE-MIGRATION-SUMMARY.md](EPIC-02-DATABASE-MIGRATION-SUMMARY.md) |
| Unit Tests | Done | 47 tests, 9 suites — see [EPIC-02-TEST-SUMMARY.md](EPIC-02-TEST-SUMMARY.md) |
| Integration Tests | Done | 16 tests, 3 suites, against real Postgres |

## 2. Excluded components — confirmed absent

Login, JWT, Sessions, Refresh Tokens, Forgot Password, Email
Verification: **none exist anywhere in this epic's code.** Confirmed by
inspection — `identity.module.ts` registers no controllers at all (see
the Completion Report §5 for why that's a deliberate consequence of this
exclusion list, not an oversight), and no `AuthGuard`, `JwtService`, or
password-reset flow appears anywhere under `src/modules/identity/`.

## 3. The one significant schema decision: data-driven RBAC

v1's `docs/03-DATABASE-SCHEMA.md` sketched roles as a fixed `AdminRole`
enum. Building `AuthorizationService` and `CheckPermissionUseCase` against
that sketch surfaced that an enum can't answer "what permissions does
this role have" without a parallel hand-maintained map, can't have its
permission matrix changed without a code deploy, and forecloses the
already-flagged future "custom roles" question
([12-OPEN-QUESTIONS.md](../v2/12-OPEN-QUESTIONS.md)). `Role`/`Permission`/`RolePermission`
were introduced instead, per the project's own governance rule (ADR 0010:
every architecturally significant decision gets an ADR going forward).
Full reasoning, alternatives considered, and consequences:
[ADR 0011](../v2/adr/0011-data-driven-rbac-schema.md).

This is a data-model shape change, not a business-rule change — "one role
per user," "Super-Admin-only role assignment," and "at least one active
Super Admin must always exist" are enforced exactly as
`docs/product/23-ROLES-PERMISSIONS.md` specifies, just against a relation
instead of an enum value.

## 4. Disclosed simplification: permission-matrix collapsing

`docs/05-ROADMAP.md`'s RBAC matrix describes a few role-specific UI
affordances (e.g. Warehouse's "packing view," "inventory KPIs only") that
read as scoped capabilities but are actually narrower *views* of a
broader permission already in the seeded set (`orders.view`,
`inventory.view` respectively) rather than independently enforceable
capabilities. Epic 2 seeds 17 permissions, not a 1:1 permission per every
matrix row, on the judgment that inventing a separate permission key for
a UI-only distinction would be permission-key proliferation with no
corresponding authorization check to attach it to. If a future epic finds
a genuine enforcement need behind one of these (e.g. Warehouse should see
inventory *counts* but not cost data), that's a new permission key added
to `permissions.constants.ts` and a new `RolePermission` grant — additive,
not a schema change (see [ADR 0011](../v2/adr/0011-data-driven-rbac-schema.md)'s
consequences).

## 5. Foundation touches — every one disclosed

Foundation (Epic 1) was frozen; per the epic brief, it was not to be
modified. Two categories of touch were unavoidable and are each disclosed
here and in the Completion Report:

1. **`src/app.module.ts`** — registered `PrismaModule` and
   `IdentityModule` in the root `imports` array. This is the minimum
   possible change to make Epic 2's module reachable at all; no other
   line in the file changed.
2. **Test tooling did not exist in Epic 1 at all** (Epic 1's explicit
   scope excluded tests). Adding it required touching `turbo.json`,
   `package.json` (root), `apps/api/eslint.config.js`, and
   `.github/workflows/ci.yml` — listed in full in the Completion Report.

### `turbo.json` type-check race

While running the required "everything must compile, everything must
pass" verification pass with a forced, uncached `pnpm turbo run build
lint type-check test`, `@za/admin`'s `type-check` task failed
intermittently with `TS6053: File '.next/types/app/.../page.ts' not
found`. Root cause: `turbo.json`'s `type-check` task declared
`"dependsOn": ["^build"]` — dependencies' builds only, not this
package's own `build`. Next.js's app-router type-check depends on
`.next/types/**` files that `next build` itself generates, so
`type-check` and `build` for the *same* package could run concurrently,
and `type-check` sometimes won the race and read an empty/missing
`.next/types` directory. This didn't surface during Epic 1's own
verification pass (favorable timing, not a guarantee), and cache hits on
a warm run mask it entirely — it only reproduces on a clean,
`--force`-d run, which is exactly the kind of run this epic's "everything
must compile" requirement demands.

Fixed by changing `type-check`'s `dependsOn` to `["^build", "build"]`
(same-package build now precedes its own type-check). This is a
task-runner correctness fix, not an architectural decision — it makes an
already-intended dependency (type-check needs build's generated types)
actually explicit to Turborepo's task graph.

## 6. Nothing else was redesigned

Everything else built in this epic follows the Architecture v2 documents
as specified: the Actor pattern from ADR 0005, the layering (domain /
application / infrastructure) from
[01-CONTEXT-MAP-V2.md](../v2/01-CONTEXT-MAP-V2.md), and the password
policy from `docs/12-SECURITY-REVIEW.md` §10. No P0/P1 decision from
Architecture v2 was revisited.
