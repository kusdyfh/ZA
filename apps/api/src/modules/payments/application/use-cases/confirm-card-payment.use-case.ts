import { Inject, Injectable, Logger } from '@nestjs/common';
import { ActorType } from '@za/types';
import { Order } from '../../../orders/domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository, type CreateOrderItemData } from '../../../orders/domain/repositories/order.repository';
import { ORDER_STATUS } from '../../../orders/domain/constants/order-status.constants';
import { PAYMENT_STATUS } from '../../../orders/domain/constants/payment-status.constants';
import { ConfirmStockReservationUseCase } from '../../../inventory/application/use-cases/confirm-stock-reservation.use-case';
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
import { PaymentSessionNotFoundError, PaymentSessionNotPendingError } from '../../domain/errors/payment.errors';
import type { PendingOrderSnapshot } from '../../domain/entities/pending-order-snapshot';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from '../../../shipping/domain/repositories/shipment.repository';

const SYSTEM_ACTOR = { actorId: null, actorType: ActorType.SYSTEM };

export interface ConfirmCardPaymentInput {
  providerSessionId: string;
  providerReference: string | null;
}

/**
 * The webhook handler for a successful Stripe Checkout Session (ADR 0026)
 * — the one place a card `Order` is ever created. **Idempotent**: a
 * duplicate Stripe retry finds the session already `SUCCEEDED` and is a
 * no-op, never a double-order. Materializes `Order`/`OrderItem` from
 * `pendingOrderSnapshot` at `status: CONFIRMED` directly (not `PENDING` →
 * `CONFIRMED` — per docs/product/07-ORDERS.md, "a card order effectively
 * starts at Confirmed"), then confirms every reservation the snapshot
 * lists. If order creation throws *after* Stripe has already captured
 * payment, the caller (the webhook controller) is responsible for
 * `docs/product/07-ORDERS.md`'s "must never leave a customer charged with
 * no order" reconciliation path — this use-case only creates or throws,
 * it never partially commits.
 */
@Injectable()
export class ConfirmCardPaymentUseCase {
  private readonly logger = new Logger(ConfirmCardPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_SESSION_REPOSITORY) private readonly paymentSessions: PaymentSessionRepository,
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly paymentTransactions: PaymentTransactionRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
    private readonly confirmStockReservation: ConfirmStockReservationUseCase,
  ) {}

  async execute(input: ConfirmCardPaymentInput): Promise<Order> {
    const session = await this.paymentSessions.findByProviderSessionId(input.providerSessionId);
    if (!session) {
      throw new PaymentSessionNotFoundError(input.providerSessionId);
    }

    if (session.status !== 'PENDING') {
      if (session.status === 'SUCCEEDED' && session.orderId) {
        this.logger.log(`Payment session ${session.id} already succeeded — idempotent no-op.`);
        const existing = await this.orders.findById(session.storeId, session.orderId);
        if (existing) {
          return existing;
        }
      }
      throw new PaymentSessionNotPendingError(session.id, session.status);
    }

    const snapshot = session.pendingOrderSnapshot as PendingOrderSnapshot;

    const items: CreateOrderItemData[] = snapshot.items;
    let order = await this.orders.create({
      storeId: snapshot.storeId,
      orderNumber: snapshot.orderNumber,
      customerNameSnapshot: snapshot.customerNameSnapshot,
      customerEmailSnapshot: snapshot.customerEmailSnapshot,
      customerPhoneSnapshot: snapshot.customerPhoneSnapshot,
      shippingFullName: snapshot.shippingFullName,
      shippingPhone: snapshot.shippingPhone,
      shippingLine1: snapshot.shippingLine1,
      shippingLine2: snapshot.shippingLine2,
      shippingCity: snapshot.shippingCity,
      shippingGovernorate: snapshot.shippingGovernorate,
      shippingCountry: snapshot.shippingCountry,
      shippingMethodId: snapshot.shippingMethodId,
      subtotal: snapshot.subtotal,
      discountTotal: snapshot.discountTotal,
      shippingFee: snapshot.shippingFee,
      taxTotal: snapshot.taxTotal,
      total: snapshot.total,
      currencyCode: snapshot.currencyCode,
      paymentMethod: snapshot.paymentMethod,
      items,
    });

    for (const reservationId of snapshot.reservationIds) {
      await this.confirmStockReservation.execute({ reservationId, actor: SYSTEM_ACTOR });
    }

    await this.shipments.create({
      storeId: snapshot.storeId,
      orderId: order.id,
      shippingMethodId: snapshot.shippingMethodId,
    });

    order = await this.orders.changeStatus(
      order.id,
      ORDER_STATUS.CONFIRMED,
      'Payment captured via Stripe.',
      SYSTEM_ACTOR,
      { paymentStatus: PAYMENT_STATUS.PAID },
    );

    await this.paymentTransactions.create({
      storeId: snapshot.storeId,
      paymentSessionId: session.id,
      orderId: order.id,
      provider: PAYMENT_PROVIDER.STRIPE,
      type: PAYMENT_TRANSACTION_TYPE.CAPTURE,
      status: PAYMENT_TRANSACTION_STATUS.SUCCEEDED,
      amount: snapshot.total,
      currencyCode: snapshot.currencyCode,
      providerReference: input.providerReference,
    });

    await this.paymentSessions.markSucceeded(session.id, order.id);

    return order;
  }
}
