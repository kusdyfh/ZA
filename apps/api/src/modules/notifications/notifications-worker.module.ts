import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../infrastructure/jobs/queue-names';
import { EMAIL_PROVIDER } from './infrastructure/email/email-provider.port';
import { NodemailerEmailProvider } from './infrastructure/email/nodemailer-email-provider';
import { NotificationsQueueProcessor } from './infrastructure/processors/notifications-queue.processor';
import { EmailQueueProcessor } from './infrastructure/processors/email-queue.processor';
import { DispatchNotificationEventUseCase } from './application/use-cases/dispatch-notification-event.use-case';

/**
 * The queue-processing half of Notifications (ADR 0024) — imported only
 * by `WorkerModule`. Registers its own `notifications`/`email` queue
 * tokens via `BullModule.registerQueue()` against the shared connection
 * `JobsModule.forRootAsync` establishes elsewhere in the same process's
 * module graph (both are imported into `WorkerModule` together) — this
 * module deliberately does *not* import `JobsModule` itself, avoiding a
 * circular dependency with `JobsModule`'s own use of
 * `NOTIFICATION_REPOSITORY` for its permanent-outbox-failure alert (see
 * `notification.repository.ts`'s doc comment).
 */
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATIONS }, { name: QUEUE_NAMES.EMAIL })],
  providers: [
    { provide: EMAIL_PROVIDER, useClass: NodemailerEmailProvider },
    DispatchNotificationEventUseCase,
    NotificationsQueueProcessor,
    EmailQueueProcessor,
  ],
})
export class NotificationsWorkerModule {}
