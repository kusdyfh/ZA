import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import type { OrderStatusValue } from '../../domain/constants/order-status.constants';

export interface ListOrdersInput {
  status?: OrderStatusValue;
}

/** Admin-facing order queue — docs/product/07-ORDERS.md's "order list with status-based filtering." */
@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: ListOrdersInput = {}): Promise<Order[]> {
    const storeId = await this.storeContext.getCurrentStoreId();
    return this.orders.list(storeId, { status: input.status });
  }
}
