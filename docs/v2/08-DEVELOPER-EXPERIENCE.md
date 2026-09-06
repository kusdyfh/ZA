# ZA Store — Developer Experience (Priority 6)

Full detail behind [ADR 0010](adr/0010-developer-experience-governance.md).

## Monorepo Strategy

Reaffirms v1's pnpm workspaces + Turborepo
([v1 02-FOLDER-STRUCTURE.md](../02-FOLDER-STRUCTURE.md)). Two additions
from this redesign:
- `apps/worker` joins `apps/web`/`apps/admin`/`apps/api` as a fourth
  deployable app (per [ADR 0003](adr/0003-background-job-system.md)) —
  same monorepo, same shared `packages/*`, its own `package.json` and PM2
  process.
- `packages/events` — a new shared package holding the typed payload
  shape for every `OutboxEvent` type (per
  [ADR 0002](adr/0002-event-architecture.md)), imported by both the
  publishing context and every subscriber, so an event's payload shape is
  defined once and can't silently drift between publisher and consumer —
  the same "shared source of truth" discipline v1 already applied to
  `packages/validation`.

## Code Ownership

A `CODEOWNERS`-equivalent mapping bounded context → responsible person,
named now even for a one-person team:

```
modules/checkout/      @primary-architect
modules/inventory/     @primary-architect
modules/orders/        @primary-architect
modules/payments/      @primary-architect
... (one line per context)
```

The convention existing before a second contributor arrives means
onboarding them is "here's who owns what," not an ad hoc conversation.

## Module Boundaries

Reaffirms v1's lint-enforced Clean Architecture boundaries
([v1 15-PROJECT-STANDARDS.md §4](../15-PROJECT-STANDARDS.md#4-code-style)).
One rule added, per [ADR 0007](adr/0007-plugin-architecture.md): a plugin
module may depend on a core port; core must never import a specific
plugin's implementation. Enforced by the same boundaries-lint tool, one
more rule in its config — not new tooling.

## ADR Process

Formalized by this very v2 pass (see
[00-OVERVIEW.md](00-OVERVIEW.md)). Going forward:
- Every architecturally significant decision gets a numbered ADR in the
  current version's `adr/` directory.
- `Status`: `Proposed → Accepted → Superseded`. A superseding ADR always
  names what it replaces (`Supersedes: ADR NNNN`) — never a silent edit.
- An ADR that only affects one document can skip the RFC step below; an
  ADR resulting from an RFC references it.

## RFC Process

For changes larger than one ADR's natural scope — a real multi-tenancy
migration, a new plugin category, a payment-gateway switch — a
lightweight RFC precedes the ADR:

```
# RFC: <title>
## Problem
## Proposed approach
## Alternatives considered
## Open questions
```

Circulated for discussion before anything is decided. This distinguishes
"we're exploring this" from "we decided this" — a distinction v1 lacked,
which is part of why the senior review found several v1 "should"
statements reading as unenforced aspiration rather than settled decisions.

## Migration Strategy

Reaffirms v1's additive-first, two-phase-destructive discipline
([v1 14-DEPLOYMENT.md §9](../14-DEPLOYMENT.md#9-zero-downtime-deployment)).
Addition: any migration implementing a decision from an ADR references
that ADR's number in the migration file name or leading comment
(`20260215_add_stock_reservation__ADR-0001.sql`) — so `git blame`/migration
history always leads back to the reasoning, not just the diff.

## Versioning Strategy

This documentation set is itself versioned. v1 remains the historical
first pass, untouched. v2 supersedes v1 for the areas its ADRs cover via
explicit references, not edits. A hypothetical v3 follows the identical
pattern: new ADRs, a new `docs/v3/` directory, explicit `Supersedes` lines
back to v2 — never a rewrite of a prior version's files. The API's own
`/v1/`, `/v2/` URI versioning (per
[v1 08-API-REVIEW.md §9](../08-API-REVIEW.md#9-versioning)) is a separate,
unrelated versioning axis — worth stating plainly so "v2" in a
conversation is unambiguous: API v2 (a URL prefix) and Architecture v2
(this document set) are not the same thing and will not necessarily ship
together.

## Testing Pyramid — additions for v2 concerns

On top of [v1 15-PROJECT-STANDARDS.md §5](../15-PROJECT-STANDARDS.md#5-testing-strategy)'s
layer-appropriate strategy:

| New test category | What it verifies | Why it's new |
|---|---|---|
| Reservation concurrency test | Many simulated concurrent checkout attempts against a variant with limited stock never oversell, and losers get a fast, clean `PRODUCT_OUT_OF_STOCK` rather than hanging on a lock | [ADR 0001](adr/0001-inventory-reservation-strategy.md)'s entire purpose was fixing a concurrency bug — a unit test of the happy path doesn't prove it's fixed; a concurrency test does |
| Outbox idempotency test | Processing the same `OutboxEvent` twice (simulating a relay crash-and-retry) produces no duplicate side effect | [ADR 0002](adr/0002-event-architecture.md)'s at-least-once delivery model requires every subscriber to be idempotent by construction, not by luck |
| Plugin-registry test | A disabled plugin's routes return 404, not a hidden-but-reachable endpoint; its event subscriptions never bind | [ADR 0007](adr/0007-plugin-architecture.md) — "disabled" must mean genuinely absent, not just unlinked from a menu |
| Actor-reference integrity test | Every write to a polymorphic `actorId`/`actorType` pair goes through the shared `buildActorRef()` helper, never constructed ad hoc | [ADR 0005](adr/0005-actor-reference-model.md)'s one enforcement mechanism is process, not a DB constraint — a test is the next-best guarantee |

These tie directly to the v1-flagged, previously-unenforced "80%
domain-layer coverage" target
([v1 15-PROJECT-STANDARDS.md §5](../15-PROJECT-STANDARDS.md#5-testing-strategy),
flagged in [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #25](../16-SENIOR-ARCHITECTURE-REVIEW.md))
by giving it concrete, gateable new test categories rather than leaving
it an abstract percentage nobody checks in CI.
