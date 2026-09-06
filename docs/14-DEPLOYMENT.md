# ZA Store — Deployment

Concretizes [01-ARCHITECTURE.md §7](01-ARCHITECTURE.md#7-deployment-topology-hostinger-vps)
into an actual operational runbook-level spec for the Hostinger VPS.

## 1. Server Baseline

- **OS**: Ubuntu LTS (22.04 or the current LTS at provisioning time).
- **Hardening**: non-root deploy user with `sudo`, SSH key-only auth
  (password auth disabled), `ufw` firewall (allow 22/80/443 only, deny by
  default), `fail2ban` on SSH.
- **Runtime**: Node.js via `nvm` (pinned version matching `apps/*`
  `engines` field, not "whatever's latest"), `pnpm` installed globally.
- **Database**: PostgreSQL installed locally on the VPS for v1 (simplest
  operationally at this scale); `pg_hba.conf` restricted to localhost —
  the API is the only client, no external DB access exposed.

## 2. Nginx

One server block per subdomain, all terminating TLS and reverse-proxying
to the matching PM2-managed local port
(per [01-ARCHITECTURE.md §7](01-ARCHITECTURE.md#7-deployment-topology-hostinger-vps)):

```
zastore.com        → 127.0.0.1:3000   (apps/web)
admin.zastore.com   → 127.0.0.1:3001   (apps/admin)
api.zastore.com     → 127.0.0.1:4000   (apps/api)
```

- Gzip/Brotli compression enabled globally.
- `admin.zastore.com` additionally IP-allowlisted where feasible (staff
  work from known networks/VPNs) as defense-in-depth on top of application
  RBAC — not a substitute for it.
- Security headers set at the Nginx layer (CSP, `X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`) so they apply uniformly regardless of
  which app is serving the response.
- Long-lived, immutable cache headers for `_next/static/*`.

## 3. SSL & Domain

- Let's Encrypt via `certbot`, one certificate per subdomain (or a single
  multi-SAN cert covering all three) — auto-renewal via `certbot`'s
  systemd timer, verified with a monitoring check (see §8) rather than
  assumed to "just work."
- DNS: `A`/`AAAA` records for the root domain and each subdomain pointed
  at the VPS; if Cloudflare is adopted per
  [13-PERFORMANCE-STRATEGY.md §7](13-PERFORMANCE-STRATEGY.md#7-cdn),
  DNS is proxied through it and Nginx's cert becomes the origin cert
  behind Cloudflare's edge TLS.

## 4. PM2

`ecosystem.config.js` at the repo root defines all three processes:

```
za-web    → apps/web,   fork mode (Next.js handles its own concurrency)
za-admin  → apps/admin, fork mode
za-api    → apps/api,   cluster mode (scaled to CPU core count on the VPS,
                        since this is the one process that benefits most
                        from multi-core — the two Next.js apps are largely
                        I/O-bound rendering work, not CPU-bound)
```

- `pm2 startup` + `pm2 save` so all processes survive a VPS reboot.
- `pm2 reload` (not `restart`) for deploys — cluster mode's reload is
  zero-downtime for `za-api`; `za-web`/`za-admin` in fork mode briefly drop
  during reload, acceptable at ZA Store's scale but revisit (cluster mode
  for them too) if uptime requirements tighten.
- `pm2-logrotate` module installed to prevent log files from growing
  unbounded.

## 5. Environment Variables

- Each app (`apps/web`, `apps/admin`, `apps/api`) has its own `.env` on the
  server, populated from a checked-in `.env.example` template — never the
  real values.
- Per-environment separation: local `.env.local`, staging and production
  each with their own file, never shared secrets across environments.
- **Reusability implication**: a new client deployment is, by design,
  "clone the repo, populate `.env` with that client's DB/Cloudinary/
  JWT-secret/branding values, deploy" — no code fork required. This is the
  concrete mechanism (alongside the CMS context and design tokens) that
  makes the "reusable enterprise platform" goal real rather than aspirational.

## 6. Backup Strategy

- Nightly `pg_dump` (custom format, compressed) via cron, retained 30 days
  locally on the VPS and additionally copied to off-VPS storage (object
  storage — e.g. Backblaze B2 or equivalent low-cost S3-compatible
  provider) so a VPS-level disaster doesn't take the backups with it.
- A documented, periodically-tested **restore procedure** (restoring a
  dump into a scratch database and running a basic integrity check) — an
  untested backup is not a backup.
- Cloudinary media is already durable/replicated by the provider — no
  separate media backup needed, but the Cloudinary account's own
  access/billing continuity is a business-level dependency worth noting.

## 7. Monitoring & Logging

- **Monitoring**: `pm2 monit`/`pm2 status` for process-level health;
  lightweight external uptime checks (e.g. UptimeRobot or equivalent)
  hitting each app's health-check endpoint (`GET /health` on the API,
  a basic `200` check on `/` for the two frontends) from outside the VPS
  — this is what catches "the VPS is up but Nginx/PM2 silently died,"
  which internal-only monitoring can't see.
- **Logging**: structured JSON logs (Nest's built-in Logger or `pino`),
  rotated via `pm2-logrotate`. At this scale, centralized log shipping
  (e.g. to a hosted log service) is a nice-to-have, not a launch
  requirement — revisit once there's more than one VPS or an incident
  makes local-log searching genuinely painful.

## 8. CI/CD

- **CI** (GitHub Actions or equivalent), on every PR: install, lint,
  typecheck, unit + integration tests, build all three apps, Lighthouse CI
  against a preview build for the storefront (enforcing the performance
  budget from
  [13-PERFORMANCE-STRATEGY.md §8](13-PERFORMANCE-STRATEGY.md#8-performance-budgets)).
- **CD**: merge to `main` triggers a deploy job — SSH to the VPS, `git
  pull`, `pnpm install --frozen-lockfile`, `prisma migrate deploy`
  (migrations always run **before** the reload, never after — a reload
  serving new code against an unmigrated schema is exactly the kind of bug
  this ordering prevents), `pm2 reload ecosystem.config.js`.
- Manual approval gate on the deploy job is acceptable at this stage
  (small team, low deploy frequency); revisit for full auto-deploy once
  the test suite's coverage is trusted enough to remove the human gate.

## 9. Zero-Downtime Deployment

- `pm2 reload` for `za-api` (cluster mode) achieves this natively — old
  and new processes overlap briefly, no dropped connections.
- Migrations must be **backward-compatible with the currently-running
  code** at the moment they run (the brief window between `migrate deploy`
  and `pm2 reload` still has the old code running against the new schema)
  — practically: additive migrations (new nullable columns, new tables)
  ship freely; destructive migrations (dropping/renaming a column) ship as
  two deploys — first stop reading/writing the old column, then drop it
  in a later deploy — never as one atomic "rename + change code" migration.
- **Rollback plan**: redeploy the previous git tag/commit + `pm2 reload`;
  because destructive migrations are always split into two safe deploys
  (above), a rollback of the "stop using the column" deploy never needs a
  matching down-migration to be safe.
