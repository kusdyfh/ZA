import { Inject, Injectable } from '@nestjs/common';
import type { ActorType } from '@za/types';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  type NotificationPreferenceRecord,
  type NotificationPreferenceRepository,
} from '../../../../infrastructure/notifications/notification-preference.repository';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface GetNotificationPreferencesInput {
  ownerType: ActorType;
  ownerId: string;
}

@Injectable()
export class GetNotificationPreferencesUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY) private readonly preferences: NotificationPreferenceRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetNotificationPreferencesInput): Promise<NotificationPreferenceRecord[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.preferences.list(storeId, input.ownerType, input.ownerId);
  }
}
