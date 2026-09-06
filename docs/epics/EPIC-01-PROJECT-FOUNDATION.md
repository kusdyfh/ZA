# Epic 1 — Project Foundation — Completion Report

**Status**: Complete. Verified: everything builds, lints, and type-checks
from a clean cache; the API boots against real Postgres/Redis containers
and its health/error/docs endpoints respond correctly.

Scope per the brief: foundation only — no authentication, no database
models, no business logic, no Products, no Orders. Everything below is
scaffolding, tooling, and infra; the first business-logic epic starts
from here.

---

## 1. Files Created

### Root tooling

```
package.json               pnpm-workspace.yaml          turbo.json
.gitignore                 .editorconfig                .nvmrc
.prettierrc.json            .prettierignore               commitlint.config.js
.husky/pre-commit            .husky/commit-msg
.github/workflows/ci.yml
README.md (updated)
```

### `packages/tsconfig` — shared TypeScript bases

`package.json`, `base.json`, `nextjs.json`, `nestjs.json`, `react-library.json`

### `packages/eslint-config` — shared ESLint flat configs

`package.json`, `base.js`, `next.js`, `nestjs.js`, `react-library.js`

### `packages/config` — shared Tailwind preset

`package.json`, `tailwind-preset.js` (the color/typography/radius/shadow
tokens from `docs/09-DESIGN-SYSTEM.md`, as a Tailwind preset)

### `packages/types` — shared TypeScript types

`package.json`, `tsconfig.json`, `eslint.config.js`, and
`src/{api-response,pagination,actor,common,index}.ts` — the response
envelope, pagination shapes, and the `ActorRef`/`ActorType` shape from
`docs/v2/adr/0005-actor-reference-model.md`

### `packages/shared` — framework-agnostic utilities

`package.json`, `tsconfig.json`, `eslint.config.js`, and
`src/{cn,format-currency,format-date,slugify,index}.ts`

### `packages/ui` — shared React components

`package.json`, `tsconfig.json`, `eslint.config.js`, and
`src/{button,input,card,typography,theme-toggle,index}.tsx` — ships as
raw TSX (see §2, Deviation 1)

### `apps/api` — NestJS foundation

`package.json`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`,
`eslint.config.js`, `.env.example`, and:

```
src/main.ts                                    bootstrap: prefix, CORS, validation,
                                                 envelope interceptor, Swagger
