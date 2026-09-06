export interface AppConfig {
  nodeEnv: string;
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
  logLevel: string;
  databaseUrl: string;
  redisUrl: string;
  defaultStoreId: string | null;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  customerJwtAccessSecret: string;
  customerJwtRefreshSecret: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  storeAdminNotificationEmail: string;
  adminAppUrl: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  storefrontAppUrl: string;
}

/**
 * Normalizes process.env (already validated by env.validation.ts) into
 * a single typed, namespaced config object injected via ConfigService.
 * Nothing in the codebase should read `process.env` directly outside
 * this file.
 */
export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4000', 10),
    globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'v1',
    corsOrigins: (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    databaseUrl: process.env.DATABASE_URL ?? '',
    redisUrl: process.env.REDIS_URL ?? '',
    defaultStoreId: process.env.DEFAULT_STORE_ID ?? null,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    customerJwtAccessSecret: process.env.CUSTOMER_JWT_ACCESS_SECRET ?? '',
    customerJwtRefreshSecret: process.env.CUSTOMER_JWT_REFRESH_SECRET ?? '',
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPassword: process.env.SMTP_PASSWORD ?? '',
    smtpFrom: process.env.SMTP_FROM ?? 'ZA Store <no-reply@za-store.local>',
    // Falls back to the seed script's bootstrap Super Admin email (env,
    // not a DB lookup — avoids adding a new AdminUserRepository method
    // just for this fallback) rather than requiring separate configuration.
    storeAdminNotificationEmail:
      process.env.STORE_ADMIN_NOTIFICATION_EMAIL || process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || '',
    adminAppUrl: process.env.ADMIN_APP_URL ?? 'http://localhost:3001',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_placeholder',
    storefrontAppUrl: process.env.STOREFRONT_APP_URL ?? 'http://localhost:3000',
  },
});
