# ADR 0003: Background Job System

**Status**: Accepted
**Supersedes**: nothing directly (v1 had no background-job design at
all) — this fills a gap v1 silently assumed away.
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #3](../../16-SENIOR-ARCHITECTURE-REVIEW.md),
and required by [ADR 0001](0001-inventory-reservation-strategy.md) (reservation
expiry) and [ADR 0002](0002-event-architecture.md) (outbox relay).

## Context

Several mechanisms this v2 redesign depends on — reservation expiry
sweeps, outbox relay, refresh-token/audit-log/notification purges,
coupon-expiry sweeps — require something to run on a schedule or process
a queue, independent of an incoming HTTP request. v1 had no such
component anywhere in its stack.

## Decision

**BullMQ (Redis-backed) is the job system**, run by a new dedicated
process (`za-worker`), separate from `za-api`.

### Scheduler

- Repeatable BullMQ jobs (BullMQ's native repeat-job feature) drive
  everything that runs on a timer — this is deliberately **not**
  `@nestjs/schedule`'s in-process `@Cron()` decorator for anything that
  does real work: in PM2 cluster mode, every cluster worker process would
  independently fire the same `@Cron` handler, executing the sweep N times
  instead of once. BullMQ's repeatable jobs are cluster-safe by
  construction — only one worker picks up each scheduled execution.
  `@nestjs/schedule` is permitted only to *enqueue* a BullMQ job on a
  timer, never to perform the work itself.

### Workers

- `za-worker` is a separate PM2-managed process (see
  [09-DEPLOYMENT-STRATEGY-V2.md](../09-DEPLOYMENT-STRATEGY-V2.md)),
  consuming named queues:
  - `outbox-relay` — polls/consumes `OutboxEvent` rows (per
    [ADR 0002](0002-event-architecture.md))
  - `notifications` — fan-out to admin notification feed / future
    channels
  - `webhooks` — outbound delivery (per
    [06-INTEGRATION-ARCHITECTURE.md](../06-INTEGRATION-ARCHITECTURE.md))
  - `email` — transactional email send
  - `search-index-sync` — future Meilisearch/Typesense projection updates
  - `maintenance` — reservation-expiry sweep, refresh-token purge,
    audit-log archival, coupon-expiry sweep
- Isolating workers from `za-api` means a burst of webhook retries or a
  slow email provider never competes with request-serving latency, and
  workers scale independently (more `za-worker` processes, no more API
  processes needed) — this is also the concrete answer to the v1-flagged
  "flash sale" hot-SKU risk: spin up extra workers for a campaign window.

### Retry

- Per-queue defaults, overridable per job. Idempotent, cheap jobs (ISR
  revalidation, search-index sync) retry aggressively with short backoff.
  Jobs with real-world side effects that must not double-fire (email send,
  webhook delivery) use moderate backoff and rely on the job being
  idempotent at the receiving end (a `messageId`/idempotency key, not
  "hope it doesn't run twice"). Jobs touching payment state **never**
  blind-retry the mutating action — they re-check state via the gateway
  first, per [ADR 0002](0002-event-architecture.md)'s `PaymentFailed`
  handling.

### Dead Letter Queue

- BullMQ's native `failed` job state serves this role — a job that
  exhausts its configured attempts moves to `failed` and remains queryable,
  not silently discarded. Bull Board (open-source dashboard) exposes these
  for manual inspection/requeue. Jobs an operator dismisses as genuinely
  unrecoverable are archived to a `FailedJobLog` table for audit before
  being cleared from Redis, keeping Redis's own footprint bounded.

### Future scalability

- Because workers are their own process type, scaling job throughput is
  "run more `za-worker` instances" — on the same VPS via PM2 cluster mode
  initially, and on a separate machine entirely once the single-VPS
  ceiling (identified in
  [16-SENIOR-ARCHITECTURE-REVIEW.md §1](../../16-SENIOR-ARCHITECTURE-REVIEW.md))
  is reached. No architectural change is required to add worker capacity
  — only more processes pointed at the same Redis instance.

## Consequences

- A new deployable process type (`za-worker`) and a new infrastructure
  dependency (Redis, moved earlier than v1's stated "Phase 3-4" —
  see [10-MIGRATION-NOTES.md](../10-MIGRATION-NOTES.md)) enter Phase 0/1
  scope instead of being deferred.
- Redis now holds real business-relevant queue state (in-flight jobs), not
  just caches and rate-limit counters — this changes the Redis persistence
  requirement (AOF, not just RDB snapshots) per
  [07-OPERATIONAL-ARCHITECTURE.md](../07-OPERATIONAL-ARCHITECTURE.md).
- Every "sweep"/"purge" recommendation scattered across the v1 review
  (RefreshToken, AuditLog, Notification growth) now has a concrete home —
  the `maintenance` queue — instead of remaining an unimplemented
  recommendation.

## Alternatives Considered

- **Postgres-native scheduling (`pg_cron`).** Viable for simple sweeps,
  but doesn't give retries, a dashboard, or a queue abstraction the
  webhook/notification/email work also needs — would mean maintaining two
  separate job mechanisms instead of one. Rejected in favor of a single,
  more capable system.
- **`@nestjs/schedule` doing the real work directly.** Rejected — breaks
  under PM2 cluster mode, per the Scheduler section above.
- **A full workflow engine (Temporal, etc.).** Rejected as disproportionate
  to current needs; BullMQ covers every job type this platform currently
  requires with far less operational surface.
