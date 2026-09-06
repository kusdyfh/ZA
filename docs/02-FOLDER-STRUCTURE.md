# ZA Store — Folder Structure

Monorepo managed with **pnpm workspaces + Turborepo** (fast incremental
builds/caching across `apps/*` and `packages/*`, shared task pipeline for
lint/build/test/typecheck).

## 1. Top level

```
za-store/
├── apps/
│   ├── web/            # Customer storefront — Next.js
│   ├── admin/          # Admin dashboard — Next.js
│   └── api/             # Backend — NestJS
├── packages/
│   ├── ui/               # Shared design system (tokens, primitives)
│   ├── validation/        # Shared Zod schemas (frontend) mirrored by NestJS DTOs
│   ├── types/             # Shared TypeScript types/enums (OrderStatus, Role, ...)
│   ├── config/            # Shared eslint, tsconfig, tailwind, prettier config
│   └── utils/             # Shared pure utils (currency, date, slugify)
├── infrastructure/
│   ├── nginx/             # Nginx site configs per subdomain
│   ├── pm2/                # ecosystem.config.js
│   └── docker/             # docker-compose for local Postgres (dev only)
├── docs/                  # This planning documentation
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 2. `apps/api` (NestJS — Clean Architecture)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── shared/
│   │   ├── guards/                 # JwtAuthGuard, RolesGuard, PermissionsGuard
│   │   ├── decorators/             # @Roles, @Permissions, @Public, @CurrentUser
│   │   ├── filters/                 # HttpExceptionFilter (standard error envelope)
│   │   ├── interceptors/            # LoggingInterceptor, ResponseEnvelopeInterceptor
│   │   ├── pipes/                   # ZodValidationPipe / class-validator config
│   │   └── pagination/              # Shared pagination DTO + helper
│   ├── infrastructure/
│   │   ├── prisma/                  # PrismaService, PrismaModule
│   │   ├── cloudinary/               # CloudinaryModule (signed uploads, delete)
│   │   ├── whatsapp/                 # WhatsApp adapter (future feature, stubbed early)
│   │   └── mailer/                    # Transactional email adapter
│   └── modules/
│       ├── auth/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── interface/            # /auth/login, /auth/refresh, /auth/logout (customer + admin)
│       ├── admin-users/               # Staff accounts + RBAC management
│       ├── customers/                 # Customer accounts, addresses
│       ├── products/                  # Products, variants, media
│       ├── categories/                 # Hierarchical categories
│       ├── collections/                 # New Arrival, Best Sellers, Sale, curated sets
│       ├── attributes/                  # Colors, sizes, tags, brands
│       ├── search/                       # Full-text search + filters
│       ├── cart/
│       ├── wishlist/
│       ├── orders/                        # Orders, status timeline, admin notes
│       ├── checkout/                       # Order placement orchestration, payment adapter
│       ├── coupons/                         # Coupons + discounts
│       ├── inventory/                        # Stock, stock movements, low-stock alerts
│       ├── reviews/
│       ├── blog/
│       ├── pages/                             # CMS static pages
│       ├── banners/                            # Homepage banners/hero content
│       ├── notifications/                       # Admin notification feed
│       ├── newsletter/
│       ├── dashboard/                            # Analytics/reporting read-models
│       ├── settings/                              # Site settings, SEO defaults
│       └── audit-log/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/                                        # e2e tests
└── package.json
```

Every folder under `modules/<feature>/` follows the same
`domain / application / infrastructure / interface` split described in
[01-ARCHITECTURE.md](01-ARCHITECTURE.md#2-backend-clean-architecture-in-nestjs).
Small support modules (e.g. `attributes`) may collapse `domain` +
`application` into fewer files, but never skip the `interface` boundary.

## 3. `apps/web` (Storefront — Next.js App Router)

```
apps/web/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                     # Homepage
│   │   ├── products/[slug]/page.tsx      # PDP
│   │   ├── category/[slug]/page.tsx       # PLP
│   │   ├── collections/[slug]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── account/                        # Orders, addresses, wishlist, profile
│   │   ├── blog/[slug]/page.tsx
│   │   ├── pages/[slug]/page.tsx            # CMS pages (About, FAQ, Terms)
│   │   └── gift-boxes/page.tsx
│   ├── api/revalidate/route.ts               # On-demand ISR revalidation webhook receiver
│   ├── sitemap.ts
│   ├── robots.ts
│   └── layout.tsx
├── features/
│   ├── products/          # ProductCard, Gallery, VariantPicker, hooks, api client
│   ├── categories/
│   ├── cart/
│   ├── wishlist/
│   ├── checkout/
│   ├── account/
│   ├── reviews/
│   ├── search/
│   ├── blog/
│   └── home/                # Hero, ShopByColor, InstagramGallery, Newsletter sections
├── components/               # Truly generic, non-feature UI (Header, Footer, Nav)
├── lib/
│   ├── api-client.ts          # Typed fetch wrapper (server + client variants)
│   ├── auth/                   # Customer session helpers
│   └── seo.ts                   # Metadata helpers
├── styles/
└── public/
```

## 4. `apps/admin` (Admin Dashboard — Next.js App Router)

```
apps/admin/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                       # Analytics overview
│   │   ├── products/                        # List, create, edit
│   │   ├── categories/
│   │   ├── collections/
│   │   ├── orders/                           # List, detail, status timeline
│   │   ├── customers/
│   │   ├── coupons/
│   │   ├── inventory/                         # Stock, low-stock alerts, movements
│   │   ├── reviews/
│   │   ├── homepage/                           # Banners, homepage section builder
│   │   ├── pages/
│   │   ├── blog/
│   │   ├── notifications/
│   │   ├── users/                               # Staff + RBAC management (Super Admin only)
│   │   └── settings/
│   └── login/page.tsx
├── features/                                     # Mirrors dashboard route groups
├── components/                                     # Tables, charts, filters, modals
├── lib/
│   ├── api-client.ts
│   ├── auth/                                        # Staff session + RBAC-aware route guards
│   └── permissions.ts                                # Client-side capability checks (UI hints only — server is source of truth)
└── public/
```

## 5. `packages/ui`

```
packages/ui/
├── tokens/            # Colors (ZA pink palette), spacing, radii, typography scale
├── primitives/        # Button, Input, Select, Modal, Drawer, Badge, Toast
├── icons/
└── index.ts
```

## 6. Naming & conventions

- Files: `kebab-case`; React components: `PascalCase.tsx`; hooks: `use-*.ts`.
- Each backend module exports exactly one `*.module.ts` and never reaches
  into another module's `domain`/`infrastructure` folders directly — cross-module
  calls go through the other module's exported application service.
- Shared validation lives once in `packages/validation`; NestJS DTOs and
  React Hook Form resolvers both derive from it wherever the shape matches
  (checkout address, product filters, etc.) to avoid drift.
