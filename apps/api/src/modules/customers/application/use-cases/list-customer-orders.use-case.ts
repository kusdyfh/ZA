import { Inject, Injectable } from '@nestjs/common';
import type { Order } from '../../../orders/domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../../orders/domain/repositories/order.repository';

export interface ListCustomerOrdersInput {
  customerId: string;
}

/**
 * Order history — shared by the customer's own view and staff's support
 * lookup (docs/product/02-CUSTOMERS.md permissions: Manager/Sales/
 * Customer Support may view). Reuses OrdersModule's ORDER_REPOSITORY
 * directly ("reuse Orders where appropriate").
 */
@Injectable()
export class ListCustomerOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: ListCustomerOrdersInput): Promise<Order[]> {
    return this.orders.listByCustomerId(input.customerId);
  }
}
