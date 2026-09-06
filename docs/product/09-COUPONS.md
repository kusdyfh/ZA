# 09 — Coupons

## Purpose

Let the business run code-based promotions — percentage or fixed-amount
discounts customers redeem by entering a code — with enough rules to
prevent abuse while staying simple to configure.

## Business Rules

**Types**
- Percentage off (e.g., 20% off) or fixed amount off (e.g., $10 off).

**Usage Limits**
- A **total usage limit** caps how many times a coupon can be redeemed
  store-wide (e.g., "first 100 uses").
- A **per-customer usage limit** caps how many times one customer can use
  it (e.g., "once per customer"). Both limits are independent and both
  are enforced together.
- A coupon can additionally be marked **one-time-use**, meaning each
  individual code is only ever valid once — used for a scenario like a
  unique code issued to one specific person, as distinct from a shared
  promotional code many different customers each use once.

**Expiration**
- A coupon has a start date (can't be used before) and an end date
  (can't be used after). An expired or not-yet-started coupon is rejected
  with a clear, specific message — never a silent failure.

**Product & Category Restrictions**
- A coupon can be scoped to specific products, specific categories, or be
  store-wide (unscoped) — one scoping choice, decided at creation.
- If a cart contains a mix of eligible and ineligible items, the discount
  applies only to the eligible items' subtotal — not rejected outright,
  and not applied to the whole cart either. This partial application
  keeps the promotion's actual intent (discounting specific items) honest
  even in a mixed cart.

**Minimum Order Amount**
- An optional threshold below which the coupon is rejected, with a clear
  "add X more to use this code" message rather than a flat rejection.

**Stacking Rules**
- **Only one coupon may be applied per order in v1.** This is a
  deliberate simplification to avoid the complexity (and abuse potential)
  of combined discounts. If a customer enters a second code while one is
  already applied, they're asked to confirm replacing the first — it is
  never silently stacked or silently ignored.

**Priority**
- Not applicable in v1, given the one-coupon-per-order rule — there's
  nothing to prioritize between when only one can ever apply. Priority
  between automatic, code-less discounts and manual coupons becomes
  relevant only once automatic discounts exist (see
  [10-Discounts](10-DISCOUNTS.md) and Future Expansion) and is explicitly
  an open question, not decided here.

## User Stories

- As a Manager, I want to create a coupon scoped to one category with a
  usage cap, so I can run a limited, trackable category promotion.
- As a customer, I want to enter a coupon code and see my discount and
  new total immediately, so I know exactly what I'll pay.
- As a Manager, I want to see how many times a coupon has been used
  against its limit, so I can track a campaign's performance and know
  when it's nearly exhausted.
- As a customer, I want a clear explanation when my code doesn't work, so
  I understand whether it's expired, doesn't apply to my items, or was
  already used.

## Acceptance Criteria

- Given a coupon with a per-customer limit of 1, When a customer who's
  already used it tries to apply it again, Then it's rejected with
  "you've already used this code."
- Given a coupon scoped to Category A, When applied to a cart with both
  Category A and Category B items, Then the discount applies only to the
  Category A items' subtotal, and the customer sees clearly which items
  it applied to.
- Given a coupon with a minimum order amount of $50 applied to a $35
  cart, When applied, Then it's rejected with "add $15 more to use this
  code."
- Given a valid coupon already applied, When the customer enters a second
  code, Then they're asked to confirm replacing the first before it takes
  effect.
- Given a coupon whose total usage limit is reached by another customer
  moments earlier, When this customer tries to apply it, Then they see
  "this code has reached its usage limit," not a broken or generic error.

## Edge Cases

- A coupon is scoped to a product that's later archived → the coupon
  still exists but becomes effectively unusable; the system shows "this
  code is no longer available" rather than a confusing error. Proactively
  flagging such orphaned coupons to the Manager is a nice-to-have, not
  built in v1 (see Future Expansion).
- A fixed-amount coupon would discount more than the order's subtotal
  (e.g., a $50-off code on a $30 order) → the discount is capped at the
  subtotal; the order total is never negative.
- A coupon's dates are set with the end before the start → blocked at
  creation with a clear validation message.

## Validation Rules

- Code required, unique (not case-sensitive — `SAVE20` and `save20` are
  the same code).
- Percentage value: 1–100. Fixed amount: greater than 0.
- End date must be after start date.
- Usage limits, if set, must be at least 1.

## Permissions

- Super Admin, Manager: full create/edit/deactivate rights.
- Sales: can view and apply an existing coupon on a customer's behalf
  (for phone-order support scenarios, once that capability exists — see
  [08-Checkout](08-CHECKOUT.md) Future Expansion) but cannot create new
  coupons.
- Warehouse, Customer Support: no access.

## UI Behaviour

- Storefront: a simple code-entry field at cart/checkout with immediate,
  specific feedback — success (with the discount shown) or a specific
  rejection reason, never a generic "invalid code."
- Admin: coupon list showing usage against limit as a clear progress
  indicator (e.g., "34 / 100 used").

## Error States

Every rejection reason has its own specific, human-readable message:
expired, not yet started, usage limit reached, already used by this
customer, below minimum order amount, doesn't apply to items in cart.
Never a single generic "invalid coupon."

## Notifications

- Coupon-usage-limit-reached alert to Manager.
- Coupon-expiring-soon alert to Manager (a few days ahead, so a campaign
  can be extended or replaced in time).
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Multiple coupons stackable per order, with a defined priority order.
- Automatic, code-less discounts (see [10-Discounts](10-DISCOUNTS.md)).
- Tiered discounts ("spend more, save more").
- Buy-X-get-Y and bundle pricing.
- Referral codes implemented as a coupon variant.
- Proactive flagging of coupons scoped to now-archived products.

## Functional Requirements

- FR-1: Create/edit/deactivate coupons with type, value, scope (product/
  category/store-wide), minimum order amount, usage limits (total and
  per-customer), one-time-use flag, and a validity date range.
- FR-2: Validate a coupon at both the moment it's applied and again at
  final checkout submission.
- FR-3: Apply a scoped coupon's discount only to eligible items when the
  cart is mixed.
- FR-4: Enforce a single coupon per order, with explicit confirmation to
  replace an already-applied one.
- FR-5: Track and display usage against limits for reporting.

## Non-Functional Requirements

- Coupon validation feedback appears within a second of the code being
  submitted — no perceptible delay.

## Business Constraints

- Only one coupon per order in v1 — a deliberate limitation to keep
  discount logic simple, predictable, and hard to abuse.
- No automatic/code-less discounts in v1 — every discount here requires
  an explicit code (see [10-Discounts](10-DISCOUNTS.md) for the one
  exception: a plain product sale price, which isn't a "coupon" at all).

## Dependencies

- [03-Products](03-PRODUCTS.md), [04-Categories](04-CATEGORIES.md) — for
  scoping.
- [08-Checkout](08-CHECKOUT.md) — where coupons are applied and
  re-validated.
- [02-Customers](02-CUSTOMERS.md) — for per-customer usage limits.

## Open Questions

- Once automatic discounts exist, what's the priority rule between an
  automatic discount and a manually-applied coupon on the same order?
- Should there be a proactive admin warning when a coupon's scoped
  product/category becomes archived or deactivated?
