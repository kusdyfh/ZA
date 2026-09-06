# ZA Store — API Review

A structured review of [04-API-DESIGN.md](04-API-DESIGN.md) against REST
consistency, naming, filtering, sorting, pagination, validation, error
format, auth, versioning, rate limiting, idempotency, and webhook
readiness — with concrete refinements before Phase 0.

## 1. REST Consistency

| Check | Finding |
|---|---|
| Resource nouns, plural collections | Consistent throughout (`/products`, `/orders`, `/coupons`). |
| Action-style endpoints | `/checkout`, `/coupons/validate`, `/cart/merge`, `/notifications/:id/read`, `/orders/:id/status` are process/state-transition endpoints, not pure resource CRUD. **This is an intentional, documented exception**, not an inconsistency — pure REST purism (`POST /order-status-changes`) would obscure intent for zero benefit. Rule going forward: an action endpoint is allowed only when the action has real side effects beyond a field update (stock reservation, cache invalidation, notification fan-out); a plain field change stays `PATCH` on the resource. |
| Nesting depth | Kept to one level (`/products/:id/media`, `/orders/:id/notes`) — good; avoid ever going three levels deep (`/products/:id/variants/:id/media`) — flatten to `/variants/:id/media` instead once variants have media of their own. |

## 2. Naming Conventions

- URL segments: **kebab-case**, consistently (`low-stock-alerts`,
  `forgot-password`). Audit passed — no camelCase segments found in the v1
  draft.
- Query params: **camelCase** (`minPrice`, `usageLimitPerCustomer`) — this
  is the one deliberate case split (URLs kebab, JSON/query camel) and it
  should stay consistent rather than picking one case style for literally
  everything, since it matches what both Prisma (camelCase fields) and
  typical frontend code expect.
- Enum values transported over the wire: **SCREAMING_SNAKE_CASE**, matching
  the Prisma enum values exactly (`PENDING`, `PERCENTAGE`) — no translation
  layer needed between DB, API, and frontend `TOrderStatus` union.

## 3. Filtering

The original draft (`?category=scrubs&color=blush-pink&minPrice=20`) mixes
implicit-equality params with explicit range params. **Formalize this
as the one filtering grammar for the whole API**, rather than deciding
ad hoc per endpoint:

- Equality filters: bare param = value (`status=ACTIVE`, `category=scrubs`
  by slug).
- Range filters: explicit `min*`/`max*` pair (`minPrice`/`maxPrice`,
  `createdAfter`/`createdBefore`) — never a generic `field[gte]=` operator
  syntax; it reads better and every filter a client needs in v1 is
  expressible this way.
- Multi-value filters: comma-separated (`size=S,M,L`), decoded server-side
  as `IN (...)`.
- Every filterable field is enumerated in that endpoint's OpenAPI spec (see
  §9) — a filter that isn't documented isn't supported, even if it happens
  to work.

## 4. Sorting

Standardize on `sort=field:direction`, already used in the draft
(`sort=price:asc`). Refinements:
- Support a comma-separated list for tie-breaking:
  `sort=isFeatured:desc,createdAt:desc`.
