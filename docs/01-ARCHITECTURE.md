# ZA Store — System Architecture

## 1. Overview

ZA Store is split into three deployable applications sharing one backend API,
organized as a monorepo:

```
┌─────────────────────┐     ┌─────────────────────┐
│   apps/web           │     │   apps/admin         │
│   Customer Storefront│     │   Admin Dashboard     │
│   Next.js (public)   │     │   Next.js (internal)  │
└──────────┬────────────┘     └──────────┬────────────┘
           │        HTTPS / REST         │
           └──────────────┬───────────────┘
                          ▼
                ┌───────────────────────┐
                │      apps/api          │
                │      NestJS            │
                │  Clean Architecture    │
                └──────────┬────────────┘
                          ▼
                ┌───────────────────────┐
                │     PostgreSQL          │
                │     (via Prisma)        │
                └───────────────────────┘
                          │
                          ▼
                ┌───────────────────────┐
                │      Cloudinary         │
                │  (images / video)       │
                └───────────────────────┘
```

**Why two frontend apps instead of one?**

- The storefront is public, SEO-critical, and must ship the smallest possible
  bundle — it should never load admin-only code, icons, or dashboard chart
  libraries.
- The admin dashboard has entirely different UX needs (dense tables, charts,
  bulk actions) and a different auth surface (staff RBAC vs. customer
  accounts).
- Splitting them lets each be deployed, scaled, and cached independently
  (the storefront benefits from aggressive ISR/CDN caching; the admin app
  is always dynamic/authenticated and never needs to be).
- Both still share design tokens and primitive components via `packages/ui`.

**Why one shared API instead of two?**

- Business logic (pricing, stock deduction, RBAC, coupon validation) must
  exist in exactly one place. Splitting the API by frontend would duplicate
  domain logic and risk divergence.
- Route-level guards (`@Roles()`, `@Public()`) separate customer-facing
  endpoints from admin-facing ones inside the same NestJS app.

## 2. Backend: Clean Architecture in NestJS

Every feature module is internally layered so that business rules never
depend on framework or infrastructure details:

```
apps/api/src/modules/<feature>/
├── domain/            # Entities, value objects, domain errors, repository interfaces (ports)
├── application/        # Use-cases (services), DTOs, mappers — orchestrates domain + ports
├── infrastructure/      # Prisma repository implementations, external adapters (Cloudinary, WhatsApp)
└── interface/          # NestJS controllers, REST DTOs (request/response), guards, decorators
```

