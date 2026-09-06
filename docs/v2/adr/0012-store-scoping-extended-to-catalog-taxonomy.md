# ADR 0012: Store-Scoping Extended to Catalog Taxonomy Tables

**Status**: Accepted
**Extends**: [ADR 0006](0006-saas-ready-schema-pattern.md) — applies its
already-decided `storeId` scoping pattern to `Brand` and `Tag`, two tables
that did not exist when ADR 0006 was written and so aren't named in its
decision table.
**Raised during**: Epic 3A (Commerce Core) implementation, per the
governance rule in
[ADR 0010](0010-developer-experience-governance.md#decision).

## Context

ADR 0006 introduced `Store` and `storeId` scoping, and enumerated the
specific tables that needed it at the time it was written: `Product`,
`ProductVariant`, `Category`, `Collection`, `Coupon`, `Customer`,
`AdminUser`, `Order`, `Setting`, `Page`, `BlogPost`. `Brand` and `Tag`
were still just sketched in
[v1 03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md) at that point,
each with a global `@unique` constraint on `name`/`slug` — the exact shape
ADR 0006 says must not ship again.

Building Epic 3A's Catalog domain raised the concrete question: do
`Brand` and `Tag` get the same treatment as their sibling taxonomy tables
`Category` and `Collection`, or do they stay globally unique on the
theory that ADR 0006's table is a complete, closed list?

## Decision

**Yes — `Brand` and `Tag` get `storeId` scoping identically to
`Category`/`Collection`.** ADR 0006's own stated principle is "every
table that currently has a global uniqueness constraint" — its table was
an enumeration of what existed *at the time*, not a closed allowlist that
excludes tables built later. Treating it as closed would mean this epic
ships two brand-new tables with the exact global-uniqueness shape ADR
0006 exists to prevent, on the technicality that they didn't exist yet
when ADR 0006 was numbered. That is obviously not the intent.

Applied:

| Table | Constraint |
|---|---|
| `Brand` | `@@unique([storeId, slug])`, `@@unique([storeId, name])` |
| `Tag` | `@@unique([storeId, slug])`, `@@unique([storeId, name])` |

Both gain an indexed `storeId String` FK to `Store`, resolved the same
way as every other Catalog table this epic introduces: via `StoreContext`
(see below), never passed by a caller.

## `StoreContext` resolution — a disclosed refinement, not a deviation

ADR 0006 states `storeId` is "resolved today from a single environment
variable (`DEFAULT_STORE_ID`) — trivially, always the one seeded row."
Taken completely literally, this requires copying a freshly-`cuid()`-generated
`Store.id` into `.env` by hand after every fresh seed — workable, but an
easy footgun in a new environment (forget the copy step and every write
throws a foreign-key error instead of a clear message).

Epic 3A's `StoreContext.getCurrentStoreId()` resolves in this order:

1. If `DEFAULT_STORE_ID` is set (via `@nestjs/config`), use it directly —
   this is ADR 0006's literal mechanism, and remains the *only* mechanism
   the moment a second `Store` row could ever exist, so nothing about
   this order is throwaway.
2. Otherwise, load the single existing `Store` row
   (`prisma.store.findFirstOrThrow()`) and cache the result for the
   process lifetime.

This is strictly a same-cost, friendlier default for the single-store
case ADR 0006 itself describes ("trivially, always the one seeded row")
— it changes nothing about the schema, the scoping mechanism, or what
happens once real multi-store resolution (a `Store.domain` lookup against
the request `Host` header, per
[04-SAAS-EXTENSION-POINTS.md](../04-SAAS-EXTENSION-POINTS.md#stores))
replaces both branches with real per-request logic. `DEFAULT_STORE_ID`
remains documented in `.env.example` as the explicit override.

## Consequences

- `Brand.name`/`Brand.slug` and `Tag.name`/`Tag.slug` are safe to widen to
  per-store scoping the moment more than one `Store` row exists — exactly
  the same zero-migration-under-load property ADR 0006 secured for the
  tables it named directly.
- `StoreContext` has exactly one non-trivial code path
  (`findFirstOrThrow` when `DEFAULT_STORE_ID` is unset) beyond what ADR
  0006 already specified — small, isolated to one infrastructure-layer
  class, and does not touch any repository, domain, or migration code.
- Any future table introduced with a naturally store-scoped uniqueness
  constraint should be assumed to need this treatment by default — the
  question going forward is "why would this table be global," not "why
  would this table be store-scoped."

## Alternatives Considered

- **Leave `Brand`/`Tag` globally unique, treating ADR 0006's table as
  exhaustive.** Rejected — reintroduces the exact defect ADR 0006 exists
  to prevent, for no reason other than these two tables not having existed
  yet when that ADR was written.
- **Require `DEFAULT_STORE_ID` to always be set, fail startup otherwise.**
  Rejected as a worse developer experience for zero additional safety —
  the single-row fallback is bounded (throws clearly via
  `findFirstOrThrow` if literally no `Store` row has been seeded yet,
  rather than silently defaulting to a wrong tenant) and costs nothing
  once `DEFAULT_STORE_ID` is set, which remains the recommended
  production configuration.
