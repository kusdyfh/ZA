# Epic 3A — Architecture Compliance Report

## 1. Required components — status

| Required | Status | Where |
|---|---|---|
| Product Domain | Done | `domain/entities/product.entity.ts` |
| Category Domain | Done | `domain/entities/category.entity.ts` |
| Collection Domain | Done | `domain/entities/collection.entity.ts` |
| Brand Domain | Done | `domain/entities/brand.entity.ts` |
| Tag Domain | Done | `domain/entities/tag.entity.ts` |
| SEO Metadata | Done | `domain/value-objects/seo-metadata.vo.ts`, shared across Product/Category/Collection |
| Slug Service | Done | `domain/value-objects/slug.vo.ts` (docs/06-DDD-BOUNDED-CONTEXTS.md calls the equivalent concept "SlugGenerator" — same thing, named to match this epic's brief) |
| Product Visibility | Done, narrowed scope | `Product.isVisibleInCatalog()` — see §2 |
| Product Status | Done, narrowed scope | `PRODUCT_STATUS` + `ChangeProductStatusUseCase` — see §2 |
| Prisma Models | Done | `Store`, `Category`, `Brand`, `Collection`, `CollectionProduct`, `Tag`, `ProductTag`, `Product` |
| Migrations | Done | `20260801210526_init_commerce_core`, applied — see [EPIC-03A-DATABASE-MIGRATION-SUMMARY.md](EPIC-03A-DATABASE-MIGRATION-SUMMARY.md) |
| Repositories | Done | 5 ports + 5 Prisma adapters |
| Use Cases | Done | 26, see [EPIC-03A-COMPLETION-REPORT.md](EPIC-03A-COMPLETION-REPORT.md) |
| DTOs | Done | 18 |
| Validation | Done | class-validator on DTOs + domain-level VOs/entity invariants (same defense-in-depth pattern as Epic 2) |
| Unit Tests | Done | 99 new tests, 20 new suites |
| Integration Tests | Done | 32 new tests, 5 new suites, against real Postgres |
| Seed Data | Done | `Store` row + sample categories/brands/tags/products |

## 2. Product Visibility / Product Status — the narrowed scope, in full

This is the single most important compliance note in this epic.
`docs/product/03-PRODUCTS.md` specifies a Draft → Active → Archived
lifecycle gated by a publish checklist:

> A product cannot be made Active (purchasable) with zero variants...
> At least one image is required before a product can be Active... every
> image requires descriptive alt text.

**Variants and Media are both explicitly excluded from this epic.**
There is no `ProductVariant` model, no `ProductMedia` model, nothing to
check. Three options existed:

1. Silently skip the checklist (implement Active as an unconditional
   transition) with no trace of the gap.
2. Refuse to allow ACTIVE status at all until a future epic adds
   Variants/Media.
3. Build the gate now, wired to check everything that *can* be checked
   today, and document loudly that it's incomplete.

**Option 3 was chosen.** `ProductPublishReadinessService.assertReadyForActive()`
checks name/SKU/category presence — everything else the full checklist
requires literally cannot be expressed without Variants/Media existing.
Its doc comment states this explicitly, and `ChangeProductStatusUseCase`
calls it before every transition to ACTIVE (and only that transition —
every other status change is unconditional). This means, as of this
epic, **a Product can be made Active without a real check against the
full business rule** — that gap is real, not just a documentation
nicety, and the next epic that introduces `ProductVariant`/`ProductMedia`
**must** extend `ProductPublishReadinessService` with the variant-count
and image/alt-text checks before this platform can be considered
spec-compliant for a real storefront launch.

Similarly, "Product Visibility" per the full spec includes an Active
product with all-zero-stock variants still displaying as "Sold Out"
rather than disappearing — that needs Inventory, also excluded.
`Product.isVisibleInCatalog()` is therefore reduced to `status ===
'ACTIVE'` for this epoch, documented inline as the narrowed rule it is.

## 3. `CategoryHierarchyPolicy` — a domain service that accepts an injected loader

`docs/product/04-CATEGORIES.md` requires both a 3-level depth limit and
no-cycles validation. Both checks need the proposed parent's full
ancestor chain, which only a repository can load — but repository access
doesn't belong in the domain layer. `CategoryHierarchyPolicy.loadAncestorChain()`
resolves this by accepting a `findById`-shaped function as a parameter at
call time (supplied by the use-case, backed by the real repository)
rather than importing a concrete repository or interface. This keeps the
policy pure and unit-testable with a plain in-memory map (see
`category-hierarchy.policy.spec.ts`) while still being usable against
the real database in `CreateCategoryUseCase`/`UpdateCategoryUseCase`.
This is a judgment call disclosed here rather than a new ADR — it's an
implementation pattern (dependency-injection-at-call-time for a domain
service), not a schema or cross-epic architectural decision.

## 4. Store scoping — ADR 0012

`Category`, `Brand`, `Collection`, `Tag`, and `Product` are all
`storeId`-scoped per [ADR 0006](../v2/adr/0006-saas-ready-schema-pattern.md).
`Brand` and `Tag` weren't named in ADR 0006's original table (they didn't
exist yet when it was written) — [ADR 0012](../v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md)
formalizes extending the same pattern to them, plus discloses a small,
same-cost refinement to `StoreContext`'s resolution order (fall back to
the single seeded `Store` row when `DEFAULT_STORE_ID` is unset, rather
than requiring it to always be set).

## 5. Disclosed simplifications specific to this epic

- **`@db.Decimal(12, 2)` instead of v1's sketched `@db.Money`.**
  Postgres' native `money` type is locale/formatting-dependent and not
  suited to application-level currency arithmetic; `Decimal` is the
  standard, precise choice and is what the `Money` value object is built
  against (integer minor units internally, currency-aware comparisons).
  This is a correction to the v1 sketch, not a v2 architectural reversal
  — no ADR was written for it, the same way Epic 2's Argon2-over-bcrypt
  choice didn't need one (it's an implementation-quality fix, not a
  business-rule or schema-shape decision).
- **No `Brand.logoUrl` / `Collection.bannerUrl`.** Both existed in v1's
  schema sketch but are Media concerns, excluded from this epic. Adding
  them is a one-line schema change plus a migration whenever the Media
  epic lands.
- **No `AdminUser`-style actor attribution on Catalog entities.** Epic
  2's "Audit Actor" was an explicit scope bullet for Identity; it wasn't
  named in this epic's brief. `Product`/`Category`/etc. have no
  `createdBy`/`updatedBy` fields. Flagged in
  [EPIC-03A-LESSONS-LEARNED.md](EPIC-03A-LESSONS-LEARNED.md) as worth
  adding once Login/JWT provide a real "current actor" to stamp with.
- **17 seeded permissions from Epic 2 already include `products.view` /
  `products.manage`** — no new permissions were added for Catalog in
  this epic since RBAC coverage for the whole module was anticipated and
  seeded in Epic 2's matrix already. Confirmed by inspection of
  `permissions.constants.ts` — no change was needed or made.

## 6. Nothing else was redesigned

Layering (domain / application / infrastructure), the Actor pattern
(unused here, by design — see §5), and the DTO/use-case/repository
conventions all follow Epic 2's established shape exactly. No P0/P1
decision from Architecture v2 was revisited; the only new ADR (0012) is
an extension of an already-accepted decision to two additional tables,
not a reversal of anything.
