# ADR 0014: Warehouse Store-Scoping and the Single-Warehouse Model

**Status**: Accepted
**Extends**: [ADR 0006](0006-saas-ready-schema-pattern.md) (store-scoping
pattern) and [ADR 0001](0001-inventory-reservation-strategy.md)
(reservation lifecycle, which this ADR wires to a concrete warehouse
dimension).
**Raised during**: Epic 4 (Inventory & Stock Management) implementation,
per the governance rule in
[ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Epic 4's brief lists "Warehouse (single warehouse now, extensible
later)" as its own scope item — the same shape of problem
[ADR 0006](0006-saas-ready-schema-pattern.md) already solved for
multi-tenancy: build the future-proof column/relationship now, while
exactly one row exists, so widening later never requires a live
schema migration under real stock data.

A second, related question: does `Warehouse` need `storeId` scoping the
same way `Color`/`Size`/`ProductVariant` do (per
[ADR 0012](0012-store-scoping-extended-to-catalog-taxonomy.md) /
[ADR 0013](0013-store-scoping-extended-to-variant-attributes.md))?

## Decision

### 1. `Warehouse` is store-scoped, per the established test

`Warehouse.code` is an independent, human-meaningful business key (a
short identifier like `"MAIN"`) — exactly the test ADR 0012/0013 already
established for when a table needs its own `storeId` column and
composite unique constraint:

```prisma
model Warehouse {
  id        String  @id @default(cuid())
  storeId   String
  name      String
  code      String
  isDefault Boolean @default(true)
  // ...
  @@unique([storeId, code])
}
```

### 2. Stock lives in a `VariantStock` join table, not a scalar on `ProductVariant`

The naive approach — add `stock Int` directly to `ProductVariant`
(Epic 3B deliberately left this field out for exactly this reason) —
would need a breaking schema change the moment a second warehouse is
introduced (turning one scalar into "stock, but *where*"). Instead,
stock is modeled from day one as its own table keyed by
**both** dimensions it will always vary by:

```prisma
model VariantStock {
  id                String  @id @default(cuid())
  variantId         String
  warehouseId       String
  quantity          Int     @default(0)
  lowStockThreshold Int?
  // ...
  @@unique([variantId, warehouseId])
}
```

Today, exactly one `Warehouse` row exists (seeded, `isDefault: true`),
so every variant has at most one `VariantStock` row and "total stock"
and "stock at the (only) warehouse" are the same number. **Nothing about
this schema changes when a second warehouse is added** — new
`VariantStock` rows are inserted for the new `(variantId, warehouseId)`
pairs, `available()` (per ADR 0001) becomes a sum across warehouses
instead of a single row, and every existing `StockMovement`/
`StockReservation` row (both already carry `warehouseId`) remains
correctly attributed to the warehouse it actually happened at.

`VariantStock` itself has no independent business-unique key (its
uniqueness is the composite of two already-scoped foreign keys) — per
the same test ADR 0013 applied to `ProductMedia`/`ProductSpecification`,
it does **not** get its own `storeId` column.

### 3. `StockMovement` and `StockReservation` both carry `warehouseId`

Every movement and every reservation happens at a specific warehouse,
even when there's only one — this is not optional metadata deferred to
"later," because retrofitting it onto historical ledger rows once a
second warehouse exists would mean either guessing which warehouse old
rows belonged to, or leaving them ambiguously unattributed. Neither is
acceptable for an audit trail. Recording it now costs nothing (it's
always the one seeded warehouse) and makes every future multi-warehouse
report ("movements at Warehouse B last week") already expressible against
historical data.

## Consequences

- Adding a second warehouse later is purely additive: one new
  `Warehouse` row, new `VariantStock` rows for whichever variants stock
  it, `available()`'s query becomes a `GROUP BY` sum instead of a direct
  read — no migration, no backfill, no ambiguity in historical
  `StockMovement`/`StockReservation` rows.
- `InventoryPolicy`'s rules (negative-stock guard, overselling guard,
  low-stock check) are all expressed per `(variantId, warehouseId)`,
  never per-variant-only — this is already the correct shape for
  multiple warehouses, not a single-warehouse simplification that would
  need rewriting.
- Nothing in this epic implements warehouse *selection* logic (which
  warehouse fulfills a given order, transfer between warehouses,
  per-warehouse reservation routing) — with exactly one warehouse there
  is nothing to select between. That logic is deferred to whichever
  future epic actually introduces a second warehouse.

## Alternatives Considered

- **`stock Int` directly on `ProductVariant`, add a `Warehouse` dimension
  later if needed.** Rejected — this is precisely the "cheap now,
  expensive later" trap ADR 0006 already identified for store-scoping;
  the same reasoning applies here with no meaningful difference. Epic 3B
  already anticipated this and deliberately left the field out.
- **Skip `warehouseId` on `StockMovement`/`StockReservation` until a
  second warehouse actually exists.** Rejected — unlike a column that
  can be added and backfilled with a sensible default, a *ledger's*
  historical rows can't be retroactively and reliably attributed to the
  right warehouse after the fact once more than one exists. This is the
  one place in this ADR where "add it later" is actually more expensive
  than "add it now," not just conventionally so.
