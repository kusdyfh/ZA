# ZA Store — SaaS Extension Points (Priority 2)

Full detail behind [ADR 0006](adr/0006-saas-ready-schema-pattern.md).
**None of this implements tenancy.** Every mechanism below is designed so
it costs nothing today (one `Store` row, one config value, one adapter)
and requires no data migration when it's actually exercised later —
that's the entire point of "future-ready without building it now."

## The core mechanism, once

Everything below rides on the same pattern: a `Store`-scoped column or
config row exists now, resolved today from a constant (an env var or a
single seeded row), resolved *later* from a real per-request lookup with
zero schema change. Restating this once here rather than in each section
below, since it's the same idea applied eleven times.

## Stores

**Mechanism**: the `Store` entity and `storeId` scoping from
[ADR 0006](adr/0006-saas-ready-schema-pattern.md). A `StoreContext`
(NestJS request-scoped provider) supplies `storeId` to every repository
call — today via `DEFAULT_STORE_ID` env var, later via a `Store.domain`
lookup against the request's `Host` header, resolved in middleware before
any route handler runs.
**Cost today**: one seeded row, one env var. **Change required later**:
middleware resolution logic only — no repository, service, or domain
layer code changes, because they already take `storeId` as a parameter.

## Branding & Themes

*(The brief lists these separately; they are the same extension point —
worth stating plainly rather than inventing an artificial distinction.)*

**Mechanism**: v1's design ([v1 09-DESIGN-SYSTEM.md](../09-DESIGN-SYSTEM.md))
compiled brand tokens into the build at deploy time — fine for one store
per deployment, wrong for many stores sharing one running instance. v2
introduces `StoreTheme(storeId, tokenKey, tokenValue)`, read at
**request** time and injected as CSS custom properties by the root layout
Server Component — no rebuild required to change a store's theme.
**Cost today**: one row set matching ZA Store's existing pink palette,
read instead of compiled — visually identical output. **Change required
later**: none — this mechanism already supports per-store theming the
moment more than one `Store` row exists.

## Media

**Mechanism**: a `MediaStoragePort` interface introduced now (per
[16-SENIOR-ARCHITECTURE-REVIEW.md §6](../16-SENIOR-ARCHITECTURE-REVIEW.md),
which flagged Media as the one integration that never got the
Payments/Shipping port treatment), with `CloudinaryAdapter` as the only
implementation. Every upload namespaced `store/{storeId}/...` even though
`{storeId}` is constant today.
**Cost today**: one interface, one adapter, a folder-path convention.
**Change required later**: a second adapter (S3+imgproxy, Bunny) can be
added per store without touching Catalog's domain logic, and existing
assets are already correctly namespaced.

## Payments & Shipping

**Mechanism**: already ported in v1 (`PaymentGatewayPort`,
`ShippingRatePort`). v2 adds `StorePaymentConfig(storeId, provider,
credentialsRef)` and `StoreShippingConfig(storeId, provider,
credentialsRef)` — `credentialsRef` points at a secret (never a raw
credential inline in the row, per
[07-OPERATIONAL-ARCHITECTURE.md](07-OPERATIONAL-ARCHITECTURE.md)).
**Cost today**: two small config tables, one row each, pointing at the
one COD adapter. **Change required later**: a store picks its own
gateway/carrier by changing its config row — no code change.

## Notifications

**Mechanism**: `StoreNotificationConfig(storeId, channel, isEnabled,
templateOverrides)` — which channels (email/WhatsApp/SMS/push, per
[ADR 0007](adr/0007-plugin-architecture.md)) a store has enabled, and any
template customization.
**Cost today**: one config row per seeded store, matching whatever
channels ZA Store launches with. **Change required later**: additive
config rows, no code change — the `NotificationDispatcher` already reads
this table to decide fan-out targets.

## Taxes

**Mechanism**: `TaxRate(storeId, region, rate, appliesToCategoryId?)`,
seeded with a single `0%` row for launch. The historical side (recording
what tax applied to a given order) was already prepared in
[ADR 0004](adr/0004-order-snapshot-redesign.md)'s `Order.taxTotal`/
`OrderItem.taxRate`/`taxAmount` fields — this is the *live calculation*
side that reads `TaxRate` at checkout time and writes the result into
those already-existing snapshot fields.
**Cost today**: one table, one seeded 0% row, a `TaxCalculationService`
that returns 0 (or a real single-region rate if ZA Store's launch market
requires it — a business decision, not an architecture one).
**Change required later**: add rows per region/category; no schema
change, because the storage side already exists.

## Currencies

**Mechanism**: `Store.defaultCurrency` and `Order.currencyCode`/
`Product.currencyCode` (per [ADR 0004](adr/0004-order-snapshot-redesign.md)),
plus a `Currency(code, symbol, decimalPlaces)` reference table.
**Cost today**: one reference row (`IQD`), fields defaulted identically
everywhere. **Change required later**: true multi-currency pricing (a
`ProductPrice(storeId, currencyCode, amount)` side table, letting one
product have prices in several currencies) is an **additive** table, not
built now — deferred to [12-OPEN-QUESTIONS.md](12-OPEN-QUESTIONS.md), but
explicitly *not* blocked by anything built today.

## Languages / i18n

**Mechanism**: **not built now** — but the intended pattern is documented
so a future implementer doesn't reach for the wrong one. The correct
pattern is a side-table (`Translation(entityType, entityId, locale,
field, value)`), not a column-per-language
(`nameEn`/`nameAr`/`nameFr`...) on `Product`/`Category`/`Page`/`BlogPost`,
because column-per-language doesn't scale past two languages and requires
a migration for every new one. Naming the correct pattern now — even
though it isn't implemented — is the actual deliverable for this
extension point, per the brief's "explain exactly how" ask.
**Cost today**: zero — a documented intention, not code.
**Change required later**: add the `Translation` table and a resolution
layer that falls back to the entity's base-language field when no
translation row exists for the requested locale — additive, no
restructuring of existing content tables.

## Plugins

Covered in full in [05-PLUGIN-ARCHITECTURE.md](05-PLUGIN-ARCHITECTURE.md) —
cross-referenced here because a plugin's *configuration* (which plugins a
store has enabled) is itself a store-scoped extension point, following
the identical pattern: a config row (or, today, an env var list) resolved
per store, with zero code change required to add a second store's
different plugin selection later.

## Summary — what this buys, concretely

Every extension point above shares the same shape: **a small,
store-scoped table or config value exists now, seeded with one row/value,
read by code that's already written to expect it.** None of it changes
ZA Store's launch behavior. All of it means that when a second store
deployment is genuinely pursued, the work is "add a row and resolve
`storeId` per-request" for most of these — not "redesign how theming,
media, payments, or notifications work," which is exactly the trap
[16-SENIOR-ARCHITECTURE-REVIEW.md §2](../16-SENIOR-ARCHITECTURE-REVIEW.md)
warned a purely aspirational "reusable" claim would fall into.
