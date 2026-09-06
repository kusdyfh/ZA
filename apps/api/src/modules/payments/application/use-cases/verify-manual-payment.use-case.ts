import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { Order } from '../../../orders/domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../orders/domain/repositories/order.repository';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from '../../domain/repositories/payment-transaction.repository';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { OrderNotFoundError } from '../../../orders/domain/errors/order.errors';

export interface VerifyManualPaymentInput {
  orderId: string;
  actor: ActorRef;
}

/**
 * "Manual Payment Verification" (ADR 0026) — the COD cash-collection
 * confirmation: `AWAITING_COLLECTION` -> `PAID`. Staff-driven, no order
 * status transition required (the order may already be `DELIVERED` or
 * still `SHIPPED` when cash is actually handed over) — uses
 * `OrderRepository.updatePaymentStatus`, not `changeStatus`.
 */
@Injectable()
export class VerifyManualPaymentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly paymentTransactions: PaymentTransactionRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: VerifyManualPaymentInput): Promise<Order> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const existing = await this.orders.findById(storeId, input.orderId);
    if (!existing) {
      throw new OrderNotFoundError(input.orderId);
    }

    const order = await this.orders.updatePaymentStatus(
      input.orderId,
      PAYMENT_STATUS.PAID,
      'Cash on Delivery payment confirmed collected.',
      input.actor,
    );

    await this.paymentTransactions.create({
      storeId,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.COD,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: order.total,
      currencyCode: order.currencyCode,
    });

    return order;
  }
}
