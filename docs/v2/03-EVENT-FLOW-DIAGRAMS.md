# ZA Store — Event Flow Diagrams

How [ADR 0001](adr/0001-inventory-reservation-strategy.md)–
[0003](adr/0003-background-job-system.md) actually move through the
system, end to end. These are the flows the freeze checklist
([11-FREEZE-CHECKLIST.md](11-FREEZE-CHECKLIST.md)) expects to be
demonstrable, not just described.

## 1. Checkout saga — reserve → pay → confirm

```
Customer          API (Checkout)        Inventory           Payments Gateway      Orders           Outbox
   │                    │                    │                     │                │                │
   │ POST /checkout     │                    │                     │                │                │
   ├───────────────────►│                    │                     │                │                │
   │                    │ reserve(variant,qty)│                     │                │                │
   │                    ├───────────────────►│                     │                │                │
   │                    │                    │ BEGIN                                                    │
   │                    │                    │ SELECT...FOR UPDATE (ms only)                            │
   │                    │                    │ check available() >= qty                                 │
   │                    │                    │ INSERT StockReservation(ACTIVE, expiresAt=+10m)          │
   │                    │                    │ COMMIT ◄── lock released here, BEFORE payment            │
   │                    │◄───────────────────┤ reservationId                                            │
   │                    │                    │                     │                │                │
   │                    │ initiate payment (NO lock held)          │                │                │
   │                    ├──────────────────────────────────────────►│                │                │
   │                    │                    │                     │  (gateway redirect / 3DS / etc.)  │
   │                    │◄──────────────────────────────────────────┤ PaymentCaptured                  │
   │                    │                    │                     │                │                │
   │                    │ confirm(reservationId, paymentRef)         │                │                │
   │                    ├───────────────────────────────────────────────────────────►│                │
   │                    │                    │                     │  BEGIN                            │
   │                    │                    │◄────────────────────────────────────┤ UPDATE reservation │
   │                    │                    │                     │  status=CONFIRMED                 │
   │                    │                    │◄────────────────────────────────────┤ UPDATE stock -= qty│
   │                    │                    │                     │  INSERT StockMovement(SALE)        │
   │                    │                    │                     │  INSERT Order + OrderItem[]        │
   │                    │                    │                     │  INSERT OutboxEvent(OrderPlaced) ──┼──►│
   │                    │                    │                     │  COMMIT (all-or-nothing)           │
   │◄───────────────────┤ orderNumber        │                     │                │                │
```

**Failure branch** (payment declines, or customer abandons before
confirming): no `confirm` call ever arrives. The reservation sits
`ACTIVE` until [§2](#2-reservation-expiry-sweep) expires it — no explicit
rollback logic needed, no stock was ever decremented.

## 2. Reservation expiry sweep

```
BullMQ repeatable job (every 60s, one worker instance per tick — cluster-safe)
   │
   ▼
UPDATE "StockReservation"
SET status = 'EXPIRED'
WHERE status = 'ACTIVE' AND "expiresAt" < now()
   │
   ▼
(no further action needed — available(variant) already excludes
 non-ACTIVE rows, per ADR 0001. This UPDATE is the entire mechanism.)
```

## 3. Outbox relay

```
"OutboxEvent" table (Postgres)          Outbox Relay (za-worker)         BullMQ queues
   │                                          │                               │
   │  status=PENDING rows exist               │                               │
   │◄─────────────────────────────────────────┤ poll every few seconds        │
   │                                          │ (or LISTEN/NOTIFY for lower    │
   │                                          │  latency — implementation      │
   │                                          │  detail, either is compliant) │
   │  UPDATE status=PROCESSING                │                               │
   │◄─────────────────────────────────────────┤                               │
   │                                          │ route by eventType:            │
   │                                          │  - in-process EventEmitter     │
   │                                          │    (cheap, same-process only)  │
   │                                          │  - OR enqueue to named queue ──┼──► notifications
   │                                          │                                 ├──► webhooks
   │                                          │                                 ├──► email
   │                                          │                                 └──► search-index-sync
   │  UPDATE status=DELIVERED                 │                               │
   │◄─────────────────────────────────────────┤ on successful enqueue          │
   │                                          │                               │
   │  (on failure) attempts += 1,             │                               │
   │  backoff, retry; after 5 attempts →      │                               │
   │  status=FAILED + admin Notification      │                               │
```

## 4. Low-stock notification fan-out

```
Inventory (StockAdjustmentService or checkout confirm path)
   │
   │ stock crosses lowStockThreshold
   ▼
INSERT OutboxEvent(LowStockThresholdCrossed, payload={variantId, productId, currentStock, threshold})
   │
   ▼
Outbox Relay → enqueue BullMQ "notifications" job
   │
   ▼
Notification worker:
   - resolve which AdminUsers should see this (role-scoped: Warehouse, per
     v1 RBAC matrix)
   - INSERT Notification row per recipient (or one broadcast row, recipientId=null)
   │
   ▼
Admin dashboard polls/subscribes to /admin/notifications → bell icon updates
```

## 5. Outbound webhook delivery

```
Any context's OutboxEvent (e.g. OrderPlaced)
   │
   ▼
Outbox Relay checks: any active WebhookSubscription for this storeId
subscribed to this eventType?
   │
   ▼ (if yes)
enqueue BullMQ "webhooks" job per matching subscription
   │
   ▼
Webhook worker:
   - build payload, HMAC-SHA256 sign with subscription.secret
   - POST to subscription.url with signature header + timestamp
   - on 2xx: done
   - on failure: backoff retry (per ADR 0003); increment consecutiveFailures
   - after N consecutive failures: set isActive=false, notify admin
```

## What these diagrams intentionally do not show

- The exact polling interval vs. `LISTEN/NOTIFY` choice for the Outbox
  Relay — an implementation detail left to Phase 0 build-out, not an
  architectural decision this pass needs to fix.
- Multi-store routing — every flow above is drawn for the single seeded
  `Store` row; per [ADR 0006](adr/0006-saas-ready-schema-pattern.md), every
  query in these flows carries an (currently constant) `storeId`, omitted
  from the diagrams for readability.
