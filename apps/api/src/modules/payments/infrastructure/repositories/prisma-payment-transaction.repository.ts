import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import type {
  CreatePaymentTransactionData,
  PaymentTransactionRepository,
} from '../../domain/repositories/payment-transaction.repository';
import { PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { PaymentTransactionMapper } from '../mappers/payment-transaction.mapper';
import { OUTBOX_REPOSITORY, type OutboxRepository } from '../../../../infrastructure/events/outbox.repository';
import { EVENT_TYPES } from '../../../../infrastructure/events/domain-events';

/**
 * Owns the outbox writes for `PAYMENT_CAPTURED`/`PAYMENT_FAILED`/
 * `PAYMENT_REFUNDED` (ADR 0026) — one row write + one event write per
 * `$transaction`, mirroring `PrismaOrderRepository`'s established pattern.
 * `AUTHORIZATION` transactions write no event (unused this epic).
 */
@Injectable()
export class PrismaPaymentTransactionRepository implements PaymentTransactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OUTBOX_REPOSITORY) private readonly outbox: OutboxRepository,
  ) {}

  async create(data: CreatePaymentTransactionData): Promise<PaymentTransaction> {
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentTransaction.create({
        data: {
          storeId: data.storeId,
          paymentSessionId: data.paymentSessionId ?? null,
          orderId: data.orderId ?? null,
          provider: data.provider,
          type: data.type,
          status: data.status,
          amount: data.amount,
          currencyCode: data.currencyCode,
          providerReference: data.providerReference ?? null,
          failureReason: data.failureReason ?? null,
        },
      });

      if (data.type === PAYMENT_TRANSACTION_TYPE.CAPTURE && created.orderId) {
        const order = await tx.order.findUnique({ where: { id: created.orderId } });
        if (order) {
          await this.outbox.writeInTransaction(tx, {
            storeId: data.storeId,
            eventType: EVENT_TYPES.PAYMENT_CAPTURED,
            aggregateId: created.id,
            aggregateType: 'PaymentTransaction',
            payload: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerEmail: order.customerEmailSnapshot,
              amount: Number(created.amount),
              currencyCode: created.currencyCode,
              provider: created.provider,
            },
          });
        }
      } else if (data.type === PAYMENT_TRANSACTION_TYPE.FAILURE) {
        let customerEmail: string | null = null;
        if (created.paymentSessionId) {
          const session = await tx.paymentSession.findUnique({ where: { id: created.paymentSessionId } });
          const snapshot = session?.pendingOrderSnapshot as { customerEmailSnapshot?: string } | undefined;
          customerEmail = snapshot?.customerEmailSnapshot ?? null;
        }
        await this.outbox.writeInTransaction(tx, {
          storeId: data.storeId,
          eventType: EVENT_TYPES.PAYMENT_FAILED,
          aggregateId: created.id,
          aggregateType: 'PaymentTransaction',
          payload: {
            paymentSessionId: created.paymentSessionId ?? '',
            customerEmail,
            amount: Number(created.amount),
            currencyCode: created.currencyCode,
            reason: created.failureReason,
          },
        });
      } else if (data.type === PAYMENT_TRANSACTION_TYPE.REFUND && created.orderId) {
        const order = await tx.order.findUnique({ where: { id: created.orderId } });
        if (order) {
          await this.outbox.writeInTransaction(tx, {
            storeId: data.storeId,
            eventType: EVENT_TYPES.PAYMENT_REFUNDED,
            aggregateId: created.id,
            aggregateType: 'PaymentTransaction',
            payload: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerEmail: order.customerEmailSnapshot,
              amount: Number(created.amount),
              currencyCode: created.currencyCode,
            },
          });
        }
      }

      return created;
    });

    return PaymentTransactionMapper.toDomain(record);
  }

  async listByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const records = await this.prisma.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(PaymentTransactionMapper.toDomain);
  }
}
