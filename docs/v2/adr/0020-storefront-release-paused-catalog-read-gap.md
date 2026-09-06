# ADR 0020: Epic 10 (Storefront Release) Paused — No Public Catalog Browse API

**Status**: Accepted (epic paused, not implemented)
**Relates to**: [ADR 0016](0016-api-layer-conventions.md) (the guard conventions this ADR
confirms), [ADR 0019](0019-admin-dashboard-frontend.md) (the prior epic's frontend
conventions, which this pause defers reusing for the storefront).
**Raised during**: Epic 10 (Storefront Release) kickoff, per the governance rule in
[ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Epic 10's brief asked for a complete customer-facing storefront — Homepage, Shop,
Categories, Collections, Product Details, Search, Filters, Wishlist, Cart, Checkout UI,
Customer Account, Order Tracking, About, Contact, FAQ — against the existing (frozen)
API, with two hard constraints: "No business logic in the frontend" and "All state comes
from the existing API."

Before writing any storefront code, the actual API surface was read directly (not
inferred from `PROJECT_STATUS.md`, which undersells this gap — see below). The findings:

- `ProductsController` (`apps/api/src/modules/catalog/http/products.controller.ts`) is
  guarded end to end — `list`, `get`, and `getDetail` all require
  `PERMISSION_KEYS.PRODUCTS_VIEW`. Its own docblock states this is deliberate: *"Guarded
  (admin-only). Storefront-facing curated lists (Featured/Best Sellers/New Arrivals)
  live on `StorefrontCatalogController` instead."* This is existing, intentional design
  from Epic 6 (API Layer) — not an oversight to work around.
- The **only** public product-browsing surface anywhere in the API is:
  `StorefrontCatalogController` (`GET /catalog/storefront/{featured-products,
  best-sellers, new-arrivals}` — three fixed, unpaginated, unfilterable ACTIVE-only
  arrays), and `GET /catalog/collections/:id/products` (also unpaginated/unfiltered, and
  only reachable if you already know a collection's id — no
  `GET /catalog/collections` list-all endpoint exists, per `PROJECT_STATUS.md` gap #14).
- No endpoint anywhere returns "all products," "products in category X," a
  single arbitrary product by id or slug, or a product's variants, without a staff
  Bearer token. Public product-level reads exist only for three narrow sub-resources
  keyed off a *known* `productId` (media, specifications, relations) — none of which
  help a storefront discover which products exist in the first place.
- No search endpoint exists at any privilege level — `search` is an in-memory
  substring match over `name`/`sku` on the guarded list endpoint only, and a real
  full-text search engine has been "explicitly excluded from every Commerce Core epic
  so far" (`PROJECT_STATUS.md`, Open Items).
- No filter parameters (color, size, price range, tag) exist on any endpoint, guarded or
  not.

`PROJECT_STATUS.md`'s existing gap #15 ("No public product-detail-by-slug endpoint")
and its "What exists today" prose ("Catalog reads are `@Public()` except product
detail...") both understate this: it is not one missing variant of one endpoint, it is
the *entire* general-purpose product catalog having no public read path at all.

## Decision

**Epic 10 is paused before implementation, per the user's explicit choice** when
presented with this finding. Given the epic's own constraints — the backend is frozen,
and the frontend must contain no business logic and derive all state from the existing
API — there is no way to build real Shop, Search, Filters, Category-with-products, or
arbitrary-PDP pages that isn't either:

1. A thin, honest wrapper around the three fixed curated shelves (which would not
   actually be "Shop," "Search," or "Filters" in any meaningful sense — just the same
   ~dozen ACTIVE products re-sliced three ways with client-side substring matching over
   that tiny fixed set), or
2. A workaround that violates the epic's own constraints (e.g., embedding a staff
   credential in the storefront to call admin-only endpoints — a severe security
   anti-pattern that also isn't "using the existing API" as intended, or reimplementing
   product listing/search/filtering client-side against data the storefront was never
   meant to hold — literal "business logic in the frontend").

Neither option was judged an acceptable way to satisfy the epic's actual intent (a real,
browsable, searchable storefront), so the epic stops here rather than shipping a
deliverable that only superficially resembles what was asked for.

### What already exists and does NOT block a future resumption

Everything else the epic scoped is genuinely well-supported by the current API and can
be built immediately once catalog browsing is unblocked:

- **Cart & Checkout** (`checkout/http/*`) — fully public, guest-token-based, solid.
- **Customer Account** (`customers/http/customer-auth.controller.ts`,
  `customer-profile.controller.ts`, `customer-address.controller.ts`) — registration,
  login, profile, addresses, all guarded correctly per ADR 0018.
- **Wishlist** (`customer-wishlist.controller.ts`) — add/list/remove, though
  availability is status-only, not stock-aware (`PROJECT_STATUS.md` gap #22).
- **Reviews** (`customer-review.controller.ts`) — public approved-review read +
  authenticated submit, per product id.
- **Order history for a logged-in customer** (`customer-order-history.controller.ts`)
  — real, though "Order Tracking" for a *guest* checkout has no backend support at all
  (`PROJECT_STATUS.md` gap #13, reconfirmed unchanged).

A future Storefront epic could ship Cart/Checkout/Account/Wishlist/Reviews/(logged-in)
Order History end to end today, deferring only the catalog-browsing pages — that option
was raised but not chosen; the user opted to pause the whole epic and prioritize the
backend gap first instead.

## Recommended backend follow-up (a prerequisite for resuming Epic 10)

A small, additive epic — no changes to any frozen schema or existing guarded route,
purely new `@Public()` reads — scoped to:

1. A public product list endpoint with real pagination and (at minimum) `categoryId`,
   `search` (name), and price-range filters, ACTIVE-only, reusing `Product`'s existing
   fields — this is the actual gap behind "Shop," "Categories" (product listing), and
   "Filters."
2. A public single-product read, by id and/or slug, ACTIVE-only-filtered (unlike the
   guarded `GetProductDetailUseCase`, which doesn't filter by status at all) — the
   actual gap behind "Product Details," closing `PROJECT_STATUS.md` gap #15 for real
   this time (not just "by slug," but "public at all").
3. A public product-variant read for a given product id (colors/sizes/price overrides)
   — PDPs cannot show a buyable variant matrix without this.
4. `GET /v1/catalog/collections` (list-all) — closes `PROJECT_STATUS.md` gap #14,
   unblocking a real Collections index page (not just per-collection pages reachable
   only if the id is already known).

None of these require a schema change — every field they'd expose already exists on
`Product`/`ProductVariant`/`Collection`. This is a read-surface gap, not a data-model
gap.

## Consequences

- No `apps/storefront` code was written or changed in this epic. `apps/storefront`
  remains exactly the Epic 1 placeholder (root layout, header, footer, one placeholder
  homepage) plus whatever it already had before this epic started.
- `PROJECT_STATUS.md` gap #15 is superseded by a broader, corrected item documenting the
  full scope of the missing public catalog-read surface (not just "no by-slug variant").
- CHANGELOG.md records this epic as paused with findings, not shipped — an honest
  reflection that investigation, not implementation, is this epic's actual output.
- The next attempt at Epic 10 should either follow the recommended backend follow-up
  first, or explicitly re-scope to "Cart/Checkout/Account/Wishlist/Reviews only,
  Shop/Search/Filters/Categories/Collections deferred" if the backend follow-up isn't
  wanted.

## Alternatives Considered

- **Build the thin curated-shelves-only version anyway, heavily disclosed.** Considered
  and offered as an explicit option; not chosen. Would have produced pages *named* Shop/
  Search/Filters that don't actually shop, search, or filter in any real sense — closer
  to mislabeling than to a disclosed simplification of the kind used elsewhere in this
  project (e.g. Epic 9's lookup-by-ID pages, which are honest, narrower *but real*
  tools).
- **Build everything except the catalog-browsing pages.** Also offered; not chosen —
  the user preferred to pause the whole epic and address the backend gap first.
- **Call the guarded staff endpoints from the storefront using a shared/service
  credential.** Rejected outright — defeats the entire purpose of `PRODUCTS_VIEW` being
  a permission at all, and is exactly the kind of frontend-side workaround the epic's
  own "no business logic in the frontend" constraint rules out.
