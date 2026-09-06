# ZA Store — Architecture v2

## What this is

Architecture v1 ([docs/01](../01-ARCHITECTURE.md)–[15](../15-PROJECT-STANDARDS.md))
was reviewed against production-grade, principal-architect scrutiny in
[docs/16-SENIOR-ARCHITECTURE-REVIEW.md](../16-SENIOR-ARCHITECTURE-REVIEW.md).
That review found five P0 issues that must not ship as designed, plus a
gap between v1's "reusable enterprise platform" ambition and what the
concrete schema/API design actually supported.

**Architecture v2 is the redesign that resolves those findings.** It does
not edit the v1 documents in place. v1 stays as-is, as the historical
record of the first design pass. v2 is a set of **Architecture Decision
Records (ADRs)** plus supporting strategy documents that supersede specific
v1 decisions, each one explicit about *what it replaces and why*. Where v2
is silent on a v1 topic, v1 still stands — this is a targeted redesign of
the areas the review flagged, not a rewrite of everything.

## Why ADRs, not edits

Patching the v1 documents in place would erase the reasoning trail —
future readers (including a future version of this team) would have no
record of what was tried first, why it broke down, and why the
replacement is better. An ADR captures a decision, its context, and its
consequences permanently; a silently-edited paragraph doesn't. This
project now has a standing rule (formalized in
[adr/0010](adr/0010-developer-experience-governance.md)): **architecturally
significant decisions get an ADR going forward, full stop — including any
decision that later supersedes one made here.**

## How to read this directory

```
docs/v2/
├── 00-OVERVIEW.md                    ← you are here
├── adr/                               ← the actual decisions, one per record
│   ├── 0001-inventory-reservation-strategy.md
│   ├── 0002-event-architecture.md
│   ├── 0003-background-job-system.md
│   ├── 0004-order-snapshot-redesign.md
│   ├── 0005-actor-reference-model.md
│   ├── 0006-saas-ready-schema-pattern.md
│   ├── 0007-plugin-architecture.md
│   ├── 0008-integration-architecture.md
│   ├── 0009-operational-architecture.md
│   ├── 0010-developer-experience-governance.md
│   ├── 0011-data-driven-rbac-schema.md        ← added during Epic 2, per adr/0010's rule
│   ├── 0012-store-scoping-extended-to-catalog-taxonomy.md  ← added during Epic 3A
│   ├── 0013-store-scoping-extended-to-variant-attributes.md ← added during Epic 3B
│   ├── 0014-warehouse-scoping-and-single-warehouse-model.md ← added during Epic 4
│   ├── 0015-guest-checkout-and-minimal-order-dependencies.md ← added during Epic 5
│   ├── 0016-api-layer-conventions.md                        ← added during Epic 6
│   ├── 0017-authentication-and-authorization.md              ← added during Epic 7
│   ├── 0018-customer-accounts.md                              ← added during Epic 8
│   ├── 0019-admin-dashboard-frontend.md                        ← added during Epic 9
│   ├── 0020-storefront-release-paused-catalog-read-gap.md       ← added during Epic 10 (paused)
│   ├── 0021-public-catalog-read-api.md                           ← added during Epic 9.5
│   ├── 0022-storefront-frontend-architecture.md                   ← added during Epic 10
│   ├── 0023-event-architecture-and-job-system-implementation.md   ← added during Epic 11
│   ├── 0024-notifications.md                                      ← added during Epic 11
│   ├── 0025-cms-and-seo.md                                        ← added during Epic 11
│   ├── 0026-payments.md                                           ← added during Epic 12
│   └── 0027-shipping.md                                           ← added during Epic 12
├── 01-CONTEXT-MAP-V2.md               ← updated DDD context map
├── 02-DATABASE-STRATEGY-V2.md          ← concrete schema changes from the ADRs
├── 03-EVENT-FLOW-DIAGRAMS.md            ← how events actually move through the system
├── 04-SAAS-EXTENSION-POINTS.md           ← Priority 2, in full
├── 05-PLUGIN-ARCHITECTURE.md              ← Priority 3, in full
├── 06-INTEGRATION-ARCHITECTURE.md          ← Priority 4, in full
├── 07-OPERATIONAL-ARCHITECTURE.md           ← Priority 5, in full
├── 08-DEVELOPER-EXPERIENCE.md                ← Priority 6, in full
├── 09-DEPLOYMENT-STRATEGY-V2.md                ← updated topology
├── 10-MIGRATION-NOTES.md                        ← what changes in the v1 roadmap, phase by phase
├── 11-FREEZE-CHECKLIST.md                        ← gate for actually starting Phase 0
└── 12-OPEN-QUESTIONS.md                           ← what this pass deliberately did not decide
```

