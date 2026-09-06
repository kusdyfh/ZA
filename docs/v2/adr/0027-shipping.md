# ADR 0027: Shipping

**Status**: Accepted
**Epic**: 12 (Payments & Shipping). Closes the other half of
[ADR 0015](0015-guest-checkout-and-minimal-order-dependencies.md) §2's
deferral: *"no `ShippingMethod` domain/rate table at all — `Order.shippingFee`
sourced from a single hardcoded `OrderPolicy.STANDARD_SHIPPING_FEE`
constant... A future Shipping epic replaces the constant with a real
method/rate lookup; `Order.shippingFee` already means the same thing and
needs no migration."* This ADR is that replacement.
**Scope boundary** (`docs/product/11-SHIPPING.md`, read in full before
design): v1 is explicitly **flat, admin-configured rates only** — "real
carrier integration/live tracking, multiple speed options, pickup/locker,
and sub-region rates" are named out of scope in the product doc itself, not
a shortcut taken here. `Shipment`/tracking exist so staff can record and
customers can see progress, not so a carrier API pushes it automatically.

## Context

Three product rules shape the design:

1. **Zones are flat regions, not addresses** — `docs/product/11-SHIPPING.md`:
   "checkout blocks addresses outside supported delivery regions... before
   proceeding," evaluated per-order against `Order.shippingGovernorate`
   (the field already exists, snapshot-only, per ADR 0004/0015 — reused
   unchanged, not replaced).
2. **Free-shipping threshold is evaluated against the discounted subtotal** —
   `(subtotal - discountTotal) >= rate.freeShippingThreshold` ⇒ fee is
   waived. `Order.discountTotal` already exists (ADR 0015, still `0` today
   pending a Coupons epic) — the calculation is written against the real
   field now so a future Coupons epic needs no Shipping-side change.
3. **Delivery estimate is a range, never an exact date** — `ShippingMethod`
   stores `minDays`/`maxDays`, the storefront renders "3–5 business days,"
   never a computed calendar date.

### Why this touches frozen `orders`/`checkout` (same disclosure standard as ADR 0026)

- **`Order` gains one additive, nullable FK**: `shippingMethodId` (which
  rate was chosen at checkout) plus a back-relation to the new `Shipment`
  table (`Order.shipment Shipment?`, 1:1). No existing column removed or
  retyped.
- **`PlaceOrderUseCase`'s shipping-fee line changes from a hardcoded
  constant to a real rate lookup** — `OrderPolicy.STANDARD_SHIPPING_FEE` is
  deleted, replaced by `QuoteShippingRateUseCase.execute({ governorate,
  methodId, subtotal, discountTotal })`. This is the exact, named
  replacement ADR 0015 §5 pre-authorized ("needs no migration"), not a
  surprise change to a frozen use-case's contract — its input/output shape
  (a computed `shippingFee: Decimal`) is unchanged, only the source of the
  number changes from a constant to a query.
- **A new, additive `AdvanceOrderStatusUseCase` call site**: creating a
  `Shipment` and marking it dispatched now *also* calls the existing,
  unmodified `AdvanceOrderStatusUseCase` (`PACKED → SHIPPED`) — reusing it
  exactly as `PlaceOrderUseCase` already reuses `CreateStockReservationUseCase`,
  not a parallel status-mutation path.

## Decision

### Provider abstraction

```ts
export interface ShippingProviderPort {
  readonly provider: 'MANUAL'; // the only implementation in this epic
  quoteRate(input: QuoteRateInput): Promise<QuoteRateResult>;
  createLabel(input: CreateLabelInput): Promise<ShippingLabelResult>;
}
```

