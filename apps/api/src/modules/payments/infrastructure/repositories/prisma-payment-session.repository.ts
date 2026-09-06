import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PaymentSession } from '../../domain/entities/payment-session.entity';
import type {
  CreatePaymentSessionData,
  PaymentSessionRepository,
} from '../../domain/repositories/payment-session.repository';
import { PAYMENT_SESSION_STATUS } from '../../domain/constants/payment-session-status.constants';
import { PaymentSessionNotFoundError } from '../../domain/errors/payment.errors';
import { PaymentSessionMapper } from '../mappers/payment-session.mapper';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPaymentSessionRepository implements PaymentSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentSessionData): Promise<PaymentSession> {
    const record = await this.prisma.paymentSession.create({
      data: {
        storeId: data.storeId,
        provider: data.provider,
        providerSessionId: data.providerSessionId ?? null,
        pendingOrderSnapshot: data.pendingOrderSnapshot as Prisma.InputJsonValue,
        amount: data.amount,
        currencyCode: data.currencyCode,
        expiresAt: data.expiresAt,
      },
    });
    return PaymentSessionMapper.toDomain(record);
  }

  async findById(storeId: string, id: string): Promise<PaymentSession | null> {
    const record = await this.prisma.paymentSession.findFirst({ where: { id, storeId } });
    return record ? PaymentSessionMapper.toDomain(record) : null;
  }

  async findByProviderSessionId(providerSessionId: string): Promise<PaymentSession | null> {
    const record = await this.prisma.paymentSession.findFirst({ where: { providerSessionId } });
    return record ? PaymentSessionMapper.toDomain(record) : null;
  }

  async markSucceeded(id: string, orderId: string): Promise<PaymentSession> {
    const existing = await this.prisma.paymentSession.findUnique({ where: { id } });
    if (!existing) {
      throw new PaymentSessionNotFoundError(id);
    }
    const record = await this.prisma.paymentSession.update({
      where: { id },
      data: { status: PAYMENT_SESSION_STATUS.SUCCEEDED, orderId },
    });
    return PaymentSessionMapper.toDomain(record);
  }

  async markFailed(id: string): Promise<PaymentSession> {
    const existing = await this.prisma.paymentSession.findUnique({ where: { id } });
    if (!existing) {
      throw new PaymentSessionNotFoundError(id);
    }
    const record = await this.prisma.paymentSession.update({
      where: { id },
      data: { status: PAYMENT_SESSION_STATUS.FAILED },
    });
    return PaymentSessionMapper.toDomain(record);
  }
}
