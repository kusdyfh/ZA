import { Inject, Injectable } from '@nestjs/common';
import { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import {
  PAYMENT_SESSION_REPOSITORY,
  type PaymentSessionRepository,
} from '../../domain/repositories/payment-session.repository';
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from '../../domain/repositories/payment-transaction.repository';
import { PAYMENT_PROVIDER } from '../../domain/constants/payment-provider.constants';
import { PAYMENT_TRANSACTION_STATUS, PAYMENT_TRANSACTION_TYPE } from '../../domain/constants/payment-transaction.constants';
import { PaymentSessionNotFoundError } from '../../domain/errors/payment.errors';
import type { PendingOrderSnapshot } from '../../domain/entities/pending-order-snapshot';

export interface FailCardPaymentInput {
  providerSessionId: string;
  reason: string | null;
}

/**
 * A failed/expired/abandoned Stripe Checkout Session (ADR 0026). Per
 * docs/product/07-ORDERS.md, "no order is ever created" for a failed card
 * attempt — this releases every reservation the snapshot listed directly
 * via `ReleaseStockReservationUseCase` (no `Order`/`CancelOrderUseCase`
 * involved, since there is no order to cancel). Idempotent — a session no
 * longer `PENDING` is a silent no-op, never a double-release.
 */
@Injectable()
export class FailCardPaymentUseCase {
  constructor(
    @Inject(PAYMENT_SESSION_REPOSITORY) private readonly paymentSessions: PaymentSessionRepository,
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly paymentTransactions: PaymentTransactionRepository,
    private readonly releaseStockReservation: ReleaseStockReservationUseCase,
  ) {}

  async execute(input: FailCardPaymentInput): Promise<void> {
    const session = await this.paymentSessions.findByProviderSessionId(input.providerSessionId);
    if (!session) {
      throw new PaymentSessionNotFoundError(input.providerSessionId);
    }
    if (session.status !== 'PENDING') {
      return;
    }

    const snapshot = session.pendingOrderSnapshot as PendingOrderSnapshot;
    for (const reservationId of snapshot.reservationIds) {
      await this.releaseStockReservation.execute({ reservationId });
    }

    await this.paymentTransactions.create({
      storeId: session.storeId,
      paymentSessionId: session.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.FAILURE,
      status: PAYMENT_TRANSACTION_STATUS.FAILED,
      amount: session.amount,
      currencyCode: session.currencyCode,
      failureReason: input.reason,
    });

    await this.paymentSessions.markFailed(session.id);
  }
}
