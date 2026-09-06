# ADR 0016: API Layer Conventions — Temporary Auth, Pagination, Exception Mapping

**Status**: Accepted
**Extends**: [docs/04-API-DESIGN.md](../../04-API-DESIGN.md) (the envelope/versioning
contract, already implemented in Epic 1) and [docs/08-API-REVIEW.md](../../08-API-REVIEW.md)
(the filtering/sorting/pagination/error-format/auth/versioning review this
epic implements against).
**Raised during**: Epic 6 (API Layer) implementation, per the governance
rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Epic 6 exposes every bounded context built so far (Identity, Catalog,
Inventory, Checkout, Orders — roughly 85 use-cases) over HTTP for the
first time. Its explicit rules — "use existing use-cases only," "no
business logic in controllers," "protect endpoints with temporary
guards/placeholders until Authentication is implemented" — require
concrete decisions docs/08-API-REVIEW.md left open (it reviews a *plan*,
not code): exactly what the temporary guard checks, where pagination/
sorting/search logic lives when the underlying use-case doesn't already
support it, and how the already-populated `DomainError.code` values
across five modules become the "error code registry" §7 asks for.

## Decision

### 1. Versioning and envelope were already built in Epic 1 — this epic doesn't re-decide them

`main.ts` already sets the global prefix to `v1` and mounts Swagger at
`/v1/docs`; `ResponseEnvelopeInterceptor`/`HttpExceptionFilter` already
implement the `{success, data}` / `{success: false, error}` envelope.
This epic's job is to make them actually meaningful (controllers to
wrap, DTOs for Swagger to describe) and to close two real gaps:
`meta` was declared on `ApiSuccessResponse` but never populated (needed
now for pagination), and every non-`HttpException` — which includes
every one of this codebase's `DomainError` subclasses — fell through to
a bare `500`, never actually reaching the "populated module-by-module"
error registry the filter's own doc comment already promised.

### 2. `TemporaryAdminGuard`: a global guard, `x-admin-user-id` header, real actor attribution, no password

Per Epic 2's own precedent (`CheckPermissionUseCase`'s doc comment: *"the
use-case a future NestJS guard will call once Login/JWT exist"*) and this
epic's explicit instruction to use only existing use-cases:

- A single global guard (`APP_GUARD`), applied to every route by default.
  Routes opt out with `@Public()` (a `SetMetadata` decorator + `Reflector`
  check) — chosen over per-controller `@UseGuards()` because the guarded
  surface (Identity, most of Catalog admin, all of Inventory, all of
  Orders) vastly outnumbers the public surface (storefront Catalog reads,
  Cart, Checkout submission), so "guarded by default, opt out" is less
  repetitive and harder to accidentally leave unguarded than the reverse.
- The guard reads `x-admin-user-id` — a **real** `AdminUser.id`, looked up
  via `AdminUserRepository.findById()` (additively exported from
  `IdentityModule`, the same precedent as Catalog's
  `PRODUCT_REPOSITORY`/`PRODUCT_VARIANT_REPOSITORY` exports) — and
  requires it resolve to an **active** account. No password, no token: this
  is the disclosed placeholder the epic's brief explicitly permits, not a
  real authentication mechanism. It is deliberately **coarse** — a valid,
  active admin identity is sufficient for every guarded route; it does
  **not** call `CheckPermissionUseCase` to enforce per-route 403s. Wiring
  real 401-vs-403 discipline (per docs/08-API-REVIEW.md §8) with actual
  per-permission checks is left to the epic that adds real
  Login/JWT/Sessions — building it here against a passwordless
  placeholder identity would be authorization theater, not a real control,
  and this guard is explicitly temporary. `CheckPermissionUseCase` remains
  built, exported, and untouched, ready for that epic to call directly.
- On success the guard attaches `request.actor: ActorRef = { actorId:
  adminUser.id, actorType: ActorType.ADMIN }`, retrieved by controllers via
  a `@CurrentActor()` param decorator — every write endpoint that needs an
  actor (order notes, stock adjustments, cancellations) gets a real,
  attributable `AdminUser.id` in its audit trail, not a null placeholder.
- Storefront-public routes (Catalog reads, Cart, Checkout submission) are
  marked `@Public()` — matching [ADR 0015](0015-guest-checkout-and-minimal-order-dependencies.md)'s
  "guest checkout is always available" rule; nothing about guest commerce
  requires an admin identity.

### 3. Pagination/sorting/search: a shared, generic, in-memory utility applied after the use-case returns

