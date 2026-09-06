# ADR 0018: Customer Accounts — Unified Module, Separate Auth, Cart Merge via Persistent Token

**Status**: Accepted
**Extends**: [ADR 0015](0015-guest-checkout-and-minimal-order-dependencies.md) (guest-only
Cart/Order — this epic adds the first real Customer identity behind it) and
[ADR 0017](0017-authentication-and-authorization.md) (the staff auth this epic
deliberately does *not* share).
**Raised during**: Epic 8 (Customer Accounts) implementation, per the
governance rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Every prior epic explicitly deferred Customer accounts (PROJECT_STATUS.md's
disclosed gap #9): Cart/Order are guest-only, keyed by an opaque `guestToken`
(ADR 0015 §1). `docs/06-DDD-BOUNDED-CONTEXTS.md`'s original v1 sketch split
Customer credentials into Identity (alongside `AdminUser`) and profile
enrichment (addresses, preferences) into a separate "Customers" context
referencing it. This epic's explicit brief overrides that split: "keep
Customer separate from Admin Identity." This ADR documents that deviation and
the concrete design for registration, login, profile, addresses, wishlist,
reviews, order history, guest cart merge, and guest order association.

## Decision

### 1. One unified `src/modules/customers/` module — credentials and profile together

Unlike the v1 sketch, `Customer` (credentials), `CustomerAddress`, `WishlistItem`,
and `Review` all live in one bounded context. Splitting credentials into
Identity would violate this epic's explicit "keep Customer separate from
Admin Identity" rule — `IdentityModule` owns `AdminUser` exclusively, and
`CustomersModule` owns `Customer` exclusively; neither module imports the
other's domain entities. Reuse only crosses the boundary at the
infrastructure level, deliberately: the same generic `Argon2PasswordHasher`
class is instantiated a second time here, behind the *Customers* module's
own `PASSWORD_HASHER` token — reusing the hashing *algorithm* isn't the same
as coupling to Identity's `AdminUser`-shaped port.

`Customer` is **store-scoped** (`storeId` FK, `@@unique([storeId, email])`),
correctly following [ADR 0006](0006-saas-ready-schema-pattern.md)'s pattern
that `AdminUser` should have followed but didn't (PROJECT_STATUS.md gap #1) —
this epic doesn't repeat that mistake.

### 2. Customer authentication is real, but deliberately smaller than staff auth

Epic 7's scope list named eleven auth capabilities (sessions, login history,
password reset, rate limiting, ...); this epic's scope list names exactly
two: "Customer Registration" and "Customer Login." Built: register, login,
refresh, logout — using the identical rotation-with-reuse-detection pattern
as ADR 0017 §1–2, but against **entirely separate infrastructure**:

- A new `CustomerRefreshToken` table (own migration), not a repurposed
  `RefreshToken` — that table's FK is `AdminUser`-specific and required, and
  bolting a polymorphic subject onto it would mean reopening Epic 7's frozen
  schema for a change with no real benefit.
