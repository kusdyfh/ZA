import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../shared/config/configuration';
import { InventoryModule } from '../../modules/inventory/inventory.module';
import { QUEUE_NAMES } from './queue-names';
import { OutboxRelayProcessor } from './outbox-relay.processor';
import { JobsSchedulerService } from './jobs-scheduler.service';
import { FailedJobLogRepository } from './failed-job-log.repository';
import { MaintenanceQueueProcessor } from './maintenance-queue.processor';

/**
 * BullMQ wiring (ADR 0023) — registered only in `WorkerModule`, never
 * `AppModule`: `za-api` never enqueues or processes a job directly, it
 * only writes `OutboxEvent` rows (a plain Prisma insert, no Redis
 * dependency). Exports `BullModule` so `modules/notifications` can
 * register its own `notifications`/`email` queue processors against the
 * same shared connection without this module depending on that one.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const appConfig = config.getOrThrow<AppConfig>('app');
        const redisUrl = new URL(appConfig.redisUrl);
        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            password: redisUrl.password || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.OUTBOX_RELAY },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.MAINTENANCE },
    ),
    InventoryModule,
  ],
  providers: [OutboxRelayProcessor, JobsSchedulerService, FailedJobLogRepository, MaintenanceQueueProcessor],
  exports: [BullModule],
})
export class JobsModule {}
