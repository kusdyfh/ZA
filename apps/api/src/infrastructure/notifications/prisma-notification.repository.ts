import { Injectable } from '@nestjs/common';
import type { ActorType } from '@za/types';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateNotificationData,
  NotificationListFilters,
  NotificationRecord,
  NotificationRepository,
} from './notification.repository';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const record = await this.prisma.notification.create({
      data: {
        storeId: data.storeId,
        type: data.type,
        channel: data.channel,
        recipientType: data.recipientType,
        recipientId: data.recipientId ?? null,
        recipientEmail: data.recipientEmail ?? null,
        subject: data.subject,
        body: data.body,
        status: data.status,
      },
    });
    return {
      ...data,
      id: record.id,
      sentAt: record.sentAt,
      error: record.error,
      createdAt: record.createdAt,
    };
  }

  async markSent(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { status: 'FAILED', error } });
  }

  async list(storeId: string, filters?: NotificationListFilters): Promise<NotificationRecord[]> {
    const records = await this.prisma.notification.findMany({
      where: {
        storeId,
        ...(filters?.recipientType ? { recipientType: filters.recipientType } : {}),
        ...(filters?.recipientId ? { recipientId: filters.recipientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return records.map((record) => ({
      id: record.id,
      storeId: record.storeId,
      type: record.type,
      channel: record.channel,
      // Prisma's generated enum is a structurally-identical but nominally
      // distinct type from @za/types' ActorType (ADR 0005) — same string
      // values, different TS enum objects.
      recipientType: record.recipientType as ActorType,
      recipientId: record.recipientId,
      recipientEmail: record.recipientEmail,
      subject: record.subject,
      body: record.body,
      status: record.status,
      sentAt: record.sentAt,
      error: record.error,
      createdAt: record.createdAt,
    }));
  }
}
