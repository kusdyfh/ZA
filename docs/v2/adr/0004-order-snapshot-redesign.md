# ADR 0004: Order Snapshot Redesign

**Status**: Accepted
**Supersedes**: [v1 03-DATABASE-SCHEMA.md — `Order`](../../03-DATABASE-SCHEMA.md#orders),
which referenced a live `Address` row via `shippingAddressId` with no
snapshot, and carried payment/tax/currency state only as flat live fields.
**Flagged by**: [16-SENIOR-ARCHITECTURE-REVIEW.md, Risk #4](../../16-SENIOR-ARCHITECTURE-REVIEW.md)
— "`Order` references a mutable `Address` row... contradicts the
platform's own stated immutable-order-history principle."

## Context

v1's `OrderItem` correctly snapshots `productNameSnapshot`/`skuSnapshot`
so catalog edits never rewrite order history — this was explicitly called
out as good design in
[v1 03-DATABASE-SCHEMA.md](../../03-DATABASE-SCHEMA.md#orders). But
`Order.shippingAddressId` is a live foreign key to `Address`, which a
customer can edit after the order is placed (fixing a typo in their city,
say). Do that, and every historical order's displayed shipping address
silently changes — the exact failure mode the `OrderItem` snapshot
pattern was built to prevent, just missed on a sibling field. The same
gap exists for customer name/email/phone (no snapshot — display always
joins live to `Customer`) and for payment/tax/currency, which weren't
modeled as snapshots at all because they weren't modeled with any
history-awareness in v1.

## Decision

**Principle**: an `Order` must be fully renderable — invoice, tracking
page, support lookup — using *only* columns on `Order`/`OrderItem`. Zero
live joins to `Customer`, `Address`, `Product`, or `Payment` are required
for correct historical display. Live joins remain available for
cross-referencing and support tooling, but display-path correctness never
depends on a referenced row still existing or being unchanged.

This is implemented as **explicit snapshot fields**, not one JSON blob —
consistent with how `OrderItem` already does it, not a new pattern.

### Fields added to `Order`

**Shipping address snapshot** (copied from `Address` at checkout time;
`shippingAddressId` is retained as a nullable reference for support
tooling — "was this the address on file" — but is never used for
display):

```
shippingFullName      String
shippingPhone          String
shippingLine1           String
shippingLine2            String?
shippingCity              String
shippingGovernorate        String
shippingCountry             String
```

**Billing address snapshot** (same shape, optional — only populated if
billing differs from shipping; most orders reuse the shipping snapshot).

**Customer info snapshot** (so the customer-anonymization procedure from
[v1 07-DATABASE-REVIEW.md §6](../../07-DATABASE-REVIEW.md#6-soft-delete-strategy)
never alters historical order display, closing a gap that procedure
didn't fully address):

```
customerNameSnapshot     String
customerEmailSnapshot     String
customerPhoneSnapshot      String
```

**Payment snapshot** (display-path only; the live `Payment`/`Refund`
entities from [v1 07-DATABASE-REVIEW.md §1](../../07-DATABASE-REVIEW.md#1-normalization)
remain the reconciliation source of truth):

```
paymentMethodSnapshot      PaymentMethod
paymentReferenceSnapshot    String?   // gateway transaction id
```

**Tax snapshot** (new — v1 had no tax modeling at all, per
[16-SENIOR-ARCHITECTURE-REVIEW.md §4](../../16-SENIOR-ARCHITECTURE-REVIEW.md)'s
gap analysis). Added structurally now, even though a single 0%-rate is
seeded at launch, so introducing real tax calculation later is additive,
never a migration against historical orders:

```
Order.taxTotal          Decimal @default(0)
OrderItem.taxRate         Decimal @default(0)
OrderItem.taxAmount        Decimal @default(0)
```

**Currency snapshot** (new — same rationale, ties to
[04-SAAS-EXTENSION-POINTS.md](../04-SAAS-EXTENSION-POINTS.md)):

```
Order.currencyCode      String @default("IQD")
```
(also added to `Product.currencyCode` for the same forward-compatibility
reason, defaulted identically today.)

## Consequences

- `Order` grows by roughly a dozen columns. This is the correct tradeoff
  — a wider table beats a table that's wrong under a routine, common
  action (a customer editing their address).
- The customer-anonymization procedure in
  [v1 07-DATABASE-REVIEW.md §6](../../07-DATABASE-REVIEW.md#6-soft-delete-strategy)
  is now fully sufficient — anonymizing live `Customer`/`Address` rows
  never touches historical order display, because display no longer
  reads those tables.
- Tax/currency fields are unused (`0`, `"IQD"`) at launch but structurally
  present, directly enabling the extension points in
  [04-SAAS-EXTENSION-POINTS.md](../04-SAAS-EXTENSION-POINTS.md) without a
  future migration against live order data.
- Checkout's write path gets slightly larger (more fields to populate at
  order-creation time), which is a one-time cost paid once, not a
  recurring one.

## Alternatives Considered

- **One JSON snapshot blob (`Order.snapshotData Json`).** Rejected for
  consistency — `OrderItem` already uses structured columns, and a JSON
  blob loses queryability (e.g., "find all orders shipped to Baghdad" would
  require JSON path queries instead of a plain indexed column) for no
  real benefit over explicit fields.
- **Keep the live join, add a "last known good" cache invalidated on
  Address edit.** Rejected — more moving parts than a snapshot, and still
  fails the "must not require any other table to still exist/be
  unchanged" principle if the `Address` row is later deleted.
- **Do nothing, document it as a known limitation.** Rejected — this was
  the P0 finding precisely because "known limitation" here means real
  customers see their own past orders change silently, which is a support
  and trust problem, not a cosmetic one.
