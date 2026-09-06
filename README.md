# ZA Store — Premium Feminine Medical Lifestyle Platform

A fully custom, enterprise-grade e-commerce platform for ZA Store — a premium
feminine medical lifestyle brand (scrubs, gift boxes, accessories, stationery)
targeting female medical students, doctors, dentists, nurses, and pharmacists.

This is a from-scratch build with full source ownership. No Shopify, no
WordPress. FIGS (wearfigs.com) is UX inspiration only — the visual identity,
tone, and product taxonomy belong entirely to ZA Store (soft, luxury, cute,
minimal, modern — pink identity, premium packaging).

The platform is designed to be **reusable across future clients**, not a
single-brand one-off: the bounded-context boundaries
([docs/06](docs/06-DDD-BOUNDED-CONTEXTS.md)), the fully-decoupled CMS
context, the swappable Payments/Shipping ports, and the environment-driven
configuration/branding strategy ([docs/14](docs/14-DEPLOYMENT.md#5-environment-variables))
are all deliberate choices in service of that goal — ZA Store is the first
deployment of this platform, not its only one.

## Status

**Planning is frozen; implementation is underway.** Architecture v2 and
Product Specification v1 are approved — all implementation follows them
strictly; see [docs/v2/11-FREEZE-CHECKLIST.md](docs/v2/11-FREEZE-CHECKLIST.md).
**Epic 1 (Project Foundation) is complete**: the monorepo, both frontend
apps, the API skeleton, shared packages, local Docker services, and CI
all exist and build/lint/type-check successfully. No business logic
(auth, products, orders, ...) exists yet — that starts with Epic 2.

Two planning tracks remain the reference for everything built —
**Product Specification** (what the product does, for whom, under what
rules) and **Software Architecture** (how it's technically built). Read
Product Specification first if you're scoping a feature; read
Architecture v2 first if you're about to write code for it.

## Getting Started

**Prerequisites**: Node.js 20.11+ (see `.nvmrc`), pnpm 9.15+, Docker.

```bash
# 1. Install dependencies (workspace-wide)
pnpm install

# 2. Start local infrastructure (Postgres, Redis, Mailpit)
pnpm docker:up

# 3. Create each app's .env from its template and adjust if needed
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# 4. Run everything in dev mode
pnpm dev
```

**`NEXT_PUBLIC_API_URL` must point at whatever port the API is actually
listening on.** The two are set independently and nothing keeps them in
sync automatically — `apps/api/.env`'s `PORT` and each frontend's
`.env.local` `NEXT_PUBLIC_API_URL` are just plain, unrelated env vars. If
you leave every `.env.example` untouched, the defaults already agree
(API on `4000`, both frontends pointing at `http://localhost:4000/v1`)
and you can skip this. But **port 4000 is commonly already taken**
(Docker Desktop's backend process binds it on Windows) — if you change
`PORT` in `apps/api/.env` to work around that, you must also update
`NEXT_PUBLIC_API_URL` in **both** `apps/storefront/.env.local` and
`apps/admin/.env.local` to the same port, e.g. if the API runs on
`4100`:

```
# apps/admin/.env.local (and apps/storefront/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4100/v1
```

Skipping this is easy to miss and doesn't fail loudly: the frontend
still loads, the login form still renders, but the login request goes
to the wrong port and the browser reports it as a **CORS error**
(`No 'Access-Control-Allow-Origin' header...`) even though the API's own
CORS config is correct — a stale/wrong `NEXT_PUBLIC_API_URL` is the
first thing to check whenever a frontend can't reach the API at all.

| App | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/v1 (or your `apps/api/.env`'s `PORT`, if changed — see above) |
| API health | http://localhost:4000/health, /health/ready |
| API docs (Swagger) | http://localhost:4000/v1/docs |
| Mailpit UI | http://localhost:8025 |

Other useful commands: `pnpm build` / `pnpm lint` / `pnpm type-check`
(all run through Turborepo across every app and package),
`pnpm docker:down`, `pnpm format`.

## Project Structure

```
za-store/
├── apps/
│   ├── storefront/     Customer storefront — Next.js (App Router)
│   ├── admin/          Admin dashboard — Next.js (App Router)
│   └── api/             Backend — NestJS
├── packages/
│   ├── ui/               Shared React components (Button, Input, Card, Typography, ThemeToggle)
│   ├── shared/            Framework-agnostic utilities (cn, formatCurrency, formatDate, slugify)
│   ├── types/              Shared TypeScript types (API envelope, pagination, actor reference)
│   ├── config/              Shared Tailwind preset (design tokens from docs/09-DESIGN-SYSTEM.md)
│   ├── eslint-config/         Shared ESLint flat configs (base, Next.js, NestJS, React library)
│   └── tsconfig/               Shared TypeScript base configs
├── infrastructure/
│   └── docker/            docker-compose.yml — local Postgres, Redis, Mailpit
├── docs/                   Product Specification + Architecture (v1 historical, v2 current)
└── .github/workflows/       CI (lint, type-check, build)
```

Every app/package's own `package.json` documents its specific scripts;
this is the shared shape across all of them.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `NODE_ENV`, `PORT`, `API_GLOBAL_PREFIX`, `CORS_ORIGIN`, `LOG_LEVEL` | `apps/api/.env` | API runtime config, validated at boot (see `src/shared/config/env.validation.ts`) — the process refuses to start if one is missing/malformed. |
| `DATABASE_URL`, `REDIS_URL` | `apps/api/.env` | Connection strings for the Postgres/Redis containers `pnpm docker:up` provisions. Not yet consumed by any code in Epic 1 — see the Architecture Compliance Report in the Epic 1 PR/commit for why. |
| `NEXT_PUBLIC_API_URL` | `apps/storefront/.env.local`, `apps/admin/.env.local` | Base URL the frontends call the API on (every login, product fetch, etc. goes through it). **Must match `apps/api/.env`'s `PORT`** — see the Getting Started note above; a mismatch surfaces as a browser CORS error, not an obvious "wrong port" message. |
| `POSTGRES_*`, `REDIS_PORT`, `MAILPIT_*` | `infrastructure/docker/.env` (optional) | Overrides for the local Docker services; defaults in `docker-compose.yml` work out of the box. |

Every `.env.example` is the source of truth for what a given app needs —
copy it, never commit the real `.env`/`.env.local` file (already covered
by `.gitignore`).

## Product Specification (what to build)

Not a technical document — readable by developers, designers, project
managers, QA, and the business owner alike. Every module (Authentication
through Roles & Permissions) is specified with business rules, user
stories, acceptance criteria, edge cases, and more.

- **[docs/product/00-OVERVIEW.md](docs/product/00-OVERVIEW.md)** — start
  here. Full module index and the shared template every module follows.
- `docs/product/01`–`23` — one document per module.
- **[docs/product/24-PRODUCT-BACKLOG.md](docs/product/24-PRODUCT-BACKLOG.md)** —
  prioritized MVP / Phase 2 / Phase 3 / Future Ideas across every module.

## Architecture (how it's built)

**Architecture v2 is current.** The initial architecture (docs 01–15)
went through a critical senior review (doc 16), which found five
must-fix issues and a gap between the "reusable platform" ambition and
what the schema actually supported. **[docs/v2/](docs/v2/00-OVERVIEW.md)
resolves those findings** via Architecture Decision Records rather than
editing the original documents — start there, not at doc 01, to see
where the technical design actually stands today; docs 01–16 remain as
the historical first pass and are referenced by v2's ADRs throughout.

- **[docs/v2/00-OVERVIEW.md](docs/v2/00-OVERVIEW.md)** — start here. Indexes every v2 document and explains how it relates to v1.
- `docs/v2/adr/0001`–`0010` — the actual decisions (inventory reservations, event architecture, background jobs, order snapshots, actor references, SaaS-ready schema, plugins, integrations, operations, developer experience/governance).
- `docs/v2/01`–`12` — full specifications behind each ADR, plus the updated context map, database strategy, event flow diagrams, deployment strategy, migration notes, freeze checklist, and open questions.

## Software Architecture — v1 (historical first pass)

Read in this order:

**Foundation**
1. [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) — system architecture, tech stack rationale, Clean Architecture layering, security & performance model
2. [docs/02-FOLDER-STRUCTURE.md](docs/02-FOLDER-STRUCTURE.md) — monorepo layout down to feature-module level
3. [docs/03-DATABASE-SCHEMA.md](docs/03-DATABASE-SCHEMA.md) — full Prisma schema covering every domain in the brief
4. [docs/04-API-DESIGN.md](docs/04-API-DESIGN.md) — REST API surface, conventions, auth flows
5. [docs/05-ROADMAP.md](docs/05-ROADMAP.md) — phased development roadmap, one feature at a time, plus the RBAC permission matrix

**Technical Specification & Architecture Review**
6. [docs/06-DDD-BOUNDED-CONTEXTS.md](docs/06-DDD-BOUNDED-CONTEXTS.md) — domain-driven design: all bounded contexts, context map, core/supporting/generic classification
7. [docs/07-DATABASE-REVIEW.md](docs/07-DATABASE-REVIEW.md) — schema review (normalization, indexes, constraints, cascades, soft delete, audit, versioning) with concrete fixes
8. [docs/08-API-REVIEW.md](docs/08-API-REVIEW.md) — API review (REST consistency, filtering/sorting/pagination, error codes, rate limiting, idempotency, webhooks)
9. [docs/09-DESIGN-SYSTEM.md](docs/09-DESIGN-SYSTEM.md) — UI design system: tokens, typography, color, components, dark mode, accessibility
10. [docs/10-ADMIN-DASHBOARD-SPEC.md](docs/10-ADMIN-DASHBOARD-SPEC.md) — every admin page specified (purpose, permissions, filters, bulk actions, forms, flow)
11. [docs/11-STOREFRONT-SPEC.md](docs/11-STOREFRONT-SPEC.md) — every customer-facing page specified (layout, sections, API calls, SEO, performance)
12. [docs/12-SECURITY-REVIEW.md](docs/12-SECURITY-REVIEW.md) — threat model, JWT/refresh/CSRF/XSS/SQLi, RBAC, secrets, password policy
13. [docs/13-PERFORMANCE-STRATEGY.md](docs/13-PERFORMANCE-STRATEGY.md) — caching, Redis, ISR policy, image optimization, DB optimization, performance budgets
14. [docs/14-DEPLOYMENT.md](docs/14-DEPLOYMENT.md) — Hostinger VPS, Nginx, PM2, SSL, backups, monitoring, CI/CD, zero-downtime deploys
15. [docs/15-PROJECT-STANDARDS.md](docs/15-PROJECT-STANDARDS.md) — naming, commits, code style, testing strategy, review checklist

**Pre-Freeze Review**
16. [docs/16-SENIOR-ARCHITECTURE-REVIEW.md](docs/16-SENIOR-ARCHITECTURE-REVIEW.md) — critical architecture review: scalability limits, multi-store readiness, maintainability risks, feature gaps, top 25 risks, dependency audit, future-proofing, and final scores. **Read before Phase 0 starts — this identifies 5 P0 issues to resolve first.**

## Tech Stack (confirmed)

| Layer | Choice |
|---|---|
| Storefront | Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, React Query, React Hook Form, Zod |
| Admin Dashboard | Next.js (App Router), same design system primitives |
| Backend API | NestJS, Prisma ORM, PostgreSQL, JWT + Refresh Tokens, RBAC, REST |
| Media Storage | Cloudinary |
| Deployment | Hostinger VPS, PM2, Nginx |

This is the confirmed target stack per the architecture docs, not a
manifest of what's installed today — Epic 1 only installs what project
foundation actually needs (Next.js, Tailwind, NestJS, and so on); pieces
like Framer Motion, React Query, and Prisma are added by whichever later
epic first needs them, not speculatively.

## Roles

Super Admin · Manager · Warehouse · Sales · Customer Support — see the
permission matrix in [docs/05-ROADMAP.md](docs/05-ROADMAP.md#rbac-permission-matrix).
