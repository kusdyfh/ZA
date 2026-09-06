import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { Refund } from '../../domain/entities/refund.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../orders/domain/repositories/order.repository';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { PAYMENT_METHOD } from '../../../orders/domain/constants/payment-method.constants';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { REFUND_REPOSITORY, type RefundRepository } from '../../domain/repositories/refund.repository';
import { REFUND_METHOD, REFUND_STATUS } from '../../domain/constants/refund-status.constants';
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from '../../domain/repositories/payment-transaction.repository';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { PAYMENT_PROVIDER_REGISTRY, type PaymentProviderRegistry } from '../../domain/ports/payment-provider.port';
import { PaymentPolicy } from '../../domain/policies/payment-policy';
import { OrderNotFoundError } from '../../../orders/domain/errors/order.errors';

export interface IssueRefundInput {
  orderId: string;
  amount: number;
  reason: string;
  actor: ActorRef;
}

/**
 * `PAYMENTS_MANAGE`-guarded, issue-and-final (ADR 0026 — the two-step
 * request→approve workflow is disclosed future work). COD refunds have no
 * electronic transaction to reverse (`docs/product/12-PAYMENTS.md`) — they
 * record as `STORE_CREDIT`, `requiresManualFollowUp: true`, for staff to
 * settle out of band. CARD refunds call the Stripe provider directly.
 */
@Injectable()
export class IssueRefundUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(REFUND_REPOSITORY) private readonly refunds: RefundRepository,
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly paymentTransactions: PaymentTransactionRepository,
    @Inject(PAYMENT_PROVIDER_REGISTRY) private readonly providers: PaymentProviderRegistry,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: IssueRefundInput): Promise<Refund> {
    PaymentPolicy.assertReasonProvided(input.reason);

    const storeId = await this.storeContext.getCurrentStoreId();
    const order = await this.orders.findById(storeId, input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    PaymentPolicy.assertRefundable(input.orderId, order.status);

    const alreadyRefunded = await this.refunds.sumCompletedByOrderId(input.orderId);
    PaymentPolicy.assertAmountWithinRemaining(input.amount, order.total, alreadyRefunded);

    const isCod = order.paymentMethod === PAYMENT_METHOD.COD;
    let providerReference: string | null = null;
    let requiresManualFollowUp = true;

    if (!isCod) {
      const provider = this.providers.get(PAYMENT_PROVIDER.STRIPE);
      if (provider) {
        const transactions = await this.paymentTransactions.listByOrderId(input.orderId);
        const capture = transactions.find((tx) => tx.type === PAYMENT_TRANSACTION_TYPE.CAPTURE && tx.providerReference);
        if (capture?.providerReference) {
          const result = await provider.refund({
            providerReference: capture.providerReference,
            amount: input.amount,
            currencyCode: order.currencyCode,
          });
          providerReference = result.providerReference;
          requiresManualFollowUp = result.requiresManualFollowUp;
        }
      }
    }

    const transaction = await this.paymentTransactions.create({
      storeId,
      orderId: order.id,
      provider: isCod ? PAYMENT_PROVIDER.COD : PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.REFUND,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: input.amount,
      currencyCode: order.currencyCode,
      providerReference,
    });

    const refund = await this.refunds.create({
      storeId,
      orderId: order.id,
      paymentTransactionId: transaction.id,
      amount: input.amount,
      reason: input.reason,
      method: isCod ? REFUND_METHOD.STORE_CREDIT : REFUND_METHOD.STRIPE,
      status: requiresManualFollowUp ? REFUND_STATUS.PENDING : REFUND_STATUS.COMPLETED,
      requestedBy: input.actor,
      completedAt: requiresManualFollowUp ? null : new Date(),
    });

    const cumulativeRefunded = alreadyRefunded + input.amount;
    const newPaymentStatus = PaymentPolicy.resolvePaymentStatusAfterRefund(order.total, cumulativeRefunded);
    await this.orders.updatePaymentStatus(
      order.id,
      newPaymentStatus === 'REFUNDED' ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED,
      `Refund issued: ${input.reason}`,
      input.actor,
    );

    return refund;
  }
}
