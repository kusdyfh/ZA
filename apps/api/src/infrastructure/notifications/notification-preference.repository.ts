import type { ActorType } from '@za/types';
import type { NotificationChannelValue } from './notification.repository';

export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol('NOTIFICATION_PREFERENCE_REPOSITORY');

export interface NotificationPreferenceRecord {
  type: string;
  channel: NotificationChannelValue;
  enabled: boolean;
}

/** Defaults to enabled — `isEnabled` returns `true` when no row exists yet (ADR 0024 §"Preferences"). */
export interface NotificationPreferenceRepository {
  isEnabled(storeId: string, ownerType: ActorType, ownerId: string, type: string, channel: NotificationChannelValue): Promise<boolean>;
  list(storeId: string, ownerType: ActorType, ownerId: string): Promise<NotificationPreferenceRecord[]>;
  setEnabled(
    storeId: string,
    ownerType: ActorType,
    ownerId: string,
    type: string,
    channel: NotificationChannelValue,
    enabled: boolean,
  ): Promise<void>;
}
