import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './shared/config/configuration';
import { envValidationSchema } from './shared/config/env.validation';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { PermissionGuard } from './shared/guards/permission.guard';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StoreModule } from './infrastructure/store/store.module';
import { EventsModule } from './infrastructure/events/events.module';
import { NotificationsDataModule } from './infrastructure/notifications/notifications-data.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CmsModule } from './modules/cms/cms.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/health') ?? false,
        },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    // In-memory, per-process rate limiting (ADR 0017 §6) — a generous
    // global default; /auth/login carries its own stricter @Throttle().
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    // Epic 11 (ADR 0023) — the in-process side of the hybrid event model;
    // za-api never processes a BullMQ job itself (see JobsModule's doc
    // comment), so only EventEmitterModule is registered here, not Bull.
    EventEmitterModule.forRoot(),
    PrismaModule,
    StoreModule,
    EventsModule,
    NotificationsDataModule,
    HealthModule,
    IdentityModule,
    AuthModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    ShippingModule,
    PaymentsModule,
    CheckoutModule,
    CustomersModule,
    CmsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Order matters: rate-limit first (before spending effort verifying
    // a token), then authenticate (JwtAuthGuard sets request.actor),
    // then authorize (PermissionGuard reads request.actor) — replaces
    // TemporaryAdminGuard per docs/v2/adr/0017 §7 (formerly
    // docs/v2/adr/0016 §2). Every @Public() route bypasses all three
    // guards' actual checks unchanged.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
