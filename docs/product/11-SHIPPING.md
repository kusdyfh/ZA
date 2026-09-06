# 11 — Shipping

## Purpose

Communicate delivery cost and timing to the customer at checkout, and
give Warehouse the fulfillment context it needs — kept deliberately
simple in v1 rather than modeling real-time carrier rate shopping.

## Business Rules

- Shipping cost is a flat rate, which may vary by delivery region, or
  may be waived entirely above a configurable free-shipping order
  threshold.
- A delivery estimate is shown as a range (e.g., "3–5 business days"),
  not a guaranteed exact date.
- Checkout only accepts addresses within the store's supported delivery
  regions — an address outside them is blocked at checkout with a clear
  explanation, rather than accepted and later discovered undeliverable.

## User Stories

- As a customer, I want to see the shipping cost and estimated delivery
  window before I pay, so there are no surprises.
- As a Manager, I want to configure a free-shipping threshold and flat
  rates per region, so shipping pricing reflects our actual delivery
  costs without needing a developer for every change.

## Acceptance Criteria

- Given an order subtotal above the configured free-shipping threshold,
  When the customer reaches checkout, Then shipping is shown as free.
- Given a delivery address in a region not on the supported list, When
  the customer reaches that step of checkout, Then they're told clearly
  that delivery isn't currently available there, before they can proceed
  further.

## Edge Cases

- A customer's address is in a supported region but a very remote area
  within it → handled the same as any other address in that region in
  v1; finer-grained sub-region rates are Future Expansion.
- The free-shipping threshold is crossed only after a coupon discount is
  applied → the threshold is evaluated against the discounted subtotal,
  consistent with how the total the customer actually sees is calculated
  throughout checkout.

## Validation Rules

- The selected/entered delivery address must be within a supported
  region for the order to proceed.

## Permissions

- Super Admin, Manager: configure shipping rates, regions, and the
  free-shipping threshold.
- All other roles: read-only (Warehouse sees the selected shipping detail
  per order, but doesn't configure store-wide rates).

## UI Behaviour

- Shipping cost and estimated delivery window shown clearly in the order
  summary throughout checkout, updating live if the free-shipping
  threshold is crossed by a cart change.

## Error States

- Unsupported delivery region: clear, specific message at the address
  step, before the customer proceeds further into checkout.

## Notifications

- None required in v1.

## Future Expansion

- Real carrier integration with live rate quotes and tracking.
- Multiple shipping speed options (standard vs. express).
- In-store or locker pickup as a delivery option.
- Sub-region-specific rates within a supported region.

## Functional Requirements

- FR-1: Configure flat shipping rates per supported region.
- FR-2: Configure a free-shipping order threshold.
- FR-3: Block checkout for addresses outside supported delivery regions.
- FR-4: Display shipping cost and delivery estimate clearly throughout
  checkout.

## Non-Functional Requirements

- Shipping cost recalculates and displays immediately whenever the cart
  or address changes during checkout.

## Business Constraints

- No live carrier rate-shopping or real-time tracking in v1 — flat,
  admin-configured rates only.

## Dependencies

- [08-Checkout](08-CHECKOUT.md) — where shipping cost/region is
  evaluated.
- [07-Orders](07-ORDERS.md) — the shipping method/cost is snapshotted
  onto the order.

## Open Questions

- What are the actual supported delivery regions and their rates at
  launch — a business decision to finalize before Phase 1 build-out.
