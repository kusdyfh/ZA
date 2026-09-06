# ADR 0021: Public Catalog Read API — Additive Reads, No Schema Change

**Status**: Accepted
**Resolves**: [ADR 0020](0020-storefront-release-paused-catalog-read-gap.md)'s recommended
backend follow-up — this epic exists specifically to unblock Epic 10 (Storefront
Release).
**Raised during**: Epic 9.5 (Public Catalog API) implementation, per the governance rule
in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

ADR 0020 found that the Catalog module's general product reads (`ProductsController`
list/get/detail) are admin-only by design, and that no public endpoint exists for
product search, filtering, products-by-category, products-by-collection (discoverable
by id), single-product-by-slug, or product variants. This epic closes that gap with the
narrowest possible additive change: no schema migration, no modification to any existing
guarded route's behavior, and — per this epic's explicit rule — reuse of existing
Catalog use-cases wherever one already does the needed work.

## Decision

### 1. Every new route lives on `StorefrontCatalogController`, not the admin controllers

The existing `StorefrontCatalogController` (`@Public() @Controller('catalog/storefront')`)
already exists for exactly this purpose — its docblock says so verbatim: *"Curated,
ACTIVE-only storefront product lists... Fully public: no admin identity is ever required
to browse the store."* Six new routes were added to this same class; zero lines changed
in `products.controller.ts`, `collections.controller.ts`, `product-variants.controller.ts`,
or any other admin-facing controller file. This satisfies "keep admin endpoints
unchanged" at the file level, not just the behavioral level — the diff to every admin
controller is empty.

### 2. New routes

All under `catalog/storefront`, all `@Public()` (inherited from the class):

- `GET /products` — paginated, searchable, sortable, filterable product list. Query DTO
  (`PublicListProductsQueryDto`) deliberately has **no `status` field at all** — not
  merely defaulted, structurally absent, so no client input can ever request non-ACTIVE
  products. The handler calls the existing `ListProductsUseCase.execute({ ...filters,
  status: PRODUCT_STATUS.ACTIVE })`, hardcoding the one field the DTO can't carry. Zero
  new use-case — `ListProductsUseCase` already accepted an arbitrary filter object; this
  is the intended reuse.
- `GET /products/:slug` — single product by slug (ACTIVE-only). New
  `GetPublicProductBySlugUseCase`: calls the *already-existing*
  `ProductRepository.findBySlug()` (built for slug-uniqueness checks during admin
  create/update, never previously exposed as a read path) and rejects with the existing
  `ProductNotFoundError` if the result is missing or not `ACTIVE`. This is the epic's one
  truly new piece of logic — and it is exactly the minimum the epic's own rule demands
  ("Expose ACTIVE products only"), not an invented business rule.
- `GET /products/:slug/detail` — full PDP payload: product + variants + media +
  specifications + related + cross-sell + up-sell, one response. New
  `GetPublicProductDetailUseCase` composes, in order: `GetPublicProductBySlugUseCase`
  (resolves + gates), then delegates entirely to the existing `GetProductDetailUseCase`
  (product/variants/media/specifications — its own docblock already calls itself *"a
  thin composition... no new business logic of its own"*, and this ADR extends that same
  claim), then calls the existing `ListProductRelationsUseCase` three times in parallel
  (`RELATED`/`CROSS_SELL`/`UP_SELL` — already used by the already-public
  `GET /catalog/products/:productId/relations`). Every piece of data in this response
  comes from a use-case that existed before this epic; the only new code is the slug
  resolution and the sequencing.
- `GET /products/:productId/variants` — standalone variant read (also embedded in
  `/detail`, provided separately for a client that already holds a `productId` from a
  list/search result and wants just the variant matrix). New
  `ListPublicProductVariantsUseCase`: fetches the product via `ProductRepository.findById`,
  gates on `ACTIVE`, then delegates fully to the existing `ListProductVariantsUseCase`.
- `GET /collections` — the actual missing piece behind `PROJECT_STATUS.md` gap #14 (no
  `list-all` ever existed, admin or public). New `ListPublicCollectionsUseCase`: calls
  the existing `CollectionRepository.list(storeId)` (already existed, just never had a
  use-case or route in front of it) and filters to `collection.isCurrentlyLive()` — the
  entity's own pre-existing method, not a new rule.
- `GET /collections/:id/products` — a **second**, ACTIVE-only route alongside the
  pre-existing `GET /catalog/collections/:id/products` (unchanged, see §3). New
  `ListPublicCollectionProductsUseCase` delegates entirely to the existing
  `ListCollectionProductsUseCase`, then applies one additional filter:
  `product.status === PRODUCT_STATUS.ACTIVE`.

### 3. A disclosed, deliberate discrepancy: two collection-products endpoints, briefly

