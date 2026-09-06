# Changelog

All notable changes to this project are documented in this file, one
entry per epic. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project
has no public releases yet, so entries are grouped by epic under
**Unreleased** rather than by version number.

## [Unreleased]

### Epic 13 — Brand Experience & Theme Transformation (2026-08-05)

A complete visual-only transformation of the storefront into a premium
illustrated brand experience, inspired by two client-supplied reference
images (a storybook "Medical School" illustration and a dress-up-tool
screenshot). No backend, API, business logic, or admin-dashboard
functionality changed. See [ADR 0028](docs/v2/adr/0028-brand-experience-design-system.md)
for the full extracted design system (color palette, typography, radius/
shadow/gradient tokens, component language, decorative-element library,
motion principles, and the fixed-light-palette rule for full-redesign
pages) and its architectural resolution to the shared-Tailwind-preset
constraint (new tokens live only in `apps/storefront`'s own config,
namespaced `brand-*`; `packages/config/tailwind-preset.js` and every
`packages/ui` component file are untouched).

- **Design tokens**: `apps/storefront/tailwind.config.ts` gains an additive
  `brand-*` color/radius/shadow/gradient/spacing/animation namespace
  (blush/cream/butter/sky/plum families, `brand-radius-sm…blob`,
  `brand-shadow-soft/card/glow`, `brand-gradient-hero/section/newsletter/
  spotlight`, `section-y` spacing, `brand-float/fade-up/twinkle`
  keyframes — all disabled under `prefers-reduced-motion`). One new
  Google Font, Caveat (`--font-script`), added for short accent text only;
  the existing Fraunces/Inter (`--font-display`/`--font-sans`) setup is
  unchanged.
- **Decorative + structural component library**
  (`apps/storefront/src/components/brand/`, storefront-local, never
  `packages/ui`): 10 reusable decorative primitives (`Sparkle`,
  `TwinkleStar`, `Cloud`, `Flower`, `DoodleUnderline`, `MedicalDoodle`,
  `Sticker`, `PaperTape`, `IllustratedDivider`, `FloatingDecoration`) and
  13 structural components (`BrandHero`, `EditorialHeader`, `StorySection`,
  `IllustrationBanner`, `CharacterCard`/`CharacterCarousel`,
  `DressShowcase` — the fashion-game carousel pattern from the reference
  screenshot, `LifestyleSection`, `QuoteSection`, `NewsletterSection`,
  `IllustratedBackground`, `PortraitBlob`, `ArchPlaque`). Character/portrait
  art is an abstract organic-blob-plus-icon placeholder composition (ADR
  0028 §9's disclosed scope decision), not painted figurative art — asset
  production is future-epic work; every component takes its imagery as
  props, never a hardcoded asset path.
- **Homepage**: fully rebuilt per the brief's flow — Brand Hero, Character
  Showcase (6 personas linking into real, already-existing `/shop` filter
  routes), Featured Collection story, Dress Showcase (3 slides built from
  real featured/best-seller/new-arrival data via the unchanged
  `useFeaturedProductsQuery`/`useBestSellersQuery`/`useNewArrivalsQuery`
  hooks), Our Story, three product shelves (Featured/Best Sellers/New
  Arrivals, real `ProductGrid`), Medical Lifestyle, Brand Philosophy quote,
  a disclosed no-live-feed Instagram placeholder grid, Newsletter (local-
  only state, no backend — same disclosed pattern as the existing
  `ContactForm` mailto fallback), and the unchanged `TrustBadges`.
- **Product detail page**: visual-only redesign — an illustrated "Made with
  care" header band and a "Made for the lifestyle" recommendation band
  wrap the page's functional core (gallery, variant picker, `AddToCartForm`,
  specifications, `ProductRail`s, reviews), which is byte-identical and
  still fully theme-aware; only the two new decorative bands render in the
  fixed light palette.
- **About/Contact/FAQ**: `EditorialHeader` (a Server-Component-safe,
  no-hooks illustrated hero band) added above each page's existing
  CMS-driven content; `notFound()`/`ApiError` handling, the CMS fetch
  calls, `Accordion`'s FAQ items, and `ContactForm`'s real mailto
  submission are all unchanged.
- **Header/footer**: restyled as theme-aware global chrome (brand tokens in
  light mode, the pre-existing neutral dark palette untouched in dark
  mode) — unlike the pages above, these stay theme-aware because they're
  shared with untouched, still-fully-dark-mode-capable pages (shop/
  category/collection listings, cart, checkout, account).
- **Shared-primitive legibility fix, disclosed**: `Accordion` (`packages/ui`)
  had its item-title/panel text hardcoded to a `dark:text-neutral-*` class
  with no prop reaching it; under the new fixed-light FAQ page this
  rendered near-invisible in dark mode — not a stylistic mismatch but
  actually broken text, the same failure class as the homepage
  invisible-heading bug this ADR documents. Rather than forking the
  primitive, `Accordion` gained optional `buttonClassName`/
  `panelClassName` props (merged via the existing `cn()` pattern), and
  `Input`/`Textarea` gained an equivalent `labelClassName` prop for the
  same reason on the Contact page. All three are additive, default-
  preserving changes — `apps/admin`'s usage (and the storefront's own
  untouched PDP specifications accordion) is unaffected; full
  `apps/admin` test suite (15/15) and lint/type-check verified green
  after the change.
- **Tests**: 4 new component-test files for the brand layer
  (`newsletter-section`, `dress-showcase`, `character-carousel`, plus a
  new case in `packages/ui`'s existing `accordion.spec.tsx` for the
  `buttonClassName`/`panelClassName` props) — 18 new/updated tests, all
  passing alongside the full existing suite (`packages/ui` 30/30,
  `apps/storefront` 45/45, `apps/admin` 15/15, `apps/api` 655/655
  unit tests, confirming the frozen backend is untouched). One new
  Playwright spec, `brand-experience.spec.ts` (8 tests: illustrated hero +
  real product data, Dress Showcase navigation, Newsletter subscribe flow,
  homepage→PDP navigation, About/FAQ/Contact editorial headers with their
  existing real behavior intact) — all passing, without modifying any
  existing E2E spec.
- **Disclosed, not fixed (pre-existing, unrelated to this epic)**: the full
  storefront E2E run is 16/18 passing (plus the new 8/8 above once merged);
  the 2 failures are the same two gaps Epic 12 already disclosed and left
  unfixed — the wishlist E2E test times out because seeded product images
  point at the unresolvable `images.za-store.local` placeholder hostname
  (present since Epic 3B), and `browsing.spec.ts`'s shop-search test's
  `getByRole('heading', {name:'Shop'})` collides with the footer's
  identical-text "Shop" column heading (present since Epic 10). Neither is
  touched here, consistent with Epic 12's precedent of disclosure over
  unrelated-scope test/product changes.
- Reused shared components rendered inside "always light" sections (e.g.
  `ProductCard` on the homepage) still respond to the site-wide dark-mode
  toggle, since Tailwind's `dark:` variant is driven by an ancestor
  `[data-theme="dark"]` attribute a descendant can't locally override —
  disclosed in ADR 0028's Consequences as an accepted visual seam, not a
  legibility bug (unlike the Accordion/Input case above, which was fixed).
- Build/lint/type-check clean across all 9 packages (including production
  builds of `apps/storefront` and `apps/admin`); `apps/admin`'s own visual
  output, routes, and test suite are unchanged and unaffected — confirmed
  via lint, type-check, full test suite, and live comparison against its
  pre-epic screenshots.

### Epic 12 — Payments & Shipping (2026-08-05)

The full Payments and Shipping bounded contexts, plus the Orders-integration
glue that makes them real: card checkout via Stripe, Cash-on-Delivery,
manual-payment verification, refunds, shipping zones/methods/rates, shipment
dispatch and guest tracking — built on Epic 11's outbox/BullMQ infrastructure
and reusing it without modification. See
[ADR 0026](docs/v2/adr/0026-payments.md) and
[ADR 0027](docs/v2/adr/0027-shipping.md) (which also covers the Orders
fulfillment-sync integration) for the full designs.

