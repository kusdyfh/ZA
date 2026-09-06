import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  OutboxEventRecord,
  OutboxRepository,
  PrismaTransactionClient,
  WriteOutboxEventInput,
} from './outbox.repository';
import type { WiredEventType } from './domain-events';

const MAX_ATTEMPTS = 5;

@Injectable()
export class PrismaOutboxRepository implements OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async writeInTransaction<T extends WiredEventType>(
    tx: PrismaTransactionClient,
    event: WriteOutboxEventInput<T>,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        storeId: event.storeId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        // Every WiredEventType payload interface is a plain, JSON-serializable
        // shape — the cast is only needed because Prisma's `InputJsonValue`
        // requires a literal index signature TS interfaces don't structurally provide.
        payload: event.payload as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findPending(limit: number): Promise<OutboxEventRecord[]> {
    const records = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return records.map((record) => ({
      id: record.id,
      storeId: record.storeId,
      eventType: record.eventType,
      aggregateId: record.aggregateId,
      aggregateType: record.aggregateType,
      payload: record.payload,
      attempts: record.attempts,
    }));
  }

  async markProcessing(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({ where: { id }, data: { status: 'PROCESSING' } });
  }

  async markDelivered(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({ where: { id }, data: { status: 'DELIVERED' } });
  }

  async markFailedAttempt(id: string, error: string): Promise<{ attempts: number }> {
    const record = await this.prisma.outboxEvent.update({
      where: { id },
      data: { attempts: { increment: 1 }, lastError: error, status: 'PENDING' },
    });
    if (record.attempts >= MAX_ATTEMPTS) {
      await this.prisma.outboxEvent.update({ where: { id }, data: { status: 'FAILED' } });
    }
    return { attempts: record.attempts };
  }

  async markPermanentlyFailed(id: string, error: string): Promise<void> {
    await this.prisma.outboxEvent.update({ where: { id }, data: { status: 'FAILED', lastError: error } });
  }
}
