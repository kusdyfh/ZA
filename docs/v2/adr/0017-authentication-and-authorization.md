# ADR 0017: Authentication & Authorization — JWT, Refresh Rotation, Sessions, RBAC Enforcement

**Status**: Accepted
**Extends**: [ADR 0016](0016-api-layer-conventions.md) §2 (the `TemporaryAdminGuard`
this epic replaces) and [docs/product/01-AUTHENTICATION.md](../../product/01-AUTHENTICATION.md).
**Raised during**: Epic 7 (Authentication & Authorization) implementation,
per the governance rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Every prior epic's controllers were guarded by `TemporaryAdminGuard` — a
disclosed placeholder (ADR 0016 §2) that trusted a raw `AdminUser.id` in
an `x-admin-user-id` header, performed no permission check, and was
explicitly documented as "must be replaced wholesale... by the epic that
adds real Login/JWT." This epic is that epic. It reuses the Identity
module built in Epic 2 (`AdminUser`, `Role`, `Permission`,
`PasswordHasher`/`Argon2PasswordHasher`, `AuthorizationService`,
`CheckPermissionUseCase`, `PasswordPolicy`) rather than rebuilding any of
it — Epic 2's own doc comments already anticipated this ("the use-case a
future NestJS guard will call once Login/JWT exist").

`docs/product/01-AUTHENTICATION.md` describes both customer and staff
authentication, including MFA for Super Admin/Manager, email-based
account-lockout alerts, and customer self-registration. Customer
accounts don't exist yet (Epic 5's guest-only Cart/Order, per
[ADR 0015](0015-guest-checkout-and-minimal-order-dependencies.md) §1 and
PROJECT_STATUS.md's disclosed gap #9), and no Notifications epic exists
to send any email at all. This epic is scoped to **staff
(`AdminUser`) authentication only** — the half of the product spec that
actually has a real HTTP surface to protect (Epic 6). Customer
authentication, MFA, and email-based alerts are explicitly deferred; see
Consequences.

## Decision

### 1. Access + refresh tokens, verified against a live `AdminUser` row on every request

