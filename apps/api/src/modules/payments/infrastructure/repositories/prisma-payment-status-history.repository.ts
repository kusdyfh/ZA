import { Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PaymentStatusHistoryEntry } from '../../domain/entities/payment-status-history-entry.entity';
import type { PaymentStatusHistoryRepository } from '../../domain/repositories/payment-status-history.repository';
import type { PaymentStatusValue } from '../../../orders/domain/constants/payment-status.constants';
import { PaymentStatusHistoryMapper } from '../mappers/payment-status-history.mapper';

@Injectable()
export class PrismaPaymentStatusHistoryRepository implements PaymentStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    orderId: string,
    status: PaymentStatusValue,
    note: string | null,
    actor: ActorRef,
  ): Promise<PaymentStatusHistoryEntry> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    const record = await this.prisma.paymentStatusHistory.create({
      data: {
        storeId: order?.storeId ?? '',
        orderId,
        status,
        note,
        actorId: actor.actorId,
        actorType: actor.actorType,
      },
    });
    return PaymentStatusHistoryMapper.toDomain(record);
  }

  async listByOrderId(orderId: string): Promise<PaymentStatusHistoryEntry[]> {
    const records = await this.prisma.paymentStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(PaymentStatusHistoryMapper.toDomain);
  }
}
