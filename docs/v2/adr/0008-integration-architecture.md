# ADR 0008: Integration Architecture

**Status**: Accepted
**Supersedes**: the brief `WebhookSubscription` mention in
[v1 08-API-REVIEW.md §12](../../08-API-REVIEW.md#12-webhooks-preparation),
formalizing it and adding API keys, OAuth, and named external-integration
patterns that v1 didn't cover.
**Full detail**: [06-INTEGRATION-ARCHITECTURE.md](../06-INTEGRATION-ARCHITECTURE.md).

## Context

A reusable platform will eventually need to talk to systems it doesn't
control: a client's ERP, a shipping carrier's API, a payment gateway, and
— someday — a mobile app or in-store POS built by a different team. v1
named webhooks in passing; nothing else was designed.

## Decision

Four concrete mechanisms, each scoped to what's actually needed now versus
deferred:

1. **Outbound webhooks** — built now, using the `WebhookSubscription`
   concept and the `webhooks` BullMQ queue from
   [ADR 0003](0003-background-job-system.md): `(storeId, url, eventTypes[],
   secret, isActive, consecutiveFailures)`. HMAC-SHA256 signed, replay-safe
   (timestamp + nonce), auto-disabled after N consecutive failures with an
   admin notification.
2. **API keys** — built now, for machine-to-machine integration (an ERP,
   a future POS) distinct from customer/admin JWT sessions:
   `ApiKey(storeId, keyHash, label, scopes[], createdBy, lastUsedAt,
   revokedAt)`, validated by a dedicated `ApiKeyGuard`, rate-limited more
   strictly than user-driven traffic by default.
3. **OAuth2** — **specified, not built.** Needed only once a genuine
   third-party client (a mobile app built by a separate team, a partner
   integration acting on a user's behalf) requires delegated access rather
   than a platform-issued API key. The seam: `/oauth/authorize`,
   `/oauth/token` endpoints and `OAuthClient`/`OAuthToken` models, added
   when a real third-party client exists — v1's existing JWT model already
   fully serves the two known first-party clients (`apps/web`,
   `apps/admin`).
4. **Named external-system patterns**:
   - **ERP**: a webhook consumer (subscribes to `OrderPlaced`/
     `OrderStatusChanged`) plus an API-key-authenticated path for
     ERP-initiated actions (e.g., stock corrections) — routed through the
     *same* `StockAdjustmentService` the admin UI uses, never a parallel
     code path, so ERP-driven changes get the same audit trail as a human
     admin's.
   - **Shipping providers**: concrete adapters behind `ShippingRatePort`
     (per [ADR 0006](0006-saas-ready-schema-pattern.md)/
     [04-SAAS-EXTENSION-POINTS.md](../04-SAAS-EXTENSION-POINTS.md)) —
     deferred until a specific provider is chosen; the port already exists.
   - **Payment providers**: concrete adapters behind `PaymentGatewayPort`;
     inbound webhook handling always re-queries gateway state rather than
     trusting the payload alone, per
     [v1 12-SECURITY-REVIEW.md](../../12-SECURITY-REVIEW.md#12-webhooks-preparation).
   - **Future mobile app**: "just another API client" — the one real
     design implication is a distinct JWT audience (`aud: "mobile"`
     alongside `customer`/`admin`) if session semantics differ (longer-lived
     refresh, device binding) — a small, cheap extension of the existing
     auth design, not a new system.
   - **Future POS**: would need its own order-creation orchestration
     (in-person, no cart/shipping, synchronous card-terminal payment) —
     the Checkout saga's step-based design (per
     [ADR 0001](0001-inventory-reservation-strategy.md)) already separates
     concerns enough that a POS-specific orchestrator could reuse
     Inventory/Orders/Payments without duplicating them. Not built; the
     reuse path is simply confirmed to exist.

## Consequences

- Two of four mechanisms (webhooks, API keys) are built now because
  they're needed for the platform to be integrable at all; two (OAuth,
  POS orchestration) are explicitly deferred with a stated trigger
  condition, not silently absent.
- ERP/API-key-driven mutations reuse existing domain services rather than
  introducing a second, less-audited code path — a direct application of
  the Clean Architecture boundary discipline already established.

## Alternatives Considered

- **Build OAuth now, speculatively.** Rejected — no third-party client
  exists yet to consume it; building an auth flow with no real caller is
  exactly the kind of premature scaffolding this project's own principles
  argue against (as already flagged for the WhatsApp folder in the v1
  senior review).
- **Let ERP integrations write directly to the database or bypass domain
  services for speed.** Rejected outright — this defeats the audit trail,
  validation, and RBAC-adjacent guarantees every other write path gets.
