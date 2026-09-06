# Epic 3A — Database Migration Summary

## Migration

**`20260801210526_init_commerce_core`** — the only migration this epic
produces. Generated via `prisma migrate dev --name init_commerce_core`
and applied against the project's Docker Postgres instance
(`localhost:5433` in this environment). Prisma reported `Your database
is now in sync with your schema` and regenerated the client
successfully.

Full SQL:
[`migrations/20260801210526_init_commerce_core/migration.sql`](../../apps/api/prisma/migrations/20260801210526_init_commerce_core/migration.sql)
(224 lines).

### What it creates

- **`StoreStatus` enum** (`ACTIVE`, `SUSPENDED`) and **`stores`** —
  `name`, `domain` (unique), `defaultLocale`, `defaultCurrency`,
  `status`. Per [ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md).
- **`ProductStatus` enum** (`DRAFT`, `ACTIVE`, `ARCHIVED`).
- **`categories`** — self-referential (`parentId` → `categories.id`,
  `ON DELETE SET NULL`, Prisma's default for a nullable self-relation;
  the actual "don't delete a non-empty category" guard is enforced at
  the application layer in `DeleteCategoryUseCase`, checked *before*
  this FK would ever matter). `(storeId, slug)` unique, indexed on
  `storeId` and `parentId`.
- **`brands`** — `(storeId, slug)` and `(storeId, name)` unique, per
  [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md).
- **`collections`** and **`collection_products`** (composite PK
  `(collectionId, productId)`, both FKs `ON DELETE CASCADE`).
- **`tags`** and **`product_tags`** (composite PK `(productId, tagId)`,
  both FKs `ON DELETE CASCADE`) — `(storeId, slug)` / `(storeId, name)`
  unique on `tags`, same reasoning as `brands`.
- **`products`** — `price`/`discountPrice` as `DECIMAL(12, 2)` (not v1's
  sketched `@db.Money` — see
  [EPIC-03A-ARCHITECTURE-COMPLIANCE.md §5](EPIC-03A-ARCHITECTURE-COMPLIANCE.md#5-disclosed-simplifications-specific-to-this-epic)),
  `currencyCode` defaulting `"IQD"`, `categoryId` FK `ON DELETE
  RESTRICT` (a category in use can't be deleted out from under its
  products — a real DB-level backstop behind the application-level
  `DeleteCategoryUseCase` guard), `brandId` FK `ON DELETE SET NULL`
  (deleting a brand un-brands its products rather than blocking or
  cascading). `(storeId, slug)` and `(storeId, sku)` unique; indexed on
  `storeId`, `categoryId`, `brandId`, `status`, `isFeatured`,
  `isBestSeller`, `isNewArrival`.

### Why store-scoped uniqueness, not global

See [ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md) (the
original decision, already frozen before this epic) and
[ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md)
(extending it to `Brand`/`Tag`, the two tables ADR 0006 didn't name
because they didn't exist yet).

## Seed

`prisma/seed.ts` was extended (not replaced) with two new functions,
called after Epic 2's identity seeding in `main()`:

- **`seedStore()`** — upserts the one `Store` row, keyed by `domain`
  (`za-store.local`) so re-seeding is idempotent without needing to know
  a previously-generated `id` ahead of time.
- **`seedCatalog(storeId)`** — illustrative local-dev data, **not real
  merchandise**:
  - 5 categories forming the 3-level tree the depth limit allows:
    `Scrubs` → `Tops` → `Short Sleeve`, `Scrubs` → `Bottoms`, and a
    separate root `Lab Coats`.
  - 2 brands (`ZA Originals`, `ComfortFit`), 3 tags (`New`, `Bestseller`,
    `Limited Edition`).
  - 3 products: two `ACTIVE` (one with a discount price, one marked Best
    Seller) and one `DRAFT` — chosen specifically so a fresh seed
    exercises every status this epic's `ChangeProductStatusUseCase`
    supports, and so `Product.isVisibleInCatalog()` has both a `true`
    and a `false` case to show against real data immediately.

### Verification performed

Ran the seed against the real Docker Postgres instance and confirmed via
`psql`:

```
   name   |     domain
----------+----------------
 ZA Store | za-store.local
(1 row)

     name     |         parentId
--------------+---------------------------
 Scrubs       |
 Tops         | <scrubs-id>
 Short Sleeve | <tops-id>
 Lab Coats    |
 Bottoms      | <scrubs-id>
(5 rows)
```

- `stores`: 1 row. `categories`: 5 rows. `brands`: 2 rows. `tags`: 3
  rows. `products`: 3 rows (2 `ACTIVE`, 1 `DRAFT`, matching prices and
  the one discount price exactly as seeded). `product_tags`: 2 rows.

**Re-ran the seed a second time** and confirmed every count was
unchanged — every write is an `upsert` keyed on a natural unique field
(`domain` for `Store`; `(storeId, slug)` for everything else), so
re-seeding is a genuine no-op rather than a duplicate-row error or silent
drift.

**Re-verified after the full integration test run** (which creates and
tears down its own `Store` rows and fixtures) that these same counts
were unchanged — the integration suites do not leak rows into the
seeded catalog.

## Manual steps required in a new environment

Unchanged from Epic 2 — no new manual step was introduced:

1. `docker compose -f infrastructure/docker/docker-compose.yml up -d`.
2. Copy `.env.example` to `.env`. `DEFAULT_STORE_ID` is optional (see
   [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md));
   everything else is as before.
3. `pnpm --filter @za/api db:migrate:deploy` (or `db:migrate:dev`
   locally).
4. `pnpm --filter @za/api db:seed`.

No manual SQL, no manual data entry.
