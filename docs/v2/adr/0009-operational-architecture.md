# ADR 0009: Operational Architecture

**Status**: Accepted
**Supersedes**: [v1 14-DEPLOYMENT.md §6-7](../../14-DEPLOYMENT.md#6-backup-strategy)'s
backup/monitoring sections, which stated backups and uptime checks exist
but never named recovery objectives; adds logging/tracing/metrics/health/
feature-flag concerns v1 didn't cover at all.
**Full detail**: [07-OPERATIONAL-ARCHITECTURE.md](../07-OPERATIONAL-ARCHITECTURE.md).

## Context

v1's operational story was reasonable for launch but incomplete in ways
that matter once the system has the new moving parts this v2 pass
introduces (a worker process, an outbox, reservations with real-money
consequences if mishandled). "Backups exist" isn't the same as "we know
how fast we can recover and how much data we'd lose."

## Decision

Six additions to the operational baseline:

1. **Logging**: structured JSON (unchanged from v1) plus a correlation/
   request ID propagated through every log line *and* through Outbox event
   payloads — so one customer action is traceable end-to-end across
   API → Outbox → worker → webhook, which wasn't possible in v1's design
   at all.
2. **Tracing**: OpenTelemetry instrumentation added now, even before a
   hosted trace backend is chosen — cheap to instrument early, expensive
   to retrofit into code that was never annotated. Backend choice (Jaeger/
   Tempo/hosted) is deferred, see
   [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md).
3. **Metrics**: a Prometheus-format `/metrics` endpoint — request latency/
   count per route, BullMQ queue depth, DB pool utilization. Queue-depth
   metrics specifically are the monitoring answer to
   [ADR 0001](0001-inventory-reservation-strategy.md)/
   [0003](0003-background-job-system.md)'s dependency on the sweep/relay
   jobs actually running — a growing `maintenance` or `outbox-relay` queue
   is now something that pages someone, not a silent failure.
4. **Health checks**: `@nestjs/terminus`-based `/health` (liveness) and
   `/health/ready` (readiness: DB reachable, Redis reachable, migrations
   applied) as distinct endpoints — v1 only had one undifferentiated
   health concept.
5. **Feature flags**: a `FeatureFlag(key, storeId, isEnabled,
   rolloutPercentage?)` table — this is the concrete mechanism for rolling
   out this very v2 redesign safely (e.g., `checkout.reservation_v2` at 5%
   of traffic, verified, then 100%, rather than a big-bang cutover the
   first time reservation-based checkout runs in production).
6. **Disaster recovery objectives**: explicit numbers instead of "backups
   exist" — **RPO (Recovery Point Objective) ≤ 24 hours** (matching the
   existing nightly `pg_dump` cadence) and **RTO (Recovery Time Objective)
   ≤ 4 hours** (restore onto a fresh VPS from the off-site copy) — stated
   as targets to test against, not aspirations.

Also: Redis persistence changes from default RDB-only snapshotting to
**AOF enabled** — now that Redis holds real in-flight job state (webhook
deliveries, email sends) via BullMQ, not just caches and rate-limit
counters, per [ADR 0003](0003-background-job-system.md), losing an hour of
Redis state on a crash means losing real, unrecovered business actions,
not just a warm cache.

## Consequences

- Adds `/metrics`, `/health`, `/health/ready` endpoints and an OTel
  dependency to `apps/api` — modest runtime overhead, standard practice.
- Establishes the mechanism (feature flags) that makes every other v2
  change in this document set safely rollout-able rather than a
  synchronized big-bang deploy.
- Turns "we have backups" into a testable claim (RPO/RTO), which the
  freeze checklist ([11-FREEZE-CHECKLIST.md](../11-FREEZE-CHECKLIST.md))
  requires being verified at least once before launch, not just assumed.

## Alternatives Considered

- **Defer observability tooling until post-launch, "we'll add it when we
  need it."** Rejected for tracing specifically — instrumentation added
  after the fact requires touching every service; added inline during
  Phase 0/1 build-out it's nearly free. Metrics/health are similarly cheap
  now, expensive as an afterthought.
- **Skip feature flags, rely on careful code review and a maintenance
  window for the reservation-checkout cutover.** Rejected — a maintenance
  window doesn't de-risk a novel concurrency-sensitive change (reservation
  logic) the way gradual, measurable rollout does.
