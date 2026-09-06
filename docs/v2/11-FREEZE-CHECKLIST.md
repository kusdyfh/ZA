# ZA Store — Architecture Freeze Checklist

Gates the actual start of Phase 0. Every item traces to the ADR or
document that resolves it — this checklist doesn't introduce new
decisions, it verifies the ones already made are complete and consistent.

## Priority 1 — Must Fix (all block freeze)

- [ ] `StockReservation` entity, lifecycle, and available-stock formula
      match [ADR 0001](adr/0001-inventory-reservation-strategy.md) —
      confirmed no design still holds a lock across an external payment
      call.
- [ ] Event delivery mechanism (Outbox → in-process/BullMQ) matches
      [ADR 0002](adr/0002-event-architecture.md) — every event named in
      [v1 06-DDD-BOUNDED-CONTEXTS.md](../06-DDD-BOUNDED-CONTEXTS.md) has a
      publisher, subscriber(s), payload, and retry/failure policy in the
      table there.
- [ ] `za-worker`, queue list, retry/DLQ policy match
      [ADR 0003](adr/0003-background-job-system.md).
- [ ] `Order` snapshot fields (address, customer, payment, tax, currency)
      match [ADR 0004](adr/0004-order-snapshot-redesign.md) — confirmed no
      display path still joins live to `Customer`/`Address` for historical
      orders.
- [ ] Every actor-reference field in the schema is either a real relation
      (fixed actor type) or an explicit `actorId`/`actorType` pair
      (polymorphic) — zero bare untyped `String?` actor references remain,
      per [ADR 0005](adr/0005-actor-reference-model.md).

## Priority 2 — Future Ready

- [ ] `Store` singleton + `storeId` scoping applied to every table listed
      in [ADR 0006](adr/0006-saas-ready-schema-pattern.md) — confirmed
      behaviorally identical to v1 with exactly one seeded row.
- [ ] Every extension point in
      [04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md) (Stores,
      Branding/Themes, Media, Payments, Shipping, Notifications, Taxes,
      Currencies) has its "cost today" mechanism actually in place —
      Languages/i18n is explicitly a documented-not-built pattern, not a
      gap (see Open Questions).

## Priority 3 — Plugins

- [ ] `PlatformPlugin` contract and `PluginRegistry` exist per
      [ADR 0007](adr/0007-plugin-architecture.md).
- [ ] Every module in the brief's list (CMS, Payments, Shipping,
      Analytics, Notifications, Reviews, Marketing, Loyalty, Gift Cards,
      future AI) is classified (swappable adapter / core-with-swappable-
      backing / true optional plugin / seam-only) in
      [05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md) — none left
      unclassified.
- [ ] Plugin-registry test category exists per
      [08-DEVELOPER-EXPERIENCE.md](08-DEVELOPER-EXPERIENCE.md).

## Priority 4 — Integration

- [ ] `WebhookSubscription` and `ApiKey` models + delivery/retry mechanism
      match [ADR 0008](adr/0008-integration-architecture.md).
- [ ] OAuth2, mobile-app-audience, and POS-orchestration seams are
      documented as deferred-with-a-trigger-condition, not silently
      absent.
- [ ] ERP/inbound-integration write paths confirmed to route through
      existing domain services (e.g., `StockAdjustmentService`), never a
      parallel unaudited path.

## Priority 5 — Operational

- [ ] Logging correlation ID, tracing instrumentation, `/metrics`,
      `/health` + `/health/ready` match
      [ADR 0009](adr/0009-operational-architecture.md).
- [ ] `FeatureFlag` mechanism exists and `checkout.reservation_v2` is the
      confirmed rollout vehicle for [ADR 0001](adr/0001-inventory-reservation-strategy.md).
- [ ] Redis persistence set to AOF, not RDB-only.
- [ ] RPO (≤24h) / RTO (≤4h) targets stated **and at least one timed
      restore drill actually performed** before this box is checked — a
      stated number with no drill does not satisfy this item.

## Priority 6 — Developer Experience

- [ ] ADR template and `docs/v2/adr/` numbering convention in active use
      (this document set is the proof).
- [ ] RFC template exists for the next large change.
- [ ] `CODEOWNERS`-equivalent mapping exists, even for a one-person team.
- [ ] Boundaries-lint rule extended to cover the plugin dependency
      direction (plugins → core ports, never core → plugin).
- [ ] New test categories (reservation concurrency, outbox idempotency,
      plugin-registry, actor-reference integrity) are written and passing
      — not just specified in prose.

## Cross-cutting sanity checks

- [ ] Every ADR's `Supersedes` line points at a real v1 section, and that
      v1 section still exists unedited (confirming v1 was preserved as
      historical record, per [00-OVERVIEW.md](00-OVERVIEW.md)).
- [ ] [10-MIGRATION-NOTES.md](10-MIGRATION-NOTES.md)'s phase-by-phase
      deltas are reflected in whatever project-tracking tool is actually
      used to run Phase 0 onward — a migration note nobody transcribes
      into the real backlog doesn't accomplish anything.
- [ ] [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md) has been read and
      explicitly acknowledged as deferred (not accidentally treated as
      resolved) by whoever approves the freeze.

## What "frozen" means once this checklist is complete

Freezing v2 means Phase 0 can start against it. It does **not** mean v2 is
permanent — per [ADR 0010](adr/0010-developer-experience-governance.md),
any future revision follows the same ADR discipline this pass established.
Freezing is a statement that the P0 issues are resolved and the
foundation is sound enough to build on, not a claim that nothing here will
ever change again.
