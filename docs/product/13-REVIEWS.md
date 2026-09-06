# 13 — Reviews

## Purpose

Let customers rate and review products, building trust for future
shoppers and giving the business direct feedback on product quality.

## Business Rules

- A customer can leave one review per product — a star rating (1–5) is
  required, written text is optional.
- Every review is moderated (Pending → Approved or Rejected) before it
  appears publicly — nothing customer-submitted goes live automatically.
- Any logged-in customer can review a product in v1, whether or not
  they've actually purchased it. A "verified purchase" badge is
  deliberately deferred (see Future Expansion) rather than restricting
  who can review at all, to avoid limiting review volume before the store
  has built up a purchase history to draw from.

## User Stories

- As a customer, I want to leave a star rating and written review for a
  product, so I can share my experience with other shoppers.
- As a customer, I want to see the average rating and review count on a
  product page, so I can gauge quality before buying.
- As a Customer Support staff member, I want to moderate incoming
  reviews, so only genuine, appropriate reviews go live.

## Acceptance Criteria

- Given a customer who hasn't reviewed a product before, When they submit
  a rating and review, Then it enters the moderation queue as Pending.
- Given a customer who has already reviewed a product, When they attempt
  to submit another review for it, Then they're offered to edit their
  existing review instead of creating a duplicate.
- Given a moderator approves a review, When approved, Then it appears
  publicly on the product page and contributes to the average rating.
- Given a moderator rejects a review, When rejected, Then it never
  appears publicly, and the customer is not shown it as "pending forever"
  — resolved one way or the other, not left in limbo.

## Edge Cases

- A customer tries to submit a review with no rating (only text) →
  blocked; a star rating is always required, text is optional.
- A review is submitted for a product that's since been archived → the
  review can still be moderated and, if approved, remains associated with
  the product for historical/reporting purposes, even though the product
  itself no longer appears in active browsing.

## Validation Rules

- Rating: required, 1 to 5.
- Review text: optional, with a reasonable maximum length.
- One review per product per customer.

## Permissions

- Customer: submit and edit their own review only.
- Manager, Super Admin, Customer Support: moderate (approve/reject) any
  review.
- Sales, Warehouse: no access.

## UI Behaviour

- Simple star-input plus optional text area on the product page (for
  logged-in customers).
- Moderation queue with clear approve/reject actions and an optional
  internal reason note for rejections.

## Error States

- Missing rating: inline validation error.
- Duplicate review attempt: redirected to editing the existing review,
  not a generic error.

## Notifications

- New-review-submitted alert to moderators.
- (Optional) review-approved/rejected notice to the customer.
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Verified-purchase badge on reviews from customers who actually bought
  the item.
- Photo/video attachments on reviews.
- Product Q&A section, separate from star reviews.
- Helpful/not-helpful voting on individual reviews.

## Functional Requirements

- FR-1: Allow a logged-in customer to submit one rating+review per
  product.
- FR-2: Route every submission through a moderation queue before public
  display.
- FR-3: Display average rating and review count on the product page.
- FR-4: Allow a customer to edit their own existing review.

## Non-Functional Requirements

- The average rating and review count update immediately once a review
  is approved.

## Business Constraints

- No purchase-verification requirement to leave a review in v1 — anyone
  with an account can review any product.

## Dependencies

- [03-Products](03-PRODUCTS.md) — reviews are attached to a product.
- [02-Customers](02-CUSTOMERS.md) — review authorship.
- [19-Notifications](19-NOTIFICATIONS.md) — moderation alerts.

## Open Questions

- Should a "verified purchase" badge be prioritized earlier than other
  Future Expansion items, given its trust value for a new store with a
  limited review history?
