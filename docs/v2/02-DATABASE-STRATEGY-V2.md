# ZA Store — Database Strategy v2

Concrete schema deltas from [v1 03-DATABASE-SCHEMA.md](../03-DATABASE-SCHEMA.md),
implementing [ADR 0001](adr/0001-inventory-reservation-strategy.md),
[0002](adr/0002-event-architecture.md), [0004](adr/0004-order-snapshot-redesign.md),
[0005](adr/0005-actor-reference-model.md), and
[0006](adr/0006-saas-ready-schema-pattern.md). This is a diff against v1's
schema, not a full restatement — read alongside the original.

## New models

```prisma
enum ActorType {
  ADMIN
  CUSTOMER
  SYSTEM
}

enum ReservationStatus {
  ACTIVE
  CONFIRMED
  RELEASED
  EXPIRED
}

model StockReservation {
  id          String            @id @default(cuid())
  storeId     String
  variant     ProductVariant    @relation(fields: [variantId], references: [id])
  variantId   String
  cartId      String
  quantity    Int
  status      ReservationStatus @default(ACTIVE)
  expiresAt   DateTime
  createdAt   DateTime          @default(now())
  confirmedAt DateTime?
  releasedAt  DateTime?

  @@index([variantId, status])
  @@index([status, expiresAt])   // powers the expiry-sweep job
  @@index([cartId])
}

enum OutboxStatus {
  PENDING
  PROCESSING
  DELIVERED
  FAILED
}

model OutboxEvent {
  id            String       @id @default(cuid())
  storeId       String
  eventType     String       // "OrderPlaced", "LowStockThresholdCrossed", ...
  aggregateType String       // "Order", "ProductVariant", ...
  aggregateId   String
  payload       Json
  status        OutboxStatus @default(PENDING)
  attempts      Int          @default(0)
  lastError     String?
  createdAt     DateTime     @default(now())
  processedAt   DateTime?

  @@index([status, createdAt])   // powers the relay poll
  @@index([aggregateType, aggregateId])
}

model FailedJobLog {
  id          String   @id @default(cuid())
  queueName   String
  jobName     String
  payload     Json
  error       String
  attemptsMade Int
  archivedAt  DateTime @default(now())

  @@index([queueName, archivedAt])
}

model Store {
  id              String      @id @default(cuid())
  name            String
  domain          String      @unique
  defaultLocale   String      @default("en")
  defaultCurrency String      @default("IQD")
  status          StoreStatus @default(ACTIVE)
  createdAt       DateTime    @default(now())
}

enum StoreStatus {
  ACTIVE
  SUSPENDED
}

model ApiKey {
  id          String    @id @default(cuid())
  storeId     String
  keyHash     String    @unique
  label       String
  scopes      String[]
  createdBy   String
  lastUsedAt  DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([storeId])
}

model WebhookSubscription {
  id                  String    @id @default(cuid())
  storeId             String
  url                 String
  eventTypes          String[]
  secret              String
  isActive            Boolean   @default(true)
  consecutiveFailures Int       @default(0)
  createdAt           DateTime  @default(now())

  @@index([storeId, isActive])
}

model FeatureFlag {
  id                String   @id @default(cuid())
  storeId           String
  key               String
  isEnabled         Boolean  @default(false)
  rolloutPercentage Int?     // null = all-or-nothing via isEnabled
  updatedAt         DateTime @updatedAt

  @@unique([storeId, key])
}
```

## Changed models

### `Order` — snapshot fields added (per [ADR 0004](adr/0004-order-snapshot-redesign.md))

