# ZA Store — Domain-Driven Design: Bounded Contexts

This document defines the strategic domain model. It is what makes the
platform **reusable**: every context is designed so a future client's
deployment can swap or reconfigure a *supporting/generic* context (Payments,
Shipping, CMS branding, Notifications channel) without touching the *core*
contexts that encode the actual commerce rules (Catalog, Inventory, Orders).

Each backend module in
[02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md) maps to exactly one
bounded context below. A context may span more than one Prisma model
(see [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)), but a Prisma model is
owned by exactly one context — other contexts only ever reference it by ID,
never reach into its write path directly.

## Subdomain classification

| Subdomain type | Contexts | Investment rationale |
|---|---|---|
| **Core** (the business's competitive differentiator — invest most design/engineering effort here) | Catalog, Inventory, Orders, Checkout | This is where ZA Store's product experience and operational correctness live. Get these wrong and no amount of good UI saves the platform. |
| **Supporting** (necessary, client-specific, but not differentiating) | Customers, Coupons, Shipping, Reviews, CMS, Analytics | Real business logic, but off-the-shelf patterns suffice — don't over-engineer. |
| **Generic** (solved problems — build once, reuse everywhere, or buy) | Identity, Payments, Notifications, Administration | These should be the most reusable, most decoupled, most "boring" code in the platform — every future client gets the same implementation with different config. |

## Context Map

```
                         ┌──────────────┐
                         │   Identity    │  (Generic, foundational)
                         └──────┬───────┘
                    ┌───────────┼────────────────────────┐
                    ▼           ▼                        ▼
             ┌───────────┐ ┌──────────┐           ┌──────────────┐
             │ Customers  │ │  Admin-   │           │  (all other   │
             │(Supporting)│ │istration  │           │   contexts —   │
             └─────┬─────┘ │ (Generic) │           │ actor identity │
                   │        └──────────┘           │  via customerId│
                   │                                │  / adminUserId)│
                   │                                └──────────────┘
                   ▼
   ┌────────────┐     ┌───────────┐      ┌──────────┐
   │  Catalog    │◄────┤ Checkout   │─────►│ Coupons   │
   │  (Core)     │     │  (Core,    │      │(Supporting)│
   └─────┬──────┘     │  orchestr.)│      └──────────┘
         │             └─────┬─────┘
         ▼                   ▼
   ┌────────────┐      ┌───────────┐      ┌───────────┐
   │ Inventory   │◄─────┤   Orders   │─────►│ Payments   │
   │  (Core)     │      │   (Core)   │      │ (Generic)  │
   └────────────┘      └─────┬─────┘      └───────────┘
                              │
                              ▼
                        ┌───────────┐
                        │ Shipping   │
                        │(Supporting)│
                        └───────────┘

   ┌──────────┐    ┌──────┐    ┌───────────────┐   ┌───────────┐
   │ Reviews   │    │ CMS   │    │ Notifications  │   │ Analytics  │
   │(Supporting│    │(Supp.,│    │   (Generic —    │   │(Supporting,│
   │ , reads   │    │ fully │    │  pure event      │   │ read-only  │
   │ Catalog)  │    │decoupl│    │   subscriber)    │   │ projection)│
   └──────────┘    │  ed)  │    └───────────────┘   └───────────┘
                    └──────┘
```

**Relationship patterns used**

- **Shared Kernel** — Identity's `Customer`/`AdminUser` identifiers are the
  one thing every other context shares; nothing else about Identity is shared.
- **Customer–Supplier** — Catalog is upstream of Inventory, Orders, Coupons,
  Reviews (they consume Catalog's product/variant identity but never
  redefine it).
- **Open Host Service** — Payments and Shipping expose a stable port
  (interface) that Checkout calls; the concrete adapter (COD today, a card
  gateway or a specific carrier tomorrow) is swappable per client deployment
  without changing Checkout's orchestration logic.
- **Anticorruption Layer** — any future external system (ERP, WhatsApp
  Business API, a payment gateway's SDK) is wrapped by an adapter inside
  that context's `infrastructure/` layer so its vocabulary never leaks into
  domain code.
- **Conformist** — Notifications and Analytics conform entirely to events
  raised by other contexts; they never ask upstream contexts to change shape
  for their benefit.

---

## Identity

**Responsibilities**: authentication for both staff and customers, token
issuance/rotation, session/device tracking, RBAC role storage (the
*assignment* of a role — the *meaning* of a role's permissions is owned by
Administration).

- **Entities**: `AdminUser`, `Customer` (credentials + auth metadata only),
  `RefreshTokenFamily`
- **Value Objects**: `Email`, `PasswordHash`, `Role`, `JWTClaims`,
  `DeviceFingerprint`
- **Aggregates**:
  - `AdminUser` (root) — credentials, role, active flag
  - `Customer` (root) — credentials, verification state
  - `RefreshTokenFamily` (root) — the rotation chain for one login session
- **Domain Services**: `PasswordHasher` (argon2id), `TokenIssuer`,
  `TokenRotationService` (rotate + reuse-detection), `PermissionResolver`
  (role → permission set, delegating the matrix itself to Administration)
- **Events**: `CustomerRegistered`, `CustomerEmailVerified`,
  `AdminUserCreated`, `PasswordChanged`, `SessionRevoked`,
  `SuspiciousTokenReuseDetected`
- **Dependencies**: none. Identity is the most upstream context — everything
  else depends on it for actor identity, but it depends on nothing else.

> **Boundary note**: `Customer` the *entity* is owned here (login, password,
> verification). Customer *profile enrichment* (addresses, marketing
> preferences) is owned by the **Customers** context and only ever
> references `customerId` — it never mutates auth fields. This is a
> deliberate split to keep authentication logic from being diluted by
> unrelated profile concerns, and is the pattern to copy whenever a future
> context needs "the customer" for something that isn't login.

## Catalog

**Responsibilities**: the product truth — products, variants, media,
categories, collections, brand/attribute taxonomy, SEO metadata ownership,
search indexing. This is a **core** subdomain: ZA Store's brand identity
(colors, gift-box framing, premium photography) lives here.

- **Entities**: `Product`, `ProductVariant`, `ProductMedia`, `Category`,
  `Collection`, `Brand`, `Color`, `Size`, `Tag`
- **Value Objects**: `SKU`, `Barcode`, `Slug`, `Money`, `SEOMeta`,
  `StockThreshold`
- **Aggregates**:
  - `Product` (root — variants and media are internal entities, never
    modified except through the Product aggregate)
  - `Category` (root — self-referential tree)
  - `Collection` (root — ordered product membership)
- **Domain Services**: `PricingService` (resolves effective price from
  `price`/`discountPrice`/variant `priceOverride`), `SlugGenerator`,
  `SearchIndexer` (maintains the `tsvector` projection)
- **Events**: `ProductPublished`, `ProductArchived`, `ProductPriceChanged`,
  `ProductVariantCreated`
- **Dependencies**: none domain-side. Media storage (Cloudinary) is an
  infrastructure adapter, not a domain dependency.

## Inventory

**Responsibilities**: the stock truth — current stock per variant as a
running total, the append-only movement ledger, low-stock detection,
reservation during checkout so two concurrent orders can't oversell the
last unit. **Core** subdomain — a warehouse's daily operations depend on
this being correct, not just fast.

- **Entities**: `StockMovement`
- **Value Objects**: `Quantity`, `StockMovementType`
- **Aggregates**: `VariantStock` — a conceptual aggregate: `ProductVariant.stock`
  (the cached total) plus its `StockMovement` history, mutated only through
  Inventory's domain services, never by a direct Prisma update from another
  module (Checkout *requests* a reservation; it does not decrement stock itself)
- **Domain Services**: `StockReservationService` (short-lived hold during
  checkout, released on failure/timeout), `StockAdjustmentService` (manual
  admin corrections, always ledgered), `LowStockDetector`
- **Events**: `StockReserved`, `StockReservationReleased`, `StockDepleted`,
  `LowStockThresholdCrossed`
- **Dependencies**: Catalog (a `ProductVariant` must exist to hold stock).

## Orders

**Responsibilities**: order lifecycle from placement to
delivered/cancelled/returned, the customer-visible status timeline, admin
notes. **Core** subdomain.

- **Entities**: `Order`, `OrderItem`, `OrderStatusHistory`, `OrderNote`
- **Value Objects**: `OrderNumber`, `Money`, `OrderStatus`
- **Aggregates**: `Order` (root — `OrderItem`, `OrderStatusHistory`,
  `OrderNote` are all inside this aggregate's consistency boundary; nothing
  external ever writes an `OrderItem` row directly)
- **Domain Services**: `OrderNumberGenerator`,
  `OrderStatusTransitionValidator` (enforces the legal state graph —
  e.g. `DELIVERED` cannot transition back to `PENDING`; `CANCELLED` and
  `RETURNED` are terminal)
- **Events**: `OrderPlaced`, `OrderStatusChanged`, `OrderCancelled`,
  `OrderDelivered`
- **Dependencies**: Customers (who + where), Catalog (line-item snapshot at
  time of purchase), Inventory (consumes `StockReserved`/releases on
  cancellation), Coupons (applied discount, read-only), Payments (payment
  status, read-only)

## Customers

**Responsibilities**: profile enrichment and address book — everything
about a customer that isn't authentication (owned by Identity, see the
boundary note above). **Supporting** subdomain.

- **Entities**: `Address`
- **Value Objects**: `PostalAddress`, `PhoneNumber`
- **Aggregates**: `Address` (root, scoped to a `customerId`)
- **Domain Services**: `AddressValidationService` (format/required-field
  checks; not full postal API verification in v1)
- **Events**: `AddressAdded`, `DefaultAddressChanged`
- **Dependencies**: Identity (`customerId` reference only — an
  Anticorruption boundary, this context never touches password/email
  verification fields)

## Checkout

**Responsibilities**: the Cart→Order orchestration — this context is a
**process**, not primarily a data owner. It coordinates Inventory
reservation, Coupon validation, Payment initiation, and Order creation as
one transaction/saga. **Core** subdomain — this is the single riskiest
transaction in the platform (money, stock, and customer trust all meet
here).

- **Entities**: `Cart`, `CartItem`
- **Value Objects**: `CartTotal`, `DiscountBreakdown`
- **Aggregates**: `Cart` (root)
- **Domain Services**: `CheckoutOrchestrator` — the actual saga: validate
  cart → reserve stock (Inventory) → validate & apply coupon (Coupons) →
  initiate payment (Payments) → create `Order` (Orders) → clear cart. Any
  step failing rolls back the reservation, never leaves stock silently
  stuck.
- **Events**: `CheckoutStarted`, `CheckoutCompleted`, `CheckoutFailed`
- **Dependencies**: Catalog, Inventory, Coupons, Payments, Orders, Customers
  — Checkout is intentionally the most-connected context; that's why it
  holds no long-lived state of its own beyond the cart.

## Payments

**Responsibilities**: payment method abstraction, payment status tracking,
refunds. **Generic** subdomain, designed as the platform's clearest
plug-in point — a future client using a card gateway (Stripe-equivalent
regional provider) or a different COD/bank-transfer mix swaps the adapter,
not the domain.

- **Entities**: `Payment`, `Refund` *(recommended additions — see
  [07-DATABASE-REVIEW.md](07-DATABASE-REVIEW.md) — v1 schema tracks payment
  state flat on `Order`; normalizing into these entities is what makes
  multi-attempt/partial-refund payments possible without a schema rewrite)*
- **Value Objects**: `PaymentMethod`, `PaymentStatus`, `Money`
- **Aggregates**: `Payment` (root)
- **Domain Services**: `PaymentGatewayPort` (interface — `CodAdapter` ships
  in v1; a `CardGatewayAdapter` implements the same port later),
  `RefundService`
- **Events**: `PaymentAuthorized`, `PaymentCaptured`, `PaymentFailed`,
  `PaymentRefunded`
- **Dependencies**: Orders (`orderId` reference only)

## Coupons

**Responsibilities**: discount rule definition, validation at checkout,
usage tracking. **Supporting** subdomain.

- **Entities**: `Coupon`, `CouponUsage`
- **Value Objects**: `CouponCode`, `DiscountValue`, `UsageLimit`
- **Aggregates**: `Coupon` (root)
- **Domain Services**: `CouponValidationService` (expiry, usage limits,
  min-order, product/category scoping — all in one place so Checkout never
  re-implements a rule)
- **Events**: `CouponApplied`, `CouponUsageLimitReached`, `CouponExpired`
- **Dependencies**: Catalog (product/category scoping, read-only),
  Customers (per-customer usage limit)

## Shipping

**Responsibilities**: shipping fee calculation, carrier/method selection,
delivery estimates. **Supporting** subdomain — deliberately thin in v1
(flat `shippingFee` on `Order`, see database review) but modeled as its own
context from day one because every future client will have different
zones/carriers/rates, and that variance must never leak into Orders.

- **Entities**: `ShippingMethod`, `ShippingZone` *(recommended additions —
  not yet in the v1 schema; see
  [07-DATABASE-REVIEW.md](07-DATABASE-REVIEW.md))*
- **Value Objects**: `ShippingFee`, `DeliveryEstimate`
- **Aggregates**: `ShippingMethod` (root)
- **Domain Services**: `ShippingRateCalculator`
- **Events**: `ShipmentDispatched`, `ShipmentDelivered` (feed
  `OrderStatusHistory` via Orders, not written directly by Shipping)
- **Dependencies**: Orders (`orderId` reference only)

## Reviews

**Responsibilities**: review submission and moderation. **Supporting**
subdomain.

- **Entities**: `Review`
- **Value Objects**: `Rating`
- **Aggregates**: `Review` (root)
- **Domain Services**: `ReviewModerationService`,
  `ReviewEligibilityChecker` (v1 rule: one review per product per customer;
  a future "verified purchase" rule slots in here without touching
  Catalog or Orders)
- **Events**: `ReviewSubmitted`, `ReviewApproved`, `ReviewRejected`
- **Dependencies**: Catalog (product reference), Customers (author
  reference) — both read-only

## CMS

**Responsibilities**: all editorial/brand content — banners, static pages,
blog, newsletter — deliberately decoupled from every commerce context.
**Supporting** subdomain, but the most important one for reusability:
**this is the entire "make it look like a different brand" surface**. A
future client's homepage, blog, and page content are 100% data in this
context; none of it is hardcoded in a commerce template.

- **Entities**: `Banner`, `Page`, `BlogPost`, `BlogCategory`,
  `NewsletterSubscriber`
- **Value Objects**: `SEOMeta`, `ContentStatus`
- **Aggregates**: `Banner` (root), `Page` (root), `BlogPost` (root)
- **Domain Services**: `ContentPublishingService` (draft→published
  transition, triggers the storefront's on-demand ISR revalidation webhook)
- **Events**: `ContentPublished`, `ContentUnpublished`
- **Dependencies**: none. CMS depending on nothing is what lets it be
  swapped or re-themed per client without a domain-logic review.

## Notifications

**Responsibilities**: the admin notification feed today; the extension
point for customer-facing email/WhatsApp/push tomorrow. **Generic**
subdomain — implemented as a pure event subscriber so adding a channel
never means touching the context that raised the event.

- **Entities**: `Notification`
- **Value Objects**: `NotificationType`
- **Aggregates**: `Notification` (root)
- **Domain Services**: `NotificationDispatcher` — subscribes to
  `OrderPlaced`, `LowStockThresholdCrossed`, `ReviewSubmitted`,
  `CouponUsageLimitReached` (and any future event) and fans out to the
  configured channel(s) for that event type
- **Events**: `NotificationCreated`, `NotificationRead` (emitted, not
  consumed)
- **Dependencies**: none directly — it *subscribes* to events from Orders,
  Inventory, Reviews, Coupons but never calls into them, and they never call
  into it. This is what lets a future client plug in WhatsApp/SMS without
  Orders or Inventory knowing Notifications exists.

## Analytics

**Responsibilities**: dashboard aggregates and reporting. Read-only —
**Analytics never owns a writable aggregate**; it is the CQRS read side
over Orders/Catalog/Customers data. **Supporting** subdomain.

- **Entities**: none owned (projections only)
- **Value Objects**: `DateRange`, `MetricValue`
- **Aggregates**: none — start with live aggregation queries; only
  introduce materialized views/projections if query volume demands it
  (see [13-PERFORMANCE-STRATEGY.md](13-PERFORMANCE-STRATEGY.md))
- **Domain Services**: `SalesAggregationService`, `TopProductsService`,
  `MonthlyStatisticsService`
- **Events**: consumes `OrderPlaced`/`OrderStatusChanged` if/when projections
  are introduced; until then, reads directly at query time
- **Dependencies**: Orders, Catalog, Customers (read-only — never writes
  back to any of them)

## Administration

**Responsibilities**: staff account management, the RBAC permission matrix
itself (Identity stores *who has which role*; Administration defines *what
each role can do*), audit logging, site settings. **Generic** subdomain —
this is cross-cutting infrastructure dressed as a domain context.

- **Entities**: `AdminUser` *(management surface — see Identity boundary
  note)*, `AuditLog`, `Setting`
- **Value Objects**: `Permission`, `AuditDiff`
- **Aggregates**: `AuditLog` (append-only, root), `Setting` (root)
- **Domain Services**: `AuditRecorder` (implemented as a cross-cutting
  interceptor that observes mutations across all contexts — see
  [07-DATABASE-REVIEW.md](07-DATABASE-REVIEW.md#audit-strategy) — rather
  than manual calls scattered per use-case, so coverage can't be forgotten
  in a new module), `PermissionResolver` owner (the matrix in
  [05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix) is this context's
  published contract)
- **Events**: none emitted; audit logging consumes everything
- **Dependencies**: all contexts, but only as an observer (interceptor),
  never a real call-graph edge — it must never become a bottleneck or a
  reason another context can't ship independently.
