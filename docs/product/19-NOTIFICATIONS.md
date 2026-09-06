# 19 — Notifications

## Purpose

Make sure the right person learns about the right event through the
right channel, at the right urgency — without turning into noise that
gets ignored.

## Business Rules

- Every notification has a type (new order, low stock, new review,
  coupon expiring, order status change, etc.) and is routed only to the
  roles who actually need to act on it — a Warehouse account is never
  notified about a new review; a Sales account is never notified about a
  homepage-content change.
- Channel choice depends on urgency and audience, not a single "notify
  everyone the same way" rule:
  - Low-priority, internal, browsable-later items (a new review to
    moderate) are dashboard-only.
  - Higher-priority items an admin should see promptly (a new order) are
    dashboard **and** a real-time update, so a staff member watching the
    dashboard sees it the moment it happens without refreshing.
  - Every customer-facing transactional notification (order confirmed,
    shipped, delivered) is always sent by email at minimum, since email
    is the one channel guaranteed to reach a customer regardless of
    whether they're actively using the site.
- A notification is never silently lost. If one channel fails (an email
  bounces), the underlying notification record still exists and is
  visible wherever else it's routed (e.g., the dashboard).
- Customers control their own marketing-email opt-in, but cannot opt out
  of transactional notifications tied to their own actions (order status,
  password reset) — these are necessary, not promotional.
- During unusually high activity (e.g., a big sale generating many
  low-stock crossings at once), similar alerts are grouped into a single
  digest rather than flooding staff with one notification per unit sold —
  a deliberate anti-noise rule.

## User Stories

- As a Warehouse staff member, I want a dashboard alert the moment a
  variant goes low-stock, so I can reorder before we run out.
- As a customer, I want an email the moment my order ships, so I know to
  expect it.
- As a Manager, I want to see new orders appear on my dashboard in real
  time, without needing to refresh the page.
- As a future integration partner, I want a webhook fired when an order's
  status changes, so an external system (like an ERP) stays in sync
  automatically.
- As a customer, I want to eventually receive order updates over
  WhatsApp, since that's how I already communicate day to day.

## Acceptance Criteria

- Given a new order is placed, When it's created, Then the customer
  receives a confirmation email within a minute, and any staff member
  with order visibility sees it on their dashboard in real time.
- Given a variant crosses its low-stock threshold, When detected, Then
  Warehouse and Manager see a dashboard alert; this does not also trigger
  an email by default.
- Given many low-stock crossings happen within a short window during a
  sale, When they occur, Then staff receive a grouped summary rather than
  one alert per event.

## Edge Cases

- The email provider is temporarily unavailable → the notification record
  still exists (visible on the dashboard where applicable) and the email
  is retried automatically once the provider recovers, rather than lost.
- A customer's email address bounces permanently → this is flagged on
  their profile for Customer Support's awareness, so a future support
  interaction can catch and fix it, rather than the failure disappearing
  silently.

## Validation Rules

- Not applicable in the traditional sense — notifications are system-
  generated, not user-input forms. The one exception: a future webhook
  subscription's target URL must be a valid, well-formed address.

## Permissions

Notification visibility strictly follows each role's actual
responsibilities — the same routing already established elsewhere in
this document set:

| Role | Sees notifications about |
|---|---|
| Super Admin | Everything |
| Manager | Everything except staff/settings-only system notices |
| Warehouse | Inventory (low stock, out of stock), order fulfillment |
| Sales | Orders, coupons (apply-related) |
| Customer Support | Orders, returns, reviews (moderation) |
| Customer | Their own orders, account, and (if opted in) marketing |

## UI Behaviour

- A notification bell with an unread-count badge, grouped by type, with a
  "mark all read" action.
- Clicking a notification goes directly to the relevant order/product/
  review — never a generic landing page requiring a manual search.

## Error States

- Not generally customer-visible (system notifications don't fail in a
  way a customer would see) — for admins, a failed delivery (e.g., a
  future webhook) is visible in a delivery log so it can be investigated,
  never a silent drop.

## Notification Channel Matrix

| Event | Dashboard | Email (customer) | Email/alert (admin) | Real-time (live update) | Webhook (future) | WhatsApp (future) | Push (future) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Order placed | | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Order status changed | | ✓ | | ✓ | ✓ | ✓ | |
| Order cancelled | | ✓ | ✓ | | ✓ | ✓ | |
| Return requested | ✓ | | ✓ | | | | |
| Low stock | ✓ | | | | | | |
| Out of stock | ✓ | | | ✓ | | | |
| New review | ✓ | | | | | | |
| Coupon usage limit reached / expiring | ✓ | | | | | | |
| Password reset / account security | | ✓ | | | | | |
| Back in stock *(future)* | | ✓ | | | | ✓ | ✓ |

## Future Expansion

- WhatsApp order-update messages.
- Push notifications (once a mobile app or installable web app exists).
- Customer-configurable notification preferences beyond the single
  marketing opt-in.
- SMS as a channel.
- Outbound webhooks for external integrations (ERP, partner systems).

## Functional Requirements

- FR-1: Route every notification type to only the roles/customers who
  need it.
- FR-2: Deliver customer-facing transactional notifications by email at
  minimum, always.
- FR-3: Provide a real-time dashboard update for high-priority admin
  events (new order) without requiring a manual refresh.
- FR-4: Group similar alerts into a digest during high-activity periods
  rather than sending one per event.
- FR-5: Never lose a notification if one channel fails — the underlying
  record persists and remains visible elsewhere.

## Non-Functional Requirements

- Customer-facing emails (order confirmation, shipped, delivered) are
  sent within about a minute of the triggering event under normal
  conditions.
- Dashboard real-time updates appear within seconds of the triggering
  event.

## Business Constraints

- Customers cannot opt out of transactional notifications tied to their
  own orders/account — only marketing communications are optional.

## Dependencies

- Every module that generates a notification: [06-Inventory](06-INVENTORY.md),
  [07-Orders](07-ORDERS.md), [09-Coupons](09-COUPONS.md),
  [13-Reviews](13-REVIEWS.md), [01-Authentication](01-AUTHENTICATION.md).

## Open Questions

- What's the right grouping/digest window during high-activity periods —
  a few minutes, or longer?
- Which specific event types should get a WhatsApp channel first, once
  that capability exists?
