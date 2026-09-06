# ADR 0013: Store-Scoping Extended to Variant Attributes

**Status**: Accepted
**Extends**: [ADR 0006](0006-saas-ready-schema-pattern.md) (which already
named `ProductVariant`: `sku @unique`, `barcode @unique` →
`(storeId, sku)`, `(storeId, barcode)` in its original decision table)
and [ADR 0012](0012-store-scoping-extended-to-catalog-taxonomy.md)
(which established the precedent of extending ADR 0006's pattern to
tables built in a later epic).
**Raised during**: Epic 3B (Product Experience & Merchandising)
implementation, per the governance rule in
[ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Epic 3B introduces `Color`, `Size`, and `ProductVariant`. `ProductVariant`
was already in ADR 0006's original table — its store-scoping was decided
before this epic existed. `Color` and `Size` were not — same situation
ADR 0012 already resolved for `Brand`/`Tag`.

## Decision

Apply the established pattern without re-litigating it:

| Table | Constraint |
|---|---|
| `ProductVariant` | `(storeId, sku)`, `(storeId, barcode)` — per ADR 0006, applied now that the table exists |
| `Color` | `(storeId, name)` |
| `Size` | `(storeId, label)` |

`Color`/`Size` follow ADR 0012's reasoning exactly: they have their own
independently-meaningful unique business key (a color name, a size
label), so they get `storeId` directly and their own composite unique
constraint — the same test ADR 0012 applied to `Brand`/`Tag`.

**`ProductMedia`, `ProductSpecification`, and `ProductRelation` do NOT
get their own `storeId` column.** Unlike `Color`/`Size`/`ProductVariant`,
none of these three has an independent business-unique key of its own —
each is always accessed through an already store-validated `productId`
(exactly the precedent `CollectionProduct` and `ProductTag` set in Epic
3A: pure child/join tables scoped transitively through their parent's
FK, not directly). Giving them a redundant `storeId` column would be
denormalization with no constraint it actually enforces.

## Consequences

- `Color`/`Size` are safe to widen to true multi-tenant scoping the
  moment more than one `Store` row exists, with zero further schema
  change — same guarantee every other store-scoped table in this
  project already has.
- The rule for "does this new table need its own `storeId`" is now
  answered consistently across three epics: **yes, if the table has an
  independent unique business key; no, if it's a pure child/join table
  reachable only through an already-scoped parent ID.** This is now the
  standing test for every future Catalog table, not just this epic's.

## Alternatives Considered

- **Give every new table a `storeId` column unconditionally**, including
  `ProductMedia`/`ProductSpecification`/`ProductRelation`. Rejected —
  this was seriously considered for consistency's sake, but it would
  contradict the precedent `CollectionProduct`/`ProductTag` already set
  in Epic 3A without a real reason (no query in this codebase needs
  "list all product media across the store" without going through a
  product first, and if one ever does, it's one join away).
