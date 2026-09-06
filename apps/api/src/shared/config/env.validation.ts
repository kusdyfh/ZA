import * as Joi from 'joi';

/**
 * Validated at boot by @nestjs/config (see configuration.ts). Fails
 * fast with a clear error if a required variable is missing or
 * malformed, rather than surfacing as a confusing runtime error later.
 *
 * DATABASE_URL and REDIS_URL are validated here because
 * infrastructure/docker/docker-compose.yml already provisions both
 * services (per this epic's brief) — no Prisma client or Redis client
 * is wired up yet; that lands with the modules that actually need them.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  API_GLOBAL_PREFIX: Joi.string().default('v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000,http://localhost:3001'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  // Optional per docs/v2/adr/0012 — StoreContext falls back to the single
  // seeded Store row when unset. See docs/epics/EPIC-03A-*.md.
  DEFAULT_STORE_ID: Joi.string().optional(),
  // Epic 7 (Authentication & Authorization) — see docs/v2/adr/0017.
  // Required, distinct secrets; no default, so a misconfigured
  // deployment fails fast at boot rather than signing tokens with an
  // empty/guessable key.
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().disallow(Joi.ref('JWT_ACCESS_SECRET')),
  // Epic 8 (Customer Accounts) — see docs/v2/adr/0018 §2. Separate from
  // the staff secrets above by design.
  CUSTOMER_JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  CUSTOMER_JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .disallow(Joi.ref('CUSTOMER_JWT_ACCESS_SECRET')),
  // Epic 11 (Commerce Services) — see docs/v2/adr/0024. Defaults match
  // infrastructure/docker/docker-compose.yml's mailpit service, so local
  // dev needs zero configuration to send/view real emails.
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().default('ZA Store <no-reply@za-store.local>'),
  // Where admin-facing notification emails (new order, review awaiting
  // moderation) are sent, and where a staff password-reset link points.
  // Falls back to the seeded bootstrap Super Admin's email at runtime if
  // unset (see NotificationsModule).
  STORE_ADMIN_NOTIFICATION_EMAIL: Joi.string().email({ tlds: false }).allow('').default(''),
  ADMIN_APP_URL: Joi.string().uri().default('http://localhost:3001'),
  // Epic 12 (Payments & Shipping) — see docs/v2/adr/0026. Defaults are
  // Stripe's own well-known test-mode placeholder values, so local dev
  // boots without a real Stripe account; real card checkout requires
  // real keys, disclosed in .env.example.
  STRIPE_SECRET_KEY: Joi.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: Joi.string().default('whsec_test_placeholder'),
  STOREFRONT_APP_URL: Joi.string().uri().default('http://localhost:3000'),
});
