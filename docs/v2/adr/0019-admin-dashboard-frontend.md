# ADR 0019: Admin Dashboard Frontend — Data Layer, Auth Storage, and Disclosed Backend Gaps

**Status**: Accepted
**Extends**: [ADR 0016](0016-api-layer-conventions.md) (the response envelope/
error shape this app decodes), [ADR 0017](0017-authentication-and-authorization.md)
(the staff JWT this app stores and refreshes).
**Raised during**: Epic 9 (Admin Dashboard) implementation, per the
governance rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

`apps/admin` had only a skeleton going into this epic: a placeholder login
form with no real submit handler, an unguarded dashboard layout, a single
"Dashboard" nav entry, and six presentational components in `@za/ui`
(Button, Card, Input, Heading/Text, ThemeToggle/ThemeInitScript) — no Table,
Badge, Select, Dialog, Toast, or Pagination. No data-fetching library, no
auth/session handling, and no test tooling (component or E2E) existed
anywhere in the repo. This epic must build a working admin UI against the
**already-frozen** API (Epics 1–8) for fifteen named areas, reusing `@za/ui`
and following `docs/09-DESIGN-SYSTEM.md`, without adding any new backend
endpoints.

## Decision

### 1. Data fetching: TanStack Query + a thin fetch wrapper, no code generation

Added `@tanstack/react-query` (nothing like it existed). A single
`apiFetch<T>(path, init)` helper in `src/lib/api/client.ts` calls
`${NEXT_PUBLIC_API_URL}${path}`, attaches `Authorization: Bearer <accessToken>`
when one is present, decodes the response into `@za/types`'s
`ApiResponse<T>` shape, and throws a typed `ApiError` (carrying `code`,
`message`, `status`, `details`) on `success: false` — the exact envelope
Epic 6 (ADR 0016) and every controller since already produce, so no response
transformation beyond unwrapping is needed. One `apiFetch` call per REST
resource (`src/features/<module>/api.ts`), wrapped in `useQuery`/
`useMutation` hooks colocated in the same file. No DTO codegen from the
NestJS source — DTO shapes are hand-transcribed into local TypeScript
interfaces per module (mirroring exactly what Epic 6's controllers return,
verified by reading each DTO file directly), the same manual-mirroring
approach `apps/admin` already used for nothing-yet, and consistent with this
monorepo having no shared OpenAPI-to-TS generation step.

On a 401 with code `UNAUTHORIZED`/`TOKEN_EXPIRED` (an expired access token),
`apiFetch` transparently attempts one `POST /v1/auth/refresh` and retries the
original request once before surfacing the error — the same rotation
contract Epic 7 built (ADR 0017 §2), consumed here for the first time by any
client.

### 2. Auth token storage: `localStorage`, not an httpOnly cookie — a disclosed simplification

