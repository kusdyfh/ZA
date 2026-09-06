# ADR 0007: Plugin Architecture

**Status**: Accepted
**Supersedes**: nothing directly — extends the "swappable port" pattern
[v1 06-DDD-BOUNDED-CONTEXTS.md](../../06-DDD-BOUNDED-CONTEXTS.md) already
applied to Payments/Shipping into a formal, general mechanism.
**Full detail**: [05-PLUGIN-ARCHITECTURE.md](../05-PLUGIN-ARCHITECTURE.md).

## Context

The brief asks which modules (CMS, Payments, Shipping, Analytics,
Notifications, Reviews, Marketing, Loyalty, Gift Cards, future AI modules)
should "become plugins." Before answering that, the more important
question is: **what does "plugin" actually mean for this platform**,
because building a sandboxed, hot-loadable, third-party-developer-facing
plugin runtime (à la WordPress or Shopify apps) is a substantial project
in its own right — one this platform has no evidence of needing yet.
There are no external plugin developers, no plugin marketplace, no
requirement for a disabled plugin's code to be untrusted.

## Decision

**Plugins are in-process, dynamically-registered NestJS modules with a
formal contract — not a sandboxed external runtime.** A `PluginRegistry`,
loaded at bootstrap, reads an enabled-plugins list (an env var today; a
`Store`-scoped config table once [ADR 0006](0006-saas-ready-schema-pattern.md)'s
extension point is actually used) and dynamically imports the
corresponding `DynamicModule`s.

Each candidate from the brief is classified by **what kind of extensibility
it actually needs** — treating them all identically would be wrong:

| Module | Classification | Reasoning |
|---|---|---|
| Payments, Shipping | **Swappable adapter** — a plugin here means "an implementation of an existing port" | Already ported in v1; a plugin literally just implements `PaymentGatewayPort`/`ShippingRatePort`. |
| Notifications | **Swappable adapter** (channel) | Already an event subscriber per [ADR 0002](0002-event-architecture.md); a plugin adds a new channel adapter (SMS, push), not new domain logic. |
| CMS | **Core context, swappable backing implementation** | Every store needs *some* content model — CMS-as-a-concept stays core. What can be a plugin is the *storage*: custom `Page`/`BlogPost` tables (default) vs. a `ContentSourcePort` adapter to a headless CMS (Sanity/Contentful) for a content-heavy future client. |
| Analytics | **Core basics + swappable sink** | The v1 dashboard read-models stay core (every store needs a baseline dashboard). An `AnalyticsSinkPort` lets a plugin forward the same Outbox events (per [ADR 0002](0002-event-architecture.md)) to GA4/Segment/a warehouse — no special integration work needed beyond subscribing to events that already flow. |
| Reviews | **Core basics + swappable provider** | Basic reviews ship in-platform by default; a `ReviewsProviderPort` allows swapping in a third-party reviews service later, for a client who wants one. |
| Marketing, Loyalty, Gift Cards | **True optional plugins** | These are the strongest fit for "plugin" in the brief — self-contained, additive feature sets that not every store wants, not swappable implementations of something every store needs. Each is its own NestJS module with its own Prisma models, registered only when enabled. |
| Future AI Modules | **Seam defined, nothing built** | Two ports are named now — `AIAssistPort` (e.g., product-description generation) and `RecommendationPort` (personalization) — with zero implementation. What "AI modules" concretely means is deliberately deferred; see [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md). |

### The one honest technical constraint

Prisma uses a single schema file with no first-class multi-file
composition without an extra build step. **A plugin's NestJS module can
be conditionally registered; its Prisma models cannot be conditionally
migrated in the same simple way.** Optional-plugin models (Loyalty, Gift
Cards, Marketing) live in the main `schema.prisma`, clearly grouped and
comment-labeled by plugin, and are migrated whether or not the plugin is
enabled — what's actually conditional is the NestJS module (routes,
services, event subscribers) that reads/writes them, not the tables'
existence. This is stated plainly rather than implying a cleaner
separation than Prisma's current tooling supports.

## Consequences

- No sandboxing, no plugin marketplace, no third-party trust boundary —
  correctly scoped to this platform's actual current need (internal
  extensibility across ZA Store and a handful of future client
  deployments), not an aspirational App Store.
- Optional plugins (Loyalty, Gift Cards, Marketing) can ship disabled by
  default with zero runtime cost beyond unused tables — a deliberate,
  acceptable tradeoff given Prisma's schema-composition limits.
- The Payments/Shipping/Notifications port pattern from v1 is validated
  and generalized rather than replaced — this ADR extends a decision that
  was already right, it doesn't reverse it.

## Alternatives Considered

- **A true sandboxed/hot-loadable plugin runtime.** Rejected as
  significant, unjustified over-engineering for a platform with no
  external plugin developers today — revisit only if a genuine
  third-party plugin ecosystem becomes a real product goal.
- **Separate Prisma schema files per plugin, composed at build time.**
  Considered; rejected for v2 as added build-tooling complexity not
  currently justified by the number of optional plugins (three) — worth
  revisiting if the plugin count grows substantially (see
  [12-OPEN-QUESTIONS.md](../12-OPEN-QUESTIONS.md)).
