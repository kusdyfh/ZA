# ZA Store — Deployment Strategy v2

Diff against [v1 14-DEPLOYMENT.md](../14-DEPLOYMENT.md) — read that
document first; this covers only what changed.

## New process: `za-worker`

```
za-web    → apps/web,     fork mode          (unchanged from v1)
za-admin  → apps/admin,   fork mode          (unchanged from v1)
za-api    → apps/api,     cluster mode       (unchanged from v1)
za-worker → apps/worker,  cluster mode        ← NEW, per ADR 0003
```

`za-worker` consumes the BullMQ queues from
[ADR 0003](adr/0003-background-job-system.md) (`outbox-relay`,
`notifications`, `webhooks`, `email`, `search-index-sync`,
`maintenance`). Cluster mode is appropriate here too — BullMQ's queue
consumption is safe across multiple worker processes by design (a job is
claimed by exactly one consumer). Scales independently of `za-api`: a
webhook-retry burst or a flash-sale reservation-sweep load spike is
handled by adding `za-worker` instances, never by touching `za-api`'s
scale.

## Redis moves up in the deployment timeline

v1 deferred Redis to "Phase 3-4." It's now a **Phase 0/1** dependency,
because [ADR 0001](adr/0001-inventory-reservation-strategy.md)'s
reservation sweep and [ADR 0002](adr/0002-event-architecture.md)'s outbox
relay both need BullMQ from the start — there is no meaningful "Phase 0
without background jobs" once reservations exist. See
[10-MIGRATION-NOTES.md](10-MIGRATION-NOTES.md) for the full phase-by-phase
impact.

**Redis persistence**: AOF enabled (not just RDB), per
[ADR 0009](adr/0009-operational-architecture.md) — Redis now holds
real in-flight job state, not just caches and rate-limit counters.

## Nginx — one addition

`za-worker` has no HTTP surface of its own (it's a pure queue consumer) —
**no new Nginx server block is needed for it.** The only Nginx-relevant
addition is exposing `/metrics` and `/health`/`/health/ready` on `apps/api`
(per [ADR 0009](adr/0009-operational-architecture.md)) behind an
IP-allowlist or Basic Auth gate — these are operational endpoints, not
public API surface, and should never be reachable from the public
internet without a gate, the same defense-in-depth principle v1 already
applied to `admin.zastore.com`
([v1 14-DEPLOYMENT.md §2](../14-DEPLOYMENT.md#2-nginx)).

## Backup scope — one addition

The nightly `pg_dump` (unchanged) now also durably covers
`StockReservation`, `OutboxEvent`, `FailedJobLog`, `Store`, `ApiKey`,
`WebhookSubscription`, and `FeatureFlag` — no special handling needed,
they're ordinary Postgres tables, but worth noting explicitly that the
new business-critical tables from this redesign are backed up by the
same existing mechanism, not something bolted on separately.

## CI/CD — additions

- `apps/worker` builds and typechecks alongside the other three apps in
  the existing CI pipeline
  ([v1 14-DEPLOYMENT.md §8](../14-DEPLOYMENT.md#8-cicd)) — no new
  pipeline, one more build target in the existing one.
- The new test categories from
  [08-DEVELOPER-EXPERIENCE.md](08-DEVELOPER-EXPERIENCE.md) (reservation
  concurrency, outbox idempotency, plugin-registry, actor-reference
  integrity) run in CI alongside existing suites.
- Deploy step gains one more PM2 target (`pm2 reload
  ecosystem.config.js` already reloads every process defined in it —
  `za-worker` is simply added to that config file, not a new deploy
  mechanism).

## Monitoring — additions

Per [ADR 0009](adr/0009-operational-architecture.md): queue-depth
alerting and `FAILED`-status alerting on `OutboxEvent`/BullMQ jobs, on top
of v1's existing uptime checks.

## What did NOT change

- Single-VPS topology remains the launch target — this redesign resolves
  the P0 correctness/architecture issues the senior review found; it does
  not itself resolve the separately-flagged single-VPS scaling ceiling
  ([v1 16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #8](../16-SENIOR-ARCHITECTURE-REVIEW.md)),
  which remains an open, named future concern (see
  [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)).
- SSL/domain/backup-retention specifics from
  [v1 14-DEPLOYMENT.md §3, §6](../14-DEPLOYMENT.md) are unchanged.