- New env secrets `CUSTOMER_JWT_ACCESS_SECRET`/`CUSTOMER_JWT_REFRESH_SECRET`,
  distinct from the staff `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — a
  leaked customer-token secret must never let someone forge a staff access
  token, or vice versa. This is a real security boundary, not just code
  organization.
- **Not built** (disclosed, matching the epic's narrower named scope):
  session list/revoke, login history, password reset, and per-account rate
  limiting for customers. A future epic can add these following the exact
  ADR 0017 pattern; the global `ThrottlerGuard`'s generous default (100/60s)
  still applies to every customer route.
- `CustomerAuthGuard` (applied locally via `@UseGuards()`, never global —
  see §5) attaches `request.actor: ActorRef = { actorId: customer.id,
  actorType: ActorType.CUSTOMER }` — the *same* `request.actor` property
  `JwtAuthGuard` populates for staff, and the *same* `@CurrentActor()`
  decorator reads it back with. This is safe only because no route is ever
  guarded by both guards at once (every controller is either staff-guarded
  or customer-guarded, never both), and it means zero new decorators or
  actor-shape special-casing anywhere else in the codebase.

### 3. Guest cart merge: a persistent `Customer.cartToken`, not a second Cart shape

Rather than adding `customerId` to `Cart` (which would require every
existing, frozen Epic 5 cart use-case — `AddCartItemUseCase`,
`GetCartUseCase`, etc. — to branch on "guest vs. customer" identity), each
`Customer` gets its own permanent `cartToken` (a `randomUUID()`, generated
once at registration, functionally indistinguishable from a guest's
`guestToken`). The client is simply told "this is your cart token now" on
login/register and uses it exactly like a guest would — every existing Cart
endpoint, use-case, and repository method is untouched.

`MergeGuestCartUseCase` runs at register/login time whenever the caller
supplies a `guestToken` that differs from the customer's own `cartToken`: it
loads both carts (`CartRepository.findOrCreateByToken`, already existing),
moves every guest item into the customer's cart via the existing `addItem`
upsert, then clears the guest cart (`CartRepository.clear` — already
existing, same "leave an empty row rather than deleting" precedent
`PlaceOrderUseCase` already uses). `CheckoutModule` gains one additive
export, `CART_REPOSITORY`, for `CustomersModule` to consume — the same
cross-module shape as every prior epic's additive exports.

### 4. Guest order association: an email-match backfill at register/login time, not real-time checkout linking

"Guest Order Association" is satisfied by: whenever a customer registers or
logs in, every pre-existing `Order` whose `customerEmailSnapshot` matches
their email and whose (new, additive, nullable) `customerId` is still
`NULL` gets that `customerId` set — a bulk `updateMany`, added to
`OrderRepository` as `associateGuestOrders()`. This is the literal reading
of the scope item: linking a customer's *history* of past guest orders to
their new account.

**Deliberately not built**: real-time association of an order placed *while
already logged in* as a customer. `CheckoutController`/`PlaceOrderUseCase`
remain exactly as Epic 5 built them — fully guest, no optional-customer
detection layered onto an otherwise-`@Public()` route. Doing so would need
a new "verify a Bearer token if present, but never reject the request if
it's missing or invalid" mechanism that doesn't exist anywhere else in this
codebase (every guard so far is binary: require auth, or don't). A
logged-in customer's brand-new order is still linked correctly — on their
*next* login, the same email-match backfill picks it up — just not at the
instant of purchase. Tracked as a disclosed gap; a future epic can revisit
once a "logged-in checkout" flow is scoped for real (todo: consider whether
that flow should require login rather than merely detect it, which would
avoid the optional-auth problem entirely).

### 5. Every customer-facing controller is `@Public()`; `CustomerAuthGuard` is applied per-route, never globally

Following the exact precedent `CartController`/`CheckoutController` already
established: global guards (`ThrottlerGuard`/`JwtAuthGuard`/`PermissionGuard`)
are staff-oriented and would reject every customer call outright. Every
controller in this epic is `@Public()` at the class level; routes that
require a logged-in customer add `@UseGuards(CustomerAuthGuard)` locally
(register/login themselves need no guard at all, same as staff's
`/auth/login`).

### 6. Reviews: reuse the existing `REVIEWS_MODERATE` permission key; average rating computed live, not stored

`PERMISSION_KEYS.REVIEWS_MODERATE` was seeded in Epic 2 and never used until
now — moderation endpoints (`GET` pending, `POST` approve/reject) are
ordinary staff-guarded routes (`JwtAuthGuard` + `PermissionGuard`, not
`@Public()`), reusing that key directly. No new permission keys were added.

A product's average rating and review count (docs/product/13-REVIEWS.md
FR-3) are computed live via a `Review` aggregate query
(`AVG(rating)`/`COUNT(*)` where `status = APPROVED`), not stored as
denormalized columns on `Product` — this avoids the first-ever schema
change to an already-frozen Catalog table, and matches this codebase's
existing precedent of computing derived values on read (`GetCartUseCase`'s
live pricing) rather than maintaining a cache that could drift.

### 7. Wishlist references `Product`, not `ProductVariant`

Per docs/product/14-WISHLIST.md ("wishlist references products directly"),
`WishlistItem` has a required FK straight to `Product`. Availability
display ("Sold Out" / "no longer available") is computed at read time by
checking the product's current status and variant stock, not stored.

## Consequences

- `Order.customerId` (nullable, `onDelete: SetNull`) and `CreateOrderData
  .customerId` (optional) are additive changes to already-frozen Epic 5
  code. `PlaceOrderUseCase` itself is unchanged — it never sets this field
  (always `null` from checkout, per §4) — only `OrderRepository`'s create
  path and the Prisma schema gained the column.
- Account anonymization/deletion (docs/product/02-CUSTOMERS.md FR-5, a
  Super-Admin-only workflow) is **not built** — not named in this epic's
  Scope list. `Customer` rows are never soft- or hard-deleted by anything
  built here.
- No password reset, session management, or login history for customers
  (§2) — a real, disclosed capability gap relative to staff auth, tracked
  for a focused follow-up rather than half-built here.
- No Notifications are sent (registration welcome email, review-moderation
  alerts) — same disclosed gap as every prior epic; no Notifications epic
  exists yet.
- Staff (Manager/Sales/Customer Support, per docs/product/02-CUSTOMERS.md's
  permission table) can view a customer's profile and order history for
  support — a `CUSTOMERS_VIEW` permission key already exists (seeded Epic 2,
  never used until now) and gates the new staff-facing
  `GET /v1/customers/:id` and `GET /v1/customers/:id/orders` lookup routes.

## Alternatives Considered

- **Add `customerId` directly to `Cart`** instead of a persistent
  `cartToken`. Rejected — every existing Epic 5 cart use-case would need a
  guest-vs-customer branch, and the resulting dual-identity `Cart` shape is
  harder to reason about than "a customer's cart token is just a permanent
  guest token, full stop."
- **Reuse Epic 7's `RefreshToken`/`TokenService` for customers** by adding
  a polymorphic subject type. Rejected — reopens frozen Epic 7 schema for a
  security-relevant change (shared signing secrets across staff and
  customers) with no real benefit over two separate, independently-secured
  tables.
- **Store `averageRating`/`reviewCount` on `Product`.** Rejected — the
  first schema change to a frozen Catalog table this codebase would ever
  make for a derived value, when a live aggregate query is simple and
  correct at this scale.
- **Real-time customer-linking at checkout** via an optional-auth check in
  `CheckoutController`. Deferred (§4) — no precedent for a non-rejecting
  guard exists yet, and the explicit scope item ("Guest Order Association")
  reads more naturally as the backfill this ADR implements.
