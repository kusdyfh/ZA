# ZA Store — Database Review

A structured review of the schema in
[03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md) against normalization,
indexing, constraints, cascade policy, soft-delete, audit, versioning, and
timestamp discipline — with concrete recommended changes before Phase 0
locks the schema.

## 1. Normalization

| Area | Assessment | Recommendation |
|---|---|---|
| Product pricing (`price`, `discountPrice`) | Correctly denormalized — these are the *current* price, not history. Not a normalization violation. | Add `ProductPriceHistory` only when a client needs price-change auditing/reporting (Phase-gated, not v1). |
| Payment fields flat on `Order` (`paymentMethod`, `paymentStatus`) | **Under-normalized.** A single order can have multiple payment attempts (failed card, then COD fallback) or partial refunds — a flat enum pair can't represent that. | Introduce `Payment` and `Refund` as first-class entities owned by the **Payments** context (see [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#payments)), with `Order.paymentStatus` becoming a derived/cached summary, not the source of truth. |
| Shipping fields flat on `Order` (`shippingFee`) | **Under-normalized** for a reusable platform — different clients have different zones/carriers/rates. | Introduce `ShippingMethod`/`ShippingZone` owned by **Shipping**; `Order.shippingFee` becomes a snapshot of the resolved rate at order time (same snapshot pattern already used for `OrderItem`). |
| `Product.isFeatured` / `isBestSeller` / `isNewArrival` as booleans | Acceptable — these are simple, independently-toggleable storefront flags, not really "collections." Correctly kept separate from the `Collection` many-to-many, which is for curated/ordered sets. | No change. |
| Category tree (`parentId` self-relation) | Correct — adjacency list is the right normalization level for a shopping category depth of 2-3 levels. | If category depth or "show all descendant products" queries become a bottleneck, add a materialized `path`/`depth` column later — not needed at launch. |

## 2. Indexes

| Current | Verdict |
|---|---|
| `Product`: `categoryId`, `status`, `isFeatured`, `isBestSeller`, `isNewArrival` | Good — covers PLP filter paths. |
| `ProductVariant`: `productId`, unique `(productId, colorId, sizeId)` | Good. |
| `Order`: `customerId`, `status` | Missing `createdAt` — admin order list defaults to newest-first and date-range filters; add `@@index([createdAt])` or a composite `@@index([status, createdAt])` to serve the common "orders by status, newest first" admin query directly. |
| `Coupon`: `code` | `code` is already `@unique` (which creates an index) — the explicit `@@index([code])` in the current draft is redundant; drop it. |
| `Notification`: `(recipientId, isRead)` | Good, but add `@@index([type, createdAt])` too — the notification center will also filter by type. |
| `Review`: `(productId, status)` | Good. |
| `AuditLog`: `(entityType, entityId)`, `actorId` | Add `@@index([createdAt])` — audit log review is almost always time-bounded. |
| Full-text search | `searchVector` needs a **GIN index** (`CREATE INDEX ... USING GIN (search_vector)`), added via a raw-SQL migration since Prisma doesn't generate GIN indexes natively. Pair with the `pg_trgm` extension + a trigram GIN index on `Product.name` for typo-tolerant fallback search. |

## 3. Constraints

Prisma's schema language doesn't express `CHECK` constraints — these need
a follow-up raw-SQL migration (`prisma migrate dev --create-only` then hand
edit). Recommended for v1:

```sql
ALTER TABLE "Product" ADD CONSTRAINT price_non_negative CHECK (price >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
ALTER TABLE "Review" ADD CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "Coupon" ADD CONSTRAINT percentage_value_range
  CHECK (type <> 'PERCENTAGE' OR (value > 0 AND value <= 100));
ALTER TABLE "OrderItem" ADD CONSTRAINT quantity_positive CHECK (quantity > 0);
```

These are a second line of defense — application/domain validation
(Zod/class-validator) is the primary gate, but a DB constraint survives a
bug in application code or a future raw script that bypasses the ORM.

## 4. Unique Keys

Current unique keys are appropriate (`Product.slug`, `Product.sku`,
`ProductVariant.sku`, `ProductVariant.barcode`, `Customer.email`,
`Customer.phone`, `Coupon.code`, etc.).

**One gap**: uniqueness on `email`/`slug`/`code` is currently
case-sensitive by default in Postgres (`citext` not yet applied), meaning
`Jane@Email.com` and `jane@email.com` could both register. Recommend
enabling the `citext` extension and using it for `Customer.email`,
`AdminUser.email`, and `Coupon.code`, so uniqueness (and lookups) are
case-insensitive at the database level rather than relying on
lower-casing everywhere in application code (which is easy to forget in
one new endpoint).

## 5. Cascade Policies

