import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { Refund } from '../../domain/entities/refund.entity';
import type { CreateRefundData, RefundRepository } from '../../domain/repositories/refund.repository';
import { REFUND_STATUS } from '../../domain/constants/refund-status.constants';
import { RefundMapper } from '../mappers/refund.mapper';

@Injectable()
export class PrismaRefundRepository implements RefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefundData): Promise<Refund> {
    const record = await this.prisma.refund.create({
      data: {
        storeId: data.storeId,
        orderId: data.orderId,
        paymentTransactionId: data.paymentTransactionId ?? null,
        amount: data.amount,
        reason: data.reason,
        method: data.method,
        status: data.status,
        requestedByActorId: data.requestedBy.actorId,
        requestedByActorType: data.requestedBy.actorType,
        completedAt: data.completedAt ?? null,
      },
    });
    return RefundMapper.toDomain(record);
  }

  async listByOrderId(orderId: string): Promise<Refund[]> {
    const records = await this.prisma.refund.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
    return records.map(RefundMapper.toDomain);
  }

  async sumCompletedByOrderId(orderId: string): Promise<number> {
    const result = await this.prisma.refund.aggregate({
      where: { orderId, status: REFUND_STATUS.COMPLETED },
      _sum: { amount: true },
    });
    return result._sum.amount?.toNumber() ?? 0;
  }
}
