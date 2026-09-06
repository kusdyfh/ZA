import { Global, Module } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from './notification.repository';
import { PrismaNotificationRepository } from './prisma-notification.repository';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from './notification-preference.repository';
import { PrismaNotificationPreferenceRepository } from './prisma-notification-preference.repository';

/** `@Global` so both `modules/notifications` and `JobsModule`'s outbox-relay can write history without a circular module dependency — see `notification.repository.ts`'s doc comment. */
@Global()
@Module({
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: PrismaNotificationPreferenceRepository },
  ],
  exports: [NOTIFICATION_REPOSITORY, NOTIFICATION_PREFERENCE_REPOSITORY],
})
export class NotificationsDataModule {}
