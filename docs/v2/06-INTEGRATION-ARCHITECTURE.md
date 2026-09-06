# ZA Store — Integration Architecture (Priority 4)

Full detail behind [ADR 0008](adr/0008-integration-architecture.md).

## What's built now vs. deferred

| Mechanism | Status | Why |
|---|---|---|
| Outbound webhooks | **Built** | Needed for any external system (ERP, a client's own tooling) to react to platform events at all. |
| API keys | **Built** | Needed for any machine-to-machine caller (ERP push, future POS) distinct from a human session. |
| OAuth2 | **Specified, not built** | No third-party client exists yet to consume it. |
| ERP integration pattern | **Pattern specified, no concrete ERP integrated** | Deferred until a specific ERP is named. |
| Shipping/Payment provider adapters | **Ports exist (v1), concrete adapters deferred** | Deferred until specific providers are chosen. |
| Mobile app auth | **Extension point named, not built** | No mobile app exists yet. |
| POS order flow | **Reuse path confirmed, not built** | No POS exists yet. |

## Outbound Webhooks

Built on `WebhookSubscription` (per
[02-DATABASE-STRATEGY-V2.md](02-DATABASE-STRATEGY-V2.md)) and the
`webhooks` BullMQ queue (per
[ADR 0003](adr/0003-background-job-system.md)):

- `WebhookSubscription(storeId, url, eventTypes[], secret, isActive,
  consecutiveFailures)` — a store (or, today, the one seeded store's
  admin) registers a URL and the event types it cares about.
- Delivery: every matching `OutboxEvent` (per
  [ADR 0002](adr/0002-event-architecture.md)) enqueues a webhook job.
  Payload is HMAC-SHA256 signed with the subscription's `secret`; the
  receiver verifies the signature and a timestamp header within a ±5
  minute window to reject replays.
- Failure handling: exponential backoff retry (per
  [ADR 0003](adr/0003-background-job-system.md)'s per-queue retry
  config); `consecutiveFailures` increments on each failed attempt; after
  a configured threshold (e.g., 10), `isActive` flips to `false` and an
  admin `Notification` fires — a dead subscription is surfaced, not
  silently retried forever.
- Delivery log: each attempt (success or failure) is worth recording for
  support/debugging — a lightweight `WebhookDeliveryLog` (subscriptionId,
  eventId, statusCode, attemptedAt, succeeded) is a reasonable addition
  when this is actually built, not specified in full schema detail here
  since it's a straightforward audit table, not an architectural decision.

## API Keys

For machine callers that aren't a logged-in human:

- `ApiKey(storeId, keyHash, label, scopes[], createdBy, lastUsedAt,
  revokedAt)` — the raw key is shown once at creation, only its hash is
  stored (same discipline as password storage).
- Validated by a dedicated `ApiKeyGuard`, separate from the customer/admin
  `JwtAuthGuard` — a different credential type, a different guard, not
  overloaded onto the session-auth path.
- `scopes[]` gates which endpoints a given key can call (e.g., an ERP
  integration key might get `inventory:write`, `orders:read` but not
  `settings:write`) — the same RBAC discipline applied to a non-human
  actor.
- Rate-limited more strictly by default than user-driven traffic
  (per [v1 08-API-REVIEW.md §10](../08-API-REVIEW.md#10-rate-limiting)'s
  pattern, extended to this new credential type) — a compromised API key
  should have a smaller blast radius than a compromised user session by
  default, tightened further per integration if warranted.

## OAuth2 (deferred, seam specified)

**Not built.** When a genuine third-party client needs delegated
access (a mobile app built by a separate team, a partner integration
acting on behalf of a specific customer rather than the platform as a
whole), the seam is: `/oauth/authorize` + `/oauth/token` endpoints
(authorization-code flow), `OAuthClient` (client_id, client_secret hash,
redirect URIs, allowed scopes) and `OAuthToken` (access/refresh token
pairs, scoped to a specific customer + client). This is deliberately not
built today — v1's existing JWT model fully serves the two known
first-party clients, and building an unused auth flow is exactly the kind
of premature scaffolding flagged elsewhere in this review (the WhatsApp
folder finding, [16-SENIOR-ARCHITECTURE-REVIEW.md §6](../16-SENIOR-ARCHITECTURE-REVIEW.md)).

## External ERP

Two integration surfaces, both reusing existing domain services rather
than introducing a parallel code path:

- **Outbound**: an ERP subscribes to `OrderPlaced`/`OrderStatusChanged`
  via the webhook mechanism above.
- **Inbound**: ERP-initiated actions (e.g., a stock correction from a
  physical count done in the ERP) authenticate via an API key scoped to
  `inventory:write`, and are routed through the **same**
  `StockAdjustmentService` the admin UI's manual-adjustment form uses —
  never a separate "ERP import" code path that skips validation or the
  audit trail. An ERP-driven stock change gets an `Actor{id: apiKeyId,
  type: SYSTEM}` reference (per [ADR 0005](adr/0005-actor-reference-model.md))
  and a `StockMovement` row exactly like a human admin's would.

## Shipping & Payment Providers

Both already have a port (`ShippingRatePort`, `PaymentGatewayPort`) from
v1/[ADR 0006](adr/0006-saas-ready-schema-pattern.md). A concrete provider
integration is:
- a new adapter class implementing the port,
- registered as a plugin (per [05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md)),
- selected via `StorePaymentConfig`/`StoreShippingConfig`
  (per [04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)).

Inbound payment webhooks (gateway callbacks) follow the pattern already
specified in [v1 12-SECURITY-REVIEW.md](../12-SECURITY-REVIEW.md#xss):
verify the provider's signature, enforce a replay window, and **always
re-query the gateway's own API for the authoritative payment state**
rather than trusting the webhook payload as the final word — the webhook
triggers a re-check, it is never itself the source of truth.

## Future Mobile App

Architecturally, a mobile app is simply another API client — the REST
layer is already client-agnostic. The one real design implication: if a
mobile app's session semantics should differ from the web storefront's
(longer-lived refresh tokens, device-bound tokens, biometric re-auth), it
gets its own JWT audience — `aud: "mobile"` alongside the existing
`customer`/`admin` — validated the same way
([v1 01-ARCHITECTURE.md §4](../01-ARCHITECTURE.md#4-authentication--rbac)).
Cheap to add when a mobile app is real; not built speculatively now.

## Future POS

A physical point-of-sale would need its own order-creation orchestration:
no cart/shipping step, synchronous card-terminal payment capture, and
likely immediate `CONFIRMED`/`DELIVERED` status (no shipping phase for an
in-person sale). Because the Checkout saga's steps are already explicit
and named (per [ADR 0001](adr/0001-inventory-reservation-strategy.md):
reserve → pay → confirm), a POS-specific orchestrator can reuse
Inventory's reservation/confirmation and Orders' aggregate without
duplicating either — it would simply compose the same steps differently
(reserve → pay synchronously → confirm, with no shipping step in
between). This is confirmed as a reuse path, not built.