The API issues tokens in the response body (`AuthTokensResponseDto`), not as
`Set-Cookie` — there is no backend cookie-session mechanism to consume, and
adding one would be a backend change, out of scope ("Backend and API are
frozen"). Given that constraint, tokens are held in a `localStorage`-backed
`AuthProvider` (`src/lib/auth/auth-context.tsx`): `accessToken`,
`refreshToken`, and the `adminUser` summary (`id, name, email, roleId`) from
the login response, read once on mount and kept in React state thereafter
(state is the source of truth during a session; `localStorage` only survives
reloads). `logout()` calls nothing server-side (no staff session-revoke
endpoint takes a token as a body param outside the authenticated session
itself) and simply clears local storage and redirects to `/login`.

**Disclosed**: this is the standard SPA-without-BFF trade-off — a
successful XSS on the admin origin could read the token from
`localStorage`. Accepted because (a) it matches this app's existing trust
boundary (staff-only, not customer-facing), (b) the access token is
short-lived (15 min, per ADR 0017), and (c) building a same-origin
cookie-issuing BFF proxy would mean either a new backend endpoint or a
Next.js API route reimplementing token handling — both push scope beyond
"use the existing API," which this ADR treats as a hard constraint.

### 3. No client-side permission-based nav hiding — server 403 is the enforcement boundary

`docs/09-DESIGN-SYSTEM.md` §7 describes a role-aware sidebar ("a nav item is
simply absent... a Warehouse account never sees Coupons at all"). Building
that correctly requires knowing the logged-in admin's effective permission
set. The API has no `/auth/me/permissions` endpoint (disclosed in
exploration for this epic); the only way to read a permission set is
`GET /v1/identity/roles/:id/permissions`, which itself requires
`USERS_MANAGE` — a permission most roles don't have. Hardcoding the
`ROLE_DEFINITIONS` role→permission seed mapping client-side was considered
and rejected: it would silently drift the moment the seed data changes,
with no compiler or test to catch it.

**Decision**: the sidebar renders every nav item for every authenticated
admin, unconditionally. Each page's own data fetch is the real permission
check — a `403 FORBIDDEN` response renders a dedicated `<ForbiddenState />`
empty-state component ("You don't have permission to view this — ask an
admin to grant you access") instead of a broken table. This is a strictly
server-enforced boundary (identical security posture to hiding the nav item,
since the API rejects the request either way) with zero risk of the UI
drifting out of sync with the real permission model. Tracked as a disclosed
simplification versus the design doc's stated ideal; a real `/auth/me`
endpoint would allow closing it later without any other change.

### 4. Five backend gaps this UI cannot fully solve — disclosed, not worked around

The API (frozen) is missing list endpoints for three of this epic's fifteen
named areas, and has no backing route at all for one:

- **Collections** — no "list all collections" endpoint exists (a gap
  disclosed since Epic 3A). The Collections page offers Create, plus a
  "manage by ID" flow (paste/lookup a known collection id to edit, toggle
  active, manage its product set, or delete) — there is no table of every
  collection, because the API cannot produce one.
- **Customers** — no "list all customers" endpoint exists (Epic 8 shipped
  only `GET /customers/:id` and `GET /customers/:id/orders`). The Customers
  page is a lookup-by-ID tool, not a browsable directory.
- **Reviews** — only `GET /reviews/pending` exists; there is no endpoint
  for already-approved/rejected reviews. The Reviews page is a moderation
  queue, not a full review history browser.
- **Store Settings** — no Store/Settings controller exists anywhere in the
  API; `Store` is resolved server-side, read-only, from a single seeded
  row. `PERMISSION_KEYS.SETTINGS_MANAGE` is seeded but never enforced by
  any route. This page is a disclosed placeholder ("no backend support
  yet") rather than a fabricated form that would silently fail to persist.
- **Dashboard** — no analytics/stats/summary endpoint exists;
  `PERMISSION_KEYS.ANALYTICS_VIEW` is seeded but unenforced. The Dashboard
  page is composed client-side from existing list endpoints' `meta.total`
  (orders by status, low-stock count, pending-review count) — several
  parallel requests standing in for one aggregate query the backend
  doesn't offer. No customer-count stat exists (no customer list/count
  endpoint at all, see above).

None of these are worked around by adding a backend endpoint (explicitly
out of scope this epic) or by fabricating client-side data. Each is called
out in its own page (a `<Callout>`-style note, not just silence) so a staff
user isn't left wondering why "Collections" has no table.

### 5. Roles/Permissions are read-only; a "Staff" (Admin Users) page is added as their only functional companion

The API's Roles and Permissions controllers are entirely read-only — roles
are fixed/seeded, permissions are a fixed catalog (Epic 2). The only real
mutation in this area is `PATCH /identity/admin-users/:id/role` (reassigning
a role to a staff account). The epic's scope list names "Roles" and
"Permissions" but not "Admin Users"/"Staff" — without a page that calls
this endpoint, Roles would be permanently inert (viewable, never usable).
A "Staff" page (list/create/activate/deactivate/assign-role) is added,
grouped in the sidebar's System section alongside Roles/Permissions, as the
minimum necessary companion to make the named Roles feature actually do
something. This is a deliberate, disclosed scope addition, not scope creep
for its own sake — the same reasoning prior epics used when reusing an
adjacent module's existing capability rather than leaving a named feature
non-functional.

### 6. New shared components added to `@za/ui`, not built locally in `apps/admin`

`docs/09-DESIGN-SYSTEM.md` §7 specifies Table, Badge, Dialog, and Pagination
anatomy but none existed as code. Per this epic's explicit "reuse the shared
UI package" requirement, `Table`/`Badge`/`Select`/`Dialog`/`Toast`/
`Pagination`/`Checkbox`/`Textarea`/`Skeleton` are added to `packages/ui/src/`
(not `apps/admin/src/components/`), even though `apps/admin` is currently
their only consumer — a future storefront admin-adjacent surface (or the
storefront itself, for account pages) can reuse them without duplication.
Existing `Button`/`Card`/`Input`/`Text`/`Heading` were **patched** to add
`dark:` Tailwind classes — they had none before this epic (only
`ThemeToggle` did), a real gap since "Dark Mode" is one of this epic's
explicit requirements and these primitives are used throughout every new
admin page.

### 7. Icon library: `lucide-react`

No icon library existed in the repo. `lucide-react` was added (tree-shakeable,
no runtime CSS, MIT-licensed, a common Next.js/Tailwind pairing) to
`packages/ui` for sidebar/table/action icons. This is the first icon
dependency in the monorepo; a future storefront epic can reuse the same
package rather than introducing a second icon set.

### 8. Testing: `next/jest` + React Testing Library for components, Playwright for E2E — both new to the repo

No component-test or E2E tooling existed anywhere (`apps/api`'s Jest config
targets Node, not a browser DOM). `apps/admin` gets its own `jest.config.js`
built on Next's built-in `next/jest` preset (handles SWC transform and CSS/
font mocks with minimal config) plus `@testing-library/react` and
`jest-environment-jsdom`, wired into the monorepo's existing `turbo run
test` task exactly like every other package's `test` script. Playwright
(`@playwright/test`) is added at the root as a new, separate concern — its
config's `webServer` block starts `apps/admin`'s `next start` (production
build) against `NEXT_PUBLIC_API_URL` pointed at a running `apps/api`
instance with a real, seeded Postgres — the same "needs the real stack up"
precondition every prior epic's `test:integration` already carries, just for
the frontend. `pnpm --filter @za/admin test:e2e` is **not** part of `turbo
run test` (same reasoning as `test:integration` never being part of it) —
it requires infrastructure `turbo run test` can't assume is running.

## Consequences

- `packages/ui` gains real component surface area and its first
  `dark:`-aware primitives; `apps/admin` gains its first real dependency on
  `@tanstack/react-query`, `lucide-react`, and Playwright/RTL — none of
  which existed in this monorepo before this epic.
- Four of the fifteen named admin areas (Collections, Customers, Reviews,
  Store Settings) and the Dashboard are each **functionally constrained by
  a real, disclosed backend gap**, not a frontend shortcut — closing any of
  them requires a future backend epic to add the missing endpoint, which
  this epic's constraints (frozen backend) explicitly forbid doing here.
- The sidebar's "role-aware, item simply absent" ideal (design doc §7) is
  not implemented as specified — every nav item is always visible, and
  per-page 403 handling is the real gate. This is a knowingly weaker (but
  not less secure) version of the spec, trackable via a future `/auth/me`
  endpoint.
- Auth tokens live in `localStorage`, a disclosed XSS-surface trade-off
  accepted for a staff-only SPA without a BFF, consistent with this app's
  existing trust boundary.

## Alternatives Considered

- **Hardcode `ROLE_DEFINITIONS` client-side** for real nav-permission
  gating. Rejected — silent drift risk the moment the backend seed changes,
  with nothing to catch it (§3).
- **Skip Collections/Customers/Reviews/Settings pages entirely** rather than
  build constrained versions. Rejected — the epic explicitly scopes all
  four; a lookup-by-ID/moderation-queue/placeholder page that's honest
  about what the API supports is more useful than no page at all, and
  matches this codebase's established pattern of shipping a narrower,
  disclosed version of a scope item rather than silently dropping it
  (e.g. Epic 8 §2's narrower customer auth).
- **Build a Next.js API-route BFF to set httpOnly cookies.** Rejected —
  effectively reimplements token handling in a second place for a security
  benefit that's marginal for a staff-only tool, and blurs "the backend is
  frozen" by adding server-side logic in the frontend app.
- **SWR instead of TanStack Query.** Either would work; TanStack Query was
  chosen for its richer mutation API (`useMutation` with `onSuccess`
  cache-invalidation) which this epic's many create/edit forms lean on
  heavily.
