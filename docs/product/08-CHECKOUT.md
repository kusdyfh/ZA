# 08 — Checkout

## Purpose

Guide a customer from a filled cart to a placed order — the single most
revenue-critical flow in the platform, where trust, clarity, and
correctness matter more than anywhere else.

## Business Rules

- Guest checkout is always available — an account is never required to
  buy.
- The order total is calculated and locked at the moment checkout is
  submitted, based on server-verified prices and stock — never based on
  whatever total the customer's browser happened to display, which may
  be stale.
- A coupon applied earlier in the flow is always re-validated at the
  final submission — its expiry, usage limit, or scope may have changed
  in the time since it was first applied.
- Address, shipping method, and payment method are all required before
  an order can be placed.

## User Stories

- As a guest shopper, I want to check out without creating an account, so
  I can buy quickly.
- As a customer, I want to see my order total update live as I add a
  coupon or change shipping method, so I know exactly what I'll pay
  before confirming.
- As a customer, I want to choose between Cash on Delivery and card
  payment, so I can pay however I prefer.
- As a customer, I want to be told clearly if something in my cart
  becomes unavailable during checkout, so I'm not confused by a failed
  submission.

## Acceptance Criteria

- Given a guest with a full cart, When they complete checkout without
  logging in, Then their order is placed successfully and a confirmation
  is shown/emailed.
- Given a customer applies a valid coupon, When they proceed to submit
  the order, Then the coupon is checked again at that moment, and if it's
  no longer valid (e.g., someone else just used the last available
  redemption), the customer is told clearly and the total updates
  accordingly before they can proceed.
- Given an item in the cart goes out of stock while the customer is
  filling out their address, When they attempt to submit, Then they're
  shown exactly which item is affected and asked to adjust before
  continuing.

## Edge Cases

- A guest checks out using an email that already belongs to a registered
  account → they're offered the option to log in instead of proceeding as
  a guest, rather than silently creating a confusing duplicate identity.
- A coupon expires in the moments between being applied and the order
  being submitted → it's removed automatically with a clear explanation,
  and the total is recalculated before the customer can proceed.
- The customer's session or connection drops mid-checkout → their cart
  contents are preserved; resuming brings them back into checkout, not an
  empty cart.
- A card payment is declined → the customer sees a clear reason where
  possible ("card declined") and can immediately retry with the same or a
  different payment method, without re-entering their address.

## Validation Rules

- Address fields, phone, and a selected payment method are all required
  before submission.
- Quantity of each cart item must not exceed truly available stock at the
  moment of submission (server-checked, not just trusted from the cart
  page).

## Permissions

- Available to any customer or guest — this is the one storefront flow
  with no staff/admin-side equivalent in v1 (an admin cannot place an
  order on a customer's behalf yet — see Future Expansion).

## UI Behaviour

- A single, clearly-stepped flow (address → shipping → payment → review)
  with an always-visible order summary, so the total is never a surprise
  at the final step.
- Inline validation errors at each field, not a wall of errors after
  submission.
- A clearly disabled/loading "Place Order" button once submitted, to
  prevent accidental double-submission.

## Error States

- Payment declined: clear, specific message, immediate retry available,
  no data re-entry required.
- Stock conflict at submission: specific item identified, clear next
  step.
- Session/connection interruption: cart and entered details preserved
  wherever technically possible.

## Notifications

- Order confirmation immediately upon successful checkout.
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Saved payment methods for faster repeat checkout.
- One-click reorder from a past order.
- Admin/Sales-assisted checkout for phone orders.

## Functional Requirements

- FR-1: Support guest and logged-in checkout.
- FR-2: Recalculate and re-validate price, stock, and coupon eligibility
  at final submission, never trusting an earlier client-side total.
- FR-3: Support Cash on Delivery and card payment methods.
- FR-4: Preserve cart/checkout progress across an interrupted session.

## Non-Functional Requirements

- The checkout flow should feel fast and uninterrupted under normal
  conditions — no unnecessary steps or reloads between address, shipping,
  and payment.
- A submitted order is confirmed to the customer within a few seconds
  under normal conditions.

## Business Constraints

- No admin-assisted checkout in v1 — every order originates from the
  customer's own action.

## Dependencies

- [06-Inventory](06-INVENTORY.md) — stock verification and holds.
- [09-Coupons](09-COUPONS.md) — discount application and re-validation.
- [11-Shipping](11-SHIPPING.md), [12-Payments](12-PAYMENTS.md) — shipping
  cost and payment processing.
- [07-Orders](07-ORDERS.md) — the record checkout produces.

## Open Questions

- Should checkout be a single page or a multi-step wizard — a UX decision
  to validate with real users rather than assume.
