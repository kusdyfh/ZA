import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import configuration from './shared/config/configuration';
import { envValidationSchema } from './shared/config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StoreModule } from './infrastructure/store/store.module';
import { EventsModule } from './infrastructure/events/events.module';
import { NotificationsDataModule } from './infrastructure/notifications/notifications-data.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { NotificationsWorkerModule } from './modules/notifications/notifications-worker.module';

/**
 * `za-worker` (ADR 0023) — a NestJS application context, no HTTP
 * listener, no `ThrottlerGuard`/`JwtAuthGuard`/`PermissionGuard`/Swagger
 * (none apply to a process with no HTTP surface). Deliberately does
 * *not* import `AppModule` — only what job processors actually need:
 * the outbox relay, the four registered queues, and Notifications'
 * queue-processing half. `IdentityModule`/`CatalogModule`/etc. are not
 * imported — nothing here calls into staff/catalog business logic except
 * `InventoryModule` (via `JobsModule`, for the maintenance sweep).
 */
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
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    StoreModule,
    EventsModule,
    NotificationsDataModule,
    JobsModule,
    NotificationsWorkerModule,
  ],
})
export class WorkerModule {}
