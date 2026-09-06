# Epic 3A — Test Summary

## Headline

| Suite | Requires | New suites | New tests | `apps/api` total | Result |
|---|---|---|---|---|---|
| Unit | nothing (mocked repositories) | 20 | 99 | 29 suites / 146 tests | **All passing** |
| Integration | a real Postgres (`DATABASE_URL`) | 5 | 32 | 8 suites / 48 tests | **All passing** |

Both runs were executed clean immediately before this report: unit tests
via an uncached `pnpm turbo run build lint type-check test`, integration
tests via `pnpm test:integration` against the project's own Docker
Postgres. The database was re-verified via `psql` afterward and held
exactly the seeded data (1 store, 5 categories, 2 brands, 3 tags, 3
products, 0 collections) — the integration suites' uniquely-keyed
fixtures (their own `Store` rows, cleaned up in `afterAll`) left no
residue.

## Unit tests

### Domain layer

| File | What it covers |
|---|---|
| `value-objects/slug.vo.spec.ts` | `fromName` generation via `slugify()`; `fromRaw` strict validation (rejects spaces, double/trailing hyphens, empty); equality. |
| `value-objects/money.vo.spec.ts` | Zero/positive amounts accepted, negative/non-numeric rejected; **float-precision-safe comparisons** (`10.1` vs `10.2` compared correctly via integer minor units); currency-mismatch throws; equality requires matching currency. |
| `value-objects/seo-metadata.vo.spec.ts` | Trims text fields; normalizes empty/whitespace/missing to `null`; holds `ogImageUrl`. |
| `entities/category.entity.spec.ts` | `validateName`; rename/activate/deactivate/reparent/reorder mutations. |
| `entities/collection.entity.spec.ts` | `validateSchedule`/`schedule()` (rejects end ≤ start); **`isCurrentlyLive()` across every combination** of active flag × before/within/after the schedule window. |
| `entities/product.entity.spec.ts` | `validateName`/`validateSku`; **`validatePricing`/`updatePricing`** (discount must be strictly lower, re-validated on every update, rejecting in place without mutating on failure); `isVisibleInCatalog()` across all three statuses; `setMerchandisingFlags` only touches explicitly-provided flags. |
| `entities/brand.entity.spec.ts`, `entities/tag.entity.spec.ts` | `validateName`, rename. |
| `services/category-hierarchy.policy.spec.ts` | `loadAncestorChain` walks to the root and throws `CategoryNotFoundError` for a missing ancestor; `validateParentAssignment` allows a short chain, rejects at the depth limit, rejects a self-descendant cycle, and skips the cycle check on create (`categoryId === null`). |
| `services/product-publish-readiness.service.spec.ts` | Allows a fully-formed product; rejects a product missing its category — see [EPIC-03A-ARCHITECTURE-COMPLIANCE.md §2](EPIC-03A-ARCHITECTURE-COMPLIANCE.md#2-product-visibility--product-status--the-narrowed-scope-in-full) for what this gate does *not* yet check. |

### Application layer (mocked repositories)

Chosen to cover every use-case with real branching logic; trivial
list/get pass-throughs (e.g. `ListBrandsUseCase`, `GetProductUseCase`)
are exercised structurally via `get-category-tree.use-case.spec.ts`'s
pure-function test and otherwise skipped, same policy as Epic 2.

| File | What it covers |
|---|---|
| `create-category.use-case.spec.ts` | Root creation; slug-taken rejection; **nesting exactly 3 levels succeeds, a 4th level is rejected** via the real `CategoryHierarchyPolicy`. |
| `update-category.use-case.spec.ts` | Not-found; slug-uniqueness check is skipped when the slug is unchanged, enforced when changed; **rejects reparenting a category under its own child** (a real cycle, not a same-epic impossibility like on create). |
| `delete-category.use-case.spec.ts` | Not-found; blocked by existing children; blocked by existing products; succeeds when empty. |
| `get-category-tree.use-case.spec.ts` | The exported pure `buildCategoryTree()` — nests children under parents sorted by `sortOrder`, and correctly nests a full 3rd level. |
| `create-product.use-case.spec.ts` | Happy path including an existing brand; category/brand not-found; slug/SKU-taken; **discount-not-lower-than-price rejection**. |
| `change-product-status.use-case.spec.ts` | Not-found; Draft → Active succeeds when ready; **Active transition blocked when the readiness gate fails, and `save()` is never called**; Archived/Draft transitions bypass the gate entirely. |
| `create-collection.use-case.spec.ts` | Happy path; slug-taken; invalid date range. |
| `set-collection-products.use-case.spec.ts` | Not-found; **rejects an unknown product id**; **rejects an archived product** (`ArchivedProductNotAddableError`) with `replaceProducts` never called; deduplicates ids before replacing. |
| `list-collection-products.use-case.spec.ts` | **Excludes archived products from the live listing**; orders the remaining products by `sortOrder`. |
| `set-product-tags.use-case.spec.ts` | Not-found; rejects an unknown tag id; deduplicates and replaces the full tag set. |

## Integration tests

Each suite creates its own `Store` row (unique `domain` via
`randomUUID()`) plus whatever fixtures it needs, and tears everything
down in `afterAll` in FK-safe order (join rows → leaf rows → `Store`).
None reads or depends on the seeded catalog data.

| File | What it covers |
|---|---|
| `prisma-category.repository.integration.spec.ts` | Root + child creation; find by id/slug; **a category id from a different store resolves to `null`** (store-isolation, verified against a real second `Store` row); list ordering; `countChildren`/`countProducts`; `save()` persists rename/deactivate; delete of an empty leaf. |
| `prisma-brand.repository.integration.spec.ts` | Create/find/list/save/delete round-trip. |
| `prisma-tag.repository.integration.spec.ts` | Create/find/`findManyByIds` (correctly excludes a missing id)/list/save/delete. |
| `prisma-collection.repository.integration.spec.ts` | Create/find; **`replaceProducts` sets both membership and order, and a second call fully replaces rather than appending**; save/delete. |
| `prisma-product.repository.integration.spec.ts` | Create; **Money round-trips through Postgres `Decimal` at full precision** (`45000.50` / `39000.25` survive create → read exactly); find by id/slug/SKU; `findManyByIds` scoped correctly; `save()` persists a status change and a pricing update (discount cleared to `null`); `list()` filters by status; tag replace/list round-trip. |

The Money precision test is the most consequential integration check in
this epic — it's the one assertion that could not be caught by a unit
test (unit tests never touch the real `Decimal` column), and it confirms
the `@db.Decimal(12, 2)` correction from
[EPIC-03A-ARCHITECTURE-COMPLIANCE.md §5](EPIC-03A-ARCHITECTURE-COMPLIANCE.md#5-disclosed-simplifications-specific-to-this-epic)
actually behaves correctly end to end.

## What is deliberately not covered

- **HTTP-layer tests**: no HTTP layer exists in this epic (see the
  Completion Report §1, "zero controllers").
- **`test:integration` in CI**: same standing decision as Epic 2 — needs
  a live Postgres, not wired into the `test` CI job.
- Trivial list/get use-cases with no branching logic (see the table note
  above).
