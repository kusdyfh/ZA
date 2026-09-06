# 10 — Discounts

## Purpose

Represent simple, always-on price reductions set directly on a product —
a "sale price" — distinct from [09-Coupons](09-COUPONS.md), which require
a customer to enter a code. This module is intentionally small in v1.

## Business Rules

- A product can carry a discount price alongside its regular price. When
  set, it's shown to every customer automatically, storefront-wide — no
  code needed, no eligibility check.
- The discounted price is always shown with the original price struck
  through, so the saving is visually obvious.
- A discount price must always be lower than the regular price — it
  cannot be set higher or equal.
- There is no scheduling (start/end date) for a discount price in v1 — it
  is either set (active) or not set (inactive); turning a sale on or off
  is a manual, immediate action by a Manager. Scheduled sales are Future
  Expansion.

## User Stories

- As a Manager, I want to set a sale price on a product for a seasonal
  promotion, so customers see the discount immediately without needing a
  code.
- As a customer, I want to clearly see both the original and discounted
  price, so I understand exactly how much I'm saving.

## Acceptance Criteria

- Given a Manager sets a discount price lower than the regular price,
  When saved, Then the storefront immediately shows both prices, with the
  original struck through.
- Given a Manager attempts to set a discount price equal to or higher
  than the regular price, When saved, Then it's rejected with a clear
  explanation.

## Edge Cases

- A regular price is lowered after a discount price was already set,
  such that the discount is no longer lower than the new regular price →
  the system flags this for the Manager to resolve rather than silently
  displaying a nonsensical "sale" where the discount isn't actually a
  discount anymore.

## Validation Rules

- Discount price, if set, must be strictly less than the regular price.

## Permissions

- Super Admin, Manager: full rights to set/clear a discount price.
- All other roles: read-only.

## UI Behaviour

- Simple two-field entry on the product form: regular price, discount
  price (optional).
- Storefront always shows both prices together whenever a discount is
  active — never just the lower number with no context for the saving.

## Error States

- Invalid discount (equal/higher than regular price): inline validation
  error at save time.

## Notifications

- None required in v1.

## Future Expansion

- Scheduled discounts with a start/end date, activating and deactivating
  automatically.
- Automatic, rule-based, code-less discounts (e.g., "10% off the whole
  Scrubs category this weekend") distinct from a single product's sale
  price.
- Tiered/bundle automatic discounts.

## Functional Requirements

- FR-1: Set and clear a discount price per product.
- FR-2: Display both prices together, with the discount visually clear,
  wherever the product appears.

## Non-Functional Requirements

- A discount price change reflects on the storefront immediately.

## Business Constraints

- No scheduling and no automatic/rule-based discounts in v1 — this
  module is deliberately limited to a manual, always-on sale price per
  product.

## Dependencies

- [03-Products](03-PRODUCTS.md) — the discount price lives on the
  product/variant.

## Open Questions

- Is scheduled discounting (start/end dates) needed before launch, or is
  manual on/off sufficient for the first release?