Dependency rule: `interface → application → domain`, and
`infrastructure → domain` (implements the domain's repository interfaces).
Nothing in `domain/` imports from Nest, Prisma, or any framework package.
This is what makes the domain layer unit-testable without a database and
lets us swap Prisma or Cloudinary later without touching business rules.

Example — Products module:

```
modules/products/
├── domain/
│   ├── entities/product.entity.ts
│   ├── entities/product-variant.entity.ts
│   ├── repositories/product.repository.interface.ts   # port
│   └── errors/product-not-found.error.ts
├── application/
│   ├── use-cases/create-product.use-case.ts
│   ├── use-cases/update-stock.use-case.ts
│   ├── use-cases/list-products.use-case.ts
│   └── dto/product.dto.ts
├── infrastructure/
│   ├── prisma-product.repository.ts                    # implements the port
│   └── cloudinary-media.adapter.ts
└── interface/
    ├── products.controller.ts
    ├── admin-products.controller.ts
    └── dto/create-product.request.dto.ts
```

Cross-cutting concerns (auth guards, RBAC decorators, exception filters,
logging interceptor, validation pipe) live in `apps/api/src/shared/` and are
wired globally in `main.ts` / `app.module.ts`.

## 3. Frontend Architecture (Next.js — both apps)

- **App Router**, Server Components by default. Client Components (`"use client"`)
  are reserved for interactivity: cart drawer, filters, forms, carousels,
  wishlist toggle.
- **Feature-based structure** mirrors the backend's module boundaries
  (`features/products`, `features/cart`, `features/checkout`, ...).
- **Data fetching**:
  - SEO-critical pages (PLP, PDP, homepage, blog) fetch directly from the API
    in Server Components for full SSR/ISR — no client-side waterfall for
    first paint.
  - Interactive/authenticated data (cart, wishlist, account, admin tables)
    uses **React Query** on the client for caching, optimistic updates, and
    background refetch.
- **Forms**: React Hook Form + Zod resolvers. Validation schemas are shared
  between frontend and backend via `packages/validation` so a checkout form
  and its NestJS DTO can never drift.
- **Styling**: Tailwind CSS with a ZA Store design-token theme (see
  `packages/ui/tokens` — pink palette, soft shadows, rounded-soft radii,
  serif/sans type pairing) extended per-app (storefront = full brand theme,
  admin = neutral/dense theme reusing the same primitives).
- **Motion**: Framer Motion for page transitions, hover states, drawer/modal
  choreography — used sparingly to keep the "soft luxury" feel, not gratuitous.

## 4. Authentication & RBAC

Two independent identity domains, one JWT strategy shape:

| | Customers (`apps/web`) | Staff (`apps/admin`) |
|---|---|---|
| Table | `Customer` | `AdminUser` |
| Roles | none (single role) | `SUPER_ADMIN`, `MANAGER`, `WAREHOUSE`, `SALES`, `CUSTOMER_SUPPORT` |
| Access token | 15 min, JWT, `aud: customer` | 15 min, JWT, `aud: admin` |
| Refresh token | httpOnly, `Secure`, `SameSite=Strict` cookie, 30 days, rotated on use | httpOnly cookie, 7 days, rotated on use |
| Storage | `RefreshToken` table (hashed, revocable, device/IP metadata) | same table, `userType` discriminator |

- Refresh rotation: every refresh issues a new token and invalidates the old
  one; reuse of an already-rotated token revokes the entire session family
  (breach detection).
- RBAC is enforced with a `@Roles(...)` decorator + `RolesGuard` reading the
  JWT's role claim — never trust a client-sent role. A `@Permissions(...)`
  layer on top of roles allows finer-grained checks (e.g. Sales can view
  orders but not issue refunds) — see the permission matrix in
  [05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix).
- Customer endpoints never accept an admin token and vice versa (checked via
  the `aud` claim), even though both are signed with environment-scoped
  secrets.

### RBAC — Role Responsibilities

| Role | Responsibility |
|---|---|
| Super Admin | Full access: settings, users, RBAC, financial data, all modules |
| Manager | Catalog, orders, coupons, discounts, reviews, dashboard analytics — no user/role management |
| Warehouse | Inventory, stock levels, goods receiving, low-stock alerts, order packing/shipping status |
| Sales | Orders, customers, coupons (read/apply), customer support tools |
| Customer Support | Orders (read + status notes), customers, reviews moderation — no pricing/inventory edit |

## 5. Security

- **Transport**: HTTPS everywhere (terminated at Nginx), HSTS.
- **Validation**: `class-validator`/`class-transformer` DTOs at the NestJS
  boundary; Zod schemas at the frontend boundary — both generated from the
  same shared source of truth where practical.
- **Sanitization**: rich-text description fields (product long description,
  blog body) sanitized server-side before persistence (allow-list HTML).
- **Rate limiting**: `@nestjs/throttler` — stricter limits on
  `/auth/login`, `/auth/refresh`, coupon-apply, and review submission.
- **CORS**: locked to the two known frontend origins per environment.
- **Secrets**: JWT secrets, DB credentials, Cloudinary keys via environment
  variables only, never committed; separate secrets per environment.
- **Audit Log**: every mutating admin action (product edit, order status
  change, coupon creation, role change) writes an `AuditLog` row —
  actor, action, entity, before/after diff, timestamp, IP.
- **Password storage**: argon2id (customer + admin), never bcrypt-only.
- **File uploads**: signed, scoped Cloudinary upload presets; no arbitrary
  file proxying through the API.

## 6. Performance

- **Server Components + streaming** for PLP/PDP first paint.
- **ISR** (Incremental Static Regeneration) for product/category/blog pages,
  revalidated on admin publish via on-demand revalidation webhook from the
  API to the storefront.
- **Cloudinary** responsive transformations (`f_auto,q_auto`, srcset) —
  no unoptimized images ever served.
- **React Query** cache + stale-while-revalidate for cart/wishlist/account.
- **Database**: indexed foreign keys, composite indexes on
  `(categoryId, status)`, `(slug)`, full-text search index (Postgres
  `tsvector`) on product name/description for search-as-you-type.
- **CDN-ready**: static assets and Cloudinary media served from edge;
  Nginx configured with long-lived cache headers for `_next/static`.

## 7. Deployment Topology (Hostinger VPS)

```
Internet
   │
   ▼
 Nginx  (reverse proxy, TLS termination, gzip/brotli)
   ├── zastore.com          → apps/web    (PM2: za-web,   port 3000)
   ├── admin.zastore.com    → apps/admin  (PM2: za-admin, port 3001)
   └── api.zastore.com      → apps/api    (PM2: za-api,   port 4000)
                                     │
                                     ▼
                              PostgreSQL (local or managed)
```

- **PM2** manages all three Node processes (`ecosystem.config.js` at repo
  root), with `pm2 startup` + `pm2 save` for reboot persistence, and
  `pm2 reload` for zero-downtime deploys.
- **Nginx** is the single public entry point; each subdomain proxies to its
  app's local port. Admin subdomain additionally IP-allowlisted or protected
  by a Basic Auth pre-gate as defense-in-depth on top of application RBAC.
- **Database backups**: nightly `pg_dump` to off-VPS storage (Cloudinary or
  object storage), retained 30 days.
- **CI**: build + typecheck + lint + test on push; deploy is a manual or
  tag-triggered SSH pull + `pm2 reload` (details finalized in the roadmap's
  DevOps phase, not before core features exist).

## 8. Why this stack, specifically

- **NestJS over raw Express**: first-class DI, module boundaries, guards,
  pipes, interceptors map directly onto Clean Architecture and RBAC needs
  without hand-rolled plumbing.
- **Prisma**: type-safe queries generated from one schema — the schema
  itself becomes the living source of truth for the data model (see
  [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)).
- **Next.js App Router**: Server Components give SEO-critical pages
  real SSR without a separate SSR server to operate, and ISR removes the
  need for a full static-site rebuild pipeline.
- **Cloudinary over local/S3-only storage**: on-the-fly image
  transformation (crops, responsive variants, video) fits a
  photography-heavy premium brand better than serving raw uploads.
