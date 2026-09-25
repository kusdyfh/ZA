# ZA Store — Project Status

**Last updated**: 2026-09-24, end of Epic 13.4 (Editorial Hero Redesign) —
the homepage's first viewport was rebuilt into an asymmetric editorial
composition (real `Logo`, `PortraitBlob` character, one live product
photo, existing decorative primitives), reusing the ZA Identity System's
existing pieces with no new logo, palette, or component family. No
backend, API, business logic, or `apps/admin` functionality changed.
**Purpose**: a snapshot of what's built, what's frozen, and what's next —
read this before starting a new epic. For historical detail, see
`docs/epics/EPIC-*.md`; for architecture decisions, see `docs/v2/adr/`.

## Where we are

Planning (v1 architecture → senior review → v2 architecture → product
spec → Arabic client proposal) is complete and frozen. Implementation is
underway, epic by epic, each frozen on completion except for disclosed
bug fixes.

| Epic                                                   | Status      | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Epic 1 — Project Foundation                            | **Frozen**  | Monorepo, tooling, CI, Docker, NestJS/Next.js skeletons                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Epic 2 — Identity & Access Management Core             | **Frozen**  | User/Role/Permission domains, RBAC, Argon2 hashing (no Login/JWT yet)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Epic 3A — Commerce Core                                | **Frozen**  | Product/Category/Collection/Brand/Tag domains, SEO metadata, slug generation, Store scoping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Epic 3B — Product Experience & Merchandising           | **Frozen**  | Variants, Colors, Sizes, Media (images/video/cover/alt text), Specifications, Highlights, Rich Content, Featured/Best-Seller/New-Arrival lists, Related/Cross-sell/Up-sell — `ProductPolicy` now centralizes every Product business rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Epic 4 — Inventory & Stock Management                  | **Frozen**  | Warehouse (single, extensible), VariantStock, Stock Movements (audit trail), Manual Adjustments, Damaged/Returned Stock, Low-Stock Alerts, Inventory Reservations per ADR 0001 — `InventoryPolicy` now centralizes every inventory business rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Epic 5 — Orders & Checkout Core                        | **Frozen**  | Cart/CartItem (guest-only), Checkout orchestration (`PlaceOrderUseCase`), Order/OrderItem/OrderStatusHistory/OrderNote, the full Order status state machine, Order Snapshots (customer/address, per ADR 0004), Reservation Integration with Inventory — `OrderPolicy` now centralizes every order business rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Epic 6 — API Layer                                     | **Frozen**  | First HTTP surface for every bounded context: controllers, `/v1` prefix, Swagger docs, `TemporaryAdminGuard` (401-only, `@Public()` opt-out — replaced in Epic 7), response envelope + `DomainError`-driven exception mapping, pagination/filtering/sorting/search — `ADR 0016` centralizes every API convention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Epic 7 — Authentication & Authorization                | **Frozen**  | Real staff login: JWT access/refresh tokens, refresh-token rotation with family-wide reuse detection, session management (list/revoke), login history, change/reset password (both revoke every session), IP-based login rate limiting — `JwtAuthGuard` + `PermissionGuard` replace `TemporaryAdminGuard`, enforcing real per-route 403s via Epic 2's `CheckPermissionUseCase` — `ADR 0017` centralizes every auth convention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Epic 8 — Customer Accounts                             | **Frozen**  | New `Customers` bounded context, deliberately separate from staff Identity: registration/login/logout with its own JWT access+refresh secrets and rotation-with-reuse-detection (mirroring Epic 7 but fully isolated), profile, address book (exactly-one-default invariant), wishlist, reviews (submit/edit + staff moderation reusing `REVIEWS_MODERATE`), order history. Guest cart merge via a permanent `Customer.cartToken` reusing Epic 5's unchanged Cart machinery; guest order association via an email-match backfill at register/login time. Additive `customerId` on `Order` (nullable, `onDelete: SetNull`) and a `CART_REPOSITORY` export from Checkout — `PlaceOrderUseCase` and every other frozen Orders/Checkout use-case untouched. `CustomerPolicy` centralizes every customer business rule — `ADR 0018` centralizes every design decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Epic 9 — Admin Dashboard                               | **Frozen**  | The full `apps/admin` staff UI, first real one, against the already-frozen API: Dashboard, Products (+Variants/Media/Specifications), Categories, Collections, Brands, Tags, Colors, Sizes, Inventory (Warehouses/Stock/Low-Stock/Reservations), Orders, Customers, Reviews, Roles, Permissions, Staff, Store Settings — TanStack Query data layer, real staff login replacing the Epic-1 placeholder, `@za/ui` gained its first Table/Badge/Select/Dialog/Toast/Pagination/etc. component set (now dark-mode-aware throughout), responsive sidebar with a mobile drawer. Four areas (Collections/Customers/Reviews/Dashboard) and Store Settings are each constrained by a real, disclosed backend gap (no list-all/no stats/no settings endpoint) rather than a frontend shortcut — `ADR 0019` centralizes every design decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Epic 9.5 — Public Catalog API                          | **Frozen**  | The backend follow-up ADR 0020 recommended: additive-only extension of `StorefrontCatalogController` with a real public product list/search/filter/sort (`GET /products`), product-by-slug + full PDP detail (`GET /products/:slug`, `.../detail` — includes variants/media/specifications/related/cross-sell/up-sell), a standalone public variant read, and the list-all-collections endpoint that never existed before (`GET /collections`, `.../:id/products`). No schema change; every route is a thin composition over already-existing Catalog use-cases; zero admin controller files touched — `ADR 0021` centralizes every design decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Epic 10 — Storefront Release                           | **Frozen*** | Kicked off, paused once (`ADR 0020`, no public catalog-browsing surface existed), resumed once Epic 9.5 closed that gap. The full `apps/storefront` customer UI against the Public Catalog API exclusively: Homepage, Shop (search/filter/sort), Categories, Collections, Product Detail (gallery/variants/specs/related/reviews), Wishlist, Cart, Checkout (guest + customer), Customer Account (profile/addresses/order history), About/Contact/FAQ. New shared UI primitives (`Drawer`, `Accordion`, `Rating`, `Breadcrumbs`, `QuantityStepper`); React Query with SSR hydration on every SEO-critical page; guest-cart token reuses Epic 8's existing merge-on-login flow unchanged — `ADR 0022` centralizes every design decision. *Re-opened narrowly by Epic 11 for CMS-backed About/Contact/FAQ + new Privacy/Terms pages + sitemap/robots — everything else untouched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Epic 11 — Commerce Services                            | **Frozen**  | Notifications (Email Service/Templates/Queue/Preferences/History/Event Listeners), CMS (About/Contact/FAQ/Privacy/Terms + admin management), and SEO (`sitemap.xml`, `robots.ts`) — built on a from-scratch transactional outbox + BullMQ background-job system (ADR 0002/0003 were designs only until this epic; confirmed via grep before writing code, then paused with a user decision to go for full ADR compliance over a scoped-down version). New `za-worker` process (`apps/api/src/worker.main.ts`, a second NestJS bootstrap in the same package, not a separate `apps/worker`) handles the outbox relay and notification queues; `za-api` itself stays free of any Redis/BullMQ dependency — `ADR 0023`/`ADR 0024`/`ADR 0025` centralize every design decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Epic 12 — Payments & Shipping                          | **Frozen**  | Real Payments (provider abstraction, COD/Stripe/Manual providers, Sessions/Transactions/Status History/Refunds, Stripe webhooks) and Shipping (provider abstraction, Zones/Methods/Rates, Shipment entity + status machine + tracking events, guest order tracking) bounded contexts, replacing Epic 5's flat placeholder fields (item 10, now closed for Payments/Shipping — Coupons remains open). Orders integration: `PlaceOrderUseCase` creates a `Shipment` eagerly at checkout; `DispatchShipmentUseCase` syncs the linked `Order` through its fulfillment path in one staff action. Admin gained Payment/Refund sections on Order Detail plus Shipping Zones/Methods/Rates/Shipments pages; storefront gained real delivery-method selection with a live rate quote, a real COD/CARD payment choice, a Stripe-redirect result page, and guest/customer shipment tracking. Reused Epic 11's outbox/BullMQ relay unchanged for 5 new event types. Two real bugs (a shipment-status transition graph that made every dispatch impossible; an order/shipment desync on dispatch failure) were found and fixed via live testing against the real stack, not just unit tests — `ADR 0026`/`ADR 0027` centralize every design decision                                                                                                                                                                                                                                                                                                                                                                                                  |
| Epic 13 — Brand Experience & Theme Transformation      | **Frozen*** | A complete visual-only reskin of `apps/storefront` into a premium illustrated brand experience, extracted from two client reference images into a design system (ADR 0028) — new homepage flow (Brand Hero, Character Showcase, Dress Showcase, story sections, product shelves, Newsletter), a redesigned Product Detail Page (illustrated header/lifestyle bands wrapping the untouched functional core), illustrated About/Contact/FAQ, and theme-aware header/footer restyling. New tokens live only in `apps/storefront/tailwind.config.ts`'s own `brand-*` namespace and a new `apps/storefront/src/components/brand/` component tree — `packages/config/tailwind-preset.js` and every `packages/ui`/`apps/admin` file are untouched except one additive, default-preserving prop extension (`Accordion`'s `buttonClassName`/`panelClassName`, `Input`/`Textarea`'s `labelClassName`) that fixed a real dark-mode legibility bug without forking any shared component. *Its specific palette/logo/font choices were superseded by Epic 13.1 below; the component tree and architecture it built are what Epic 13.1 restyled in place.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Epic 13.1 — ZA Identity System Rollout                 | **Frozen**  | A visual-only follow-up implementing a client-supplied, production-ready brand identity book on top of Epic 13's groundwork (ADR 0029, superseding ADR 0028's specific color palette/logo/font while keeping its architecture) — exact named colors with WCAG contrast tables, a real constructed `Logo` component (Fraunces-built Z+A wordmark with bow/stethoscope-heart marks, replacing every plain-text logo), Nunito Sans replacing Inter, a disciplined rose/plum (frequent) + gold/lavender (≤10%, never together) tone system replacing Epic 13's arbitrary 4-hue enum, and the book's exact motion durations/curves. Found and fixed two real bugs: a Rose-family button color that failed the book's own WCAG contrast rule (corrected to Plum/Berry), and a production-build failure from Next.js having no font-fallback-metrics entry for Nunito Sans (fixed via `adjustFontFallback: false`). Arabic/RTL localization (the book's own primary language) is explicitly out of scope — disclosed as a future epic's own decision, not silently built or silently skipped                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Epic 13.2 — Storefront-Wide Brand Coverage & Visual QA | **Frozen**  | A visual-audit-driven follow-up: extends Epic 13.1's ZA Identity System from the Homepage/PDP/editorial pages to every storefront area a live audit found still on unbranded `packages/ui` defaults — Shop/Category/Collection listing chrome, `FiltersPanel`, `ProductCard` (storefront-local, restyled directly), the Cart drawer, Checkout page chrome, and empty/loading states along those paths — via the same call-site-only `className` pattern, dark mode fully preserved throughout. `EmptyState`/`ErrorState` and `Drawer` in `packages/ui` gained additive `className`/`iconClassName`/`titleClassName` props (same established pattern as ADR 0028/0029's `Accordion`/`Input` extensions) since they had no styling escape hatch at all; `apps/admin` uses neither component, confirmed unaffected via its own full quality-gate pass. The brief's 10-character "Dress-Up" system with real per-color garment overlays was evaluated and explicitly deferred — it needs bespoke character illustration assets (an art/illustration pipeline, not a coding task) this session has no tool to produce; kept on Epic 13's existing abstract-placeholder Dress Showcase by explicit direction rather than faked. Figma-as-source-of-truth sync was also out of reach (no Figma authorization this session) — the token system stays documented as code. Storefront Playwright E2E 16/18 (same 2 pre-existing, unrelated failures disclosed since Epic 12)                                                                                                                                                                       |
| Epic 13.3 — Homepage & PDP Structure Alignment         | **Frozen**  | A client-supplied site-structure outline drove a homepage section consolidation and a deliberate PDP simplification, scope confirmed per-section before building. New `ArtStoryWall` component merges 3 prior homepage sections (2 `StorySection`s + the Brand Philosophy `QuoteSection`) into one gallery-wall composition; a new `pickTenProducts()` de-dup helper pools Featured/Best-Sellers/New-Arrivals into one "10 Products Showcase" grid, replacing 3 separate shelves; "Dress Showcase" renamed to "Doll Dress-Up" (behavior/assets unchanged, still Epic 13.2's disclosed placeholder); new `RotatingArtwork` component adds a purely decorative, auto-advancing illustration carousel. The PDP lost its Breadcrumbs, description/specifications `Accordion`, all 3 `ProductRail`s, and the review section by explicit direction — a real, disclosed content-scope decision, not an oversight; underlying components/API data untouched and still used elsewhere. Confirmed via live browser verification (desktop + mobile) and production build output (`/products/[slug]` route bundle: 9.39 kB → 6.75 kB). Also fixed, found during this pass's live QA: a real React duplicate-key bug in the homepage's Instagram placeholder grid (`INSTAGRAM_TILE_TONES` legitimately repeats `'plum'`, was keyed by value alone), and a stale E2E spec (`brand-experience.spec.ts`) still asserting the old "Dress Showcase" heading text. Storefront Playwright E2E 16/18 (same 2 pre-existing, unrelated failures disclosed since Epic 12); `apps/storefront`'s `lint` task could not be verified this pass — see Known Gap below |
| Epic 13.4 — Editorial Hero Redesign                    | **Frozen**  | The homepage's `BrandHero` rebuilt from a centered marketing banner into an asymmetric "editorial illustrated fashion experience" hero, composed entirely from existing identity-system pieces: the real `Logo` asset (now the small `wordmark`, not the giant `primary` lockup), `PortraitBlob`'s established placeholder character scaled into the illustrated scene, one real live product photo (`Product.ogImageUrl`, same field `ProductCard` uses) pinned in as a tilted keepsake-photo card, and the existing decorative/motion token set (no new logo, palette, component family, or animation library). Headline copy changed to a short editorial statement and an em dash was removed from the subtitle; `brand-experience.spec.ts` updated to match. Mobile collapses artwork-first per explicit direction, verified with no horizontal overflow and a clean 2-line headline wrap. `tsc --noEmit` and `eslint` both clean on every changed file (run directly, bypassing the `next build`-dependent turbo pipeline, since the local API kept crashing mid-session on the same recurring `node_modules` corruption as Known Gap 35 — a different package each time)                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Next epic (not yet scoped)                             | Not started | MFA, Media storage adapter, Coupons, Returns, real carrier integration (Shipping labels are still a placeholder abstraction), a full Arabic/RTL localization epic (i18n library, RTL audit, translated product/CMS content — disclosed by Epic 13.1), a real character-illustration asset-production epic for the Dress-Up experience (disclosed by Epic 13.2 — needs an illustrator/art pipeline, not engineering), a CMS/asset-management epic to replace the storefront's local illustration placeholders with real uploaded art and Story/Character management, or closing disclosed frontend/backend gaps (Dashboard stats, list-all-customers/reviews, Store Settings, `/auth/me/permissions`, guest order-lookup) — see [Open Items](#open-items-for-the-next-epics)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Run `pnpm turbo run build lint type-check test` from the repo root at
any time to verify the whole monorepo compiles, lints, and passes its
unit/component suite clean. Run `pnpm --filter @za/api test:integration`
(with Docker Postgres up) for the API integration suite, and
`pnpm --filter @za/admin test:e2e` (with the API + a seeded Postgres up)
for the admin's Playwright E2E suite — both share the same "needs the
real stack" precondition and are intentionally not part of `turbo run
test`. With the API server running, Swagger docs are at `/v1/docs`
(non-production only); the admin dashboard runs on port 3001
(`pnpm --filter @za/admin dev`). As of Epic 11, background jobs
(outbox relay, notification delivery, reservation-expiry sweep) need a
second process — `pnpm --filter @za/api run worker:dev` — alongside
`za-api` and a reachable `REDIS_URL`; `za-api` itself never touches
Redis directly.

## What exists today

- **Foundation** (`apps/api`, `apps/storefront`, `apps/admin`,
  `packages/*`) — no business logic, just the platform.
- **Identity** (`src/modules/identity/`) — staff accounts, roles,
  permissions. Guarded HTTP surface: `admin-users`, `roles`,
  `permissions` controllers.
- **Catalog** (`src/modules/catalog/`) — products, categories,
  collections, brands, tags, colors, sizes, variants, media,
  specifications, highlights/rich content, product relations
  (related/cross-sell/up-sell). All Product business rules are
  centralized in `ProductPolicy`. HTTP surface: the admin-facing
  `catalog/products`/`catalog/collections` controllers are guarded end
  to end (list/get/detail all require `PRODUCTS_VIEW`) — categories,
  brands, tags, colors, and sizes reads are `@Public()`. The dedicated
  `catalog/storefront` controller (Epic 6, extended in Epic 9.5 —
  `ADR 0021`) is the real public product-browsing surface: curated
  featured/best-seller/new-arrival shelves, a full public product
  list/search/filter/sort, product-by-slug + PDP detail (variants/
  media/specifications/related/cross-sell/up-sell in one call), a
  standalone public variant read, and public collection listing —
  ACTIVE-only, enforced server-side, never client-selectable.
- **Inventory** (`src/modules/inventory/`) — Warehouse, VariantStock,
  Stock Movements, Manual Adjustments, Damaged/Returned Stock, Low-Stock
  Alerts, Inventory Reservations (ADR 0001's full lifecycle — create at
  checkout submission, confirm, release, TTL-expiry sweep). All
  inventory business rules are centralized in `InventoryPolicy`. Depends
  on Catalog's `ProductVariantRepository` (the one legitimate
  cross-bounded-context repository dependency in the codebase). Guarded
  HTTP surface: `warehouses`, `stock`, `stock-reservations`.
- **Checkout** (`src/modules/checkout/`) — guest-only `Cart`/`CartItem`
  (no `customerId` yet, per [ADR 0015](docs/v2/adr/0015-guest-checkout-and-minimal-order-dependencies.md)),
  and the Cart→Order orchestration (`PlaceOrderUseCase`): reserves stock
  via Inventory, snapshots pricing from Catalog's current state, creates
  the Order, auto-confirms Cash-on-Delivery, clears the cart. The
  most-connected module in the codebase (imports Catalog, Inventory, and
  Orders), holding no long-lived state of its own beyond the cart. Fully
  `@Public()` HTTP surface (`cart`, `checkout`) — no admin identity is
  ever required to buy.
- **Orders** (`src/modules/orders/`) — `Order`/`OrderItem`/
  `OrderStatusHistory`/`OrderNote`, the full status state machine
  (`PENDING → CONFIRMED → PREPARING → PACKED → SHIPPED → DELIVERED`,
  `CANCELLED` from any pre-`SHIPPED` status, `DELIVERED → RETURNED`),
  order snapshots (customer/address, no live FK — ADR 0004/0015), and
  cancellation (releases or restocks per reservation state, per ADR 0015
  §4). All order business rules are centralized in `OrderPolicy`.
  Guarded HTTP surface: list/get/status/cancel/notes.
- **API Layer** (Epic 6, cross-cutting) — `/v1` prefix on every route; a
  shared `ApiSuccessResponse`/`ApiErrorResponse` envelope,
  `DomainError`-driven exception mapping, and in-memory
  pagination/sort/search apply uniformly across every list endpoint.
  Swagger docs at `/v1/docs` (non-production only). See
  [ADR 0016](docs/v2/adr/0016-api-layer-conventions.md).
- **Auth** (`src/modules/auth/`, Epic 7) — staff login/logout, JWT
  access (15 min) + refresh (7 day) tokens with rotation and
  family-based reuse detection, session list/revoke, login history,
  change/reset password (both revoke every session). `JwtAuthGuard` +
  `PermissionGuard` (global `APP_GUARD`s) replace `TemporaryAdminGuard`
  — every route requires a valid `Authorization: Bearer` token, and
  every previously-guarded endpoint now enforces a real permission via
  `@RequirePermission(...)` and Epic 2's `CheckPermissionUseCase`.
  `@Public()` routes (guest storefront/cart/checkout, plus
  login/refresh/password-reset themselves) are unaffected. IP-based
  login rate limiting via `@nestjs/throttler`. See
  [ADR 0017](docs/v2/adr/0017-authentication-and-authorization.md).
- **Customers** (`src/modules/customers/`, Epic 8) — a unified module
  covering customer credentials, profile, addresses, wishlist, reviews,
  and order history, deliberately kept separate from staff Identity
  (`Customer` is its own store-scoped table, `@@unique([storeId,
email])`). Own JWT access (15 min) + refresh (7 day) secrets and
  rotation-with-reuse-detection, fully isolated from staff tokens — a
  leaked customer secret can never forge a staff token, verified by an
  integration test. `CustomerAuthGuard` (applied locally via
  `@UseGuards()`, not globally) populates the same `ActorRef`/
  `@CurrentActor()` staff auth uses, with `actorType: CUSTOMER`. Guest
  cart merge reuses Epic 5's unchanged Cart/CartItem machinery via a
  permanent `Customer.cartToken`; guest order association is an
  email-match backfill (`Order.customerId` set at register/login time,
  not real-time at checkout). Reviews reuse Epic 2's seeded
  `REVIEWS_MODERATE` permission for staff moderation; average
  rating/review count are computed live via Prisma `aggregate()`, not
  stored on `Product`. All customer business rules are centralized in
  `CustomerPolicy`. Mostly `@Public()` HTTP surface (registration/login/
  public review list are public; profile/addresses/wishlist/order-
  history/review-submission require `CustomerAuthGuard`; review
  moderation and staff customer/order lookup require staff
  `PermissionGuard`). See
  [ADR 0018](docs/v2/adr/0018-customer-accounts.md).
- **Admin Dashboard** (`apps/admin`, Epic 9) — the first real staff UI,
  covering all fifteen scoped areas against the already-frozen API: real
  login (replacing the Epic-1 placeholder submit handler), a TanStack
  Query data layer (`src/lib/api/client.ts`'s `apiFetch` decodes the ADR
  0016 envelope, transparently refreshing an expired access token once
  per request), `localStorage`-backed auth (a disclosed SPA-without-BFF
  trade-off), and no client-side permission-based nav hiding — every nav
  item is always visible, and a per-page `<ForbiddenState />` handles a
  real 403 instead (the API has no `/auth/me/permissions` endpoint to
  gate on). `@za/ui` gained its first Table/Badge/Select/Dialog/Toast/
  Pagination/Checkbox/Textarea/Skeleton/Tabs/Switch/Callout/Spinner
  component set, all dark-mode-aware, plus `dark:` classes retrofitted
  onto the previously light-only Button/Card/Input/Heading/Text. Four
  areas are each constrained by a real backend gap rather than a
  frontend shortcut: Collections (create + lookup-by-ID, no list-all
  endpoint), Customers (lookup-by-ID only), Reviews (a moderation queue,
  no full history endpoint), and Dashboard (stats composed client-side
  from existing list endpoints, no aggregate endpoint, no customer
  count). Store Settings is a disclosed placeholder — no backend
  endpoint exists at all. See
  [ADR 0019](docs/v2/adr/0019-admin-dashboard-frontend.md).
- **Events & Jobs** (`src/infrastructure/events/`, `src/infrastructure/jobs/`,
  Epic 11) — the transactional outbox (ADR 0002) and BullMQ background-job
  system (ADR 0003), both designed since early architecture docs but
  implemented for the first time this epic. `OutboxEvent` rows are written
  in the same Prisma `$transaction` as the business write that produces them
  (`Order.create`/`changeStatus`, `Customer.create`, `Review.create`,
  `PasswordResetToken.create`); a separate `za-worker` process
  (`worker.main.ts`) polls and relays them, emitting in-process via
  `EventEmitter2` and enqueueing a notification job. Permanently-failed jobs
  (5 attempts) archive to `FailedJobLog` and raise a `SYSTEM` alert
  `Notification`. `za-api` has zero Redis/BullMQ dependency — HTTP and
  worker concerns are split into separate NestJS modules sharing only
  `@Global()` repository bindings.
- **Notifications** (`src/modules/notifications/`, Epic 11) — Email Service
  (Nodemailer, Mailpit in dev), 5 templates (order-placed admin alert,
  review-submitted admin alert, order-status-changed customer, welcome
  customer, password-reset — closing gap #16 below, real emails now go out),
  staff preferences (`SETTINGS_MANAGE`-guarded) and customer preferences,
  notification history (`AUDIT_LOG_VIEW`-guarded). See
  [ADR 0024](docs/v2/adr/0024-notifications.md).
- **CMS** (`src/modules/cms/`, Epic 11) — one `CmsPage` model for five fixed
  slugs (about, contact, faq, privacy-policy, terms-of-service), reusing
  Category/Collection's slug+title+body+SEO-fields+publish-state shape.
  Admin CRUD (`CONTENT_MANAGE`-guarded, an already-seeded permission wired
  to something for the first time) plus a public
  `GET /storefront/cms/pages/:slug` (`PUBLISHED`-only). Storefront's About/
  Contact/FAQ now read from this instead of hardcoded JSX; Privacy Policy
  and Terms of Service are new pages. See
  [ADR 0025](docs/v2/adr/0025-cms-and-seo.md).
- **SEO** (`apps/storefront/src/app/sitemap.ts`, `robots.ts`, Epic 11) —
  Next.js native file conventions, genuinely new; canonical URLs/OpenGraph/
  Twitter Cards/JSON-LD/dynamic metadata already existed from Epic 10 and
  are reused unchanged on the new/changed CMS pages, not rebuilt.
- **Payments** (`src/modules/payments/`, Epic 12) — provider abstraction
  (`PaymentProviderPort`) behind a `PAYMENT_PROVIDER_REGISTRY` map, with
  COD, Stripe, and Manual providers; `PaymentSession`/`PaymentTransaction`/
  `PaymentStatusHistoryEntry`/`Refund` entities. Card checkout goes through
  Stripe Checkout Sessions (`InitiateCardCheckoutUseCase`), and the `Order`
  itself is only materialized on the async webhook confirming payment
  (`ConfirmCardPaymentUseCase`) — never on the initial request, so an
  unpaid card attempt never creates a real order. Manual-payment
  verification and refund issuance are staff-only. See
  [ADR 0026](docs/v2/adr/0026-payments.md).
- **Shipping** (`src/modules/shipping/`, Epic 12) — provider abstraction
  (`ShippingProviderPort`, one Manual/flat-rate provider today) with
  Zones/Methods/Rates for rate quoting, a `Shipment` entity with its own
  status machine (`PENDING → IN_TRANSIT → DELIVERED`, `→ FAILED`/
  `RETURNED`) and tracking events, and guest-friendly order tracking
  (`GET /shipments/track?orderNumber=&email=`, ownership proven by the
  order/email pair rather than a session). Label creation is a placeholder
  abstraction — no real carrier integration exists yet (disclosed gap,
  see item 29 below). See
  [ADR 0027](docs/v2/adr/0027-shipping.md).
- **Orders integration** (Epic 12) — `PlaceOrderUseCase` now creates a
  `Shipment` at `PENDING` eagerly, in the same transaction as order
  confirmation, so a COD order is trackable the instant checkout
  completes. `DispatchShipmentUseCase` walks the linked `Order` through
  every remaining fulfillment hop before mutating the shipment, so a
  failed order-status transition can never leave the shipment durably out
  of sync with its order. See
  [ADR 0027](docs/v2/adr/0027-shipping.md) (which also covers this
  Orders-integration design).
- **Platform**: `Store` + `StoreContext` (one seeded store; SaaS-ready
  scoping per [ADR 0006](docs/v2/adr/0006-saas-ready-schema-pattern.md),
  no actual multi-tenancy built).
- **Brand Experience** (`apps/storefront/src/components/brand/`, Epic 13,
  restyled by Epic 13.1, extended storefront-wide by Epic 13.2) — a
  storefront-only illustrated visual layer: an
  additive `brand-*` Tailwind token namespace (colors/radius/shadow/
  gradient/motion) now carrying the client's production-ready ZA Identity
  System palette/logo/type/motion spec
  ([ADR 0029](docs/v2/adr/0029-za-identity-system-rollout.md), superseding
  ADR 0028's specific choices), a real `Logo` component (Fraunces-built Z+A
  wordmark with bow/stethoscope-heart marks), 11 reusable decorative
  primitives (`Sparkle`, `Heart`, `Sticker`, `PaperTape`, etc.) and 13
  structural components (`BrandHero`, `CharacterCarousel`, `DressShowcase`,
  `StorySection`, `EditorialHeader`, etc.). Presentation only — every
  component consumes real product/CMS data through the existing, unchanged
  Public Catalog API and CMS hooks; no new backend surface, business logic,
  or `apps/admin` change. Full-redesign pages (Homepage, PDP's decorative
  wrapper, About/Contact/FAQ) render in a fixed light palette regardless of
  the site's dark-mode toggle, by design (ADR 0028 §7, carried over
  unchanged by ADR 0029). Header/footer, Shop/Category/Collection
  listings, the filter panel, the cart drawer, and checkout chrome (Epic
  13.2) are theme-aware brand chrome instead — light mode carries the
  `brand-*` palette, dark mode keeps its pre-existing neutral support
  completely unchanged. The identity book's own primary language (Arabic,
  RTL) is not implemented — disclosed, see item below; nor is the
  brief's real-character-illustration Dress-Up system — also disclosed
  below. The homepage (Epic 13.3) now follows a client-supplied structure
  outline — `ArtStoryWall` (gallery-wall story/quote composition), a
  pooled "10 Products Showcase", "Doll Dress-Up", and a decorative
  `RotatingArtwork` carousel — and the PDP was deliberately narrowed to
  Product Visual to Colors/Sizes/Add to Cart to Story/Illustration only,
  per explicit direction. The hero itself (Epic 13.4) was rebuilt into an
  asymmetric editorial composition on top of that same structure, reusing
  the real `Logo`, `PortraitBlob`, and one live product photo rather than
  introducing any new brand asset.

## Known gaps, disclosed and tracked

1. **`AdminUser.email` is not store-scoped**, contradicting
   [ADR 0006](docs/v2/adr/0006-saas-ready-schema-pattern.md)'s decision
   table. Discovered during Epic 3A, not fixed (would require reopening
   Epic 2's frozen schema/tests without being asked). See
   [EPIC-03A-LESSONS-LEARNED.md §1](docs/epics/EPIC-03A-LESSONS-LEARNED.md#1-a-real-disclosed-gap-found-in-epic-2-adminuseremail-isnt-store-scoped).
   **Recommended**: a small, dedicated fix pass before Login/JWT lands.
2. ~~Product's Active-status publish gate is incomplete~~ — **closed in
   Epic 3B.** `ProductPolicy.assertReadyForActive()` now enforces "≥1
   variant, ≥1 cover image" for real.
3. ~~Product Visibility still doesn't account for stock~~ — **stock now
   exists (Epic 4), but the wiring is still open.** Inventory (Warehouse/
   VariantStock/reservations) is fully built, but `Product.isVisibleInCatalog()`
   remains `status === 'ACTIVE'` only — it doesn't yet query availability.
   This was deliberately left for whichever epic first needs to show a
   real "Sold Out" state end-to-end (likely alongside Checkout/PDP work),
   since Epic 4's own scope was the Inventory bounded context itself, not
   Catalog's consumption of it.
4. **`ProductMedia.url` is a plain string, not backed by a real upload
   pipeline.** Architecture v2 specifies a `MediaStoragePort`/
   `CloudinaryAdapter` (per
   [04-SAAS-EXTENSION-POINTS.md](docs/v2/04-SAAS-EXTENSION-POINTS.md)) for
   actual file storage; this epic's scope was the Media _domain_
   (ordering, cover flag, alt text, video vs. image), not the upload
   mechanism. A future epic supplying real Cloudinary URLs to this same
   `url` field needs no schema change — the field already expects a
   fully-formed URL.
5. ~~`ProductVariant` has no stock field~~ — **closed in Epic 4.** Stock
   lives in a `VariantStock` join table (keyed by `variantId` +
   `warehouseId`, per [ADR 0014](docs/v2/adr/0014-warehouse-scoping-and-single-warehouse-model.md)),
   not a scalar on `ProductVariant` — deliberately, so multi-warehouse
   support later needs no schema change.
6. ~~`ExpireStockReservationsUseCase` has no scheduled caller yet~~ —
   **closed in Epic 11.** `JobsSchedulerService` registers it as a BullMQ
   repeatable job (every 60s, via the `maintenance` queue on `za-worker`),
   per ADR 0003 — `jobId`-keyed so re-registration on every worker boot
   stays idempotent.
7. ~~Inventory Reservations have no caller yet~~ — **closed in Epic 5.**
   `PlaceOrderUseCase` now calls `CreateStockReservationUseCase`/
   `ConfirmStockReservationUseCase` for real at checkout submission, and
   `CancelOrderUseCase` calls `ReleaseStockReservationUseCase`/
   `ProcessReturnUseCase` on cancellation — the full ADR 0001 lifecycle
   is exercised end-to-end from a real purchase flow, integration-tested
   against real Postgres including a concurrency proof.
8. **This repo's dev-server launch configuration lives outside this
   project.** `.claude/launch.json` (the local dev-preview tooling config)
   is read from a sibling directory's workspace, not from this repo —
   discovered when wiring up a preview for the Epic 5 API server. Fine
   for day-to-day development (explicitly left as-is by the user), but
   **before production, each project must become completely
   self-contained, including its own launch configuration** — this repo
   should not depend on any file living outside its own directory tree.
9. ~~Customer accounts don't exist~~ — **closed in Epic 8.** `Order`
   gained a nullable `customerId` ([ADR 0018](docs/v2/adr/0018-customer-accounts.md)
   §2), additively — `Cart` intentionally did _not_ gain one; guest and
   customer carts are unified instead via `Customer.cartToken` (see
   item 20 below).
10. ~~Payments, Shipping, and Coupons are flat placeholder fields, not
    real bounded contexts~~ — **Payments and Shipping closed in Epic 12.**
    `CARD` is now processable via real Stripe Checkout, `COD` and Manual
    remain; `Order.shippingFee` is now a real computed rate from Shipping
    Zones/Methods/Rates, not a flat constant. **Coupons is still open**
    ([ADR 0015](docs/v2/adr/0015-guest-checkout-and-minimal-order-dependencies.md)
    §2) — `Order.discountTotal` still stays `0` with no `couponId` column
    at all; a future epic's migration is additive against `Order`.
11. **The Returns request/approval workflow isn't built** — `RETURNED` is
    a reachable, legal status in `OrderPolicy`'s state machine, but the
    docs/product/07-ORDERS.md return-window (14-day)/reason-code/
    auto-approval workflow around actually reaching it is deferred to a
    future Returns epic, the same shape of disclosed gap as Epic 4
    shipping `DAMAGED`/`RETURN` stock movements without the surrounding
    return-request UX.
12. ~~`TemporaryAdminGuard` only enforces 401, never 403~~ — **closed in
    Epic 7.** `JwtAuthGuard` + `PermissionGuard` replace it entirely;
    every previously-guarded endpoint now enforces a real permission via
    `CheckPermissionUseCase`. See
    [ADR 0017](docs/v2/adr/0017-authentication-and-authorization.md) §7.
13. **No customer-facing "track my order" endpoint** — guest orders have
    no session/account to verify ownership against, so `GET /v1/orders/:id`
    stays staff-only (guarded). Needs either Customer Accounts or a
    signed-lookup-token design before a guest can safely view their own
    order.
14. ~~No `GET /v1/catalog/collections` (list all collections)~~ —
    **closed in Epic 9.5.** `GET /catalog/storefront/collections`
    (`ListPublicCollectionsUseCase`) now exists, filtered to
    `isCurrentlyLive()`. The admin-facing `catalog/collections` base
    path still has no list-all route of its own (not needed — the admin
    UI's own disclosed gap from Epic 9 can now call the public one).
15. ~~No public catalog-browsing surface exists at all~~ — **closed in
    Epic 9.5.** `ADR 0020` found (while scoping Epic 10) that the
    general product list/single-product/detail reads are all
    `PRODUCTS_VIEW`-guarded by design, with only three fixed curated
    shelves and per-collection product arrays public. `ADR 0021`
    closes this: `GET /catalog/storefront/products` (list/search/
    filter/sort, ACTIVE-only), `.../products/:slug` and `.../:slug
/detail` (single product + full PDP payload — variants/media/
    specifications/related/cross-sell/up-sell in one call),
    `.../products/:productId/variants` (standalone variant read), and
    `.../collections`/`.../collections/:id/products` (item 14). Every
    route is additive, reuses existing use-cases, and changes no
    admin-guarded endpoint's behavior — see
    [ADR 0021](docs/v2/adr/0021-public-catalog-read-api.md).
16. ~~No email is ever sent by Auth~~ — **closed in Epic 11 for password
    reset.** `RequestPasswordResetUseCase` now also writes an outbox event
    that `za-worker` relays into a real email via the Notifications module
    (Mailpit in dev, real SMTP in production). The dev-only `revealToken`
    stand-in ([ADR 0017](docs/v2/adr/0017-authentication-and-authorization.md)
    §4) is left in place, unused in production, as a convenience. Password-
    changed confirmations and login-lockout alerts remain unsent — no
    outbox event is written for either yet, since neither was in Epic 11's
    fixed 5-notification-type scope ([ADR 0024](docs/v2/adr/0024-notifications.md)).
17. **Login rate limiting is IP-based and in-memory, not per-account with
    an alert email** — a deliberate simplification of
    docs/product/01-AUTHENTICATION.md's "5 failed attempts locks the
    account for 15 minutes" rule (ADR 0017 §6), for the same reason as
    item 16. It also doesn't coordinate across multiple API instances;
    fine today (single instance), but a future scaling epic needs a
    shared (Redis) throttler store — `REDIS_URL` is already provisioned
    by Docker Compose (since Epic 1) and still has no real consumer.
18. **MFA (Super Admin/Manager) isn't built** — explicitly out of Epic
    7's scope; docs/product/01-AUTHENTICATION.md frames it as a distinct
    verification step layered after password login, best scoped as its
    own follow-up now that base login exists.
19. ~~Customer authentication doesn't exist~~ — **closed in Epic 8.**
    `Customers` module has its own registration/login/logout/refresh
    with independent JWT secrets, deliberately kept separate from staff
    `AdminUser` authentication ([ADR 0018](docs/v2/adr/0018-customer-accounts.md)
    §1).
20. **Customer auth has a narrower scope than staff auth** — no session
    list/revoke, no login history, no password-reset flow for
    customers, matching Epic 8's named scope of just "Registration"/
    "Login" ([ADR 0018](docs/v2/adr/0018-customer-accounts.md) §2). A
    future follow-up would extend `CustomerAuthGuard`'s surrounding
    use-cases the same way Epic 7 built out staff auth's session
    management, rather than duplicating that work now.
21. **Guest order association is a backfill, not real-time linking** —
    `Order.customerId` is set via an email-match `updateMany` at
    register/login time, not while an already-logged-in customer is
    checking out ([ADR 0018](docs/v2/adr/0018-customer-accounts.md) §4).
    `PlaceOrderUseCase` itself is untouched and still fully guest; a
    customer who checks out while logged in gets their order linked
    only at their _next_ login, not immediately. A future epic could
    thread the current customer's id through checkout directly.
22. **Wishlist "Sold Out" status doesn't check real stock** — items are
    flagged only by `Product.status !== 'ACTIVE'`, not per-variant
    `VariantStock` availability, since Inventory wasn't named for reuse
    in Epic 8's business rules (only Orders and Catalog were) — the
    same shape of gap as item 3 above, and would naturally close
    alongside it.
23. **No account anonymization/deletion** — `docs/product/00-OVERVIEW.md`-
    adjacent data-retention concerns (GDPR-style "right to be
    forgotten") aren't addressed; deleting a `Customer` row today would
    cascade or null out related rows per the schema's `onDelete`
    settings, but no use-case exposes this, and no anonymization-on-
    delete design exists. Deferred to a future compliance-focused epic.
24. **No Dashboard/analytics/stats endpoint** — discovered building Epic
    9's admin Dashboard page; `PERMISSION_KEYS.ANALYTICS_VIEW` is seeded
    (Epic 2) but never enforced by any route. The admin Dashboard
    composes its stat cards client-side from existing list endpoints'
    `meta.total` (several requests standing in for one aggregate query)
    and has no customer-count stat at all, since item 25 below means no
    endpoint can produce one ([ADR 0019](docs/v2/adr/0019-admin-dashboard-frontend.md)
    §4).
25. **No "list all X" endpoint for Collections, Customers, or
    already-moderated Reviews** — `GET /v1/catalog/collections`,
    `GET /v1/customers`, and a full (not just pending) `GET /v1/reviews`
    all don't exist. Item 14 above already covers Collections
    specifically; Customers and Reviews are the same shape of gap,
    discovered again while building Epic 9's admin UI for each. The
    admin app works around all three with a lookup-by-ID (Collections,
    Customers) or moderation-queue-only (Reviews) page rather than a
    real table — see ADR 0019 §4.
26. **No Store/Settings controller exists at all** — `Store` is
    resolved server-side, read-only, from a single seeded row;
    `PERMISSION_KEYS.SETTINGS_MANAGE` is seeded (Epic 2) but never
    enforced by any route. Epic 9's admin Settings page is a disclosed
    placeholder, not a form that would silently fail to persist (ADR
    0019 §4).
27. **No `/auth/me/permissions` (or equivalent) endpoint for staff** —
    unlike customers (`/customers/me/*`), a logged-in admin has no way
    to discover their own effective permission set; `GET
/identity/roles/:id/permissions` itself requires `USERS_MANAGE`,
    which most roles don't have. Discovered building Epic 9's sidebar:
    every nav item is always rendered, and a real `403 FORBIDDEN` per
    page is the actual access gate, rather than the design system's
    stated "item simply absent" ideal ([ADR 0019](docs/v2/adr/0019-admin-dashboard-frontend.md)
    §3) — a real security boundary either way, just not what the design
    doc originally pictured.
28. **`sitemap.xml` has no `lastModified` for products, categories, or
    collections** — only CMS page entries do. None of the Catalog module's
    public response DTOs (`ProductResponseDto`/`CategoryResponseDto`/
    `CollectionResponseDto`) expose `updatedAt`, and Catalog is frozen;
    Epic 11 chose to omit the field for these entries (`MetadataRoute
.Sitemap`'s `lastModified` is optional) rather than touch a frozen
    module's DTOs for a non-essential SEO signal. A future epic adding
    `updatedAt` to those DTOs (a small, additive change) would close this.
29. **No real carrier integration for Shipping labels** — `createLabel()`
    on `ShippingProviderPort` is a placeholder (Manual provider only,
    generates a fake tracking URL); no real carrier API (Aramex, DHL,
    etc.) is called. Named, disclosed future work in
    [ADR 0027](docs/v2/adr/0027-shipping.md) — the abstraction exists
    specifically so a real provider slots in without touching
    `DispatchShipmentUseCase` or anything above the port.
30. **Two pre-existing storefront E2E tests fail for reasons unrelated to
    Payments/Shipping**, found while running the E2E suite live for the
    first time this session (item 32 below) — not fixed, since both
    predate and are outside Epic 12's scope: the wishlist test
    (`account.spec.ts`) times out because seeded product images point at
    `images.za-store.local`, a placeholder hostname that's never resolved
    locally (present since Epic 3B's seed data, `apps/api/prisma/seed.ts`);
    the shop-search test (`browsing.spec.ts`)'s
    `getByRole('heading', {name:'Shop'})` collides with the footer's
    identical-text "Shop" column heading (present since Epic 10,
    `site-footer.tsx`).
31. **One pre-existing admin E2E test fails for an unresolved reason** —
    `products.spec.ts`'s "creates a new product" test fills the form
    correctly (confirmed via the failure snapshot) but the page never
    navigates to the created product's detail view within the test's
    timeout. Not root-caused in the time available; isolated (doesn't
    block any other test), and the underlying Products feature is
    unchanged by Epic 12. Worth a dedicated look before the next epic
    that touches Products.
32. ~~The Playwright E2E suites had never been executed end-to-end in
    this environment~~ — **closed this session (Epic 12).** Docker was
    reliably available for the first time, and both suites were run for
    real against the live stack (not just `--list`-verified). Doing so
    surfaced four real, previously-undetected bugs, three of them
    pre-existing and unrelated to Payments/Shipping: a hydration-mismatch
    bug in `packages/ui`'s `ToastProvider` (frozen since Epic 9) that
    broke every interactive element on first render in the admin app; the
    admin login page's fragile `disabled={!isValid}` gate (frozen since
    Epic 9); and the admin topbar's duplicate per-page `<h1>` (frozen
    since Epic 9), all fixed as minimal, disclosed, behavior-preserving
    changes — see the Epic 12 changelog entry for detail. This is strong
    evidence that Epic 9/10's own "Playwright E2E for critical flows"
    completion claims were verified only by static listing, not a live
    run, in every prior session.
33. **The ZA Identity System's own primary language (Arabic, RTL) isn't
    implemented** — the client-supplied brand identity book Epic 13.1
    implemented ([ADR 0029](docs/v2/adr/0029-za-identity-system-rollout.md))
    is itself written Arabic-first, RTL-primary, English-secondary. Epic
    13.1's scope was explicitly the visual system only (colors, logo, type,
    motion) on the existing English/LTR storefront; the book's Arabic copy
    was used as design-decision documentation, not rendered. Real
    implementation needs an i18n library, an RTL layout audit across every
    existing page, and — the larger piece — a database schema change, since
    `Product`/`Category`/`Collection`/`CmsPage` have no translated-content
    fields at all today.
34. **The "Dress-Up" experience is still the Epic 13 abstract-placeholder
    system, not real character illustration** — a follow-up brief (Epic
    13.2) asked for 10 reusable characters with real per-color garment
    overlays, matching a client-supplied bespoke character-illustration
    reference ("Rose"). Evaluated and explicitly deferred: this needs an
    actual illustration/art-production pipeline (a human illustrator, or a
    dedicated image-generation tool with consistent-character capability)
    to produce 10 characters × every product color variant as real assets
    — not something achievable through code, and no such tool was
    available this session. `DressShowcase`/`CharacterCard` keep their
    existing organic-blob-plus-icon placeholder art by explicit decision
    rather than a lower-fidelity fake.
35. **`apps/storefront`'s `lint` task is currently blocked by live,
    recurring local environment corruption, not a code issue** — a
    transitive ESLint dependency (`safe-regex-test`, required via
    `eslint-plugin-react` → `is-symbol`) reverts to a corrupted
    `safe-regex-test(2)` duplicate directory within seconds of being
    manually fixed, reproduced 3 times in a row during Epic 13.3 with no
    build process even running in between. `apps/api`'s dev server also
    independently crashed on a corrupted `lodash.isinteger` copy, and the
    storefront production build hit a genuinely missing `zod` helper file
    — both fixed this pass, but the `safe-regex-test` one would not hold.
    `Get-MpPreference` confirms Windows Defender real-time protection is
    enabled on this machine; exclusion list isn't viewable without admin.
    **Recommended**: an admin adds a Windows Defender (or other real-time
    AV) exclusion for the project's `node_modules` folder — a session
    without admin rights cannot apply this permanently. Every other
    quality gate (type-check/test/build, all packages) is unaffected and
    passes clean.

## Open items for the next epics

- A follow-up to fix a real, disclosed a11y issue found while writing
  Epic 10's component tests: the storefront's `ProductCard` renders its
  wishlist toggle `<button>` nested inside the card's own navigation
  `<Link>` (`apps/storefront/src/features/products/components
/product-card.tsx`) — invalid HTML (interactive-in-interactive), fails
  WCAG 4.1.2. Needs restructuring so the button is a sibling of the
  link, not a descendant; flagged as a background task, not fixed inline
  during the epic since it wasn't part of the epic's own scope.
- A follow-up for a real gap Epic 10 had to work around rather than
  fix: guest checkout has no order-lookup endpoint, so the confirmation
  page only works immediately after placing the order (read from the
  React Query cache) — a hard refresh loses it. A `GET /checkout/orders
/:id` (or similar, scoped to the placing session/guest token) would
  close this properly.
- Fix item 1 above (Identity storeId scoping).
- Fix item 3 above (wire Catalog's Product Visibility to real Inventory
  availability, now that Inventory exists).
- Fix item 4 above (`MediaStoragePort`/Cloudinary adapter — real image
  uploads instead of admin-supplied URLs).
- ~~A job-scheduler epic (per ADR 0003) to actually invoke
  `ExpireStockReservationsUseCase` on a schedule~~ — **closed in Epic 11**
  (item 6 above), alongside the rest of ADR 0002/0003's implementation.
- ~~Payments, Shipping~~ — **closed in Epic 12** (item 10 above), each
  replacing one of Epic 5's flat placeholder fields with a real bounded
  context. **Coupons is still open** — `Order.discountTotal` stays `0`
  with no `couponId` column at all; a future epic's migration is
  additive against `Order`, same shape as Payments/Shipping's own.
- Real carrier integration for Shipping labels (item 29 above) —
  `ShippingProviderPort.createLabel()` is a placeholder; the abstraction
  exists specifically so a real provider (Aramex, DHL, etc.) slots in
  without touching `DispatchShipmentUseCase`.
- A Returns epic (item 11 above) — the request/approval workflow around
  the already-legal `DELIVERED → RETURNED` transition.
- Search Engine (the `tsvector` projection sketched in v1, explicitly
  excluded from every Commerce Core epic so far).
- ~~Reviews~~ — **closed in Epic 8**, alongside Wishlist, Addresses,
  Order History, and Guest Cart Merge/Order Association.
- ~~Small Catalog follow-ups: a `ListCollectionsUseCase` + endpoint, and
  a public product-detail-by-slug endpoint~~ — **closed in Epic 9.5**,
  alongside the rest of the public catalog-browse surface (items 14/15
  above).
- A small follow-up: retire or fix the older `GET /catalog/collections
/:id/products` (public since Epic 3A/6, only excludes `ARCHIVED`, not
  `DRAFT`) now that the correct, `ACTIVE`-only
  `GET /catalog/storefront/collections/:id/products` exists — left
  deliberately untouched in Epic 9.5 per "keep admin endpoints
  unchanged" (`ADR 0021` §3). Also worth revisiting: Epic 9's admin
  Collections page (disclosed gap — no list-all, lookup-by-ID only)
  could now call the new public `GET /catalog/storefront/collections`
  for a real index, without any backend change.
- ~~A Notifications epic~~ — **closed in Epic 11** for password-reset
  email specifically (item 16 above); password-changed confirmations and
  login-lockout alerts still have no outbox event wired to them (a small
  follow-up, not a new epic — the Notifications infrastructure now exists,
  it just needs two more event types added to
  `DispatchNotificationEventUseCase`'s routing table). Login rate limiting
  is still IP-based, not per-account with an alert (item 17 above),
  unaffected by this epic.
- MFA for Super Admin/Manager logins (item 18 above).
- A follow-up to extend customer auth with session list/revoke, login
  history, and password reset, matching staff auth's depth (item 20
  above) — and to expose guest order-tracking (item 13 above) now that
  a logged-in customer session exists to verify ownership against.
- A follow-up to thread the current customer's id through checkout
  directly, replacing the login-time backfill with real-time order
  association (item 21 above).
- Wire Wishlist's "Sold Out" status to real Inventory availability
  (item 22 above), naturally alongside fixing item 3.
- A compliance-focused epic for account anonymization/deletion (item 23
  above).
- A scaling epic to move rate limiting from in-memory to a shared
  Redis-backed store once the API runs as more than one instance (item
  17 above) — `REDIS_URL` is already provisioned, unconsumed since
  Epic 1.
- Close Epic 9's disclosed backend gaps, each unblocking a fuller admin
  page without any frontend rework: a Dashboard/stats endpoint (item 24
  above); list-all endpoints for Collections/Customers/Reviews (item 25
  above); a real Store/Settings controller (item 26 above); a
  `/auth/me/permissions` endpoint enabling real role-aware nav hiding
  per the design system's original intent (item 27 above).
- ~~Run the Playwright E2E suites for real once Docker/Postgres access is
  available~~ — **closed in Epic 12** (item 32 above); doing so surfaced
  and fixed 3 pre-existing bugs unrelated to Payments/Shipping. Two
  further pre-existing, unrelated E2E failures remain disclosed and open
  (item 30: storefront wishlist/shop-search tests; item 31: admin
  "creates a new product" test) — worth a dedicated look, not urgent
  enough to block any future epic.
- Add `updatedAt` to Catalog's public `Product`/`Category`/`Collection`
  response DTOs so `sitemap.xml` can carry a real `lastModified` for every
  entry, not just CMS pages (item 28 above).
- Two more Notification event types (password-changed confirmation,
  login-lockout alert) — the infrastructure exists as of Epic 11, only the
  routing-table entries in `DispatchNotificationEventUseCase` and their
  outbox-write call sites are missing (item 16 above).
- A full Arabic/RTL localization epic (item 33 above) — implementing the
  ZA Identity System's own primary language: an i18n library, an RTL layout
  audit across every existing page, and a database schema change for
  translated `Product`/`Category`/`Collection`/`CmsPage` content, none of
  which exists today.
- A character-illustration asset-production epic for the Dress-Up
  experience (item 34 above) — 10 reusable characters × every product
  color variant as real illustrated garment-overlay assets, matching the
  client's "Rose" reference art. Needs an illustrator or a dedicated
  consistent-character image-generation pipeline; `DressShowcase`/
  `CharacterCard`'s component architecture is already built to swap real
  assets in without a rewrite once they exist.

## Where to look for detail

- **Architecture**: `docs/01`–`16` (v1), `docs/v2/00-OVERVIEW.md` and
  `docs/v2/adr/*` (v2 — the ADRs are short and each names exactly what
  they replace; `0022` is the most recent, defining Epic 10's storefront
  frontend architecture; `0021` defines Epic 9.5's public catalog read
  API that unblocked it; `0020` documents the original gap that made
  Epic 10 pause the first time).
- **Product behavior**: `docs/product/00-OVERVIEW.md` and the 24 module
  specs under `docs/product/`.
- **API surface**: Swagger UI at `/v1/docs` when the server is running
  (non-production only) — every controller, DTO, and response shape
  built so far, auto-documented from existing TypeScript types. Get a
  token via `POST /v1/auth/login`, then use `Authorization: Bearer
<accessToken>`.
- **Per-epic detail**: `docs/epics/EPIC-01-*.md`, `EPIC-02-*.md`,
  `EPIC-03A-*.md` — each has a Completion Report, Architecture
  Compliance report, Test Summary, and Database Migration Summary; Epic
  3A additionally has a Lessons Learned report. Epics 3B, 4, 5, 6, 7, 8,
  9, 9.5, and 10 all scoped their own deliverables down to this file, the
  changelog, and a chat completion summary — no separate
  `EPIC-03B-*.md`/`EPIC-04-*.md`/`EPIC-05-*.md`/`EPIC-06-*.md`/
  `EPIC-07-*.md`/`EPIC-08-*.md`/`EPIC-09-*.md`/`EPIC-09.5-*.md`/
  `EPIC-10-*.md` reports were requested or written. Epic 10's first,
  paused attempt produced only
  [ADR 0020](docs/v2/adr/0020-storefront-release-paused-catalog-read-gap.md);
  its resumed, completed attempt produced
  [ADR 0022](docs/v2/adr/0022-storefront-frontend-architecture.md).
- **What changed, when**: [CHANGELOG.md](CHANGELOG.md).
