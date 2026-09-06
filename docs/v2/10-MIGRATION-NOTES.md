# ZA Store — Migration Notes

How [v1 05-ROADMAP.md](../05-ROADMAP.md)'s phases change given the ADRs in
this v2 pass. This is the practical "what do I actually do differently"
document — read it before starting Phase 0.

## Phase 0 — Foundations (changed)

**v1 scope**: monorepo scaffold, NestJS bootstrap, JWT auth skeleton,
Next.js scaffolds, CI.

**v2 additions to Phase 0**:
- Add `apps/worker` to the monorepo scaffold from the start (per
  [09-DEPLOYMENT-STRATEGY-V2.md](09-DEPLOYMENT-STRATEGY-V2.md)) — not
  bolted on in a later phase.
- Add Redis + BullMQ to the Phase 0 infrastructure stack (per
  [ADR 0003](adr/0003-background-job-system.md)) — v1 deferred this to
  "Phase 3-4"; it's now foundational, because the reservation sweep and
  outbox relay have no meaningful Phase 0 without it.
- `Store` singleton + `storeId` scaffolding (per
  [ADR 0006](adr/0006-saas-ready-schema-pattern.md)) goes in at the very
  first migration — every subsequent migration in every later phase
  should already include `storeId` from the start, never retrofitted.
- `OutboxEvent`, `ActorType` enum, and the health/metrics endpoints (per
  [ADR 0009](adr/0009-operational-architecture.md)) are part of the
  foundational schema/bootstrap, not added later.
- **Exit criteria addition**: alongside v1's "Super Admin can log in,"
  Phase 0 now also requires: `za-worker` runs and successfully processes a
  trivial test job from a BullMQ queue, proving the queue infrastructure
  actually works before any feature depends on it.

## Phase 1 — Product Catalog (changed)

**v2 additions**:
- `storeId` scoping and composite uniqueness (per
  [ADR 0006](adr/0006-saas-ready-schema-pattern.md)) applied to every
  Catalog model from its first migration — `Product.slug`/`sku`,
  `Category.slug` are `(storeId, ...)` from day one, not migrated later.
- `MediaStoragePort` interface introduced now (per
  [04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)), with
  `CloudinaryAdapter` as the only implementation — the port costs nothing
  extra to introduce at the same time the Cloudinary integration is
  built anyway.
- `Product.currencyCode` field added now (per
  [ADR 0004](adr/0004-order-snapshot-redesign.md)), defaulted to `IQD`.

## Phase 2 — Cart, Wishlist & Customer Accounts (largely unchanged)

**v2 addition**: `storeId` scoping on `Customer.email`/`phone` uniqueness.
No other change — Cart/Wishlist logic is unaffected by this redesign.

## Phase 3 — Checkout & Orders (substantially redesigned)

This is where most of this v2 pass concentrates. **v1's Phase 3 scope
("checkout orchestration, stock lock, order creation") is replaced by**:

- Implement `StockReservation` and the reserve → pay → confirm saga per
  [ADR 0001](adr/0001-inventory-reservation-strategy.md) — this is a
  different implementation from what v1 described, not an addition to it.
- Implement the `Order` snapshot fields per
  [ADR 0004](adr/0004-order-snapshot-redesign.md) from the first Orders
  migration — v1's original (narrower) `Order` shape is never actually
  built; this is the real shape from the start.
- Implement `OutboxEvent` writes for `OrderPlaced`/`OrderStatusChanged`/
  `OrderCancelled` as part of the same transactions that create/update
  orders (per [ADR 0002](adr/0002-event-architecture.md)) — the "new
  order" admin notification (already planned in v1 Phase 3) is now
  implemented *through* the outbox/relay/queue path, not a direct
  synchronous call.
- Actor-reference fields (`OrderStatusHistory.actorId`/`actorType`, per
  [ADR 0005](adr/0005-actor-reference-model.md)) built correctly from the
  first migration.
- **New exit criterion**: the reservation-concurrency test
  (per [08-DEVELOPER-EXPERIENCE.md](08-DEVELOPER-EXPERIENCE.md)) passes —
  simulated concurrent checkouts against limited stock never oversell.
  v1's Phase 3 exit criteria didn't include a concurrency proof at all.
- **Rollout**: ship behind `checkout.reservation_v2` feature flag (per
  [ADR 0009](adr/0009-operational-architecture.md)), ramped gradually —
  this is the platform's first real use of the feature-flag mechanism,
  appropriately, since it's the riskiest change in this entire redesign.

## Phase 4 — Coupons & Discounts (unchanged)

No v2 impact — `storeId` scoping applies mechanically
(`Coupon.code` → `(storeId, code)`), no other change.

## Phase 5 — Reviews & Content (unchanged, plus one plugin note)

CMS's `ContentSourcePort` (per
[05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md)) is worth
introducing during this phase, since it's the same phase v1 already
builds the CMS tables — cheap to add the port now, expensive to
retrofit once content-authoring workflows are built directly against the
concrete tables with no abstraction in between.

## Phase 6 — Admin Dashboard & Notifications (changed)

- The `Notifications` module is now built as an Outbox/BullMQ subscriber
  (per [ADR 0002](adr/0002-event-architecture.md)/
  [0003](adr/0003-background-job-system.md)) from the start, not a direct
  write-to-table call from each publishing context — this was already
  true in Phase 3 for `OrderPlaced`; Phase 6 extends the same pattern to
  `LowStockThresholdCrossed`, `ReviewSubmitted`, `CouponUsageLimitReached`.
- `AnalyticsSinkPort` (per
  [05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md)) is a natural fit
  to introduce here alongside the dashboard build-out — Analytics is
  already consuming the same events for its own rollups.

## Phase 7 — SEO & Performance Hardening (unchanged)

No v2 impact.

## Phase 8 — Security Hardening & Launch Prep (one addition)

- **Disaster-recovery drill**: per
  [ADR 0009](adr/0009-operational-architecture.md), perform at least one
  timed restore against the stated RPO/RTO targets before launch — this
  is new; v1's Phase 8 mentioned backup automation but never a tested
  restore.
- API keys and outbound webhooks (per
  [06-INTEGRATION-ARCHITECTURE.md](06-INTEGRATION-ARCHITECTURE.md)) are
  reasonable to build here if any launch-blocking integration
  (a specific ERP, a specific shipping carrier) needs them — otherwise
  deferred to Phase 9 alongside other integration work.

## Phase 9 — Future (expanded)

v1's list (Gift Box Builder, Reward Points, Referral System, Push
Notifications, WhatsApp Integration) is joined by, from this redesign:
Marketing/Loyalty/Gift Cards as formal plugins (per
[05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md)), OAuth2 (once a
real third-party client exists), concrete Shipping/Payment provider
adapters (once specific providers are chosen), Search engine swap-in
(Meilisearch/Typesense, per
[v1 16-SENIOR-ARCHITECTURE-REVIEW.md §1](../16-SENIOR-ARCHITECTURE-REVIEW.md)),
and Translation-table i18n (per
[04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)). Still
intentionally unscheduled — named here so Phase 9 planning starts from a
complete list, not a rediscovery.

## Net effect on timeline

Phase 0 grows (Redis/BullMQ/worker process moved earlier). Phase 3 grows
substantially (the reservation saga is materially more work than the
single-transaction design it replaces, but it's work that has to happen
regardless — the alternative was shipping a design already identified as
broken under load). No other phase's scope changes materially. This is
disclosed plainly rather than understated: **this redesign makes Phase 0
and Phase 3 bigger, in exchange for not shipping a checkout that falls
over under its own future success.**