| Relation | Current | Review |
|---|---|---|
| `Product → ProductVariant/ProductMedia` | `onDelete: Cascade` | Fine — but see note below: products are not expected to be hard-deleted in practice. |
| `Product → OrderItem` | Default (`Restrict`) | **Correct, and load-bearing.** This is what prevents a product from being hard-deleted while order history references it. This must be an explicit, documented rule, not an accident of the default: **Products are archived (`status = ARCHIVED`), never hard-deleted**, once at least one order references them. Admin UI should disable/hide the delete action once `OrderItem` references exist, rather than let the user hit a 500 from the FK constraint. |
| `Cart/CartItem`, `Wishlist/WishlistItem` | Cascade on customer/product deletion | Fine — these are disposable, non-historical data. |
| `Order → OrderItem/OrderStatusHistory/OrderNote` | Cascade | Fine — these only ever get deleted as part of deleting the whole order, which the platform should never actually do (orders are permanent financial/legal records — cancel, don't delete). |
| `Coupon → CouponUsage` | Cascade | Acceptable, though a coupon actually being deleted after use is rare; consider `Restrict` + archiving (`isActive = false`) instead, matching the Product pattern, so usage history is never silently lost. |

**Recommendation**: formalize "archive, don't delete" as a platform-wide
rule for any entity referenced by `Order`/`OrderItem`/`AuditLog` — document
this explicitly in
[15-PROJECT-STANDARDS.md](15-PROJECT-STANDARDS.md#review-checklist) so
every new admin "delete" button is reviewed against it.

## 6. Soft Delete Strategy

The original schema decision (status/`isActive` flags, no blanket
`deletedAt`) still stands for catalog/content entities — it's the right
call for anything the storefront needs to hide-but-preserve.

**One addition needed: customer data erasure.** A blanket `deletedAt` flag
is *not* sufficient for a "delete my account" / right-to-erasure request,
because `Customer` rows are referenced by `Order` (which must be
preserved for financial records). Recommended process, not a schema-only
fix:

1. Add `Customer.anonymizedAt DateTime?`.
2. An erasure request runs an `AnonymizeCustomerUseCase` in the Identity
   context: overwrites `firstName`/`lastName`/`email`/`phone` with
   irreversible placeholders, revokes all refresh tokens, deletes
   `Address` rows, but **leaves `Order` rows and their snapshots intact**
   (they already carry `productNameSnapshot`/`skuSnapshot` and a shipping
   address at time of order, so the order record stays historically
   accurate without pointing at live PII).
3. Document this as the platform's standard erasure procedure once —
   every future client deployment reuses it rather than inventing a new
   compliance answer.

## 7. Audit Strategy

`AuditLog` (entity, action, before/after JSON, actor, IP, timestamp) is
the right shape. The risk is **coverage**, not schema: a manually-called
`auditLog.create()` sprinkled into individual use-cases will inevitably be
forgotten in some new endpoint.

**Recommendation**: implement `AuditRecorder` as a NestJS interceptor bound
globally to admin-mutating routes (anything under `/v1/admin/*` with a
non-GET method), not as a manual call per use-case. The interceptor
captures the before-state (via a repository read the use-case already
performed) and after-state (the response payload) generically. Use-cases
opt out explicitly (`@SkipAudit()`) only for genuinely uninteresting
writes (e.g. marking a notification read) — the default is "audited,"
not "audited if someone remembered to."

## 8. Versioning (Optimistic Concurrency)

Not present in the original schema and worth adding before Phase 0 locks
it in: **concurrent writes to the same row** are a real risk in two places:

- **Two admins editing the same product** at once (one overwrites the
  other's change silently).
- **Two simultaneous checkouts** for the last unit of a variant (already
  mitigated at the transaction level by `SELECT ... FOR UPDATE` inside the
  `CheckoutOrchestrator`, per
  [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#checkout) — but
  optimistic versioning is a good defense-in-depth for the admin-edit case,
  which row-locking doesn't cover).

**Recommendation**: add `version Int @default(1)` to `Product`,
`ProductVariant`, and `Order`. Every admin update includes a `WHERE version
= :expectedVersion` clause and increments it; a zero-row update result
means a conflicting edit happened and the client is told to reload and
retry, rather than silently losing one admin's change.

## 9. Timestamps

`createdAt`/`updatedAt` are consistently present. Two refinements:

- `AdminUser.isActive` (boolean-only) loses *when* a staff account was
  deactivated, which the audit trail wants. Recommend adding
  `deactivatedAt DateTime?` alongside `isActive` (set together, but the
  timestamp survives even if `isActive` is later toggled back).
- `RefreshToken.revokedAt` is already present — good, this is the same
  pattern applied consistently.

## Summary of Schema Changes to Make Before Phase 0

1. Add `Payment`, `Refund` models (Payments context) — replace flat
   `Order.paymentMethod`/`paymentStatus` with a derived summary.
2. Add `ShippingMethod`, `ShippingZone` models (Shipping context) — replace
   flat `Order.shippingFee` with a resolved-rate snapshot.
3. Add `version Int @default(1)` to `Product`, `ProductVariant`, `Order`.
4. Add `Customer.anonymizedAt DateTime?` + document the anonymization
   procedure.
5. Add `AdminUser.deactivatedAt DateTime?`.
6. Enable `citext` for `Customer.email`, `AdminUser.email`, `Coupon.code`.
7. Add the CHECK constraints listed in §3 via a follow-up raw migration.
8. Add the missing indexes listed in §2 (`Order` composite, `Notification`
   type+date, `AuditLog` createdAt, GIN + trigram for search).
9. Drop the redundant explicit `@@index([code])` on `Coupon` (already
   covered by the `@unique`).