One adapter, **`ManualShippingProvider`**, backed entirely by the new
`ShippingZone`/`ShippingMethod`/`ShippingRate` tables (admin-configured,
per `docs/product/11-SHIPPING.md`'s explicit v1 boundary) —
`createLabel()` returns a placeholder `labelUrl: null` and a staff-entered
`trackingNumber`, since no real carrier API exists to call. The port exists
so a future epic adding a real carrier (e.g. Aramex) implements the same
interface without touching any call site — the abstraction is real even
though only one implementation is, mirroring `PaymentProviderPort`'s COD/
Stripe split in [ADR 0026](0026-payments.md).

### Zones, Methods, Rates (admin-configured, `SETTINGS_MANAGE`-adjacent)

```prisma
model ShippingZone {
  id           String   @id @default(cuid())
  storeId      String
  name         String
  governorates String[] // matches Order.shippingGovernorate values
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([storeId, name])
}

model ShippingMethod {
  id          String   @id @default(cuid())
  storeId     String
  name        String   // "Standard Delivery"
  minDays     Int
  maxDays     Int
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([storeId, name])
}

model ShippingRate {
  id                    String   @id @default(cuid())
  storeId               String
  zoneId                String
  methodId              String
  fee                   Decimal  @db.Decimal(12, 2)
  freeShippingThreshold Decimal? @db.Decimal(12, 2)
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([zoneId, methodId])
}
```

A rate is the join of exactly one zone and one method — `docs/product
/11-SHIPPING.md`'s "rate may vary by region" plus "multiple speed options"
being out of scope for v1 means most stores configure one method × N zones,
but the shape supports more without a schema change later.
`RESOLVE_ZONE_FOR_GOVERNORATE` is a plain array-contains lookup
(`ShippingZone.governorates`), not a geocoding service — matches "flat
regions" exactly.

`QuoteShippingRateUseCase`: resolve zone from governorate (404
`UnsupportedDeliveryRegionError` if none matches — this is the "checkout
blocks addresses outside supported regions" rule, enforced here, called
from checkout **before** `PlaceOrderUseCase`/`InitiateCardCheckoutUseCase`
run at all, per the "before proceeding" requirement) → resolve rate for
`(zone, method)` → apply free-shipping threshold against
`subtotal - discountTotal` → return `{ fee: Decimal, estimatedDays: {min,
max} }`.

### Shipment + tracking

```prisma
enum ShipmentStatus { PENDING LABEL_CREATED IN_TRANSIT DELIVERED FAILED RETURNED }

model Shipment {
  id               String   @id @default(cuid())
  storeId          String
  orderId          String   @unique
  shippingMethodId String?
  status           ShipmentStatus @default(PENDING)
  carrierName      String?
  trackingNumber   String?
  trackingUrl      String?
  labelUrl         String?
  dispatchedAt     DateTime?
  deliveredAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model ShipmentTrackingEvent {
  id         String   @id @default(cuid())
  shipmentId String
  status     ShipmentStatus
  note       String?
  location   String?
  actorId    String?
  actorType  ActorType @default(SYSTEM)
  createdAt  DateTime @default(now())
}
```

A `Shipment` row is created automatically, at `PENDING`, immediately after
an `Order` is created — both COD's `PlaceOrderUseCase` and card's
`ConfirmCardPaymentUseCase` call `ShipmentRepository.create()` as their next
line, right after `orders.create()`/`orders.changeStatus()` succeeds. This
is a **separate** call, not nested inside `PrismaOrderRepository.create()`'s
own transaction as originally sketched: `ShipmentRepository`'s own
`dispatch`/`markDelivered` methods need `AdvanceOrderStatusUseCase` (so
`ShippingModule` imports `OrdersModule`), and `OrdersModule` importing
`ShippingModule` back to nest the write would be circular. Checkout and
Payments already depend on both modules with no cycle, so they're the
correct place to sequence the two calls. Not staff-initiated — so every
order still ends up with exactly one shipment record to attach tracking to,
with no "does this order have a shipment yet" branch anywhere else in the
codebase, just with a small, accepted durability gap (a crash between the
two calls leaves an `Order` with no `Shipment` yet) instead of atomicity.

**`DispatchShipmentUseCase`** (staff action, `ORDERS_MANAGE`-guarded, the
"Shipping Labels" + "Order status synchronization" scope items in one
call): takes `{ shipmentId, trackingNumber, carrierName? }`, calls
`ManualShippingProvider.createLabel()`, writes the `Shipment` row
(`status: LABEL_CREATED` then immediately `IN_TRANSIT` — no separate
"label printed, not yet handed to carrier" state; matches "flat, simple v1"),
appends a `ShipmentTrackingEvent`, **and** calls the existing, unmodified
`AdvanceOrderStatusUseCase.execute({ orderId, status: 'SHIPPED' })` in the
same use-case — one staff action moves both the shipment and the order
together, satisfying "Order status synchronization" without introducing a
second, independent status-sync mechanism elsewhere.

**`MarkShipmentDeliveredUseCase`** mirrors this for `IN_TRANSIT →
DELIVERED`: staff-driven (no carrier webhook exists to call this
automatically, per the disclosed scope boundary), also calls
`AdvanceOrderStatusUseCase.execute({ orderId, status: 'DELIVERED' })`, and
— per [ADR 0026](0026-payments.md) — for a COD order, this is also the
natural point to prompt "mark cash collected"
(`VerifyManualPaymentUseCase`), though the two remain separate calls, not
merged into one (a delivered-but-not-yet-paid COD order is a real,
representable state, not an error).

### Events

`SHIPMENT_DISPATCHED` and `SHIPMENT_DELIVERED` — new `EVENT_TYPES` entries,
following the exact pattern ADR 0026 uses for `PAYMENT_*`. Routed in
`DispatchNotificationEventUseCase` to customer emails: "Your order has
shipped" (with tracking link) and "Your order has been delivered."

### Customer-facing tracking

`GET /v1/customers/me/orders/:id/shipment` (mirrors the existing
`/v1/customers/me/orders` guard pattern from Epic 8) returns the
`Shipment` + its `trackingEvents`, `@Public()` is **not** used — only the
owning customer or a guest with the order's `orderNumber` + email
(matching the existing guest order-lookup precedent from Checkout) can read
it.

## Consequences

- `Order.shippingFee` finally reflects a real, admin-configured rate
  instead of a flat constant — the exact gap ADR 0015 named and deferred.
- Every shipment has one consistent lifecycle
  (`PENDING → LABEL_CREATED → IN_TRANSIT → DELIVERED`, plus `FAILED`/
  `RETURNED` off-ramps), driven only by staff action — no ambiguity about
  who is allowed to move it.
- Real carrier integration (tracking-number-driven automatic status
  updates, live rate shopping, label PDFs) remains a disclosed, named-out-
  of-scope future epic — `ShippingProviderPort` exists specifically so that
  epic is an additive new adapter, not a rewrite of Shipping's domain/
  application layers.
- Multiple shipments per order (split shipments) are out of scope —
  `Shipment.orderId` is `@unique`, one order → one shipment, matching how
  this product's Orders model has never supported partial fulfillment
  either.

## Alternatives Considered

- **Store the shipping fee as a snapshot on `Order` only, no `Shipment`
  entity at all** (extending the existing flat-field pattern instead of
  normalizing) — rejected; "Shipment Tracking," "Shipment Status History,"
  and customer-facing tracking are explicit epic scope items that need a
  real row to attach events to, not just a fee number.
- **Real-time carrier webhook-driven status** — rejected for this epic per
  `docs/product/11-SHIPPING.md`'s explicit v1 scope boundary; the
  `ShippingProviderPort` abstraction is deliberately shaped so this is a
  future adapter addition, not a redesign.
