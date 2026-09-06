# Epic 3A — Commerce Core — Completion Report

**Scope**: Product Domain, Category Domain, Collection Domain, Brand
Domain, Tag Domain, SEO Metadata, Slug Service, Product Visibility,
Product Status.

**Explicitly excluded** (per the epic brief, unchanged): Images,
Variants, Colors, Sizes, Inventory, Reviews, Search Engine, Product
Media. None of these appear anywhere in this epic's schema or code — see
[EPIC-03A-ARCHITECTURE-COMPLIANCE.md](EPIC-03A-ARCHITECTURE-COMPLIANCE.md)
for the most consequential downstream effect of that exclusion (the
Product publish-readiness gate).

## 1. Files created

97 files under `apps/api/src/modules/catalog/`, plus the platform pieces
below. Full listing in git; summarized by layer:

### Domain layer (`domain/`)

- **Entities**: `Product`, `Category`, `Brand`, `Tag`, `Collection` —
  private-constructor + `reconstitute()`, same shape as Epic 2's
  `AdminUser`/`Role`/`Permission`.
- **Value Objects**: `Slug` (generation via `@za/shared`'s `slugify()`,
  strict validation of explicit input), `Money` (integer-minor-units
  internally, currency-aware comparisons), `SeoMetadata` (shared across
  Product/Category/Collection).
- **Domain services**: `CategoryHierarchyPolicy` (depth/cycle validation
  over an injected ancestor-chain loader — see
  [Architecture Compliance §3](EPIC-03A-ARCHITECTURE-COMPLIANCE.md)),
  `ProductPublishReadinessService` (the Active-status gate — see the
  disclosed gap in that same document).
- **Errors**: 17 domain errors in `domain/errors/catalog.errors.ts`,
  each with a stable `code`, extending the shared `DomainError` base from
  Epic 2.
- **Repositories**: 5 ports (`ProductRepository`, `CategoryRepository`,
  `CollectionRepository`, `BrandRepository`, `TagRepository`), every
  method store-scoped per [ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md)
  and [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md).

### Application layer (`application/`)

- **DTOs**: 18 files — create/update DTOs per entity, plus
  `ChangeProductStatusDto`, `SetProductTagsDto`,
  `SetCollectionProductsDto`, and 5 response DTOs.
- **Use-cases**: 26 across the five entities —
  - **Product** (6): Create, Update, ChangeStatus, SetTags, Get, List.
  - **Category** (6): Create, Update, SetActive, Delete, GetTree,
    ListAll.
  - **Collection** (6): Create, Update, SetActive, Delete,
    SetCollectionProducts (replaces membership + order in one call),
    ListCollectionProducts (storefront-facing, excludes archived).
  - **Brand** (4) / **Tag** (4): Create, Update, Delete, List.

### Infrastructure layer (`infrastructure/`)

- **Mappers**: one per entity, Prisma record → domain entity.
- **Prisma repositories**: one per port, each store-scoped
  (`findFirst({ id, storeId })` for id lookups, compound-unique
  `storeId_slug` / `storeId_sku` for slug/SKU lookups).
- `catalog.module.ts` — wires all 5 repositories + 26 use-cases by DI
  token. **Zero controllers**, same reasoning as Epic 2's
  `IdentityModule`: Login/JWT are still out of scope, so an
  unauthenticated write surface for the catalog would be a defect, not a
  convenience.

### Platform additions (new in this epic, shared beyond Catalog)

- **`Store` model + `StoreStatus` enum** (`prisma/schema.prisma`) — per
  [ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md), seeded with
  exactly one row.
- **`StoreContext`** (`src/infrastructure/store/`) — resolves the
  current `storeId` (and `defaultCurrency`) for every Catalog repository
  call. See
  [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md)
  for its resolution order and why it's a disclosed refinement of ADR
  0006's literal mechanism, not a deviation.
- `DEFAULT_STORE_ID` — new optional env var (`env.validation.ts`,
  `configuration.ts`, `.env.example`).

### Foundation/Identity touches — every one disclosed

Per the brief ("do not modify previous Epics except for bug fixes"),
exactly one functional touch and one bug fix were made outside this
epic's own new files:

1. **`src/app.module.ts`** — registered `StoreModule` and
   `CatalogModule` in the root `imports` array. Same minimal pattern as
   Epic 2's `PrismaModule`/`IdentityModule` registration.
2. **`turbo.json` / `.github/workflows/ci.yml` were NOT touched this
   epic** — Epic 2 already added the `test` task and CI job; this epic
   only added new test files that flow through the existing task.

No other line in `apps/api/src/modules/identity/` or any Epic 1
Foundation file was changed. See
[EPIC-03A-LESSONS-LEARNED.md](EPIC-03A-LESSONS-LEARNED.md) for one
pre-existing gap discovered in Epic 2 (not modified — reported, per the
brief's own instruction to report rather than change frozen epics).

## 2. Architecture Compliance

See [EPIC-03A-ARCHITECTURE-COMPLIANCE.md](EPIC-03A-ARCHITECTURE-COMPLIANCE.md).
Headline: every required component was built; the two significant
architectural decisions (Store scoping extended to Brand/Tag; the
Product Active-status readiness gate's disclosed scope gap) are each
documented — the first as [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md),
the second inline in `ProductPublishReadinessService`'s doc comment and
expanded in that report.

## 3. Test Summary

See [EPIC-03A-TEST-SUMMARY.md](EPIC-03A-TEST-SUMMARY.md). Headline: 99
new unit tests + 32 new integration tests (146 unit / 48 integration
total across the whole `apps/api` test suite, including Epic 2's), all
passing, run clean from an uncached state.

## 4. Database Migration Summary

See [EPIC-03A-DATABASE-MIGRATION-SUMMARY.md](EPIC-03A-DATABASE-MIGRATION-SUMMARY.md).
Headline: one migration (`20260801210526_init_commerce_core`), applied
successfully; the seed script now also populates one `Store` row and an
illustrative sample catalog (5 categories in a 3-level tree, 2 brands, 3
tags, 3 products).

## 5. Lessons Learned

See [EPIC-03A-LESSONS-LEARNED.md](EPIC-03A-LESSONS-LEARNED.md).

## 6. Commands

```bash
# from the repo root, with Docker Postgres running
pnpm --filter @za/api db:migrate:dev   # apply migrations
pnpm --filter @za/api db:seed          # seed roles/permissions/admin + store/catalog
pnpm --filter @za/api test             # unit tests (no DB required)
pnpm --filter @za/api test:integration # repository integration tests (real Postgres required)

# whole monorepo
pnpm turbo run build lint type-check test
```

## 7. Requires Manual Configuration / Attention

- `DEFAULT_STORE_ID` is optional — unset is fine for local development
  (StoreContext falls back to the single seeded `Store` row). Set it
  explicitly in any environment where more precise pinning matters.
- No HTTP surface exists yet for anything built in this epic, same as
  Identity — the epic that adds Login/JWT is the natural place to add
  the first `catalog` controllers for both bounded contexts at once.
- The Product Active-status gate does not yet enforce "≥1 variant, ≥1
  image with alt text" — flagged prominently in
  [EPIC-03A-ARCHITECTURE-COMPLIANCE.md](EPIC-03A-ARCHITECTURE-COMPLIANCE.md)
  and in `ProductPublishReadinessService`'s own doc comment, so the
  Variants/Media epic cannot miss it.
