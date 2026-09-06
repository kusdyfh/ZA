import { Injectable } from '@nestjs/common';
import type { ActorType } from '@za/types';
import { PrismaService } from '../prisma/prisma.service';
import type {
  NotificationPreferenceRecord,
  NotificationPreferenceRepository,
} from './notification-preference.repository';
import type { NotificationChannelValue } from './notification.repository';

@Injectable()
export class PrismaNotificationPreferenceRepository implements NotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(
    storeId: string,
    ownerType: ActorType,
    ownerId: string,
    type: string,
    channel: NotificationChannelValue,
  ): Promise<boolean> {
    const record = await this.prisma.notificationPreference.findUnique({
      where: { storeId_ownerType_ownerId_type_channel: { storeId, ownerType, ownerId, type, channel } },
    });
    return record?.enabled ?? true;
  }

  async list(storeId: string, ownerType: ActorType, ownerId: string): Promise<NotificationPreferenceRecord[]> {
    const records = await this.prisma.notificationPreference.findMany({
      where: { storeId, ownerType, ownerId },
    });
    return records.map((record) => ({ type: record.type, channel: record.channel, enabled: record.enabled }));
  }

  async setEnabled(
    storeId: string,
    ownerType: ActorType,
    ownerId: string,
    type: string,
    channel: NotificationChannelValue,
    enabled: boolean,
  ): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { storeId_ownerType_ownerId_type_channel: { storeId, ownerType, ownerId, type, channel } },
      update: { enabled },
      create: { storeId, ownerType, ownerId, type, channel, enabled },
    });
  }
}
