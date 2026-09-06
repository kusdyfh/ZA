# ZA Store — Development Roadmap

Each phase ships a working, demoable slice — no phase starts before the
previous one is approved. This mirrors how the brief asked for
implementation to proceed: "feature by feature," never all at once.

## Phase 0 — Foundations

Not a customer-visible feature; everything else depends on it.

- Monorepo scaffold: pnpm workspaces + Turborepo, `packages/config`
  (eslint/tsconfig/tailwind/prettier), `packages/types`, `packages/validation`
- `apps/api`: NestJS bootstrap, Prisma + PostgreSQL connection, global
  exception filter + response envelope interceptor, health check endpoint
- Auth: `AdminUser` + `Customer` models, JWT + refresh token rotation,
  `RolesGuard`, `@Roles()` decorator — no business modules yet, just the
  identity skeleton
- `apps/web` and `apps/admin`: Next.js scaffolds, shared `packages/ui`
  design tokens (ZA pink palette, type scale, spacing/radii), base layout
  shells, login pages
- CI: lint + typecheck + build on push

**Exit criteria**: a Super Admin can log into `apps/admin`, a seeded
customer can log into `apps/web`; both apps deploy to the VPS via PM2 +
Nginx per [01-ARCHITECTURE.md §7](01-ARCHITECTURE.md#7-deployment-topology-hostinger-vps).

## Phase 1 — Product Catalog

- Backend: `categories`, `brands`, `attributes` (color/size/tag), `products`,
  `product-variants`, `product-media` (Cloudinary signed upload flow)
- Admin: full product CRUD (with variants + media + SEO fields), category
  tree management
- Storefront: homepage shell (Hero, Categories, New Collection, Best
  Sellers sections wired to real data), PLP with filters, PDP with
  variant picker and gallery
- Search: Postgres full-text index + `/search` endpoint and UI

**Exit criteria**: the full catalog can be authored in admin and browsed,
filtered, and searched on the storefront.

## Phase 2 — Cart, Wishlist & Customer Accounts

- Backend: `cart` (guest + customer, merge-on-login), `wishlist`,
  customer profile/address CRUD
- Storefront: cart drawer, wishlist page, account profile + address book
- Admin: read-only customer list/detail (order history comes in Phase 3)

**Exit criteria**: a visitor can browse as a guest, build a cart, create an
account, and have the guest cart merge in on login.

## Phase 3 — Checkout & Orders

- Backend: `coupons` (validation only — full admin CRUD in Phase 4),
  `checkout` orchestration (stock lock, order creation, `StockMovement`
  ledger), `orders` (status timeline, notes), order-number generation
- Storefront: checkout flow (address, shipping, payment method, review),
  order confirmation, order history + tracking page
- Admin: order list/detail, status transitions (with the 8-state flow from
  the brief), internal notes, payment status
- Notifications: "new order" admin notification wired end-to-end (this is
  the first real use of the `notifications` module — proves the pattern
  before Phase 6 builds the full feed)

**Exit criteria**: a customer can place a real order end-to-end and an
admin can process it through every status to Delivered (or Cancelled/
Returned).

## Phase 4 — Coupons & Discounts

- Backend: full `coupons` CRUD (percentage/fixed, usage limits, expiry,
  min order amount, product/category scoping), `CouponUsage` tracking
- Storefront: apply-coupon UI at cart/checkout with live discount preview
- Admin: coupon management UI, usage reporting

**Exit criteria**: every coupon rule in the brief is enforceable and
visible in admin reporting.

## Phase 5 — Reviews & Content

- Backend: `reviews` (submit + moderate), `blog`, `pages`, `banners`,
  `newsletter`
- Storefront: product reviews (submit + display), blog, static pages
  (About/FAQ/Terms), Instagram gallery section, newsletter signup, homepage
  banner rendering
- Admin: review moderation queue, blog editor, page editor, homepage
  banner/section builder

**Exit criteria**: the full homepage from the brief (Hero, Categories, New
Collection, Best Sellers, Shop By Color, Gift Boxes, Instagram Gallery,
Reviews, Newsletter, Footer) is real, admin-editable content — not
hardcoded.

## Phase 6 — Admin Dashboard & Notifications

- Backend: `dashboard` read-models (revenue, orders, customers, products,
  top-sellers, monthly stats), full `notifications` feed (low stock, new
  review, coupon expiring — new order already exists from Phase 3)
- Admin: analytics dashboard with charts, full notification center

**Exit criteria**: Super Admin/Manager have a real operating dashboard, not
placeholder charts.

## Phase 7 — SEO & Performance Hardening

- Meta title/description/OG on every content type (already schema-ready
  from Phase 1–5 — this phase wires them into `<head>` rendering,
  `sitemap.ts`, `robots.ts`, and JSON-LD structured data for products)
- ISR + on-demand revalidation webhook (admin publish → storefront
  revalidate) fully wired for every content type
- Image audit (Cloudinary `f_auto,q_auto`, responsive `srcset` everywhere),
  Lighthouse pass on PLP/PDP/homepage

**Exit criteria**: Lighthouse SEO/Performance scores meet an agreed
threshold (target: 90+ on PDP/PLP/homepage, mobile).

## Phase 8 — Security Hardening & Launch Prep

- Rate limiting on auth/coupon/review endpoints, CORS lockdown to
  production origins, audit log review, dependency audit
- Nginx + PM2 production configs finalized, DB backup automation,
  environment secrets audit
- Load test checkout (the one multi-write transaction) under concurrent
  stock contention

**Exit criteria**: sign-off checklist complete, ready for public launch.

## Phase 9 — Future (post-launch backlog, not scoped yet)

- Gift Box Builder (interactive box composer)
- Reward Points
- Referral System
- Push Notifications
- WhatsApp Integration (order updates, support)

These are intentionally unscheduled — they get their own design pass once
the core platform is live and real usage data exists to inform them.

---

## RBAC Permission Matrix

| Module | Super Admin | Manager | Warehouse | Sales | Customer Support |
|---|:---:|:---:|:---:|:---:|:---:|
| Products / Categories / Collections | Full | Full | Read | Read | Read |
| Inventory / Stock Adjustments | Full | Read | Full | Read | — |
| Orders — view | Full | Full | Read (packing view) | Full | Full |
| Orders — status/fulfillment | Full | Full | Full (pack/ship) | Full | Notes only |
| Orders — refund/cancel | Full | Full | — | Read | — |
| Customers | Full | Full | — | Full | Full |
| Coupons / Discounts | Full | Full | — | Read/Apply | — |
| Reviews (moderate) | Full | Full | — | — | Full |
| Homepage / Banners / Blog / Pages | Full | Full | — | — | — |
| Notifications | Full | Full | Full (low-stock only) | Full (orders only) | Full (reviews/orders) |
| Dashboard / Analytics | Full | Full | Inventory KPIs only | Sales KPIs only | — |
| Staff Users / RBAC | Full | — | — | — | — |
| Settings | Full | — | — | — | — |
| Audit Log | Full | Read | — | — | — |

This matrix is enforced server-side via `@Roles()`/`@Permissions()` guards
per [01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac) —
the admin UI hides controls a role can't use, but the API is the actual
gate.
