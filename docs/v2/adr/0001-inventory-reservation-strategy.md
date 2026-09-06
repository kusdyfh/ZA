# ADR 0001: Inventory Reservation Strategy

**Status**: Accepted
**Supersedes**: [v1 04-API-DESIGN.md §5](../../04-API-DESIGN.md#5-storefront--checkout--orders) and
[v1 06-DDD-BOUNDED-CONTEXTS.md — Checkout/Inventory](../../06-DDD-BOUNDED-CONTEXTS.md#checkout),
which described checkout as one transaction holding a `SELECT ... FOR
UPDATE` lock on `ProductVariant` rows across payment initiation.
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #1](../../16-SENIOR-ARCHITECTURE-REVIEW.md).

## Context

The v1 design decremented stock inside the same database transaction that
initiated payment. Holding a row lock across an external HTTP call to a
payment gateway is a throughput and deadlock risk: the lock is held for
however long the gateway takes to respond (which can be seconds under
normal conditions and much longer under gateway degradation), serializing
every other checkout attempt on the same variant for that entire window.
On a genuinely popular SKU (a restock, a viral moment) this turns a
marketing success into an outage.

## Decision

Introduce an explicit **reservation** as a first-class concept, separate
from the confirmed stock deduction, with a short, bounded lifetime.

**New entity**: `StockReservation`

| Field | Purpose |
|---|---|
| `id` | identity |
| `variantId` | which variant is held |
| `cartId` | which cart/checkout attempt holds it |
| `quantity` | how much |
| `status` | `ACTIVE \| CONFIRMED \| RELEASED \| EXPIRED` |
| `expiresAt` | hard TTL — see below |
| `createdAt`, `confirmedAt`, `releasedAt` | lifecycle timestamps |

**Available-to-sell** is a computed value, not a stored counter:

```
available(variant) = variant.stock - SUM(quantity WHERE status = 'ACTIVE' AND variantId = :variant)
```

This is deliberate: an expired reservation stops counting the instant its
`status` flips, with no second write needed to "release" the quantity.

### Lifecycle

1. **Creation** — a reservation is created when checkout is *submitted*
   (not at add-to-cart, which would lock stock for browsers who never buy,
   and not at cart-view time). Creating it is a short, serializable
   operation: within one transaction, lock the `ProductVariant` row
   (`SELECT ... FOR UPDATE`), verify `available(variant) >= quantity`,
   insert the `StockReservation` row, commit. **The lock is held only for
   the milliseconds of this check-and-insert — never across the payment
   call that follows.** This is the actual fix for the P0 finding.
2. **Lifetime / expiration** — default TTL is 10 minutes (configurable per
   store later, per [04-SAAS-EXTENSION-POINTS.md](../04-SAAS-EXTENSION-POINTS.md)),
   long enough for a card-gateway redirect/3-D Secure flow, short enough
   that an abandoned checkout doesn't lock stock for long. `expiresAt =
   createdAt + TTL`, set at creation, never extended.
3. **Confirmation** — on successful payment, `Order` creation and the
   reservation's `ACTIVE → CONFIRMED` transition happen in one
   transaction, which is also where the real `ProductVariant.stock`
   decrement and the `StockMovement(SALE)` row are written. Until this
   point, `stock` itself is untouched — only the computed `available()`
   value reflects the hold.
4. **Release** — happens on: (a) explicit checkout failure or customer
   cancellation — immediate, synchronous release (`ACTIVE → RELEASED`);
   (b) TTL expiry, via the background sweep in
   [ADR 0003](0003-background-job-system.md) — the customer closed the
   tab mid-payment, so nothing synchronous ever runs; (c) an admin-side
   order cancellation within the (rare) window where a reservation is
   still active rather than already confirmed.
5. **Background cleanup** — a repeatable job (see
   [ADR 0003](0003-background-job-system.md)) runs every 60 seconds:
   `UPDATE StockReservation SET status = 'EXPIRED' WHERE status = 'ACTIVE'
   AND expiresAt < now()`. No other cleanup is required — `available()`
   already excludes non-`ACTIVE` rows.

### Race conditions and overselling

- The only lock ever held is the one taken during reservation *creation*,
  and it is held for a single INSERT, not for the checkout's full
  duration. Two concurrent checkout attempts for the last unit of a
  variant serialize on that lock for microseconds, then one succeeds and
  one gets a `PRODUCT_OUT_OF_STOCK` response immediately — not after
  waiting on a payment gateway.
- For a specifically hot SKU (a flash-sale/restock scenario, per
  [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #15](../../16-SENIOR-ARCHITECTURE-REVIEW.md)),
  an optional fast-path pre-check against a Redis atomic counter (`DECR`)
  can short-circuit obviously-oversold attempts before they even reach
  Postgres, with Postgres remaining the durable source of truth
  reconciled on every reservation creation regardless. This optimization
  is **not required for launch** — it's a documented escape hatch for
  exactly one identified scenario, not a default architecture.
- Confirmation and release are both idempotent (keyed by reservation id +
  the existing `Idempotency-Key` mechanism from
  [v1 08-API-REVIEW.md §11](../../08-API-REVIEW.md#11-idempotency)) — a
  retried confirm/release call is a no-op, never a double-decrement.

## Consequences

- Checkout throughput no longer depends on payment-gateway latency for
  lock duration — the lock window shrinks from "however long the gateway
  takes" to "one INSERT."
- A new background job dependency is introduced (see
  [ADR 0003](0003-background-job-system.md)) — reservations that are never
  confirmed or explicitly released rely on the sweep to free stock. If the
  sweep job stops running, abandoned reservations silently hold stock
  until it resumes. This is an accepted, monitored risk (queue-depth
  alerting, per [ADR 0009](0009-operational-architecture.md)), not an
  unmitigated one.
- `Order` creation is no longer the *first* place stock is touched —
  reservation creation is. Any future reporting on "what's in carts right
  now" becomes possible almost for free (`SELECT ... WHERE status =
  'ACTIVE'`), which v1's design couldn't express at all.

## Alternatives Considered

- **Keep the single-transaction lock, just make payment synchronous and
  fast (COD only, no gateway).** Rejected — this only holds as long as
  ZA Store never adds a card gateway, which contradicts the platform's own
  roadmap and the "reusable for future clients" goal, several of whom will
  need card payments on day one.
- **Reserve at add-to-cart time.** Rejected — locks stock for anonymous
  browsing, not purchase intent; would make "sold out" states flicker for
  every visitor who has an item in their cart but never checks out.
- **No reservation at all, decrement optimistically at Order creation and
  handle oversells with a post-hoc cancellation/refund.** Rejected — this
  trades a rare technical problem (lock contention) for a routine business
  problem (apologizing to a customer for an order you can't fulfill),
  which is a worse failure mode for a premium brand.
