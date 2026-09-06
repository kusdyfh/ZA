import { Inject, Injectable } from '@nestjs/common';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { OrderNotFoundError } from '../../domain/errors/order.errors';

export interface GetOrderInput {
  orderId: string;
}

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly storeContext: StoreContext,
  ) {}

  async execute(input: GetOrderInput): Promise<Order> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const order = await this.orders.findById(storeId, input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }
    return order;
  }
}
