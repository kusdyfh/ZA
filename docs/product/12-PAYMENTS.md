# 12 — Payments

## Purpose

Represent how a customer pays, and how that connects to order
confirmation and refunds — covering both Cash on Delivery (available at
launch) and card payment (a near-term addition).

## Business Rules

- At launch, Cash on Delivery (COD) is supported. Card payment is
  designed for and expected soon after, so this module's rules describe
  both.
- Payment status is tracked separately from order status — an order can
  be Confirmed and actively being prepared while its payment is still
  "awaiting collection" (true for COD) or already "paid" (true for a
  successful card payment).
- Refunds return to the customer's original payment method whenever
  possible. For a COD order (where there's no electronic method to
  refund to, since payment was collected in cash on delivery), the
  refund is issued as store credit or another agreed method, since there
  is no original electronic transaction to reverse.
- A card payment is never charged twice for the same order, even if a
  customer double-clicks or retries after a slow response.

## User Stories

- As a customer, I want to choose between Cash on Delivery and card
  payment at checkout, so I can pay however I prefer.
- As a Manager, I want to process a refund for a cancelled or returned
  order, so the customer is made whole.
- As a Customer Support staff member, I want to see an order's payment
  status clearly, so I can answer a customer's question about their
  refund without guessing.

## Acceptance Criteria

- Given a customer selects Cash on Delivery, When they complete checkout,
  Then the order is created with payment status "awaiting collection,"
  and cannot be marked "paid" until Warehouse/delivery confirms cash was
  collected.
- Given a customer's card payment succeeds, When checkout completes, Then
  the order is created already marked "paid."
- Given a Manager approves a refund for a card-paid order, When
  processed, Then the refund returns to the original card, and the
  customer is notified.
- Given a Manager approves a refund for a COD order, When processed, Then
  it's issued as store credit (or another agreed method), since there's
  no original electronic payment to reverse.

## Edge Cases

- A card payment appears to fail on the customer's screen due to a
  connection drop, but the charge actually succeeded on the payment
  provider's side → the order is confirmed correctly regardless (the
  system always checks the payment provider's actual recorded outcome,
  never just what the customer's browser last displayed), and the
  customer is directed to their order confirmation email or order-lookup
  page if their checkout screen didn't update.
- A customer requests a refund larger than what they actually paid (e.g.,
  after already receiving a partial refund) → blocked; a refund can never
  exceed the remaining refundable amount on that order.
- A COD order is cancelled before any cash was ever collected → no refund
  is needed at all, since nothing was paid; this is simply a cancellation
  with no payment step involved.

## Validation Rules

- A payment method must be selected before an order can be placed.
- A refund amount can never exceed the order's remaining refundable
  balance.

## Permissions

- Super Admin, Manager: can issue and approve refunds.
- Sales, Customer Support: can view payment status and refund history,
  and initiate a refund request for Manager approval, but cannot approve
  their own refund requests.
- Warehouse: can mark COD cash as collected upon delivery; no refund
  rights.

## UI Behaviour

- Clear payment-method selection at checkout.
- Order detail view shows payment status distinctly from order/
  fulfillment status, so staff never confuse "the order is Confirmed"
  with "the customer has paid."
- Refund action requires an explicit reason and shows the remaining
  refundable amount before confirming.

## Error States

- Card declined: clear message, immediate retry available, no double
  charge risk.
- Refund exceeding refundable balance: blocked with the actual remaining
  amount shown.

## Notifications

- Payment confirmation (customer), refund-issued notice (customer).
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Installment/pay-later plans.
- Store wallet balance as a payment method.
- Multiple card-gateway options per store.

## Functional Requirements

- FR-1: Support Cash on Delivery as a payment method at launch.
- FR-2: Support card payment once a gateway is integrated, with payment
  status determined by the gateway's actual recorded outcome, never a
  client-reported one.
- FR-3: Track payment status independently of order/fulfillment status.
- FR-4: Support full and partial refunds, capped at the remaining
  refundable balance, routed to the original method where possible.
- FR-5: Prevent duplicate charges on retry/double-submission.

## Non-Functional Requirements

- Payment status is always accurate and never based on stale or
  client-only information — the system's understanding of "was this
  paid" always traces back to the payment provider's own record for card
  payments.

## Business Constraints

- COD refunds cannot return to the original method (cash), by definition
  — store credit or an equivalent agreed alternative is the only path.

## Dependencies

- [08-Checkout](08-CHECKOUT.md) — payment method selection.
- [07-Orders](07-ORDERS.md) — payment status is tracked per order, and
  refunds tie to cancellations/returns there.

## Open Questions

- What refund methods are actually available for COD orders at launch —
  store credit only, or bank transfer as well?
- Which card gateway will be integrated first, and does it support the
  installment-plan Future Expansion item natively if that's ever pursued?
