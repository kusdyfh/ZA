# ZA Store — Senior Architecture Review

**Role**: Lead Architect, final design review before Phase 0 freeze.
**Posture**: adversarial. The 15 planning documents this review covers are
well-organized and internally cross-referenced, and that thoroughness is
itself worth naming once — but thoroughness of *documentation* is not
evidence of a correct *design*, and several of this document set's own
claims (especially "reusable," "enterprise-grade") are not yet backed by
the actual schema and API design. This report exists to find what's wrong
before code makes it expensive to fix. Every finding below cites the
specific document and, where relevant, the specific model/field that
produced it — this is not generic e-commerce-architecture commentary.

---

# 1. Scalability Review

The honest answer is: **the documented design has not been stress-tested
against its own numbers.** [13-PERFORMANCE-STRATEGY.md](13-PERFORMANCE-STRATEGY.md)
and [07-DATABASE-REVIEW.md](07-DATABASE-REVIEW.md) describe reasonable
defaults, but neither names a concrete row count or request rate where a
specific mechanism stops working. Here's that missing analysis.

| Tier | Verdict | What actually happens |
|---|---|---|
| **10 products** | Fine, and honestly over-built for it | Every mechanism in this doc set — Clean Architecture, RBAC, ISR, DDD contexts — is overkill for 10 SKUs. That's an acceptable cost only because the stated goal is the reusable *platform*, not this one catalog. If ZA Store alone were the entire scope, this architecture would be indefensible over-engineering. |
| **1,000 products** | Fine | Postgres/Prisma, the planned indexes, and ISR handle this without strain. Nothing to redesign. |
| **50,000 products** | First real cracks appear | Two specific things in the current design start to hurt, neither flagged with a concrete trigger point in the source docs: (1) `Category`'s adjacency-list self-relation ([03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md), `Category.parentId`) has no materialized path — "show all products under Scrubs including its children" requires a recursive CTE that Prisma can't express natively, meaning hand-written raw SQL on a hot storefront path. [07-DATABASE-REVIEW.md §1](07-DATABASE-REVIEW.md#1-normalization) calls the materialized-path fix "not needed at launch" — at 50k SKUs across a real category depth, that's already wrong; this is where it's needed. (2) The PLP filter UX implicitly wants facet counts ("12 in Pink, 8 in size M") — a standard PLP expectation nowhere in [04-API-DESIGN.md](04-API-DESIGN.md)'s product-list endpoint. Adding it later means redesigning the query, not just adding a field. |
| **500,000 products** | Postgres full-text search hits its ceiling | `Product.searchVector` + `pg_trgm` ([03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md), [07-DATABASE-REVIEW.md §2](07-DATABASE-REVIEW.md#2-indexes)) is a reasonable v1 default but was never positioned as a scale-out plan — it's presented as *the* search solution, full stop. At this size, relevance ranking, typo tolerance, and faceted aggregation on a single Postgres instance serving live storefront traffic will degrade under concurrent load. **Redesign**: introduce Meilisearch or Typesense as a read-model projection (Postgres stays the source of truth; the search index is rebuilt via the same publish-event mechanism already used for ISR revalidation — the plumbing already exists, it's just not pointed at a second consumer). `ProductMedia` also reaches millions of rows here — fine for Postgres, but there is no shared media-library/asset-reuse concept anywhere in the schema (see §3), so admin media management gets genuinely painful at this volume. |
| **100,000 customers** | Fine, with one early warning sign | No structural bottleneck, but `RefreshToken` rotation (per [01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac)) writes a new row on every refresh, not an update. This is the first tier where that growth curve becomes visible in backup size and index maintenance — and there is no purge job specified anywhere in this doc set (see §5, risk #14). |
| **1,000,000 customers** | Multiple compounding problems | `RefreshToken` (tens of millions of rows without a purge job — a genuine bottleneck, not a hypothetical one), `AuditLog` and `Notification` growth (same issue), and — critically — Order/OrderItem volume at any realistic conversion rate at this customer count pushes Analytics past the point [06-DDD-BOUNDED-CONTEXTS.md §Analytics](06-DDD-BOUNDED-CONTEXTS.md#analytics) already anticipated ("promoted to a materialized view... if query volume demands it" — it demands it here, concretely). **The single-VPS/single-Postgres topology in [14-DEPLOYMENT.md](14-DEPLOYMENT.md) is the real ceiling at this tier** — there is no read-replica story, no managed-DB migration path, nothing beyond "PostgreSQL installed locally on the VPS." That's an honest v1 choice for launch budget, but this document set never states the tier at which it stops being adequate, which means it will be discovered in production instead of planned for. |

**Bottleneck summary, redesigned:**
1. Category tree → add materialized path/depth column now (cheap while the table is empty; expensive as a live migration later).
2. Search → design the Meilisearch/Typesense swap-in as a defined port now (the DDD doc already uses "swappable port" language for Payments/Shipping; Search deserves the same treatment and currently doesn't have it).
3. `RefreshToken`/`AuditLog`/`Notification` growth → needs a purge/partition job, which needs a job scheduler that currently doesn't exist in the stack at all (see §5, risk #3).
4. Single Postgres instance → name the trigger (a concrete order-volume or customer-count threshold) at which a managed DB / read replica becomes mandatory, rather than leaving it undiscussed.

---

# 2. Multi-Store Readiness

**Blunt answer: this is currently a single-tenant architecture with a
reusability *narrative* layered on top, not a multi-tenant-capable one.**
[README.md](README.md) and [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md)
both use SaaS-adjacent language ("ZA Store is the first deployment, not
its only one"), but the actual mechanism described in
[14-DEPLOYMENT.md §5](14-DEPLOYMENT.md#5-environment-variables) is "clone
the repo, populate `.env` with that client's values, deploy" — that is
**multi-instance reuse of a codebase**, not a **multi-tenant SaaS
platform**. These are two entirely different engineering efforts, and the
document set currently conflates them. This distinction should be made
explicit before Phase 0, because it changes what "reusable" is allowed to
mean in every other doc.

If the actual goal is a shared-infrastructure SaaS platform (one running
system serving many stores), here's what changes, concretely:

| Area | What breaks today | What's required |
|---|---|---|
| **Database** | Every uniqueness constraint in [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md) is **global**: `Product.slug`, `Product.sku`, `ProductVariant.sku`/`barcode`, `Category.slug`, `Coupon.code`, `Customer.email`, `AdminUser.email`, `Order.orderNumber`. Two stores both wanting a product slugged `pink-scrub-top` collide immediately. | Every one of those becomes a composite unique: `(storeId, slug)`, `(storeId, sku)`, `(storeId, code)`, `(storeId, email)`, `(storeId, orderNumber)`. Either (a) add `storeId` to every table + Postgres Row-Level Security policies scoping every query to the caller's store (least app-code risk, most ops complexity to set up correctly once), or (b) schema-per-tenant on the same Postgres server (less RLS complexity, but Prisma migrations must run per-schema — real tooling friction), or (c) keep the current db-per-client model and accept it's multi-instance, not multi-tenant. |
| **Authentication** | JWTs ([01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac)) carry no store identifier at all. | Add a `storeId` claim; `RefreshTokenFamily` lookups scope by it too. Decide explicitly whether a staff member can belong to multiple stores (a store-switcher UX) or is strictly one-store-per-account — this is a real product decision, not just a schema tweak. |
| **Media** | Cloudinary is called directly from Catalog's infrastructure layer ([02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md), `cloudinary-media.adapter.ts`) with no per-store namespacing or swappable interface — the one context in this platform that notably *didn't* get the "Open Host Service" treatment Payments and Shipping got in the DDD doc. | Namespace every upload under a store-scoped folder/tag; parameterize signed-upload presets per store; and — independent of multi-tenancy — give Media the same port/adapter abstraction Payments already has, since Cloudinary cost-at-scale is itself a per-client business concern (see §6). |
| **Settings** | `Setting.key @unique` ([03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)) is a single global table. | `(storeId, key)` composite unique. More importantly: branding/theme tokens are currently a **build-time** concept (`packages/ui/tokens`, swapped via env vars per [14-DEPLOYMENT.md §5](14-DEPLOYMENT.md#5-environment-variables)) — under real multi-tenancy, one running app instance serves many stores, so theming must become **runtime**, resolved per-request from stored config, not compiled into the build. This is a genuine redesign of how [09-DESIGN-SYSTEM.md](09-DESIGN-SYSTEM.md) gets delivered, not a data-modeling footnote. |
| **Orders** | `Order.orderNumber @unique` is a global sequence. | Per-store sequential numbering (most merchants expect their own orders to start at 1, or at least not visibly reveal a shared platform's total order volume across all its clients). Needs a concurrency-safe per-store counter, not a shared global one. |
| **Products** | Global uniqueness as above; also worth asking directly: does "multi-store" mean **fully independent tenants** (what this table assumes), or **one shared catalog exposed through multiple storefronts/brands**? Those are different features with different data models, and the brief doesn't disambiguate — this should be a clarifying question before any of this work starts. | Resolve which one is actually wanted before scoping the migration — the effort and design differ substantially. |
| **Domains** | [14-DEPLOYMENT.md §2](14-DEPLOYMENT.md#2-nginx) hardcodes three fixed subdomains in a static Nginx config. | Either subdomain-per-store on one platform domain, or full custom-domain-per-store — the latter requires dynamic Nginx config generation and per-domain TLS issuance, which is a genuinely hard operational problem usually solved by putting a SaaS-domain provider (Cloudflare for SaaS, Vercel domains) in front rather than hand-rolling certbot automation. This is one of the most underestimated pieces of "just add multi-tenancy." |
| **Admin** | `apps/admin` and the entire RBAC matrix ([05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix)) assume administering exactly one store. | Needs a **new bounded context** — Platform/Tenant Administration — sitting *above* the existing per-store `AdminRole` enum: someone who manages which stores exist, billing, and cross-store platform staff. This context does not exist anywhere in [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md) today. |

**The one genuinely good finding in this section**: because the Clean
Architecture repository-interface pattern and DDD context boundaries are
already in place, the actual *business logic* — the Checkout saga, RBAC
enforcement, coupon validation — barely changes in a multi-tenant
conversion. The work is almost entirely additive `storeId` threading
through repositories and query scoping, not a rewrite of domain services.
That is a direct payoff of the architecture's discipline. But make no
mistake: this is realistically a **multi-month re-architecture**,
concentrated in the database layer, auth, dynamic domains/TLS, and a new
admin tier — not a config flag. Whichever way this goes, it needs to be a
stated decision, not an implication left in a README paragraph.

---

# 3. Maintainability Review

Modules likely to become painful within 2-3 years, and why:

### `Setting` (Administration context)
`Setting { key: String @unique, value: Json }` ([03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md))
is the classic schema-less-config-in-a-relational-DB trap. Nothing
constrains what keys exist, nothing validates a given key's expected
shape, and "what settings does this platform even have" becomes a
grep-the-codebase exercise rather than a schema you can read. This is
fine at 5 settings; by year two it will be 40, half of them referenced by
string literals scattered across both frontends. **Better abstraction**:
a typed settings registry — a `Record<SettingKey, ZodSchema>` map in
`packages/validation` that every read/write goes through, even though
storage stays JSON. The validation lives in one place instead of at every
call site.

### `Coupon` (Coupons context)
[03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md) already admits the model
is doing double duty: "a discount is simply a coupon with no code
requirement... an `isAutomatic` flag can be added without a schema
overhaul." That sentence is a warning sign the document wrote about
itself and then didn't act on. One model accreting boolean flags
(`isOneTimeUse`, future `isAutomatic`, future tiered/BOGO logic) is
exactly how a coupon table becomes an unreadable decision tree. It
currently cannot express buy-X-get-Y, tiered ("spend more, save more"),
or bundle pricing at all — real merchandising asks within the first year
of any DTC brand's life. **Better abstraction**: split `Coupon`
(code-redemption) from a `PromotionRule` concept (composable conditions →
composable effects) before Phase 4 locks the current model further.

### `CheckoutOrchestrator` (Checkout context)
[06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#checkout)
describes one domain service coordinating six other contexts
procedurally. Calling it an "orchestrator" doesn't prevent it from
becoming a god-service — it will accumulate branching for COD vs. card
vs. wallet, guest vs. customer, coupon vs. none, gift-box vs. regular,
and every future payment method, and every branch multiplies the others.
**Better abstraction**: model it as an explicit state machine with named
steps and per-step compensations (a real saga, not an imperative
try/catch chain) from the first implementation, not retrofitted after it's
already 400 lines of conditionals.

### RBAC as a hardcoded enum
`AdminRole` ([03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)) is a fixed
five-value enum, and [10-ADMIN-DASHBOARD-SPEC.md §15](10-ADMIN-DASHBOARD-SPEC.md)
confirms "the matrix itself is not editable per-user in v1." For a
platform whose stated goal is reuse across future clients, a fixed role
set is a wall the moment any client wants a role this platform didn't
anticipate (a "Photographer" who only uploads media, a "Finance" role
distinct from Manager). [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#administration)
already gestures at a `Permission` value object that the schema never
actually implements as data. **Better abstraction**: roles-as-data (a
`Permission` join table) before a second client deployment is sold, not
after.

### Inconsistent actor-reference modeling (found by close reading, not called out anywhere in the review docs)
`OrderNote.author` is a real Prisma relation (`@relation(fields:
[authorId], references: [id])`). But `OrderStatusHistory.changedByAdminId`,
`StockMovement.createdByAdminId`, and `BlogPost.authorAdminId` — all in
the same [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md) — are bare
`String?` fields with no `@relation` at all. Same conceptual reference
("which admin did this"), modeled two different ways in the same schema.
The practical cost: no referential integrity on three of the four, no
`include`-based join, and a future admin-account deletion (or the
anonymization procedure [07-DATABASE-REVIEW.md §6](07-DATABASE-REVIEW.md#6-soft-delete-strategy)
describes for customers, if ever extended to staff) silently orphans
those string fields instead of being caught by the database. **Fix now,
before any migration runs**: make all four proper relations.

### Media has no home
Every content entity — `Product`, `Category`, `Collection`, `Banner`,
`BlogPost` — has its own ad hoc `imageUrl`/`coverImageUrl`/`bannerUrl`
string field. There is no shared `Asset`/media-library concept with reuse
or usage tracking. In year two, marketing will want to upload one lifestyle
photo and use it in a banner, a blog post, and a gift-box promo — and the
current schema makes that three separate uploads with three
Cloudinary-managed copies, not one asset used three places. Introduce a
thin shared `Asset` entity now, even before a media-library UI exists.

### Modules that should become plugins
Restating the DDD doc's own logic with a maintainability lens: **Payments**
(gateway adapters), **Shipping** (carrier adapters), and **Notifications**
(channel adapters) are already correctly identified as swappable ports.
Add to that list: **Media/Storage** (Cloudinary vs. S3+imgproxy vs. Bunny,
per §6) and, if the multi-store direction in §2 is pursued, **CMS** itself
becomes a candidate to swap for a headless CMS (Sanity, Contentful) for
any future client whose content needs outgrow the custom `Page`/`BlogPost`
tables — worth naming now even though it's a "maybe never" for ZA Store
specifically.

---

# 4. Feature Gap Analysis

Organized by category, with what's present/deferred vs. genuinely absent.
"Deferred" means the document set acknowledges it and defers it
deliberately (fine); "Absent" means it isn't mentioned anywhere, which for
a few of these is a real gap for a platform calling itself enterprise-grade.

| Feature | Status | Note |
|---|---|---|
| Abandoned Cart recovery | **Absent** | No event, no reminder mechanism — and no infrastructure to build one on (see Background Jobs, below). |
| Email Templates / transactional email content mgmt | **Absent** | A `mailer` adapter folder exists ([02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md)) but no templating/versioning system for its content. |
| Inventory Reservations | **Partially modeled, and inconsistently** | `StockMovementType` has `RESERVATION`/`RESERVATION_RELEASE` enum values, but there is no `StockReservation` entity with an `expiresAt`. See risk #3/#4 — this is a real design hole, not just a missing nice-to-have. |
| Gift Cards | **Absent** | Distinct from Coupons (a gift card is stored value, not a discount rule) — not modeled at all. |
| Returns / RMA | **Partially modeled** | `OrderStatus.RETURNED` exists; no `Return` entity (reason, restocking decision, refund linkage, return-shipping tracking). |
| Exchanges | **Absent** | Not modeled, not mentioned. |
| Tax Engine | **Absent** | No `TaxRate`/region model, no tax-inclusive/exclusive pricing toggle. Likely acceptable for ZA Store's initial single-market launch; a hard blocker for any future client in a market with mandatory tax display. |
| Multi-Currency | **Absent, and actively assumed against** | `Decimal @db.Money` assumes one currency platform-wide; nothing stores which currency. |
| Multi-Language / i18n | **Absent, and actively assumed against** | Product/Category/Page/BlogPost text fields are single-locale strings; `Address.country @default("Iraq")` is a hardcoded single-market assumption sitting directly in the schema. |
| Loyalty / Reward Points | **Deferred (acknowledged)** | Named in [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)'s deferred section and Phase 9 — fine, this is honest deferral, not a gap. |
| Referral Program | **Deferred (acknowledged)** | Same as above. |
| Product Bundles/Kits | **Absent** | Gift Box Builder (deferred) is a compose-your-own-box feature — a general "buy this set as one SKU" bundle is a different, unaddressed concept. |
| Subscriptions | **Absent, undeclared** | Plausibly out of scope for scrubs, but should be an explicit "not planned" rather than silent. |
| Digital Products | **Absent, undeclared** | Same as above. |
| Advanced/Faceted Search | **Partially** | Basic FTS + trigram only; no facet-count design (see §1). |
| Saved Filters/Searches | **Absent** | Not mentioned. |
| Customer Segments | **Absent** | `Customer.marketingOptIn` is the only targeting dimension — no behavioral/RFM segmentation. |
| Marketing Automation | **Absent** | Ties directly to the Abandoned Cart and Email Template gaps above, plus the Background Jobs gap below — none of the infrastructure this needs exists yet. |
| Event Bus | **Absent — and this is the most consequential gap in the whole document set** | [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md) repeatedly describes contexts communicating via named domain events (`OrderPlaced`, `LowStockThresholdCrossed`, `ReviewSubmitted`...) and explicitly calls Notifications and Analytics "pure event subscribers." **No architecture or deployment document specifies any actual event infrastructure** — no in-process event emitter, no message broker, nothing. This is a direct contradiction between the DDD narrative and the concrete architecture: either the events are in-process (fine, cheap, but should say so — `@nestjs/event-emitter`) or they need a durable broker (BullMQ-on-Redis, given Redis is already planned for Phase 3-4) — but right now it's neither, it's just prose. |
| Message Queue | **Absent** | Same root cause as above. |
| Background Jobs / Cron | **Absent** | Needed for: reservation-expiry sweeps, refresh-token/audit-log/notification purges, coupon/campaign expiry, abandoned-cart detection, sitemap regeneration, analytics rollups. None of these have a home in any of the 15 documents. This is not a "nice to have later" — several other findings in this report (risk #3, #4, the Inventory Reservation gap) directly depend on this existing. |
| Multi-warehouse / multi-location inventory | **Absent** | `ProductVariant.stock` is a single global number — no `Warehouse`/`Location` concept. Fine for one fulfillment center; a real gap the moment ZA Store (or any client) opens a second one. |
| Size Guide / Fit data | **Absent as structured data** | [11-STOREFRONT-SPEC.md](11-STOREFRONT-SPEC.md) mentions "a size guide link" on the PDP but there's no `SizeGuide` entity — for a scrubs/apparel brand this is arguably the single highest-leverage return-reduction feature, and it's currently just a hyperlink. |
| Wishlist sharing | **Absent** | Common DTC/gifting feature (share a wishlist link) — unaddressed. |
| SMS notifications | **Absent** | Only email/WhatsApp adapters are stubbed. |
| Cookie/consent management (CMP) | **Absent** | Privacy practices are discussed ([12-SECURITY-REVIEW.md](12-SECURITY-REVIEW.md)) but no consent-banner/CMP integration is mentioned despite GDPR-style erasure being designed for. |
| Data export / portability | **Absent** | [07-DATABASE-REVIEW.md §6](07-DATABASE-REVIEW.md#6-soft-delete-strategy) designs erasure thoroughly but never mentions export (GDPR Art. 20-style "give me my data") — an asymmetric compliance gap. |
| Admin MFA | **Explicitly deferred, arguably too casually** | [01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac) notes the schema/login flow are "designed not to preclude it," which is a soft way of saying it isn't happening at launch. For the accounts controlling pricing, RBAC, and financial data, this should be a harder requirement, not a maybe. |
| Search analytics (top/zero-result queries) | **Absent** | A standard merchandising signal, unaddressed. |

---

# 5. Risk Assessment — Top 25

Ranked by Impact × Probability. **P0 = must resolve before Phase 0 lock,
P1 = resolve in Phase 0-2, P2 = resolve before the relevant roadmap phase
starts, P3 = monitor/accept.**

| # | Risk | Impact | Probability | Priority | Mitigation |
|---|---|---|---|---|---|
| 1 | Checkout ([06-DDD](06-DDD-BOUNDED-CONTEXTS.md#checkout)/[04-API](04-API-DESIGN.md §5)) holds a `SELECT FOR UPDATE` stock lock across what may include an external payment-gateway HTTP call | High | Medium (certain once a real gateway replaces COD) | **P0** | Split into reserve → pay (outside the lock) → confirm, with explicit compensation on payment failure — not one transaction spanning an external call. |
| 2 | No event bus/message queue exists despite the DDD narrative assuming pub/sub between contexts | High | High (already true today) | **P0** | Adopt `@nestjs/event-emitter` in-process now; promote to BullMQ+Redis when Redis lands. Document the decision explicitly. |
| 3 | No background job/scheduler infrastructure anywhere in the stack | High | High | **P0** | Adopt `@nestjs/schedule` + BullMQ repeatable jobs in Phase 0/1, not "later." |
| 4 | `Order` references a mutable `Address` row instead of snapshotting shipping details — contradicts the platform's own stated "immutable order history" principle (applied everywhere else via `OrderItem` snapshots) | High | High (a customer editing their address after ordering is routine) | **P0** | Snapshot address fields onto `Order` at checkout time, same pattern as `OrderItem.productNameSnapshot`. |
| 5 | Inconsistent actor-reference modeling (`OrderNote.author` is a relation; `changedByAdminId`/`createdByAdminId`/`authorAdminId` are bare strings) | Medium | High (already in the schema) | **P0** | Normalize all four to real relations before any migration exists. |
| 6 | "Reusable platform" language vs. zero tenant-scaffolding in the schema | High (if a SaaS pivot is actually intended) | Medium | **P1** | Explicitly decide and document: multi-instance reuse (current reality) vs. multi-tenant SaaS (a different, larger project) — see §2. |
| 7 | No MFA on Super Admin/Manager accounts | High (account takeover = full platform compromise) | Medium | **P1** | Require TOTP MFA for the two highest-privilege roles before launch. |
| 8 | Single VPS + single Postgres instance = single point of failure for the entire business | Critical | Low-Medium | **P1** | Backups are already planned; add a tested disaster-recovery runbook and name the scale trigger for a managed DB/second box. |
| 9 | Hardcoded single-country/single-currency assumptions (`Address.country @default("Iraq")`, `Decimal @db.Money`) | High for reusability, Low for ZA Store alone | High (certain to matter for any non-Iraq client) | **P1** | Remove the hardcoded default now, while no data exists; add a `currency` field even if only one value is used at launch. |
| 10 | `Coupon` conflates manual codes with future automatic/tiered/BOGO promotions, no rule-engine abstraction | Medium | High (marketing will ask within year one) | **P1** | Design the `PromotionRule` split before Phase 4 locks the current model further. |
| 11 | Media/Storage never got the swappable-port treatment Payments/Shipping got — Cloudinary is hard-baked into Catalog's infrastructure layer | Medium | Medium | **P1** | Introduce a `MediaStoragePort` interface now, even with only a Cloudinary adapter behind it. |
| 12 | Hardcoded 5-role RBAC enum blocks any future client wanting a custom role | Medium | Medium | **P2** | Move to roles-as-data (`Permission` join table) before a second client deployment is sold. |
| 13 | `CheckoutOrchestrator` risks becoming a procedural god-service | Medium | High | **P2** | Model as an explicit state machine with compensations from the first implementation. |
| 14 | `RefreshToken`/`AuditLog`/`Notification` unbounded growth, no purge/partition strategy | Medium | High (certain over 2-3 years) | **P2** | Scheduled purge jobs (depends on risk #3 existing first); partition `AuditLog` by month once large. |
| 15 | Hot-SKU contention (viral product, flash sale) serializes all checkouts for that SKU on one row lock | High (ironic: marketing success causes the outage) | Medium | **P2** | Dedicated high-contention path (Redis-backed atomic decrement synced to Postgres) for flash-sale scenarios. |
| 16 | Raw SQL living outside Prisma's schema language (CHECK constraints, GIN index, `tsvector`) risks migration drift if not disciplined | Medium | Medium | **P2** | All raw SQL must live in versioned migration files; document this as a hard rule, not a convention. |
| 17 | Redis's actual first-need trigger (reservation TTL sweeps, event queue) is earlier than [13-PERFORMANCE-STRATEGY.md](13-PERFORMANCE-STRATEGY.md)'s stated "Phase 3-4" | Medium | High | **P2** | Pull Redis into Phase 0/1 scope given risks #1-3 above. |
| 18 | Category adjacency-list has no materialized path — recursive descendant queries get expensive at real catalog depth/size | Medium | Medium (fires at the 50k-product tier per §1) | **P2** | Add `path`/`depth` now, while the table is empty. |
| 19 | Postgres FTS+trigram search has a real ceiling around 500k products; no faceted-count design exists in the API doc | Medium | Medium | **P2** | Design the Meilisearch/Typesense swap-in as a defined port now, per §1. |
| 20 | `nestjs-zod` (or equivalent Zod↔NestJS-DTO bridge) is proposed but unverified against `@nestjs/swagger` generation, a known friction point in that ecosystem | Medium | Medium | **P2** | Spike this specific integration in Phase 0 before committing; have a fallback ready. |
| 21 | Two independent Next.js apps (web/admin) double the framework-upgrade, CI, and ops surface indefinitely | Low-Medium | High (it's already locked in) | **P2** | Accepted tradeoff per [01-ARCHITECTURE.md](01-ARCHITECTURE.md) — just document it as a recurring cost, not a one-time decision. |
| 22 | No data-export/portability mechanism designed (only erasure) | Medium | Low-Medium (depends on target markets) | **P2** | Add an export use-case alongside the already-designed anonymization procedure. |
| 23 | Cloudinary vendor lock-in / cost-at-scale across many future client deployments | Medium | Medium (compounds per client) | **P2** | Ties to risk #11 — the port abstraction is the mitigation. |
| 24 | CUID primary keys vs. UUIDv7/ULID | Low | Low | **P3** | Cheap to reconsider now (no data exists); expensive later. Not urgent, worth a deliberate yes/no before Phase 0. |
| 25 | 80% domain-layer test-coverage target ([15-PROJECT-STANDARDS.md](15-PROJECT-STANDARDS.md)) stated without a concrete CI-enforcement gate | Low | Medium | **P3** | Either wire a coverage gate into CI or state the number as aspirational — as written it risks becoming unenforced prose like several other "should" statements in this doc set. |

---

# 6. Dependency Review

Going through the confirmed stack ([README.md](README.md),
[01-ARCHITECTURE.md](01-ARCHITECTURE.md)) and questioning each entry:

| Dependency | Verdict | Reasoning |
|---|---|---|
| Next.js, React, TypeScript | **Keep** | No serious alternative fits the SSR/ISR + SEO requirements this well. |
| TailwindCSS | **Keep** | Matches the token-driven design system approach directly. |
| **Framer Motion** | **Question — scope it down** | [09-DESIGN-SYSTEM.md §8](09-DESIGN-SYSTEM.md#8-animation-principles) describes fade/rise entrances, hover scale, and drawer slides — the large majority of that is plain CSS transitions/Tailwind, not a reason to ship a JS animation runtime on the SEO-critical storefront bundle. Keep it, but restrict actual usage to what CSS genuinely can't do (exit animations tied to React unmount, shared-layout transitions) — not as a default tool for every hover state. |
| React Query | **Keep** | Justified for authenticated/interactive state per the architecture's own SSR/client split. |
| React Hook Form + Zod | **Keep, with a caveat** | Fully justified for complex forms (product-create with a variant matrix). Simple single-field admin forms (Settings) may not need client-side RHF at all — worth not defaulting to it everywhere reflexively. |
| NestJS, Prisma, PostgreSQL | **Keep** | Already well-justified in [01-ARCHITECTURE.md §8](01-ARCHITECTURE.md#8-why-this-stack-specifically); the one caveat is that Prisma's schema language doesn't cover CHECK constraints/GIN indexes/tsvector, so "the schema is the single source of truth" (as stated) is only true if the raw-SQL discipline in risk #16 is actually followed. |
| **Cloudinary** | **Keep for v1, but stop treating it as permanent** | Justified for photography-heavy DX today. At scale, and especially across multiple future client deployments, its transformation/bandwidth-based pricing compounds as a recurring cost with no architectural escape hatch, because (per §3/§5) Media never got a swappable port the way Payments did. Fix the abstraction, keep the vendor. |
| Hostinger VPS, PM2, Nginx | **Keep for launch budget, name the ceiling** | Reasonable and honest for the stated budget; see risk #8 for the scaling ceiling this doesn't currently name. |
| Turborepo | **Marginal at 3 apps — keep anyway, but for a different reason than stated** | Its caching/parallelization value is speculative with only 3 apps and 5 small packages today. The actual justification is the reusability goal (more apps/variants later), not current build speed — worth being honest that this is a bet on the future, not a present-day necessity. |
| pnpm, argon2id, `@nestjs/throttler`, PgBouncer | **Keep** | All directly justified by specific, named requirements elsewhere in the docs. |
| **`nestjs-zod` (or equivalent)** | **Unverified — flagged, see risk #20** | Proposed without confirming it plays cleanly with `@nestjs/swagger` DTO generation, a documented friction point in that library ecosystem. Spike before committing. |
| **BullMQ** | **Missing from the stated stack, but required** | Needed the moment risks #1-3 are addressed (reservation TTL, background jobs, event queue). Should be added to the confirmed stack table now, not discovered mid-implementation. |
| **Meilisearch/Typesense** | **Missing, recommended addition** | For the search scale-out path in §1 — not needed at launch, but the port should exist so adding it later doesn't require touching Catalog's domain logic. |
| **WhatsApp adapter folder pre-created in Phase 0 structure** | **Remove** | [02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md) scaffolds `infrastructure/whatsapp/` as "future feature, stubbed early," while [05-ROADMAP.md](05-ROADMAP.md) correctly places WhatsApp in the unscoped Phase 9 backlog. Building empty structure for a feature with zero design work done is exactly the kind of premature scaffolding this project's own principles argue against elsewhere. Delete the folder from the Phase 0 structure; add it when Phase 9 actually gets scoped. |

---

# 7. Future Proofing — Imagining 2032

**Decisions likely to age badly:**

1. **Git-clone-per-client reuse.** Fine for a handful of deployments; a
   genuine maintenance-multiplication problem past that — every core bug
   fix has to be manually reconciled across N forks that have likely
   already drifted. If the business signs more than a few client
   deployments, this needs to become either real multi-tenancy (§2) or a
   proper package/plugin-based update mechanism (a "core platform" npm
   package + a thin client-specific overlay repo) — neither of which
   exists in the current plan.
2. **Hardcoded `AdminRole` enum.** The first custom-role request from any
   client is the day this becomes technical debt instead of a design.
3. **`Setting` as untyped JSON.** Sprawls into an ungoverned grab-bag of
   config within a few years without the typed-registry discipline from
   §3 adopted early.
4. **Hardcoded country/currency assumptions.** Brittle the moment any
   deployment sells outside one country/currency — and currently baked
   directly into a schema default value, not just an app-config choice.
5. **Two independently-versioned Next.js codebases**, if the git-clone-
   per-client model is retained — each client fork potentially drifting
   to different framework versions with no update mechanism to keep them
   aligned.
6. **No event/message infrastructure from day one.** The DDD narrative
   already assumes eventing exists; every day it doesn't, more
   direct-synchronous-call code gets written that eventing will later
   have to unwind. This is the textbook shape of debt that's cheap today
   and expensive in three years.
7. **Bare-metal PM2/Nginx ops model.** A reasonable, honest v1 choice for
   budget reasons — but if this platform is genuinely meant to serve many
   enterprise clients over a decade, containerization + real orchestration
   is where the rest of the industry will be, and starting on bare metal
   makes that eventual move a full re-platform rather than an incremental
   step. Not urgent; worth naming so it's a planned migration, not a
   surprise.
8. **CUID primary keys**, if UUIDv7/ULID becomes further entrenched as the
   ecosystem default — low cost to reconsider now, high cost once every FK
   column across every table would need to change type.

**What should change today, before Phase 0 locks:**

1. Explicitly decide multi-instance vs. multi-tenant (§2) — don't let it
   stay an implication.
2. Add event-emitter infrastructure in Phase 0 — cheap now, expensive
   retrofitted onto code already written as direct calls.
3. Add a `StockReservation` entity with `expiresAt`, and a job scheduler
   to sweep it — before Checkout gets built against the wrong assumption.
4. Pull Redis/BullMQ into Phase 0-1 scope, not Phase 3-4.
5. Snapshot shipping-address fields onto `Order` (risk #4) before the
   Orders schema ships anywhere.
6. Normalize the actor-reference inconsistency (risk #5) — it's a
   ten-minute fix in a design doc and a real migration once tables exist.
7. Give Media a port/adapter abstraction alongside Payments/Shipping.
8. Remove the hardcoded `"Iraq"` default and single-currency assumption
   from the schema now, while no data exists to migrate.

---

# 8. Final Architecture Score

| Dimension | Score | Why |
|---|---|---|
| Scalability | **6/10** | Solid foundations (indexing discipline, ISR, ports-and-adapters mindset) but real, named bottlenecks at the top of the stated scale range go unaddressed: search ceiling, checkout lock-across-external-call, single-DB topology with no named ceiling. |
| Maintainability | **7/10** | Clean Architecture + DDD boundaries are genuinely strong and will pay off. Undercut by `Setting`-as-JSON, `Coupon` doing two jobs, an inconsistent actor-reference pattern already present in the schema, and a Checkout service at real risk of god-service sprawl. |
| Performance | **7/10** | The ISR/caching/Redis strategy is unusually thoughtful for a pre-implementation doc set. The checkout-lock-across-payment-call design is a genuine, currently-unaddressed performance risk under real load. |
| Security | **8/10** | The strongest section of the whole set — JWT/RBAC/audit/sanitization/rate-limiting are all concretely specified. Loses points for indefinitely deferring MFA on the platform's highest-privilege accounts. |
| Developer Experience | **7/10** | Strong conventions and a genuinely useful review checklist. Two parallel validation systems bridged by an unverified library, and two full Next.js apps to keep in lockstep, are real, current friction sources. |
| Reusability | **5/10** | The most overclaimed dimension in the whole document set. Strong DDD/context-boundary story on paper; zero tenant scaffolding in the actual schema, a hardcoded role enum, a hardcoded country default, and no swappable Media port. Reusability is currently aspirational prose, not yet schema/code reality — see §2. |
| Deployment | **6/10** | Clear, correct, and honest for the current budget and scale. Explicitly single-VPS/single-DB with no horizontal-scaling story and a git-clone ops model that doesn't extend past a handful of client deployments. |
| Testing | **6/10** | Good strategy on paper — right tools for each layer — but the 80% domain-layer coverage target is stated without a CI-enforcement mechanism, and this is likely a small team; without a hard gate, it risks joining the list of "should" statements that don't survive contact with a deadline. |
| Business Flexibility | **6/10** | Cannot express BOGO/tiered/bundle promotions, has no tax or multi-currency support, and RBAC cannot be customized per client — a real ceiling on how flexible this actually is for a genuinely different future client's business rules, despite the platform being explicitly designed for that purpose. |
| **Overall** | **6.5/10** | A genuinely well-thought-out, unusually rigorous planning package — the cross-document consistency-checking and DDD discipline are well above what most projects do at this stage, and that's worth stating plainly rather than dismissing. But it has accumulated aspirational claims ("reusable," "enterprise-grade") that the concrete schema and API design don't yet back up, plus at least five P0-priority architectural tensions (checkout locking, missing event/job infrastructure, and two concrete schema inconsistencies) that should be resolved *before* Phase 0, not carried into implementation and discovered later. None of this is fatal. This is exactly what a pre-freeze review is supposed to surface. |

**Recommendation: do not freeze yet.** Resolve the five P0 items in §5
first — they're all design decisions, not code, and cheaper to fix on
paper this week than in a migration six months from now. Everything else
in this report can reasonably be scheduled into the roadmap phases where
it becomes relevant, per the priorities assigned above.
