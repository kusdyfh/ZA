import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { GetNotificationPreferencesUseCase } from './application/use-cases/get-notification-preferences.use-case';
import { SetNotificationPreferenceUseCase } from './application/use-cases/set-notification-preference.use-case';
import { NotificationHistoryController } from './http/notification-history.controller';
import { NotificationPreferencesController } from './http/notification-preferences.controller';
import { CustomerNotificationPreferencesController } from './http/customer-notification-preferences.controller';

/**
 * The HTTP-facing half of Notifications (ADR 0024) — history read and
 * preferences CRUD, imported by `AppModule`. `NOTIFICATION_REPOSITORY`/
 * `NOTIFICATION_PREFERENCE_REPOSITORY` come from the `@Global`
 * `NotificationsDataModule`, not this module. The queue-processing half
 * (email send, event dispatch) lives in `NotificationsWorkerModule`,
 * imported only by `WorkerModule` — `za-api` never touches BullMQ
 * directly (see `JobsModule`'s doc comment). Imports `CustomersModule`
 * only for its `CustomerAuthGuard` dependencies, the same shape every
 * other module using that guard already has.
 */
@Module({
  imports: [CustomersModule],
  controllers: [NotificationHistoryController, NotificationPreferencesController, CustomerNotificationPreferencesController],
  providers: [ListNotificationsUseCase, GetNotificationPreferencesUseCase, SetNotificationPreferenceUseCase],
})
export class NotificationsModule {}
