# ZA Store — Plugin Architecture (Priority 3)

Full detail behind [ADR 0007](adr/0007-plugin-architecture.md).

## What "plugin" means here, precisely

An in-process, dynamically-registered NestJS `DynamicModule`, discovered
and wired at application bootstrap by a `PluginRegistry`. **Not** a
sandboxed, hot-loadable, untrusted-code runtime. There is no plugin
marketplace, no third-party plugin developer, and no requirement to run
a disabled plugin's code in isolation — building for that would be solving
a problem this platform doesn't have yet. If that ever changes (a genuine
third-party developer ecosystem becomes a real product goal), that's a
new ADR and likely a new runtime, not an extension of this one.

## The `PlatformPlugin` contract

```
interface PlatformPlugin {
  name: string;
  version: string;
  provides: PortName[];         // e.g. ["PaymentGatewayPort"]
  dependsOn: PortName[];        // ports this plugin itself requires
  register(): DynamicModule;    // the actual NestJS module factory
}
```

`PluginRegistry` (loaded in `app.module.ts` at bootstrap) reads an
enabled-plugin list — an env var today (`ENABLED_PLUGINS=cod-payments,
default-shipping`), a `Store`-scoped config row once
[04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)'s Plugins
section is actually exercised — and calls `register()` on each, wiring
the resulting modules into the app.

## Classification — not every module is the same kind of "plugin"

Treating every module in the brief's list identically would be a mistake.
Each is classified by what kind of extensibility it actually needs:

### Swappable adapter (implements an existing port)

**Payments, Shipping, Notifications (channels).** A plugin here is
literally "a new implementation of `PaymentGatewayPort`/
`ShippingRatePort`/a notification channel adapter." The v1 DDD document
already got this right for Payments/Shipping — this section generalizes
it and adds Notifications explicitly. Core domain logic (Checkout,
Orders, the `NotificationDispatcher`) never changes when a new adapter is
added; it only ever talks to the port.

### Core context, swappable backing implementation

**CMS.** Every store needs *some* content model — the CMS *context*
itself stays core, non-optional. What's pluggable is the *storage*: the
default is v1's custom `Page`/`BlogPost` tables; a `ContentSourcePort`
lets a future client swap in a headless CMS (Sanity/Contentful) if their
content needs outgrow the built-in tables. This is a real distinction
from Payments/Shipping: there, the *whole context* is generic and
pluggable; here, only the *implementation detail* is.

**Analytics.** Same shape: baseline dashboards (v1's read-models) ship
core, for every store. An `AnalyticsSinkPort` lets a plugin forward the
same Outbox events every other subscriber already receives (per
[ADR 0002](adr/0002-event-architecture.md)) to GA4/Segment/a data
warehouse — genuinely free to add, since the events already flow; a sink
plugin is just one more subscriber.

**Reviews.** Basic reviews ship core. A `ReviewsProviderPort` allows
swapping in a third-party reviews service later for a client who wants
one — deferred, not built, port named.

### True optional plugin (additive feature, not every store wants it)

**Marketing, Loyalty, Gift Cards.** These are the strongest fit for
"plugin" in the ordinary sense — self-contained feature sets, off by
default, that a store opts into. Each ships as its own NestJS module with
its own Prisma models (see the schema-composition constraint below),
registered only when enabled. Disabling one of these means its routes
don't exist (404, not hidden-but-reachable) and its event subscriptions
never register — verified by the plugin-registry tests specified in
[ADR 0010](adr/0010-developer-experience-governance.md).

### Seam defined, nothing built

**Future AI Modules.** Two ports named, zero implementation:
`AIAssistPort` (e.g., generate a product description draft from a photo
+ a few keywords) and `RecommendationPort` (personalized product
recommendations). What concretely goes behind either port is explicitly
deferred — see [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md). Naming the
seam now means a future AI feature is "implement this port," not
"redesign Catalog/Orders to make room for AI."

## The honest constraint: Prisma's schema composition

Prisma's schema language is one file, with no first-class way to compose
several files without an extra build step. This means: **a plugin's
NestJS module (routes, services, event subscriptions) can be
conditionally registered at bootstrap. Its Prisma models cannot be
conditionally migrated in that same simple way.** Concretely:

- Optional-plugin models (Loyalty's `PointsLedger`, Gift Cards'
  `GiftCard`/`GiftCardTransaction`, Marketing's campaign models) live in
  the **main** `schema.prisma`, grouped and comment-labeled by plugin
  (`// --- plugin: loyalty ---`), and are migrated into the database
  regardless of whether the plugin is enabled.
- What's actually conditional is the **NestJS module** — if Loyalty is
  disabled, its controller routes don't exist, its event subscriptions
  never fire, and its tables simply sit unused. This costs a handful of
  empty tables for a disabled plugin — an acceptable, explicitly-stated
  tradeoff, not a hidden limitation.
- If the number of optional plugins grows large enough that this becomes
  wasteful (many disabled plugins' tables cluttering every deployment's
  schema), revisit schema-per-plugin composition tooling then — flagged
  in [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), not solved
  speculatively now for a problem three plugins doesn't yet create.

## Plugin lifecycle

1. **Registered** — present in the codebase, `PlatformPlugin` contract
   implemented.
2. **Enabled** (per store, per [04-SAAS-EXTENSION-POINTS.md](04-SAAS-EXTENSION-POINTS.md)) —
   its `DynamicModule` is imported at bootstrap for that store's requests.
3. **Disabled** — module not imported; routes 404; event subscriptions
   never bind; its (already-migrated) tables sit empty.

There is no "uninstall" that drops tables — consistent with this
platform's "archive, don't delete" discipline from
[v1 07-DATABASE-REVIEW.md §5](../07-DATABASE-REVIEW.md#5-cascade-policies)
applied at the plugin level: disabling is reversible without any data
loss, because nothing was ever deleted.

## Module boundary rule (enforced by lint, per [ADR 0010](adr/0010-developer-experience-governance.md))

A plugin module may depend on a core port (`PaymentGatewayPort`,
`AnalyticsSinkPort`, etc.). **Core must never import a specific plugin's
implementation.** This is the same dependency-direction discipline v1
already lint-enforced for Clean Architecture layers
([v1 15-PROJECT-STANDARDS.md §4](../15-PROJECT-STANDARDS.md#4-code-style)),
extended to cover the new plugin boundary with the same tooling, not a
new mechanism.
