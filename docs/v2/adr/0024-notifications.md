# ADR 0024: Notifications

**Status**: Accepted
**Depends on**: [ADR 0023](0023-event-architecture-and-job-system-implementation.md)
(the outbox/queue pipeline this module is the first real consumer of).
**Epic**: 11 (Commerce Services).

## Context

`docs/product/09-NOTIFICATIONS.md` specifies email as the only channel for
MVP (SMS/push are Phase 2+). `PROJECT_STATUS.md` gaps #16/#17 name two
concrete, currently-broken flows this closes: staff password-reset has no
real delivery mechanism (the raw token is exposed directly in the API
response, dev-only), and there is no order/review/registration
notification of any kind, admin- or customer-facing.

## Decision

### Provider-based Email Service

```ts
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProviderPort {
  send(message: EmailMessage): Promise<void>;
}
```

`NodemailerEmailProvider` is the only implementation — SMTP via
`nodemailer`, configured entirely from env (`SMTP_HOST`/`SMTP_PORT`/
`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`), defaulting to the Mailpit
container already provisioned by `docker-compose.yml` since Epic 1
(`localhost:1025`, viewable at `http://localhost:8025`) — no new
infrastructure dependency, an existing unconsumed one gets its first real
use. Swapping providers (SES, Postmark, Resend) later means one new class
implementing the same port and one line in `NotificationsModule`, the same
shape as the `MediaStoragePort`/`EmailProviderPort` pattern named in
`docs/v2/04-SAAS-EXTENSION-POINTS.md`.

### Templates

Plain TypeScript functions, not a template-file/engine dependency —
`(data) => { subject: string; html: string; text: string }` per
notification type, colocated under
`notifications/infrastructure/templates/`. Five templates for the five
events ADR 0023 wires: `password-reset-requested`, `order-placed-admin-
alert`, `order-status-changed-customer`, `welcome-customer`,
`review-submitted-admin-alert`. Matches the project's existing
"no unnecessary dependency" bias (e.g. the storefront's contact form uses
a plain `mailto:` link rather than a form-builder library) — five fixed,
type-checked functions are simpler and safer than a runtime template
engine for a template set this size, and every field they interpolate is
already-known domain data (order number, customer name), never raw user
input rendered as HTML.

### Notification Queue, Preferences, History, Event Listeners

All four live in one `NotificationsModule` — they're one cohesive
capability (an event happens → is it wanted? → record it → maybe email
it), not four separable ones:

- **Event Listeners**: `@OnEvent('order.placed')`-style handlers are
  *not* used (per ADR 0023, delivery for every notification-worthy event
  goes through the durable outbox → BullMQ path, not the in-process
  emitter). Instead, a single `NotificationsQueueProcessor`
  (`@Processor('notifications')`) is the one real "listener" — one
  BullMQ job type per event, dispatched by the outbox relay.
- **Notification Queue**: the `notifications` and `email` BullMQ queues
  from ADR 0023.
- **Preferences**: `NotificationPreference(storeId, ownerType, ownerId,
  type, channel, enabled)` — `ownerType` is `ADMIN` or `CUSTOMER`.
  Defaults to enabled (a row only exists once someone opts out, kept
  small and matching how most notification-preference systems default).
  Checked once, inside `NotificationsQueueProcessor`, before deciding
  whether to enqueue the `email` job — the `Notification` history row is
  still always written regardless, so History reflects "this happened,"
  never silently loses an entry because email was muted.
- **History**: `Notification(type, channel, recipientType, recipientId,
  recipientEmail, subject, body, status, sentAt, error)` — one row per
  attempted send (or per suppressed-by-preference event), queryable by
  staff (`GET /v1/notifications`, reusing `AUDIT_LOG_VIEW` — an
  operational log in the same spirit as the audit log, not a new
  permission).

### Wiring: which frozen use-cases needed an outbox write, and what each
email says

| Trigger (frozen file, ADR 0023 §"which files") | Event | Recipient | Template |
|---|---|---|---|
| `RequestPasswordResetUseCase` (via the repository write) | `PasswordResetRequested` | the staff member | Reset link (`{adminUrl}/reset-password?token=...`) — closes gap #16 |
| `PlaceOrderUseCase` → `orders.create()` | `OrderPlaced` | store admin address (`STORE_ADMIN_NOTIFICATION_EMAIL` env, falls back to the bootstrap Super Admin's email) | "New order #{orderNumber}" |
| `AdvanceOrderStatusUseCase`/`CancelOrderUseCase` → `orders.changeStatus()` | `OrderStatusChanged` | the order's `customerEmailSnapshot` | "Your order #{orderNumber} is now {status}" — covers cancellation too, reusing the one event rather than adding `OrderCancelled` as a second write site for the same transition |
| `RegisterCustomerUseCase` → `customers.create()` | `CustomerRegistered` | the new customer | Welcome email |
| `SubmitReviewUseCase` → `reviews.create()` | `ReviewSubmitted` | store admin address | "New review awaiting moderation" |

`RequestPasswordResetUseCase`'s control flow, validation, and
`revealToken`/dev-only-response behavior are **not** modified — the one
line that changes is its existing `passwordResetTokens.create(...)` call
gaining two more fields (`rawToken`, `email`), both values it already had
in scope. Neither is persisted to `PasswordResetToken` itself (still only
`tokenHash`); they exist solely so
`PrismaPasswordResetTokenRepository.create()` (ADR 0023's table) can build
the outbox event payload, since a repository can't reconstruct a raw
token from its one-way hash. Production now *also* gets a real email,
dev keeps the same direct-response shortcut it always had for fast local
testing.

### Preferences ownership in the frontend

Customer-side notification preferences (an opt-out toggle for order-status
emails) surface on the storefront's existing `/account` page as one more
field, calling the new `GET/PATCH /v1/customers/me/notification-
preferences` routes — additive to `CustomerProfileController`'s existing
surface, no change to any existing route. Staff-side preferences (who
receives admin alerts, and whether to receive them at all) surface in the
new admin CMS/Notifications area (ADR 0025's admin UI work).

## Consequences

- Every notification is provider-agnostic and queue-driven — nothing calls
  `NodemailerEmailProvider` directly outside the `email` queue processor.
- `Notification` history grows unbounded the same way `AuditLog` does
  (already a named future concern in the v1 review) — a retention/purge
  job is a natural addition to the existing `maintenance` queue later, not
  built this epic (no growth exists yet to purge).
- The five wired events are deliberately the minimum that make
  Notifications real end-to-end rather than an inert scaffold — see ADR
  0023's "not wired this epic" table for what's deferred and why.

## Alternatives Considered

- **A template engine (Handlebars/MJML) for emails** — rejected as
  unnecessary weight for five fixed, developer-authored templates with no
  runtime-authored content.
- **In-process `@OnEvent` listeners instead of the `notifications` queue
  processor** — rejected; per ADR 0002/0023, anything that must reliably
  happen (an email) goes through the durable path, not best-effort
  in-process dispatch.
- **A separate `OrderCancelled` event** — rejected in favor of reusing
  `OrderStatusChanged` (status already transitions to `CANCELLED` through
  the same `changeStatus()` write site); a second event for the same
  transition would just be two notifications for one thing.
