# ZA Store — Security Review

Consolidates and deepens the security posture first outlined in
[01-ARCHITECTURE.md §5](01-ARCHITECTURE.md#5-security). This is a review
document — threats identified, mitigation assigned, owning context noted.

## 1. Threat Model

Assets, threats, and mitigations, organized by what an attacker actually
gains:

| Asset | Threat | Mitigation |
|---|---|---|
| Customer PII (name, address, phone, email) | Data breach via SQLi, leaked backups, compromised admin account | Parameterized queries only (Prisma), encrypted backups, RBAC + audit log on every admin read-path to customer data (not just writes — see §9), least-privilege DB user for the app |
| Payment/order data | Fraudulent orders, price manipulation | Server-side price/total recomputation on every checkout — **the client-submitted cart total is never trusted**, only product/coupon IDs and quantities are; stock reservation prevents oversell races |
| Admin session/credentials | Account takeover → full catalog/order control | Argon2id hashing, refresh-token rotation + reuse detection, rate-limited login, optional future MFA hook point (not v1, but the `AdminUser` schema and login flow are designed not to preclude it) |
| Customer session | Session hijacking, CSRF on refresh | httpOnly/Secure/SameSite cookies, CSRF mitigation per §3 |
| Coupon/discount logic | Abuse (stacking, replay, sharing single-use codes) | Server-side `CouponValidationService` re-validates on every checkout attempt, not just at cart-preview time (see [08-API-REVIEW.md §6](08-API-REVIEW.md#6-validation) on defense-in-depth) |
| Product/media storage | Malicious file upload | Cloudinary signed, scoped upload presets (no arbitrary file type/size); binary bytes never pass through the NestJS server (see [04-API-DESIGN.md §14](04-API-DESIGN.md#14-media-uploads-cloudinary)) |
| Platform availability | DoS on public endpoints (search, PLP) | Rate limiting per §6, Nginx-level connection limits, Cloudflare (or equivalent) recommended in front of the VPS as an addition to [14-DEPLOYMENT.md](14-DEPLOYMENT.md) |
| Reusable-platform IP (this codebase, across future clients) | A vulnerability in one client's deployment shouldn't imply the same for another if configs differ | Secrets/config are 100% environment-scoped, never hardcoded — a security fix to core code benefits every deployment identically, which is the point of building this as a platform rather than one-off client code |

## 2. JWT Strategy

- **Two audiences**, one signing scheme, per
  [01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac):
  `aud: "customer"` and `aud: "admin"`, verified explicitly on every guard
  — a token issued for one audience is rejected outright for the other,
  even if otherwise valid and even if a customer and staff member share an
  email address (a deliberate, cheap defense against confused-deputy bugs).
- **Claims kept minimal**: subject id, audience, role (admin only),
  `iat`/`exp` — no PII in the JWT payload itself (it's not encrypted, just
  signed; anything in it is readable by whoever holds the token).
- **Access token lifetime**: 15 minutes, kept in memory client-side only
  (never `localStorage`/`sessionStorage`) — this is what limits the blast
  radius of an XSS-exfiltrated access token to a short window.
- **Signing secret rotation**: supported by keeping a `kid` (key id) in the
  JWT header and validating against a small set of currently-accepted
  secrets, so a scheduled rotation doesn't invalidate every live session
  instantly.

## 3. Refresh Tokens & CSRF

- Refresh token: httpOnly, `Secure`, `SameSite=Strict` cookie — `Strict`
  (not `Lax`) because the refresh cookie should never be sent on a
  cross-site navigation at all, only on same-site requests the frontend
  itself initiates.
- **CSRF surface**: `SameSite=Strict` already blocks the classic
  cross-site-form-POST CSRF vector for the refresh/logout endpoints.
  Defense-in-depth: `POST /auth/refresh` and `POST /auth/logout` also
  require a custom header (e.g. `X-Requested-With: za-store`) that a
  cross-origin form submission cannot set — a lightweight double-submit-
  style check that costs nothing and closes the gap for any browser/proxy
  edge case where `SameSite` enforcement is weaker than expected.
- **Reuse detection**: rotating a refresh token invalidates the previous
  one; if a already-rotated (dead) token is presented again, the entire
  token family is revoked and the event is logged — this is the standard
  signal that a refresh token was stolen and both the attacker's and the
  legitimate user's sessions are now dead, forcing re-login (safe default
  over "silently ignore").

## 4. XSS

- **React's default escaping** covers the overwhelming majority of
  surface area — the risk is concentrated entirely in the few places rich
  text is rendered: `Product.description`, `Page.body`, `BlogPost.body`,
  `Review.body`.
- **Sanitize on write, not just on read**: rich text is passed through an
  allow-list HTML sanitizer (e.g. `sanitize-html`) server-side at save
  time, not just escaped at render time — this way the stored data is
  itself safe regardless of what eventually renders it (a future admin
  export, a different frontend, an RSS feed).
- **Content Security Policy**: a strict CSP header (`script-src 'self'`,
  no `unsafe-inline`, Cloudinary image origins allow-listed) served by
  Nginx on both `apps/web` and `apps/admin` — this is what catches an
  XSS payload that somehow slips past sanitization.
- **`dangerouslySetInnerHTML`** is used in exactly the sanitized-rich-text
  render paths above, and nowhere else in the codebase — this is a review-
  checklist item (see
  [15-PROJECT-STANDARDS.md](15-PROJECT-STANDARDS.md#review-checklist)),
  not just a convention.

## 5. SQL Injection

- Prisma parameterizes all standard query-builder calls — the practical
  risk is entirely in the **raw SQL** used for full-text search
  (`tsvector`/`pg_trgm`, per
  [07-DATABASE-REVIEW.md §2](07-DATABASE-REVIEW.md#2-indexes)) and the
  CHECK-constraint migrations. Rule: any raw SQL **must** use Prisma's
  tagged-template `Prisma.sql`/`$queryRaw` with parameter placeholders —
  string concatenation into a raw query is a hard rejection in code review,
  no exceptions.
- Sort/filter field names (§4 of the API review) are validated against a
  server-side whitelist before being interpolated into an `ORDER BY` —
  this is technically a SQLi control as well as an API-contract control.

## 6. Rate Limiting

Full route-by-route limits are specified in
[08-API-REVIEW.md §10](08-API-REVIEW.md#10-rate-limiting); the security
rationale: login/forgot-password limits blunt credential-stuffing and
enumeration, checkout/coupon-validate limits blunt scripted abuse of
business logic (coupon brute-forcing, inventory-locking via repeated fake
checkouts), review-submission limits blunt spam.

## 7. RBAC

Enforced server-side only (client-side hiding is UX, never a security
boundary) via `RolesGuard`/`@Roles()` reading the JWT `role` claim — the
client never supplies its own role. Full matrix in
[05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix); `401` vs `403`
discipline in [08-API-REVIEW.md §8](08-API-REVIEW.md#8-authentication--authorization).
A hard invariant, checked in the `AdminUser` domain service: the last
active Super Admin account can never be deactivated or have its role
changed away from Super Admin (prevents a platform lockout).

## 8. Audit Logs

Covered in depth in
[07-DATABASE-REVIEW.md §7](07-DATABASE-REVIEW.md#7-audit-strategy) — the
security-relevant addition here: the audit log itself must be
**append-only at the database permission level**, not just by application
convention. The application's DB role should have `INSERT`/`SELECT` but not
`UPDATE`/`DELETE` on the `AuditLog` table, so even a fully compromised
application server can't retroactively edit its own trail.

## 9. Secrets Management

- All secrets (JWT signing keys, DB credentials, Cloudinary API secret) via
  environment variables, never committed — `.env.example` checked in with
  placeholder values only, real `.env` files gitignored.
- Separate secrets per environment (local/staging/production) — a staging
  leak never compromises production.
- For a reusable platform, this also means: **no secret is ever
  client-specific code** — a new client deployment is a new set of
  environment variables against the same codebase, never a forked branch
  with different hardcoded keys.
- Recommend a password manager/secrets vault (1Password, or Hostinger's
  environment config if sufficient at this scale) for team access to
  production secrets, rather than ad hoc sharing.

## 10. Password Policy

- Minimum 10 characters, no maximum-restrictive complexity rules (length
  matters far more than forced special-character rules, which mostly just
  push users toward predictable substitutions).
- Argon2id hashing (memory-hard, current best practice over bcrypt) for
  both `AdminUser` and `Customer` passwords.
- Optional, recommended for v1: check new passwords against the
  HaveIBeenPwned k-anonymity range API at registration/change time
  (reject known-breached passwords) — no plaintext password ever leaves
  the server, only a truncated hash prefix is sent.
- Password reset tokens: single-use, short-lived (30 minutes), invalidated
  immediately on use or on a subsequent successful login.

## 11. Email Verification

- Customers can register and even check out as an unverified email
  (deliberate — blocking checkout on verification adds friction for a
  DTC storefront with no strong reason to gate purchase on it); email
  verification is instead **required before**: password reset trust
  (a reset link is only meaningful once the email's ownership is
  established) and any future marketing-email send (never email an
  unverified address beyond the verification link itself).
- Verification token: signed, single-use, 24-hour expiry, re-sendable with
  the same rate limit discipline as password reset.
