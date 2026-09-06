import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRecord,
  type NotificationRepository,
} from '../../../../infrastructure/notifications/notification.repository';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

/** Staff-only history read (ADR 0024) — reuses `AUDIT_LOG_VIEW`, an operational log in the same spirit as the audit log. */
@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(): Promise<NotificationRecord[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.notifications.list(storeId);
  }
}