- Each endpoint whitelists sortable fields explicitly server-side (never
  pass the raw query string into `ORDER BY`) — this is a SQL-injection
  control as much as an API contract (see
  [12-SECURITY-REVIEW.md](12-SECURITY-REVIEW.md#sql-injection)).

## 5. Pagination

Offset/limit (`page`, `limit`) is fine for storefront PLP and most admin
tables at ZA Store's expected volume. **Gap**: offset pagination degrades
(and can return duplicate/skipped rows under concurrent writes) on
high-churn, high-volume tables — specifically `AuditLog` and, at scale,
`Order`.

**Recommendation**: keep offset pagination as the default (simpler client
code, page-number UI in admin tables), but add optional cursor pagination
as an alternate mode on `GET /v1/admin/orders` and
`GET /v1/admin/audit-log`:

```
GET /v1/admin/audit-log?cursor=<opaque>&limit=50
→ { data: [...], meta: { nextCursor: "<opaque>" | null } }
```

The cursor is an opaque, base64-encoded `(createdAt, id)` tuple — stable
under concurrent inserts, unlike an offset.

## 6. Validation

Reaffirm the shared-schema approach from
[01-ARCHITECTURE.md §3](01-ARCHITECTURE.md#3-frontend-architecture-nextjs--both-apps):
Zod schemas in `packages/validation` are the single source; NestJS DTOs
derive from them (`nestjs-zod` or an equivalent compile step) rather than
being hand-maintained twins. **Add one rule**: every write endpoint
validates at the interface layer (DTO/pipe) *and* the domain layer
re-validates its own invariants independently (e.g. `CouponValidationService`
doesn't trust that the controller already checked expiry) — defense in
depth, and it keeps the domain layer correct even when called from a
future second interface (an admin CLI, a bulk-import job) that bypasses
the HTTP DTO entirely.

## 7. Error Format

The envelope (`success`, `error.code`, `error.message`, `error.details`)
is sound. **Gap**: `code` values were ad hoc per example
(`PRODUCT_OUT_OF_STOCK`). Formalize an **error code registry** —
a single enum shared between `packages/types` (frontend) and the NestJS
exception filter (backend), grouped by domain:

```
AUTH_INVALID_CREDENTIALS        AUTH_TOKEN_EXPIRED
AUTH_REFRESH_REUSE_DETECTED     RBAC_FORBIDDEN
PRODUCT_NOT_FOUND               PRODUCT_OUT_OF_STOCK
VARIANT_NOT_FOUND               COUPON_INVALID
COUPON_EXPIRED                  COUPON_USAGE_LIMIT_REACHED
ORDER_NOT_FOUND                 ORDER_INVALID_STATUS_TRANSITION
VALIDATION_FAILED                RATE_LIMITED
```

Every new error introduced by a feature module registers its code here in
the same PR — reviewed against
[15-PROJECT-STANDARDS.md](15-PROJECT-STANDARDS.md#review-checklist) so the
registry can't silently drift from what the API actually returns.

## 8. Authentication & Authorization

- **401 vs 403 discipline**, made explicit (was implicit in the original
  draft): `401` = no valid access token at all (missing/expired/malformed);
  `403` = valid token, insufficient role/permission. Every guard must
  distinguish these — a customer hitting an admin route gets `401` if
  unauthenticated as admin, `403` if authenticated as a customer (a
  different subject entirely, not just a lesser role).
- **Authorization** is fully covered by the RBAC matrix in
  [05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix); recommend
  generating the `@Roles()`/`@Permissions()` decorator manifest into the
  OpenAPI doc (custom vendor extension `x-required-permissions`) so the
  matrix and the actual guarded routes can be diffed in CI, catching an
  endpoint whose guard drifted from the documented matrix.

## 9. Versioning

URI versioning (`/v1/`) confirmed as the right choice for a platform
multiple client frontends will integrate against — header-based versioning
is harder for a future third-party integrator (or a client's in-house team)
to discover and pin against.

**Addition**: publish the API as **OpenAPI/Swagger**, generated directly
from NestJS decorators (`@nestjs/swagger`), served at `/v1/docs` (admin/dev
only, not public). This becomes:
- the canonical machine-readable contract other tooling (a generated
  TypeScript client, Postman collection) is built from,
- the artifact that makes the platform genuinely reusable — a new client's
  team (or a contracted integrator) can onboard against the OpenAPI spec
  without reading NestJS source.

When a `/v2/` is eventually needed, deprecate `/v1/` routes with
`Deprecation`/`Sunset` response headers rather than removing them outright.

## 10. Rate Limiting

Specify concrete per-route limits rather than leaving "stricter limits on
auth" vague:

| Route | Limit |
|---|---|
| `POST /auth/*/login` | 5 / minute / IP, 20 / hour / IP |
| `POST /auth/refresh` | 30 / minute / IP |
| `POST /auth/*/forgot-password` | 3 / hour / email |
| `POST /storefront/checkout` | 10 / minute / customer |
| `POST /storefront/coupons/validate` | 20 / minute / customer |
| `POST /storefront/products/:slug/reviews` | 5 / day / customer |
| All other authenticated routes | 300 / minute / subject (generous default ceiling, mainly anti-scripting) |

Implemented via `@nestjs/throttler` with a Redis store once Redis is
introduced (see
[13-PERFORMANCE-STRATEGY.md](13-PERFORMANCE-STRATEGY.md#redis)) so limits
are enforced correctly across multiple PM2 cluster processes — an in-memory
throttler store would under-count across processes.

## 11. Idempotency

`Idempotency-Key` on `/checkout` was already specified. **Extend it** to:
- `PATCH /v1/admin/orders/:id/status` (an admin double-clicking "Mark
  Shipped" shouldn't double-fire the shipment notification),
- any future admin **bulk action** (bulk status update, bulk export) —
  bulk endpoints are exactly where accidental double-submission is most
  costly.

Server behavior: the key + a hash of the request body are stored (Redis,
short TTL) against the original response; a repeat within the TTL returns
the cached response verbatim rather than re-executing.

## 12. Webhooks Preparation

Two distinct directions, both relevant to a reusable platform:

- **Inbound** (payment gateway callbacks, once a real gateway adapter
  exists): verify the provider's signature header, enforce a replay window
  (reject anything outside ±5 minutes even with a valid signature, track
  consumed nonces), and always resolve the payment status by *querying the
  gateway's API* rather than trusting the webhook payload alone for the
  final state — the webhook triggers a re-check, it isn't itself the
  source of truth.
- **Outbound** (a future client integrating their own ERP/CRM, or a
  WhatsApp order-update flow): design a generic `WebhookSubscription`
  concept up front (`url`, `eventTypes[]`, `secret`) even though it isn't
  built until a client actually needs it — this is the concrete mechanism
  that makes "reusable for future clients" true for integrations, rather
  than each client requiring bespoke backend code. HMAC-sign every outbound
  payload with the subscription's secret; retry with backoff; disable a
  subscription automatically after N consecutive failures.