Two token types, both signed HS256 JWTs with independent secrets
(`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — new required env vars):

- **Access token** (15 minutes): payload is just `{ sub: adminUserId,
  type: 'access' }`. It deliberately carries no `roleId`/permission
  claims — every authorization decision re-reads the admin's current
  role from Postgres (via `CheckPermissionUseCase`, unchanged from
  Epic 2), so a role change or deactivation takes effect on the admin's
  very next request, exactly matching
  docs/product/01-AUTHENTICATION.md's stated rule ("their permissions
  update on their next action, without requiring a fresh login" /
  "deactivated... any active session is ended on their next action").
  `JwtAuthGuard` verifies the signature and expiry, then performs the
  same `AdminUserRepository.findById()` + `isActive` check
  `TemporaryAdminGuard` already did — continuity with ADR 0016, and the
  mechanism that makes deactivation immediate rather than "eventually,
  once the access token expires."
- **Refresh token** (7 days): payload is `{ sub: adminUserId, jti,
  familyId, type: 'refresh' }`. Unlike the access token, its `jti` is
  persisted server-side (`RefreshToken` table) so it can be individually
  revoked (logout, password change) and checked for reuse — a signature
  alone can't be un-issued.

### 2. Refresh token rotation with family-based reuse detection

Every `POST /v1/auth/refresh` call: verifies the JWT, looks up its `jti`
in `RefreshToken`. If that row is already `revokedAt`-set, the token has
been used before — a strong signal of a stolen/replayed token — and the
**entire token family** (every `RefreshToken` sharing `familyId`, i.e.
every token descended from the same original login) is revoked
immediately, forcing a fresh login on every device sharing that family.
Otherwise the presented token is marked revoked, a new token is issued
into the same family, and `replacedByJti` records the chain for audit.
`familyId` is generated fresh only at login; every rotation within a
session keeps the same `familyId`. This is the standard
rotation-with-reuse-detection pattern (used by, e.g., Auth0's refresh
token rotation) — chosen over "no rotation" because a stolen refresh
token would otherwise be valid, undetected, for its full 7-day lifetime.

### 3. Session management: a "session" is a refresh-token row

`GET /v1/auth/sessions` lists an admin's own active (non-revoked,
non-expired) `RefreshToken` rows (device/IP/`userAgent`/timestamps, no
raw token or `jti` exposed); `DELETE /v1/auth/sessions/:id` revokes one.
`POST /v1/auth/logout` revokes the caller's current session (the refresh
token it's given). There is no admin-revokes-another-admin's-session
moderation feature — self-service only, matching every other new
`auth/*` endpoint in this epic; see Consequences.

### 4. Password change and reset both revoke every existing session

`POST /v1/auth/change-password` (authenticated, requires the current
password) and the reset flow (`POST /v1/auth/request-password-reset` →
`POST /v1/auth/reset-password`, both `@Public()` since a locked-out
admin has no token yet) both revoke **every** `RefreshToken` for that
admin on success — a password change/reset is a significant security
event; forcing re-login everywhere (not just other devices) is simpler
to reason about than partial revocation and matches common practice.
`PasswordResetToken` rows store a SHA-256 hash of the reset token, not
the raw value (unlike `RefreshToken.jti`, which is just a lookup key —
the reset token itself is the bearer secret, so it must not be
recoverable from a database read) and are single-use (`usedAt`) with a
30-minute expiry, per docs/product/01-AUTHENTICATION.md.

**Disclosed gap**: no Notifications epic exists yet, so there is no
email to put the reset link in. `RequestPasswordResetUseCase` always
returns a generic "if that email exists, a reset link has been sent"
response (never revealing whether the account exists, per the product
doc's anti-enumeration rule) — but in non-production environments only,
the response additionally includes the raw `resetToken`, clearly
documented as a development convenience that a future Notifications
epic replaces with a real emailed link. In production this field is
always omitted, meaning password reset has no working delivery
mechanism in production yet until that epic lands — an explicitly
accepted, disclosed gap, not silently swept under a fake success.

### 5. Login history: every attempt, success or failure

`LoginHistory` records every `POST /v1/auth/login` call — success flag,
`emailAttempted` (not an FK, since a failed attempt against an unknown
email has no `AdminUser` row to point to), `failureReason` (internal
only — never surfaced in the API response, per the product doc's
generic "email or password is incorrect" rule), IP, user agent,
timestamp. `GET /v1/auth/login-history` lets an admin view their own
history — self-service, same pattern as sessions.

### 6. Rate limiting: `@nestjs/throttler`, in-memory, IP-based

`POST /v1/auth/login` carries a stricter `@Throttle()` limit (5 requests
per 60 seconds per IP) than the rest of the API (a generous default
applied globally); both use `@nestjs/throttler`'s built-in in-memory
storage. This is the practical realization of
docs/product/01-AUTHENTICATION.md's "5 failed attempts locks the
account for 15 minutes" rule, deliberately simplified: it throttles by
**IP**, not by account, and doesn't send the "someone tried to access
your account" alert email the product doc also specifies (no
Notifications epic exists — same disclosed gap as §4). A real
per-account lockout with an alert email is future work once
Notifications exists; ADR 0016 already named Redis-backed rate limiting
as deferred for the same reason (no Redis client wired into `apps/api`
yet) — in-memory throttling is correct for this codebase's current
single-instance deployment and becomes a real gap only once the API
runs as more than one instance, at which point it needs a shared
(Redis) store — tracked as a known limitation, not fixed now.

### 7. `JwtAuthGuard` + `PermissionGuard` replace `TemporaryAdminGuard`; RBAC is enforced for real

Two global guards (`APP_GUARD`, in this order): `JwtAuthGuard` (parses
`Authorization: Bearer <token>`, verifies it, attaches `request.actor`
exactly as `TemporaryAdminGuard` did — no change to `@CurrentActor()` or
any controller's use of it) then `PermissionGuard` (reads a
`@RequirePermission(key)` method/class metadata key; if none is set, any
authenticated admin passes; if set, calls the unchanged
`CheckPermissionUseCase.execute()` and throws `ForbiddenException`
(403) on `false`). Both guards skip entirely on `@Public()` routes,
preserving every public/guarded split ADR 0016 established untouched.

Every previously-guarded endpoint across Identity, Catalog, Inventory,
and Orders now carries an explicit `@RequirePermission(...)` drawn from
the `PERMISSION_KEYS` Epic 2 already seeded — no new permission keys
were needed. Reads map to `*_VIEW` keys, writes to `*_MANAGE`/specific
action keys (`ORDERS_FULFILL`/`ORDERS_REFUND`/`ORDERS_NOTES`,
`INVENTORY_ADJUST`); Identity's own admin-user/role/permission endpoints
all require `USERS_MANAGE` (no dedicated "view staff list" key exists
in Epic 2's permission set, so listing staff is treated as sensitive as
managing them). This closes ADR 0016's explicitly deferred item: *"Wire
`CheckPermissionUseCase` into the guard now for real per-route 403s...
left to the epic that adds real Login/JWT."*

### 8. A necessary, disclosed API-contract change: `x-admin-user-id` header → `Authorization: Bearer`

The epic's brief asks to "replace `TemporaryAdminGuard` without changing
API contracts." Every route path, HTTP method, request/response DTO
shape, and status-code convention (401 for "not authenticated," 403 for
"authenticated but not permitted," per docs/08-API-REVIEW.md §8) is
unchanged. The one thing that cannot stay the same is the credential
transport itself: the entire point of this epic is to replace a
password-less, unforgeable-only-by-obscurity header with real,
verifiable authentication. Keeping `x-admin-user-id` alongside JWTs
would mean the old bypass still works, defeating the epic outright. This
is called out here explicitly as the one deliberate exception to "no
contract changes" — Swagger's security scheme changes from
`ApiSecurity('admin-user-id')` (an API-key header) to
`ApiBearerAuth('access-token')` across all eighteen previously-guarded
controllers, and every integration test that previously set
`x-admin-user-id` now logs in first and sends `Authorization: Bearer
<accessToken>`.

## Consequences

- `PermissionDeniedError` (thrown by `AuthorizationService.assertPermission`,
  built in Epic 2 but never wired to HTTP until now) needed a new branch
  in `HttpExceptionFilter.classifyDomainErrorStatus()` — it was falling
  through to a bare 400 with no branch mapping it to 403 at all. Fixed as
  part of this epic's explicit "support 401 and 403 correctly"
  requirement; `PermissionGuard` itself doesn't call this path (it
  throws a plain `ForbiddenException` directly from the boolean
  `CheckPermissionUseCase` result), but the fix is real and necessary for
  any future direct caller of `AuthorizationService.assertPermission`.
- `JwtAuthGuard` re-fetches `AdminUser` from Postgres on every request
  (same as `TemporaryAdminGuard` before it), and `PermissionGuard` then
  independently re-fetches the admin's role via `CheckPermissionUseCase`
  — two DB round trips per guarded request instead of one. Accepted as a
  minor, disclosed inefficiency (the same shape of tradeoff as
  Inventory's disclosed N+1 list queries) rather than changing
  `CheckPermissionUseCase`'s frozen signature to accept an
  already-loaded `AdminUser`.
- MFA (Super Admin/Manager) is **not built** — explicitly out of Epic
  7's Scope list, and docs/product/01-AUTHENTICATION.md itself frames it
  as a distinct verification step layered after password login, best
  scoped as its own follow-up once this epic's base login flow exists.
- Customer authentication (registration, customer login/JWT) is **not
  built** — Customer accounts don't exist yet (PROJECT_STATUS.md gap #9);
  this epic is staff-only, matching "Reuse the existing Identity module"
  (which only contains `AdminUser`).
- No email is ever sent by this epic (welcome, password-changed,
  suspicious-login, reset-link) — no Notifications epic exists yet. The
  reset flow's dev-only raw-token disclosure (§4) and IP-based-only rate
  limiting (§6) are both direct, disclosed consequences of this gap.
- Rate limiting is in-memory and per-process; it does not coordinate
  across multiple API instances. Fine for this codebase's current
  single-instance deployment; a future scaling epic needs a shared
  (Redis) throttler storage adapter, at which point `REDIS_URL` (already
  provisioned by Docker Compose since Epic 1, still otherwise unused)
  finally gets a real consumer.
- Every admin account seeded before this epic (via `prisma/seed.ts`) has
  a real Argon2 password hash already (Epic 2 always hashed the seeded
  bootstrap password) — no data migration is needed for existing rows to
  become loginable.

## Alternatives Considered

- **Store refresh tokens as opaque random strings instead of JWTs.**
  Considered, since server-side lookup is required either way for
  rotation/reuse-detection (the JWT-ness of the refresh token buys
  nothing a plain signed reference wouldn't). Kept as JWTs anyway for
  consistency with the access token (one verification code path, one
  library) and because the brief explicitly lists "JWT" for both token
  types; the `jti` is what actually gets looked up, so this is a
  naming/consistency choice, not a security-relevant one.
- **Hash `RefreshToken.jti` before storing it**, matching
  `PasswordResetToken.tokenHash`. Rejected — `jti` is just a lookup key
  inside a JWT whose signature is the actual unforgeable secret; unlike
  a password-reset token, knowing a `jti` alone (without the matching
  valid signature) grants nothing. Hashing it would add cost with no
  security benefit.
- **Full account lockout (15-minute, per-account, with an alert email)**
  instead of IP-based rate limiting. Rejected for this epic — it
  requires an email delivery mechanism that doesn't exist yet
  (Notifications). IP-based throttling via `@nestjs/throttler` is real,
  useful protection against brute force today, with the exact product
  behavior tracked as a disclosed gap rather than half-built (e.g., a
  lockout with no alert email would violate the product doc's explicit
  "always self-recoverable... via a real notification" framing).
- **Building a "logout all sessions" / admin-revokes-another-admin's-session
  endpoint.** Deferred — not named in this epic's explicit Scope list
  ("Session Management" is satisfied by list/revoke-one/logout-current);
  a moderation feature for one admin to revoke another's session belongs
  naturally with a future audit/security-center epic.
