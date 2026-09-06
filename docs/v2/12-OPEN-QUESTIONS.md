# ZA Store — Open Questions & Deferred Decisions

Deferring a decision is itself a decision, and is recorded as such here —
none of this was silently left implicit the way several v1 gaps were.
Nothing in this list blocks the freeze checklist; everything in this list
has a stated trigger condition for when it needs to be revisited.

## Multi-tenancy isolation mechanism

[ADR 0006](adr/0006-saas-ready-schema-pattern.md) prepares `storeId`
scoping but explicitly does not choose between: Postgres Row-Level
Security (least app-code risk, most upfront setup complexity),
schema-per-tenant (simpler RLS story, more migration-tooling friction
since Prisma migrations would need to run per-schema), or continuing the
current db-per-client model indefinitely (simplest, but doesn't scale
past a handful of client deployments per
[v1 16-SENIOR-ARCHITECTURE-REVIEW.md §2](../16-SENIOR-ARCHITECTURE-REVIEW.md)).
**Trigger to decide**: when a second real client deployment is actually
being scoped, not before — deciding this speculatively risks optimizing
for a shape of multi-tenancy that turns out wrong once real requirements
exist.

## Platform/Tenant Administration context

Identified as missing in
[01-CONTEXT-MAP-V2.md](01-CONTEXT-MAP-V2.md) but deliberately not
designed — its responsibilities (managing which stores exist, billing,
cross-store staff) depend entirely on which isolation mechanism above is
chosen. **Trigger**: same as above.

## Multi-currency product pricing

[04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md) names the
pattern (`ProductPrice(storeId, currencyCode, amount)` as an additive
side-table) but doesn't build it. **Trigger**: the first store (or a
future ZA Store expansion) that needs to price the same product in more
than one currency.

## i18n / Translation table

Same treatment — pattern named
([04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)), not built.
**Trigger**: the first store that needs more than one content locale.

## Tracing backend

[07-OPERATIONAL-ARCHITECTURE.md](07-OPERATIONAL-ARCHITECTURE.md)
instruments OpenTelemetry now but doesn't pick between self-hosted
(Jaeger/Tempo, on the same VPS or a small separate box) vs. a hosted
provider. **Trigger**: whenever debugging a real cross-service latency
issue in production becomes hard enough without one — likely early in
Phase 3-6 given the number of new async paths (Outbox, workers, webhooks)
this redesign introduces, but not a Phase 0 requirement.

## Disaster-recovery RPO tightening

[07-OPERATIONAL-ARCHITECTURE.md](07-OPERATIONAL-ARCHITECTURE.md) states a
24-hour RPO matching nightly `pg_dump`. Continuous WAL archiving (near-
zero RPO) is a legitimate upgrade path, not adopted now. **Trigger**:
order volume/value reaching a point where 24 hours of potential data loss
is a genuine business risk rather than a theoretical one — a judgment
call for the business, not a technical one this document can make.

## Actor model: generic `Actor` table vs. the two-field polymorphic pattern

[ADR 0005](adr/0005-actor-reference-model.md) chose `actorId`/`actorType`
over a single generic `Actor` entity with a real enforced FK, on the
grounds that only two fields currently need the polymorphic shape.
**Trigger to revisit**: if a third, fourth, fifth polymorphic actor
reference appears — at that point, the write-through complexity of a
real `Actor` table starts being worth its cost, and this decision should
be reopened via a new ADR, not silently changed.

## Plugin schema composition tooling

[05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md) accepts that
disabled-plugin tables still exist in the schema, given Prisma's
single-file schema constraint. **Trigger**: if the number of optional
plugins grows large enough that unused tables become a genuine schema-
clutter or migration-time problem — not a concern at three plugins
(Marketing, Loyalty, Gift Cards).

## Future AI modules — what "AI" concretely means

[05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md) names two ports
(`AIAssistPort`, `RecommendationPort`) with zero implementation and no
chosen provider/model. **Trigger**: a specific, scoped AI feature request
— this is deliberately not speculated on further here, since guessing at
AI feature shape before a real use case exists is a good way to build the
wrong port.

## OAuth2 and mobile-app JWT audience

[06-INTEGRATION-ARCHITECTURE.md](06-INTEGRATION-ARCHITECTURE.md) specifies
both seams without building either. **Trigger**: a real third-party
client (a mobile app, a partner integration) actually being commissioned.

## Search engine swap-in (Meilisearch/Typesense)

Flagged in [v1 16-SENIOR-ARCHITECTURE-REVIEW.md §1](../16-SENIOR-ARCHITECTURE-REVIEW.md)
as necessary around the 500,000-product tier; not addressed by this v2
pass at all (out of scope — this redesign targeted the P0-P6 items in the
brief, not every finding from the prior review). **Trigger**: approaching
that product-count tier, or sooner if faceted-search UX becomes a launch
requirement.

## Coupon/Promotion rule engine split

Also flagged in the prior review
([v1 16-SENIOR-ARCHITECTURE-REVIEW.md §3](../16-SENIOR-ARCHITECTURE-REVIEW.md))
and also out of scope for this pass — `Coupon` still conflates
manual-code and future automatic/tiered discounts. **Trigger**: before
[v1 05-ROADMAP.md](../05-ROADMAP.md) Phase 4 locks the current model
further, per that finding's original priority.

## Payment/Refund and Shipping/ShippingZone model normalization

Same status — recommended in the prior database review
([v1 07-DATABASE-REVIEW.md §1](../07-DATABASE-REVIEW.md#1-normalization)),
not built by this pass, unaffected by it, still pending. Not duplicated
into [02-DATABASE-STRATEGY-V2.md](02-DATABASE-STRATEGY-V2.md) to avoid two
documents describing the same not-yet-built models — this entry exists so
it isn't lost between two review passes.

---

**A note on scope discipline**: this list intentionally separates "things
this v2 pass decided to defer" (with a stated trigger) from "things the
prior senior review flagged that this pass didn't touch at all" (the last
three items) — conflating the two would make it look like this redesign
either solved or dismissed findings it simply wasn't scoped to address.
Both categories remain real, tracked work.
