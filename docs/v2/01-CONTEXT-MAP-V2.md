# ZA Store — Context Map v2

Updates [v1 06-DDD-BOUNDED-CONTEXTS.md](../06-DDD-BOUNDED-CONTEXTS.md)'s
context map with what changed under this redesign. Contexts not mentioned
here are unchanged from v1 — this is a diff, not a rewrite.

## What changed and why

| Context | Change | Reason |
|---|---|---|
| **Inventory** | `VariantStock` aggregate now explicitly includes `StockReservation` alongside `ProductVariant.stock` and the `StockMovement` ledger — a reservation is part of Inventory's consistency boundary, not Checkout's. | [ADR 0001](adr/0001-inventory-reservation-strategy.md) |
| **Checkout** | No longer described as holding domain state across a lock — it *requests* a reservation from Inventory, *initiates* payment (outside any lock), and *confirms* on success. Its saga is now explicit steps with named compensations, not an implicit procedural flow. | [ADR 0001](adr/0001-inventory-reservation-strategy.md) |
| **Orders** | `Order` aggregate now owns its full snapshot (address, customer info, tax, currency, payment reference) — its consistency boundary is unchanged (still `Order` + `OrderItem` + `OrderStatusHistory` + `OrderNote`), but what it *contains* is wider. | [ADR 0004](adr/0004-order-snapshot-redesign.md) |
| **Identity / Administration** | Actor references crossing context boundaries (an admin or the system acting within Orders, Inventory) now flow through the `Actor{id, type}` shape defined by Identity/Administration jointly, rather than each consuming context inventing its own reference shape. | [ADR 0005](adr/0005-actor-reference-model.md) |
| **All contexts** | Every aggregate root now carries an implicit `storeId` — every context's repository interface gains a store-scoping parameter. This does not change any context's responsibilities or boundaries, only the identity scope its data lives in. | [ADR 0006](adr/0006-saas-ready-schema-pattern.md) |
| **Payments, Shipping, Notifications, CMS, Analytics, Reviews** | Formally classified per [ADR 0007](adr/0007-plugin-architecture.md) as swappable-adapter, core-with-swappable-backing, or true-optional-plugin — see the table there. No context's core responsibilities changed; what changed is which *implementations* are pluggable. |

## New, cross-cutting infrastructure concerns (not bounded contexts)

Two additions to the map are deliberately **not** modeled as DDD bounded
contexts, because they aren't domains with business rules of their own —
they're infrastructure every context relies on:

- **Integration Events (Outbox)** — the mechanism from
  [ADR 0002](adr/0002-event-architecture.md) that every context publishes
  through and several subscribe via. Shown on the map as a shared spine
  underneath every context, not a box beside them.
- **Background Jobs (Workers)** — the mechanism from
  [ADR 0003](adr/0003-background-job-system.md) that carries out sweeps,
  relays, and deliveries on every context's behalf. Also a shared spine,
  not a domain context.

Treating these as contexts would be a category error — they have no
ubiquitous language, no business invariants, no aggregates. They are
plumbing, and the map says so explicitly rather than forcing them into the
DDD vocabulary v1 used for everything.

## New context, deferred: Platform/Tenant Administration

Identified in [16-SENIOR-ARCHITECTURE-REVIEW.md §2](../16-SENIOR-ARCHITECTURE-REVIEW.md)
as missing entirely: a context above the per-store `AdminRole` matrix,
responsible for *which stores exist*, platform billing, and cross-store
platform staff. **Not built.** Shown on the map as a dotted, future box —
its responsibilities, entities, and events are intentionally left
unspecified until real multi-tenancy (per
[12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md)) is actually decided, since
designing it prematurely risks guessing wrong about what "managing many
stores" concretely requires before there's a second store to learn from.

## Updated Context Map

```
                                   ┌──────────────┐
                                   │   Identity    │  (Generic, foundational)
                                   └──────┬───────┘
                          ┌────────────────┼───────────────────────┐
                          ▼                ▼                       ▼
                   ┌────────────┐   ┌───────────┐         ┌────────────────┐
                   │ Customers   │   │  Admin-    │         │ (all contexts —│
                   │(Supporting) │   │istration   │         │  actor identity│
                   └─────┬──────┘   │ (Generic)  │         │  via Actor{id, │
                         │           └───────────┘         │  type} per     │
                         │                                  │  ADR 0005)     │
                         │                                  └────────────────┘
                         ▼
     ┌────────────┐      ┌────────────┐      ┌──────────┐
     │  Catalog     │◄─────┤ Checkout    │─────►│ Coupons   │
     │  (Core)      │      │  (Core,     │      │(Supporting)│
     └─────┬───────┘      │  saga —     │      └──────────┘
           │                │ reserve →   │
           ▼                │ pay → confirm│
     ┌────────────┐         └─────┬───────┘
     │ Inventory    │◄─────────────┤
     │  (Core, now   │              ▼
     │  incl. Stock-  │        ┌───────────┐      ┌───────────┐
     │  Reservation)   │        │   Orders   │─────►│ Payments   │
     └────────────┘         │   (Core, now│      │ (Generic)  │
                              │  full       │      └───────────┘
                              │  snapshot)  │
                              └─────┬───────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │ Shipping   │
                              │(Supporting)│
                              └───────────┘

  ┌──────────┐  ┌──────┐  ┌───────────────┐  ┌───────────┐  ┌─────────────┐
  │ Reviews   │  │ CMS   │  │ Notifications  │  │ Analytics  │  │  Plugins:    │
  │(Supporting│  │(Supp.,│  │   (Generic,     │  │(Supporting,│  │  Marketing,  │
  │ + plugin  │  │+ plugin│  │  event         │  │+ plugin sink│  │  Loyalty,    │
  │ provider  │  │ backing│  │  subscriber)    │  │per ADR 0007)│  │  Gift Cards  │
  │ per       │  │per ADR │  └───────────────┘  └───────────┘  │  (per ADR    │
  │ ADR 0007) │  │ 0007)  │                                       │  0007)       │
  └──────────┘  └──────┘                                       └─────────────┘

        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
        ░ Integration Events (Outbox) & Background Jobs (Workers)         ░
        ░ — shared infrastructure spine underneath every context above,   ░
        ░   per ADR 0002/0003. Not a bounded context.                     ░
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

        ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
          Platform/Tenant Admin   (deferred — see Open Questions;
          (future, undesigned)     not part of this architecture yet)
        └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Relationship patterns — one addition

v1 named Shared Kernel, Customer-Supplier, Open Host Service,
Anticorruption Layer, and Conformist. v2 adds:

- **Published Language via Events** — the Outbox's event payloads
  (per [03-EVENT-FLOW-DIAGRAMS.md](03-EVENT-FLOW-DIAGRAMS.md)) are now the
  *actual* contract between contexts, not an aspiration. A context
  changing an event's payload shape is a breaking change to every
  subscriber, exactly like a REST API contract — and should go through the
  same discipline (versioned event payloads, not silent field renames),
  formalized in [08-DEVELOPER-EXPERIENCE.md](08-DEVELOPER-EXPERIENCE.md).
