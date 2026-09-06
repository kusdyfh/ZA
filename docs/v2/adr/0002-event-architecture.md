# ADR 0002: Event Architecture

**Status**: Accepted
**Supersedes**: the implicit event model in
[v1 06-DDD-BOUNDED-CONTEXTS.md](../../06-DDD-BOUNDED-CONTEXTS.md), which
named events (`OrderPlaced`, `LowStockThresholdCrossed`, etc.) and called
Notifications/Analytics "pure event subscribers" without any document
specifying an actual delivery mechanism.
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #2](../../16-SENIOR-ARCHITECTURE-REVIEW.md)
— "the most consequential gap in the whole document set."

## Context

v1's DDD narrative assumed contexts communicate via domain events, but no
architecture or deployment document specified whether those events are
in-process, broker-based, or something else. Left unresolved, this
resolves itself by default into the worst option: engineers under
deadline pressure call the next context's service method directly
wherever an event was supposed to fire, and the decoupling this platform's
DDD boundaries were designed to provide quietly disappears.

Three options exist:
1. Direct in-process calls (no event abstraction at all) — the default v1
   would have collapsed into.
2. A full external message broker (Kafka, RabbitMQ) from day one.
3. A **transactional outbox**, relayed to an in-process event emitter for
   cheap same-process reactions and to a durable queue (BullMQ/Redis) for
   anything requiring at-least-once delivery.

## Decision

**Adopt the Transactional Outbox Pattern**, relayed to a hybrid of
in-process events (`@nestjs/event-emitter`) and durable queue jobs
(BullMQ, per [ADR 0003](0003-background-job-system.md)).

### Why the outbox, specifically

The core problem eventing has to solve is the **dual-write problem**: an
`Order` row and a "tell everyone an order happened" side-effect are two
separate writes (one to Postgres, one to wherever the event goes). If the
side-effect fires *after* the database commit as a plain in-memory
event, a process crash between commit and firing loses the event
silently — Notifications never learns about a real order. If it fires
*before* commit and the transaction then rolls back, a notification goes
out for an order that never happened.

The outbox eliminates this by making the event write part of the *same*
transaction as the business write:

```
BEGIN
  INSERT INTO "Order" (...)
  INSERT INTO "OutboxEvent" (eventType, payload, aggregateId, status)
    VALUES ('OrderPlaced', {...}, orderId, 'PENDING')
COMMIT
```

The event is durably recorded **if and only if** the order was. A
separate, simple **Outbox Relay** process polls
`OutboxEvent WHERE status = 'PENDING' ORDER BY createdAt`, dispatches each
row, and marks it `DELIVERED` — replayable from Postgres at any time, so
losing Redis never means losing an event, only a delay in delivering one
already durably recorded. This preserves the v1 principle that "Redis is
never a source of truth" ([v1 13-PERFORMANCE-STRATEGY.md §2](../../13-PERFORMANCE-STRATEGY.md#2-caching--redis))
— the Outbox table in Postgres is the source of truth; BullMQ is delivery
infrastructure.

### Why not a full broker (Kafka/RabbitMQ) now