```prisma
model Order {
  // ...v1 fields unchanged...

  storeId                 String          // per ADR 0006

  // shipping snapshot — replaces display-time dependence on a live Address join
  shippingFullName        String
  shippingPhone            String
  shippingLine1             String
  shippingLine2              String?
  shippingCity                String
  shippingGovernorate           String
  shippingCountry                String

  // billing snapshot — optional, only populated when billing differs from shipping
  billingFullName          String?
  billingPhone               String?
  billingLine1                 String?
  billingLine2                   String?
  billingCity                     String?
  billingGovernorate                String?
  billingCountry                     String?

  // customer info snapshot
  customerNameSnapshot       String
  customerEmailSnapshot        String
  customerPhoneSnapshot          String

  // payment snapshot (display-path only — Payment/Refund entities remain the reconciliation source)
  paymentMethodSnapshot        PaymentMethod
  paymentReferenceSnapshot        String?

  // tax + currency (structurally present now, per ADR 0004 — see 04-SAAS-EXTENSION-POINTS.md)
  taxTotal                       Decimal  @db.Money @default(0)
  currencyCode                     String @default("IQD")

  orderNumber                       String   // uniqueness becomes (storeId, orderNumber)
  // ... @@unique([storeId, orderNumber]) replaces the v1 global @unique
}
```

`shippingAddressId`/`billingAddressId` FKs are **retained**, nullable,
for support-tooling traceability ("was this the address on file") — but
no display path reads through them.

### `OrderItem` — tax snapshot added

```prisma
model OrderItem {
  // ...v1 fields unchanged...
  taxRate   Decimal @default(0)
  taxAmount Decimal @db.Money @default(0)
}
```

### `Product` — currency field added

```prisma
model Product {
  // ...v1 fields unchanged...
  currencyCode String @default("IQD")   // per ADR 0004/0006
  storeId      String                    // per ADR 0006; @@unique([storeId, slug]), @@unique([storeId, sku])
}
```

### Actor reference fields — normalized (per [ADR 0005](adr/0005-actor-reference-model.md))

```prisma
model BlogPost {
  // ...
  author   AdminUser @relation(fields: [authorId], references: [id])
  authorId String
  // replaces the v1 bare `authorAdminId String?`
}

model OrderStatusHistory {
  // ...
  actorId   String?
  actorType ActorType @default(SYSTEM)
  // replaces the v1 bare `changedByAdminId String?`
}

model StockMovement {
  // ...
  actorId   String?
  actorType ActorType @default(SYSTEM)
  // replaces the v1 bare `createdByAdminId String?`
}
```

### Global uniqueness → store-scoped uniqueness (per [ADR 0006](adr/0006-saas-ready-schema-pattern.md))

Every table listed in [ADR 0006](adr/0006-saas-ready-schema-pattern.md)'s
table gains `storeId String` and its `@unique` becomes a composite
`@@unique([storeId, ...])`. Not re-listed here field-by-field — see the
ADR for the authoritative list.

## Constraints and indexes added

Beyond what [v1 07-DATABASE-REVIEW.md](../07-DATABASE-REVIEW.md) already
recommended (still valid, still pending):

```sql
ALTER TABLE "StockReservation" ADD CONSTRAINT reservation_quantity_positive
  CHECK (quantity > 0);
ALTER TABLE "OutboxEvent" ADD CONSTRAINT attempts_non_negative
  CHECK (attempts >= 0);
```

`StockReservation(status, expiresAt)` and `OutboxEvent(status, createdAt)`
are the two indexes that make the sweep and relay jobs
(per [ADR 0003](adr/0003-background-job-system.md)) cheap at any table
size — both are simple range scans on an indexed, low-cardinality status
column plus a timestamp, not a full scan.

## What did NOT change

- `AuditLog`'s shape is unchanged — its growth/partitioning
  recommendation from v1 still stands and is now additionally handled by
  the `maintenance` job queue rather than left unimplemented.
- `Coupon`, `Payment`/`Refund`, `ShippingMethod`/`ShippingZone` — the v1
  review's recommended additions for these still stand and are unaffected
  by this pass; they're orthogonal to the P0 issues this v2 redesign
  targeted. Not duplicated here to avoid drift between two documents
  describing the same not-yet-built models — see
  [v1 07-DATABASE-REVIEW.md](../07-DATABASE-REVIEW.md) for those.
