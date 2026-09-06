import { Inject, Injectable } from '@nestjs/common';
import type { ActorType } from '@za/types';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  type NotificationPreferenceRepository,
} from '../../../../infrastructure/notifications/notification-preference.repository';
import type { NotificationChannelValue } from '../../../../infrastructure/notifications/notification.repository';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';

export interface SetNotificationPreferenceInput {
  ownerType: ActorType;
  ownerId: string;
  type: string;
  channel: NotificationChannelValue;
  enabled: boolean;
}

@Injectable()
export class SetNotificationPreferenceUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY) private readonly preferences: NotificationPreferenceRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: SetNotificationPreferenceInput): Promise<void> {
    const storeId = await this.storeContext.getCurrentStoreId();
    await this.preferences.setEnabled(storeId, input.ownerType, input.ownerId, input.type, input.channel, input.enabled);
  }
}