Read the ADRs first (`adr/0001`–`0010`) — they're short, decision-focused,
and each names exactly what it replaces from v1. The numbered documents
after that are the fuller specifications the ADRs reference; read them
when you need the "exactly how" behind a decision, not before.
[adr/0011](adr/0011-data-driven-rbac-schema.md) was added after this pass
was frozen and Epic 2 implementation began — it documents a schema
decision made while building the Identity Core, per the standing rule in
adr/0010 that implementation-time architectural decisions get their own
ADR rather than being silently absorbed into code.

## What changed, in one paragraph per priority

- **Priority 1 (must-fix)**: stock is no longer locked across a payment
  call — a proper reservation-with-expiry model replaces it
  ([adr/0001](adr/0001-inventory-reservation-strategy.md)). Domain events
  now have a real delivery mechanism — a transactional outbox feeding
  BullMQ, not prose describing pub/sub that didn't exist
  ([adr/0002](adr/0002-event-architecture.md)). Background jobs get an
  actual home ([adr/0003](adr/0003-background-job-system.md)). Orders
  snapshot everything needed for immutable history — address, customer
  info, tax, currency — not just line items
  ([adr/0004](adr/0004-order-snapshot-redesign.md)). Actor references are
  normalized with a deliberate, non-uniform rule: real relations where the
  actor type is fixed, a polymorphic `Actor{id,type}` shape where it
  genuinely varies, and never a bare untyped string again
  ([adr/0005](adr/0005-actor-reference-model.md)).
- **Priority 2 (future-ready)**: a `Store` singleton and store-scoped
  columns are introduced *now*, seeded with exactly one row, so the
  eventual multi-tenant migration is "allow more rows + add RLS," not "add
  a column to every table under live data"
  ([adr/0006](adr/0006-saas-ready-schema-pattern.md),
  [04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)).
- **Priority 3 (plugins)**: an in-process, NestJS-DI-based plugin registry
  — deliberately *not* a sandboxed external plugin runtime, which would be
  over-engineering for a platform with no third-party plugin developers yet
  ([adr/0007](adr/0007-plugin-architecture.md)).
- **Priority 4 (integration)**: webhooks, API keys, and a deferred-but-
  specified OAuth seam for future third-party/mobile/POS clients
  ([adr/0008](adr/0008-integration-architecture.md)).
- **Priority 5 (operational)**: logging, tracing, metrics, health checks,
  feature flags, and — new — explicit RPO/RTO numbers instead of "backups
  exist" ([adr/0009](adr/0009-operational-architecture.md)).
- **Priority 6 (developer experience)**: the ADR/RFC process this very
  document is an example of, plus ownership and testing-pyramid additions
  for the new v2 concerns
  ([adr/0010](adr/0010-developer-experience-governance.md)).

## What this pass explicitly did not do

Per the brief: no tenancy was implemented, no code was written, no v1
document was edited. Several things were deliberately deferred rather than
decided — see [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md). Deferring a
decision here is itself a decision, and is recorded as such, not left
implicit the way several v1 gaps were.