Overkill for the current scale and operational budget (a single VPS).
BullMQ-on-Redis gives durable queues, retries, delayed jobs, and a
dashboard (Bull Board) with a fraction of the operational surface, and
Redis is already in the stack for rate limiting and idempotency keys
([v1 13-PERFORMANCE-STRATEGY.md §2](../../13-PERFORMANCE-STRATEGY.md#2-caching--redis)).
A real broker is a defensible *future* upgrade if this platform ever needs
true multi-service, multi-language, multi-team event consumption — not a
day-one requirement for a NestJS monolith with in-process subscribers.

### Dispatch routing rule

- **In-process (`@nestjs/event-emitter`)**: used only where losing an
  occasional event is acceptable and there's no cross-process concern —
  e.g., pushing a live update to an already-connected admin dashboard tab.
- **Outbox → BullMQ**: used for anything that must reliably happen —
  notification creation, email send, webhook delivery, ISR revalidation,
  search-index sync. This is the default; in-process is the exception,
  chosen deliberately per event, not assumed.

### Every event, specified

| Event | Publisher | Subscriber(s) | Payload (key fields) | Failure handling | Retry |
|---|---|---|---|---|---|
| `OrderPlaced` | Orders | Notifications (admin alert), Analytics (rollup), future Marketing | `orderId, orderNumber, customerId, total, items[]` | Outbox row stays `PENDING`, retried by relay | Exponential backoff, 5 attempts, then dead-letter (see below) |
| `OrderStatusChanged` | Orders | Notifications (customer email/SMS), Analytics | `orderId, fromStatus, toStatus, changedByAdminId` | same | same |
| `OrderCancelled` | Orders | Inventory (release any still-`ACTIVE` reservation), Notifications | `orderId, reason, cancelledBy` | same | same |
| `StockReservationExpired` | Inventory | Analytics (abandoned-checkout signal), future Marketing | `reservationId, variantId, cartId, quantity` | same | same |
| `LowStockThresholdCrossed` | Inventory | Notifications | `variantId, productId, currentStock, threshold` | same | same |
| `ReviewSubmitted` | Reviews | Notifications (moderation alert) | `reviewId, productId, customerId, rating` | same | same |
| `CouponUsageLimitReached` / `CouponExpiring` | Coupons | Notifications | `couponId, code` | same | same |
| `ProductPublished` / `ProductArchived` | Catalog | Storefront ISR revalidation, future search-index sync | `productId, slug, categoryIds[]` | same | same |
| `ContentPublished` (Page/Blog/Banner) | CMS | ISR revalidation | `entityType, entityId, slug` | same | same |
| `CustomerRegistered` | Identity | Notifications (optional), future Marketing (welcome email) | `customerId, email` | same | same |
| `PaymentCaptured` / `PaymentFailed` | Payments | Orders (confirm/cancel), Notifications | `orderId, paymentId, amount, status` | same, **plus**: a failed payment job never blindly retries the charge itself — it re-queries the gateway's actual state before acting (per [06-INTEGRATION-ARCHITECTURE.md](../06-INTEGRATION-ARCHITECTURE.md)) | Capped at 3 attempts, non-idempotent actions gated by a state re-check, not blind retry |
| `WebhookDeliveryRequested` | Integration (any context, via subscription) | external subscriber URL | HMAC-signed payload | see [06-INTEGRATION-ARCHITECTURE.md](../06-INTEGRATION-ARCHITECTURE.md) | Backoff; subscription auto-disabled after N consecutive failures |

### Failure handling, generally

`OutboxEvent` carries a `status` (`PENDING`, `PROCESSING`, `DELIVERED`,
`FAILED`) and an `attempts` counter. The relay retries with exponential
backoff (roughly 1m → 5m → 30m → 2h → 12h). After 5 attempts, the row
moves to `FAILED` — never silently dropped — and a system-level
`Notification` fires to alert an admin that an event failed permanently.
A `FAILED` row can be manually requeued from the (future) ops tooling in
[07-OPERATIONAL-ARCHITECTURE.md](../07-OPERATIONAL-ARCHITECTURE.md).

## Consequences

- Every "publisher/subscriber" relationship described loosely in v1's DDD
  document now has a concrete, durable, replayable mechanism.
- `OutboxEvent` becomes a new table requiring the same operational
  attention (growth, retention) already identified for `AuditLog` and
  `Notification` in the v1 review — addressed by the same purge/partition
  job in [ADR 0003](0003-background-job-system.md).
- A new deployable process (the Outbox Relay, folded into the worker
  process from [ADR 0003](0003-background-job-system.md)) exists that
  didn't before — see [09-DEPLOYMENT-STRATEGY-V2.md](../09-DEPLOYMENT-STRATEGY-V2.md).

## Alternatives Considered

- **Direct synchronous in-process calls between context services.**
  Rejected — this is the exact coupling the DDD boundaries exist to
  prevent, and is what v1's silence on this topic would have defaulted to.
- **Full external broker (Kafka/RabbitMQ) now.** Rejected as premature
  operational overhead for current scale; revisit if/when true
  multi-service or multi-team consumption is real, not hypothetical.
- **Fire-and-forget in-process events for everything, no outbox.**
  Rejected — reintroduces the dual-write problem this ADR exists to solve.