src/app.module.ts                                ConfigModule, LoggerModule (pino), HealthModule
src/shared/config/{configuration,env.validation}.ts   typed, Joi-validated env config
src/shared/filters/http-exception.filter.ts        global exception filter → error envelope
src/shared/interceptors/response-envelope.interceptor.ts   success envelope
src/modules/health/{health.module,health.controller}.ts    liveness + readiness
```

### `apps/storefront` — Next.js foundation

`package.json`, `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`,
`eslint.config.js`, `tailwind.config.ts`, `postcss.config.js`,
`.env.example`, and:

```
src/app/layout.tsx          fonts (Fraunces/Inter), theme-init script, header/footer
src/app/page.tsx             minimal real homepage proving the design system connection
src/app/globals.css           Tailwind layers + light/dark surface tokens
src/components/site-header.tsx    brand wordmark + ThemeToggle
src/components/site-footer.tsx     copyright line
```

### `apps/admin` — Next.js foundation

`package.json`, `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`,
`eslint.config.js`, `tailwind.config.ts`, `postcss.config.js`,
`.env.example`, and:

```
src/app/layout.tsx                     fonts, theme-init script
src/app/(dashboard)/layout.tsx           sidebar + topbar chrome
src/app/(dashboard)/page.tsx              minimal real dashboard landing (no fake stats)
src/app/(auth)/layout.tsx                 centered auth shell
src/app/(auth)/login/page.tsx              real, validated login form (no backend wiring — see §2)
src/components/{sidebar,topbar}.tsx        role-ready nav chrome
src/lib/nav-items.ts                       single source of truth for nav entries
src/app/globals.css
```

### `infrastructure/docker`

`docker-compose.yml` (Postgres 16, Redis 7 with AOF, Mailpit), `.env.example`

**Total**: ~95 files, ~9 workspace packages/apps, 0 TODOs, 0 placeholder
stubs — every function present does something real.

---

## 2. Architecture Compliance Report

### Followed exactly as specified

- Monorepo: pnpm workspaces + Turborepo, `apps/*` + `packages/*` — per
  `docs/01-ARCHITECTURE.md` and `docs/02-FOLDER-STRUCTURE.md`.
- NestJS Clean Architecture shape: `shared/` (cross-cutting) +
  `modules/<feature>/` — per `docs/01-ARCHITECTURE.md §2`.
- Response envelope (`{success, data}` / `{success: false, error: {code,
  message, details}}`) — per `docs/04-API-DESIGN.md §1`.
- URI-prefixed API versioning (`/v1/...`), health endpoints excluded from
  the prefix — per `docs/08-API-REVIEW.md §9` and
  `docs/v2/adr/0009-operational-architecture.md`.
- Liveness/readiness as **separate** endpoints — per
  `docs/v2/07-OPERATIONAL-ARCHITECTURE.md` ("Health Checks").
- Structured JSON logging (pino) — per
  `docs/14-DEPLOYMENT.md §7` / `docs/v2/07-OPERATIONAL-ARCHITECTURE.md`.
- OpenAPI/Swagger at `/v1/docs` — per `docs/v2/08-API-REVIEW.md §9`.
- Design tokens (color ramps, type scale, radii, shadows, dark-mode
  `[data-theme="dark"]` selector strategy) — copied verbatim from
  `docs/09-DESIGN-SYSTEM.md` into `packages/config/tailwind-preset.js`.
- Sidebar is role-ready and never links to a module that doesn't exist
  yet — per `docs/09-DESIGN-SYSTEM.md §7` ("a nav item is simply absent").
- `ActorRef`/`ActorType` shared type — per
  `docs/v2/adr/0005-actor-reference-model.md`, ready for the first module
  that needs a polymorphic actor reference.
- Redis provisioned with **AOF enabled**, not default RDB-only — per
  `docs/v2/adr/0009-operational-architecture.md`, even though nothing
  consumes Redis yet (see Deviation 4 below for why it's provisioned at
  all this early).
- Docker services: Postgres, Redis, Mailpit — exactly as the brief listed.
- CI: three separate GitHub Actions jobs (Lint, Type Check, Build
  Verification) — exactly as the brief listed.

### Deviations, each deliberate and disclosed (none are silent)

1. **`packages/ui` ships raw TSX, not a compiled `dist/`.** Originally
   built with `tsc` to CommonJS per the v1 folder-structure doc's general
   "packages build to dist" pattern. This broke Next.js's Server/Client
   Component boundary detection: TypeScript's CJS output inserts a
   `"use strict"` prologue *before* the `'use client'` directive, and
   per the React/Next spec, a directive must be the literal first
   statement to be recognized — so Next silently treated `ThemeToggle`
   as a Server Component, producing `Unsupported Server Component type:
   undefined` at build time. Fix: `packages/ui` now ships its TSX source
   directly (`"main": "./src/index.ts"`), and both Next.js apps add it to
   `transpilePackages` so Next's own SWC pipeline compiles it — this is
   the standard, documented pattern for internal component libraries
   consumed only by Next.js. `packages/shared` and `packages/types` are
   unaffected (no `'use client'`, no JSX) and still build to `dist/`.
2. **Folder names**: the brief's Epic 1 instructions named the storefront
   app `storefront` (v1's architecture doc had called it `web`). Followed
   the brief's explicit naming here — `apps/storefront`, not `apps/web`.
3. **`packages` list**: the brief listed `ui, config, types, eslint-config,
   tsconfig, shared` as six packages, splitting what v1's folder-structure
   doc called a single `packages/config` into three (`config`,
   `eslint-config`, `tsconfig`) — this is the standard Turborepo
   convention (matches Vercel's own reference monorepo layout) and was
   followed as given.
4. **Redis/AOF provisioned in Epic 1, not consumed yet.** `docs/v2/adr/0003`
   (background jobs) and `0009` (operational architecture) call for Redis
   fairly early, and the brief's own Docker requirements list it — it's
   providioned now so the docker-compose shape is right from day one, but
   no BullMQ, no rate-limiter, nothing in `apps/api` connects to it yet.
   `REDIS_URL` is validated as a required env var (so the shape is
   correct) but genuinely unused in code — this is disclosed, not hidden.
5. **No Prisma, no ORM, no database client anywhere** — per the brief's
   explicit exclusion. `DATABASE_URL` is validated as a required env var
   (matching the Postgres container the brief asked for) but nothing
   connects to it. `apps/api/health/ready` currently checks only process
   memory (via Terminus), **not** database/Redis reachability — the full
   readiness check the v2 ops doc specifies needs a DB/Redis client to
   exist first, which is out of scope here by the brief's own rule.
6. **Admin login page has a fully real, validated form (React Hook Form +
   Zod, working show/hide password, disabled-until-valid submit) but its
   submit handler does not call any API.** The brief said "Authentication
   Layout," not "Authentication" — built the layout/route-group shell and
   a genuinely working form component (not a static mockup), stopping
   deliberately short of anything that would constitute implementing
   auth. No mock success/failure state was faked either way.
7. **No test suite set up.** The brief's Backend/Quality sections didn't
   list testing as an Epic 1 deliverable, and adding a trivial
   placeholder test would itself violate the "no placeholder code" rule.
   `docs/15-PROJECT-STANDARDS.md §5`'s testing pyramid applies starting
   with the first epic that has real logic to test.
8. **One ESLint rule disabled**: `@next/next/no-duplicate-head`, from
   `eslint-config-next@14.2.15`'s bundled plugin, calls the legacy
   `context.getAncestors()` API that ESLint 9 removed, crashing the
   linter outright. The rule only ever applied to the Pages Router's
   `_document.js` pattern, which this App-Router-only project never
   uses — disabling it is a correctness fix for an inapplicable, broken
   rule, not a suppressed real finding.

### Nothing else was redesigned

No decision from `docs/v2` (frozen) or `docs/product` (approved) was
revisited. Where something in those documents turned out to need a small
technical resolution not spelled out at the planning level (module system
for internal packages, exact ESLint rule set, health-check granularity
given the Epic 1 scope boundary), the choice is recorded above rather than
made silently.

---

## 3. Commands to Start the Project

```bash
# from the repo root
pnpm install
pnpm docker:up
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev
```

| App | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Admin | http://localhost:3001 (dashboard at `/`, login at `/login`) |
| API | http://localhost:4000/v1 |
| API health | http://localhost:4000/health, `/health/ready` |
| API docs | http://localhost:4000/v1/docs |
| Mailpit | http://localhost:8025 |

Verification commands (all pass clean from a cold cache as of this
report): `pnpm build`, `pnpm lint`, `pnpm type-check`.

---

## 4. Requires Manual Configuration / Attention

- **Port 5432 conflict on this machine specifically**: this dev machine
  already has an unrelated project's Postgres container bound to host
  port 5432. `infrastructure/docker/docker-compose.yml` supports a
  `POSTGRES_PORT` override (via `infrastructure/docker/.env`) for exactly
  this situation — not a defect in this project, just something to set
  if `pnpm docker:up` reports a port-allocation error here.
- **Google Fonts network access**: `next/font/google` (Fraunces, Inter)
  downloads font files at build time. If a future deployment environment
  has no outbound internet access during build, this needs revisiting
  (self-hosted font files) — not an issue in normal environments.
- **`nestjs-zod` / Zod↔class-validator bridge**: `docs/v2/08-API-REVIEW.md
  §6` and `docs/v2/11-FREEZE-CHECKLIST.md` flagged this as an open spike.
  Epic 1 uses NestJS's standard `class-validator`-based `ValidationPipe`
  as the safe default (no DTOs exist yet to validate). Whoever picks up
  the first real endpoint should resolve the spike then, not inherit the
  choice by default.
- **MFA for Super Admin/Manager** (`docs/01-ARCHITECTURE.md §4`,
  `docs/v2/adr/0009`): not addressed — no auth exists yet. Flagging so
  it isn't forgotten once the Authentication epic starts.
- **`eslint-config-next` vs. ESLint 9**: the peer-dependency warning
  (`eslint-config-next@14.2.15` officially wants ESLint 7/8) is cosmetic
  today (one rule disabled per Deviation 8 above), but a future
  `eslint-config-next` upgrade may resolve it properly — worth revisiting
  rather than assuming the one disabled rule is permanent.
- **`git commit`**: nothing in this epic has been committed. All ~95 files
  are new/untracked in the working tree, ready for review before the
  first commit.
