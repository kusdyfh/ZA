# ADR 0023: Event Architecture & Background Job System — Implementation

**Status**: Accepted
**Implements**: [ADR 0002](0002-event-architecture.md) (Transactional Outbox +
in-process events) and [ADR 0003](0003-background-job-system.md) (BullMQ,
`za-worker` process) — both were fully *designed* during v2 planning but
never built. Every epic since (3A through 10) explicitly deferred this
("that's a future job-scheduler epic's job, not this one's" —
`PROJECT_STATUS.md` gap #6).
**Epic**: 11 (Commerce Services). Notifications' Email Service, Notification
Queue, and Event Listeners are meaningless without a real event/job
mechanism to sit on — this ADR builds it for real, then Epic 11's
Notifications module (ADR 0024) is the first real consumer.

## Context

Before writing any Notifications code, the codebase was checked directly:
zero references to `@nestjs/event-emitter`, `bullmq`, `ioredis`, an
`OutboxEvent` table, or any worker process anywhere in `apps/api`. ADR
0002/0003 specify the target design in detail but neither was implemented —
this was flagged to the user before proceeding (mirroring how Epic 10
paused on ADR 0020's catalog-read gap). The user chose full compliance with
both ADRs rather than a scoped-down interim design, so this ADR is that
compliance, not a reinterpretation.

## Decision

### Schema (additive, no change to any existing table)

```prisma
model OutboxEvent {
  id            String   @id @default(cuid())
  storeId       String
  eventType     String   // e.g. "OrderPlaced", "OrderStatusChanged"
  aggregateId   String
  aggregateType String   // e.g. "Order", "Customer", "Review"
  payload       Json
  status        String   @default("PENDING") // PENDING | PROCESSING | DELIVERED | FAILED
  attempts      Int      @default(0)
  lastError     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status, createdAt])
}

model FailedJobLog {
  id         String   @id @default(cuid())
  queueName  String
  jobName    String
  payload    Json
  error      String
  failedAt   DateTime
  archivedAt DateTime @default(now())
}
```

`OutboxEvent` is deliberately **not** FK-linked to any specific aggregate
table (`aggregateId`/`aggregateType` are plain strings) — per ADR 0002 it's
a generic, polymorphic ledger every publisher writes to, not an Order-only
or Customer-only concept. `FailedJobLog` is the durable archive ADR 0003 §
"Dead Letter Queue" describes for jobs an operator/the system gives up on.

### In-process events

`@nestjs/event-emitter`, wired via `EventEmitterModule.forRoot()` in
`AppModule` (additive). Per ADR 0002's routing rule, in-process emission
is the cheap, best-effort side — every event this epic actually needs
delivered reliably (all of them: they all end in an email) goes through
the outbox → BullMQ path below, not this. `EventEmitter2` is still wired
and the outbox relay still emits on it for every dispatched event (see
below), so a same-process listener has a real hook if a future epic wants
one (e.g. push a live update to an open admin tab) — but no such listener
exists yet, matching ADR 0002's own example of what this channel is *for*.

### The Outbox write

A new `shared/events/` module owns:

- `domain-events.ts` — one TypeScript interface per event this epic wires
  for real (`OrderPlacedEvent`, `OrderStatusChangedEvent`,
  `CustomerRegisteredEvent`, `ReviewSubmittedEvent`,
  `PasswordResetRequestedEvent`) plus the full `EVENT_TYPES` string-union
  from ADR 0002's table for anything not yet published (typed as a
  reminder of the target surface, not dead code — nothing constructs
  them).
- `OUTBOX_REPOSITORY` port + `PrismaOutboxRepository` — `write(tx, event)`
  takes a Prisma transaction client, not the injected `PrismaService`
  directly, so a publisher can insert the event row in the *same*
  transaction as its business write (the entire point of the outbox
  pattern — see ADR 0002's dual-write explanation).

**Which frozen files this actually touches**, and why each is the minimum
necessary:

| File | Change | Event |
|---|---|---|
| `orders/infrastructure/repositories/prisma-order.repository.ts` | `create()` changes from a single `prisma.order.create()` call to `prisma.$transaction(async (tx) => ...)` wrapping the same create plus one `tx.outboxEvent.create()`. `changeStatus()` already used `$transaction` — one more `tx.outboxEvent.create()` added inside the existing callback. | `OrderPlaced`, `OrderStatusChanged` |
| `customers/infrastructure/repositories/prisma-customer.repository.ts` | `create()` wrapped in `$transaction` the same way. | `CustomerRegistered` |
| `customers/infrastructure/repositories/prisma-review.repository.ts` | `create()` wrapped in `$transaction`; additionally reads the product's `storeId`/`name` inside the same transaction (`Review` has no `storeId` column of its own) — needed for the outbox payload regardless, since the moderation-alert email names the product. | `ReviewSubmitted` |
| `auth/infrastructure/repositories/prisma-password-reset-token.repository.ts` + its domain port (`password-reset-token.repository.ts`) | `create()` wrapped in `$transaction`; `CreatePasswordResetTokenData` gains two fields (`rawToken`, `email`) — never persisted, passed through only to build the outbox payload, since a repository can't reconstruct a raw token from its one-way hash. `RequestPasswordResetUseCase`'s one call site passes both (values it already had); everything else about the use-case is unchanged (see ADR 0024). | `PasswordResetRequested` |

No existing method's return type, validation, or business *behavior*
changes in any of the four — the outbox write is purely additive inside
an already-atomic operation. Every existing unit and integration test for
these repositories/use-cases was re-run and passes. This
is the same shape of additive, non-breaking extension every prior epic
used when touching a frozen file (e.g. Epic 8 adding `customerId` to
`Order`, Epic 9.5 extending `ProductListFilters`) — the outbox write is
inserted as an extra statement in an already-atomic operation, not a
change to what that operation does.

**Not wired this epic** (typed in `domain-events.ts`, no publisher yet):
`OrderCancelled` (status already flows through `OrderStatusChanged`; a
customer-facing "your order was cancelled" email reuses that one event
rather than adding a second write site for the same status transition),
`StockReservationExpired`, `LowStockThresholdCrossed`,
`CouponUsageLimitReached`/`CouponExpiring` (no Coupons context exists —
item 10), `ProductPublished`/`ProductArchived`, `ContentPublished` (CMS
publishing stays a direct DB write + on-demand ISR revalidation this
epic — see ADR 0025; ISR-via-event is a natural future upgrade, not
required for "SEO: dynamic metadata" to work today), `CustomerRegistered`'s
Marketing subscriber, `PaymentCaptured`/`PaymentFailed` (no Payments
context exists — item 10), `WebhookDeliveryRequested` (no Integration
subscribers exist yet). Each has a named, real reason it's out of this
epic's actual scope, not an oversight.

### Background jobs — BullMQ

`bullmq` + `ioredis`, connected via `REDIS_URL` (already provisioned by
`docker-compose.yml` since Epic 1, unconsumed until now). A new
`infrastructure/jobs/` module (`JobsModule`, global) registers four named
queues — a deliberately smaller set than ADR 0003's full list, matching
what this epic actually needs:

- `outbox-relay` — the relay itself (below)
- `notifications` — one job per dispatched domain event; creates the
  `Notification` history row and decides whether/how to fan out
- `email` — the actual SMTP send
- `maintenance` — `ExpireStockReservationsUseCase`'s sweep (ADR 0001 §5),
  closing gap #6 as a direct, low-risk consequence of this ADR existing —
  the use-case itself is untouched, only a new caller is added

`webhooks` and `search-index-sync` (ADR 0003's other two) are **not**
registered — there is no webhook subscriber and no search index in this
codebase to enqueue into; registering an empty queue nothing ever
publishes to would be dead scaffolding, not infrastructure. Adding either
queue later is a one-line registration, not a redesign.

### Scheduling (ADR 0003's explicit rule, followed exactly)

The outbox-relay and maintenance jobs are BullMQ **repeatable jobs**
(`queue.upsertJobScheduler(...)`, BullMQ's native repeat feature), not
`@nestjs/schedule` `@Cron()` handlers — per ADR 0003, `@nestjs/schedule`
may only ever *enqueue*, never perform real work, because every PM2
cluster worker would otherwise fire the same `@Cron` independently. This
codebase runs single-instance today, but the repeatable-job approach costs
nothing extra now and is cluster-safe the moment it isn't.

### The pipeline, end to end

```
Business write (e.g. PlaceOrderUseCase → orders.create())
  └─ same DB transaction: Order row + OutboxEvent row (status=PENDING)

outbox-relay (repeatable BullMQ job, runs in za-worker)
  └─ polls OutboxEvent WHERE status='PENDING'
  └─ per row: emits in-process EventEmitter2 event (best-effort hook)
             + enqueues a BullMQ job on 'notifications' (event payload)
  └─ marks the row DELIVERED once the enqueue succeeds, FAILED after
     5 attempts (exponential backoff, per ADR 0002 §"Failure handling")

'notifications' queue processor (za-worker)
  └─ looks up NotificationPreference for the relevant recipient
  └─ writes a Notification row (history — always, so History is a
     complete record even if the channel below is disabled/fails)
  └─ if the EMAIL channel is enabled: enqueues an 'email' job

'email' queue processor (za-worker)
  └─ renders the template, calls EmailProviderPort.send()
  └─ updates the Notification row's status (SENT | FAILED)

Any queue's job that exhausts BullMQ's own retry budget
  └─ QueueEvents 'failed' listener (za-worker) writes a FailedJobLog row
     + a SYSTEM-channel Notification, so a permanently-failed job is
     visible in the same History an admin already checks — per ADR 0002's
     "a system-level Notification fires to alert an admin."
```

### `za-worker` — a separate process, not a separate package

ADR 0003 requires **a separate deployable process**, run independently of
`za-api`. It does not require a separate npm package. This ADR implements
it as a second NestJS bootstrap file in the *same* `apps/api` package:
`src/worker.main.ts`, calling `NestFactory.createApplicationContext()`
(no HTTP listener) against a new `WorkerModule` that imports only what
job processors need (`PrismaModule`, `StoreModule`, `JobsModule`,
`NotificationsModule`, `InventoryModule` for the maintenance sweep) — not
the full `AppModule` (no Swagger, no `ThrottlerGuard`, no HTTP guards, none
of which apply to a process with no HTTP surface).

`package.json` gains `"worker:dev": "nest start --watch --entryFile
worker.main"` and `"worker": "node dist/worker.main.js"` — two npm scripts
pointing at two different entry points built from the same `nest build`
output. In production, PM2 runs `dist/main.js` as `za-api` and
`dist/worker.main.js` as `za-worker`, exactly the two named processes ADR
0003 specifies, each independently scalable.

**Why not a genuine separate `apps/worker` package** (considered and
rejected): it would need its own `package.json`/`tsconfig.json`/
`nest-cli.json`/ESLint config, and — critically — its own way to reach the
same Prisma-generated client and the specific use-cases it needs to call
(`ExpireStockReservationsUseCase`, the Notifications module). Doing that
correctly means either duplicating the Prisma schema (drift risk) or
extracting a shared `packages/database`/`packages/core` package, which
means touching the Prisma import in every one of `apps/api`'s ~15
repository files to point at a relocated schema — a refactor whose blast
radius is completely disproportionate to what "a separate deployable
process" actually requires. `docker-compose.yml` had a comment anticipating
"once `apps/worker` exists," written speculatively back in Epic 1 before
this design was decided; it's updated by this epic to describe the actual
shape (`worker.main.ts` inside `apps/api`) rather than left pointing at a
package that doesn't exist.

## Consequences

- `REDIS_URL` finally has a real consumer (queue state), matching the AOF
  persistence `docker-compose.yml`'s Redis service was already configured
  for since Epic 1 (`command: redis-server --appendonly yes`).
- Every future epic that needs "something to happen after a commit,
  reliably" (Payments confirmation, Coupon-expiry sweeps, search-index
  sync, webhooks) now has a concrete mechanism to plug into — register a
  new queue, add a publisher's outbox write, done.
- `ExpireStockReservationsUseCase` (built in Epic 4/5, untouched since,
  fully tested) finally has a real caller — gap #6 closes as a side effect
  of this ADR, not a deliberate re-scope.
- Local dev now requires the worker process running (`pnpm --filter @za/api
  worker:dev`) for notifications/emails/the maintenance sweep to actually
  fire — documented in the README alongside the existing `pnpm dev`
  instructions.

## Alternatives Considered

- **Scoped-down interim design** (in-process events only, DB-backed queue,
  no BullMQ/worker process) — presented to the user as the lower-cost
  option; **not chosen**. Full compliance was chosen instead.
- **A genuine separate `apps/worker` npm package** — rejected above; the
  Prisma/schema-sharing cost is disproportionate to this epic's actual
  scope, and "separate process" (what ADR 0003 actually requires) is fully
  satisfied by a second bootstrap file.
- **Registering all six of ADR 0003's named queues up front** — rejected;
  `webhooks` and `search-index-sync` have zero real publishers or
  consumers in this codebase today, so registering them now is
  scaffolding for a feature that doesn't exist rather than infrastructure
  in use.
