# ADR 0015: Guest-Only Checkout and Minimal Order Dependencies

**Status**: Accepted
**Extends**: [ADR 0001](0001-inventory-reservation-strategy.md) (reservation
lifecycle, which Checkout now actually calls), [ADR 0004](0004-order-snapshot-redesign.md)
(snapshot fields, extended here to cover the case where there is no live
row to reference at all), [ADR 0005](0005-actor-reference-model.md)
(actor attribution, reused for `OrderStatusHistory`/`OrderNote`).
**Raised during**: Epic 5 (Orders & Checkout Core) implementation, per the
governance rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

[docs/06-DDD-BOUNDED-CONTEXTS.md](../../06-DDD-BOUNDED-CONTEXTS.md) names
five bounded contexts around a purchase: **Customers** (`Address` book,
customer profile enrichment), **Checkout** (`Cart`/`CartItem`, the
Cart→Order orchestration), **Orders** (`Order`/`OrderItem`/status
timeline/notes), **Payments** (`Payment`/`Refund`, gateway abstraction),
and **Coupons** (discount rules). [v2/10-MIGRATION-NOTES.md](../10-MIGRATION-NOTES.md)'s
phase plan builds Customer Accounts (Phase 2) *before* Checkout & Orders
(Phase 3).

Epic 5's actual brief inverts that order: its Scope list is Cart, Cart
Items, Checkout, Orders, Order Items, Order Timeline, Order Notes, Order
Status State Machine, Order Snapshots, Order Totals, Address Snapshot,
Reservation Integration, Checkout Validation — it does **not** list
Customers, Payments, Shipping, or Coupons. None of those four bounded
contexts exist in the codebase yet (no `Customer`, `Address`, `Payment`,
`Coupon`, or `ShippingMethod` model). Every one of docs/product/07-ORDERS.md
and 08-CHECKOUT.md's business rules that assume those tables exist needs a
concrete scope decision here, the same way Epic 3B needed one for the
not-yet-built Media storage adapter and Epic 4 needed one for Warehouse.

## Decision

### 1. Cart and Order are guest-only; there is no `customerId` anywhere

[docs/08-CHECKOUT.md](../../product/08-CHECKOUT.md)'s first business rule
is unconditional: *"Guest checkout is always available — an account is
never required to buy."* Since no Customer bounded context exists yet,
this epic builds **only** that always-available guest path:

- `Cart` is identified solely by an opaque `guestToken` (no `customerId`
  column). A future Customer epic adds a nullable `customerId` column
  additively — every existing guest cart keeps working unchanged, per
  this codebase's established additive-migration convention (e.g. how
  Epic 4 added `PRODUCT_VARIANT_REPOSITORY` to `CatalogModule`'s exports
  without touching Catalog's frozen schema).
