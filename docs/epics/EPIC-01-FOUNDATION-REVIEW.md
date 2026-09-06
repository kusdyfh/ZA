# Epic 1 — Final Foundation Review

**Purpose**: an adversarial internal engineering review of everything
implemented in Epic 1, before it freezes. Review only — no new
functionality was introduced. Two real defects were found and fixed
during this pass (both below); everything else is classified as
reviewed-and-healthy, or explicitly deferred technical debt.

**Verification method**: not just re-reading code. The storefront was
run live in a browser for this review, which is how the one genuine
runtime bug (hydration warning) was actually caught — a code-only review
would have missed it, since `pnpm build` and `pnpm type-check` both pass
regardless of it. `pnpm turbo run build lint type-check` was re-run
clean (17/17, fully cached) after every fix in this report.

---

## Critical Issues

**None outstanding.** One was found and fixed during this review:

- **Hydration warning on `<html data-theme>`** — the theme-init inline
  script (per `docs/09-DESIGN-SYSTEM.md §10`) sets `data-theme` on
  `<html>` before React hydrates, so the client's first paint always
  disagrees with the server-rendered markup on that one attribute. React
  logged this as `Warning: Extra attributes from the server: data-theme`
  on every single page load. This is the textbook case
  `suppressHydrationWarning` exists for (the same pattern `next-themes`
  and every other early-theme-application library uses) — not present in
  either app's root layout. **Fixed**: added to both
  `apps/storefront/src/app/layout.tsx` and
  `apps/admin/src/app/layout.tsx`. Verified clean in a fresh browser tab
  (the warning doesn't recur) after the fix.

## Warnings

**None outstanding.** Two were found and fixed:

- **Theme-init script duplicated verbatim** between the two apps'
  `layout.tsx` files — identical ~7-line inline script, hand-copied. Real
  drift risk: a future fix or change to the theme-detection logic in one
  app silently not applying to the other. **Fixed**: extracted to
  `packages/ui/src/theme-init-script.tsx` (`<ThemeInitScript />`), now
  imported by both. One source of truth.
- **CI workflow carried unused, inaccurately-justified env vars** —
  `DATABASE_URL`/`REDIS_URL` were set at the workflow level with a
  comment claiming they were needed for "lint/type-check/build." That's
  wrong: `nest build` is pure `tsc` compilation and never executes
  `main.ts`; `next build`'s prerendering doesn't read either variable
  either (no code references them). The comment was actively misleading
  about what the pipeline does. **Fixed**: removed the unused `env:`
  block from `.github/workflows/ci.yml` entirely — CI now only carries
  what it actually needs. A future epic that adds e2e/integration tests
  to CI will introduce these with an accurate justification then.

## Minor Improvements

- **No shared editor-tooling recommendation** existed for contributors
  (ESLint/Prettier/Tailwind IntelliSense are all in active use, but
  nothing told a new contributor to install them). **Fixed**: added
  `.vscode/extensions.json` (already correctly un-ignored by the
  existing `.gitignore` pattern — `.vscode/*` is ignored,
  `!.vscode/extensions.json` was already carved out).

## Technical Debt (deliberately not fixed — reviewed and disclosed)

- **CI installs dependencies independently in all 3 jobs** (Lint, Type
  Check, Build), each running its own `pnpm install --frozen-lockfile`
  with no cross-job artifact/cache sharing and no Turborepo remote
  caching configured. Correct, but roughly 3× the install cost of a
  single shared-install pipeline. Not fixed here: setting up remote
  caching or an install-once/reuse-artifacts pipeline is closer to new
  CI functionality than a defect fix, and today's install time (~15-20s)
  doesn't yet justify the added pipeline complexity. Revisit once CI
  duration is actually felt as a problem.
- **`tailwind.config.ts` is near-identical between the two Next.js
  apps** (~10 lines: same preset import, same content globs). Not
  extracted into a shared factory — abstracting two small, nearly-but-
  not-exactly-identical configs (each app's `content` glob differs
  slightly by directory) would be the kind of premature abstraction this
  project's own standards
  (`docs/15-PROJECT-STANDARDS.md`) argue against. Revisit if a third
  Next.js app is ever added.
- **`/health/ready` checks process memory only**, not database/Redis
  reachability — correctly impossible to do more today, since no
  Prisma or Redis client exists yet by this epic's own scope boundary.
  Carried forward from the Epic 1 completion report, not new.
- **No test suite** — same reasoning as the completion report: nothing
  exists yet worth testing, and a placeholder test would itself be
  exactly the kind of dead weight this review is checking for.
- **A future consuming app must remember to add `@za/ui` to its own
  `transpilePackages`** array, or it will silently reproduce the
  `Unsupported Server Component type: undefined` bug this epic already
  fixed once. This is documented at the point of use (a comment in each
  `next.config.mjs`) but has no repo-wide enforcement (e.g., a lint rule
  or a shared Next.js config factory that bakes this in automatically).
  Worth solving properly if/when a third Next.js app is added — at two
  apps, a code comment at the point of use is proportionate.
- Everything already disclosed in
  [EPIC-01-PROJECT-FOUNDATION.md §2 and §4](EPIC-01-PROJECT-FOUNDATION.md)
  (nestjs-zod spike, MFA, apps/worker, Prisma/Redis clients, security
  headers at the Nginx layer) still stands — not re-litigated here.

---

## Review by Category

**Folder structure** — Consistent with `docs/02-FOLDER-STRUCTURE.md`'s
intent throughout; every app/package follows the same
`src/` + config-files-at-root shape. No stray files, no orphaned
directories.

**Naming consistency** — `@za/*` package scope used uniformly. Files
kebab-case, components PascalCase, hooks/utilities camelCase — checked
across all ~40 source files, no exceptions found.

**Code duplication** — Two real instances found, both fixed (above).
Everything else that looks similar across files (per-package
`eslint.config.js` one-liners, per-package `tsconfig.json` shapes) is the
expected, minimal "each project needs its own entry point" pattern, not
harmful duplication.

**Type safety** — `strict: true` + `noUncheckedIndexedAccess` +
`noImplicitOverride` enforced repo-wide via the shared base tsconfig. No
`any` in any hand-written source file (confirmed by direct grep across
`apps/` and `packages/`, excluding `.next/types` auto-generated files and
Joi's own library type signature). `no-explicit-any` is `warn`-level in
ESLint, `no-unsafe-enum-comparison` and `no-unnecessary-type-assertion`
are enforced at error level and both caught real issues during Epic 1's
own build (already fixed then).

**Error handling** — Global exception filter covers every thrown error
uniformly; verified live (a 404 correctly returns the
`{success:false, error:{code, message}}` envelope, not a raw NestJS
error page). No unhandled-rejection or uncaught-exception process
handlers exist yet in `main.ts` — acceptable at this scope (nothing async
enough to need one yet); worth adding once background work exists
(worker epic).

**Logging** — Structured JSON via `nestjs-pino`, correlation-friendly,
health-check noise excluded from `autoLogging`. Verified live: readable
`pino-pretty` output in dev, real `context` tagging per module. No
frontend error/logging strategy exists yet — acceptable, no client-side
business logic exists to generate errors worth logging yet.

**Environment handling** — Joi-validated, fail-fast at boot, single
`configuration.ts` namespace, nothing reads `process.env` directly
outside that one file. Frontend `.env.example` files are honestly
minimal and currently unconsumed by any code — consistent, disclosed
pattern (matches how `DATABASE_URL`/`REDIS_URL` are also validated-but-
unused in the API).

**Docker setup** — Postgres/Redis/Mailpit all verified actually running
and healthy in this review (not just written and assumed). Redis
correctly configured with AOF per `docs/v2/adr/0009`. The one real
friction (host port 5432 conflicting with an unrelated project on this
specific machine) is environmental, not a defect in the compose file,
which already supports a `POSTGRES_PORT` override for exactly this case.

**CI** — Three jobs exactly as scoped (Lint, Type Check, Build
Verification). The one real inefficiency (independent installs) is
disclosed as technical debt above, not fixed.

**Developer experience** — `pnpm dev` boots everything; `.env.example`
per app; now has `.vscode/extensions.json`. README's Getting Started
section verified accurate against the actual commands used in this
review.

**Monorepo health** — Checked directly, not assumed: exactly one
resolved copy of React (18.3.1) across the entire tree — no silent
duplicate-React bugs waiting to happen. TypeScript resolves to 5.9.3 for
every one of our own packages; a second, isolated 5.7.2 copy exists only
inside `@nestjs/cli`'s own internal `fork-ts-checker-webpack-plugin`
dependency chain and never touches our actual `tsc`/eslint invocations —
confirmed via `pnpm why`, correct pnpm dependency isolation, not a
problem. Two `eslint@9.39.5` instances differing only by transitive
`jiti` peer version — cosmetic, not a real duplication concern.

**Performance** — Nothing to measure yet at meaningful scale; the
choices already made (ISR-ready structure, Cloudinary remote-pattern
config, font `display: swap`) are the correct foundation-stage defaults
per the frozen architecture docs.

**Security** — No secrets committed (checked: only `.env.example`
templates are tracked). Docker default credentials are clearly dev-only
and gitignored from any real `.env`. No Helmet/security-header
middleware in `apps/api` yet — correctly deferred to the deployment
epic per `docs/14-DEPLOYMENT.md`'s Nginx-layer approach, not a gap in
Epic 1's own scope.

**Future scalability** — `apps/worker` (per `docs/v2/adr/0003`) can be
added later without restructuring anything here. The `packages/ui`
raw-source + `transpilePackages` pattern scales to more consuming apps
with one caveat, disclosed above as technical debt.

---

## Freeze Statement

Two real defects (one critical, one duplication-risk) were found by
actually running the application, not just reading it — both are fixed
and verified. Nothing else rises to "must fix before Epic 2." The
technical debt items above are named, not hidden, and each has a stated
condition for when it should be revisited.

**Epic 1 is frozen as of this report.** Its file set, folder structure,
and configuration are the baseline every later epic builds on. Any
future change to a file listed in
[EPIC-01-PROJECT-FOUNDATION.md §1](EPIC-01-PROJECT-FOUNDATION.md) should
be a deliberate, disclosed decision (an ADR if it's architectural),
not a silent drift — the same discipline already applied to
`docs/v2`.
