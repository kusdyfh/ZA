# ADR 0022: Storefront Frontend Architecture

**Status**: Accepted
**Extends**: [ADR 0019](0019-admin-dashboard-frontend.md) (the admin frontend's data-layer
conventions, mirrored here for the customer-auth namespace), [ADR 0021](0021-public-catalog-read-api.md)
(the public catalog API this app exclusively consumes), [ADR 0018](0018-customer-accounts.md)
(the customer auth/cart-token/order-tracking design this app must respect as given).
**Raised during**: Epic 10 (Storefront Release) implementation, per the governance rule
in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

`apps/storefront` was, going into this epic, exactly the Epic 1 placeholder: a root
layout, a header with only a logo + theme toggle, a footer with only a copyright line,
and one placeholder homepage. No data-fetching, no auth, no test tooling — the same
starting point Epic 9 found `apps/admin` in. This epic builds the full customer-facing
storefront against the now-complete public API (ADR 0021 for catalog, ADR 0018 for
customer accounts, Epic 5 for cart/checkout), with a harder constraint than Epic 9 had:
**SEO-readiness** is explicitly required, which Epic 9's client-only React Query
approach did not need to solve.

## Decision

### 1. Server-rendered shell + React Query hydration for SEO-critical pages

Epic 9's admin dashboard used React Query as pure client-side state (every page a
Client Component). The storefront's catalog-browsing pages (Homepage, Shop, Category,
Collection, Product Detail) must be crawlable and fast on first paint, so each of these
routes follows the standard TanStack Query + Next.js App Router integration:

- The route's `page.tsx` stays a **Server Component** (no `'use client'`), so it can
  export `generateMetadata()` (title, description, canonical, OpenGraph — see §7) and
  perform an initial server-side `queryClient.prefetchQuery(...)` call using the exact
  same query key and fetch function the client will later use.
- The prefetched cache is serialized via TanStack Query's `dehydrate()` and handed to a
  `<HydrationBoundary>` wrapping a Client Component that renders the actual UI with a
  normal `useQuery()` call — which sees the prefetched data immediately (no
  loading-skeleton flash on first load) and takes over all subsequent client-side
  interaction (pagination, filter changes, refetch-on-focus) exactly like every Epic 9
  admin page already does.
- This is not "business logic in the frontend" — the server-side call and the
  client-side call both hit the identical public endpoint via the identical
  `apiFetch`-based query function; the only thing added is a cache-warming step.

Every other route (Cart, Checkout, Account, Wishlist, Order History/Tracking, review
submission) is a plain Client Component with `useQuery`/`useMutation`, matching Epic 9
exactly — none of these need to be indexed, and several require a logged-in customer
regardless.

### 2. Customer-auth token storage: same pattern as Epic 9, separate namespace

`localStorage['za-customer-auth']` (distinct key from admin's `za-admin-auth`), a
`CUSTOMER_AUTH_CHANGED_EVENT` window event, a `CustomerAuthProvider`/`useCustomerAuth()`
exposing `customer`, `isAuthenticated`, `isInitializing`, `login`, `register`, `logout`
— the exact same shape ADR 0019 §2 already established for staff, aimed at
`/v1/customers/auth/*` instead of `/v1/auth/*`. `apiFetch` attaches the customer access
token and refreshes via `POST /customers/auth/refresh` on a 401, with the same
single-shared-`refreshInFlight`-promise de-duplication ADR 0019 built for staff.

### 3. Cart token: a client-generated guest UUID, promoted to the customer's own token on login

Per ADR 0018 §3, a customer's `cartToken` is "functionally identical to a guest token."
The storefront implements this literally: `useCartToken()` returns
`customer?.cartToken` when logged in, otherwise a UUID generated once via
`crypto.randomUUID()` on first cart interaction and persisted at
`localStorage['za-guest-token']`. When a customer registers or logs in **while a guest
token exists**, that guest token is sent as `guestToken` in the register/login request
body — the existing `MergeGuestCartUseCase` (ADR 0018 §3, untouched, reused exactly as
built) does the actual merge server-side. The frontend's only job is remembering the
guest token and passing it once at the right moment; no cart-merging logic is
duplicated client-side.

### 4. Cart mutation responses are thin — every mutation refetches the priced cart

`POST/PATCH/DELETE /checkout/cart/items` all return a bare `CartResponseDto` (`{ id,
guestToken, items: [{ id, variantId, quantity }] }` — no price, no product name, no
subtotal), while `GET /checkout/cart` returns the fully priced, named `CartView`. This
is existing, unchangeable backend behavior (Epic 5, frozen). Every cart mutation's
`onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['cart', cartToken] })`,
and the cart UI always renders from the `GET` query, never from a mutation's own return
value. This is a cache-invalidation strategy, not business logic — the storefront never
computes a price, a subtotal, or a line total itself; every number displayed comes
directly from the `GET /checkout/cart` response.

### 5. Order Tracking is a customer-account feature only — no guest order lookup

Per ADR 0018 §4 and `PROJECT_STATUS.md` gap #13 (both pre-existing, re-confirmed here,
not a new finding): there is no endpoint for a guest to look up an order by number/
email, and `GET /customers/me/orders` only shows orders whose `customerId` was
backfilled at that customer's most recent login. The storefront's "Order Tracking" is
therefore built as `/account/orders` (list) + `/account/orders/[id]` (detail/timeline),
both behind `CustomerAuthGuard`-equivalent client-side gating (redirect to `/login` if
signed out) — there is no public "track by order number" form, because the API has
nothing to power one. A guest who wants to track a purchase is prompted to create an
account or sign in with the email they checked out with, which triggers the existing
backfill on their next login.