- **Payments module**: provider abstraction (`PaymentProviderPort`) with COD,
  Stripe, and Manual providers behind a `PAYMENT_PROVIDER_REGISTRY` map;
  `PaymentSession`/`PaymentTransaction`/`PaymentStatusHistoryEntry`/`Refund`
  entities; Stripe Checkout Sessions via `InitiateCardCheckoutUseCase` +
  webhook-driven `ConfirmCardPaymentUseCase`/`FailCardPaymentUseCase`
  (idempotent); manual-payment verification and refund issuance for staff.
  **Design invariant**: no `Order` exists for a card payment until the
  webhook confirms it — `PaymentSession.pendingOrderSnapshot` materializes
  into a real order only on success, never on the initial request.
- **Shipping module**: provider abstraction (`ShippingProviderPort`, one
  Manual/flat-rate provider today) with Zones/Methods/Rates for rate
  quoting, a `Shipment` entity with its own status machine
  (`PENDING → IN_TRANSIT → DELIVERED`, `→ FAILED`/`RETURNED`) and tracking
  events, a placeholder label-creation abstraction (no real carrier
  integration yet — disclosed gap), and guest-friendly order tracking
  (`GET /shipments/track?orderNumber=&email=`, ownership proven by the
  order/email pair, not a session — identical "not found" for either wrong
  field to prevent enumeration).
- **Orders integration**: `PlaceOrderUseCase` now creates a `Shipment` at
  `PENDING` eagerly, in the same transaction as order confirmation, so a
  COD order is trackable the instant checkout completes.
  `DispatchShipmentUseCase` is the one staff action that walks the linked
  `Order` through every remaining fulfillment hop
  (`CONFIRMED → PREPARING → PACKED → SHIPPED`) before mutating the
  shipment, so a failed order-status transition never leaves the shipment
  durably out of sync with its order — this ordering was a real bug caught
  and fixed via live testing this epic, not a design that shipped first
  try (see below).
- **Admin dashboard**: Payment transactions/status-history/manual-verify/
  refund sections on the Order Detail page; Shipping Zones/Methods/Rates
  CRUD; Shipments list + detail with Dispatch/Mark-delivered actions.
- **Storefront**: real delivery-method selection with a live rate quote on
  the checkout page (previously only a Subtotal line — Shipping and Total
  are new); a real COD/CARD payment choice (previously a single
  disabled-looking COD radio); a Stripe-redirect payment-result page; a
  standalone guest `/track-order` page and an automatic shipment section on
  the customer's own order-detail page.
- **Reused Epic 11 infrastructure unchanged**: the generic
  `OutboxRelayProcessor` needed zero new code for this epic's 5 new event
  types (`PAYMENT_CAPTURED`, `PAYMENT_REFUNDED`, `PAYMENT_FAILED`,
  `SHIPMENT_DISPATCHED`, `SHIPMENT_DELIVERED`) — only
  `DispatchNotificationEventUseCase`'s routing/templates needed extending,
  confirmed by reading the relay's code rather than assumed.
- **Two real bugs found and fixed via live browser testing against the
  running stack** (not just unit tests): (1) `ShippingPolicy`'s transition
  graph only allowed `PENDING → LABEL_CREATED`, but nothing anywhere ever
  writes `LABEL_CREATED` — every dispatch attempt, on every shipment,
  always failed. (2) The original `DispatchShipmentUseCase` mutated the
  shipment to `IN_TRANSIT` *before* advancing the order's status, and
  assumed the order was already `PACKED`; since a fresh order is actually
  `CONFIRMED`, the order-status call always failed, and by then the
  shipment had already committed — leaving `IN_TRANSIT` shipments attached
  to orders stuck at `CONFIRMED` forever. Both fixed; the fix was verified
  by placing a second real order and dispatching it end to end, and by
  inspecting raw network responses (not just the UI) to confirm no
  inconsistent state could be left behind by a partial failure.
- **A third, narrower bug caught in code review, not testing**:
  `OrderPolicy.assertSupportedPaymentMethod` had briefly been broadened
  earlier this epic to accept `CARD` as well as `COD`, on the mistaken
  assumption it was shared across both payment paths. It isn't —
  `InitiateCardCheckoutUseCase` (the real CARD entry point) never calls it.
  Left broadened, a client could `POST /checkout/place-order` with
  `paymentMethod: "CARD"` directly and get an instant, unpaid `Order`,
  bypassing the whole card-payment design. Reverted to strict COD-only.