Per docs/08-API-REVIEW.md §§3–5's grammar (`page`/`limit`; `sort=field:direction`,
comma-separated for tie-breaking, server-whitelisted; equality/range/
comma-multi-value filters) — but no existing list use-case implements
pagination, and only some (`ListProductsUseCase`, `ListOrdersUseCase`)
accept any filter at all. Rather than retrofit pagination into use-cases
(out of scope — "use existing use-cases only" — and a repository-level
change to already-frozen modules), a shared `paginate()` utility
(`src/shared/pagination/`) runs **after** a list use-case returns its
full array: it applies an allow-listed search (substring match over
named fields), an allow-listed sort (`field:direction`, multi-key), then
slices for `page`/`limit`, returning `{ data, meta: { page, limit, total,
totalPages } }`. Every list controller passes its own explicit
`sortableFields`/`searchableFields` allow-list — never the raw query
string into a comparator — matching §4's SQL-injection-adjacent rule
even though this path never touches SQL. Where a use-case's own filter
parameters already exist (`ProductListFilters`, order `status`), the
controller passes the matching query params straight through as
equality filters — no new filtering logic, just parameter mapping.
This is a deliberate, disclosed simplification: correct and reasonably
fast at this codebase's current (single-store, seed-scale) data volume,
the same shape of tradeoff as Inventory's disclosed N+1 list queries;
real repository-level pagination is a natural follow-up once any list
endpoint's result set actually grows large enough to matter.

### 4. Exception mapping: `DomainError.code` *is* the error-code registry

Every `DomainError` subclass across all five modules already carries a
stable, `SCREAMING_SNAKE_CASE` `code` (`PRODUCT_NOT_FOUND`,
`INSUFFICIENT_STOCK`, `ILLEGAL_ORDER_STATUS_TRANSITION`, ...) — collectively
already the registry docs/08-API-REVIEW.md §7 asks be "formalized," just
not yet connected to the HTTP layer. `HttpExceptionFilter` is extended
with one new branch: `DomainError` instances map their own `code`
directly into `ApiErrorBody.code` (no translation table to keep in sync),
with HTTP status derived by a small, convention-based classifier on the
error's class name (`*NotFoundError` → 404; `*AlreadyInUseError`/
`*AlreadyExistsError` → 409; state-machine/lifecycle errors — illegal
transitions, unconfirmable/unreleasable reservations, unsupported payment
method, item-unavailable-at-checkout — → 409; everything else
(validation-shaped: invalid/required/empty/insufficient) → 400. A
convention-based classifier was chosen over an exhaustive per-class
lookup table specifically because there are 60+ error classes already
and more will be added by future epics — a name-pattern classifier
needs no update when a new, conventionally-named error class is added;
an exhaustive table would silently default to 500 until someone
remembered to register it.

## Consequences

- Every guarded endpoint's audit trail (`OrderStatusHistory.actorId`,
  `StockMovement.actorId`, `OrderNote.actorId`) now carries a real
  `AdminUser.id` sourced from an actual (if unauthenticated) admin
  account, not a null/SYSTEM placeholder — a real improvement over every
  prior epic's seed-time `actorType: SYSTEM` default, even though the
  identity behind it isn't password-verified yet.
- `TemporaryAdminGuard` is trivially spoofable by anyone who knows or
  guesses a valid `AdminUser.id` (they're `cuid()`s — not realistically
  guessable, but this is not a security boundary against a determined
  attacker, only against accidental/casual access). This must be replaced
  wholesale — not extended — by the epic that adds real Login/JWT; every
  `@Public()`/guarded split this epic establishes carries over unchanged,
  only the guard's internals change.
- No rate limiting, idempotency keys, or webhook scaffolding are added —
  all three are explicitly out of Epic 6's Scope list, and rate
  limiting/idempotency both require Redis, which isn't wired into
  `apps/api` yet (per docs/08-API-REVIEW.md §§10–11's own "once Redis is
  introduced" framing).
- Cursor pagination (docs/08-API-REVIEW.md §5's "optional alternate mode"
  for `Order`/future `AuditLog`) is not built — offset pagination is
  explicitly framed there as "fine... at ZA Store's expected volume,"
  and cursor mode is named as an addition, not a requirement.

## Alternatives Considered

- **Per-controller `@UseGuards(TemporaryAdminGuard)`** instead of a global
  guard with `@Public()` opt-out. Rejected — with roughly 17 guarded
  controllers against 3–4 public ones, the global-default approach means
  a newly added controller is guarded unless someone deliberately opts it
  out, rather than silently public unless someone remembers to guard it —
  the safer failure mode for an admin-heavy API.
- **Wire `CheckPermissionUseCase` into the guard now** for real per-route
  403s. Rejected for this epic — every permission check would run against
  a passwordless, header-supplied identity, which is a false sense of
  security rather than a real control, and mapping meaningful permission
  keys to ~75 new endpoints is exactly the kind of scope explosion this
  epic's "use existing use-cases only" rule is trying to prevent. The
  use-case is untouched and ready for the real Auth epic to call.
- **Retrofit pagination/sorting into repository `list()` methods** now
  that a real need exists. Rejected — every affected repository lives in
  an already-frozen module; changing its interface is exactly the kind of
  non-additive change this codebase's freeze discipline exists to
  prevent, for a benefit (query performance at scale) this codebase
  doesn't need yet at its actual data volume.