### 6. New shared primitives added to `@za/ui`; storefront-domain components stay in the app

Following ADR 0019 §6's exact reasoning: generic, storefront-agnostic primitives go in
`@za/ui` (`Drawer`, `Accordion`, `Rating`, `Breadcrumbs`, `QuantityStepper` — none of
these know what a `Product` is). Anything that understands a domain shape
(`ProductCard`, the image gallery, the variant picker, the site header/footer) lives in
`apps/storefront/src/components/` or `features/*/components/`, exactly where Epic 9 put
its own domain-aware components (`WarehousesTab`, `PageHeader`, etc.) on top of the
shared primitives. `Rating` is a fresh addition rather than promoting admin's existing
inline `Stars` component (defined locally in its Reviews page) — the admin app is
frozen per this epic's own preamble, so it is not touched, even to extract a shared
component; the small duplication is the cost of that constraint, not an oversight.

### 7. SEO: one shared `lib/seo.ts` helper, per docs/11-STOREFRONT-SPEC.md's own convention

A single `buildMetadata({ title, description, path, image, noIndex })` helper produces
a Next.js `Metadata` object (title template, description, canonical URL via
`NEXT_PUBLIC_SITE_URL` + `path`, OpenGraph tags, robots directives) — every page's
`generateMetadata()` calls this instead of hand-rolling `<head>` tags, matching the
storefront spec's explicitly-stated cross-cutting convention. Structured data
(`schema.org` `Product`/`BreadcrumbList`/`FAQPage` JSON-LD) is emitted where the epic
names it as available — Product Detail (`Product` + `AggregateRating` from the review
summary), category/collection/PDP breadcrumbs (`BreadcrumbList`), and the FAQ page
(`FAQPage`) — via a small `<JsonLd data={...} />` component rendering a
`<script type="application/ld+json">`.

### 8. Images: `next/image` against the two configured remote hosts

`next.config.mjs` already allowlists `res.cloudinary.com` (future real uploads, per
`MediaStoragePort`, still unbuilt — `PROJECT_STATUS.md` gap #4). The seed data's
`ProductMedia.url` values point at `https://images.za-store.local/...` — a placeholder
domain that doesn't resolve to real bytes (seed data, not production content) but must
still be added to `images.remotePatterns` or `next/image` refuses to render it at all
(a Next.js configuration error, not a missing-image error). Both hosts are configured;
every `<img>` in the app goes through `next/image` for automatic optimization
(responsive `sizes`, lazy loading below the fold, blur-up placeholder where a
low-quality placeholder is feasible) per this epic's explicit requirement.

### 9. Testing: mirrors Epic 9 exactly

`next/jest` + React Testing Library for component tests (own `jest.config.js`/
`jest.setup.js`, same shape as `apps/admin`'s). Playwright for E2E, with an
`auth.setup.ts` project that logs in a seeded test customer once and shares
`storageState` across specs — the same reasoning ADR 0019 §8 gives for staff login
(avoid repeated `/customers/auth/login` calls; customer login has no dedicated
throttle per ADR 0018 §2, but the global 100-req/60s default still applies across an
entire E2E run). `pnpm --filter @za/storefront test:e2e` requires the real API + a
seeded Postgres, exactly like every prior epic's `test:integration`/`test:e2e` — not
part of `turbo run test`, and not executable in this sandboxed environment (no Docker
access), same disclosed limitation as Epic 9.

## Consequences

- `apps/storefront` gains its first real dependencies: `@tanstack/react-query`,
  `react-hook-form` + `zod` + `@hookform/resolvers`, `lucide-react`, plus test tooling
  (`jest`, RTL, `@playwright/test`) — all already precedented by Epic 9's `apps/admin`.
- `packages/ui` gains five new generic primitives; no existing `@za/ui` export changes
  shape (purely additive, same as Epic 9's extension of the package).
- Every catalog-browsing page does one extra server-side fetch (the prefetch) compared
  to a pure-client approach — a deliberate SEO/performance trade Epic 9 didn't need to
  make, since the admin dashboard is never crawled.
- No backend change of any kind. Every data need was already satisfied by ADR 0021
  (catalog), ADR 0018 (customer accounts), or Epic 5 (cart/checkout) — confirmed before
  writing any frontend code, per this epic's explicit "stop and report" instruction for
  anything that would have required otherwise.
- Order Tracking is honestly scoped to "requires an account" — a real, disclosed
  narrowing versus a hypothetical "track by order number" form the API cannot support.

## Alternatives Considered

- **Pure Client-Component pages everywhere (Epic 9's exact approach).** Rejected for
  the five catalog-browsing routes — this epic explicitly requires SEO-readiness, which
  a client-only render cannot provide (crawlers see an empty shell before hydration).
- **Full custom SSR data-fetching (no React Query on the server at all, just a plain
  `fetch` in the Server Component, with a separate client-side refetch on mount).**
  Rejected — duplicates the fetch function/query key in two places and reintroduces the
  loading-flash TanStack Query's hydration boundary exists specifically to avoid; the
  chosen approach is the documented, standard integration path for this exact stack.
- **A public "track by order number" form, guessing at an email+order-number
  verification scheme the API doesn't actually enforce.** Rejected — would be
  fabricating a security check the backend never validates (nothing stops guessing
  order numbers), and this epic's "no business logic in the frontend" rule forbids
  inventing that check purely client-side. Order Tracking is scoped to what
  `GET /customers/me/orders` actually supports (§5).
- **Promote admin's inline `Stars` component to `@za/ui` and have both apps import
  it.** Rejected — touches a frozen admin file for a cosmetic de-duplication that isn't
  worth reopening a frozen epic's code, per this epic's own "Admin Dashboard ... are
  frozen" instruction.
