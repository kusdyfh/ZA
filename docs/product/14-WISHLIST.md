# 14 — Wishlist

## Purpose

Let customers save products they're interested in but aren't ready to
buy yet, without losing track of them.

## Business Rules

- Wishlist requires a logged-in account — it's tied to the customer's
  profile, not the device or browser, so it's available across sessions
  and devices.
- There's no limit on how many items a customer can wishlist.
- A wishlisted item can be moved directly to the cart from the wishlist
  view.

## User Stories

- As a customer, I want to save a product to my wishlist, so I can find
  it again later without searching.
- As a customer, I want my wishlist to follow my account across devices,
  so it's there whether I'm on my phone or a computer.
- As a customer, I want to move a wishlisted item straight to my cart, so
  I don't have to search for it again when I'm ready to buy.

## Acceptance Criteria

- Given a logged-in customer, When they tap the wishlist icon on a
  product, Then it's added to their wishlist immediately, with clear
  visual confirmation.
- Given an item on a customer's wishlist, When they choose "move to
  cart," Then it's added to their cart and (depending on the chosen
  behavior) either remains on or is removed from the wishlist.
- Given a customer isn't logged in, When they try to wishlist an item,
  Then they're prompted to log in or register, and — once they do — their
  original intent to wishlist that item is honored, not lost.

## Edge Cases

- A wishlisted product is later archived → it remains visible on the
  wishlist but clearly marked "no longer available," rather than
  silently disappearing and confusing the customer about what happened to
  it.
- A wishlisted product's only remaining variants go out of stock → shown
  as "Sold Out" on the wishlist, consistent with how it's shown anywhere
  else on the storefront.

## Validation Rules

- None beyond requiring a logged-in customer.

## Permissions

- Customer: fully self-service, own wishlist only.
- No staff role has a reason to view or edit a customer's wishlist in v1.

## UI Behaviour

- A heart/toggle icon on product cards and the product page.
- A dedicated wishlist page listing saved items with a clear "move to
  cart" action per item.

## Error States

- Attempting to wishlist while logged out: a login/register prompt, not a
  silent failure or lost click.

## Notifications

- None in v1 (see Future Expansion for back-in-stock/price-drop alerts,
  which depend on this module but aren't built yet).

## Future Expansion

- Back-in-stock notifications for wishlisted, currently sold-out items.
- Price-drop alerts for wishlisted items.
- Wishlist sharing (a shareable link, useful for gifting).

## Functional Requirements

- FR-1: Add/remove products to/from a logged-in customer's wishlist.
- FR-2: Display wishlist status (available / sold out / no longer
  available) accurately per item.
- FR-3: Move a wishlist item to the cart.

## Non-Functional Requirements

- Wishlist state is available instantly on login from any device — no
  separate sync step required.

## Business Constraints

- No guest wishlist in v1 — an account is required.

## Dependencies

- [01-Authentication](01-AUTHENTICATION.md) — requires login.
- [03-Products](03-PRODUCTS.md) — wishlist references products directly.

## Open Questions

- When back-in-stock alerts are eventually built, should they go out to
  every customer who wishlisted the item, or only those who wishlisted it
  while it was already out of stock?