`ListCollectionProductsUseCase` (used by the pre-existing `GET /catalog/collections/:id
/products`, which has been public since Epic 3A/6) only excludes `ARCHIVED` products —
it does not exclude `DRAFT`. This was flagged during ADR 0020's investigation as a real,
if narrow, leak relative to this epic's "ACTIVE only" rule. **This epic does not modify
that existing use-case or route** — "keep admin endpoints unchanged" is read literally:
that route has been live and public since before this epic, and changing its filtering
behavior out from under any existing caller is exactly the kind of behavior change this
epic's constraints rule out. Instead, the new `GET /catalog/storefront/collections/:id
/products` route is the *correct*, ACTIVE-only path forward — Epic 10's storefront
should call the new route, not the old one. The old route is left exactly as it was,
disclosed here and in `PROJECT_STATUS.md` rather than silently diverging.

### 4. Filtering: `ProductListFilters` gains four optional fields, additively

`ProductListFilters` (the shared filter shape `ListProductsUseCase` and
`PrismaProductRepository.list()` both already used) gains `priceMin?: number`,
`priceMax?: number`, `colorId?: string`, `sizeId?: string`. `PrismaProductRepository
.list()`'s `where` builder gains four corresponding branches: `price: { gte, lte }` for
the range, and `variants: { some: { colorId, sizeId } }` (Prisma relation filter — "has
at least one variant matching the given color and/or size") for the two attribute
filters. All four are optional and additive: the admin `ListProductsQueryDto` (used by
the guarded `GET /catalog/products`) is untouched and never sends these fields, so its
behavior is bit-for-bit identical to before. This is the one change that touches code
shared with an admin-reachable path — deliberately, since duplicating `ProductListFilters`
and `list()` into a parallel "public" copy would be the literal business-logic
duplication this epic's rules forbid. Extending the one shared shape, backward-compatibly,
is the correct reading of "reuse existing... do not duplicate."

### 5. Three scope items needed zero new code — already fully satisfied

- **Public category listing**: `GET /catalog/categories` and `GET /catalog/categories
  /tree` have been `@Public()` since Epic 6. Confirmed, unchanged, no action needed.
- **Related products / Cross-sell / Up-sell** as their own callable endpoint:
  `GET /catalog/products/:productId/relations?type=` has been `@Public()` since Epic 3B.
  Also embedded in the new `/detail` response for convenience (§2), but the standalone
  route needed no changes either.
- **Public products by category**: satisfied by `GET /catalog/storefront/products
  ?categoryId=...` (§2) — a query parameter on the one new list endpoint, not a separate
  route, matching how the admin equivalent already works (`categoryId` is a filter, not
  a path segment).

## Consequences

- No Prisma migration. No schema change of any kind — every field this epic exposes
  already existed (`Product.slug`, `.price`, `ProductVariant.colorId/sizeId`,
  `Collection.isActive/startsAt/endsAt`).
- No existing route's request or response shape changed. `git diff` against every
  admin-facing controller file in `catalog/http/` is empty.
- `StorefrontCatalogController` grows from 3 routes to 9; `catalog.module.ts` gains 5 new
  use-cases in `USE_CASE_PROVIDERS` (no new repository providers — every new use-case
  injects an already-registered repository or already-registered use-case).
- `PROJECT_STATUS.md` gap #15 (no public catalog-browsing surface) is closed. Epic 10
  (Storefront Release) may resume against this new surface.
- The `GET /catalog/collections/:id/products` (old, `DRAFT`-leaking) vs.
  `GET /catalog/storefront/collections/:id/products` (new, correctly `ACTIVE`-only)
  discrepancy (§3) is a real, disclosed loose end — a future epic could retire the old
  route or fix its filter once nothing depends on its current (slightly looser)
  behavior, but that is out of scope here.
- Public filtering is intentionally not exhaustive: no full-text search (still an
  in-memory substring match over `name`/`sku`, same as every other list endpoint in this
  codebase — a real search engine remains explicitly out of scope per
  `PROJECT_STATUS.md`'s Open Items), and no tag-based filter was added (not named in this
  epic's scope; `categoryId`/`brandId`/`colorId`/`sizeId`/`priceMin`/`priceMax`/
  `isFeatured`/`isBestSeller`/`isNewArrival` cover what was asked for).

## Alternatives Considered

- **Add `@Public()` directly to new methods on the existing admin controllers** (there is
  precedent: `ProductRelationsController` and `CollectionsController` already mix public
  and guarded routes in one class). Considered, not chosen — routing every new public
  read through the one controller already named and documented for this exact purpose
  keeps "everything under `catalog/storefront` is unconditionally public" as a simple,
  auditable invariant, and guarantees zero diff to any admin controller file, which is a
  stronger reading of "keep admin endpoints unchanged" than "don't change their
  behavior."
- **Modify `ListCollectionProductsUseCase` in place to also exclude `DRAFT`.** Rejected
  — would change the behavior of the pre-existing, already-public
  `GET /catalog/collections/:id/products` route, which "keep admin endpoints unchanged"
  was read to forbid touching at all. A new, correctly-filtered route was added instead
  (§3).
- **Duplicate `ProductListFilters`/`list()` into a parallel "public" repository method.**
  Rejected — this is the literal duplication the epic's rules name explicitly; extending
  the one shared shape is strictly less code and cannot regress the admin path since the
  new fields are optional and additive.
- **Build a real search index / full-text search.** Out of scope — not requested, and a
  standing, explicitly-deferred item in `PROJECT_STATUS.md`'s Open Items since the
  project's earliest Commerce Core epics.
