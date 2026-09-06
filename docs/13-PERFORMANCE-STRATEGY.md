# ZA Store — Performance Strategy

Deepens [01-ARCHITECTURE.md §6](01-ARCHITECTURE.md#6-performance) into a
concrete strategy per layer, with explicit rules for when to reach for
more machinery (Redis, materialized views) rather than reaching for it
by default.

## 1. Rendering Strategy — Server Components, SSR, ISR

- **Server Components by default** in both `apps/web` and `apps/admin` —
  a component is only made a Client Component when it needs interactivity
  (state, effects, event handlers) or a browser-only API.
- **ISR revalidation policy**, made explicit per content type (vague
  "cache it" guidance is how staleness bugs happen):

| Route type | Strategy | Revalidation trigger |
|---|---|---|
| Homepage | ISR | On-demand only (banner/featured-flag publish) — never time-based, it's the highest-value cache on the site |
| PLP (category/collection) | ISR | On-demand (product publish/unpublish in that category) + a 5-minute time-based fallback safety net |
| PDP | ISR | On-demand (publish, price change, in/out-of-stock transition) |
| Blog / static pages | ISR | On-demand only (publish action) |
| Search results | SSR, no cache | Query-dependent, not worth caching per-query in v1 |
| Cart / checkout / account / wishlist / order tracking | No caching (client-side, authenticated) | n/a |

- **On-demand revalidation webhook**: admin publish actions call
  `POST <storefront>/api/revalidate` (per
  [02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md#3-appsweb-storefront--nextjs-app-router)),
  signed with a shared secret. This is what makes ISR safe to use
  aggressively — staleness is bounded by "did the webhook fire," not by a
  fixed timer that's either too short (defeats caching) or too long
  (visibly stale content).

## 2. Caching & Redis

Redis is **introduced in Phase 3-4** (Checkout/Coupons), not Phase 0 — it
solves three specific problems, and is deferred until at least one of them
is real:

1. **Rate limiter store** — `@nestjs/throttler` needs a shared store once
   the API runs as more than one PM2 process (in-memory counters would
   under-count and effectively disable the limit).
2. **Idempotency-key cache** — short-TTL storage for
   `Idempotency-Key` → response pairs (checkout, bulk admin actions).
3. **Hot read-cache** for expensive, low-cardinality queries: dashboard
   summary aggregates, homepage banner/featured-product lists. Cache-aside
   pattern (read cache → miss → query DB → populate cache with a short
   TTL, e.g. 60s), invalidated explicitly on the same publish events that
   trigger ISR revalidation.

**Rule**: Redis is never the source of truth for anything — every cached
value is reconstructable from Postgres. This keeps the platform simple to
reason about and safe to redeploy Redis from scratch at any time.

## 3. Image Optimization

- Cloudinary `f_auto,q_auto` transformation on every served image
  (automatic format — AVIF/WebP where supported — and quality
  negotiation) — never a raw uploaded file served directly.
- Responsive `srcset` generated from Cloudinary's width transformations,
  paired with Next.js `<Image>` for lazy-loading and layout-shift
  prevention (explicit width/height or `fill` with a sized container,
  always).
- Video (product media) served via Cloudinary's adaptive streaming
  transformation, not a raw uploaded video file.

## 4. Code Splitting & Prefetching

- Route-based splitting is automatic under the Next.js App Router — no
  manual action needed for page-level boundaries.
- **Manual `dynamic()` imports** reserved for genuinely heavy, rarely-
  needed-on-first-paint client bundles: the admin dashboard's charting
  library, any future payment-gateway widget/iframe on checkout, the
  Cloudinary upload widget in admin product forms.
- **Prefetching**: Next.js `<Link>` prefetch (default, on-viewport) covers
  storefront navigation; additionally, React Query prefetches a PDP's data
  on `ProductCard` hover/focus from the PLP, so the product page feels
  instant on click for users on a reasonable connection (skipped entirely
  under `prefers-reduced-data`/slow-connection signals if available).

## 5. Database Optimization

- Indexing strategy is specified in
  [07-DATABASE-REVIEW.md §2](07-DATABASE-REVIEW.md#2-indexes) — this
  section covers query-pattern discipline on top of that:
- **Connection pooling**: PgBouncer (transaction mode) in front of
  Postgres once the API runs multiple PM2 instances — Prisma's own
  connection pool is per-process, and without PgBouncer, N processes ×
  Prisma's pool size can exceed Postgres's `max_connections` on a modest
  VPS-sized instance.
- **N+1 avoidance**: Prisma `include`/`select` used deliberately per
  query — a PLP query fetches variants/media/category in one query via
  `include`, never triggers one query per product row. Any admin table
  showing an aggregate across a relation (e.g. order count per customer)
  uses a single grouped query (`groupBy`), not a loop.
- **Materialized views**: deliberately **not** used at launch for
  Analytics (per
  [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#analytics)) —
  live aggregation queries first, promoted to a materialized view (
  refreshed on a schedule or on `OrderStatusChanged`) only if/when the
  dashboard's live queries measurably slow down under real order volume.
  Avoids solving a scale problem that may never arrive.

## 6. Lazy Loading

- Below-the-fold homepage sections (Instagram Gallery, Reviews,
  Newsletter) lazy-mount via intersection observer (paired with the
  entrance animation already specified in
  [09-DESIGN-SYSTEM.md §8](09-DESIGN-SYSTEM.md#8-animation-principles)) —
  one mechanism serves both the animation trigger and the loading
  deferral.
- Admin data tables: virtualized rendering (windowing) for any table that
  can realistically exceed a few hundred rows in production (Orders,
  Audit Log, Customers) — react-virtual or equivalent, so the DOM node
  count stays bounded regardless of result-set size.

## 7. CDN

- Cloudinary's own CDN serves all media — no additional configuration
  needed beyond correct transformation URLs.
- Nginx serves `_next/static` and other build assets with long-lived,
  immutable cache headers (Next.js content-hashes its build output, so
  this is safe by construction).
- **Recommended addition** (see also
  [14-DEPLOYMENT.md](14-DEPLOYMENT.md)): placing Cloudflare (or an
  equivalent edge CDN/WAF) in front of the Hostinger VPS's Nginx — edge-
  caches static/ISR HTML close to users, absorbs a meaningful share of DoS
  attempts before they reach the VPS at all, and costs nothing at ZA
  Store's expected traffic tier on Cloudflare's free plan.

## 8. Performance Budgets

Concrete targets, checked in Roadmap Phase 7
([05-ROADMAP.md](05-ROADMAP.md#phase-7--seo--performance-hardening)):

| Metric | Target (mobile, PDP/PLP/Homepage) |
|---|---|
| Lighthouse Performance | 90+ |
| Lighthouse SEO | 95+ |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |

A budget that isn't measured isn't a budget — these are checked via
Lighthouse CI in the build pipeline (see
[14-DEPLOYMENT.md](14-DEPLOYMENT.md#cicd)), not just spot-checked
manually before launch.
