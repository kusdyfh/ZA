# ZA Store — Operational Architecture (Priority 5)

Full detail behind [ADR 0009](adr/0009-operational-architecture.md).

## Logging

Structured JSON (pino), as v1 specified
([v1 14-DEPLOYMENT.md §7](../14-DEPLOYMENT.md#7-monitoring--logging)), with
one addition: a **correlation ID** generated at the edge (Nginx or the
first NestJS middleware) and propagated through:
- every log line for that request,
- the `OutboxEvent.payload` (as a `correlationId` field) so a background
  job processing that event later carries the same ID,
- any outbound webhook/email triggered as a result.

This is what makes "trace one customer action end-to-end" possible —
without it, connecting an API request log to the worker log that later
sent the resulting email requires manual correlation by timestamp
guesswork.

## Tracing

OpenTelemetry instrumentation (NestJS has first-party OTel interceptors)
added during Phase 0/1 build-out, **before** a hosted trace backend is
even chosen. Instrumenting a service after the fact means retrofitting
spans into code nobody annotated with tracing in mind; instrumenting from
the start costs a decorator here and there. The backend (self-hosted
Jaeger/Tempo vs. a hosted provider) is an open question
(see [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)) — traces can export to
local console/file in the meantime, so the instrumentation isn't wasted
even before a backend is picked.

## Metrics

A Prometheus-format `/metrics` endpoint on `apps/api` and `za-worker`
(via a NestJS Prometheus integration), exposing at minimum:
- HTTP request latency/count, labeled by route and status code,
- **BullMQ queue depth per queue** — this is the direct monitoring answer
  to [ADR 0001](adr/0001-inventory-reservation-strategy.md)/
  [0003](adr/0003-background-job-system.md)'s dependency on the sweep and
  relay jobs actually running: a growing `maintenance` or `outbox-relay`
  queue depth is now something that pages someone, rather than a silent
  failure discovered only when a customer complains their order never
  confirmed,
- DB connection pool utilization (relevant once PgBouncer is introduced,
  per [v1 13-PERFORMANCE-STRATEGY.md §5](../13-PERFORMANCE-STRATEGY.md#5-database-optimization)).

A lightweight self-hosted Prometheus + Grafana pair is sufficient at
launch scale (can run on the same VPS); a hosted metrics provider is a
later, purely operational swap, not an architectural one.

## Health Checks

`@nestjs/terminus`-based, **two distinct endpoints** (v1 had one
undifferentiated concept):
- `GET /health` — liveness: is the process itself responsive. Used by PM2/
  uptime monitoring to decide "is this process dead, restart it."
- `GET /health/ready` — readiness: is the process able to actually serve
  correct requests right now — DB reachable, Redis reachable, pending
  migrations applied. Used by a future load balancer (once there's more
  than one API instance) to decide "should traffic route here yet."

Conflating these (as v1 implicitly did) means a process that's up but
can't reach the database looks "healthy" to a naive check — a real
failure mode this split prevents.

## Feature Flags

`FeatureFlag(storeId, key, isEnabled, rolloutPercentage?)`
(per [02-DATABASE-STRATEGY-V2.md](02-DATABASE-STRATEGY-V2.md)), read
through a short-TTL in-memory/Redis cache (consistent with
[v1 13-PERFORMANCE-STRATEGY.md §2](../13-PERFORMANCE-STRATEGY.md#2-caching--redis)'s
cache-aside pattern — Postgres remains the source of truth, Redis is
never authoritative).

**This is the concrete mechanism for rolling out this entire v2 redesign
safely.** The reservation-based checkout from
[ADR 0001](adr/0001-inventory-reservation-strategy.md) is exactly the kind
of change that should never cut over as a synchronized big-bang deploy —
it changes concurrency-sensitive behavior on the platform's single most
revenue-critical path. The plan: ship it behind `checkout.reservation_v2`,
enable for a small `rolloutPercentage`, watch the new metrics above
(queue depth, reservation-expiry rate, checkout error rate) for a
representative window, then ramp to 100%. Other flags follow the same
pattern (`search.meilisearch`, `plugin.loyalty`, etc.) as those land.

## Configuration — three distinct layers, not one bucket

1. **Environment variables** — secrets, per-environment values (DB URL,
   JWT signing keys, Cloudinary credentials). Never business-editable.
2. **`Setting`/`Store`-scoped DB config** — business-editable values an
   admin changes without a deploy (SEO defaults, contact info, tax rates,
   per-store payment/shipping selection). Per
   [v1 16-SENIOR-ARCHITECTURE-REVIEW.md §3](../16-SENIOR-ARCHITECTURE-REVIEW.md)'s
   recommendation, these should be read through a typed registry
   (a `Record<SettingKey, ZodSchema>` in `packages/validation`), not raw
   JSON reads scattered through the codebase.
3. **Feature flags** — rollout control, not business configuration. A
   flag decides *whether new code paths run at all*; a Setting decides
   *how existing, fully-rolled-out behavior is configured*. Conflating
   these two (using a Setting to gate an unfinished feature, or a flag to
   store a permanent business preference) is the kind of drift this
   three-layer split exists to prevent.

## Secrets

Reaffirms [v1 12-SECURITY-REVIEW.md §9](../12-SECURITY-REVIEW.md#9-secrets-management)
(env-var-only, never committed, separate per environment). One addition
for the multi-store extension points in
[04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md): any per-store
third-party credential (a client's own payment gateway key, once more
than one store exists) is stored as a `credentialsRef` pointing at a
secrets manager entry — **never** inline in `StorePaymentConfig` or any
other database row, even though today there's only one store and it
would be tempting to just put the credential in the table directly.

## Backup

Reaffirms v1's nightly `pg_dump` + off-site copy
([v1 14-DEPLOYMENT.md §6](../14-DEPLOYMENT.md#6-backup-strategy)). One
addition: **Redis persistence changes from RDB-only to AOF enabled.**
Redis now holds real, unrecovered business state via BullMQ (in-flight
webhook deliveries, queued emails, pending outbox relay work) — losing an
hour of Redis to a crash under RDB-only snapshotting means losing real
business actions, not just a warm cache, per
[ADR 0003](adr/0003-background-job-system.md).

## Monitoring

Reaffirms v1's external uptime checks
([v1 14-DEPLOYMENT.md §7](../14-DEPLOYMENT.md#7-monitoring--logging)),
adds: alerting on queue depth (via the metrics in this document) and on
`OutboxEvent`/job rows reaching `FAILED` status — both are early-warning
signals for exactly the new failure modes this v2 redesign introduces
(a stuck relay, a dead worker), and neither existed as a concept in v1.

## Disaster Recovery — explicit objectives

v1 stated backups exist; it never stated how fast recovery should be or
how much data loss is acceptable. v2 states both:

- **RPO (Recovery Point Objective): ≤ 24 hours**, matching the existing
  nightly `pg_dump` cadence. (Tightening this — e.g., continuous WAL
  archiving for a near-zero RPO — is a legitimate future upgrade, not a
  launch requirement; noted in
  [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md).)
- **RTO (Recovery Time Objective): ≤ 4 hours** — restore the latest dump
  onto a fresh VPS and have all three apps + the worker running again.

These are targets to **test against** — the freeze checklist
([11-FREEZE-CHECKLIST.md](11-FREEZE-CHECKLIST.md)) requires at least one
timed restore drill before launch, not just a documented number nobody
has verified.
