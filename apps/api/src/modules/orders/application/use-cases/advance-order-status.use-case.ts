import { Inject, Injectable } from '@nestjs/common';
import type { ActorRef } from '@za/types';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { ORDER_STATUS, type OrderStatusValue } from '../../domain/constants/order-status.constants';
import { UseCancelOrderUseCaseError } from '../../domain/errors/order.errors';

export interface AdvanceOrderStatusInput {
  orderId: string;
  status: OrderStatusValue;
  note?: string | null;
  actor: ActorRef;
}

/**
 * The normal fulfillment path — Confirmed → Preparing → Packed → Shipped
 * → Delivered → Returned — plus any other non-cancel transition. The
 * repository validates legality via `OrderPolicy` and atomically writes
 * the new status + a timeline row. `CANCELLED` is deliberately rejected
 * here — cancelling has stock side-effects (release or restock) that
 * only `CancelOrderUseCase` performs.
 */
@Injectable()
export class AdvanceOrderStatusUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: AdvanceOrderStatusInput): Promise<Order> {
    if (input.status === ORDER_STATUS.CANCELLED) {
      throw new UseCancelOrderUseCaseError();
    }
    return this.orders.changeStatus(input.orderId, input.status, input.note ?? null, input.actor);
  }
}