- `guestToken` is a randomly-generated opaque value, not a business-chosen
  key like `Warehouse.code` — so unlike every `(storeId, code)` composite
  unique this codebase has established since [ADR 0012](0012-store-scoping-extended-to-catalog-taxonomy.md),
  a bare `@unique` on the token is sufficient (collision-space is the
  token's own entropy, not a per-store namespace); `storeId` remains a
  plain scoping column for filtering, not part of the uniqueness key.
- `Order` carries **no** `customerId` or `shippingAddressId` FK at all —
  ADR 0004 already established that display never depends on either
  still existing; this epic goes one step further and simply never
  creates them, because there is no `Customer`/`Address` table to
  reference in the first place. `Order.customerNameSnapshot`/
  `customerEmailSnapshot`/`customerPhoneSnapshot` and the shipping-address
  snapshot columns ADR 0004 already specified are populated directly from
  checkout's contact-info/address input, with no live row upstream of
  them. A future Customer epic adds a nullable `customerId` column to
  `Order` additively, exactly as it will to `Cart` — every snapshot field
  on existing orders is untouched.

### 2. Payment, shipping, and discounts are flat, structurally-minimal fields — not their own bounded contexts

Following the exact precedent ADR 0004 set for tax/currency ("added
structurally now... even though a single 0%-rate is seeded at launch"):

- **Payment**: `Order.paymentMethod` (`PaymentMethod` enum: `COD`, `CARD`)
  and `Order.paymentStatus` (`PaymentStatus` enum) are flat columns on
  `Order` — the v1-baseline shape from [03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md#orders),
  not the normalized `Payment`/`Refund` entities docs/06-DDD-BOUNDED-CONTEXTS.md's
  Payments section recommends, since that normalization is explicitly
  future work for whichever epic builds a real gateway adapter. Only
  `COD` is actually processable end-to-end this epic — it matches
  docs/product/07-ORDERS.md's description of Pending being "a brief
  automatic step" for Cash on Delivery, requiring no external gateway
  call. `CheckoutValidationError` is thrown for `CARD` with a clear
  "payment method not yet supported" message — a disclosed gap, not a
  silent stub, exactly like Epic 3B's disclosed `ProductMedia.url` gap
  pending a real upload pipeline.
- **Shipping**: there is no `ShippingMethod` domain or rate table.
  `Order.shippingFee` is a flat `Decimal`, sourced from a single
  `OrderPolicy.STANDARD_SHIPPING_FEE` constant (disclosed as a placeholder
  default, the same pattern Epic 4 used for
  `UNUSUALLY_LARGE_ADJUSTMENT_THRESHOLD`) — every order pays the same flat
  fee. A future Shipping epic replaces the constant with a real
  method/rate lookup; `Order.shippingFee` already means the same thing
  and needs no migration.
- **Coupons**: not modeled at all. `Order.discountTotal` stays
  `@default(0)` with no `couponId` column, since `Coupon` doesn't exist. A
  future Coupons epic adds `couponId` (nullable) and real discount
  computation additively.

### 3. Order Status State Machine, centralized in `OrderPolicy`

The legal-transition graph is exactly [docs/product/07-ORDERS.md](../../product/07-ORDERS.md)'s
table, with no additions or simplifications:

```
PENDING   -> CONFIRMED, CANCELLED
CONFIRMED -> PREPARING, CANCELLED
PREPARING -> PACKED, CANCELLED
PACKED    -> SHIPPED, CANCELLED
SHIPPED   -> DELIVERED
DELIVERED -> RETURNED
CANCELLED -> (terminal)
RETURNED  -> (terminal)
```

`OrderPolicy.assertValidTransition(from, to)` is the single place this
graph is expressed, mirroring `InventoryPolicy`'s
`assertReservation{Confirmable,Releasable}` — every status-changing
use-case calls it before writing anything, per this epic's explicit "keep
all order business rules centralized in OrderPolicy" instruction. This
epic implements the state machine itself and the generic
notes/status-history mechanics; it does **not** implement the return
window/reason-code/auto-approval workflow docs/product/07-ORDERS.md
describes for the `DELIVERED -> RETURNED` transition (14-day window,
standard reason list, auto-approval by reason) — that richer workflow
belongs to a dedicated future Returns epic. `RETURNED` is a legal,
reachable status in the state machine today (satisfying this epic's
explicit "Order Status State Machine" scope item); the request/approval
workflow around reaching it is a disclosed gap, the same shape of
decision as Epic 4 disclosing the return-window logic while shipping the
`DAMAGED`/`RETURN` stock movement types themselves.

### 4. Reservation integration: cancelling a stock-committed order reuses Inventory's return path

Per [ADR 0001](0001-inventory-reservation-strategy.md), a reservation is
`ACTIVE` (not yet confirmed) or `CONFIRMED` (stock already decremented via
a `SALE` movement). Cancelling an order needs different Inventory
operations depending on which state its reservations are in:

- **Reservation still `ACTIVE`** (order still `PENDING`, not yet
  auto-confirmed): `ReleaseStockReservationUseCase` — the hold is
  released, no stock movement, exactly as ADR 0001 already specifies.
- **Reservation already `CONFIRMED`** (order `CONFIRMED`/`PREPARING`/
  `PACKED` — stock was actually decremented): releasing no longer applies
  (`InventoryPolicy.assertReservationReleasable` correctly throws for a
  `CONFIRMED` reservation). The physical reality is identical to a
  customer return — the unit never left the warehouse and goes back to
  sellable stock — so `CancelOrderUseCase` reuses
  `ProcessReturnUseCase` with a `RESELLABLE` disposition, which is exactly
  Inventory's existing mechanism for "stock comes back as sellable,
  logged via a `RETURN` movement." This is a deliberate reuse of an
  existing, already-tested Inventory operation for a new caller, not a
  new Inventory code path.

Each `OrderItem` stores its `stockReservationId` (a real Prisma relation
to Inventory's `StockReservation`, since this schema is one physical
database — bounded-context separation here is an application/module-layer
discipline, not a literal database split, consistent with every other
cross-module FK already in this schema) so `CancelOrderUseCase` knows
exactly which reservation to release or restock per line item, without
guessing from current stock state.

### 5. Two additive exports on already-frozen modules

Both follow the exact precedent Epic 4 set for `CatalogModule` exporting
`PRODUCT_VARIANT_REPOSITORY`:

- **`CatalogModule` now also exports `PRODUCT_REPOSITORY`** — Checkout
  needs `Product.name`/`price`/`discountPrice`/`currencyCode` to snapshot
  `OrderItem.productNameSnapshot`/`unitPrice` at checkout time.
  docs/06-DDD-BOUNDED-CONTEXTS.md's Orders section names this dependency
  explicitly: *"Catalog (line-item snapshot at time of purchase)."*
- **`InventoryModule` gains a new `GetStockReservationUseCase`**, exported
  alongside its existing use-cases — `CancelOrderUseCase` needs to read a
  reservation's current status and `warehouseId` before deciding
  release-vs-restock. Adding a narrow, intention-revealing read use-case
  (rather than exporting `STOCK_RESERVATION_REPOSITORY` wholesale) keeps
  the cross-module contract a set of named operations, matching how every
  other Inventory export already works.

## Consequences

- Every order placed this epic is a guest order with a `COD` payment.
  This is a real, usable end-to-end path — not a stub — for exactly the
  always-available flow docs/08-CHECKOUT.md requires; card payment and
  logged-in checkout are both real, named future work, not silently
  missing.
- `Product Visibility still doesn't account for stock` (a gap Epic 3B/4
  disclosed) remains open — this epic adds real stock consumption at
  checkout, but Catalog's own `Product.isVisibleInCatalog()` still isn't
  wired to query it. Still deferred, now one epic closer.
- A future Customer epic's migration is purely additive on both `Cart`
  and `Order` (`customerId` columns, nullable). A future Payments epic's
  migration replaces two flat enum columns with real `Payment`/`Refund`
  tables — the flat columns' values (`paymentMethod`, `paymentStatus`)
  remain meaningful as a summary/cache even after that normalization, so
  no historical order data becomes wrong or needs rewriting.

## Alternatives Considered

- **Block Epic 5 until Customers/Payments/Shipping/Coupons are built
  first**, matching v2's original phase order. Rejected — the user's
  brief explicitly scopes Epic 5 to Cart/Checkout/Orders now, the same
  way Epic 4 was explicitly scoped to Inventory before Checkout existed
  to consume it. Guest checkout is a complete, real, spec-required flow
  on its own.
- **Model a placeholder `Customer` table now**, just so `Order.customerId`
  has something to point at. Rejected — a placeholder domain with no
  actual account/login/profile behavior is worse than no table at all; it
  would need to be redesigned (not just extended) once the real Customers
  epic lands, violating the additive-migration principle every other
  scope decision in this codebase follows.
- **Give `CancelOrderUseCase` its own bespoke "un-confirm and restock"
  Inventory operation** instead of reusing `ProcessReturnUseCase`.
  Rejected — the stock-ledger effect is identical to a return in every
  respect (same movement type, same "never auto-restocked without this
  explicit call" guarantee), and introducing a second code path for the
  same effect is exactly the kind of duplicate mechanism ADR 0001 and
  Epic 4 were designed to prevent.
