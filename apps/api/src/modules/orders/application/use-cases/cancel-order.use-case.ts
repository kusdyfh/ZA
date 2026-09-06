import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { ORDER_STATUS } from '../../domain/constants/order-status.constants';
import { OrderPolicy } from '../../domain/policies/order-policy';
import { OrderNotFoundError } from '../../domain/errors/order.errors';
import { GetStockReservationUseCase } from '../../../inventory/application/use-cases/get-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from '../../../inventory/application/use-cases/release-stock-reservation.use-case';
import { ProcessReturnUseCase } from '../../../inventory/application/use-cases/process-return.use-case';
import { STOCK_RESERVATION_STATUS } from '../../../inventory/domain/constants/stock-reservation-status.constants';
import { RETURN_DISPOSITION } from '../../../inventory/domain/constants/return-disposition.constants';

export interface CancelOrderInput {
  orderId: string;
  reason: string;
  actor: ActorRef;
}

/**
 * Per docs/v2/adr/0015 §4: each `OrderItem`'s reservation is either still
 * `ACTIVE` (order never confirmed — release it, no stock movement) or
 * already `CONFIRMED` (stock was decremented via a SALE movement —
 * restock it via `ProcessReturnUseCase`'s RESELLABLE path, the same
 * mechanism a customer return uses, since the physical effect is
 * identical). `RELEASED`/`EXPIRED` reservations are left alone
 * (idempotent — already handled).
 */
@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly storeContext: StoreContext,
    private readonly getStockReservation: GetStockReservationUseCase,
    private readonly releaseStockReservation: ReleaseStockReservationUseCase,
    private readonly processReturn: ProcessReturnUseCase,
  ) {}

  async execute(input: CancelOrderInput): Promise<Order> {
    OrderPolicy.assertCancelReasonProvided(input.reason);

    const storeId = await this.storeContext.getCurrentStoreId();
    const order = await this.orders.findById(storeId, input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    OrderPolicy.assertValidTransition(order.status, ORDER_STATUS.CANCELLED);

    for (const item of order.items) {
      const reservation = await this.getStockReservation.execute({ reservationId: item.stockReservationId });

      if (reservation.status === STOCK_RESERVATION_STATUS.ACTIVE) {
        await this.releaseStockReservation.execute({ reservationId: item.stockReservationId });
      } else if (reservation.status === STOCK_RESERVATION_STATUS.CONFIRMED) {
        await this.processReturn.execute({
          variantId: item.variantId ?? reservation.variantId,
          warehouseId: reservation.warehouseId,
          quantity: item.quantity,
          disposition: RETURN_DISPOSITION.RESELLABLE,
          note: `Restocked: order ${order.orderNumber} cancelled (${input.reason}).`,
          actor: input.actor,
        });
      }
    }

    return this.orders.changeStatus(
      order.id,
      ORDER_STATUS.CANCELLED,
      `Cancelled: ${input.reason}`,
      input.actor,
      { cancelReason: input.reason },
    );
  }
}
