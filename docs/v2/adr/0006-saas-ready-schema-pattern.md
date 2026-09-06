# ADR 0006: SaaS-Ready Schema Pattern

**Status**: Accepted
**Supersedes**: the global (non-store-scoped) uniqueness constraints
throughout [v1 03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md) and the
"git clone per client" reuse model in
[v1 14-DEPLOYMENT.md §5](../../14-DEPLOYMENT.md#5-environment-variables).
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md §2 and Risk #6](../../16-SENIOR-ARCHITECTURE-REVIEW.md)
— "reusable" was narrative, not schema reality.
**Scope note**: per the brief, this ADR prepares the extension point;
**it does not implement multi-tenancy**. No row-level security, no
per-request tenant resolution logic is built now. Exactly one `Store` row
exists after this change, and behavior is identical to v1.

## Context

The senior review distinguished two different things v1's language
conflated: **multi-instance reuse** (clone the repo, one deployment per
client — what v1 actually specified) versus **multi-tenant SaaS** (one
running system serving many stores — what v1's prose implied). Converting
from the former to the latter *after* tables have live data means adding a
column to every table and rewriting every global unique constraint under
production load — expensive and risky. Doing it *before* any data exists
costs almost nothing.

## Decision

Introduce a `Store` entity now, seeded with **exactly one row**, and add a
`storeId` column to every table that currently has a global uniqueness
constraint, converting those constraints to composite
`(storeId, ...)` immediately.

```prisma
model Store {
  id             String   @id @default(cuid())
  name           String
  domain         String   @unique   // e.g. "zastore.com" — unused today beyond the one seeded row
  defaultLocale  String   @default("en")
  defaultCurrency String  @default("IQD")
  status         StoreStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
}
```

Every table below gets `storeId String` (indexed, FK to `Store`), and its
unique constraint becomes composite:

| Table | v1 constraint | v2 constraint |
|---|---|---|
| `Product` | `slug @unique`, `sku @unique` | `(storeId, slug)`, `(storeId, sku)` |
| `ProductVariant` | `sku @unique`, `barcode @unique` | `(storeId, sku)`, `(storeId, barcode)` |
| `Category` | `slug @unique` | `(storeId, slug)` |
| `Collection` | `slug @unique` | `(storeId, slug)` |
| `Coupon` | `code @unique` | `(storeId, code)` |
| `Customer` | `email @unique`, `phone @unique` | `(storeId, email)`, `(storeId, phone)` |
| `AdminUser` | `email @unique` | `(storeId, email)` |
| `Order` | `orderNumber @unique` | `(storeId, orderNumber)` — and order-number generation becomes a per-store sequence, not a global one |
| `Setting` | `key @unique` | `(storeId, key)` |
| `Page`, `BlogPost` | `slug @unique` | `(storeId, slug)` |

`storeId` is supplied by application code from a request-scoped
`StoreContext` (a NestJS provider), resolved today from a single
environment variable (`DEFAULT_STORE_ID`) — trivially, always the one
seeded row. Tomorrow, the *only* thing that changes is how `StoreContext`
resolves its value (a `Store.domain` lookup against the incoming request's
host header) — every repository, every unique constraint, every query
already written against `storeId` needs zero further change.

## Consequences

- Zero behavioral change today — one store, one set of "unique" values,
  identical to v1's global uniqueness in practice.
- The single most expensive part of a real multi-tenant migration
  (widening every table's identity, one time, under load) is eliminated
  before it can ever become expensive.
- Every repository method gains an implicit `storeId` parameter — this
  is mechanical, repetitive work, but it is *additive plumbing*, not a
  redesign of business logic, which is precisely the "architecture pays
  off" outcome [16-SENIOR-ARCHITECTURE-REVIEW.md §2](../../16-SENIOR-ARCHITECTURE-REVIEW.md)
  predicted the Clean Architecture/DDD discipline would deliver.
- Real multi-tenant isolation (Row-Level Security or schema-per-tenant,
  dynamic domain/TLS handling, a Platform-Administration context for
  managing which stores exist) is **explicitly not built here** — see
  [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md) for what remains
  genuinely undecided.

## Alternatives Considered

- **Do nothing now; retrofit `storeId` only if/when a second client is
  actually sold.** Rejected — this is precisely the "expensive live
  migration" scenario the review warned about; the cost of doing it now
  (while every table is empty) versus later (against real customer/order
  data) is not remotely comparable.
- **Schema-per-tenant or database-per-tenant from day one.** Rejected as
  premature — this ADR's whole point is deferring the *isolation
  mechanism* decision (RLS vs. schema-per-tenant vs. current db-per-client)
  until it's actually needed, while removing the one piece of prep work
  (uniqueness scoping) that's cheap now and expensive later regardless of
  which isolation mechanism is eventually chosen.