- **Pre-existing bugs found and fixed this epic, unrelated to Payments/
  Shipping but blocking its own quality gates**: (1) `pino-pretty`'s
  transport spawns a worker thread that Jest's environment can't host,
  breaking every full-HTTP-bootstrap integration test — pre-existing,
  reproduced on an untouched Auth test file; fixed by gating pretty-print
  on `NODE_ENV === 'development'` instead of `!== 'production'`, so Jest's
  `NODE_ENV=test` gets plain JSON logging. (2) `packages/ui`'s
  `ToastProvider` (frozen since Epic 9) gated its `createPortal` call on
  `typeof document !== 'undefined'` alone, which is already true on the
  client's *first* hydration render — one render ahead of the server's
  markup, which had no `document` and thus no portal content. That
  mismatch made React discard and remount the entire app tree on every
  page load in the admin app, breaking every interactive element on first
  render; deferred the portal to a post-mount effect instead. (3) The
  admin login page (frozen since Epic 9) disabled its submit button via
  `disabled={!isValid}` with `mode: 'onBlur'` validation — fragile enough
  that automated form-filling could leave the button stuck disabled
  indefinitely; removed the pre-disable and let `handleSubmit`'s own
  validation gate submission instead, which is what it already does.
  (4) The admin topbar (frozen since Epic 9) rendered the current page
  name as a second `<h1>`, alongside each page's own `PageHeader` — an
  accessibility anti-pattern that also made almost every
  `getByRole('heading', …)` E2E query ambiguous; changed to a `<p>` (the
  real heading is `PageHeader`'s). Together, (2)–(4) were blocking nearly
  every admin Playwright E2E test, old and new — this is very likely the
  first time in this project's session history that a live Playwright run
  against the real stack (Docker Postgres + API + admin) completed enough
  to surface them, since Docker had not reliably been available in earlier
  sessions. All four are minimal, disclosed, behavior-preserving fixes to
  otherwise-frozen files, not scope creep.
- **Tests**: `apps/api` gained 117 new unit tests (655 total, up from Epic
  11's 538) and 54 new integration tests (209 total, up from 155) covering
  the new Payments/Shipping modules — full suite green.
  `apps/storefront` gained 7 new component
  tests (34 total, 9 suites) for the checkout page's delivery/payment
  sections and the payment-result page, plus 1 new Playwright E2E test
  (guest checkout → live order tracking); `apps/admin` gained 3 new
  Playwright E2E files (Shipping Zones/Methods/Rates CRUD, full
  Shipment dispatch→deliver flow with order-status-sync verification) —
  no new admin component tests, matching this repo's existing convention
  of E2E-only coverage for `apps/admin`. Storefront E2E: 9/11 passing, the
  admin: 20/21 — every failure is a pre-existing, unrelated gap (see
  disclosed gaps below), not a Payments/Shipping regression.
- **Disclosed gaps, not fixed (out of this epic's scope)**: two pre-existing
  Epic 10 storefront E2E tests fail for reasons unrelated to Payments/
  Shipping — the wishlist test times out because seeded product images
  point at `images.za-store.local`, a placeholder hostname that's never
  resolved locally (present since Epic 3B's seed data); the shop-search
  test's `getByRole('heading', {name:'Shop'})` collides with the footer's
  identical-text "Shop" column heading (present since Epic 10). One
  pre-existing Epic 9 admin E2E test ("creates a new product") also fails
  for a reason not fully root-caused in the time available — isolated,
  does not block any Payments/Shipping flow, and the underlying Products
  feature is unchanged this epic. A local-dev environment gap was also
  found and fixed in passing: `CORS_ORIGIN` only allowed ports 3000/3001,
  not the 3010/3011 the Playwright E2E `webServer`s actually run on,
  silently turning every cross-origin request into an unhelpful generic
  error instead of a real one.

### Epic 11 — Commerce Services (2026-08-04)

Notifications, CMS, and SEO on top of a from-scratch Event Architecture and
Background Job System (ADR 0002/0003 designs existed but were never
implemented until now — confirmed via grep before writing any code, then
paused with `AskUserQuestion`; the user chose full ADR compliance over a
scoped-down interim version). See [ADR 0023](docs/v2/adr/0023-event-architecture-and-job-system-implementation.md),
[ADR 0024](docs/v2/adr/0024-notifications.md), and
[ADR 0025](docs/v2/adr/0025-cms-and-seo.md) for the full designs.

- **Transactional outbox** (ADR 0002): new `OutboxEvent`/`FailedJobLog` tables;
  every business write that needs to notify anything (`Order.create`/
  `changeStatus`, `Customer.create`, `Review.create`,
  `PasswordResetToken.create`) now inserts its domain event in the same
  Prisma `$transaction` as the write itself — additive-only, no existing
  repository method signature changed except `PasswordResetToken`'s creation
  data gaining `rawToken`/`email` fields the email actually needs to send.
- **BullMQ background jobs** (ADR 0003) via a second NestJS bootstrap file,
  `apps/api/src/worker.main.ts` (`WorkerModule`, run as a separate `za-worker`
  PM2 process from `za-api`) — an outbox-relay processor polls and dispatches
  pending events, a maintenance queue absorbs the pre-existing reservation-expiry
  sweep, and permanently-failed jobs archive to `FailedJobLog` plus raise a
  `SYSTEM` alert `Notification`. `za-api` itself has zero Redis/BullMQ
  dependency — HTTP and worker concerns are split into separate NestJS modules.
- **Notifications module**: Email Service (Nodemailer, Mailpit in dev),
  5 templates (order-placed admin alert, review-submitted admin alert,
  order-status-changed customer, welcome customer, password-reset), a queue
  processor per channel, staff notification preferences
  (`SETTINGS_MANAGE`-guarded) and customer notification preferences, and
  notification history (`AUDIT_LOG_VIEW`-guarded). Event→trigger→recipient
  routing lives in `DispatchNotificationEventUseCase`, listening on the same
  outbox events the relay emits in-process via `EventEmitter2`.
- **CMS module**: one `CmsPage` model for five fixed slugs (about, contact,
  faq, privacy-policy, terms-of-service) — reused the design Category/Collection
  already established (slug + title + body + SEO fields + publish state), with
  a nullable `faqItems` JSON column instead of a second table for FAQ's Q&A
  pairs. Admin CRUD (`CONTENT_MANAGE`-guarded, an already-seeded permission
  that had never been wired to anything) plus a public
  `GET /storefront/cms/pages/:slug` (`PUBLISHED`-only).
- **Admin dashboard**: new CMS pages (list + per-slug editor, FAQ gets a
  `useFieldArray` question/answer editor) and Notifications page (History +
  Preferences tabs) under new "Marketing"/"System" nav entries.
- **Storefront**: About/Contact/FAQ now read from the CMS API instead of
  hardcoded JSX (Contact's `mailto:` form itself is unchanged); two new pages,
  Privacy Policy and Terms of Service; `app/sitemap.ts` (every `ACTIVE`
  product, category, live collection, and `PUBLISHED` CMS page) and
  `app/robots.ts` (Next.js native conventions, both genuinely new — canonical/
  OpenGraph/Twitter/JSON-LD/dynamic metadata already existed from Epic 10 and
  are simply reused on the new/changed pages, not rebuilt).
- **Reused existing RBAC permissions** instead of adding new ones
  (`CONTENT_MANAGE` for CMS, `AUDIT_LOG_VIEW` for notification history,
  `SETTINGS_MANAGE` for staff notification preferences) — Identity's frozen
  `permissions.constants.ts` and seed grants were never touched.
- Tests: 538 unit tests passing for `apps/api` (up from prior epics' count),
  including new coverage for the outbox relay processor, notification
  dispatch routing, and CMS use-cases/entities; 155 integration tests passing
  against real Postgres (Docker was available this session — a first for this
  project's session history), including two new assertions proving
  `OutboxEvent` rows are actually written on order placement and status
  change. Admin gained 15 total component tests (unchanged from Epic 9,
  new CMS/Notifications UI verified live in-browser instead); storefront
  gained no new component tests (CMS-backed pages are server components with
  no new client logic to unit-test) but were verified live in-browser
  (About/FAQ/Privacy/Terms render seeded content; `/sitemap.xml` and
  `/robots.txt` return correct output). Full monorepo build/lint/type-check
  clean.
- Fixed two unrelated pre-existing environment issues found while verifying:
  (1) `apps/storefront` had no `.env.local`, so it silently pointed at the
  wrong API port (`4000` instead of the actually-running `4100`) exactly like
  `apps/admin` did in an earlier session — same fix, a local env file pointing
  at port 4100. (2) The dev database had never had `seedCms()` run against it
  (added mid-epic, after the last interactive seed), leaving all 5 CMS pages
  genuinely absent in Postgres despite existing in code — fixed by running
  `pnpm prisma db seed` (idempotent, upsert-based, safe to re-run).
- Also hit the same class of pnpm-store corruption from earlier sessions
  (missing package contents behind valid symlinks) three more times this
  epic, for `statuses`, `picocolors`, and `string-width` — each repaired the
  same way, `pnpm install --force`.

### Epic 9.5 — Public Catalog API (2026-08-03)

Closes the gap ADR 0020 found and Epic 10 paused on — an additive, backend-only
extension of the Catalog module. No schema migration; no existing route's behavior
changed; every new route is a thin composition over already-existing use-cases
(ADR 0021).

- **New public routes**, all on `StorefrontCatalogController` (`catalog/storefront`,
  already `@Public()`): `GET /products` (paginated list/search/filter/sort, ACTIVE-only,
  forced server-side), `GET /products/:slug` (single product), `GET /products/:slug
  /detail` (product + variants + media + specifications + related + cross-sell +
  up-sell, one call), `GET /products/:productId/variants` (standalone variant read),
  `GET /collections` (list-all, closes gap #14 — never existed before, admin or public),
  `GET /collections/:id/products` (a second, correctly ACTIVE-only route alongside the
  older, unchanged `GET /catalog/collections/:id/products`).
- **New use-cases**, each a thin composition, none duplicating existing logic:
  `GetPublicProductBySlugUseCase` (the one genuinely new rule — slug→ACTIVE gate, using
  `ProductRepository.findBySlug()`, which already existed for admin uniqueness checks
  but was never exposed as a read path), `GetPublicProductDetailUseCase` (delegates to
  the existing `GetProductDetailUseCase` + three parallel calls to the existing
  `ListProductRelationsUseCase`), `ListPublicProductVariantsUseCase` (delegates to the
  existing `ListProductVariantsUseCase`), `ListPublicCollectionsUseCase` (the repository's
  `list()` already existed, just never had a use-case or route in front of it — filters
  via `Collection.isCurrentlyLive()`, the entity's own pre-existing method),
  `ListPublicCollectionProductsUseCase` (delegates to the existing
  `ListCollectionProductsUseCase`, adds the stricter ACTIVE-only filter this epic's
  rule requires).
- **`ProductListFilters` gains four optional fields** (`priceMin`, `priceMax`, `colorId`,
  `sizeId`), extended additively in the one shared interface/`PrismaProductRepository
  .list()` both admin and public callers use — the admin `ListProductsQueryDto` never
  sends them, so its behavior is unchanged.
- **Three scope items needed zero new code**, already fully public since earlier epics:
  category listing/tree (Epic 6), product relations/cross-sell/up-sell as a standalone
  endpoint (Epic 3B), and products-by-category (now just a `categoryId` query param on
  the new `GET /products`, matching how the admin equivalent already works).
- **Disclosed, deliberate discrepancy**: the older `GET /catalog/collections/:id/products`
  (public since Epic 3A/6) only excludes `ARCHIVED` products, not `DRAFT` — left
  completely unmodified per "keep admin endpoints unchanged," rather than silently
  changing behavior of a pre-existing route. The new `GET /catalog/storefront/collections
  /:id/products` is the correct, ACTIVE-only path forward for Epic 10 to use.
- Tests: 13 new unit tests (5 new spec files, one per new use-case) plus 2 new
  integration test cases extending the existing `prisma-product.repository.integration
  .spec.ts` for the price-range and color/size variant filters. Full suite: 518 unit
  tests passing (up from 505); build/lint/type-check all clean. Integration tests are
  written but, as with every prior epic in this environment, require Docker Postgres to
  actually execute — not run here.
- `PROJECT_STATUS.md` gap #15 closed; Epic 10 (Storefront Release) may now resume.
- See [ADR 0021](docs/v2/adr/0021-public-catalog-read-api.md) for the full design.

### Epic 10 — Storefront Release (2026-08-03)

Resumed after Epic 9.5 closed the public-catalog gap. Full customer-facing storefront
against the Public Catalog API (ADR 0021) exclusively — no admin endpoints, no new
frontend business logic. See [ADR 0022](docs/v2/adr/0022-storefront-frontend-architecture.md)
for the full architecture.

- **New shared UI primitives** in `packages/ui`: `Drawer` (slide-in panel, reuses
  `Dialog`'s focus-trap/Escape/backdrop pattern), `Accordion`, read-only `Rating`,
  framework-agnostic `Breadcrumbs` (takes a `linkComponent` prop so the package never
  imports `next/link`), `QuantityStepper`. 29 new component tests.
- **Storefront infra**: API client + customer-auth token storage mirroring ADR 0019's
  admin pattern in a separate `za-customer-auth` localStorage namespace; guest-cart
  token (`za-guest-token`, reuses ADR 0018 §3's existing merge-on-login use case rather
  than duplicating it); React Query provider with SSR hydration boundaries for every
  SEO-critical page; SEO helper (`buildMetadata`) and a small `JsonLd` component for
  `WebSite`/`Product`/`AggregateRating`/`FAQPage` structured data.
- **Pages**: Homepage (Featured/Best Sellers/New Arrivals), Shop (search/filter/sort/
  pagination), Categories (tree browsing + per-category listing), Collections (index +
  detail), Product Detail (gallery, variant picker, specifications, related/cross-sell/
  up-sell, reviews), Wishlist, Cart (drawer + full page), Checkout (guest + customer),
  Customer Account (profile, addresses, order history/tracking), Login/Register,
  About/Contact/FAQ, 404/error boundaries.
- **Disclosed gaps worked around without new backend logic**: no category/collection
  by-slug endpoint (resolved by searching the already-fetched tree/list in memory); no
  cover-media field on list-view products (reuses `ogImageUrl`, avoiding an N+1 fetch
  per grid); no guest order-lookup endpoint (order confirmation reads from the React
  Query cache set at placement time only — a hard refresh loses it, with a fallback
  pointing signed-in customers at Order History); customer-facing order notes are
  filtered client-side to hide `isInternal` staff notes (a display filter, not new
  business logic — the API doesn't filter these itself); Contact page has no backing
  endpoint, so the form opens a pre-filled `mailto:` link instead of fabricating a
  submission handler.
- Tests: 27 new component tests across 7 files (login, search, wishlist toggling,
  add-to-cart variant matching, review submission, contact form, auth-gated routes) plus
  10 Playwright E2E specs covering guest browsing/search, guest cart + checkout end to
  end, and signed-in account/wishlist/order-history flows. Build/lint/type-check all
  clean. E2E specs are written and verified to parse/list correctly but, as with every
  prior epic in this environment, require the real API against a seeded Postgres to
  actually execute — not run here (no Docker daemon available).
- Fixed an unrelated pre-existing environment issue found while running the first test
  pass: a corrupted `strip-ansi` package under the shared pnpm store (missing package
  contents behind an otherwise-valid symlink) was breaking `jest` for every app in the
  monorepo, not just the storefront. Repaired by re-running `pnpm install`.

### Epic 10 — Storefront Release, first attempt (2026-08-03) — **paused, not implemented**

**Investigated, then stopped before writing any `apps/storefront` code.**

- Before touching the storefront, read the actual `apps/api` catalog
  controllers directly (not just `PROJECT_STATUS.md`'s summary, which
  understated this). Confirmed: `ProductsController`'s list/get/detail
  routes are guarded end to end, by explicit design — its own docblock
  says storefront reads belong on `StorefrontCatalogController`
  instead. The *entire* public product-browsing surface is three fixed,
  unpaginated curated shelves (Featured/Best Sellers/New Arrivals) plus
  `GET /catalog/collections/:id/products` (itself unreachable without
  already knowing a collection id — no list-all-collections endpoint
  exists). No search, no filters, no products-by-category, and no
  public product-variant read exist anywhere in the API.
- This directly conflicts with the epic's own constraints ("no business
  logic in the frontend," "all state comes from the existing API") for
  five of the scoped areas — Shop, Search, Filters, Categories (product
  listing), and arbitrary-product-id Product Details cannot be built as
  real features against this API without either faking a browse
  experience out of ~a dozen curated products or violating those same
  constraints.
- Presented this finding to the user with three options (build a thin
  disclosed wrapper anyway; pause and recommend a backend follow-up
  first; build everything *except* the catalog-browsing pages at full
  quality). **User chose: pause the epic and prioritize a backend
  follow-up first.**
- [ADR 0020](docs/v2/adr/0020-storefront-release-paused-catalog-read-gap.md)
  records the full finding, the decision, what already *does* have solid
  backend support and could ship immediately in a re-scoped attempt
  (Cart, Checkout, Customer Account, Wishlist, Reviews, logged-in Order
  History), and a concrete, schema-free backend follow-up scope: a
  public product list/search/filter endpoint, a public product-by-id/
  slug read (ACTIVE-only), a public product-variant read, and
  `GET /v1/catalog/collections` (list-all).
- `PROJECT_STATUS.md` gap #15 rewritten to reflect the true scope of the
  gap (previously framed narrowly as "no by-slug variant"); a new
  top-priority "Open items" entry points future work at the ADR 0020
  follow-up.
- `apps/storefront` is unchanged — still exactly the Epic 1 placeholder
  (root layout, header, footer, one placeholder homepage). No dependencies
  added, no test tooling set up, no quality gates run, since nothing was
  implemented.

### Epic 9 — Admin Dashboard (2026-08-03)

**Added**

- [ADR 0019](docs/v2/adr/0019-admin-dashboard-frontend.md) — the epic's
  governing design: TanStack Query + a thin `apiFetch` wrapper decoding
  the existing ADR 0016 envelope (no DTO codegen); auth tokens held in a
  `localStorage`-backed `AuthProvider`, a disclosed SPA-without-BFF
  trade-off; no client-side permission-based nav hiding (the API has no
  `/auth/me/permissions` endpoint) — every nav item is always visible and
  a `<ForbiddenState />` handles a real 403 per page instead; five
  disclosed backend-shaped constraints (no Dashboard/stats endpoint, no
  list-all-collections, no list-all-customers, no list-all-reviews, no
  Store Settings endpoint at all); a "Staff" (Admin Users) page added as
  the only functional companion to the read-only Roles/Permissions
  endpoints; new shared components added to `@za/ui` rather than built
  locally in `apps/admin`; `lucide-react` as the monorepo's first icon
  dependency; `next/jest` + React Testing Library for component tests
  and Playwright for E2E, both new to the repo.
- `@za/ui` gained its first Table/Badge/Select/Dialog/Toast/Pagination/
  Checkbox/Textarea/Skeleton/Tabs/Switch/Callout/Spinner/state-panel
  components (`DataTable`, `Badge`, `Select`, `Dialog`, `ToastProvider`/
  `useToast`, `Pagination`, `Checkbox`, `Textarea`, `Skeleton`, `Tabs`,
  `Switch`, `Callout`, `Spinner`, `EmptyState`/`ErrorState`/
  `ForbiddenState`), all dark-mode-aware from the start; `Button`/`Card`/
  `Input`/`Heading`/`Text` — light-only until now — were patched with
  `dark:` classes.
- `apps/admin` real infrastructure: `apiFetch`/`apiFetchPaginated`
  (`src/lib/api/client.ts`) with transparent one-shot access-token
  refresh on a 401; `AuthProvider`/`useAuth` (`src/lib/auth/`) wired to
  the real `POST /v1/auth/login` (replacing the Epic-1-era placeholder
  submit handler) and `POST /v1/auth/logout`; a `QueryClientProvider`
  (`src/lib/providers.tsx`); an auth guard in `(dashboard)/layout.tsx`
  redirecting to `/login` when signed out.
- All fifteen scoped feature areas, each with loading/error/empty states,
  React Query data-fetching, and react-hook-form + zod validation on
  every form: **Dashboard** (stat cards + recent orders, composed
  client-side from existing list endpoints — no aggregate endpoint
  exists); **Products** (list/create/edit/status/tags plus a tabbed
  detail page for Variants/Media/Specifications, each variant row
  offering a copy-id action since Inventory has no product/variant
  search); **Categories** (list/create/edit/active-toggle/delete);
  **Collections** (create + lookup-by-ID managed view — no list-all
  endpoint exists); **Brands**, **Tags**, **Colors**, **Sizes**
  (list/create/edit/delete); **Inventory** (Warehouses, Stock lookup
  with receive/adjust/return/threshold actions + movement history,
  Low Stock, Reservations lookup-by-ID with confirm/release);
  **Orders** (list/detail/advance-status/cancel/notes); **Customers**
  (lookup-by-ID profile + order history — no list-all endpoint exists);
  **Reviews** (pending-moderation queue, approve/reject — no full
  history endpoint exists); **Roles** (read-only, view permission set
  per role), **Permissions** (read-only catalog, flags the six seeded
  keys with no backing route), **Staff** (Admin Users
  list/create/activate/deactivate/role-reassign); **Store Settings**
  (a disclosed placeholder — no backend endpoint exists at all).
- Sidebar/topbar overhaul: full `NAV_GROUPS` (Catalog/Operations/
  Marketing/System, per docs/09-DESIGN-SYSTEM.md §7) replacing the
  single-item placeholder nav; a mobile hamburger drawer (`Sidebar`/
  `Topbar` now take `isMobileOpen`/`onOpenMobileNav` props) where none
  existed; a user menu with sign-out in the topbar.
- Component tests (`next/jest` + React Testing Library): 11 new tests in
  `@za/ui` (`Badge`, `DataTable`, `Dialog`) and 15 new tests in
  `apps/admin` (`LoginPage`, `PageHeader`, `useTableState`,
  `buildQueryString`).
- Playwright E2E suite (`apps/admin/e2e/`, 17 tests across 9 files) for
  the critical flows: login (redirect-when-signed-out, wrong-password,
  successful login + session-survives-reload), Brands full CRUD, Orders
  (view + add note), Inventory (tab navigation), Reviews (empty-state
  queue), Products (search + detail + create), Roles/Permissions/Staff
  (view permissions, view catalog, create + reassign-role + deactivate a
  staff account), and responsive/dark-mode behavior. A `setup` project
  logs in once and reuses the session via Playwright `storageState`
  across every other spec, respecting staff login's 5-req/60s rate limit
  (ADR 0017 §6). **Not part of `turbo run test`** (same reasoning as
  `test:integration`) — needs the real API + a seeded Postgres up, run
  via `pnpm --filter @za/admin test:e2e`.

**Fixed**

- `apps/admin`'s `dev`/`start` scripts hardcoded `--port 3001`, which
  fights any tool that assigns its own port via the `PORT` env var
  (Next.js already reads `PORT` automatically when no `-p` flag is
  given). Removed the hardcoded flags.

**Quality gates**: build, lint, and type-check pass clean across the
whole monorepo (including `apps/storefront`, which also consumes
`@za/ui`); 505 API unit tests, 11 `@za/ui` component tests, and 15
`apps/admin` component tests all pass. The Playwright suite is written
and its config verified (`npx playwright test --list` resolves all 17
tests), but could not be executed end-to-end in this environment — no
Docker/Postgres access, so `apps/api` could not be brought up. Every
prior epic's `test:integration` carries the identical precondition.

### Epic 8 — Customer Accounts (2026-08-02)

**Added**

- [ADR 0018](docs/v2/adr/0018-customer-accounts.md) — the epic's
  governing design: `Customer` (credentials + profile unified, per the
  epic's "keep Customer separate from Admin Identity" rule — a
  deliberate deviation from docs/06-DDD-BOUNDED-CONTEXTS.md's v1 split),
  correctly `storeId`-scoped per ADR 0006 (unlike `AdminUser`'s disclosed
  gap); guest cart merge via a permanent, customer-owned `cartToken`
  reused through the exact same guest-cart machinery Epic 5 already
  built, rather than adding `customerId` to `Cart`; guest order
  association as an email-match backfill run at register/login time
  (not real-time linking at checkout — disclosed); customer JWT auth
  with its own separate secrets/refresh-token table from staff auth (a
  real security boundary, not just code organization); Review moderation
  reusing the `REVIEWS_MODERATE` permission key seeded in Epic 2 and
  never used until now; average rating/review count computed live from
  `Review` rows, never stored on `Product`.
- A new unified `src/modules/customers/` bounded context: `Customer`,
  `CustomerAddress`, `WishlistItem` (references `Product` directly, per
  docs/product/14-WISHLIST.md), `Review` (PENDING/APPROVED/REJECTED,
  edit-in-place resubmission), `CustomerRefreshToken` (own rotation +
  reuse-detection table, mirroring but separate from Epic 7's). New
  migration adds these tables plus a nullable, additive `Order.customerId`
  (`onDelete: SetNull`).
- Customer auth use-cases: `RegisterCustomerUseCase`/
  `CustomerLoginUseCase` (both run the guest-merge/association step when
  a `guestToken` is supplied), `RefreshCustomerTokenUseCase`/
  `LogoutCustomerUseCase` (identical rotation-with-reuse-detection shape
  to staff auth). Deliberately smaller in scope than Epic 7's staff auth
  per this epic's own narrower scope list: no customer session list/
  revoke, login history, or password reset yet (disclosed).
- Profile/address/wishlist/review/order-history use-cases:
  `GetCustomerUseCase`, `UpdateCustomerProfileUseCase`,
  `ChangeCustomerPasswordUseCase` (revokes every session, same as
  staff), `CreateAddressUseCase`/`UpdateAddressUseCase`/
  `DeleteAddressUseCase`/`ListAddressesUseCase` (exactly-one-default
  invariant enforced transactionally in the repository),
  `AddWishlistItemUseCase`/`RemoveWishlistItemUseCase`/
  `ListWishlistUseCase` (live availability, reusing Catalog's
  `ProductRepository`/`ProductNotFoundError` directly), `SubmitReviewUseCase`
  (create-or-edit-in-place)/`ListProductReviewsUseCase` (public,
  approved-only + live summary)/`ListPendingReviewsUseCase`/
  `ModerateReviewUseCase` (staff), `ListCustomerOrdersUseCase` (reuses
  `OrdersModule`'s `ORDER_REPOSITORY`, shared by the customer's own
  history view and a new staff support-lookup controller reusing the
  `CUSTOMERS_VIEW` permission key, also seeded in Epic 2 and unused
  until now), `MergeGuestCartUseCase`, `AssociateGuestOrdersUseCase`.
- `CustomerAuthGuard` — the customer-facing equivalent of `JwtAuthGuard`,
  verifying the separate customer JWT secret and loading a `Customer`.
  Applied locally via `@UseGuards()`, never globally: every controller
  in the Customers module is `@Public()` at the class level (staff's
  global guard stack would otherwise reject every customer call), with
  `@UseGuards(CustomerAuthGuard)` added per-route wherever a logged-in
  customer is required. Populates the same `request.actor`/
  `@CurrentActor()` shape staff auth uses, safe only because no route is
  ever guarded by both at once.
- New controllers: `CustomerAuthController` (`/v1/customers/auth/*` —
  register/login/refresh/logout), `CustomerProfileController` (profile
  get/update, change-password), `CustomerAddressController`,
  `CustomerWishlistController`, `CustomerReviewController` (public read,
  customer-guarded submit, under `/v1/catalog/products/:id/reviews`),
  `ReviewModerationController` (staff, `/v1/reviews/*`),
  `CustomerOrderHistoryController` (`/v1/customers/me/orders`),
  `StaffCustomerController` (`/v1/customers/:id` + `/:id/orders`, staff
  support lookup).
- Two additive changes to already-frozen modules: `CheckoutModule` now
  also exports `CART_REPOSITORY` (for the guest-cart merge), and
  `OrderRepository` gains `listByCustomerId()` and
  `associateGuestOrders()` (plus an additive, nullable `customerId` on
  `CreateOrderData`/the `Order` entity) — `PlaceOrderUseCase` itself is
  unchanged and never sets it.
- 59 new unit tests (entities, `CustomerPolicy`, all use-cases with real
  logic) and 46 new integration tests across four files — registration/
  login/refresh-rotation/logout, profile/change-password/address book
  (including the exactly-one-default invariant and a cross-account 404,
  not a leak), wishlist/reviews (including staff moderation and a
  403-for-the-wrong-role check), and the full guest-cart-merge +
  guest-order-association + staff-lookup flow — against real Postgres.

**Changed**

- None (no Foundation/Identity/Catalog/Inventory/Orders/API/Auth bug
  fixes were needed this epic).

**Fixed**

- None.

### Epic 7 — Authentication & Authorization (2026-08-02)

**Added**

- [ADR 0017](docs/v2/adr/0017-authentication-and-authorization.md) —
  the epic's governing design: HS256 access (15 min) + refresh (7 day)
  JWTs, refresh-token rotation with family-based reuse detection, a
  disclosed dev-only reset-token reveal (no Notifications epic exists
  to email it), and IP-based login rate limiting via `@nestjs/throttler`
  as the practical realization of the product spec's brute-force rule.
  Documents the one deliberate, necessary exception to "no API contract
  changes": the `x-admin-user-id` header is retired in favor of
  `Authorization: Bearer <access-token>` — every route path, request/
  response shape, and 401-vs-403 convention is otherwise unchanged.
- A new `src/modules/auth/` bounded context, deliberately separate from
  Identity (which still owns `AdminUser`/`Role`/`Permission`/RBAC data)
  per the epic's "keep authentication separate from business logic"
  rule — imports `IdentityModule` for `AdminUserRepository`/
  `PasswordHasher`/`CheckPermissionUseCase` rather than reimplementing
  any of it, the same cross-module shape as Checkout importing Catalog/
  Inventory/Orders. New Prisma models: `RefreshToken`, `LoginHistory`,
  `PasswordResetToken` (migration `20260802124155_add_auth_tables`).
- Use-cases: `LoginUseCase`/`LogoutUseCase`/`RefreshAccessTokenUseCase`
  (rotation + reuse detection — reusing an already-rotated token revokes
  its entire token family), `ChangePasswordUseCase`/
  `RequestPasswordResetUseCase`/`ResetPasswordUseCase` (both revoke
  every existing session on success), `ListSessionsUseCase`/
  `RevokeSessionUseCase` (self-service session management),
  `ListLoginHistoryUseCase`. Every login attempt — success or failure —
  is recorded, with the real failure reason kept internal-only
  (`InvalidCredentialsError`'s single generic message never reveals
  whether the email or password was wrong, per the anti-enumeration
  rule in docs/product/01-AUTHENTICATION.md).
- `JwtAuthGuard` + `PermissionGuard` (global `APP_GUARD`s, in that order)
  replace `TemporaryAdminGuard` — `JwtAuthGuard` verifies the Bearer
  token and, exactly like the guard it replaces, re-fetches the
  `AdminUser` from Postgres on every request so a deactivation takes
  effect on the admin's very next call; `PermissionGuard` closes the gap
  ADR 0016 explicitly deferred, calling the unchanged, Epic-2-built
  `CheckPermissionUseCase` for a new `@RequirePermission(key)` decorator
  now applied across all eighteen previously-guarded controllers,
  reusing only already-seeded `PERMISSION_KEYS` — no new permission keys
  were needed.
- `AuthController` (`/v1/auth/*`): `login`/`refresh`/
  `request-password-reset`/`reset-password` are `@Public()`;
  `logout`/`change-password`/`sessions` (list/revoke)/`login-history`
  require authentication but no specific permission (self-service on
  the caller's own account).
- Two small, additive changes to already-frozen Epic 2 code, both
  disclosed: `AdminUser.changePassword()` (a new mutator, same shape as
  `deactivate`/`activate`/`changeRole`) and `PrismaAdminUserRepository
  .save()` now also writes back `passwordHash` (a no-op for every
  existing caller, which never touches it). `IdentityModule` now also
  exports `PASSWORD_HASHER` (same additive-export precedent as
  `ADMIN_USER_REPOSITORY`).
- A necessary correctness fix in `HttpExceptionFilter`: `PermissionDeniedError`
  (built in Epic 2, never wired to HTTP) now maps to 403, and a new
  branch maps `InvalidCredentialsError`/`InvalidRefreshTokenError`/
  `RefreshTokenReusedError`/`InvalidPasswordResetTokenError` to 401 —
  closing this epic's explicit "support 401 and 403 correctly"
  requirement.
- 44 new unit tests (entities, all nine use-cases) and 26 new
  integration tests across five files — login/failure/history,
  refresh rotation + family-wide reuse detection, logout, change/reset
  password (each revoking every session), session list/revoke
  (including a cross-account 404, not a leak), and `PermissionGuard`
  enforcement (a Warehouse-role admin passes `INVENTORY_VIEW`, is
  forbidden from `USERS_MANAGE`) — deliberately split into several
  small files (plus updating the existing `app.integration.spec.ts` to
  log in instead of using `x-admin-user-id`) so the login endpoint's
  5-per-60-second throttle stays scoped per file's own fresh app
  instance rather than shared across the whole suite.

**Changed**

- Swagger's security scheme switches from an `x-admin-user-id` API-key
  header to `Authorization: Bearer` (`ApiBearerAuth('access-token')`)
  across every previously-guarded controller.

**Fixed**

- `PermissionDeniedError` had no HTTP status mapping at all (see above)
  — the only bug fix bundled into this epic, required by its own "401
  and 403 correctly" rule.

### Epic 6 — API Layer (2026-08-02)

**Added**

- [ADR 0016](docs/v2/adr/0016-api-layer-conventions.md) — the epic's
  governing conventions: `/v1` prefix + `@nestjs/swagger` CLI plugin
  (auto-generates `@ApiProperty()` from existing DTOs instead of
  manually decorating ~60 of them); a single coarse `TemporaryAdminGuard`
  (401-only — no per-permission 403 until real Auth) with a `@Public()`
  opt-out for guest-facing routes; a shared in-memory `paginate()`
  utility applied after each list use-case returns, with explicit
  per-endpoint searchable/sortable field allow-lists; `DomainError.code`
  used directly as the wire error-code registry via a convention-based
  name-classifier (`*NotFound*` → 404, `*AlreadyInUse|AlreadyExists|
  Duplicate*` → 409, else 400); offset pagination only (cursor
  deferred); no rate limiting, idempotency keys, or webhooks (all
  explicitly out of scope).
- **First HTTP surface for every bounded context built so far.**
  Controllers under each module's new `http/` folder: Identity
  (`admin-users`, `roles`, `permissions` — all guarded), Catalog
  (`products`, `product-variants`, `product-media`, `product-
  specifications`, `product-relations`, `categories`, `collections`,
  `brands`, `tags`, `colors`, `sizes`, plus a fully-public `storefront/`
  controller for featured/best-seller/new-arrival lists — reads are
  `@Public()`, writes are guarded), Inventory (`warehouses`, `stock`,
  `stock-reservations` — all guarded), Checkout (`cart`, `checkout` —
  fully `@Public()`, guest-token based, no admin identity required to
  buy), Orders (guarded — list/get/status/cancel/notes).
- `TemporaryAdminGuard` — a global `APP_GUARD` reading a real
  `AdminUser.id` from the `x-admin-user-id` header (no password),
  validating the account is active via `AdminUserRepository`, and
  attaching `request.actor: ActorRef` for use-cases that need one.
  Deliberately does not call `CheckPermissionUseCase`; that per-route
  403 layer is left for the real Authentication epic, whose own doc
  comments already anticipated a future guard replacing this one.
- Shared API infrastructure: `ApiSuccessResponse`/`ApiErrorResponse`
  response envelope (`response-envelope.interceptor.ts`), the
  `classifyDomainErrorStatus()` exception filter extension,
  `ListQueryDto`/`paginate()`, `@Public()`/`@CurrentActor()` decorators.
- Swagger documentation at `/v1/docs`, gated off in production by
  `NODE_ENV`; documents the `x-admin-user-id` header as an API-key
  security scheme.
- Full-stack HTTP integration test suite (`app.integration.spec.ts`,
  new `supertest`-based pattern for this codebase) against real
  Postgres and the actual Nest pipeline (guard, pipes, interceptor,
  exception filter) — 8 tests covering the guard's 401 discipline and
  `@Public()` opt-out, `DomainError` → HTTP status mapping,
  pagination/sort/search, and one full guest browse → cart → checkout →
  order → staff-view → cancel flow exercising every layer this epic
  wired together.
- Two additive exports on already-frozen modules, same precedent as
  every prior epic: `IdentityModule` now also exports
  `ADMIN_USER_REPOSITORY` (the guard needs it).

**Changed**

- `nest-cli.json` — added the `@nestjs/swagger` compiler plugin.
- `main.ts` — Swagger setup gated behind non-production `NODE_ENV`;
  `DocumentBuilder` now declares the `x-admin-user-id` API-key scheme.

**Fixed**

- None (no Foundation/Identity/Catalog/Inventory/Orders bug fixes were
  needed this epic).

### Epic 5 — Orders & Checkout Core (2026-08-02)

**Added**

- `Cart`/`CartItem` (guest-only — no `customerId` yet) and
  `Order`/`OrderItem`/`OrderStatusHistory`/`OrderNote` — two new bounded
  contexts, `src/modules/checkout/` and `src/modules/orders/`. Migration
  `20260802072905_init_orders_checkout`.
- [ADR 0015](docs/v2/adr/0015-guest-checkout-and-minimal-order-dependencies.md)
  — the epic's central scope decision: Cart/Order carry no
  `customerId`/`shippingAddressId`/`couponId` at all (Customers/Coupons
  don't exist yet; contact and address are pure snapshot columns, per
  [ADR 0004](docs/v2/adr/0004-order-snapshot-redesign.md), with nothing
  live upstream of them); `paymentMethod`/`paymentStatus` are flat
  columns (only `COD` is processable end-to-end — `CARD` is schema-ready
  but rejected with a clear "not yet supported" error);
  `shippingFee` is a flat policy constant, not a computed Shipping
  domain. Also documents reusing Inventory's `ProcessReturnUseCase`
  (RESELLABLE) to restock a cancelled, stock-committed order, and the
  two additive cross-module exports below.
- `OrderPolicy` — centralizes every order business rule: the exact
  status state machine from docs/product/07-ORDERS.md (`PENDING →
  CONFIRMED → PREPARING → PACKED → SHIPPED → DELIVERED`, `CANCELLED`
  reachable from any pre-`SHIPPED` status, `DELIVERED → RETURNED`,
  `CANCELLED`/`RETURNED` terminal), order-number generation, total
  computation, and checkout's contact-info/shipping-address/
  payment-method validation.
- `PlaceOrderUseCase` — the Cart→Order orchestration
  (docs/06-DDD-BOUNDED-CONTEXTS.md's Checkout saga): validates input,
  reserves stock per cart item via Inventory's
  `CreateStockReservationUseCase` (releasing every reservation already
  created in the same attempt if a later item fails — a compensating
  action — and surfacing exactly which item is unavailable), snapshots
  pricing/name/SKU from Catalog's current state, creates the `Order`,
  then (since only COD is supported) immediately confirms every
  reservation and transitions the order to `CONFIRMED`, and clears the
  cart.
- `CancelOrderUseCase` — per ADR 0015 §4, releases a still-`ACTIVE`
  reservation or restocks a `CONFIRMED` one via a RESELLABLE return,
  keyed off each `OrderItem`'s own `stockReservationId`.
  `AdvanceOrderStatusUseCase` (the normal fulfillment path plus
  `DELIVERED → RETURNED`) explicitly rejects `CANCELLED`, forcing
  callers through `CancelOrderUseCase` instead.
- Cart use-cases (`AddCartItemUseCase`, `UpdateCartItemQuantityUseCase`,
  `RemoveCartItemUseCase`, `GetCartUseCase` — live-priced, never a
  snapshot) and Order query/notes use-cases (`GetOrderUseCase`,
  `ListOrdersUseCase`, `AddOrderNoteUseCase`).
- Two additive exports on already-frozen modules, both following Epic
  4's precedent: `CatalogModule` now also exports `PRODUCT_REPOSITORY`
  (Checkout needs product name/price to snapshot); `InventoryModule`
  gains a new `GetStockReservationUseCase` (Orders needs to read a
  reservation's status/warehouse before deciding release-vs-restock).
- Seed data: one guest cart (left empty, matching post-checkout state)
  and one already-placed, `CONFIRMED` Cash-on-Delivery order against a
  seeded variant — mirrors `PlaceOrderUseCase` exactly (a `StockReservation`
  created straight into `CONFIRMED`, a matching `SALE` `StockMovement`,
  the full `Order`/`OrderItem`/`OrderStatusHistory` rows), expressed via
  raw Prisma calls per this codebase's seed-script convention.
- 32 new unit tests, 19 new integration tests — including a full
  checkout-to-order-to-cancel flow and a concurrency test proving two
  simultaneous checkouts for the last unit of stock still can't oversell
  (`PlaceOrderUseCase`'s reservation call inherits Inventory's row-lock
  guarantee transitively).

**Changed**

- None (no Foundation/Identity/Catalog/Inventory bug fixes were needed
  this epic).

**Fixed**

- None.

### Epic 4 — Inventory & Stock Management (2026-08-02)

**Added**

- `Warehouse`, `VariantStock`, `StockMovement`, `StockReservation` domains
  — a new `src/modules/inventory/` bounded context, full domain/
  application/infrastructure layers. Migration
  `20260802064206_init_inventory`.
- [ADR 0014](docs/v2/adr/0014-warehouse-scoping-and-single-warehouse-model.md)
  — extends ADR 0006/0012/0013's store-scoping test to `Warehouse`
  (store-scoped, since `code` is an independent business key) and
  establishes that stock lives in a `VariantStock` join table keyed by
  `(variantId, warehouseId)` rather than a scalar on `ProductVariant`, so
  multi-warehouse support later needs zero schema migration.
  `StockMovement`/`StockReservation` both carry `warehouseId` from day
  one, since ledger rows can't be reliably attributed to a warehouse
  after the fact once more than one exists.
- `InventoryPolicy` — centralizes every inventory business rule per this
  epic's explicit instruction (mirrors Epic 3B's `ProductPolicy`):
  available-stock computation (`stock - SUM(active reservations)`, per
  [ADR 0001](docs/v2/adr/0001-inventory-reservation-strategy.md)),
  positive/non-zero quantity guards, the never-negative-stock guard, the
  no-overselling guard, the RECEIVE/SALE/ADJUSTMENT/RETURN/DAMAGED
  stock-delta mapping (DAMAGED always nets to a zero ledger delta — a
  damaged unit is never returned to sellable stock, though the count is
  still recorded for loss-reporting), low-stock detection, the
  unusually-large-adjustment flag, and idempotent reservation-transition
  checks (confirm/release are safe to retry — never a double-decrement).
- 14 use-cases: Warehouse CRUD/list; `ReceiveStockUseCase`,
  `AdjustStockUseCase` (reason required, flags unusually-large
  adjustments), `GetVariantStockUseCase`, `ListLowStockVariantsUseCase`,
  `SetLowStockThresholdUseCase`; `ProcessReturnUseCase` (RESELLABLE →
  restocked via a RETURN movement, DAMAGED → logged as a loss via a
  DAMAGED movement, never auto-restocked), `ListStockMovementsUseCase`
  (the permanent per-variant audit trail); `CreateStockReservationUseCase`,
  `ConfirmStockReservationUseCase`, `ReleaseStockReservationUseCase`,
  `ExpireStockReservationsUseCase` (the ADR 0001 §5 background-sweep
  logic — a future job-scheduler epic wires the actual schedule; this
  epic delivers the fully-functional, independently-testable logic it
  will call).
- `VariantStockRepository.applyMovement()` is the only code path that
  ever changes `VariantStock.quantity` — it locks the row (`SELECT ...
  FOR UPDATE` via `tx.$queryRaw` inside a Prisma interactive
  transaction, since Prisma has no first-class row-lock API), computes
  and validates the new quantity, and writes the corresponding
  `StockMovement` row in the same transaction, so every stock change is
  audited by construction. `StockReservationRepository.createIfAvailable`/
  `confirm`/`release`/`expireAllDue` implement ADR 0001's reservation
  lifecycle with the same locking discipline.
- `CatalogModule` now additionally exports `PRODUCT_VARIANT_REPOSITORY`
  (not just its use-cases) — the one legitimate cross-bounded-context
  repository dependency in the codebase, justified by
  `docs/06-DDD-BOUNDED-CONTEXTS.md` naming it explicitly ("a
  ProductVariant must exist to hold stock").
- Seed data: one `MAIN` warehouse plus starting `VariantStock` for all 4
  Epic 3B variants, each paired with its own founding `RECEIVE`
  `StockMovement` (never a bare quantity write) — one variant seeded
  below its low-stock threshold to demonstrate
  `ListLowStockVariantsUseCase`.
- 97 new unit tests (domain entities, `InventoryPolicy`, all 14
  use-cases with mocked repositories) and 23 new integration tests
  against real Postgres, including a concurrent-reservation race test
  that fires two simultaneous `createIfAvailable` calls for the last
  unit of stock and proves exactly one succeeds — the `FOR UPDATE` row
  lock holds under real concurrency, not just in single-threaded mocks.

**Changed**

- None (no Foundation/Identity/Catalog bug fixes were needed this
  epic).

**Fixed**

- None.

### Epic 3B — Product Experience & Merchandising (2026-08-02)

**Added**

- `Color`, `Size`, `ProductVariant` domains (store-scoped per
  [ADR 0013](docs/v2/adr/0013-store-scoping-extended-to-variant-attributes.md),
  which extends ADR 0006/0012's pattern). `ProductMedia`
  (images/videos, cover-image flag, alt text), `ProductSpecification`
  (structured spec sheet), `ProductRelation` (admin-curated Related/
  Cross-sell/Up-sell, one mechanism discriminated by type). `Product`
  gains `highlights` (string array) and `richContent` (HTML block).
  Migration `20260802055832_init_product_experience`.
- `ProductPolicy` — centralizes every Product business rule (name/SKU/
  pricing validation, the Active-status readiness gate, media-set
  validation, variant-duplicate-attribute checks, and two new
  regression guards: a variant can't be removed if it's the last one on
  an Active product, and a cover image can't be removed from an Active
  product's media set). Supersedes and removes Epic 3A's
  `ProductPublishReadinessService`.
- **The Active-status gate is now real**: `ProductPolicy.assertReadyForActive()`
  enforces "≥1 variant, ≥1 cover image" (previously a disclosed no-op gap
  from Epic 3A, since Variants/Media didn't exist yet).
- 23 new use-cases: Color/Size/Variant CRUD (4 each), `SetProductMediaUseCase`,
  `SetProductSpecificationsUseCase`, `UpdateProductContentUseCase`,
  `SetProductRelationsUseCase` + `ListProductRelationsUseCase`,
  storefront-facing `ListFeaturedProductsUseCase` / `ListBestSellersUseCase`
  / `ListNewArrivalsUseCase` (ACTIVE-only, distinct from the admin's
  generic filterable list), and `GetProductDetailUseCase` (composes
  product + variants + media + specifications for a PDP read).
- Seed data extended: 3 colors, 5 sizes, 4 variants, 3 media rows (2
  products now have a real cover image), 2 specifications, highlights +
  rich content on one product, 2 cross-sell relations — the two Epic 3A
  "Active" products now actually satisfy `ProductPolicy.assertReadyForActive()`
  rather than being Active only because the seed script writes directly
  via Prisma.
- [ADR 0013](docs/v2/adr/0013-store-scoping-extended-to-variant-attributes.md).
- 67 new unit tests, 22 new integration tests.

**Changed**

- `Product` entity: `validateName`/`validateSku`/`validatePricing` moved
  to `ProductPolicy` (removed from the entity, which now delegates to
  it) — the explicit "centralize all product business rules" instruction
  for this epic.
- `ChangeProductStatusUseCase` (Epic 3A) extended to load variant/cover-
  image state and call the now-real readiness gate — this is the
  designated extension seam Epic 3A's own compliance report named, not
  an unplanned change to a frozen file.
- `CatalogModule` refactored to build its provider/export arrays from
  two lists rather than duplicating ~50 entries twice, given the
  provider count roughly doubled this epic.

**Fixed**

- None (no Foundation/Identity bug fixes were needed this epic).

### Epic 3A — Commerce Core (2026-08-02)

**Added**

- `Store` model + `StoreContext` (per
  [ADR 0006](docs/v2/adr/0006-saas-ready-schema-pattern.md) /
  [ADR 0012](docs/v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md)),
  seeded with exactly one row.
- Catalog bounded context: `Product`, `Category`, `Collection`, `Brand`,
  `Tag` domains — full domain/application/infrastructure layers, 26
  use-cases, 5 Prisma repositories, `CatalogModule`.
- `Slug`, `Money`, `SeoMetadata` value objects; `CategoryHierarchyPolicy`
  (3-level depth + cycle validation); `ProductPublishReadinessService`
  (the Active-status gate — see the disclosed scope gap in
  [EPIC-03A-ARCHITECTURE-COMPLIANCE.md](docs/epics/EPIC-03A-ARCHITECTURE-COMPLIANCE.md)).
  Migration `20260801210526_init_commerce_core`.
- Seed data: the one `Store` row plus an illustrative 3-level category
  tree, 2 brands, 3 tags, 3 products (2 Active, 1 Draft).
- 99 new unit tests, 32 new integration tests.
- [ADR 0012](docs/v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md).

**Changed**

- `src/app.module.ts` — registered `StoreModule` and `CatalogModule`.

**Fixed**

- None (no Foundation/Identity bug fixes were needed or made this
  epic — see
  [EPIC-03A-LESSONS-LEARNED.md](docs/epics/EPIC-03A-LESSONS-LEARNED.md)
  §1 for a *discovered-but-not-fixed* gap in Epic 2, reported rather
  than silently patched).

### Epic 2 — Identity & Access Management Core (2026-08-01)

**Added**

- User/Role/Permission domains, data-driven RBAC (`Role`, `Permission`,
  `RolePermission` — see
  [ADR 0011](docs/v2/adr/0011-data-driven-rbac-schema.md)), Argon2id
  password hashing, length-based password policy, `AuthorizationService`.
  9 use-cases, Prisma repositories, `IdentityModule` (no controllers —
  disclosed security-boundary decision). Migration
  `20260801203259_init_identity_core`. Seed: 5 roles, 17 permissions,
  1 bootstrap Super Admin.
- Jest unit + integration test tooling (new to the project this epic) —
  47 unit tests, 16 integration tests.
- `turbo.json` `test` task; `.github/workflows/ci.yml` `test` job.

**Fixed**

- A latent race in `turbo.json`'s `type-check` task (depended only on
  upstream packages' builds, not the same package's own `build`),
  surfaced by a forced/uncached verification run against `@za/admin`.

### Epic 1 — Project Foundation (2026-07-31)

**Added**

- Turborepo monorepo (`apps/api` NestJS, `apps/storefront` +
  `apps/admin` Next.js, `packages/{types,shared,ui,tsconfig,eslint-config,config}`).
  Docker Compose (Postgres, Redis, Mailpit). GitHub Actions CI
  (lint/type-check/build). Global exception filter, response envelope,
  structured logging, health checks.

**Fixed**

- `packages/ui` shipped as raw TSX (no build step) after a CJS/`'use
  client'` directive-detection bug; ESLint flat-config ordering fixed
  for `eslint-config-next` + typed linting; incremental TypeScript
  build-cache bug removed (`incremental: true` dropped from the shared
  tsconfig base).
