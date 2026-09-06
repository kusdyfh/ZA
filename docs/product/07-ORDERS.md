# 07 — Orders

## Purpose

Represent a customer's purchase from the moment it's placed through
delivery (or cancellation/return) — the single record both the customer
and every operational role (Warehouse, Sales, Customer Support, Manager)
relies on to know exactly what's happening with a sale.

## Business Rules

- An order remembers everything about itself exactly as it was at the
  moment it was placed — the shipping address used, the customer's name/
  email/phone at that time, the price paid, any discount applied. Later
  changes to a customer's saved address, or to a product's current price,
  never alter a past order's record. An order is a permanent snapshot,
  not a live view of other data.
- Every status change is recorded in a visible timeline — both the
  customer (a simplified view) and staff (the full detail, plus internal
  notes) can see exactly what happened and when.
- Orders are cancelled or returned — **never deleted**. An order is a
  permanent business and financial record from the moment it's created.

## The Complete Order Lifecycle

| Status | Meaning | Who can move it forward |
|---|---|---|
| **Pending** | Order placed, awaiting confirmation. For Cash on Delivery, this is a brief automatic step; for card payment, an order only ever gets created once payment has actually succeeded, so a card order effectively starts at Confirmed (see Failure Scenarios below for what happens when card payment *doesn't* succeed). | System (automatic in almost all cases) |
| **Confirmed** | Order is real and will be fulfilled. Stock is committed. | System / Warehouse |
| **Preparing** | Warehouse is actively picking and packing. | Warehouse |
| **Packed** | Ready to hand off to a carrier. | Warehouse |
| **Shipped** | In transit to the customer. | Warehouse |
| **Delivered** | Received by the customer. | Warehouse / delivery confirmation |
| **Cancelled** | Order will not be fulfilled. Terminal. | Customer (early stages only) / Manager / Customer Support |
| **Returned** | Customer sent the item back after delivery. Terminal. | Customer Support / Manager |

### Every legal transition

```
Pending ──────► Confirmed ──────► Preparing ──────► Packed ──────► Shipped ──────► Delivered
   │                │                  │                │
   │                │                  │                │
   └──► Cancelled ◄─┴──────────────────┴────────────────┘
                                                                          │
                                                                          └──► Returned
```

- **Pending → Confirmed**: automatic for Cash on Delivery once stock is
  verified; for card payment, the order is only ever created at the
  moment payment succeeds, so it enters directly as Confirmed.
- **Confirmed → Preparing → Packed → Shipped → Delivered**: the normal
  fulfillment path, each step advanced by Warehouse (or a future carrier
  integration confirming delivery automatically).
- **Delivered → Returned**: a customer-initiated return within the return
  window (see Returns, below).
- **Cancelled** and **Returned** are always terminal — neither can be
  reopened or transition anywhere else. A customer who wants to buy again
  places a new order.
- There is **no status for "delivery issue"** — an undeliverable address
  or a failed delivery attempt is handled through order notes and direct
  customer contact while the order remains in **Shipped**, rather than
  introducing a new status for what is, business-wise, a temporary
  complication within the shipping step, not a new stage of the order's
  life.

## Every Possible Cancellation

| Who cancels | When it's allowed | What happens |
|---|---|---|
| **Customer, self-service** | Only while the order is **Pending or Confirmed**, and **before Warehouse has started preparing it** | Immediate cancellation; any payment already captured is refunded; stock held for the order is released back to available stock. |
| **Customer, via Customer Support** | After Preparing has started, up through Packed | Not self-service — the customer contacts support; Customer Support or Manager cancels manually. Any already-picked/packed items are noted for Warehouse to restock. |
| **System, automatic** | A Cash on Delivery order left in Pending too long without Warehouse confirmation (e.g., 48 hours) | Auto-cancelled to prevent indefinite unconfirmed orders cluttering the queue; customer is notified. |
| **Manager / Super Admin, for cause** | Any status before Shipped | Used for suspected fraud or other exceptional situations. Always requires a documented reason. This is the only cancellation path with no earlier-stage restriction, precisely because it's reserved for genuinely exceptional cases, not routine use. |
| **After Shipped** | Cancellation is no longer available in any form | Once an order has shipped, the only paths forward are Delivered, or — after delivery — a Return. A shipment that's refused by the customer or fails to deliver is handled as a delivery issue via notes/contact (see above), resolving eventually to either a successful delivery or a Return once the parcel is back. |

## Every Failure Scenario

- **Card payment fails or is abandoned mid-checkout**: no order is ever
  created. The customer sees a clear "payment didn't go through, please
  try again" message and can retry. Any stock briefly held during the
  attempt is released automatically shortly after (see
  [06-Inventory](06-INVENTORY.md)). There is no "failed order" record
  cluttering anyone's view — from the business's perspective, nothing
  happened yet.
- **Payment succeeds, but the order fails to finalize afterward** (a rare
  system-level problem): this must never leave a customer charged with no
  order to show for it. The business rule is unconditional: this
  situation automatically triggers a refund and immediately alerts
  Customer Support to follow up with the customer directly.
- **An item sells out between the customer adding it to cart and
  completing checkout** (someone else bought the last unit first): the
  customer sees a clear, specific message identifying which item is no
  longer available and is asked to adjust their order before continuing
  — never a silent failure or a charge for something that can't be
  fulfilled.
- **An item is discovered to be unavailable only when Warehouse goes to
  pack it** (a rare stock-record discrepancy, since the checkout hold
  mechanism is designed to prevent this): the order does **not**
  auto-split or auto-substitute. Customer Support contacts the customer
  with the choice to wait, accept a substitute, or cancel that item with
  a partial refund. Partial/split shipment is explicitly not built in v1
  (see Future Expansion) — this scenario is handled as a manual,
  human-led exception, not an automated one.
- **A shipped order's delivery address turns out to be undeliverable**:
  handled via order notes and direct customer contact while the order
  stays in **Shipped** (see above) — resolved either by a corrected
  delivery attempt or, if truly undeliverable, treated as a return-to-
  sender once the parcel comes back, at which point it's processed like
  any other return.
- **A refund itself fails to process** (e.g., a payment method issue):
  escalated to Manager for manual resolution — never silently dropped or
  left as the customer's problem to notice.

## Returns

- A customer can request a return within a set number of days after
  Delivered (e.g., 14 days) — after that window, self-service return
  requests are no longer accepted (Customer Support can still make
  case-by-case exceptions).
- A return reason is always required, selected from a standard list
  (wrong size, changed mind, defective, wrong item shipped).
- Returns where the store made the mistake (e.g., "wrong item shipped")
  can be approved automatically to reduce friction; other reasons go
  through a Customer Support/Manager approval step.
- Once approved, the customer sends the item back (or a pickup is
  arranged, depending on shipping capability); Warehouse inspects it on
  arrival and decides resellable or damaged, exactly as in
  [06-Inventory](06-INVENTORY.md); a refund or exchange is then processed.
- An **exchange** (different size/color) is handled in v1 as a return
  plus a new, separate order — not a single combined "swap" transaction.
  This is a deliberate v1 simplification; a true single-transaction
  exchange flow is Future Expansion.

## User Stories

- As a customer, I want to see my order's current status and its full
  history, so I always know where things stand.
- As a customer, I want to cancel my order myself if it hasn't started
  being prepared yet, so I'm not stuck waiting for support for something
  simple.
- As a customer, I want to request a return within the return window, so
  I can get a refund or exchange if something doesn't work out.
- As a Warehouse staff member, I want a clear queue of Confirmed orders
  ready to prepare, so I can work through fulfillment efficiently.
- As a Customer Support staff member, I want to leave both internal notes
  and customer-visible notes on an order, so context is preserved for the
  team and the customer stays informed.
- As a Manager, I want to force-cancel an order at any pre-shipped stage
  with a documented reason, so exceptional situations don't require
  working around the normal rules.

## Acceptance Criteria

- Given an order in Confirmed status that Warehouse hasn't started
  preparing, When the customer clicks cancel, Then the order moves to
  Cancelled immediately, any payment is refunded, and held stock is
  released.
- Given an order already in Preparing, When the customer looks for a
  cancel option, Then self-service cancellation is not offered, and
  they're directed to contact support instead.
- Given a return request submitted 20 days after delivery (past a 14-day
  window), When submitted, Then it's rejected with a clear explanation of
  the policy, with an option to contact support for an exception.
- Given a "wrong item shipped" return reason, When submitted, Then it's
  auto-approved without requiring manual review.

## Edge Cases

Covered in depth above under Failure Scenarios and Cancellations — this
module's edge cases *are* those scenarios, not a separate short list,
given the explicit requirement for complete lifecycle/cancellation/
failure coverage.

## Validation Rules

- A cancellation reason is required whenever cancellation isn't the
  customer's own simple self-service action.
- A return reason is required, from the fixed reason list.
- A refund amount can never exceed the original amount paid on that
  order.

## Permissions

- **Customer**: view own orders, self-service cancel (within the allowed
  window), request a return.
- **Warehouse**: view orders; advance status through Preparing → Packed →
  Shipped.
- **Sales**: view orders, add notes.
- **Customer Support**: view orders, add notes (internal and customer-
  visible), initiate/approve returns, initiate cancellations after
  Preparing has started.
- **Manager, Super Admin**: full control, including force-cancellation at
  any pre-shipped stage and refund approval.

## UI Behaviour

- Order list with status-based filtering/tabs.
- Order detail page with a visual timeline of every status change.
- Status-change actions are only ever shown for the roles and stages
  where they're legal — a Warehouse account never sees a "cancel" button
  it isn't allowed to use, for instance.

## Error States

- An attempted illegal status transition (e.g., trying to move a
  Cancelled order to Shipped) is blocked with a clear explanation of why.
- A return request outside the return window is rejected with the policy
  clearly stated, not a generic error.
- A refund failure is visibly escalated to Manager, never silently
  retried into invisibility.

## Notifications

- Order confirmed, status changed at each fulfillment step, delivered,
  cancelled (with reason), return approved, refund processed — all to the
  customer.
- New order, return requested — to relevant staff.
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Split/partial shipments (fulfilling part of an order now, the rest
  later).
- A true single-transaction exchange flow, rather than return + reorder.
- A dedicated "delivery issue" tracked sub-state with carrier-integration
  live updates.
- Return via QR code / drop-off locker.

## Functional Requirements

- FR-1: Create an order from a completed checkout, recording a full
  snapshot of address, customer info, pricing, and payment method at that
  moment.
- FR-2: Enforce the fixed status lifecycle and block any illegal
  transition.
- FR-3: Support every cancellation path in the table above, each
  correctly gated by status and role.
- FR-4: Support customer-initiated returns within a configurable window,
  with reason-based auto-approval for store-caused reasons.
- FR-5: Support internal and customer-visible order notes.
- FR-6: Automatically refund and alert support if payment succeeds but
  order finalization fails.

## Non-Functional Requirements

- Status changes reflect to the customer (order tracking view) within
  moments of being made by staff — no perceptible lag between a Warehouse
  action and the customer seeing it.
- The order timeline is complete and permanent — no status change is
  ever silently lost from the history.

## Business Constraints

- No partial/split shipments in v1 — an order ships as a whole, or an
  affected item is resolved manually per the failure-scenario rule above.
- No true exchange transaction in v1 — modeled as return + new order.
- Self-service cancellation window ends the moment Warehouse begins
  preparing the order — by design, to avoid wasted fulfillment labor.

## Dependencies

- [06-Inventory](06-INVENTORY.md) — stock holds, releases, and sale
  movements.
- [08-Checkout](08-CHECKOUT.md) — where an order originates.
- [11-Shipping](11-SHIPPING.md), [12-Payments](12-PAYMENTS.md) — shipping
  cost/method and payment/refund handling.
- [19-Notifications](19-NOTIFICATIONS.md) — every status/return/refund
  notice.

## Open Questions

- What's the exact return window in days — is 14 days right for this
  product category, or should it differ (e.g., longer for gift items)?
- What's the exact auto-cancellation timeout for an unconfirmed COD
  order — 48 hours, or shorter/longer?
- Should a customer be able to see *why* Manager force-cancelled their
  order, or only that it was cancelled?
